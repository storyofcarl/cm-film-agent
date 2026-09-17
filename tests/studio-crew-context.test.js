/** @jest-environment node */
import {
  createProject,
  ensureProductionIds,
  applyCommand,
} from "../apps/studio/lib/domain";
import { prepareBatch } from "../apps/studio/lib/batches";
import { documentGroups, documentSource } from "../apps/studio/lib/documents";
import { runCrew } from "../apps/studio/lib/server/crew";
import { invokeHandler } from "../apps/studio/lib/server/invoke";
import { mergeProject } from "../apps/studio/lib/server/store";
jest.mock("../pages/api/seed", () => ({ seedHandler: jest.fn() }));
jest.mock("../apps/studio/lib/server/invoke", () => ({
  invokeHandler: jest.fn(),
}));
jest.mock("../apps/studio/lib/server/models", () => ({
  requireModel: jest.fn(),
  modelCatalog: () => [{ id: "mock", label: "Mock", kind: "llm" }],
}));
jest.mock("../apps/studio/lib/server/store", () => ({
  mergeProject: jest.fn(),
  ownerId: () => "director",
  fault: (message) => new Error(message),
}));
beforeEach(() => jest.clearAllMocks());

test("oversized preparation preserves full history and does not suggest nonexistent archive or scene-filter workarounds", async () => {
  const project = createProject();
  project.artifacts.push({
    id: "long-script",
    documentArea: "scripts",
    title: "Complete screenplay history",
    content: "Full script text. ".repeat(50000),
  });
  const before = JSON.stringify(project);
  await expect(
    runCrew(project, {
      method: "film.develop",
      instruction: "Review the complete production",
      model: "mock",
    }),
  ).rejects.toThrow("current chat limit");
  expect(invokeHandler).not.toHaveBeenCalled();
  expect(mergeProject).not.toHaveBeenCalled();
  expect(JSON.stringify(project)).toBe(before);
});

test("chat sees current batch gates and reused lookdev evidence without mistaking historical review for current approval", async () => {
  let project = createProject();
  project = applyCommand(project, {
    type: "item.add",
    payload: { kind: "asset", assetType: "character", title: "Keeper" },
  });
  const assetId = project.assets[0].id;
  project = applyCommand(project, {
    type: "version.add",
    payload: {
      itemId: assetId,
      media: { type: "image", url: "https://example.test/keeper.png" },
    },
  });
  project = applyCommand(project, {
    type: "item.add",
    payload: { kind: "asset", assetType: "prop", title: "Missing receiver" },
  });
  const catalog = [{ id: "image", kind: "image" }];
  project = prepareBatch(
    project,
    { kind: "lookdev", imageModel: "image" },
    catalog,
  );
  const lookdevId = project.batches[0].id;
  project = applyCommand(project, {
    type: "lookdev.approve",
    payload: { batchId: lookdevId },
  });
  project = prepareBatch(
    project,
    { kind: "assets", imageModel: "image" },
    catalog,
  );
  project = applyCommand(project, {
    type: "version.review",
    payload: {
      itemId: assetId,
      versionId: project.assets[0].selectedVersionId,
      review: "revision",
    },
  });
  const before = JSON.stringify(project.batches);
  invokeHandler.mockResolvedValue({
    content: JSON.stringify({
      title: "Next review",
      content: "Review the changed representative look.",
    }),
  });
  mergeProject.mockImplementation(async (_id, update) => ({
    project: update(project),
  }));
  await runCrew(project, {
    method: "film.crew",
    model: "mock",
    instruction: "What is ready, and what needs my approval?",
  });
  const request = invokeHandler.mock.calls[0][1];
  const context = JSON.parse(
    request.prompt.split(
      "CURRENT PRODUCTION (complete preparation context)\n",
    )[1],
  );
  expect(context.productionState.assetLookdevApproved).toBe(false);
  expect(context.productionState.lookdevReviews[0].review).toBe("approved");
  const assets = context.productionState.batches.find(
    (batch) => batch.kind === "assets",
  );
  expect(assets.spendApproved).toBe(false);
  expect(assets.estimate.total).toBeNull();
  expect(assets.jobs[0].blockers).toContain(
    "Approve representative asset lookdev first.",
  );
  expect(assets.jobs[0].request.type).toBe("image");
  const lookdev = context.productionState.batches.find(
    (batch) => batch.id === lookdevId,
  );
  expect(lookdev.jobs).toEqual([]);
  expect(lookdev.reusedLookdevVersions[0].sourceVersionId).toBe(
    project.assets[0].selectedVersionId,
  );
  expect(lookdev.lookdevReviewBlockers.join(" ")).toContain("reused version");
  expect(context.productionState.scenes[0].segmentPlanning).toBe(
    "not-prepared",
  );
  expect(JSON.stringify(project.batches)).toBe(before);
});

