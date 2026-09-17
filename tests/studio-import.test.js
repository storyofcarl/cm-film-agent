/** @jest-environment node */
import { importManifest } from "../apps/studio/lib/server/intake";
import { createProject, applyCommand } from "../apps/studio/lib/domain";
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
