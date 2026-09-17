/** @jest-environment node */
import { importManifest } from "../apps/studio/lib/server/intake";
import { createProject, applyCommand } from "../apps/studio/lib/domain";
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
