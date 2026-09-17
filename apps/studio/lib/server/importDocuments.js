import { uid } from "../domain";
import { documentArea, documentSource, KNOWLEDGE_TYPES } from "../documents";
import { fault } from "./errors";

const text = (value) => (typeof value === "string" ? value : null);
const positive = (value) => Number.isSafeInteger(value) && value > 0;
function retainedStudy(study) {
  if (study == null) return null;
  if (
    !["indexed", "partitioned"].includes(study.mode) ||
    !Array.isArray(study.transcript) ||
    !Array.isArray(study.coverage)
  )
    throw fault("Supplied source-read history has an invalid structure.");
  if (
    study.mode === "partitioned" &&
    (study.outputPlan?.scope !== "project" ||
      typeof study.outputPlan.title !== "string" ||
      !Array.isArray(study.outputPlan.parts) ||
      !study.outputPlan.parts.length ||
      study.outputPlan.parts.some(
        (part) =>
          !part ||
          typeof part.id !== "string" ||
          typeof part.title !== "string" ||
          !Array.isArray(part.sceneIds) ||
          part.sceneIds.some((id) => typeof id !== "string"),
      ) ||
      new Set(study.outputPlan.parts.map((part) => part.id)).size !==
        study.outputPlan.parts.length)
  )
    throw fault("Supplied output-part history has an invalid plan.");
  return {
    mode: study.mode,
    ...(study.mode === "partitioned"
      ? { outputPlan: JSON.parse(JSON.stringify(study.outputPlan)) }
      : {}),
    transcript: study.transcript.map((entry) => {
      if (
        !entry ||
        typeof entry.prompt !== "string" ||
        typeof entry.response !== "string"
      )
        throw fault(
          "Supplied source-read history must retain each complete request and response.",
        );
      return {
        prompt: entry.prompt,
        response: entry.response,
        usage: entry.usage ?? null,
      };
    }),
    coverage: study.coverage.map((entry) => {
      if (
        !entry ||
        typeof entry.recordId !== "string" ||
        !positive(entry.totalParts) ||
        !Array.isArray(entry.readParts) ||
        entry.readParts.some(
          (part) =>
            !Number.isSafeInteger(part) || part < 0 || part >= entry.totalParts,
        ) ||
        new Set(entry.readParts).size !== entry.readParts.length
      )
        throw fault("Supplied source-read coverage is invalid.");
      return {
        recordId: entry.recordId,
        required: Boolean(entry.required),
        totalParts: entry.totalParts,
        readParts: [...entry.readParts],
      };
    }),
  };
}
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
    const purpose = artifact.purpose ?? group.root.purpose ?? null;
    if (
      purpose !== null &&
      (!Object.hasOwn(KNOWLEDGE_TYPES, purpose) ||
        group.area !== "documents" ||
        purpose !== (group.root.purpose ?? null))
    )
      throw fault(
        "Supplied notes and learnings must retain one purpose in Production docs.",
      );
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
      ...(purpose ? { purpose } : {}),
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
        contextStudy: retainedStudy(source.contextStudy),
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
