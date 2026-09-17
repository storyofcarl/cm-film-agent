/** @jest-environment node */
import { createProject } from "../apps/studio/lib/domain";
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