test("chat files complete writing deliverables separately and retains invalid siblings for recovery", async () => {
  const project = createProject();
  const content = "INT. OBSERVATORY - NIGHT\nA long complete scene.\n".repeat(
    300,
  );
  invokeHandler.mockResolvedValue({
    content: JSON.stringify({
      title: "Writing complete",
      content: "Saved two drafts.",
      documents: [
        {
          title: "Screenplay",
          area: "scripts",
          content,
          review: "approved",
          id: "forged",
        },
        {
          title: "Director vision",
          area: "documents",
          content: "Keep the light practical.",
        },
        {
          title: "Unfiled draft",
          area: "scripts",
          content: "Must retain this text",
          revisesId: "missing",
        },
      ],
    }),
  });
  mergeProject.mockImplementation(async (_id, update) => ({
    project: ensureProductionIds(update(project)),
  }));
  const result = await runCrew(project, {
    method: "film.develop",
    instruction: "Write the screenplay and direction.",
    model: "mock",
  });
  const reply = result.project.artifacts.find((entry) => entry.instruction);
  const script = documentGroups(result.project, "scripts")[0].versions[0];
  expect(script.content).toBe(content);
  expect(script).toMatchObject({
    review: "pending",
    origin: "generated",
    number: 1,
  });
  expect(script.id).not.toBe("forged");
  expect(script.code).toMatch(/^DOC-/);
  expect(reply.documentIds).toHaveLength(2);
  expect(documentGroups(result.project, "documents")).toHaveLength(1);
  expect(documentSource(result.project, script)).toBe(reply);
  expect(reply.prompt).toContain("Write the screenplay and direction.");
  expect(reply.systemPrompt).toContain("TEMPLATE");
  expect(reply.documentWarnings).toHaveLength(1);
  expect(reply.unfiledDocuments[0].content).toBe("Must retain this text");
  expect(result.project.batches).toEqual([]);
});

test("document chat revisions use the inspected version and unsaved edits without overwriting saved work", async () => {
  const project = createProject();
  project.artifacts.push({
    id: "doc1",
    title: "Script",
    documentArea: "scripts",
    content: "Approved original",
    review: "approved",
  });
  invokeHandler.mockResolvedValue({
    content: JSON.stringify({
      title: "Revised",
      content: "Saved a revision.",
      documents: [
        {
          area: "scripts",
          content: "Revised from director edits",
          revisesId: "doc1",
        },
      ],
    }),
  });
  mergeProject.mockImplementation(async (_id, update) => ({
    project: ensureProductionIds(update(project)),
  }));
  const result = await runCrew(project, {
    method: "film.develop",
    instruction: "Polish this draft",
    model: "mock",
    activeFileArea: "scripts",
    inspectingDocumentId: "doc1",
    inspectingDocumentDraft: "Unsaved director edits",
  });
  const request = invokeHandler.mock.calls[0][1];
  const context = JSON.parse(
    request.prompt.split(
      "CURRENT PRODUCTION (complete preparation context)\n",
    )[1],
  );
  expect(context.documentInspection).toMatchObject({
    id: "doc1",
    number: 1,
    unsavedDraft: "Unsaved director edits",
  });
  expect(context.documents[0].content).toBe("Approved original");
  const versions = documentGroups(result.project, "scripts")[0].versions;
  expect(versions[0]).toMatchObject({
    content: "Approved original",
    review: "approved",
  });
  expect(versions[1]).toMatchObject({
    content: "Revised from director edits",
    revisesId: "doc1",
    review: "pending",
    number: 2,
  });
  expect(
    documentSource(result.project, versions[1]).documentInspection.id,
  ).toBe("doc1");
});

