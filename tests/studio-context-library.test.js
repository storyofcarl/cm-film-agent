/** @jest-environment node */
import {
  createCrewLibrary,
  queryCrewContext,
  CREW_CONTEXT_LIMIT,
} from "../apps/studio/lib/server/crewContext";

const parse = (prompt) =>
  JSON.parse(prompt.split("CURRENT PRODUCTION (indexed context)\n")[1]);

test("indexed text parts preserve every character and identify current, approved and historical document versions", () => {
  const text =
    "x".repeat(47999) +
    "🎬" +
    "\nINT. STATION — NIGHT\n" +
    "A complete sentence.\n".repeat(5000);
  const context = {
    id: "project",
    documents: [
      {
        id: "v1",
        documentId: "v1",
        number: 1,
        review: "approved",
        content: text,
      },
      {
        id: "v2",
        documentId: "v1",
        number: 2,
        review: "revision",
        content: "old".repeat(1000),
      },
      {
        id: "v3",
        documentId: "v1",
        number: 3,
        review: "pending",
        content: "new".repeat(1000),
      },
    ],
  };
  const before = JSON.stringify(context);
  const library = createCrewLibrary(context);
  const descriptor = library.index.documents[0].content;
  const pieces = library.read(
    descriptor.parts.map(({ part }) => ({
      recordId: descriptor.recordId,
      part,
    })),
  );
  expect(pieces.map((part) => part.text).join("")).toBe(text);
  expect(pieces[0].text.endsWith("\ud83c")).toBe(false);
  expect(pieces[1].start).toBe(pieces[0].end);
  expect(pieces[0].sha256).toBe(descriptor.sha256);
  expect(
    library.index.documents.map(
      (document) => document.content.requiredForPreparation,
    ),
  ).toEqual([true, false, true]);
  expect(library.missing()).toEqual([
    { recordId: library.index.documents[2].content.recordId, part: 0 },
  ]);
  expect(JSON.stringify(context)).toBe(before);
});

test("context reads reject missing or foreign IDs atomically without granting coverage", () => {
  const library = createCrewLibrary({ globalStyle: "light ".repeat(1000) });
  const valid = { recordId: library.index.globalStyle.recordId, part: 0 };
  for (const invalid of [
    { recordId: "other-project", part: 0 },
    { ...valid, part: -1 },
    { ...valid, part: 0.5 },
    { ...valid, part: 4 },
  ]) {
    expect(() => library.read([valid, invalid])).toThrow(
      "outside this production",
    );
    expect(library.coverage()[0].readParts).toEqual([]);
  }
  expect(() => library.read([])).toThrow();
  expect(() => library.read(Array(9).fill(valid))).toThrow();
});

test("full-deliverable preparation reads every required part before returning a proposal and preserves exact audit requests", async () => {
  const source =
    "INT. STATION - NIGHT\nA complete scene with dialogue.\n".repeat(18000);
  const context = {
    id: "film",
    selectedScene: "scene-two",
    nodes: [{ id: "scene-one" }, { id: "scene-two" }],
    documents: [{ id: "script", content: source, number: 1 }],
  };
  const delivered = [];
  const invoke = jest.fn(async (prompt, systemPrompt) => {
    expect(prompt.length + systemPrompt.length).toBeLessThanOrEqual(
      CREW_CONTEXT_LIMIT,
    );
    const indexed = parse(prompt);
    expect(indexed.production.nodes).toEqual(context.nodes);
    delivered.push(...indexed.parts);
    // A premature final response must not bypass the full-source read gate.
    return {
      content: JSON.stringify({ content: "Ready", proposal: { assets: [] } }),
      usage: { inputTokens: 2 },
    };
  });
  const result = await queryCrewContext({
    context,
    instruction: "Plan assets for the entire film",
    systemPrompt: "Method instructions",
    invoke,
  });
  expect(invoke.mock.calls.length).toBeGreaterThan(2);
  expect(delivered.map((part) => part.text).join("")).toBe(source);
  expect(
    result.contextStudy.coverage.every(
      (record) => record.readParts.length === record.totalParts,
    ),
  ).toBe(true);
  expect(result.contextStudy.transcript.map((entry) => entry.prompt)).toEqual(
    invoke.mock.calls.map(([prompt]) => prompt),
  );
  expect(result.contextStudy.transcript[0].usage).toEqual({ inputTokens: 2 });
  expect(context.documents[0].content).toBe(source);
});

