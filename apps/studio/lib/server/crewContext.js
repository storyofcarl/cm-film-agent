import crypto from "node:crypto";
import { fault } from "./errors";

export const CREW_CONTEXT_LIMIT = 650000;
const INLINE_LIMIT = 1800;
const PART_LIMIT = 48000;
const digest = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

// These are lossless transport parts, not creative segments or rewritten scenes.
function textParts(text) {
  const parts = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + PART_LIMIT, text.length);
    if (end < text.length) {
      const newline = text.lastIndexOf("\n", end - 1);
      if (newline >= start + PART_LIMIT / 2) end = newline + 1;
      const previous = text.charCodeAt(end - 1);
      const next = text.charCodeAt(end);
      if (
        previous >= 0xd800 &&
        previous <= 0xdbff &&
        next >= 0xdc00 &&
        next <= 0xdfff
      )
        end--;
    }
    parts.push({ start, end, text: text.slice(start, end) });
    start = end;
  }
  return parts;
}

export function createCrewLibrary(context) {
  const records = new Map();
  const currentDocuments = new Set();
  const groups = new Map();
  for (const document of context.documents || []) {
    const family = document.documentId || document.id;
    const versions = groups.get(family) || [];
    versions.push(document);
    groups.set(family, versions);
  }
  for (const versions of groups.values()) {
    const sorted = [...versions].sort(
      (a, b) => (a.number || 1) - (b.number || 1),
    );
    currentDocuments.add(sorted.at(-1).id);
    const approved = sorted
      .filter((document) => document.review === "approved")
      .at(-1);
    if (approved) currentDocuments.add(approved.id);
  }
  if (context.documentInspection)
    currentDocuments.add(context.documentInspection.id);

  function required(path) {
    if (["conversation", "productionState"].includes(path[0])) return false;
    if (path[0] === "documents")
      return currentDocuments.has(context.documents[path[1]].id);
    if (path[0] === "inspection" && path[1] === "versions") {
      const version = context.inspection.versions[path[2]];
      return [
        context.inspection.versionId,
        context.inspection.selectedVersionId,
      ].includes(version.id);
    }
    if (["assets", "shots"].includes(path[0]) && path[2] === "versions") {
      const item = context[path[0]][path[1]];
      return item.versions[path[3]].id === item.selectedVersionId;
    }
    return true;
  }
  function visit(value, path = []) {
    if (typeof value === "string" && value.length > INLINE_LIMIT) {
      const sha256 = digest(value);
      const id = `record_${digest(JSON.stringify(path) + sha256).slice(0, 24)}`;
      const parts = textParts(value);
      records.set(id, { id, path, sha256, parts, required: required(path) });
      return {
        recordId: id,
        characters: value.length,
        sha256,
        requiredForPreparation: required(path),
        parts: parts.map(({ start, end }, part) => ({ part, start, end })),
      };
    }
    if (Array.isArray(value))
      return value.map((entry, index) => visit(entry, [...path, index]));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
          key,
          visit(entry, [...path, key]),
        ]),
      );
    return value;
  }
  const index = visit(context);
  const seen = new Set();
  function read(requests) {
    if (!Array.isArray(requests) || !requests.length || requests.length > 8)
      throw fault(
        "A context read must request between one and eight indexed parts.",
      );
    // Validate the whole request before changing the coverage ledger.
    const resolved = requests.map((request) => {
      const record = records.get(request?.recordId);
      if (
        !record ||
        !Number.isSafeInteger(request.part) ||
        !record.parts[request.part]
      )
        throw fault(
          "The agent requested a record outside this production context.",
        );
      return {
        recordId: record.id,
        path: record.path,
        sha256: record.sha256,
        part: request.part,
        totalParts: record.parts.length,
        ...record.parts[request.part],
      };
    });
    for (const entry of resolved) seen.add(`${entry.recordId}:${entry.part}`);
    return resolved;
  }
  const coverage = () =>
    [...records.values()].map((record) => ({
      recordId: record.id,
      required: record.required,
      readParts: record.parts.flatMap((_, part) =>
        seen.has(`${record.id}:${part}`) ? [part] : [],
      ),
      totalParts: record.parts.length,
    }));
  const missing = () =>
    [...records.values()]
      .filter((record) => record.required)
      .flatMap((record) =>
        record.parts.flatMap((_, part) =>
          seen.has(`${record.id}:${part}`)
            ? []
            : [{ recordId: record.id, part }],
        ),
      );
  return { index, read, coverage, missing };
}

