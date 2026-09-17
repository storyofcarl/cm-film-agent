import crypto from "node:crypto";
import { createAdminSupabase } from "../../../../utils/server/supabase";
import { requestContext } from "../../../../utils/server/requestContext";
import { fault } from "./errors";

export const RECORD_BUCKET = "studio-records";
export const TRANSFER_THRESHOLD = 2 * 1024 * 1024;
export const MAX_TRANSFER_BYTES = 500 * 1024 * 1024;
const CHUNK_BYTES = 4 * 1024 * 1024;
const TEXT_THRESHOLD = 2048;
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const bucket = () => createAdminSupabase().storage.from(RECORD_BUCKET);
const owner = () => requestContext().user.id;
const validId = (id) => typeof id === "string" && /^[\w-]{1,100}$/.test(id);
const memo = () => (requestContext().studioRecordCache ||= new Map());

async function pooled(values, operation) {
  let index = 0;
  const outcomes = await Promise.allSettled(
    Array.from({ length: Math.min(8, values.length) }, async () => {
      while (index < values.length) await operation(values[index++]);
    }),
  );
  const failure = outcomes.find((outcome) => outcome.status === "rejected");
  if (failure) throw failure.reason;
}
async function putObject(path, bytes) {
  const { error } = await bucket().upload(path, bytes, {
    contentType: "application/json",
    upsert: false,
  });
  // The private bucket only accepts server writes (or a single import ticket).
  // Identical content hashes can already exist; records are never overwritten.
  if (
    error &&
    !["409", "Duplicate"].includes(String(error.statusCode || error.code))
  )
    throw fault("Production records could not be retained.", 503);
}
const partPath = (path, index) =>
  `${path}.part-${String(index).padStart(4, "0")}`;
const contentPartPath = (path, digest) =>
  `${path.slice(0, path.lastIndexOf("/"))}/chunks/${digest}.json`;
async function download(path) {
  const { data, error } = await bucket().download(path);
  if (error || !data || data.size > CHUNK_BYTES)
    throw fault("A retained production record is unavailable.", 503);
  return Buffer.from(await data.arrayBuffer());
}
async function put(path, bytes) {
  if (bytes.length > MAX_TRANSFER_BYTES)
    throw fault("A production record exceeds the current 500 MB limit.");
  if (bytes.length <= CHUNK_BYTES) {
    await putObject(path, bytes);
    return [{ path, bytes: bytes.length, sha256: hash(bytes) }];
  }
  const parts = Array.from(
    { length: Math.ceil(bytes.length / CHUNK_BYTES) },
    (_, index) => {
      const part = bytes.subarray(
        index * CHUNK_BYTES,
        (index + 1) * CHUNK_BYTES,
      );
      return {
        path: contentPartPath(path, hash(part)),
        bytes: part.length,
        sha256: hash(part),
        data: part,
      };
    },
  );
  await pooled(parts, async (part) => putObject(part.path, part.data));
  const descriptors = parts.map(({ data, ...part }) => part);
  await putObject(
    path,
    Buffer.from(
      JSON.stringify({
        format: "studio-chunks-v1",
        bytes: bytes.length,
        sha256: hash(bytes),
        parts: descriptors.map(({ path: _path, ...part }) => part),
      }),
    ),
  );
  return descriptors;
}
async function recordBytes(path, reference) {
  let bytes = await download(path);
  if (
    bytes.length !== reference.bytes ||
    hash(bytes) !== reference.$studioText
  ) {
    let manifest;
    try {
      manifest = JSON.parse(bytes.toString("utf8"));
    } catch {
      /* Integrity error below. */
    }
    if (
      manifest?.format !== "studio-chunks-v1" ||
      manifest.bytes !== reference.bytes ||
      manifest.sha256 !== reference.$studioText ||
      !Array.isArray(manifest.parts) ||
      manifest.parts.length !== Math.ceil(reference.bytes / CHUNK_BYTES) ||
      manifest.parts.some(
        (part, index) =>
          part.bytes !==
            Math.min(CHUNK_BYTES, reference.bytes - index * CHUNK_BYTES) ||
          !/^[a-f0-9]{64}$/.test(part.sha256),
      )
    )
      throw fault(
        "A retained production record failed its integrity check.",
        503,
      );
    const results = new Array(manifest.parts.length);
    await pooled(
      manifest.parts.map((part, index) => ({ ...part, index })),
      async (part) => {
        const value = await download(contentPartPath(path, part.sha256));
        if (value.length !== part.bytes || hash(value) !== part.sha256)
          throw fault(
            "A retained production record failed its integrity check.",
            503,
          );
        results[part.index] = value;
      },
    );
    bytes = Buffer.concat(results);
  }
  if (bytes.length !== reference.bytes || hash(bytes) !== reference.$studioText)
    throw fault(
      "A retained production record failed its integrity check.",
      503,
    );
  return bytes;
}
function textPath(projectId, digest) {
  if (!validId(projectId) || !/^[a-f0-9]{64}$/.test(digest))
    throw fault("Invalid production record.");
  return `${owner()}/${projectId}/text/${digest}.json`;
}

