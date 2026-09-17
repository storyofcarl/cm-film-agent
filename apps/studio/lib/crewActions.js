export const CREW_BATCH_KINDS = [
  "intake",
  "assets",
  "lookdev",
  "production",
  "previs",
  "boards",
  "burst-boards",
  "burst-assets",
  "revision",
  "finishing",
];
export function crewNextActions(value) {
  return (Array.isArray(value) ? value : [])
    .filter((action) => CREW_BATCH_KINDS.includes(action?.kind))
    .slice(0, 6)
    .map((action) => ({
      kind: action.kind,
      title: String(action.title || `Prepare ${action.kind} batch`),
      reason: String(action.reason || ""),
    }));
}
