import crypto from "node:crypto";
import { createAdminSupabase } from "../../../../../utils/server/supabase";
import { runWithRequest } from "../../../../../utils/server/requestContext";
import { isApprovedUser } from "../../../../../utils/server/withAuth";
import { runBatch, reconcileBatch } from "../../../lib/server/execute";
import { jobBlockers } from "../../../lib/domain";
import { advanceCrewRun } from "../../../lib/server/crewRuns";
import { cleanupTemporaryRecords } from "../../../lib/server/recordMaintenance";
export const config = { maxDuration: 300 };
export default async function reconcile(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST"].includes(req.method)) return res.status(405).end();
  const expected = process.env.CRON_SECRET;
  const token = String(req.headers.authorization || "").replace(/^Bearer /, "");
  if (
    !expected ||
    Buffer.byteLength(token) !== Buffer.byteLength(expected) ||
    !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  )
    return res.status(401).end();
  const db = createAdminSupabase();
  // Rotate a bounded page over a stable ordering. A fixed oldest-50 query can
  // starve newer productions behind completed or blocked projects forever.
  const tick = Math.floor(Date.now() / 60000);
  const { count, error: countError } = await db
    .from("studio_projects")
    .select("id", { count: "exact", head: true });
  if (countError)
    return res.status(503).json({ error: "Production store unavailable." });
  const pages = Math.max(1, Math.ceil(count / 50));
  const offset = (tick % pages) * 50;
  const { data, error } = await db
    .from("studio_projects")
    .select("id,owner_id,document")
    .order("id")
    .range(offset, offset + 49);
  if (error)
    return res.status(503).json({ error: "Production store unavailable." });
  const started = Date.now();
  const results = [];
  const first = data.length ? Math.floor(tick / pages) % data.length : 0;
  const rows = [...data.slice(first), ...data.slice(0, first)];
  let maintenanceTarget;
  for (const row of rows) {
    if (Date.now() - started > 180000) break;
    const { data: account } = await db.auth.admin.getUserById(row.owner_id);
    if (!isApprovedUser(account?.user)) continue;
    maintenanceTarget ||= { row, user: account.user };
    const chatTasks = (row.document.crewRuns || []).filter((task) =>
      ["queued", "running"].includes(task.state),
    );
    if (chatTasks.length) {
      const task = chatTasks[tick % chatTasks.length];
      try {
        const status = await runWithRequest(
          { user: account.user, supabase: db, namespace: "studio" },
          () => advanceCrewRun(row.id, task.id),
        );
        results.push({
          project: row.id,
          chatTask: task.id,
          state: status.project.crewRuns.find((entry) => entry.id === task.id)
            .state,
        });
      } catch {
        results.push({
          project: row.id,
          chatTask: task.id,
          state: "check-saved-task",
        });
      }
    }
    const candidates = row.document.batches.filter(
      (batch) =>
        batch.approval &&
        ["approved", "running", "attention"].includes(batch.state),
    );
    const cursor = candidates.length ? tick % candidates.length : 0;
    const selected = [
      ...candidates.slice(cursor),
      ...candidates.slice(0, cursor),
    ].slice(0, 2);
    for (const batch of selected) {
      if (Date.now() - started > 180000) break;
      try {
        const status = await runWithRequest(
          { user: account.user, supabase: db, namespace: "studio" },
          async () => {
            const current = await reconcileBatch(row.id, batch.id);
            const plan = current.project.batches.find(
              (entry) => entry.id === batch.id,
            );
            if (
              plan.jobs.some(
                (job) =>
                  job.state === "planned" &&
                  !jobBlockers(current.project, plan, job).length,
              )
            )
              return runBatch(row.id, batch.id);
            return current;
          },
        );
        results.push({
          project: row.id,
          batch: batch.id,
          state: status.project.batches.find((entry) => entry.id === batch.id)
            .state,
        });
      } catch {
        results.push({
          project: row.id,
          batch: batch.id,
          state: "retry-result-check",
        });
      }
    }
  }
  let maintenance;
  if (maintenanceTarget) {
    const { row, user } = maintenanceTarget;
    try {
      maintenance = {
        project: row.id,
        ...(await runWithRequest(
          { user, supabase: db, namespace: "studio" },
          () => cleanupTemporaryRecords(row.id),
        )),
      };
    } catch {
      maintenance = { project: row.id, state: "retry-cleanup" };
    }
  }
  return res.json({ results, ...(maintenance ? { maintenance } : {}) });
}
