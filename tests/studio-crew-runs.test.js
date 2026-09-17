/** @jest-environment node */
import { createProject, applyCommand } from "../apps/studio/lib/domain";
import { sampleProject } from "../apps/studio/lib/sample";
import {
  startCrewRun,
  advanceCrewRun,
  cancelCrewRun,
} from "../apps/studio/lib/server/crewRuns";
import { invokeHandler } from "../apps/studio/lib/server/invoke";
import { loadProject, mergeProject } from "../apps/studio/lib/server/store";
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
  loadProject: jest.fn(),
  ownerId: () => "owner",
  fault: (message, status) => Object.assign(new Error(message), { status }),
}));
let state;
let revision;
const clone = (value) => JSON.parse(JSON.stringify(value));
beforeEach(() => {
  jest.clearAllMocks();
  state = createProject();
  revision = 1;
  loadProject.mockImplementation(async () => ({
    project: clone(state),
    revision,
  }));
  // Serialized atomic commits model the store's successful CAS path. Every read
  // is a new object, so tests cannot accidentally rely on in-process state.
  mergeProject.mockImplementation(async (_id, update) => {
    state = update(clone(state));
    return { project: clone(state), revision: ++revision };
  });
});
const start = async (extra = {}) => {
  await startCrewRun(state, {
    method: "film.develop",
    model: "mock",
    instruction: "Prepare the complete deliverable",
    ...extra,
  });
  return state.crewRuns.at(-1).id;
};

test("a full source study continues beyond twelve requests without repeating calls or publishing partial output", async () => {
  state.artifacts = Array.from({ length: 14 }, (_, i) => ({
    id: `script-${i}`,
    documentArea: "scripts",
    title: `Script ${i}`,
    content: `Complete source ${i}. `.repeat(23000),
  }));
  const original = state.artifacts.map((entry) => entry.content);
  invokeHandler.mockResolvedValue({
    content: JSON.stringify({
      title: "Study",
      content: "Whole deliverable studied.",
      documents: [
        { title: "Direction", area: "documents", content: "Complete output" },
      ],
    }),
  });
  const id = await start();
  expect(invokeHandler).not.toHaveBeenCalled();
  let ticks = 0;
  while (state.crewRuns[0].state === "queued" && ticks++ < 30) {
    const previous = invokeHandler.mock.calls.length;
    await advanceCrewRun(state.id, id);
    expect(invokeHandler.mock.calls.length - previous).toBeLessThanOrEqual(1);
    if (state.crewRuns[0].state !== "completed") {
      expect(state.artifacts.some((entry) => entry.title === "Direction")).toBe(
        false,
      );
      expect(state.artifacts.at(-1).proposal).toBeUndefined();
    }
  }
  expect(ticks).toBeGreaterThan(12);
  expect(state.crewRuns[0].state).toBe("completed");
  expect(state.crewRuns[0].calls).toHaveLength(invokeHandler.mock.calls.length);
  expect(
    new Set(state.crewRuns[0].calls.map((call) => call.signature)).size,
  ).toBe(invokeHandler.mock.calls.length);
  expect(state.artifacts.slice(0, 14).map((entry) => entry.content)).toEqual(
    original,
  );
  expect(
    state.artifacts.filter((entry) => entry.title === "Direction"),
  ).toHaveLength(1);
  const reply = state.artifacts.find((entry) => entry.crewRunId === id);
  expect(
    reply.contextStudy.coverage.every(
      (entry) => !entry.required || entry.readParts.length === entry.totalParts,
    ),
  ).toBe(true);
  const calls = invokeHandler.mock.calls.length;
  await advanceCrewRun(state.id, id);
  expect(invokeHandler).toHaveBeenCalledTimes(calls);
  expect(state.batches).toEqual([]);
});

test("routing is saved and not bought again on the next request", async () => {
  invokeHandler
    .mockResolvedValueOnce({ content: '{"methods":["film.develop"]}' })
    .mockResolvedValueOnce({ content: '{"title":"Reply","content":"Saved"}' });
  const id = await start({ method: "auto" });
  await advanceCrewRun(state.id, id);
  expect(state.crewRuns[0].state).toBe("queued");
  expect(invokeHandler).toHaveBeenCalledTimes(1);
  await advanceCrewRun(state.id, id);
  expect(state.crewRuns[0].state).toBe("completed");
  expect(invokeHandler).toHaveBeenCalledTimes(2);
});

