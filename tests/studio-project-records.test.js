/** @jest-environment node */
import crypto from "node:crypto";
import {
  packProject,
  hydrateProject,
  projectResponse,
  signProjectImport,
  readProjectImport,
} from "../apps/studio/lib/server/projectRecords";

let mockContext;
let mockObjects;
const mockStorage = {
  upload: jest.fn(async (path, bytes) => {
    if (mockObjects.has(path)) return { error: { statusCode: "409" } };
    mockObjects.set(path, Buffer.from(bytes));
    return { error: null };
  }),
  download: jest.fn(async (path) =>
    mockObjects.has(path)
      ? { data: new Blob([mockObjects.get(path)]) }
      : { error: { statusCode: "404" } },
  ),
  createSignedUrl: jest.fn(async (path) => ({
    data: {
      signedUrl: `https://storage.test/storage/v1/object/sign/studio-records/${path}?token=fixture`,
    },
  })),
  createSignedUploadUrl: jest.fn(async () => ({
    data: { token: "fixture-token" },
  })),
  remove: jest.fn(async (paths) => {
    paths.forEach((path) => mockObjects.delete(path));
    return { error: null };
  }),
};
jest.mock("../utils/server/supabase", () => ({
  createAdminSupabase: () => ({ storage: { from: () => mockStorage } }),
}));
jest.mock("../utils/server/requestContext", () => ({
  requestContext: () => mockContext,
}));
beforeEach(() => {
  mockContext = { user: { id: "owner" } };
  mockObjects = new Map();
  jest.clearAllMocks();
});

test("long Unicode prompts are deduplicated, loaded exactly and retained independently of newer snapshots", async () => {
  const prompt = "A complete shot 🎬, with exact dialogue.\n".repeat(500);
  const original = {
    id: "production",
    title: "Film",
    batches: [{ jobs: [{ id: "job", state: "planned", request: { prompt } }] }],
    shots: [{ versions: [{ prompt, review: "approved" }] }],
  };
  const before = JSON.stringify(original);
  const stored = await packProject(original);
  expect(mockStorage.upload).toHaveBeenCalledTimes(1);
  expect(stored.batches[0].jobs[0].state).toBe("planned");
  expect(stored.shots[0].versions[0].prompt).toEqual(
    stored.batches[0].jobs[0].request.prompt,
  );
  expect(JSON.stringify(original)).toBe(before);
  mockContext.studioRecordCache = new Map();
  expect(await hydrateProject(stored)).toEqual(original);
  expect(mockStorage.download).toHaveBeenCalledTimes(1);
  const revised = structuredClone(original);
  revised.shots[0].versions.push({
    prompt: prompt + "New version.",
    review: "pending",
  });
  const next = await packProject(revised);
  expect(mockStorage.upload).toHaveBeenCalledTimes(2);
  mockContext.studioRecordCache = new Map();
  expect(await hydrateProject(stored)).toEqual(original);
  expect(await hydrateProject(next)).toEqual(revised);
  expect(mockStorage.remove).not.toHaveBeenCalled();
});

test("retained text can exceed the old 12 MB project cap while the operational index stays small", async () => {
  const source = {
    id: "feature",
    artifacts: [{ id: "history", content: "x".repeat(13 * 1024 * 1024) }],
  };
  const stored = await packProject(source);
  expect(JSON.stringify(stored).length).toBeLessThan(500);
  mockContext.studioRecordCache = new Map();
  expect((await hydrateProject(stored)).artifacts[0].content).toBe(
    source.artifacts[0].content,
  );
});

test("legacy inline projects remain readable without storage calls", async () => {
  const legacy = {
    id: "legacy",
    artifacts: [{ content: "Original text" }],
    settings: { seed: 0 },
  };
  expect(await hydrateProject(legacy)).toEqual(legacy);
  expect(mockStorage.download).not.toHaveBeenCalled();
});

