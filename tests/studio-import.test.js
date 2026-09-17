/** @jest-environment node */
import { importManifest } from "../apps/studio/lib/server/intake";
import {
  createProject,
  applyCommand,
  ensureProductionIds,
} from "../apps/studio/lib/domain";
import { importDocuments } from "../apps/studio/lib/server/importDocuments";
import {
  appendDocument,
  documentGroups,
  documentSource,
} from "../apps/studio/lib/documents";
jest.mock("../utils/server/mediaStore", () => ({
  checkInUrl: async (url) => ({ key: "owned.png", url }),
  readStoreBytes: async () => ({
    buffer: Buffer.from("fixture"),
    contentType: "image/png",
  }),
}));
jest.mock("../apps/studio/lib/server/media", () => ({
  inspectStoredMedia: async (media) => ({ ...media, width: 512, height: 512 }),
}));

test("out-of-order portable versions keep their codes, gaps, parent links and full prompts through repeated imports", async () => {
  const project = createProject();
  const longPrompt = "Preserve the complete source direction. ".repeat(120);
  project.artifacts = [
    {
      id: "v3",
      documentId: "v1",
      documentArea: "scripts",
      code: "DOC-042",
      number: 3,
      revisesId: "v1",
      title: "Feature screenplay",
      content: "Alternate third draft",
      review: "approved",
      prompt: longPrompt,
      systemPrompt: "Recorded instructions",
    },
    {
      id: "v1",
      documentId: "v1",
      documentArea: "scripts",
      code: "DOC-042",
      number: 1,
      title: "Feature screenplay",
      content: "Original draft",
      review: "approved",
    },
  ];
  const before = JSON.stringify(project);
  let imported = ensureProductionIds((await importManifest(project)).project);
  let versions = documentGroups(imported, "scripts")[0].versions;
  expect(versions.map((entry) => entry.number)).toEqual([1, 3]);
  expect(
    versions.every(
      (entry) => entry.code === "DOC-042" && entry.review === "pending",
    ),
  ).toBe(true);
  expect(versions[1].revisesId).toBe(versions[0].id);
  expect(documentSource(imported, versions[1])).toMatchObject({
    prompt: longPrompt,
    systemPrompt: "Recorded instructions",
    supplied: true,
  });
  expect(versions[1].suppliedMetadata.importHistory[0]).toMatchObject({
    artifactId: "v3",
    code: "DOC-042",
    number: 3,
    review: "approved",
  });
  const firstImportedIds = versions.map((entry) => entry.id);
  imported = ensureProductionIds((await importManifest(imported)).project);
  versions = documentGroups(imported, "scripts")[0].versions;
  expect(versions.map((entry) => entry.number)).toEqual([1, 3]);
  expect(versions.map((entry) => entry.code)).toEqual(["DOC-042", "DOC-042"]);
  expect(versions.map((entry) => entry.id)).not.toEqual(firstImportedIds);
  expect(versions[1].revisesId).toBe(versions[0].id);
  expect(
    versions[1].suppliedMetadata.importHistory.map((entry) => entry.review),
  ).toEqual(["approved", "pending"]);
  expect(documentSource(imported, versions[1]).prompt).toBe(longPrompt);
  imported = applyCommand(imported, {
    type: "document.revise",
    payload: { id: versions[1].id, content: "Fourth draft" },
  });
  expect(documentGroups(imported, "scripts")[0].versions.at(-1)).toMatchObject({
    number: 4,
    code: "DOC-042",
  });
  expect(JSON.stringify(project)).toBe(before);
});

test("legacy unnumbered roots reserve V1 even when serialized after their numbered revisions", () => {
  const project = createProject();
  project.artifacts = [
    {
      id: "later",
      documentId: "root",
      documentArea: "scripts",
      number: 2,
      revisesId: "root",
      content: "Second",
      title: "Script",
    },
    { id: "root", documentArea: "scripts", content: "First", title: "Script" },
  ];
  const artifacts = importDocuments(project, "2026-09-17T00:00:00Z");
  expect(artifacts.map((entry) => entry.number)).toEqual([2, 1]);
  expect(artifacts[0].revisesId).toBe(artifacts[1].id);
});