test("simultaneous workers submit once; stop during a call retains its result without publishing a proposal", async () => {
  let finish;
  invokeHandler.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const id = await start();
  const worker = advanceCrewRun(state.id, id);
  while (!finish) await new Promise((resolve) => setTimeout(resolve, 0));
  await advanceCrewRun(state.id, id);
  expect(invokeHandler).toHaveBeenCalledTimes(1);
  await cancelCrewRun(state.id, id);
  finish({
    content:
      '{"title":"Do not publish","content":"Stopped","proposal":{"assets":[]}}',
  });
  await worker;
  expect(state.crewRuns[0].state).toBe("cancelled");
  expect(state.crewRuns[0].calls[0].state).toBe("completed");
  expect(
    state.artifacts.some((entry) => entry.title === "Do not publish"),
  ).toBe(false);
  await advanceCrewRun(state.id, id);
  expect(invokeHandler).toHaveBeenCalledTimes(1);
});

test("an expired in-flight call is held for attention and never silently retried", async () => {
  const id = await start();
  state.crewRuns[0].state = "running";
  state.crewRuns[0].leaseUntil = new Date(0).toISOString();
  state.crewRuns[0].calls.push({
    state: "submitted",
    request: { prompt: "Unconfirmed request" },
  });
  await advanceCrewRun(state.id, id);
  expect(state.crewRuns[0].state).toBe("attention");
  expect(invokeHandler).not.toHaveBeenCalled();
  await expect(advanceCrewRun(state.id, "foreign-task")).rejects.toThrow(
    "does not belong",
  );
});

test("provider failure preserves earlier responses and a frozen input snapshot", async () => {
  invokeHandler
    .mockResolvedValueOnce({ content: '{"methods":["film.develop"]}' })
    .mockRejectedValueOnce(new Error("Provider unavailable"));
  const id = await start({ method: "auto" });
  const title = state.title;
  await advanceCrewRun(state.id, id);
  state.title = "A later edit";
  await advanceCrewRun(state.id, id);
  expect(state.crewRuns[0].state).toBe("attention");
  expect(state.crewRuns[0].sourceProject.title).toBe(title);
  expect(state.title).toBe("A later edit");
  expect(state.crewRuns[0].calls[0].result.content).toContain("film.develop");
  expect(state.artifacts.at(-1).proposal).toBeUndefined();
});

test("interruption after a saved response resumes without repeating that response", async () => {
  invokeHandler
    .mockResolvedValueOnce({ content: '{"methods":["film.develop"]}' })
    .mockResolvedValueOnce({
      content: '{"title":"Reply","content":"Recovered"}',
    });
  const id = await start({ method: "auto" });
  await advanceCrewRun(state.id, id);
  state.crewRuns[0].state = "running";
  state.crewRuns[0].leaseUntil = new Date(0).toISOString();
  await advanceCrewRun(state.id, id);
  expect(state.crewRuns[0].state).toBe("completed");
  expect(invokeHandler).toHaveBeenCalledTimes(2);
});

test("changed replay input pauses before another model call", async () => {
  invokeHandler.mockResolvedValueOnce({
    content: '{"methods":["film.develop"]}',
  });
  const id = await start({ method: "auto" });
  await advanceCrewRun(state.id, id);
  state.crewRuns[0].input.instruction = "Different request";
  await advanceCrewRun(state.id, id);
  expect(state.crewRuns[0].state).toBe("attention");
  expect(invokeHandler).toHaveBeenCalledTimes(1);
});

