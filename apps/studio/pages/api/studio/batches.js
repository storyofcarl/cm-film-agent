import { withStudioAuth } from "../../../lib/server/auth";
import {
  loadProject,
  assertRevision,
  saveProject,
} from "../../../lib/server/store";
import { modelCatalog } from "../../../lib/server/models";
import { prepareBatch } from "../../../lib/batches";
import {
  runBatch,
  reconcileBatch,
  resolveUncertainJob,
} from "../../../lib/server/execute";
import { preflight } from "../../../lib/server/preflight";
import { jobBlockers } from "../../../lib/domain";
export const config = {
  maxDuration: 300,
  api: { bodyParser: { sizeLimit: "1mb" } },
};
export default withStudioAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const { action, id, revision, batchId } = req.body;
  const loaded = await loadProject(id);
  assertRevision(loaded.revision, revision);
  if (action === "prepare") {
    const project = prepareBatch(loaded.project, req.body, modelCatalog());
    for (const job of project.batches[0].jobs)
      job.preflightErrors = preflight(job);
    return res.json(await saveProject(project, revision));
  }
  if (action === "run") return res.json(await runBatch(id, batchId));
  if (action === "resolve")
    return res.json(
      await resolveUncertainJob(id, batchId, req.body.jobId, req.body),
    );
  if (action === "reconcile")
    return res.json(await reconcileBatch(id, batchId));
  if (action === "tick") {
    const current = await reconcileBatch(id, batchId);
    const batch = current.project.batches.find((entry) => entry.id === batchId);
    if (
      batch?.approval &&
      batch.jobs.some(
        (job) =>
          job.state === "planned" &&
          !jobBlockers(current.project, batch, job).length &&
          !preflight(job).length,
      )
    )
      return res.json(await runBatch(id, batchId));
    return res.json(current);
  }
  return res.status(400).json({ error: "Choose prepare, run, or reconcile." });
});
