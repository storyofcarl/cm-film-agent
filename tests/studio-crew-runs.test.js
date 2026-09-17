/** @jest-environment node */
import { createProject } from "../apps/studio/lib/domain";
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
