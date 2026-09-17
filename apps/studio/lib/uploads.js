export const DOCUMENT_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/markdown",
  fountain: "text/plain",
  json: "application/json",
};
export const MEDIA_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
};
export const UPLOAD_ACCEPT = Object.keys({ ...DOCUMENT_TYPES, ...MEDIA_TYPES })
  .map((extension) => `.${extension}`)
  .join(",");
export const documentExtension = (name) =>
  String(name).split(".").pop().toLowerCase();