test("discussion can retrieve a requested older version without treating its contents as current approved work", async () => {
  const oldText = "Old complete draft. ".repeat(43000);
  const context = {
    documents: [
      {
        id: "old",
        documentId: "old",
        number: 1,
        content: oldText,
        review: "revision",
      },
      {
        id: "new",
        documentId: "old",
        number: 2,
        content: "New version",
        review: "pending",
      },
    ],
  };
  let recordId;
  const invoke = jest.fn(async (prompt) => {
    const value = parse(prompt);
    if (!recordId) {
      recordId = value.production.documents[0].content.recordId;
      return {
        content: JSON.stringify({
          contextRequest: {
            reads: [{ recordId, part: 0 }],
            notes: "Checking the opening of V1 only.",
          },
        }),
      };
    }
    expect(value.parts[0].text).toBe(
      oldText.slice(value.parts[0].start, value.parts[0].end),
    );
    expect(value.production.documents[0].review).toBe("revision");
    return {
      content: JSON.stringify({
        content: "The old opening is available.",
        coverageMode: "discussion",
      }),
    };
  });
  const result = await queryCrewContext({
    context,
    instruction: "What does the opening of V1 say?",
    systemPrompt: "Source discipline",
    invoke,
  });
  expect(invoke).toHaveBeenCalledTimes(2);
  expect(result.contextStudy.coverage[0].readParts).toEqual([0]);
});

test("repeated reads stop at the explicit request bound without accepting incomplete preparation", async () => {
  const context = {
    documents: [{ id: "script", content: "x".repeat(800000) }],
  };
  const before = JSON.stringify(context);
  const invoke = jest.fn(async (prompt) => ({
    content: JSON.stringify({
      contextRequest: {
        reads: [
          {
            recordId: parse(prompt).production.documents[0].content.recordId,
            part: 0,
          },
        ],
        notes: "Still studying.",
      },
    }),
  }));
  await expect(
    queryCrewContext({
      context,
      instruction: "Plan the whole film",
      systemPrompt: "Method",
      invoke,
    }),
  ).rejects.toThrow("12-pass");
  expect(invoke).toHaveBeenCalledTimes(12);
  expect(JSON.stringify(context)).toBe(before);
});

test("multiple long versions retain their identities while required current and approved text is read across the full film", async () => {
  const documents = [1, 2, 3, 4].map((number) => ({
    id: `draft-${number}`,
    documentId: "draft-1",
    code: "DOC-041",
    number,
    review: number === 2 ? "approved" : "pending",
    content: `Version ${number} complete scene.\n`.repeat(14000),
  }));
  const context = {
    documents,
    selectedScene: "second",
    nodes: [
      {
        id: "first",
        code: "SC-001",
        prompt: "First scene direction. ".repeat(500),
      },
      {
        id: "second",
        code: "SC-002",
        prompt: "Second scene direction. ".repeat(500),
      },
    ],
  };
  const delivered = new Map();
  const invoke = jest.fn(async (prompt) => {
    const value = parse(prompt);
    expect(
      value.production.documents.map(({ id, number, code }) => ({
        id,
        number,
        code,
      })),
    ).toEqual(documents.map(({ id, number, code }) => ({ id, number, code })));
    for (const part of value.parts) {
      const parts = delivered.get(part.recordId) || [];
      parts[part.part] = part.text;
      delivered.set(part.recordId, parts);
    }
    return {
      content: JSON.stringify({
        coverageMode: "discussion",
        content: "Proposed full-film work",
        nextActions: [{ kind: "assets", title: "Prepare full asset batch" }],
      }),
    };
  });
  const result = await queryCrewContext({
    context,
    instruction: "Prepare assets for the film",
    systemPrompt: "No source omissions",
    invoke,
  });
  const index = parse(result.prompt).production;
  for (const position of [1, 3])
    expect(
      delivered.get(index.documents[position].content.recordId).join(""),
    ).toBe(documents[position].content);
  expect(delivered.has(index.documents[0].content.recordId)).toBe(false);
  for (let i = 0; i < 2; i++)
    expect(delivered.get(index.nodes[i].prompt.recordId).join("")).toBe(
      context.nodes[i].prompt,
    );
  expect(
    result.contextStudy.coverage
      .filter((entry) => entry.required)
      .every((entry) => entry.readParts.length === entry.totalParts),
  ).toBe(true);
});

test("a context index that cannot fit fails before a model call instead of dropping production objects", async () => {
  const context = {
    nodes: Array.from({ length: 14000 }, (_, i) => ({
      id: `scene-${i}`,
      title: "Complete title of a scene with retained metadata",
    })),
  };
  const invoke = jest.fn();
  await expect(
    queryCrewContext({
      context,
      instruction: "Plan the production",
      systemPrompt: "Method",
      invoke,
    }),
  ).rejects.toThrow("indexed production request");
  expect(invoke).not.toHaveBeenCalled();
  expect(context.nodes).toHaveLength(14000);
});
