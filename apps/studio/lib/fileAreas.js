export const FILE_AREAS = {
  assets: "Assets",
  footage: "Footage",
  scripts: "Scripts",
  documents: "Production docs",
  audio: "Audio",
};

export function fileArea(entry) {
  if (Object.hasOwn(FILE_AREAS, entry.area)) return entry.area;
  if (entry.kind === "image") return "assets";
  if (entry.kind === "video") return "footage";
  if (entry.kind === "audio") return "audio";
  return /\.fountain$|screenplay|\bscript\b/i.test(entry.title || "")
    ? "scripts"
    : "documents";
}
