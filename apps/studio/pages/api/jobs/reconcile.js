import crypto from "node:crypto";
import { createAdminSupabase } from "../../../../../utils/server/supabase";
import { runWithRequest } from "../../../../../utils/server/requestContext";
import { isApprovedUser } from "../../../../../utils/server/withAuth";
import { runBatch, reconcileBatch } from "../../../lib/server/execute";
import { jobBlockers } from "../../../lib/domain";
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
  const { data, error } = await db
    .from("studio_projects")
    .select("id,owner_id,document")
    .order("updated_at")
    .limit(50);
  if (error)
    return res.status(503).json({ error: "Production store unavailable." });
  const started = Date.now();
  const results = [];
  for (const row of data) {
    if (Date.now() - started > 180000) break;
    const { data: account } = await db.auth.admin.getUserById(row.owner_id);
    if (!isApprovedUser(account?.user)) continue;
    const candidates = row.document.batches.filter(
      (batch) =>
        batch.approval &&
        ["approved", "running", "attention"].includes(batch.state),
    );
    for (const batch of candidates.slice(0, 2)) {
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
  return res.json({ results });
}
