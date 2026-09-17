/** @jest-environment node */
import {
  createProject,
  applyCommand,
  compileSegments,
  lookdevRequirement,
  setupSignature,
  jobBlockers,
  batchFingerprint,
  selectedVersion,
  sceneIsApproved,
  revisionItems,
  validateProject,
  creativePath,
  contextShots,
  effectiveAssetIds,
  inputSignature,
} from "../apps/studio/lib/domain";
import { sampleProject } from "../apps/studio/lib/sample";
import { prepareBatch } from "../apps/studio/lib/batches";
import { deliveryTimeline } from "../apps/studio/lib/delivery";
import { UPSCALERS } from "../apps/studio/lib/upscalers";

const profiles = [
  {
    id: "video",
    kind: "video",
    minDuration: 5,
    maxDuration: 15,
    resolutions: ["480p", "1080p"],
    supportsVideoReference: true,
    references: 9,
  },
  { id: "image", kind: "image", references: 10 },
];

test("container properties shape descendant requests and explicit asset overrides", () => {
  let { project, sceneId } = fixture();
  for (const title of ["Keeper", "Observatory"])
    project = applyCommand(project, {
      type: "item.add",
      payload: { kind: "asset", title },
    });
  const act = project.nodes.find((node) => node.type === "act");
  const shot = project.shots[0];
  project = applyCommand(project, {
    type: "node.update",
    payload: {
      id: act.id,
      prompt: "Use restrained motion.",
      assetIds: [project.assets[0].id],
    },
  });
  project = applyCommand(project, {
    type: "node.update",
    payload: {
      id: sceneId,
      prompt: "Cold blue light.",
      location: "Ridge station",
      time: "Dawn",
    },
  });
  expect(creativePath(project, shot.id).map((entry) => entry.id)).toEqual([
    project.id,
    ...project.nodes.map((node) => node.id),
    shot.id,
  ]);
  expect(contextShots(project, act.id)).toHaveLength(1);
  expect(effectiveAssetIds(project, shot.id)).toEqual([project.assets[0].id]);
  const result = prepareBatch(
    project,
    { kind: "production", model: "video" },
    profiles,
  );
  const job = result.batches.at(-1).jobs[0];
  expect(job.request.prompt).toContain("Use restrained motion.");
  expect(job.request.prompt).toContain("Cold blue light.");
  expect(job.request.prompt).toContain("Location: Ridge station");
  expect(job.request.references.map((ref) => ref.assetId)).toEqual([
    project.assets[0].id,
  ]);
  for (const kind of ["boards", "burst-boards"]) {
    const planned = prepareBatch(
      project,
      { kind, model: "video" },
      profiles,
    ).batches.at(-1).jobs[0];
    expect(planned.request.prompt).toContain("Cold blue light.");
    expect(planned.request.references.map((ref) => ref.assetId)).toEqual([
      project.assets[0].id,
    ]);
  }
  const changed = applyCommand(result, {
    type: "node.update",
    payload: { id: sceneId, prompt: "Warm evening light." },
  });
  expect(
    jobBlockers(
      changed,
      result.batches.find((batch) => batch.jobs.includes(job)),
      job,
    ).some((reason) => reason.includes("shared setup changed")),
  ).toBe(true);
  project = applyCommand(project, {
    type: "item.update",
    payload: { id: shot.id, assetIds: [] },
  });
  expect(effectiveAssetIds(project, shot.id)).toEqual([]);
  project = applyCommand(project, {
    type: "item.update",
    payload: { id: shot.id, assetIds: null },
  });
  expect(effectiveAssetIds(project, shot.id)).toEqual([project.assets[0].id]);
});

