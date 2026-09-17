import { getBrowserSupabase } from "../../../utils/supabase/browser";
import { DOCUMENT_TYPES, MEDIA_TYPES, documentExtension } from "./uploads";

export async function uploadWork(file) {
  const extension = documentExtension(file.name);
  const contentType = DOCUMENT_TYPES[extension] || MEDIA_TYPES[extension];
  if (!contentType)
    throw new Error("Choose a supported document, image, video or audio file.");
  const limit = DOCUMENT_TYPES[extension] ? 20 : 500;
  if (!file.size || file.size > limit * 1024 * 1024)
    throw new Error(`Choose a file smaller than ${limit} MB.`);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  // The storage key format permits extensions of up to five characters.
  const storedExtension = extension === "fountain" ? "txt" : extension;
  const key =
    [...new Uint8Array(digest)]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32) +
    "." +
    storedExtension;
  const response = await fetch("/api/film/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sign", key, size: file.size, contentType }),
  });
  const ticket = await response.json();
  if (!response.ok) throw new Error(ticket.error || "Could not start upload.");
  const { error } = await getBrowserSupabase()
    .storage.from("film-media")
    .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType });
  if (error) throw error;
  return { key, name: file.name };
}
