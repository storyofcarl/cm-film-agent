import { createAdminSupabase } from "../../../../utils/server/supabase";
import {
  requestContext,
  runWithRequest,
} from "../../../../utils/server/requestContext";
import { pollVideoJob } from "../../../../utils/server/videoJobs";
import { seedanceHandler } from "../../../../pages/api/seedance";
import { imagineHandler } from "../../../../pages/api/film/imagine";
import { checkInUrl } from "../../../../utils/server/mediaStore";
import { uid, jobBlockers, findItem, setupSignature } from "../domain";
import { invokeHandler } from "./invoke";
import { extractFrame, assembleClips } from "./media";
import { requireModel } from "./models";
import { loadProject, mergeProject, ownerId, fault } from "./store";
import { submitUpscale, pollUpscale } from "./upscale";
import { validateSupplied, applySuppliedAssessment } from "./validateSupplied";
import { preflight } from "./preflight";

const updateJob = async (id, patch) => {
  const { error } = await createAdminSupabase()
    .from("studio_jobs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", ownerId());
  if (error)
    throw fault(
      "Job state could not be saved. Refresh results before running more work.",
      503,
    );
};
export async function submitJob(job, batch) {
  const request = JSON.parse(JSON.stringify(job.request));
  if (request.type === "validation") {
    const result = await validateSupplied(job);
    return updateJob(job.id, {
      state: "succeeded",
      result,
      request: {
        ...request,
        actualPayload: {
          prompt: request.prompt,
          modelId: request.model,
          media: request.media,
        },
      },
    });
  }
  if (request.type === "upscale") {
    const taskId = await submitUpscale(request, (payload) =>
      updateJob(job.id, { request: { ...request, actualPayload: payload } }),
    );
    return updateJob(job.id, { state: "queued", result: { taskId } });
  }
  const profile = requireModel(
    request.model,
    request.type === "video" ? "video" : "image",
  );
  const references = request.references.filter((ref) => ref.url);
  for (let index = 0; index < references.length; index++) {
    const reference = references[index];
    if (
      reference.type === "video" &&
      (reference.in != null || reference.out != null)
    ) {
      const trimmed = await assembleClips([
        { url: reference.url, in: reference.in || 0, out: reference.out },
      ]);
      references[index] = { ...reference, url: trimmed.url };
    }
  }
  for (const dependency of job.frameDependencies ||
    (job.frameDependency
      ? [{ id: job.frameDependency, role: "first_frame" }]
      : [])) {
    const frame = batch.jobs.find((entry) => entry.id === dependency.id);
    references.push({
      url: frame.output.url,
      type: "image",
      role: dependency.role,
    });
  }
  if (
    job.continuation &&
    !references.some((reference) => reference.role === "first_frame")
  ) {
    const previous = batch.jobs.find(
      (entry) =>
        job.dependsOn.includes(entry.id) && entry.request.type === "video",
    );
    const last =
      previous.output.lastFrame ||
      (
        await extractFrame(
          previous.output,
          Math.max(
            0,
            Number(previous.parts?.at(-1)?.end ?? previous.request.duration) -
              0.1,
          ),
        )
      ).url;
    references.unshift({ url: last, type: "image", role: "first_frame" });
  }
  if (job.continuationSource)
    references.unshift({
      url: (
        await extractFrame(
          job.continuationSource,
          Math.max(0, job.continuationSource.out - 0.1),
        )
      ).url,
      type: "image",
      role: "first_frame",
    });
  for (const reference of references)
    if (reference.type === "video" && (reference.in || reference.out)) {
      reference.url = (
        await assembleClips([
          { url: reference.url, in: reference.in || 0, out: reference.out },
        ])
      ).url;
    }
  if (references.length > profile.references)
    throw fault(
      `This request exceeds ${profile.label}'s reference limit. Revise the plan.`,
    );
  if (
    profile.provider === "fal" &&
    references.some((reference) => reference.type !== "image")
  )
    throw fault("H3 Max cannot accept a video/audio reference.");
  if (
    profile.provider === "minimax" &&
    references.some((ref) =>
      ["first_frame", "last_frame"].includes(ref.role),
    ) &&
    references.some((ref) => ref.role === "reference_image")
  )
    throw fault(
      "MiniMax needs opening/closing frames or reference images as separate modes. Adjust this plan.",
    );
  let body;
  if (request.type === "video") {
    body = {
      model: request.model,
      content: [
        { type: "text", text: request.prompt },
        ...references.map((ref) => ({
          type: `${ref.type}_url`,
          [`${ref.type}_url`]: { url: ref.url },
          role: ref.role,
        })),
      ],
      duration: request.duration,
      resolution: request.resolution,
      ratio: request.ratio,
      generate_audio: request.audio,
    };
    if (profile.supportsSeed && Number.isInteger(request.seed))
      body.seed = request.seed;
  } else {
    if (request.type === "frame-edit")
      references.unshift(await extractFrame(request.source, request.timestamp));
    body = {
      model: request.model,
      prompt: request.prompt,
      size: request.size,
      referenceImages: references.map((ref) => ref.url),
      ...(profile.provider !== "wavespeed" && Number.isInteger(request.seed)
        ? { seed: request.seed }
        : {}),
    };
  }
  // Store the exact concrete payload before a potentially billable request.
  await updateJob(job.id, { request: { ...job.request, actualPayload: body } });
  return runWithRequest(
    { ...requestContext(), studioJobId: job.id },
    async () => {
      const result = await invokeHandler(
        request.type === "video" ? seedanceHandler : imagineHandler,
        body,
      );
      if (result.jobId)
        return updateJob(job.id, {
          state: "queued",
          provider_job_id: result.jobId,
        });
      const url = result.cacheUrl || result.url;
      if (!url)
        throw new Error("The provider response had no task or usable media.");
      const stored = await checkInUrl(url);
      return updateJob(job.id, {
        state: "succeeded",
        result: { url: stored.url, type: "image" },
      });
    },
  );
}
export async function resolveUncertainJob(
  id,
  batchId,
  jobId,
  { confirmedStopped, note },
) {
  if (confirmedStopped !== true || String(note || "").trim().length < 10)
    throw fault(
      "Confirm the provider task has stopped and record the outcome before closing an attempt.",
    );
  const { data: job, error } = await createAdminSupabase()
    .from("studio_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("project_id", id)
    .eq("owner_id", ownerId())
    .eq("batch_id", batchId)
    .maybeSingle();
  if (error || !job || !["uncertain", "claimed"].includes(job.state))
    throw fault(
      "Choose an unconfirmed attempt; refresh current results first.",
    );
  if (
    job.state === "claimed" &&
    Date.now() - Date.parse(job.created_at) < 300000
  )
    throw fault(
      "This submission may still be active. Wait five minutes and refresh before resolving it.",
    );
  await updateJob(job.id, {
    state: "failed",
    error: `Closed after director provider check: ${String(note).slice(0, 2000)}`,
  });
  await mergeProject(id, (project) => {
    project.events.push({
      id: uid("event"),
      kind: "job.resolved",
      actor: ownerId(),
      role: "human",
      at: new Date().toISOString(),
      jobId,
      batchId,
      note: String(note).slice(0, 2000),
    });
    return project;
  });
  return reconcileBatch(id, batchId);
}
export async function runBatch(id, batchId) {
  const loaded = await loadProject(id);
  const batch = loaded.project.batches.find((entry) => entry.id === batchId);
  if (!batch) throw fault("Batch not found.");
  const ready = batch.jobs
    .filter(
      (job) =>
        job.state === "planned" &&
        !jobBlockers(loaded.project, batch, job).length &&
        !preflight(job).length,
    )
    .slice(0, 4);
  if (!ready.length)
    throw fault(
      "No approved jobs are ready. Resolve the gates shown in this batch or refresh existing results.",
    );
  const { data: claims, error } = await createAdminSupabase().rpc(
    "studio_claim_jobs",
    {
      p_project: id,
      p_owner: ownerId(),
      p_revision: loaded.revision,
      p_jobs: ready.map((job) => ({
        id: job.id,
        batchId,
        request: job.request,
      })),
    },
  );
  if (error)
    throw fault(
      "The production changed before execution. Reload and review the current plan.",
      409,
    );
  // Bounded concurrency is a scheduling concern; the authorization scope remains
  // the entire deliverable batch. No automatic resubmission of uncertain jobs.
  const queue = [...claims];
  await Promise.all(
    Array.from({ length: Math.min(4, queue.length) }, async () => {
      while (queue.length) {
        const claimed = queue.shift();
        const job = batch.jobs.find((entry) => entry.id === claimed.id);
        try {
          await submitJob(job, batch);
        } catch (error) {
          await updateJob(job.id, {
            state:
              error.providerStatus >= 400 && error.providerStatus < 500
                ? "failed"
                : "uncertain",
            error: error.message,
          });
        }
      }
    }),
  );
  return reconcileBatch(id, batchId);
}
export async function reconcileBatch(id, batchId) {
  const existing = await loadProject(id);
  const existingBatch = existing.project.batches.find(
    (entry) => entry.id === batchId,
  );
  if (!existingBatch) throw fault("Batch not found.", 404);
  if (existingBatch.state === "superseded") return existing;
  const db = createAdminSupabase();
  const { data: jobs, error } = await db
    .from("studio_jobs")
    .select("*")
    .eq("project_id", id)
    .eq("owner_id", ownerId())
    .eq("batch_id", batchId);
  if (error) throw fault("Job store unavailable.", 503);
  await Promise.all(
    jobs
      .filter((job) => !["succeeded", "failed"].includes(job.state))
      .map(async (job) => {
        try {
          if (job.request.type === "upscale") {
            if (job.result?.taskId)
              await updateJob(job.id, await pollUpscale(job.result.taskId));
            return;
          }
          let query = db
            .from("film_jobs")
            .select("*")
            .eq("owner_id", ownerId());
          query = job.provider_job_id
            ? query.eq("id", job.provider_job_id)
            : query.contains("request", {
                namespace: "studio",
                studioJobId: job.id,
              });
          const { data: provider } = await query.maybeSingle();
          if (!provider) return;
          if (!provider.provider_task_id) {
            if (provider.status === "failed")
              await updateJob(job.id, {
                state: "failed",
                error:
                  provider.result?.error || "Provider rejected this request.",
              });
            return;
          }
          const result = await pollVideoJob(provider);
          const url =
            result.video_cache_url ||
            result.video_url ||
            result.cacheUrl ||
            result.url;
          const state =
            result.status === "succeeded" && url
              ? "succeeded"
              : ["failed", "cancelled"].includes(result.status)
                ? "failed"
                : "running";
          await updateJob(job.id, {
            state,
            provider_job_id: provider.id,
            result: url
              ? {
                  url,
                  type: provider.kind,
                  lastFrame:
                    result.last_frame_cache_url ||
                    result.last_frame_url ||
                    null,
                }
              : null,
            error: result.error
              ? String(result.error?.message || result.error)
              : null,
          });
        } catch (error) {
          await updateJob(job.id, {
            error: `Result check can be retried without regeneration: ${error.message}`,
          });
        }
      }),
  );
  const { data: current, error: reloadError } = await db
    .from("studio_jobs")
    .select("*")
    .eq("project_id", id)
    .eq("owner_id", ownerId())
    .eq("batch_id", batchId);
  if (reloadError) throw fault("Job store unavailable.", 503);
  const saved = await mergeProject(id, (project) => {
    const batch = project.batches.find((entry) => entry.id === batchId);
    if (!batch) return project;
    for (const state of current) {
      const job = batch.jobs.find((entry) => entry.id === state.id);
      if (!job) continue;
      job.state = state.state;
      job.output = state.result;
      job.error = state.error;
      job.actualPayload = state.request.actualPayload || null;
      if (job.request.type === "validation" && job.state === "succeeded")
        applySuppliedAssessment(project, job);
    }
    batch.state = batch.jobs.every((job) => job.state === "succeeded")
      ? "completed"
      : batch.jobs.some((job) => ["failed", "uncertain"].includes(job.state))
        ? "attention"
        : "running";
    return project;
  });
  return materializeVersions(saved.project, batchId);
}
async function materializeVersions(project, batchId) {
  const batch = project.batches.find((entry) => entry.id === batchId);
  const versions = [];
  const guides = [];
  const fragments = batch.jobs
    .filter(
      (job) => !job.guide && job.state === "succeeded" && job.parts?.length,
    )
    .flatMap((job) =>
      job.parts.map((part) => ({
        shotId: part.shotId,
        sceneId: job.sceneId,
        beat: part.beat,
        shotOffset: part.shotOffset || 0,
        duration: part.duration,
        in: part.start,
        out: part.end,
        url: job.output.url,
        jobId: job.id,
        batchId,
        originKind: batch.kind,
        setupSignature: job.setupSignature,
        shotPrompt:
          JSON.parse(job.sourceSignature || "[]").find(
            (item) => item.id === part.shotId,
          )?.prompt ?? null,
        prompt: job.request.prompt,
        actualPayload: job.actualPayload,
        sourceVersionId: job.sourceVersionId || null,
      })),
    );
  for (const job of batch.jobs.filter(
    (entry) => entry.guide && entry.state === "succeeded",
  )) {
    if (project.guides?.some((guide) => guide.jobId === job.id)) continue;
    if (job.frameMap) {
      for (const frame of job.frameMap) {
        const media = await extractFrame(job.output, frame.timestamp);
        guides.push({
          id: uid("guide"),
          kind: frame.kind === "asset" ? "design-candidate" : "board",
          title: frame.title,
          targetId: frame.targetId,
          sceneId: frame.sceneId,
          jobId: job.id,
          batchId,
          media,
          sourceVideo: job.output.url,
          timestamp: frame.timestamp,
          prompt: job.request.prompt,
          actualPayload: job.actualPayload,
          review: "pending",
          createdAt: new Date().toISOString(),
        });
      }
    } else
      guides.push({
        id: uid("guide"),
        kind: job.guide,
        title: job.title,
        targetId: job.targetId || null,
        sceneId: job.sceneId,
        jobId: job.id,
        batchId,
        media: job.output,
        prompt: job.request.prompt,
        actualPayload: job.actualPayload,
        review: "pending",
        createdAt: new Date().toISOString(),
      });
  }
  for (const item of [...project.assets, ...project.shots]) {
    if (item.versions.some((version) => version.batchId === batchId)) continue;
    const associated = batch.jobs.filter(
      (job) =>
        !job.guide &&
        job.request.type !== "validation" &&
        (job.targetId === item.id ||
          job.parts?.some((part) => part.shotId === item.id)),
    );
    if (
      !associated.length ||
      associated.some((job) => job.state !== "succeeded")
    )
      continue;
    let media;
    let recipes = associated.map((job) => ({
      jobId: job.id,
      prompt: job.request.prompt,
      actualPayload: job.actualPayload,
      references: job.request.references,
      seed: job.actualPayload?.seed ?? null,
    }));
    if (item.kind === "asset") media = associated[0].output;
    else {
      const current = fragments.filter(
        (fragment) => fragment.shotId === item.id,
      );
      const earlier =
        batch.kind === "production"
          ? (project.shotFragments || []).filter(
              (fragment) =>
                fragment.shotId === item.id &&
                fragment.originKind === "lookdev" &&
                fragment.setupSignature ===
                  setupSignature(project, item.sceneId) &&
                fragment.shotPrompt === item.prompt &&
                !current.some((entry) => entry.beat === fragment.beat),
            )
          : [];
      const parts = [...earlier, ...current].sort((a, b) => a.beat - b.beat);
      // A technical pilot can cover only the beginning of a long shot. Preserve
      // its fragments, but never create a full-shot version from incomplete media.
      if (
        Math.abs(
          parts.reduce((sum, part) => sum + part.duration, 0) - item.duration,
        ) > 0.01
      )
        continue;
      const clips = parts.map((part) => ({
        url: part.url,
        in: part.in,
        out: part.out,
      }));
      recipes = parts.map((part) => ({
        jobId: part.jobId,
        shotOffset: part.shotOffset,
        duration: part.duration,
        prompt: part.prompt,
        actualPayload: part.actualPayload,
        seed: part.actualPayload?.seed ?? null,
      }));
      media = await assembleClips(clips);
    }
    versions.push({
      itemId: item.id,
      version: {
        id: uid("version"),
        batchId,
        jobIds: [...new Set(recipes.map((recipe) => recipe.jobId))],
        createdAt: new Date().toISOString(),
        review: "pending",
        note: "",
        origin: "generated",
        media,
        prompt:
          associated[0].route === "upscale"
            ? (associated[0].request.originalPrompt ?? null)
            : [...new Set(recipes.map((recipe) => recipe.prompt))].join("\n\n"),
        prompts: recipes,
        globalStyle: associated[0].request.globalStyle ?? null,
        model: associated[0].request.model,
        seed:
          associated.length === 1
            ? (associated[0].actualPayload?.seed ?? null)
            : null,
        parentVersionId: associated[0].sourceVersionId || null,
        method: batch.kind,
      },
    });
  }
  return mergeProject(project.id, (latest) => {
    latest.shotFragments ||= [];
    for (const fragment of fragments)
      if (
        !latest.shotFragments.some(
          (entry) =>
            entry.jobId === fragment.jobId &&
            entry.shotId === fragment.shotId &&
            entry.beat === fragment.beat,
        )
      )
        latest.shotFragments.push(fragment);
    latest.guides ||= [];
    for (const guide of guides)
      if (
        !latest.guides.some(
          (entry) =>
            entry.jobId === guide.jobId &&
            entry.targetId === guide.targetId &&
            entry.timestamp === guide.timestamp,
        )
      )
        latest.guides.push(guide);
    for (const { itemId, version } of versions) {
      const item = findItem(latest, itemId);
      if (!item || item.versions.some((entry) => entry.batchId === batchId))
        continue;
      version.number = item.versions.length + 1;
      item.versions.push(version);
      if (!item.selectedVersionId) item.selectedVersionId = version.id;
      latest.events.push({
        id: uid("event"),
        kind: "version.generated",
        role: "agent",
        actor: "crew",
        at: version.createdAt,
        itemId,
        versionId: version.id,
        batchId,
      });
    }
    return latest;
  });
}
