import { fileArea } from "./fileAreas";

export const DOCUMENT_AREAS = ["scripts", "documents"];

export function documentArea(project, artifact) {
  if (DOCUMENT_AREAS.includes(artifact.documentArea))
    return artifact.documentArea;
  const entry = project.inbox?.find(
    (file) => file.id === artifact.sourceInboxId,
  );
  if (entry)
    return DOCUMENT_AREAS.includes(fileArea(entry)) ? fileArea(entry) : null;
  if (
    artifact.instruction ||
    artifact.proposal ||
    artifact.prompt?.startsWith("DIRECTOR'S REQUEST\n")
  )
    return null;
  return /screenplay|\bscript\b|\.fountain$/i.test(artifact.title || "")
    ? "scripts"
    : "documents";
}

export function documentGroups(project, area) {
  const groups = new Map();
  for (const artifact of project.artifacts) {
    if (artifact.hidden || documentArea(project, artifact) !== area) continue;
    const id = artifact.documentId || artifact.id;
    if (!groups.has(id)) groups.set(id, { id, versions: [] });
    groups.get(id).versions.push(artifact);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    versions: group.versions.sort((a, b) => (a.number || 1) - (b.number || 1)),
  }));
}

// Append only. Review and provenance on every earlier draft remain untouched.
export function appendDocument(project, input, metadata = {}) {
  if (
    !input ||
    typeof input.content !== "string" ||
    !input.content.trim() ||
    input.content.length > 500000
  )
    throw new Error("Supply a complete document of 1–500,000 characters.");
  if (!DOCUMENT_AREAS.includes(input.area))
    throw new Error("Choose Scripts or Production docs.");
  const parent = input.revisesId
    ? project.artifacts.find((entry) => entry.id === input.revisesId)
    : null;
  if (input.revisesId && (!parent || !documentArea(project, parent)))
    throw new Error("The document being revised no longer exists.");
  if (parent && documentArea(project, parent) !== input.area)
    throw new Error("A revision must stay in its document's file area.");
  const id = metadata.id || `artifact_${globalThis.crypto.randomUUID()}`;
  const documentId = parent?.documentId || parent?.id || id;
  const earlier = project.artifacts.filter(
    (entry) => (entry.documentId || entry.id) === documentId,
  );
  const document = {
    id,
    kind: "document",
    documentId,
    documentArea: input.area,
    number: Math.max(0, ...earlier.map((entry) => entry.number || 1)) + 1,
    title: String(input.title || parent?.title || "Untitled document").slice(
      0,
      300,
    ),
    content: input.content,
    revisesId: parent?.id || null,
    sourceArtifactId: metadata.sourceArtifactId || null,
    origin: metadata.origin || "manual",
    actor: metadata.actor || null,
    createdAt: metadata.createdAt || new Date().toISOString(),
    review: "pending",
    prompt: null,
    seed: null,
  };
  project.artifacts.push(document);
  return document;
}

export function documentSource(project, document) {
  if (document.suppliedMetadata?.prompt)
    return { ...document.suppliedMetadata, supplied: true };
  return document.sourceArtifactId
    ? project.artifacts.find(
        (entry) => entry.id === document.sourceArtifactId,
      ) || null
    : document.prompt
      ? document
      : null;
}
