/** @jest-environment node */
import {
  createProject,
  applyCommand,
  setupSignature,
} from "../apps/studio/lib/domain";
import { prepareBatch } from "../apps/studio/lib/batches";
import {
  runBatch,
  reconcileBatch,
  resolveUncertainJob,
} from "../apps/studio/lib/server/execute";
import { createAdminSupabase } from "../utils/server/supabase";
import { runWithRequest, requestContext } from "../utils/server/requestContext";
import { loadProject, mergeProject } from "../apps/studio/lib/server/store";
import { seedanceHandler } from "../pages/api/seedance";
import { imagineHandler } from "../pages/api/film/imagine";
import { pollVideoJob } from "../utils/server/videoJobs";
import { assembleClips, extractFrame } from "../apps/studio/lib/server/media";
jest.mock("../utils/server/supabase", () => ({
  createAdminSupabase: jest.fn(),
}));
jest.mock("../pages/api/seedance", () => ({ seedanceHandler: jest.fn() }));
jest.mock("../pages/api/film/imagine", () => ({ imagineHandler: jest.fn() }));
jest.mock("../utils/server/videoJobs", () => ({ pollVideoJob: jest.fn() }));
jest.mock("../utils/server/mediaStore", () => ({
  checkInUrl: jest.fn(async (url) => ({ url })),
  signedMediaUrl: jest.fn(),
  storeKeyFromUrl: jest.fn(),
}));
jest.mock("../apps/studio/lib/server/media", () => ({
  assembleClips: jest.fn(),
  extractFrame: jest.fn(),
}));
jest.mock("../apps/studio/lib/server/upscale", () => ({
  submitUpscale: jest.fn(),
  pollUpscale: jest.fn(),
}));
jest.mock("../apps/studio/lib/server/validateSupplied", () => ({
  validateSupplied: jest.fn(),
  applySuppliedAssessment: jest.fn(),
}));
jest.mock("../apps/studio/lib/server/preflight", () => ({
  preflight: () => [],
}));
jest.mock("../apps/studio/lib/server/models", () => ({
  requireModel: (_id, kind) => ({
    id: kind,
    kind,
    provider: "modelark",
    references: 10,
    supportsSeed: true,
  }),
}));
jest.mock("../apps/studio/lib/server/store", () => ({
  loadProject: jest.fn(),
  mergeProject: jest.fn(),
  ownerId: () => "owner",
  fault: (message, status = 400) =>
    Object.assign(new Error(message), { status }),
}));

const catalog = [
  {
    id: "video",
    kind: "video",
    minDuration: 5,
    maxDuration: 15,
    resolutions: ["480p", "1080p"],
    references: 10,
    supportsSeed: true,
    supportsVideoReference: true,
  },
  { id: "image", kind: "image", references: 10 },
];
let project;
let revision;
let rows;
let providerRows;
let completed;
const clone = (value) => JSON.parse(JSON.stringify(value));
const context = (fn) =>
  runWithRequest(
    { user: { id: "owner" }, supabase: {}, namespace: "studio" },
    fn,
  );
