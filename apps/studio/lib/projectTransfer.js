import { getBrowserSupabase } from "../../../utils/supabase/browser";

const digest = async (bytes) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
const locatedParts = (parts) => {
  let offset = 0;
  return parts.map((part) => {
    const result = { ...part, offset };
    offset += part.bytes;
    return result;
  });
};
async function grouped(parts, operation) {
  for (let start = 0; start < parts.length; start += 4) {
    const outcomes = await Promise.allSettled(
      parts.slice(start, start + 4).map(operation),
    );
    const failed = outcomes.find((outcome) => outcome.status === "rejected");
    if (failed) throw failed.reason;
  }
}

export async function resolveProjectResponse(value) {
  const transfer = value?.$studioTransfer;
  if (!transfer) return value;
  const storage = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const parts = transfer.parts || [
    { url: transfer.url, sha256: transfer.sha256, bytes: transfer.bytes },
  ];
  const validPart = (part) => {
    try {
      const location = new URL(part.url);
      return (
        location.origin === storage.origin &&
        location.pathname.startsWith(
          "/storage/v1/object/sign/studio-records/",
        ) &&
        /^[a-f0-9]{64}$/.test(part.sha256) &&
        Number.isSafeInteger(part.bytes) &&
        part.bytes > 0 &&
        part.bytes <= 4 * 1024 * 1024
      );
    } catch {
      return false;
    }
  };
  if (
    !/^[a-f0-9]{64}$/.test(transfer.sha256) ||
    !Number.isSafeInteger(transfer.bytes) ||
    transfer.bytes < 1 ||
    transfer.bytes > 500 * 1024 * 1024 ||
    !Array.isArray(parts) ||
    !parts.length ||
    parts.length > 125 ||
    !parts.every(validPart) ||
    parts.reduce((sum, part) => sum + part.bytes, 0) !== transfer.bytes
  )
    throw new Error("The private production download is invalid.");
  const bytes = new Uint8Array(transfer.bytes);
  await grouped(locatedParts(parts), async (part) => {
    const response = await fetch(part.url, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(
        "The private production download expired or failed. Reload the production.",
      );
    const data = await response.arrayBuffer();
    if (data.byteLength !== part.bytes || (await digest(data)) !== part.sha256)
      throw new Error(
        "The production download did not match its saved record. Reload the production.",
      );
    bytes.set(new Uint8Array(data), part.offset);
  });
  if ((await digest(bytes)) !== transfer.sha256)
    throw new Error(
      "The production download did not match its saved record. Reload the production.",
    );
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

export async function uploadProjectFile(file) {
  if (!file.size || file.size > 500 * 1024 * 1024)
    throw new Error("Choose a project file smaller than 500 MB.");
  const response = await fetch("/api/studio/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ size: file.size }),
  });
  const ticket = await response.json();
  if (!response.ok)
    throw new Error(ticket.error || "Could not prepare the project upload.");
  const parts = locatedParts(ticket.parts);
  if (parts.reduce((sum, part) => sum + part.bytes, 0) !== file.size)
    throw new Error("The project upload ticket is incomplete.");
  await grouped(parts, async (part) => {
    const { error } = await getBrowserSupabase()
      .storage.from("studio-records")
      .uploadToSignedUrl(
        part.path,
        part.token,
        file.slice(part.offset, part.offset + part.bytes, "application/json"),
        { contentType: "application/json" },
      );
    if (error) throw error;
  });
  return ticket.path;
}