test("changed container direction invalidates prepared work without rewriting historical recipes", () => {
  let { project, sceneId } = fixture();
  const shot = project.shots[0];
  project = version(project, shot.id);
  const originalRecipe = project.shots[0].versions[0].prompt;
  const signature = inputSignature(project, [shot.id]);
  const setup = setupSignature(project, sceneId);
  project = applyCommand(project, {
    type: "node.update",
    payload: { id: sceneId, prompt: "New lighting direction." },
  });
  expect(inputSignature(project, [shot.id])).not.toBe(signature);
  expect(setupSignature(project, sceneId)).not.toBe(setup);
  expect(project.shots[0].versions[0].prompt).toBe(originalRecipe);
  expect(() =>
    applyCommand(project, {
      type: "node.update",
      payload: { id: sceneId, assetIds: ["missing"] },
    }),
  ).toThrow("existing, unique asset");
});

test("shot prompt edits remain effective when timed beats exist", () => {
  let { project, sceneId } = fixture();
  project = applyCommand(project, {
    type: "item.update",
    payload: {
      id: project.shots[0].id,
      prompt: "A slow dolly toward the keeper.",
      beats: [{ text: "The keeper turns.", duration: 8 }],
    },
  });
  const compiled = compileSegments(project, sceneId, { model: "video" });
  expect(compiled[0].prompt).toContain("A slow dolly toward the keeper.");
  expect(compiled[0].prompt).toContain("The keeper turns.");
});
test("public sample remains a valid editable Studio project", () => {
  const project = sampleProject();
  expect(validateProject(project)).toBe(project);
  expect(
    applyCommand(project, {
      type: "node.update",
      payload: { id: "act1", title: "Revised act", order: 0 },
    }).nodes[0].title,
  ).toBe("Revised act");
});
function fixture(count = 1) {
  let project = createProject({ title: "Contract test" });
  const sceneId = project.nodes.find((node) => node.type === "scene").id;
  for (let index = 0; index < count; index++)
    project = applyCommand(project, {
      type: "item.add",
      payload: {
        kind: "shot",
        sceneId,
        title: `Shot ${index}`,
        prompt: "One complete action.",
        duration: 8,
      },
    });
  return { project, sceneId };
}
function version(project, itemId) {
  return applyCommand(project, {
    type: "version.add",
    payload: {
      itemId,
      media: { url: "https://example.com/clip.mp4", type: "video" },
      prompt: "Recorded prompt",
    },
  });
}
function review(project, item, status) {
  return applyCommand(project, {
    type: "version.review",
    payload: {
      itemId: item.id,
      versionId: item.selectedVersionId,
      review: status,
    },
  });
}

test("approval belongs to a version; new versions cannot inherit it", () => {
  let { project } = fixture();
  const id = project.shots[0].id;
  project = version(project, id);
  project = review(project, project.shots[0], "approved");
  const approved = project.shots[0].selectedVersionId;
  project = version(project, id);
  expect(project.shots[0].versions.map((entry) => entry.review)).toEqual([
    "approved",
    "pending",
  ]);
  expect(project.shots[0].selectedVersionId).toBe(approved);
  expect(project.events.at(-2)).toMatchObject({
    kind: "version.reviewed",
    versionId: approved,
    previous: "pending",
    review: "approved",
  });
  expect(() =>
    applyCommand(
      project,
      {
        type: "version.review",
        payload: { itemId: id, versionId: approved, review: "approved" },
      },
      { id: "crew", role: "agent" },
    ),
  ).toThrow("Human approval");
});

test("lookdev defaults to more than three segments and supports whole-picture override", () => {
  let { project, sceneId } = fixture(3);
  project.segments = compileSegments(project, sceneId, { model: "video" });
  expect(lookdevRequirement(project, sceneId).required).toBe(false);
  project = applyCommand(project, {
    type: "item.add",
    payload: { kind: "shot", sceneId, duration: 8, prompt: "Complete action." },
  });
  project.segments = compileSegments(project, sceneId, { model: "video" });
  expect(lookdevRequirement(project, sceneId)).toMatchObject({
    required: true,
    count: 4,
  });
  project.settings.lookdevMode = "picture";
  expect(lookdevRequirement(project, sceneId).scope).toBe("picture");
});

