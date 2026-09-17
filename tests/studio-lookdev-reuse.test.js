/** @jest-environment node */
import {
  createProject,
  applyCommand,
  lookdevReviewBlockers,
  jobBlockers,
  batchFingerprint,
  assetLookdevIsApproved,
} from "../apps/studio/lib/domain";
import { prepareBatch } from "../apps/studio/lib/batches";

const catalog = [
  { id: "image", kind: "image", provider: "mock" },
  {
    id: "video",
    kind: "video",
    minDuration: 5,
    maxDuration: 15,
    resolutions: ["480p"],
  },
];
function assets() {
  let project = createProject({ title: "Reusable looks" });
  for (const [title, assetType] of [
    ["Keeper", "character"],
    ["Station", "location"],
    ["Receiver", "prop"],
  ])
    project = applyCommand(project, {
      type: "item.add",
      payload: { kind: "asset", title, assetType, prompt: `${title} design` },
    });
  return project;
}
function existing(project, index, review = "pending") {
  const itemId = project.assets[index].id;
  project = applyCommand(project, {
    type: "version.add",
    payload: {
      itemId,
      media: {
        type: "image",
        url: `https://example.test/existing-${index}.png`,
      },
      prompt: `Original ${index} prompt`,
      model: "original-model",
    },
  });
  if (review !== "pending")
    project = applyCommand(project, {
      type: "version.review",
      payload: {
        itemId,
        versionId: project.assets[index].selectedVersionId,
        review,
      },
    });
  return project;
}
const plan = (project) =>
  prepareBatch(project, { kind: "lookdev", imageModel: "image" }, catalog);

test("existing representatives create a human review with no new jobs and keep full asset review separate", () => {
  let project = existing(existing(assets(), 0), 1, "approved");
  const versions = JSON.stringify(
    project.assets.map((asset) => asset.versions),
  );
  project = plan(project);
  const batch = project.batches[0];
  expect(batch.samples).toHaveLength(2);
  expect(batch.jobs).toEqual([]);
  expect(batch.estimate.total).toBe(0);
  expect(batch.approval).toBeUndefined();
  expect(() =>
    applyCommand(project, { type: "batch.approve", payload: { id: batch.id } }),
  ).toThrow("nonempty batch");
  expect(batch.samples[0]).toMatchObject({
    model: "original-model",
    prompt: "Original 0 prompt",
    sourceVersionId: project.assets[0].selectedVersionId,
  });
  expect(project.lookdev).toEqual([]);
  const before = prepareBatch(
    structuredClone(project),
    { kind: "assets", imageModel: "image" },
    catalog,
  );
  const blocked = before.batches[0];
  blocked.estimate.total = 1;
  blocked.approval = { fingerprint: batchFingerprint(blocked) };
  expect(jobBlockers(before, blocked, blocked.jobs[0])).toContain(
    "Approve representative asset lookdev first.",
  );
  expect(() =>
    applyCommand(
      project,
      { type: "lookdev.approve", payload: { batchId: batch.id } },
      { id: "agent", role: "agent" },
    ),
  ).toThrow("Human approval");
  project = applyCommand(project, {
    type: "lookdev.approve",
    payload: { batchId: batch.id },
  });
  expect(project.lookdev[0]).toMatchObject({
    scope: "assets",
    review: "approved",
    actor: "director",
  });
  expect(JSON.stringify(project.assets.map((asset) => asset.versions))).toBe(
    versions,
  );
  project = prepareBatch(
    project,
    { kind: "assets", imageModel: "image" },
    catalog,
  );
  expect(project.batches[0].jobs.map((job) => job.targetId)).toEqual([
    project.assets[2].id,
  ]);
  expect(project.assets[0].versions[0].review).toBe("pending");
});

test("mixed lookdev generates only a missing representative and keeps its price unknown until quoted", () => {
  let project = plan(existing(assets(), 0));
  const batch = project.batches[0];
  expect(batch.samples.map((sample) => sample.targetId)).toEqual([
    project.assets[0].id,
  ]);
  expect(batch.jobs.map((job) => job.targetId)).toEqual([project.assets[1].id]);
  expect(batch.estimate.total).toBeNull();
  expect(lookdevReviewBlockers(project, batch)).toContain(
    "A completed lookdev batch is required.",
  );
  // Synthetic completion only; no provider request is made by this test.
  batch.jobs[0].state = "succeeded";
  batch.jobs[0].output = {
    type: "image",
    url: "https://example.test/synthetic-new-location.png",
  };
  expect(lookdevReviewBlockers(project, batch)).toEqual([]);
  project = applyCommand(project, {
    type: "lookdev.approve",
    payload: { batchId: batch.id },
  });
  expect(project.lookdev).toHaveLength(1);
});

