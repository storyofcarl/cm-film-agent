/** @jest-environment node */
import { webcrypto, createHash } from "node:crypto";
import { resolveProjectResponse } from "../apps/studio/lib/projectTransfer";
jest.mock("../utils/supabase/browser", () => ({
  getBrowserSupabase: jest.fn(),
}));
const originalFetch = global.fetch;
beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://storage.test";
  global.fetch = jest.fn();
  Object.defineProperty(global, "crypto", {
    configurable: true,
    value: webcrypto,
  });
});
afterEach(() => {
  global.fetch = originalFetch;
});
const envelope = (bytes) => ({
  $studioTransfer: {
    url: "https://storage.test/storage/v1/object/sign/studio-records/owner/project/transfers/hash.json?token=test",
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  },
});

test("the browser reconstructs the complete verified project and preserves extra response fields", async () => {
  const value = {
    project: { id: "film", prompt: "Exact 🎬 prompt", versions: [1, 2, 4] },
    revision: 10,
    report: ["Imported"],
  };
  const bytes = Buffer.from(JSON.stringify(value));
  global.fetch.mockResolvedValue(new Response(bytes));
  expect(await resolveProjectResponse(envelope(bytes))).toEqual(value);
  expect(global.fetch.mock.calls[0][1]).toMatchObject({
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  expect(await resolveProjectResponse(value)).toEqual(value);
});

test("foreign transfer hosts are rejected before access and altered or expired downloads are not applied", async () => {
  const bytes = Buffer.from('{"project":{"id":"film"}}');
  const value = envelope(bytes);
  await expect(
    resolveProjectResponse({
      $studioTransfer: {
        ...value.$studioTransfer,
        url: "https://other.test/private",
      },
    }),
  ).rejects.toThrow("invalid");
  expect(global.fetch).not.toHaveBeenCalled();
  global.fetch.mockResolvedValueOnce(
    new Response(Buffer.from('{"project":{"id":"fake"}}')),
  );
  await expect(resolveProjectResponse(value)).rejects.toThrow("did not match");
  global.fetch.mockResolvedValueOnce(new Response("Expired", { status: 403 }));
  await expect(resolveProjectResponse(value)).rejects.toThrow("expired");
});