const command = (type, payload) => {
  project = applyCommand(
    project,
    { type, payload },
    { id: "owner", role: "human" },
  );
  revision++;
};
function approve(batch) {
  command("batch.estimate", {
    id: batch.id,
    total: 1,
    basis: "Synthetic test estimate",
  });
  command("batch.approve", { id: batch.id });
}
function query(table) {
  const filters = [];
  let patch;
  const matching = () =>
    (table === "studio_jobs" ? rows : providerRows).filter((row) =>
      filters.every((fn) => fn(row)),
    );
  const builder = {
    select() {
      return builder;
    },
    update(value) {
      patch = value;
      return builder;
    },
    eq(key, value) {
      filters.push((row) => row[key] === value);
      return builder;
    },
    contains(key, values) {
      filters.push((row) =>
        Object.entries(values).every(
          ([name, value]) => row[key]?.[name] === value,
        ),
      );
      return builder;
    },
    async maybeSingle() {
      return { data: clone(matching()[0] || null), error: null };
    },
    then(resolve, reject) {
      try {
        const data = matching();
        if (patch) data.forEach((row) => Object.assign(row, clone(patch)));
        return Promise.resolve({ data: clone(data), error: null }).then(
          resolve,
          reject,
        );
      } catch (error) {
        return Promise.reject(error).then(resolve, reject);
      }
    },
  };
  return builder;
}
beforeEach(() => {
  jest.clearAllMocks();
  project = createProject({ title: "Execution contract" });
  revision = 1;
  rows = [];
  providerRows = [];
  completed = false;
  loadProject.mockImplementation(async () => ({
    project: clone(project),
    revision,
  }));
  mergeProject.mockImplementation(async (_id, update) => {
    project = await update(clone(project));
    revision++;
    return { project: clone(project), revision };
  });
  createAdminSupabase.mockReturnValue({
    from: query,
    rpc: async (_name, params) => {
      const claims = params.p_jobs
        .filter((job) => !rows.some((row) => row.id === job.id))
        .map((job) => ({
          id: job.id,
          batch_id: job.batchId,
          owner_id: "owner",
          project_id: project.id,
          state: "claimed",
          request: job.request,
        }));
      rows.push(...clone(claims));
      return { data: claims, error: null };
    },
  });
  seedanceHandler.mockImplementation(async (req, res) => {
    const id = `provider_${providerRows.length}`;
    providerRows.push({
      id,
      owner_id: "owner",
      provider_task_id: `task_${id}`,
      kind: "video",
      request: {
        namespace: "studio",
        studioJobId: requestContext().studioJobId,
        ...req.body,
      },
    });
    return res.json({ id: `task_${id}`, jobId: id });
  });
  imagineHandler.mockImplementation(async (_req, res) =>
    res.json({ url: "https://example.com/frame.png" }),
  );
  pollVideoJob.mockImplementation(async (job) =>
    completed
      ? {
          status: "succeeded",
          video_cache_url: `https://example.com/${job.id}.mp4`,
        }
      : { status: "running" },
  );
  assembleClips.mockImplementation(async (clips) => ({
    url: "https://example.com/assembled.mp4",
    type: "video",
    duration: clips.reduce((sum, clip) => sum + clip.out - clip.in, 0),
    clips,
  }));
  extractFrame.mockResolvedValue({
    url: "https://example.com/frame.png",
    type: "image",
  });
});
function shots(count, long = false) {
  const sceneId = project.nodes.find((node) => node.type === "scene").id;
  for (let index = 0; index < count; index++)
    command("item.add", {
      kind: "shot",
      sceneId,
      title: `Shot ${index}`,
      prompt: `Complete action ${index}.`,
      duration: index === 0 && long ? 18 : 8,
      beats:
        index === 0 && long
          ? [
              { text: "Opening complete action.", duration: 14 },
              { text: "Closing complete action.", duration: 4 },
            ]
          : [],
    });
  return sceneId;
}

test("a partial human-reviewed pilot is reused in a complete long shot; no adjacent footage is regenerated", async () =>
  context(async () => {
    const sceneId = shots(4, true);
    project = prepareBatch(
      project,
      { kind: "lookdev", model: "video" },
      catalog,
    );
    const pilotId = project.batches[0].id;
    approve(project.batches[0]);
    await runBatch(project.id, pilotId);
    expect(seedanceHandler).toHaveBeenCalledTimes(1);
    completed = true;
    await reconcileBatch(project.id, pilotId);
    expect(project.shots[0].versions).toHaveLength(0);
    expect(project.shotFragments[0]).toMatchObject({
      duration: 14,
      originKind: "lookdev",
    });
    project = prepareBatch(
      project,
      { kind: "production", model: "video" },
      catalog,
    );
    const blockedId = project.batches[0].id;
    approve(project.batches[0]);
    await expect(runBatch(project.id, blockedId)).rejects.toThrow(
      "No approved jobs",
    );
    command("lookdev.approve", { batchId: pilotId });
    // Replan after human pilot approval so the usable fragment is deliberately reused.
    project = prepareBatch(
      project,
      { kind: "production", model: "video" },
      catalog,
    );
    const production = project.batches[0];
    approve(production);
    expect(production.jobs[0].parts[0]).toMatchObject({ beat: 1, duration: 4 });
    expect(production.jobs[0].continuationSource).toBeTruthy();
    expect(
      production.jobs
        .flatMap((job) => job.parts)
        .some((part) => part.shotId === project.shots[0].id && part.beat === 0),
    ).toBe(false);
    await runBatch(project.id, production.id);
    expect(project.shots[0].versions).toHaveLength(1);
    expect(project.shots[0].versions[0].media.duration).toBe(18);
    expect(project.shots[0].versions[0].prompts).toHaveLength(2);
    expect(project.shots[0].versions[0].review).toBe("pending");
    expect(project.lookdev[0].signature).toBe(setupSignature(project, sceneId));
    expect(extractFrame).toHaveBeenCalledWith(expect.anything(), 13.9);
  }));

