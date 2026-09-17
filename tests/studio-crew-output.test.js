/** @jest-environment node */
import {
  outputAssembly,
  completeCrewOutput,
} from "../apps/studio/lib/server/crewOutput";
import { queryCrewContext } from "../apps/studio/lib/server/crewContext";

const context = {
  nodes: [
    { id: "sc1", type: "scene" },
    { id: "sc2", type: "scene" },
  ],
  shots: [],
  assets: [],
  documents: [],
};
const plan = {
  scope: "project",
  title: "Full preparation",
  parts: [
    { id: "shared", title: "Shared cast", sceneIds: ["sc1", "sc2"] },
    { id: "scene1", title: "First scene", sceneIds: ["sc1"] },
    { id: "scene2", title: "Second scene", sceneIds: ["sc2"] },
  ],
};
const initial = (value = plan) => ({
  prompt: "Initial complete source",
  systemPrompt: "Contract",
  result: { content: JSON.stringify({ outputPlan: value }) },
  contextStudy: null,
});
const document = (content) => ({
  key: "screenplay",
  title: "Screenplay",
  area: "scripts",
  content,
});

test("whole-film parts preserve document order and shared asset identities in one result", async () => {
  const chunks = [
    {
      id: "shared",
      proposal: {
        assets: [
          {
            id: "keeper",
            type: "character",
            title: "Keeper",
            prompt: "Reusable keeper",
          },
        ],
      },
    },
    {
      id: "scene1",
      documents: [document("INT. STATION\nFirst complete scene.")],
      proposal: {
        shots: [
          {
            id: "shot1",
            sceneId: "sc1",
            title: "Arrival",
            assetIds: ["keeper"],
          },
        ],
      },
    },
    {
      id: "scene2",
      documents: [document("EXT. RIDGE\nSecond complete scene.")],
      proposal: {
        shots: [
          {
            id: "shot2",
            sceneId: "sc2",
            title: "Departure",
            assetIds: ["keeper"],
          },
        ],
      },
    },
  ];
  const invoke = jest.fn(async (prompt) => {
    const input = JSON.parse(prompt.split("OUTPUT PART REQUEST\n")[1]);
    return {
      content: JSON.stringify({
        outputPart: chunks.find((part) => part.id === input.currentPart.id),
      }),
    };
  });
  const result = await completeCrewOutput({
    context,
    instruction: "Prepare the whole film",
    study: initial(),
    invoke,
  });
  const output = JSON.parse(result.result.content);
  expect(output.documents).toHaveLength(1);
  expect(output.documents[0].content).toBe(
    "INT. STATION\nFirst complete scene.\n\nEXT. RIDGE\nSecond complete scene.",
  );
  expect(output.proposal.shots.map((shot) => shot.assetIds)).toEqual([
    ["keeper"],
    ["keeper"],
  ]);
  expect(output.proposal.assets).toHaveLength(1);
  expect(result.contextStudy.transcript).toHaveLength(4);
  expect(result.contextStudy.outputPlan).toEqual(plan);
});

test("omitted scenes, repeated parts and conflicting identities cannot produce a complete batch", () => {
  expect(() =>
    outputAssembly(
      { ...plan, parts: [{ id: "one", title: "One", sceneIds: ["sc1"] }] },
      context,
    ),
  ).toThrow("omits");
  const assembly = outputAssembly(plan, context);
  assembly.accept({ id: "shared", proposal: { assets: [{ id: "keeper" }] } });
  expect(() => assembly.finish()).toThrow("incomplete");
  expect(() => assembly.accept({ id: "shared", content: "Repeated" })).toThrow(
    "repeated",
  );
  expect(() =>
    assembly.accept({ id: "scene1", proposal: { shots: [{ id: "keeper" }] } }),
  ).toThrow("redefined");
  const docs = outputAssembly(plan, context);
  docs.accept({ id: "shared", documents: [document("First section")] });
  expect(() =>
    docs.accept({
      id: "scene1",
      documents: [{ ...document("Second section"), area: "documents" }],
    }),
  ).toThrow("identity");
  expect(() =>
    docs.accept({
      id: "scene1",
      documents: [{ ...document("Second section"), revisesId: "foreign" }],
    }),
  ).toThrow("existing version");
});

test("later parts can reread exact earlier text without putting entire outputs into each request", async () => {
  const content = "Exact prior scene, with Unicode 🎬.\n".repeat(100);
  const responses = [];
  const invoke = jest.fn(async (prompt) => {
    const input = JSON.parse(prompt.split("OUTPUT PART REQUEST\n")[1]);
    responses.push(input);
    if (input.currentPart.id === "shared")
      return {
        content: JSON.stringify({
          outputPart: { id: "shared", documents: [document(content)] },
        }),
      };
    if (input.currentPart.id === "scene1" && !input.parts.length) {
      const record = input.index.completed[0].documents[0].content;
      expect(record.recordId).toBeTruthy();
      expect(prompt).not.toContain(content);
      return {
        content: JSON.stringify({
          contextRequest: {
            reads: [{ recordId: record.recordId, part: 0 }],
            notes: "Reread exact prior section.",
          },
        }),
      };
    }
    if (input.currentPart.id === "scene1")
      expect(input.parts[0].text).toBe(content);
    return {
      content: JSON.stringify({
        outputPart: { id: input.currentPart.id, content: "Finished section." },
      }),
    };
  });
  const result = await completeCrewOutput({
    context,
    instruction: "Whole film",
    study: initial(),
    invoke,
  });
  expect(responses).toHaveLength(4);
  expect(result.contextStudy.transcript[3].prompt).toContain(
    "Exact prior scene",
  );
  expect(JSON.parse(result.result.content).documents[0].content).toBe(content);
});

test("malformed and truncated parts fail instead of becoming partial script drafts", async () => {
  await expect(
    completeCrewOutput({
      context,
      instruction: "Whole film",
      study: initial(),
      invoke: async () => ({ content: '{"outputPart":' }),
    }),
  ).rejects.toThrow("incomplete or invalid");
  const assembly = outputAssembly(plan, context);
  assembly.accept({ id: "shared", documents: [document("a".repeat(499999))] });
  expect(() =>
    assembly.accept({
      id: "scene1",
      documents: [document("full next section")],
    }),
  ).toThrow("500,000");
});

test("a plan marked discussion cannot bypass full-source coverage", async () => {
  let calls = 0;
  const study = await queryCrewContext({
    context: { ...context, brief: "Complete source. ".repeat(45000) },
    instruction: "Whole film",
    systemPrompt: "Contract",
    invoke: async () => {
      calls++;
      return {
        content: JSON.stringify({
          coverageMode: "discussion",
          outputPlan: plan,
        }),
      };
    },
  });
  expect(calls).toBeGreaterThan(1);
  expect(
    study.contextStudy.coverage.every(
      (entry) => entry.readParts.length === entry.totalParts,
    ),
  ).toBe(true);
});
