/** @jest-environment node */
import { cleanupTemporaryRecords } from "../apps/studio/lib/server/recordMaintenance";
let mockEntries;
const hour = 3600000;
const now = 1000 * hour;
const hash = "a".repeat(64) + ".json";
const ticket = "00000000-0000-0000-0000-000000000000.json";
const entry = (name, age = 48, overrides = {}) => ({
  name,
  id: name,
  created_at: new Date(now - age * hour).toISOString(),
  updated_at: new Date(now - age * hour).toISOString(),
  ...overrides,
});
const storage = {
  list: jest.fn(async (prefix) => ({
    data: mockEntries[prefix] || [],
    error: null,
  })),
  remove: jest.fn(async () => ({ error: null })),
};
jest.mock("../utils/server/supabase", () => ({
  createAdminSupabase: () => ({ storage: { from: () => storage } }),
}));
jest.mock("../utils/server/requestContext", () => ({
  requestContext: () => ({ user: { id: "owner" } }),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockEntries = {};
});

test("only expired recognized temporary objects are removed; retained history and fresh links are outside scope", async () => {
  mockEntries["owner/film/transfers/v2"] = [
    { name: "950", id: null },
    { name: "976", id: null },
    { name: "1000", id: null },
    { name: "../text", id: null },
  ];
  mockEntries["owner/film/transfers/v2/950"] = [
    entry(hash),
    { name: "chunks", id: null },
    entry("keep.txt"),
  ];
  mockEntries["owner/film/transfers/v2/950/chunks"] = [entry(hash)];
  mockEntries["owner/imports"] = [
    entry(ticket),
    entry(ticket + ".part-0000"),
    entry("11111111-1111-1111-1111-111111111111.json", 1),
    entry("22222222-2222-2222-2222-222222222222.json", 48, {
      updated_at: new Date(now).toISOString(),
    }),
    entry("keep.json"),
    entry("33333333-3333-3333-3333-333333333333.json", 48, {
      created_at: null,
    }),
    entry("../film/text/" + hash),
  ];
  expect(await cleanupTemporaryRecords("film", now)).toEqual({ removed: 4 });
  expect(storage.remove.mock.calls.flat(2)).toEqual([
    "owner/film/transfers/v2/950/" + hash,
    "owner/film/transfers/v2/950/chunks/" + hash,
    "owner/imports/" + ticket,
    "owner/imports/" + ticket + ".part-0000",
  ]);
  expect(storage.list.mock.calls.map(([prefix]) => prefix)).toEqual([
    "owner/film/transfers/v2",
    "owner/film/transfers/v2/950",
    "owner/film/transfers/v2/950/chunks",
    "owner/imports",
  ]);
});

test("cleanup respects a full day after the hour ends and rejects traversal before storage access", async () => {
  mockEntries["owner/film/transfers/v2"] = [
    { name: "975", id: null },
    { name: "976", id: null },
  ];
  expect(await cleanupTemporaryRecords("film", now)).toEqual({ removed: 0 });
  expect(storage.remove).not.toHaveBeenCalled();
  storage.list.mockClear();
  await expect(cleanupTemporaryRecords("../other", now)).rejects.toThrow(
    "scope",
  );
  expect(storage.list).not.toHaveBeenCalled();
});

test("failed listings never trigger deletion and removal failures remain retryable", async () => {
  storage.list.mockResolvedValueOnce({ error: { message: "Unavailable" } });
  await expect(cleanupTemporaryRecords("film", now)).rejects.toThrow(
    "could not list",
  );
  expect(storage.remove).not.toHaveBeenCalled();
  mockEntries["owner/imports"] = [entry(ticket)];
  storage.remove.mockResolvedValueOnce({ error: { message: "Unavailable" } });
  await expect(cleanupTemporaryRecords("film", now)).rejects.toThrow(
    "did not finish",
  );
  expect(await cleanupTemporaryRecords("film", now)).toEqual({ removed: 1 });
});

test("large expired folders are drained in bounded batches without offset-skipping retained history", async () => {
  mockEntries["owner/film/transfers/v2"] = [{ name: "950", id: null }];
  mockEntries["owner/film/transfers/v2/950"] = Array.from(
    { length: 250 },
    (_, index) => entry(index.toString(16).padStart(64, "0") + ".json"),
  );
  mockEntries["owner/film/transfers/v2/950/chunks"] = Array.from(
    { length: 250 },
    (_, index) => entry(index.toString(16).padStart(64, "0") + ".json"),
  );
  expect(await cleanupTemporaryRecords("film", now)).toEqual({ removed: 200 });
  expect(
    storage.remove.mock.calls.every(([paths]) => paths.length <= 100),
  ).toBe(true);
  expect(
    storage.list.mock.calls.every(
      ([, options]) => options.limit === 100 && options.offset === 0,
    ),
  ).toBe(true);
});
