/** @jest-environment node */
import {
  recordedReferences,
  versionSources,
} from "../apps/studio/lib/provenance";
import {
  applyCommand,
  createProject,
  ensureProductionIds,
  stable,
} from "../apps/studio/lib/domain";
import { crewNextActions } from "../apps/studio/lib/crewActions";

test("source inspection uses the exact historical jobs and resolved references, never the current asset selection", () => {
  const project = createProject();
  const item = { id: "shot", kind: "shot" };
  const version = {
    media: { url: "assembled-shot" },
    jobIds: ["pilot", "continuation"],
    prompts: [
      {
        jobId: "pilot",
        prompt: "Original pilot",
        actualPayload: {
          content: [
            {
              type: "image_url",
              image_url: { url: "original-reference" },
              role: "first_frame",
            },
          ],
          seed: 10,
        },
      },
    ],
  };
  project.batches = [
    {
      jobs: [
        {
          id: "pilot",
          request: {
            prompt: "later value",
            references: [
              { url: "original-reference", assetId: "asset", versionId: "old" },
            ],
          },
          output: { url: "full-pilot", type: "video" },
          parts: [{ shotId: "shot", start: 3, end: 7 }],
        },
        {
          id: "continuation",
          request: { prompt: "Continuation", references: [] },
          output: { url: "full-continuation", type: "video" },
        },
      ],
    },
  ];
  project.assets = [
    {
      id: "asset",
      selectedVersionId: "new",
      versions: [{ id: "new", media: { url: "new-reference" } }],
    },
  ];
  const sources = versionSources(project, item, version);
  expect(sources).toHaveLength(2);
  expect(sources[0]).toMatchObject({
    prompt: "Original pilot",
    seed: 10,
    media: { url: "full-pilot" },
    ranges: [{ in: 3, out: 7 }],
    references: [{ url: "original-reference", versionId: "old" }],
  });
  expect(
    recordedReferences(
      { content: [{ type: "video_url", video_url: { url: "resolved-trim" } }] },
      [{ url: "untrimmed" }],
    )[0].url,
  ).toBe("resolved-trim");
  expect(versionSources(project, item, { media: { url: "imported" } })).toEqual(
    [],
  );
});

test("production codes survive rename, reorder, serialization and new additions", () => {
  let project = createProject();
  const scene = project.nodes[2];
  const code = scene.code;
  project = applyCommand(project, {
    type: "node.update",
    payload: { id: scene.id, title: "New title", order: 42 },
  });
  expect(project.nodes.find((entry) => entry.id === scene.id).code).toBe(code);
  project = applyCommand(JSON.parse(JSON.stringify(project)), {
    type: "node.add",
    payload: { type: "scene", parentId: scene.parentId, title: "New scene" },
  });
  expect(project.nodes.at(-1).code).not.toBe(code);
  expect(
    ensureProductionIds(project).nodes.find((entry) => entry.id === scene.id)
      .code,
  ).toBe(code);
});

test("crew proposals apply project settings, typed assets, reference mappings and scene direction without executing jobs", () => {
  let project = createProject();
  const scene = project.nodes[2];
  project.artifacts.push({
    id: "proposal",
    proposal: {
      project: {
        brief: "A keeper receives a signal",
        settings: { draftResolution: "720p" },
        baseSignature: stable({
          title: project.title,
          brief: project.brief,
          globalStyle: project.globalStyle,
          settings: project.settings,
        }),
      },
      assets: [
        {
          id: "temp-keeper",
          title: "Keeper",
          type: "character",
          prompt: "Keeper design",
        },
      ],
      shots: [
        {
          title: "Arrival",
          sceneId: scene.id,
          prompt: "Keeper arrives",
          duration: 5,
          assetIds: ["temp-keeper"],
        },
      ],
      nodeUpdates: [
        { id: scene.id, prompt: "Quiet dawn", baseSignature: stable(scene) },
      ],
    },
  });
  project = applyCommand(project, {
    type: "artifact.apply",
    payload: { id: "proposal" },
  });
  expect(project.settings.draftResolution).toBe("720p");
  expect(project.nodes[2].prompt).toBe("Quiet dawn");
  expect(project.assets[0]).toMatchObject({
    type: "character",
    code: "AST-001",
  });
  expect(project.shots[0].assetIds).toEqual([project.assets[0].id]);
  expect(project.batches).toEqual([]);
  expect(
    crewNextActions([
      { kind: "run" },
      { kind: "approve" },
      { kind: "assets", title: "Plan assets" },
    ]),
  ).toEqual([{ kind: "assets", title: "Plan assets", reason: "" }]);
});