const decode = (value) => {
  try {
    return JSON.parse(
      value
        .trim()
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, ""),
    );
  } catch {
    return null;
  }
};

export async function queryCrewContext({
  context,
  instruction,
  systemPrompt,
  invoke,
}) {
  const original = `DIRECTOR'S REQUEST\n${instruction}\n\nCURRENT PRODUCTION (complete preparation context)\n${JSON.stringify(context)}`;
  if (original.length + systemPrompt.length <= CREW_CONTEXT_LIMIT) {
    return {
      prompt: original,
      result: await invoke(original, systemPrompt),
      contextStudy: null,
      systemPrompt,
    };
  }
  const library = createCrewLibrary(context);
  const studySystem = `${systemPrompt}\n\nINDEXED CONTEXT PROTOCOL
All production objects and document versions remain in the index; selection does not narrow the deliverable. A recordId descriptor is an exact retained text value, NOT its content. Read it before quoting, changing or claiming to have reviewed it. Return only JSON {"contextRequest":{"reads":[{"recordId":"...","part":0}],"notes":"cumulative working notes"}} to retrieve up to eight parts. Only records in this index are available; this is read-only and does not call production tools. The server supplies exact text, offsets, hashes and a coverage ledger. Parts are transport boundaries, not scene/shot/generation boundaries. Read all parts in order to inspect a complete document. Never fill in unseen text.
Each subsequent request includes the full index, cumulative coverage, your cumulative notes and the requested parts. Earlier parts are retained in the source audit but are not automatically repeated; carry forward relevant conclusions, unresolved questions and stable IDs in notes (maximum 40,000 characters), and reread exact parts when necessary. Never substitute those notes for the source text in a requested revision.
Before returning any proposal, writing documents or preparation actions, read every requiredForPreparation part, including current and approved source documents, active intent and inspected drafts. This is full-deliverable source coverage, not permission to execute. For ordinary discussion you may return coverageMode:"discussion" with no preparation outputs, but cannot claim complete-source review without reading it. For full-source analysis or preparation use coverageMode:"preparation" and the normal final response format. Do not silently narrow or truncate a deliverable to fit a response. There are at most 12 reasoning passes in this request; prioritize complete required source coverage and exact requested historical records.`;
  let notes = "";
  let parts = [];
  const transcript = [];
  const started = Date.now();
  for (let pass = 0; pass < 12; pass++) {
    const prompt = `DIRECTOR'S REQUEST\n${instruction}\n\nCURRENT PRODUCTION (indexed context)\n${JSON.stringify({ production: library.index, coverage: library.coverage(), notes, parts })}`;
    if (prompt.length + studySystem.length > CREW_CONTEXT_LIMIT)
      throw fault(
        "The indexed production request still exceeds the chat capacity. No production history was removed.",
      );
    if (Date.now() - started > 220000)
      throw fault(
        "This source study exceeded the current request time limit. No production changes were applied.",
      );
    const result = await invoke(prompt, studySystem);
    transcript.push({
      prompt,
      response: result.content,
      usage: result.usage || null,
    });
    const output = decode(result.content);
    if (output?.contextRequest) {
      if (
        typeof output.contextRequest.notes !== "string" ||
        output.contextRequest.notes.length > 40000
      )
        throw fault("The agent returned invalid context-study notes.");
      parts = library.read(output.contextRequest.reads);
      notes = output.contextRequest.notes;
      continue;
    }
    const preparation =
      output?.coverageMode !== "discussion" ||
      output?.proposal ||
      output?.documents ||
      output?.nextActions?.length;
    if (preparation && library.missing().length) {
      // No incomplete proposal enters the project. Supply the next source parts
      // automatically; the director does not manually partition the source.
      parts = library.read(library.missing().slice(0, 8));
      continue;
    }
    return {
      prompt,
      systemPrompt: studySystem,
      result,
      contextStudy: {
        mode: "indexed",
        coverage: library.coverage(),
        transcript,
      },
    };
  }
  throw fault(
    "This source study needs more than the current 12-pass request limit. No incomplete proposal was applied; all source history is preserved.",
  );
}
