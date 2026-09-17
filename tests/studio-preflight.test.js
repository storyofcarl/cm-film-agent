/** @jest-environment node */
import { preflight } from "../apps/studio/lib/server/preflight";
import { requireModel } from "../apps/studio/lib/server/models";
import { providerModel } from "../utils/providerModels";
jest.mock("../utils/server/supabase", () => ({
  createAdminSupabase: jest.fn(),
}));
jest.mock("../apps/studio/lib/server/models", () => ({
  requireModel: jest.fn(),
}));
beforeEach(() =>
  requireModel.mockImplementation((id) => ({
    ...providerModel(id),
    minDuration: 4,
    maxDuration: 15,
    references: id === "MiniMax-H3" ? 9 : 2,
  })),
);
const job = (model, references = []) => ({
  request: {
    type: "video",
    model,
    prompt: "One complete action",
    duration: 5,
    resolution: "768p",
    references,
  },
});
test("preflight catches MiniMax mode conflicts introduced by continuation frames", () => {
  const planned = job("MiniMax-H3", [
    {
      type: "image",
      role: "reference_image",
      url: "https://example.com/ref.png",
    },
  ]);
  planned.continuation = true;
  expect(preflight(planned).join(" ")).toMatch(/separate|combine|reference/i);
});
test("preflight accepts supported H3 Max opening/closing repair frames and rejects video references", () => {
  const planned = job("minimax/h3-max");
  planned.frameDependencies = [{ role: "first_frame" }, { role: "last_frame" }];
  expect(preflight(planned)).toEqual([]);
  expect(
    preflight(
      job("minimax/h3-max", [
        {
          type: "video",
          role: "reference_video",
          url: "https://example.com/clip.mp4",
        },
      ]),
    ).join(" "),
  ).toMatch(/H3 Max/);
});
test("unsupported model duration and resolution are caught before execution", () => {
  const planned = job("MiniMax-H3");
  planned.request.duration = 30;
  expect(preflight(planned).join(" ")).toMatch(/duration/);
  planned.request.duration = 5;
  planned.request.resolution = "4K";
  expect(preflight(planned).join(" ")).toMatch(/resolution/);
});
