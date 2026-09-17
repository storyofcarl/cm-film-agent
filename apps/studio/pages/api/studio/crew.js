import { withStudioAuth } from "../../../lib/server/auth";
import { loadProject, assertRevision } from "../../../lib/server/store";
import {
  advanceCrewRun,
  cancelCrewRun,
  startCrewRun,
} from "../../../lib/server/crewRuns";
export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
  maxDuration: 300,
};
export default withStudioAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const loaded = await loadProject(req.body.id);
  if (req.body.action === "advance")
    return res.json(await advanceCrewRun(loaded.project.id, req.body.taskId));
  if (req.body.action === "cancel")
    return res.json(await cancelCrewRun(loaded.project.id, req.body.taskId));
  if (req.body.action && req.body.action !== "start")
    return res.status(400).json({ error: "Unknown chat action." });
  assertRevision(loaded.revision, req.body.revision);
  return res.json(await startCrewRun(loaded.project, req.body));
});