test("forged pointers are rejected before uploading and retained bytes are integrity checked", async () => {
  await expect(
    packProject({
      id: "film",
      prompt: "p".repeat(4000),
      forged: { $studioText: "a".repeat(64), bytes: 4 },
    }),
  ).rejects.toThrow("cannot be supplied");
  expect(mockStorage.upload).not.toHaveBeenCalled();
  const stored = await packProject({ id: "film", prompt: "p".repeat(4000) });
  const path = [...mockObjects.keys()][0];
  const bytes = mockObjects.get(path);
  bytes[1] = "q".charCodeAt(0);
  mockContext.studioRecordCache = new Map();
  await expect(hydrateProject(stored)).rejects.toThrow("integrity check");
});

test("records never cross the authenticated owner namespace", async () => {
  const stored = await packProject({ id: "film", prompt: "p".repeat(4000) });
  mockContext = { user: { id: "other" } };
  await expect(hydrateProject(stored)).rejects.toThrow("unavailable");
  expect(mockStorage.download.mock.calls[0][0]).toMatch(/^other\/film\/text\//);
  await expect(
    readProjectImport(
      "owner/imports/00000000-0000-0000-0000-000000000000.json",
    ),
  ).rejects.toThrow("your own");
  expect(mockStorage.remove).not.toHaveBeenCalled();
});

test("large responses use an expiring private download with exact byte count and digest", async () => {
  const value = {
    project: { id: "feature", content: "A complete record.".repeat(300000) },
    revision: 19,
    report: "Intake result",
  };
  const envelope = await projectResponse(value);
  const bytes = Buffer.concat(
    envelope.$studioTransfer.parts.map((part) =>
      mockObjects.get(new URL(part.url).pathname.split("studio-records/")[1]),
    ),
  );
  expect(envelope.project).toBeUndefined();
  expect(envelope.$studioTransfer.bytes).toBe(bytes.length);
  expect(envelope.$studioTransfer.sha256).toBe(
    crypto.createHash("sha256").update(bytes).digest("hex"),
  );
  expect(mockStorage.createSignedUrl.mock.calls[0][1]).toBe(300);
  expect(JSON.parse(bytes.toString())).toEqual(value);
  expect(
    await projectResponse({ project: { id: "small" }, revision: 1 }),
  ).toEqual({ project: { id: "small" }, revision: 1 });
});

test("import tickets are confined to temporary copies and cannot overwrite retained records", async () => {
  const content = Buffer.from(JSON.stringify({ id: "supplied" }));
  const ticket = await signProjectImport(content.length);
  expect(ticket.path).toMatch(/^owner\/imports\/[a-f0-9-]{36}\.json$/);
  expect(mockStorage.createSignedUploadUrl.mock.calls[0][1]).toEqual({
    upsert: false,
  });
  mockObjects.set(ticket.parts[0].path, content);
  expect(await readProjectImport(ticket.path)).toEqual({ id: "supplied" });
  expect(mockObjects.has(ticket.path)).toBe(false);
  expect(mockStorage.remove).toHaveBeenCalledWith([
    ticket.path,
    ticket.parts[0].path,
  ]);
  await expect(
    readProjectImport("owner/imports/../../film/text/file.json"),
  ).rejects.toThrow("your own");
  await expect(signProjectImport(0)).rejects.toThrow();
});

test("new transfer URLs cannot revive an expired cleanup folder", async () => {
  const now = jest.spyOn(Date, "now");
  try {
    const response = {
      project: { id: "film", content: "x".repeat(3 * 1024 * 1024) },
    };
    now.mockReturnValue(1000 * 3600000);
    const first = await projectResponse(response);
    now.mockReturnValue(1001 * 3600000);
    const later = await projectResponse(response);
    expect(first.$studioTransfer.parts[0].url).toContain("/transfers/v2/1000/");
    expect(later.$studioTransfer.parts[0].url).toContain("/transfers/v2/1001/");
    expect(first.$studioTransfer.sha256).toBe(later.$studioTransfer.sha256);
  } finally {
    now.mockRestore();
  }
});
