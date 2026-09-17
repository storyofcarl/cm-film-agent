import { uid } from "../domain";
import { documentArea, documentSource } from "../documents";
import { fault } from "./errors";

const text = (value) => (typeof value === "string" ? value : null);
const positive = (value) => Number.isSafeInteger(value) && value > 0;
const historyEntry = (entry) => ({
  projectId: text(entry.projectId),
  artifactId: text(entry.artifactId),
  documentId: text(entry.documentId),
  code: text(entry.code),
  number: positive(entry.number) ? entry.number : null,
  review: ["pending", "approved", "revision"].includes(entry.review)
    ? entry.review
    : null,
  origin: text(entry.origin),
  importedAt: text(entry.importedAt),
});

// Validate and remap relationships before any media copying. A portable history
// may be stored out of order; array position must never become its version number.
export function importDocuments(input, createdAt) {
  const byId = new Map();
  for (const artifact of input.artifacts) {
    if (
      !artifact ||
      typeof artifact.id !== "string" ||
      !artifact.id ||
      byId.has(artifact.id)
    )
      throw fault(
        "Each supplied document record must have a unique identifier.",
      );
    byId.set(artifact.id, artifact);
  }
  const ids = new Map([...byId.keys()].map((id) => [id, uid("artifact")]));
  const groups = new Map();
  const membership = new Map();
  for (const artifact of input.artifacts) {
    const area = documentArea(input, artifact) || "documents";
    const rootId = artifact.documentId || artifact.id;
    const root = byId.get(rootId);
    if (
      !root ||
      (root.documentId && root.documentId !== root.id) ||
      (documentArea(input, root) || "documents") !== area
    )
      throw fault(
        `The document family for ${artifact.title || artifact.id} is missing or inconsistent. Restore its root record before importing.`,
      );
    if (!groups.has(rootId))
      groups.set(rootId, {
        root,
        area,
        entries: [],
        numbers: new Set(),
        code: null,
      });
    groups.get(rootId).entries.push(artifact);
    membership.set(artifact.id, rootId);
  }
  const codes = new Set();
  const numbers = new Map();
  for (const group of groups.values()) {
    const suppliedCodes = [
      ...new Set(group.entries.map((entry) => entry.code).filter(Boolean)),
    ];
    if (
      suppliedCodes.length > 1 ||
      suppliedCodes.some(
        (code) => typeof code !== "string" || !/^DOC-\d+$/.test(code),
      ) ||
      (suppliedCodes[0] && codes.has(suppliedCodes[0]))
    )
      throw fault(
        "Supplied document codes must identify one document family each. Resolve conflicting codes before importing.",
      );
    group.code = suppliedCodes[0] || null;
    if (group.code) codes.add(group.code);
    for (const entry of group.entries) {
      if (entry.number == null) continue;
      if (!positive(entry.number) || group.numbers.has(entry.number))
        throw fault(
          `Document ${group.code || group.root.title || group.root.id} has an invalid or repeated version number. Its history was not renumbered.`,
        );
      group.numbers.add(entry.number);
      numbers.set(entry.id, entry.number);
    }
    // Legacy unnumbered root records become V1 when available. Preserve every
    // explicit number, including gaps, even when the root is stored last.
    for (const entry of [
      group.root,
      ...group.entries.filter((entry) => entry.id !== group.root.id),
    ]) {
      if (!numbers.has(entry.id)) {
        let number = 1;
        while (group.numbers.has(number)) number++;
        group.numbers.add(number);
        numbers.set(entry.id, number);
      }
    }
  }
  return input.artifacts.map((artifact) => {
    const rootId = membership.get(artifact.id);
    const group = groups.get(rootId);
    if (
      artifact.revisesId &&
      (!byId.has(artifact.revisesId) ||
        membership.get(artifact.revisesId) !== rootId ||
        numbers.get(artifact.revisesId) >= numbers.get(artifact.id))
    )
      throw fault(
        `The revision parent for ${artifact.title || artifact.id} is missing, belongs to another document, or is not an earlier version.`,
      );
    const source = documentSource(input, artifact) || artifact;
    return {
      id: ids.get(artifact.id),
      kind: "document",
      documentId: ids.get(rootId),
      documentArea: group.area,
      number: numbers.get(artifact.id),
      ...(group.code ? { code: group.code } : {}),
      revisesId: artifact.revisesId ? ids.get(artifact.revisesId) : null,
      title: String(artifact.title || "Supplied document"),
      content: String(artifact.content || ""),
      method: "import",
      origin: "imported",
      review: "pending",
      prompt: null,
      seed: null,
      createdAt,
      suppliedMetadata: {
        review: artifact.review ?? null,
        number: artifact.number ?? null,
        origin: text(artifact.origin),
        prompt: text(source.prompt),
        systemPrompt: text(source.systemPrompt),
        method: text(source.method),
        methodVersion: text(source.methodVersion),
        model: text(source.model),
        seed: source.seed ?? null,
        createdAt: text(artifact.createdAt),
        importHistory: [
          ...(Array.isArray(artifact.suppliedMetadata?.importHistory)
            ? artifact.suppliedMetadata.importHistory
            : []
          )
            .filter((entry) => entry && typeof entry === "object")
            .map(historyEntry),
          historyEntry({
            projectId: input.id,
            artifactId: artifact.id,
            documentId: rootId,
            code: group.code,
            number: numbers.get(artifact.id),
            review: artifact.review,
            origin: artifact.origin,
            importedAt: createdAt,
          }),
        ],
      },
    };
  });
}
