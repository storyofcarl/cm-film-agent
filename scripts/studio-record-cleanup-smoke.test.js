/** @jest-environment node */
// Run explicitly with Jest's --testMatch override; never part of normal unit runs.
// Real private storage, disposable random namespaces, no application jobs/models.
import crypto from "node:crypto";
import { createAdminSupabase } from "../utils/server/supabase";
import { runWithRequest } from "../utils/server/requestContext";
import { cleanupTemporaryRecords } from "../apps/studio/lib/server/recordMaintenance";
import { RECORD_BUCKET } from "../apps/studio/lib/server/projectRecords";

// Use the real storage client without loading unrelated HTTP cookie adapters
// (their ESM package is not transformed by this isolated Jest harness).
jest.mock("../utils/server/supabase", () => ({
  createAdminSupabase: () =>
    require("@supabase/supabase-js").createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    ),
}));

test("real private storage cleanup only removes disposable expired transfer copies", async () => {
  const ownerId = crypto.randomUUID();
  const otherId = crypto.randomUUID();
  const projectId = `maintenance_${crypto.randomUUID()}`;
  const now = Date.now();
  const hour = Math.floor(now / 3600000);
  const digest = crypto.randomBytes(32).toString("hex") + ".json";
  const old = `${ownerId}/${projectId}/transfers/v2/${hour - 48}`;
  const paths = [
    `${old}/${digest}`,
    `${old}/chunks/${digest}`,
    `${ownerId}/${projectId}/transfers/v2/${hour}/${digest}`,
    `${ownerId}/${projectId}/text/${digest}`,
    `${ownerId}/${projectId}/text/chunks/${digest}`,
    `${ownerId}/${projectId}/transfers/${digest}`,
    `${ownerId}/imports/${crypto.randomUUID()}.json`,
    `${otherId}/${projectId}/transfers/v2/${hour - 48}/${digest}`,
  ];
  const storage = createAdminSupabase().storage.from(RECORD_BUCKET);
  const fixture = Buffer.from(
    JSON.stringify({ fixture: "disposable maintenance verification" }),
  );
  try {
    for (const path of paths) {
      const { error } = await storage.upload(path, fixture, {
        contentType: "application/json",
        upsert: false,
      });
      if (error) throw error;
    }
    expect(
      await runWithRequest({ user: { id: ownerId }, namespace: "studio" }, () =>
        cleanupTemporaryRecords(projectId, now),
      ),
    ).toEqual({ removed: 2 });
    for (let index = 0; index < paths.length; index++) {
      const { data, error } = await storage.download(paths[index]);
      if (index < 2) expect(error).toBeTruthy();
      else {
        expect(error).toBeNull();
        expect(Buffer.from(await data.arrayBuffer())).toEqual(fixture);
      }
    }
    expect(
      await runWithRequest({ user: { id: ownerId }, namespace: "studio" }, () =>
        cleanupTemporaryRecords(projectId, now),
      ),
    ).toEqual({ removed: 0 });
    console.log(
      "Private storage cleanup passed: expired copies removed; active, retained, legacy, fresh-import and other-owner files unchanged. No model calls.",
    );
  } finally {
    if (
      !paths.every(
        (path) =>
          path.startsWith(ownerId + "/") || path.startsWith(otherId + "/"),
      )
    )
      throw Error("Unexpected fixture scope.");
    const { error } = await storage.remove(paths);
    if (error) throw error;
  }
}, 120000);