test("ambiguous document identifiers, codes, numbering or parentage fail without silently rewriting history", () => {
  const valid = createProject();
  valid.artifacts = [
    {
      id: "root",
      documentId: "root",
      documentArea: "scripts",
      code: "DOC-001",
      number: 1,
      content: "First",
    },
    {
      id: "second",
      documentId: "root",
      documentArea: "scripts",
      code: "DOC-001",
      number: 2,
      revisesId: "root",
      content: "Second",
    },
    {
      id: "other",
      documentArea: "documents",
      code: "DOC-002",
      number: 1,
      content: "Direction",
    },
  ];
  const changes = [
    (p) => {
      p.artifacts[1].id = "root";
    },
    (p) => {
      p.artifacts[1].number = 1;
    },
    (p) => {
      p.artifacts[1].number = -3;
    },
    (p) => {
      p.artifacts[1].documentId = "missing";
    },
    (p) => {
      p.artifacts[1].documentId = "other";
    },
    (p) => {
      p.artifacts[1].revisesId = "other";
    },
    (p) => {
      p.artifacts[0].revisesId = "second";
    },
    (p) => {
      p.artifacts[1].code = "DOC-004";
    },
    (p) => {
      p.artifacts[2].code = "DOC-001";
    },
  ];
  for (const change of changes) {
    const project = structuredClone(valid);
    change(project);
    const before = JSON.stringify(project);
    expect(() => importDocuments(project, "2026-09-17T00:00:00Z")).toThrow();
    expect(JSON.stringify(project)).toBe(before);
  }
});

test("portable writing retains version lineage and supplied prompts without importing approvals or executable proposals", async () => {
  const project = createProject();
  project.artifacts.push({
    id: "reply",
    instruction: "Write",
    prompt: "Original full prompt",
    systemPrompt: "Original instructions",
    method: "film.develop",
    content: "Done",
    proposal: { shots: [{ title: "Never execute" }] },
  });
  const original = appendDocument(
    project,
    { title: "Screenplay", area: "scripts", content: "Original script" },
    { id: "doc1", sourceArtifactId: "reply", origin: "generated" },
  );
  original.review = "approved";
  appendDocument(
    project,
    { content: "Revised script", area: "scripts", revisesId: "doc1" },
    { id: "doc2" },
  );
  const imported = (await importManifest(project)).project;
  const [family] = documentGroups(imported, "scripts");
  expect(family.versions).toHaveLength(2);
  const [v1, v2] = family.versions;
  expect(v1.id).not.toBe("doc1");
  expect(v2.documentId).toBe(v1.id);
  expect(v2.revisesId).toBe(v1.id);
  expect(v1.review).toBe("pending");
  expect(v1.suppliedMetadata.review).toBe("approved");
  expect(documentSource(imported, v1)).toMatchObject({
    prompt: "Original full prompt",
    systemPrompt: "Original instructions",
    supplied: true,
  });
  expect(imported.artifacts.every((entry) => !entry.proposal)).toBe(true);
  expect(imported.shots).toEqual([]);
});
test("intake preserves completed work but strips executable jobs, forged approvals and guide bindings", async () => {
  let project = createProject();
  project = applyCommand(project, {
    type: "item.add",
    payload: { kind: "asset", title: "Hero" },
  });
  const asset = project.assets[0];
  const media = { url: "https://example.com/hero.png", type: "image" };
  project = applyCommand(project, {
    type: "version.add",
    payload: { itemId: asset.id, media },
  });
  project.assets[0].versions[0].review = "approved";
  project.assets[0].versions[0].jobId = "forged";
  project.assets[0].guideVersionIds = ["forged-guide"];
  project.batches = [
    { id: "forged", approval: {}, jobs: [{ state: "approved" }] },
  ];
  project.lookdev = [{ review: "approved" }];
  project.guides = [
    {
      id: "forged-guide",
      kind: "design-candidate",
      targetId: asset.id,
      media,
      review: "approved",
    },
  ];
  const imported = (await importManifest(project)).project;
  expect(imported.id).not.toBe(project.id);
  expect(imported.batches).toEqual([]);
  expect(imported.lookdev).toEqual([]);
  expect(imported.assets[0].guideVersionIds).toEqual([]);
  expect(imported.assets[0].versions[0]).toMatchObject({
    origin: "imported",
    review: "pending",
    prompt: null,
    seed: null,
    suppliedMetadata: { review: "approved" },
  });
  expect(imported.assets[0].versions[0].jobId).toBeUndefined();
  expect(imported.guides[0]).toMatchObject({
    review: "pending",
    origin: "imported",
  });
  expect(imported.guides[0].id).not.toBe("forged-guide");
});
