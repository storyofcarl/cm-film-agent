/** @jest-environment node */
import {
  createProject,
  applyCommand,
  ensureProductionIds,
} from "../apps/studio/lib/domain";
import {
  appendDocument,
  documentGroups,
  documentSource,
} from "../apps/studio/lib/documents";

test("revisions append to a stable document family without changing approved text or recorded prompts", () => {
  let project = createProject();
  project.artifacts.push({
    id: "reply",
    instruction: "Write the script",
    prompt: "Exact request",
    systemPrompt: "Exact method",
    content: "Draft saved.",
  });
  const first = appendDocument(
    project,
    { title: "Screenplay", area: "scripts", content: "A complete original." },
    { id: "draft1", sourceArtifactId: "reply", origin: "generated" },
  );
  ensureProductionIds(project);
  project = applyCommand(project, {
    type: "artifact.review",
    payload: { id: first.id, review: "approved" },
  });
  const before = structuredClone(
    project.artifacts.find((entry) => entry.id === first.id),
  );
  for (const content of [
    "A revised screenplay.",
    "An alternate branch from V1.",
  ])
    project = applyCommand(project, {
      type: "document.revise",
      payload: { id: first.id, content, review: "approved" },
    });
  const [family] = documentGroups(project, "scripts");
  expect(family.versions.map((entry) => entry.number)).toEqual([1, 2, 3]);
  expect(family.versions.map((entry) => entry.code)).toEqual([
    before.code,
    before.code,
    before.code,
  ]);
  expect(family.versions[0]).toEqual(before);
  expect(
    family.versions
      .slice(1)
      .every(
        (entry) => entry.review === "pending" && entry.revisesId === first.id,
      ),
  ).toBe(true);
  expect(documentSource(project, family.versions[0]).prompt).toBe(
    "Exact request",
  );
  expect(
    project.events.filter((event) => event.kind === "document.revised"),
  ).toHaveLength(2);
  expect(() =>
    applyCommand(
      project,
      {
        type: "document.revise",
        payload: { id: first.id, content: "Agent bypass" },
      },
      { id: "agent", role: "agent" },
    ),
  ).toThrow("Human approval");
});

test("uploaded screenplay revisions keep the original file association and cannot move into a different area", () => {
  let project = createProject();
  project.inbox = [
    {
      id: "in1",
      kind: "document",
      title: "Draft.pdf",
      area: "scripts",
      source: { url: "original-upload" },
    },
  ];
  project.artifacts.push({
    id: "original",
    sourceInboxId: "in1",
    title: "Draft.pdf",
    content: "Extracted original",
    review: "approved",
    origin: "imported",
  });
  project = applyCommand(project, {
    type: "document.revise",
    payload: { id: "original", content: "Manual revision" },
  });
  const family = documentGroups(project, "scripts")[0];
  expect(family.versions).toHaveLength(2);
  expect(family.versions[0].sourceInboxId).toBe("in1");
  expect(family.versions[1]).toMatchObject({
    origin: "manual",
    review: "pending",
    documentId: "original",
    number: 2,
  });
  expect(() =>
    appendDocument(project, {
      content: "Moved",
      area: "documents",
      revisesId: "original",
    }),
  ).toThrow("file area");
  expect(() =>
    appendDocument(project, {
      content: "Unknown",
      area: "scripts",
      revisesId: "missing",
    }),
  ).toThrow("no longer exists");
});

test("ordinary chat stays out of document homes and malformed drafts cannot silently become documents", () => {
  const project = createProject();
  project.artifacts.push({
    id: "chat",
    instruction: "Discuss",
    content: "Discussion",
  });
  expect(documentGroups(project, "documents")).toEqual([]);
  for (const content of [null, {}, "", "a".repeat(500001)])
    expect(() => appendDocument(project, { area: "scripts", content })).toThrow(
      "complete document",
    );
  expect(() =>
    appendDocument(project, {
      area: "scripts",
      content: "Draft",
      revisesId: "chat",
    }),
  ).toThrow("no longer exists");
  expect(project.artifacts).toHaveLength(1);
});