test("invalid document inspection is rejected before any paid model call", async () => {
  const project = createProject();
  project.artifacts.push({
    id: "doc1",
    title: "Script",
    documentArea: "scripts",
    content: "Draft",
  });
  for (const input of [
    { inspectingDocumentId: "missing", activeFileArea: "scripts" },
    { inspectingDocumentId: "doc1", activeFileArea: "audio" },
    { inspectingDocumentDraft: "Orphan edits" },
    {
      inspectingDocumentId: "doc1",
      activeFileArea: "scripts",
      inspectingDocumentDraft: {},
    },
  ])
    await expect(
      runCrew(project, {
        method: "auto",
        instruction: "Revise",
        model: "mock",
        ...input,
      }),
    ).rejects.toThrow();
  expect(invokeHandler).not.toHaveBeenCalled();
});

test("chat receives the inspected older version and its historical recipe without changing the production selection", async () => {
  const project = createProject();
  const longPrompt = "A complete action with deliberate lighting. ".repeat(100);
  project.shots.push({
    id: "shot",
    code: "SH-001",
    kind: "shot",
    sceneId: project.nodes[2].id,
    prompt: "Future intent, not the old recipe",
    selectedVersionId: "v2",
    versions: [
      {
        id: "v1",
        number: 1,
        prompt: longPrompt,
        review: "revision",
        note: "Soften the light",
        seed: 17,
        model: "old-model",
        jobIds: ["original-job"],
      },
      {
        id: "v2",
        number: 2,
        prompt: "New recipe",
        review: "approved",
        seed: null,
      },
    ],
  });
  project.batches.push({
    id: "old-batch",
    jobs: [
      {
        id: "original-job",
        actualPayload: {
          model: "old-model",
          seed: 17,
          resolution: "720p",
          content: [
            {
              type: "image_url",
              image_url: { url: "original-reference" },
              role: "first_frame",
            },
          ],
        },
        request: {
          prompt: longPrompt,
          references: [
            {
              url: "original-reference",
              assetId: "asset",
              versionId: "asset-v1",
            },
          ],
        },
        output: { url: "full-source-segment", type: "video" },
        parts: [{ shotId: "shot", start: 1, end: 6 }],
      },
    ],
  });
  project.inbox = [
    { id: "script", kind: "document", title: "Draft.pdf", area: "scripts" },
    { id: "audio", kind: "audio", title: "Score.wav" },
  ];
  const before = JSON.stringify(project.shots);
  invokeHandler.mockResolvedValue({
    content: JSON.stringify({
      title: "Revision plan",
      content: "Compare the versions before revising.",
    }),
  });
  mergeProject.mockImplementation(async (_id, update) => ({
    project: update(project),
  }));
  const result = await runCrew(project, {
    method: "film.direct",
    model: "mock",
    instruction: "Compare this version with V2.",
    contextId: "shot",
    inspectingVersionId: "v1",
    activeFileArea: "footage",
  });
  const request = invokeHandler.mock.calls[0][1];
  const context = JSON.parse(
    request.prompt.split(
      "CURRENT PRODUCTION (complete preparation context)\n",
    )[1],
  );
  expect(context.inspection).toMatchObject({
    itemId: "shot",
    versionId: "v1",
    versionNumber: 1,
    selectedVersionId: "v2",
  });
  expect(context.inspection.versions[0]).toMatchObject({
    prompt: longPrompt,
    seed: 17,
    note: "Soften the light",
    sources: [
      {
        prompt: longPrompt,
        media: { url: "full-source-segment" },
        settings: { resolution: "720p" },
        references: [{ url: "original-reference", versionId: "asset-v1" }],
        ranges: [{ in: 1, out: 6 }],
      },
    ],
  });
  expect(context.inspection.versions[1].seed).toBeNull();
  expect(context.inspection.versions[1].prompt).toBe("New recipe");
  expect(context.activeFileArea).toBe("footage");
  expect(context.inbox.map((entry) => entry.area)).toEqual([
    "scripts",
    "audio",
  ]);
  expect(result.project.artifacts.at(-1).inspection).toEqual({
    itemId: "shot",
    versionId: "v1",
    versionNumber: 1,
  });
  expect(JSON.stringify(project.shots)).toBe(before);
  expect(request.systemPrompt).toContain(
    "Selection is context, not a restriction",
  );
  expect(request.images).toEqual([]);
});

