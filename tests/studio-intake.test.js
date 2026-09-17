/** @jest-environment node */
import {
  validateSupplied,
  applySuppliedAssessment,
} from "../apps/studio/lib/server/validateSupplied";
import { seedHandler } from "../pages/api/seed";
import { inspectStoredMedia } from "../apps/studio/lib/server/media";
import { createProject, applyCommand } from "../apps/studio/lib/domain";
jest.mock("../pages/api/seed", () => ({ seedHandler: jest.fn() }));
jest.mock("../apps/studio/lib/server/media", () => ({
  inspectStoredMedia: jest.fn(),
}));
beforeEach(() => jest.clearAllMocks());

test("supplied text can be validated without pretending it has media", async () => {
  seedHandler.mockImplementation(async (_req, res) =>
    res.json({
      content: JSON.stringify({
        complete: true,
        gaps: [],
        evidence: ["Complete beginning, middle and end."],
        summary: "Ready for direction.",
      }),
    }),
  );
  const assessment = await validateSupplied({
    request: { model: "test", prompt: "Complete screenplay" },
  });
  expect(inspectStoredMedia).not.toHaveBeenCalled();
  expect(assessment.complete).toBe(true);
});
test("short supplied footage fails timing validation before an unnecessary reasoning call", async () => {
  inspectStoredMedia.mockResolvedValue({ type: "video", duration: 2 });
  const assessment = await validateSupplied({
    request: {
      media: { url: "https://example.com/clip.mp4", type: "video" },
      requiredType: "video",
      requiredDuration: 5,
    },
  });
  expect(assessment.complete).toBe(false);
  expect(seedHandler).not.toHaveBeenCalled();
});
test("an unsupported completeness assertion cannot approve work when gaps remain", async () => {
  seedHandler.mockImplementation(async (_req, res) =>
    res.json({
      content: JSON.stringify({
        complete: true,
        gaps: ["Dialogue not verified."],
        evidence: [],
      }),
    }),
  );
  expect(
    (await validateSupplied({ request: { model: "test", prompt: "Validate" } }))
      .complete,
  ).toBe(false);
});
test("agent may approve complete imported work, but never overwrite a concurrent human review", () => {
  let project = createProject();
  project = applyCommand(project, {
    type: "artifact.add",
    payload: {
      title: "Supplied screenplay",
      content: "Complete screenplay text.",
    },
  });
  const id = project.artifacts[0].id;
  const job = {
    id: "check",
    targetId: id,
    sourceVersionId: id,
    output: {
      complete: true,
      gaps: [],
      evidence: ["Completed supplied document."],
    },
  };
  applySuppliedAssessment(project, job);
  expect(project.artifacts[0].review).toBe("approved");
  project = applyCommand(project, {
    type: "artifact.review",
    payload: { id, review: "revision" },
  });
  applySuppliedAssessment(project, { ...job, id: "new-check" });
  expect(project.artifacts[0].review).toBe("revision");
});