test("a flagged selected version is regenerated rather than silently replacing it with an older approved version", () => {
  let project = existing(assets(), 0, "approved");
  project = existing(project, 0, "revision");
  project = plan(project);
  expect(project.batches[0].samples).toEqual([]);
  expect(project.batches[0].jobs.map((job) => job.targetId)).toContain(
    project.assets[0].id,
  );
});

test("changed or rejected reused versions and superseded lookdev cannot approve the current setup", () => {
  const original = plan(existing(existing(assets(), 0), 1));
  const changes = [
    (p) => {
      p.assets[0].versions[0].review = "revision";
    },
    (p) => {
      p.assets[0].versions[0].media.url = "https://example.test/replaced.png";
    },
    (p) => {
      p.assets[0].prompt = "Different intent";
    },
    (p) => {
      p.assets[0].description = "Changed fallback design";
    },
    (p) => {
      p.assets[0].type = "prop";
    },
    (p) => {
      p.assets[0].selectedVersionId = "different-version";
    },
    (p) => {
      p.globalStyle = "Different style";
    },
    (p) => {
      p.batches[0].state = "superseded";
    },
  ];
  for (const change of changes) {
    const project = structuredClone(original);
    change(project);
    expect(
      lookdevReviewBlockers(project, project.batches[0]).length,
    ).toBeGreaterThan(0);
    expect(() =>
      applyCommand(project, {
        type: "lookdev.approve",
        payload: { batchId: project.batches[0].id },
      }),
    ).toThrow();
  }
});

test("ordinary human approval of a reused version does not require new lookdev generation", () => {
  let project = plan(existing(existing(assets(), 0), 1));
  project = applyCommand(project, {
    type: "version.review",
    payload: {
      itemId: project.assets[0].id,
      versionId: project.assets[0].selectedVersionId,
      review: "approved",
    },
  });
  expect(lookdevReviewBlockers(project, project.batches[0])).toEqual([]);
});

test("rejecting a reused look after lookdev approval blocks remaining asset jobs until another human review", () => {
  let project = plan(existing(existing(assets(), 0), 1));
  project = applyCommand(project, {
    type: "lookdev.approve",
    payload: { batchId: project.batches[0].id },
  });
  project = prepareBatch(
    project,
    { kind: "assets", imageModel: "image" },
    catalog,
  );
  expect(assetLookdevIsApproved(project)).toBe(true);
  project = applyCommand(project, {
    type: "version.review",
    payload: {
      itemId: project.assets[0].id,
      versionId: project.assets[0].selectedVersionId,
      review: "revision",
    },
  });
  expect(assetLookdevIsApproved(project)).toBe(false);
  const batch = project.batches[0];
  expect(jobBlockers(project, batch, batch.jobs[0])).toContain(
    "Approve representative asset lookdev first.",
  );
  const updated = plan(project).batches[0];
  expect(updated.jobs.map((job) => job.targetId)).toEqual([
    project.assets[0].id,
  ]);
  expect(updated.samples.map((sample) => sample.targetId)).toEqual([
    project.assets[1].id,
  ]);
});

test("the viewed scene does not restrict the deliverable-wide production batch", () => {
  let project = createProject({ scope: "episode" });
  const first = project.nodes.find((entry) => entry.type === "scene");
  project = applyCommand(project, {
    type: "node.add",
    payload: { type: "scene", parentId: first.parentId, title: "Second scene" },
  });
  for (const scene of project.nodes.filter((entry) => entry.type === "scene"))
    project = applyCommand(project, {
      type: "item.add",
      payload: {
        kind: "shot",
        sceneId: scene.id,
        title: scene.title,
        duration: 8,
        prompt: "One complete action",
      },
    });
  project = prepareBatch(
    project,
    { kind: "production", model: "video", sceneId: first.id },
    catalog,
  );
  expect(new Set(project.batches[0].jobs.map((job) => job.sceneId))).toEqual(
    new Set(
      project.nodes
        .filter((entry) => entry.type === "scene")
        .map((scene) => scene.id),
    ),
  );
  expect(project.batches[0].scope).toBe("episode");
});