test("packing preserves atomic actions, continues long shots, and trims minimum duration tails", () => {
  const { project, sceneId } = fixture();
  const shot = project.shots[0];
  shot.duration = 18;
  shot.beats = [
    { text: "Complete first sentence.", duration: 14 },
    { text: "Complete second sentence.", duration: 4 },
  ];
  const segments = compileSegments(project, sceneId, { model: "video" });
  expect(segments).toHaveLength(2);
  expect(segments[1]).toMatchObject({
    duration: 5,
    usedDuration: 4,
    padding: { head: 0, tail: 1 },
    continuationFromOrder: 0,
  });
  shot.beats[0].duration = 16;
  shot.duration = 20;
  expect(() => compileSegments(project, sceneId, { model: "video" })).toThrow(
    "indivisible action",
  );
});

test("segment compiler rejects beat timing drift rather than silently changing shot length", () => {
  const { project, sceneId } = fixture();
  project.shots[0].beats = [{ text: "Beat.", duration: 6 }];
  expect(() => compileSegments(project, sceneId, { model: "video" })).toThrow(
    "add up",
  );
});

test("changed prompts or estimates invalidate one batch approval", () => {
  let { project } = fixture();
  project = prepareBatch(
    project,
    { kind: "production", model: "video" },
    profiles,
  );
  const batch = project.batches[0];
  batch.estimate = { total: 1, basis: "Provider estimate" };
  batch.approval = { fingerprint: batchFingerprint(batch) };
  expect(jobBlockers(project, batch, batch.jobs[0])).toEqual([]);
  batch.jobs[0].request.prompt += " A new direction.";
  expect(jobBlockers(project, batch, batch.jobs[0])).toContain(
    "Approve this batch plan before execution.",
  );
});

test("failed dependencies never satisfy continuation readiness", () => {
  const { project } = fixture();
  const source = {
    id: "source",
    state: "failed",
    output: { url: "https://example.com/stale.mp4" },
    request: { model: "video", prompt: "source" },
  };
  const job = {
    id: "next",
    dependsOn: ["source"],
    request: { model: "video", prompt: "next" },
  };
  const batch = {
    kind: "production",
    jobs: [source, job],
    estimate: { total: 1 },
  };
  batch.approval = { fingerprint: batchFingerprint(batch) };
  expect(jobBlockers(project, batch, job).join(" ")).toMatch(
    "not produced usable media",
  );
});

test("scene finishing approval is invalidated by selection changes", () => {
  let { project, sceneId } = fixture();
  const id = project.shots[0].id;
  project = version(project, id);
  project = review(project, project.shots[0], "approved");
  project = applyCommand(project, {
    type: "scene.approve",
    payload: { sceneId },
  });
  expect(sceneIsApproved(project, sceneId)).toBe(true);
  project = version(project, id);
  project = applyCommand(project, {
    type: "version.select",
    payload: { itemId: id, versionId: project.shots[0].versions[1].id },
  });
  expect(sceneIsApproved(project, sceneId)).toBe(false);
  expect(selectedVersion(project.shots[0]).review).toBe("pending");
});

test("production never regenerates a good neighboring shot in a shared segment", () => {
  let { project } = fixture(2);
  project.shots.forEach((shot) => {
    shot.duration = 5;
  });
  project = version(project, project.shots[0].id);
  const preserved = project.shots[0].id;
  const planned = prepareBatch(
    project,
    { kind: "production", model: "video" },
    profiles,
  );
  expect(
    planned.batches[0].jobs.flatMap((job) =>
      job.parts.map((part) => part.shotId),
    ),
  ).not.toContain(preserved);
});

