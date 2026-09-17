import { withStudioAuth } from "../../../lib/server/auth";
import { loadProject, assertRevision } from "../../../lib/server/store";
import { runCrew } from "../../../lib/server/crew";
export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
  maxDuration: 300,
};
export default withStudioAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const loaded = await loadProject(req.body.id);
  assertRevision(loaded.revision, req.body.revision);
  return res.json(await runCrew(loaded.project, req.body));
});