test("stale or mismatched version context is rejected before paid routing or reasoning", async () => {
  const project = createProject();
  project.shots.push({
    id: "shot",
    kind: "shot",
    versions: [{ id: "v1", number: 1 }],
  });
  for (const input of [
    { contextId: "shot", inspectingVersionId: "foreign-version" },
    {
      contextId: project.nodes[0].id,
      itemId: "shot",
      inspectingVersionId: "v1",
    },
    { contextId: "shot", activeFileArea: "constructor" },
  ]) {
    await expect(
      runCrew(project, {
        method: "auto",
        model: "mock",
        instruction: "Revise this",
        ...input,
      }),
    ).rejects.toThrow();
  }
  expect(invokeHandler).not.toHaveBeenCalled();
  expect(mergeProject).not.toHaveBeenCalled();
});
test("crew uses the selected act instead of stale scene and item context", async () => {
  const project = createProject({ title: "Selected context" });
  project.assetIds = [];
  const act = project.nodes[0];
  invokeHandler.mockResolvedValue({
    content: JSON.stringify({ title: "Direction", content: "Reviewed." }),
  });
  mergeProject.mockImplementation(async (_id, update) => ({
    project: update(project),
  }));
  await runCrew(project, {
    method: "film.direct",
    instruction: "Refine this act.",
    model: "mock",
    contextId: act.id,
    sceneId: project.nodes[2].id,
    itemId: "old-shot",
  });
  const request = invokeHandler.mock.calls[0][1];
  const context = JSON.parse(
    request.prompt.split(
      "CURRENT PRODUCTION (complete preparation context)\n",
    )[1],
  );
  expect(context.selectedContext).toMatchObject({ id: act.id, type: "act" });
  expect(context.selectedScene).toBeNull();
  expect(context.selectedItem).toBeNull();
  expect(context.nodes).toEqual(project.nodes);
  expect(context.id).toBe(project.id);
  expect(context.assetIds).toEqual([]);
  expect(context.propertyRules).toContain("[] means none");
  await expect(
    runCrew(project, {
      method: "film.direct",
      instruction: "Revise",
      model: "mock",
      contextId: "missing",
    }),
  ).rejects.toThrow("no longer exists");
  expect(invokeHandler).toHaveBeenCalledTimes(1);
});

test("automatic crew routing retains conversation and method provenance without exposing an execution action", async () => {
  const project = createProject({ title: "Concept to production" });
  project.artifacts.push({
    id: "earlier",
    instruction: "Use a quiet science fiction tone",
    content: "I will preserve the quiet tone.",
    method: "film.develop",
  });
  invokeHandler
    .mockResolvedValueOnce({
      content: JSON.stringify({
        methods: ["film.cast", "occ-production", "unsupported"],
      }),
    })
    .mockResolvedValueOnce({
      content: JSON.stringify({
        title: "Asset plan",
        content: "A reusable keeper and station design are needed.",
        nextActions: [
          { kind: "assets", title: "Prepare asset plan" },
          { kind: "run", title: "Buy generations" },
        ],
      }),
    });
  mergeProject.mockImplementation(async (_id, update) => ({
    project: update(project),
  }));
  const result = await runCrew(project, {
    method: "auto",
    instruction: "Plan the missing assets",
    model: "mock",
    contextId: project.id,
  });
  expect(invokeHandler).toHaveBeenCalledTimes(2);
  const request = invokeHandler.mock.calls[1][1];
  expect(request.systemPrompt).toContain("occ Methodology");
  expect(request.systemPrompt).toContain("TEMPLATE");
  const context = JSON.parse(
    request.prompt.split(
      "CURRENT PRODUCTION (complete preparation context)\n",
    )[1],
  );
  expect(context.conversation[0].instruction).toBe(
    "Use a quiet science fiction tone",
  );
  const artifact = result.project.artifacts.at(-1);
  expect(artifact.instruction).toBe("Plan the missing assets");
  expect(artifact.chosenMethods).toEqual(["film.cast", "occ-production"]);
  expect(artifact.nextActions).toHaveLength(1);
  expect(result.project.batches).toEqual([]);
});