test("a submitted repair version removes its parent from the next repair batch without deleting its history", () => {
  let { project } = fixture();
  project = version(project, project.shots[0].id);
  project = review(project, project.shots[0], "revision");
  const item = project.shots[0];
  expect(revisionItems(project)).toHaveLength(1);
  project = applyCommand(project, {
    type: "version.add",
    payload: {
      itemId: item.id,
      parentVersionId: item.selectedVersionId,
      media: { url: "https://example.com/repaired.mp4", type: "video" },
    },
  });
  expect(revisionItems(project)).toHaveLength(0);
  expect(project.shots[0].versions[0].review).toBe("revision");
});

test("asset lookdev signature stays stable when the representative results arrive", () => {
  let { project } = fixture();
  project = applyCommand(project, {
    type: "item.add",
    payload: { kind: "asset", title: "Hero" },
  });
  const before = setupSignature(project, "assets");
  project = version(project, project.assets[0].id);
  expect(setupSignature(project, "assets")).toBe(before);
  project.globalStyle = "Changed global setup";
  expect(setupSignature(project, "assets")).not.toBe(before);
});

test("human cost review is required and zero is not invented for unknown pricing", () => {
  let { project } = fixture();
  project = prepareBatch(
    project,
    { kind: "production", model: "video" },
    profiles,
  );
  expect(project.batches[0].estimate.total).toBeNull();
  expect(() =>
    applyCommand(project, {
      type: "batch.approve",
      payload: { id: project.batches[0].id },
    }),
  ).toThrow("cost estimate");
});

test("scene review can assemble pending takes while delivery still requires approvals", () => {
  let { project, sceneId } = fixture();
  project = version(project, project.shots[0].id);
  expect(deliveryTimeline(project, sceneId, { review: true })).toMatchObject({
    duration: 8,
    dimensions: { width: 854, height: 480 },
  });
  expect(() => deliveryTimeline(project, sceneId)).toThrow("current assembly");
});

test("revision batches choose the selected flagged take, retaining historical flags", () => {
  let { project } = fixture();
  project = version(project, project.shots[0].id);
  project = review(project, project.shots[0], "revision");
  project = version(project, project.shots[0].id);
  project.shots[0].versions[1].review = "revision";
  expect(revisionItems(project)).toHaveLength(1);
  expect(revisionItems(project)[0].version.id).toBe(
    project.shots[0].selectedVersionId,
  );
  expect(
    project.shots[0].versions.every((entry) => entry.review === "revision"),
  ).toBe(true);
});

test("lookdev count updates after shot additions without relying on cached segments", () => {
  let { project, sceneId } = fixture(3);
  project = applyCommand(project, {
    type: "segments.compile",
    payload: {
      sceneId,
      profile: { model: "video", minDuration: 5, maxDuration: 15 },
    },
  });
  expect(lookdevRequirement(project, sceneId).required).toBe(false);
  project = applyCommand(project, {
    type: "item.add",
    payload: { kind: "shot", sceneId, duration: 8, prompt: "Complete action." },
  });
  expect(lookdevRequirement(project, sceneId)).toMatchObject({
    count: 4,
    required: true,
  });
});

test("missing media cannot be approved and a superseded batch cannot be reactivated", () => {
  let { project } = fixture();
  project = version(project, project.shots[0].id);
  project.shots[0].versions[0].media = null;
  expect(() => review(project, project.shots[0], "approved")).toThrow(
    "usable media",
  );
  project = prepareBatch(
    project,
    { kind: "production", model: "video" },
    profiles,
  );
  const old = project.batches[0];
  old.estimate.total = 1;
  project = prepareBatch(
    project,
    { kind: "production", model: "video" },
    profiles,
  );
  expect(() =>
    applyCommand(project, { type: "batch.approve", payload: { id: old.id } }),
  ).toThrow("newer batch");
});