export async function packProject(project) {
  if (!validId(project.id)) throw fault("Choose a valid production.");
  if (
    Buffer.byteLength(JSON.stringify(project)) >
    MAX_TRANSFER_BYTES - 20 * 1024 * 1024
  )
    throw fault(
      "This production exceeds the current 480 MB in-memory project capacity. Existing saved history is unchanged.",
    );
  const pending = new Map();
  function visit(value) {
    if (
      typeof value === "string" &&
      Buffer.byteLength(value, "utf8") >= TEXT_THRESHOLD
    ) {
      const bytes = Buffer.from(JSON.stringify(value));
      const digest = hash(bytes);
      const path = textPath(project.id, digest);
      if (!memo().has(path)) pending.set(path, { bytes, value });
      return { $studioText: digest, bytes: bytes.length };
    }
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === "object") {
      if (Object.hasOwn(value, "$studioText"))
        throw fault(
          "Storage references cannot be supplied as production content.",
        );
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, visit(entry)]),
      );
    }
    return value;
  }
  const document = visit(project);
  // Only the operational index is bounded here; retained text is externalized.
  if (Buffer.byteLength(JSON.stringify(document)) > 12 * 1024 * 1024)
    throw fault(
      "The production's object index exceeds current capacity. Existing saved work is unchanged; no history was removed.",
    );
  await pooled([...pending], async ([path, { bytes, value }]) => {
    await put(path, bytes);
    memo().set(path, value);
  });
  return document;
}

export async function hydrateProject(document) {
  const pending = new Map();
  function scan(value) {
    if (!value || typeof value !== "object") return;
    if (Object.hasOwn(value, "$studioText")) {
      if (
        Object.keys(value).length !== 2 ||
        !Number.isSafeInteger(value.bytes) ||
        value.bytes < 1 ||
        value.bytes > MAX_TRANSFER_BYTES
      )
        throw fault("A retained production record is invalid.", 503);
      const path = textPath(document.id, value.$studioText);
      if (!memo().has(path)) pending.set(path, value);
      return;
    }
    for (const entry of Object.values(value)) scan(entry);
  }
  scan(document);
  await pooled([...pending], async ([path, reference]) => {
    const bytes = await recordBytes(path, reference);
    let text;
    try {
      text = JSON.parse(bytes.toString("utf8"));
    } catch {
      throw fault("A retained production record is invalid.", 503);
    }
    if (typeof text !== "string")
      throw fault("A retained production text record is invalid.", 503);
    memo().set(path, text);
  });
  function visit(value) {
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === "object") {
      if (Object.hasOwn(value, "$studioText"))
        return memo().get(textPath(document.id, value.$studioText));
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, visit(entry)]),
      );
    }
    return value;
  }
  return visit(document);
}