test("two concurrent run requests cannot purchase the same planned job twice", async () =>
  context(async () => {
    shots(1);
    project = prepareBatch(
      project,
      { kind: "production", model: "video" },
      catalog,
    );
    const batch = project.batches[0];
    approve(batch);
    await Promise.all([
      runBatch(project.id, batch.id),
      runBatch(project.id, batch.id),
    ]);
    expect(seedanceHandler).toHaveBeenCalledTimes(1);
    expect(rows).toHaveLength(1);
  }));

test("ambiguous provider submission stays uncertain and a refresh never retries the paid call", async () =>
  context(async () => {
    shots(1);
    project = prepareBatch(
      project,
      { kind: "production", model: "video" },
      catalog,
    );
    const batch = project.batches[0];
    approve(batch);
    seedanceHandler.mockRejectedValue(
      new Error("Network disconnected after submission"),
    );
    await runBatch(project.id, batch.id);
    expect(rows[0].state).toBe("uncertain");
    await reconcileBatch(project.id, batch.id);
    await expect(runBatch(project.id, batch.id)).rejects.toThrow(
      "No approved jobs",
    );
    expect(seedanceHandler).toHaveBeenCalledTimes(1);
  }));

test("frame revision executes the edit before its dependent video and keeps the original version", async () =>
  context(async () => {
    shots(1);
    const item = project.shots[0];
    command("version.add", {
      itemId: item.id,
      media: { url: "https://example.com/source.mp4", type: "video" },
      prompt: item.prompt,
    });
    const original = project.shots[0].selectedVersionId;
    command("version.review", {
      itemId: item.id,
      versionId: original,
      review: "revision",
      note: "Remove the red cup.",
    });
    project = prepareBatch(
      project,
      {
        kind: "revision",
        route: "frames",
        model: "video",
        imageModel: "image",
      },
      catalog,
    );
    const batch = project.batches[0];
    approve(batch);
    await runBatch(project.id, batch.id);
    expect(imagineHandler).toHaveBeenCalledTimes(1);
    expect(seedanceHandler).not.toHaveBeenCalled();
    completed = true;
    await runBatch(project.id, batch.id);
    expect(seedanceHandler).toHaveBeenCalledTimes(1);
    expect(project.shots[0].versions).toHaveLength(2);
    expect(project.shots[0].versions[1]).toMatchObject({
      review: "pending",
      parentVersionId: original,
    });
    expect(project.shots[0].selectedVersionId).toBe(original);
  }));

test("video revision submits only the requested shot range as its reference", async () =>
  context(async () => {
    shots(1);
    const item = project.shots[0];
    command("version.add", {
      itemId: item.id,
      media: {
        url: "https://example.com/shared-segment.mp4",
        type: "video",
        in: 3,
        out: 11,
      },
      prompt: "Original exact prompt",
    });
    command("version.review", {
      itemId: item.id,
      versionId: project.shots[0].selectedVersionId,
      review: "revision",
      note: "Remove cup",
    });
    project = prepareBatch(
      project,
      { kind: "revision", route: "video-edit", model: "video" },
      catalog,
    );
    const batch = project.batches[0];
    approve(batch);
    await runBatch(project.id, batch.id);
    expect(assembleClips).toHaveBeenCalledWith([
      { url: "https://example.com/shared-segment.mp4", in: 3, out: 11 },
    ]);
    expect(seedanceHandler.mock.calls[0][0].body.content).toContainEqual({
      type: "video_url",
      role: "reference_video",
      video_url: { url: "https://example.com/assembled.mp4" },
    });
  }));

test("manual resolution records a provider check and still requires a new batch approval", async () =>
  context(async () => {
    shots(1);
    project = prepareBatch(
      project,
      { kind: "production", model: "video" },
      catalog,
    );
    const batch = project.batches[0];
    approve(batch);
    seedanceHandler.mockRejectedValueOnce(
      new Error("Submission result unknown"),
    );
    await runBatch(project.id, batch.id);
    const jobId = rows[0].id;
    await expect(
      resolveUncertainJob(project.id, batch.id, jobId, {
        confirmedStopped: false,
        note: "No provider task exists.",
      }),
    ).rejects.toThrow("Confirm");
    await resolveUncertainJob(project.id, batch.id, jobId, {
      confirmedStopped: true,
      note: "Provider dashboard checked: no live task remains.",
    });
    expect(rows[0].state).toBe("failed");
    expect(
      project.events.some(
        (event) => event.kind === "job.resolved" && event.role === "human",
      ),
    ).toBe(true);
    project = prepareBatch(
      project,
      { kind: "production", model: "video" },
      catalog,
    );
    await expect(runBatch(project.id, project.batches[0].id)).rejects.toThrow(
      "No approved jobs",
    );
    expect(seedanceHandler).toHaveBeenCalledTimes(1);
  }));
