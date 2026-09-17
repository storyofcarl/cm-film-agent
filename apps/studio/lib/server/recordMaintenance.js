import { createAdminSupabase } from "../../../../utils/server/supabase";
import { requestContext } from "../../../../utils/server/requestContext";
import { RECORD_BUCKET } from "./projectRecords";
import { fault } from "./errors";

const HOUR = 3600000;
const RETENTION = 24 * HOUR;
const PAGE = 100;
const validId = (value) =>
  typeof value === "string" && /^[\w-]{1,100}$/.test(value);
const digestFile = (name) => /^[a-f0-9]{64}\.json$/.test(name);
const importFile = (name) =>
  /^[a-f0-9-]{36}\.json(?:\.part-\d{4})?$/.test(name);

// One bounded pass for one authenticated owner's project. Retained text, media,
// snapshots and legacy transfers are deliberately outside every scanned prefix.
export async function cleanupTemporaryRecords(projectId, now = Date.now()) {
  const ownerId = requestContext().user.id;
  if (!validId(ownerId) || !validId(projectId) || !Number.isFinite(now))
    throw fault("Invalid temporary-record scope.");
  const storage = createAdminSupabase().storage.from(RECORD_BUCKET);
  const root = `${ownerId}/${projectId}/transfers/v2`;
  const list = async (prefix, column = "name") => {
    const { data, error } = await storage.list(prefix, {
      limit: PAGE,
      offset: 0,
      sortBy: { column, order: "asc" },
    });
    if (error || !Array.isArray(data))
      throw fault("Temporary-record cleanup could not list its scope.", 503);
    return data.slice(0, PAGE);
  };
  const expired = (await list(root))
    .filter(
      (entry) =>
        !entry.id &&
        /^(0|[1-9]\d{0,9})$/.test(entry.name) &&
        (Number(entry.name) + 1) * HOUR < now - RETENTION,
    )
    .sort((a, b) => Number(a.name) - Number(b.name))[0];
  const paths = [];
  if (expired) {
    const prefix = `${root}/${expired.name}`;
    for (const folder of [prefix, `${prefix}/chunks`]) {
      for (const entry of await list(folder)) {
        if (entry.id && digestFile(entry.name))
          paths.push(`${folder}/${entry.name}`);
      }
    }
  }
  // Signed upload tickets last two hours. Use a full day of inactivity before
  // removing an abandoned ticket/part; completed imports already clean themselves.
  const imports = `${ownerId}/imports`;
  for (const entry of await list(imports, "created_at")) {
    const created = Date.parse(entry.created_at);
    const updated = Date.parse(entry.updated_at || entry.created_at);
    if (
      entry.id &&
      importFile(entry.name) &&
      Number.isFinite(created) &&
      Number.isFinite(updated) &&
      Math.max(created, updated) < now - RETENTION
    )
      paths.push(`${imports}/${entry.name}`);
  }
  for (let start = 0; start < paths.length; start += PAGE) {
    const { error } = await storage.remove(paths.slice(start, start + PAGE));
    if (error) throw fault("Temporary-record cleanup did not finish.", 503);
  }
  return { removed: paths.length };
}