export async function projectResponse(value) {
  if (!value?.project?.id) return value;
  const bytes = Buffer.from(JSON.stringify(value));
  if (bytes.length <= TRANSFER_THRESHOLD) return value;
  if (!validId(value.project.id) || bytes.length > MAX_TRANSFER_BYTES)
    throw fault(
      "This production exceeds the current transfer capacity; its saved records remain intact.",
    );
  const digest = hash(bytes);
  // Never refresh a signed link to an old cleanup bucket. Deduplicate within the
  // current hour, then let maintenance remove whole expired transfer buckets.
  const hour = Math.floor(Date.now() / 3600000);
  const path = `${owner()}/${value.project.id}/transfers/v2/${hour}/${digest}.json`;
  const parts = await put(path, bytes);
  const signed = new Array(parts.length);
  await pooled(
    parts.map((part, index) => ({ ...part, index })),
    async (part) => {
      const { data, error } = await bucket().createSignedUrl(part.path, 300);
      if (error || !data?.signedUrl)
        throw fault("Could not prepare the private production download.", 503);
      signed[part.index] = {
        url: data.signedUrl,
        bytes: part.bytes,
        sha256: part.sha256,
      };
    },
  );
  return {
    $studioTransfer: {
      parts: signed,
      sha256: digest,
      bytes: bytes.length,
    },
  };
}

export async function signProjectImport(size) {
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_TRANSFER_BYTES)
    throw fault("Choose a project file between 1 byte and 500 MB.");
  const path = `${owner()}/imports/${crypto.randomUUID()}.json`;
  const parts = Array.from(
    { length: Math.ceil(size / CHUNK_BYTES) },
    (_, index) => ({
      path: partPath(path, index),
      bytes: Math.min(CHUNK_BYTES, size - index * CHUNK_BYTES),
    }),
  );
  const tickets = new Array(parts.length);
  await pooled(
    parts.map((part, index) => ({ ...part, index })),
    async (part) => {
      const { data, error } = await bucket().createSignedUploadUrl(part.path, {
        upsert: false,
      });
      if (error || !data?.token)
        throw fault("Could not prepare the private import upload.", 503);
      tickets[part.index] = {
        path: part.path,
        bytes: part.bytes,
        token: data.token,
      };
    },
  );
  await putObject(
    path,
    Buffer.from(JSON.stringify({ format: "studio-import-v1", bytes: size })),
  );
  return { bucket: RECORD_BUCKET, path, parts: tickets };
}
export async function readProjectImport(path) {
  const prefix = `${owner()}/imports/`;
  if (
    typeof path !== "string" ||
    !path.startsWith(prefix) ||
    !/^[a-f0-9-]{36}\.json$/.test(path.slice(prefix.length))
  )
    throw fault("Choose your own uploaded project file.", 403);
  const cleanup = [path];
  try {
    const manifest = JSON.parse((await download(path)).toString("utf8"));
    if (
      manifest.format !== "studio-import-v1" ||
      !Number.isSafeInteger(manifest.bytes) ||
      manifest.bytes < 1 ||
      manifest.bytes > MAX_TRANSFER_BYTES
    )
      throw fault("The import ticket is invalid.");
    const parts = Array.from(
      { length: Math.ceil(manifest.bytes / CHUNK_BYTES) },
      (_, index) => partPath(path, index),
    );
    cleanup.push(...parts);
    const results = new Array(parts.length);
    await pooled(
      parts.map((part, index) => ({ path: part, index })),
      async (part) => {
        const bytes = await download(part.path);
        if (
          bytes.length !==
          Math.min(CHUNK_BYTES, manifest.bytes - part.index * CHUNK_BYTES)
        )
          throw fault("An uploaded project part is incomplete.");
        results[part.index] = bytes;
      },
    );
    try {
      return JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(
          Buffer.concat(results),
        ),
      );
    } catch {
      throw fault("The uploaded project is not valid JSON.");
    }
  } finally {
    // Only the temporary import copy is removed; never a retained text record.
    await bucket().remove(cleanup);
  }
}
