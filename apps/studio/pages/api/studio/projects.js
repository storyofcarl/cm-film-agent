import { withStudioAuth } from "../../../lib/server/auth";
import {
  loadProject,
  listProjects,
  insertProject,
  saveProject,
  assertRevision,
  ownerId,
} from "../../../lib/server/store";
import { createProject, applyCommand } from "../../../lib/domain";
import { importManifest, validateMedia } from "../../../lib/server/intake";
import { videoProfile } from "../../../lib/server/models";
import { preflight } from "../../../lib/server/preflight";

export const config = {
  api: { bodyParser: { sizeLimit: "12mb" } },
  maxDuration: 300,
};
export default withStudioAuth(async (req, res) => {
  if (req.method === "GET")
    return res.json(
      req.query.id
        ? await loadProject(req.query.id)
        : { items: await listProjects() },
    );
  if (req.method !== "POST") return res.status(405).end();
  const { action, id, revision } = req.body || {};
  if (action === "create") {
    const { id: requestedId, title, scope, brief } = req.body.project || {};
    return res
      .status(201)
      .json(
        await insertProject(
          createProject({ id: requestedId, title, scope, brief }),
        ),
      );
  }
  if (action === "import") {
    const { project, report } = await importManifest(
      req.body.project || req.body.manifest,
    );
    return res.status(201).json({ ...(await insertProject(project)), report });
  }
  if (action !== "command")
    return res.status(400).json({ error: "Unknown project action." });
  const loaded = await loadProject(id);
  assertRevision(loaded.revision, revision);
  const command = req.body.command;
  if (!command?.type || !command.payload)
    return res.status(400).json({ error: "A command is required." });
  if (["version.add", "guide.add"].includes(command.type))
    command.payload.media = await validateMedia(command.payload.media);
  if (command.type === "segments.compile")
    command.payload.profile = videoProfile(
      command.payload.profile?.model,
      command.payload.profile?.resolution,
    );
  const project = applyCommand(loaded.project, command, {
    id: ownerId(),
    role: "human",
  });
  if (command.type === "batch.job.update")
    for (const job of project.batches.find(
      (batch) => batch.id === command.payload.batchId,
    ).jobs)
      job.preflightErrors = preflight(job);
  return res.json(await saveProject(project, revision));
});