test("large multi-scene writing and prompt updates assemble after the last saved part without changing approvals", async () => {
  state = sampleProject({ extended: true });
  state.artifacts.push({
    id: "script-v1",
    documentId: "script-v1",
    documentArea: "scripts",
    number: 1,
    title: "Screenplay",
    content: "Approved original",
    review: "approved",
  });
  const scenes = state.nodes.filter((node) => node.type === "scene");
  const history = JSON.stringify(state.shots.map((shot) => shot.versions));
  const plan = {
    scope: "project",
    title: "Whole film revision",
    parts: scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      sceneIds: [scene.id],
    })),
  };
  const sections = scenes.map((scene) =>
    `${scene.title}: complete scene.\n`.repeat(800),
  );
  invokeHandler.mockImplementation(async (_handler, request) => {
    if (!request.prompt.includes("OUTPUT PART REQUEST\n"))
      return { content: JSON.stringify({ outputPlan: plan }) };
    const input = JSON.parse(request.prompt.split("OUTPUT PART REQUEST\n")[1]);
    const index = scenes.findIndex(
      (scene) => scene.id === input.currentPart.id,
    );
    return {
      content: JSON.stringify({
        outputPart: {
          id: input.currentPart.id,
          documents: [
            {
              key: "screenplay",
              title: "Screenplay",
              area: "scripts",
              revisesId: "script-v1",
              content: sections[index],
            },
          ],
          proposal: {
            updates: state.shots
              .filter((shot) => shot.sceneId === input.currentPart.id)
              .map((shot) => ({
                id: shot.id,
                previousPrompt: shot.prompt,
                prompt:
                  `${shot.title}: complete revised camera direction. `.repeat(
                    100,
                  ),
              })),
          },
        },
      }),
    };
  });
  const id = await start();
  for (let tick = 0; tick <= scenes.length; tick++) {
    const calls = invokeHandler.mock.calls.length;
    await advanceCrewRun(state.id, id);
    expect(invokeHandler.mock.calls.length - calls).toBe(1);
    if (tick < scenes.length) {
      expect(
        state.artifacts.filter((entry) => entry.documentArea === "scripts"),
      ).toHaveLength(1);
      expect(
        state.artifacts.find((entry) => entry.crewRunId === id).proposal,
      ).toBeUndefined();
    }
  }
  expect(state.crewRuns[0].state).toBe("completed");
  const reply = state.artifacts.find((entry) => entry.crewRunId === id);
  expect(reply.contextStudy.mode).toBe("partitioned");
  expect(reply.contextStudy.transcript).toHaveLength(scenes.length + 1);
  const scripts = state.artifacts.filter(
    (entry) => entry.documentArea === "scripts",
  );
  expect(scripts).toHaveLength(2);
  expect(scripts[0]).toMatchObject({
    content: "Approved original",
    review: "approved",
  });
  expect(scripts[1]).toMatchObject({
    content: sections.join("\n\n"),
    number: 2,
    review: "pending",
    revisesId: "script-v1",
  });
  expect(reply.proposal.updates).toHaveLength(34);
  expect(JSON.stringify(state.shots.map((shot) => shot.versions))).toBe(
    history,
  );
  const applied = applyCommand(state, {
    type: "artifact.apply",
    payload: { id: reply.id },
  });
  expect(
    applied.shots.every((shot) =>
      shot.prompt.includes("complete revised camera direction"),
    ),
  ).toBe(true);
  expect(JSON.stringify(applied.shots.map((shot) => shot.versions))).toBe(
    history,
  );
  expect(applied.batches).toEqual([]);
  await advanceCrewRun(state.id, id);
  expect(invokeHandler).toHaveBeenCalledTimes(scenes.length + 1);
});

test("a failed later output part retains earlier calls without publishing the partial document", async () => {
  state.nodes = [];
  invokeHandler
    .mockResolvedValueOnce({
      content: JSON.stringify({
        outputPlan: {
          scope: "project",
          title: "Two sections",
          parts: [
            { id: "a", title: "First", sceneIds: [] },
            { id: "b", title: "Second", sceneIds: [] },
          ],
        },
      }),
    })
    .mockResolvedValueOnce({
      content: JSON.stringify({
        outputPart: {
          id: "a",
          documents: [
            {
              key: "story",
              title: "Story",
              area: "scripts",
              content: "A complete first section",
            },
          ],
        },
      }),
    })
    .mockResolvedValueOnce({ content: '{"outputPart":' });
  const id = await start();
  await advanceCrewRun(state.id, id);
  await advanceCrewRun(state.id, id);
  await advanceCrewRun(state.id, id);
  expect(state.crewRuns[0].state).toBe("attention");
  expect(state.crewRuns[0].calls).toHaveLength(3);
  expect(state.crewRuns[0].calls[1].result.content).toContain(
    "A complete first section",
  );
  expect(state.artifacts).toHaveLength(1);
  expect(state.artifacts[0].documentIds).toBeUndefined();
  await advanceCrewRun(state.id, id);
  expect(invokeHandler).toHaveBeenCalledTimes(3);
});