test("changing one production job model cannot reuse a different model lookdev", () => {
  const { project } = fixture();
  const planned = prepareBatch(
    project,
    { kind: "production", model: "video" },
    profiles,
  );
  const batch = planned.batches[0];
  batch.estimate.total = 1;
  batch.jobs[0].request.model = "other-video";
  batch.approval = { fingerprint: batchFingerprint(batch) };
  expect(jobBlockers(planned, batch, batch.jobs[0]).join(" ")).toContain(
    "shared lookdev setup",
  );
});

test("finishing preserves original prompt and seed and rejects unavailable same-seed claims", () => {
  let { project, sceneId } = fixture();
  project = version(project, project.shots[0].id);
  project.shots[0].versions[0].seed = 42;
  project = review(project, project.shots[0], "approved");
  project = applyCommand(project, {
    type: "scene.approve",
    payload: { sceneId },
  });
  const catalog = [
    { ...profiles[0], supportsSeed: true },
    profiles[1],
    ...UPSCALERS,
  ];
  const clone = () => JSON.parse(JSON.stringify(project));
  const finished = prepareBatch(
    clone(),
    { kind: "finishing", finishMode: "v2v", model: "video" },
    catalog,
  );
  expect(finished.batches[0].jobs[0].request).toMatchObject({
    prompt: "Recorded prompt",
    seed: 42,
    resolution: "1080p",
  });
  project.shots[0].versions[0].seed = null;
  expect(() =>
    prepareBatch(
      clone(),
      { kind: "finishing", finishMode: "v2v", model: "video" },
      catalog,
    ),
  ).toThrow("same-seed");
  const upscaled = prepareBatch(
    clone(),
    { kind: "finishing", model: "video" },
    catalog,
  );
  expect(upscaled.batches[0].estimate.total).toBe(0.04);
  expect(upscaled.batches[0].jobs[0].sourceVersionId).toBe(
    project.shots[0].selectedVersionId,
  );
});

test("rerun can preserve the exact original prompt without appending revision direction", () => {
  let { project } = fixture();
  project = version(project, project.shots[0].id);
  project = review(project, project.shots[0], "revision");
  project.shots[0].versions[0].note = "New direction";
  const planned = prepareBatch(
    project,
    {
      kind: "revision",
      route: "rerun",
      rerunPrompt: "original",
      model: "video",
    },
    profiles,
  );
  expect(planned.batches[0].jobs[0].request.prompt).toBe("Recorded prompt");
});

test("crew proposals update future intent without rewriting approved version recipes", () => {
  let { project } = fixture();
  project = version(project, project.shots[0].id);
  project = review(project, project.shots[0], "approved");
  const shot = project.shots[0];
  project.artifacts.push({
    id: "proposal",
    proposal: {
      updates: [
        {
          id: shot.id,
          previousPrompt: shot.prompt,
          prompt: "Revised intention",
          versions: [],
        },
      ],
    },
  });
  project = applyCommand(project, {
    type: "artifact.apply",
    payload: { id: "proposal" },
  });
  expect(project.shots[0].prompt).toBe("Revised intention");
  expect(selectedVersion(project.shots[0])).toMatchObject({
    prompt: "Recorded prompt",
    review: "approved",
  });
});

test("pausing preserves approval but prevents remaining jobs until explicitly resumed", () => {
  let { project } = fixture();
  project = prepareBatch(
    project,
    { kind: "production", model: "video" },
    profiles,
  );
  let batch = project.batches[0];
  batch.estimate.total = 1;
  batch.approval = { fingerprint: batchFingerprint(batch) };
  project = applyCommand(project, {
    type: "batch.pause",
    payload: { id: batch.id },
  });
  batch = project.batches[0];
  expect(jobBlockers(project, batch, batch.jobs[0]).join(" ")).toContain(
    "paused",
  );
  project = applyCommand(project, {
    type: "batch.pause",
    payload: { id: batch.id, paused: false },
  });
  batch = project.batches[0];
  expect(jobBlockers(project, batch, batch.jobs[0])).toEqual([]);
});
