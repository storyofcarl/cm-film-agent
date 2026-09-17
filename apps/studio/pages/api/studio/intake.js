import { withStudioAuth } from "../../../lib/server/auth";
import {
  loadProject,
  assertRevision,
  saveProject,
} from "../../../lib/server/store";
import { extractDocument } from "../../../lib/server/documents";
import { validateMedia } from "../../../lib/server/intake";
import { uid } from "../../../lib/domain";
import { DOCUMENT_TYPES, MEDIA_TYPES } from "../../../lib/uploads";
import { FILE_AREAS, fileArea } from "../../../lib/fileAreas";
import {
  KEY_RE,
  readStoreBytes,
  mediaUrl,
} from "../../../../../utils/server/mediaStore";

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
  maxDuration: 300,
};
export default withStudioAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const { id, revision, key, name, area } = req.body || {};
  if (area != null && !Object.hasOwn(FILE_AREAS, area))
    return res.status(400).json({ error: "Choose a valid file area." });
  if (!KEY_RE.test(String(key || "")))
    return res.status(400).json({ error: "Choose a completed upload." });
  const loaded = await loadProject(id);
  assertRevision(loaded.revision, revision);
  const project = loaded.project;
  project.inbox ||= [];
  if (project.inbox.some((entry) => entry.source.key === key))
    return res.json({ ...loaded, duplicate: true });
  const extension = key.split(".").pop().toLowerCase();
  const type = DOCUMENT_TYPES[extension] || MEDIA_TYPES[extension];
  if (!type) return res.status(400).json({ error: "Unsupported upload type." });
  const { buffer, contentType } = await readStoreBytes(key);
  if (contentType.split(";")[0] !== type)
    return res.status(400).json({
      error: "The uploaded file type does not match its storage record.",
    });
  const entry = {
    id: uid("inbox"),
    title: String(name || "Supplied work").slice(0, 300),
    source: {
      key,
      url: mediaUrl(key),
      contentType: type,
      bytes: buffer.length,
    },
    kind: DOCUMENT_TYPES[extension] ? "document" : type.split("/")[0],
    status: "ready",
    warnings: [],
    assignments: [],
    createdAt: new Date().toISOString(),
  };
  entry.area = area || fileArea(entry);
  try {
    if (entry.kind === "document") {
      const result = await extractDocument(buffer, extension);
      entry.extraction = {
        pages: result.pages,
        characters: result.text.length,
        note: result.note,
      };
      entry.warnings = result.warnings;
      const artifact = {
        id: uid("artifact"),
        title: entry.title,
        content: result.text,
        sourceInboxId: entry.id,
        method: "import",
        origin: "imported",
        review: "pending",
        createdAt: entry.createdAt,
        prompt: null,
        seed: null,
      };
      entry.artifactId = artifact.id;
      project.artifacts.push(artifact);
    } else
      entry.media = await validateMedia({
        url: entry.source.url,
        type: entry.kind,
      });
  } catch (error) {
    entry.status = "needs-attention";
    entry.warnings.push(error.message);
  }
  project.inbox.push(entry);
  project.events.push({
    id: uid("event"),
    kind: "work.uploaded",
    role: "human",
    actor: "director",
    inboxId: entry.id,
    at: entry.createdAt,
  });
  return res.json(await saveProject(project, revision));
});
