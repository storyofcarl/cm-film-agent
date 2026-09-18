import { documentGroups } from "./documents";

export function suppliedDocumentGroups(project) {
  const supplied = {
    ...project,
    artifacts: project.artifacts.filter((entry) => entry.origin === "imported"),
  };
  return ["scripts", "documents"].flatMap((area) =>
    documentGroups(supplied, area),
  );
}

export function importSummary(project, report = {}) {
  const documents = suppliedDocumentGroups(project);
  const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
  const parts = [];
  if (documents.length)
    parts.push(
      `${plural(documents.length, "document")} (${plural(
        documents.reduce((sum, group) => sum + group.versions.length, 0),
        "version",
      )})`,
    );
  if (project.assets.length) parts.push(plural(project.assets.length, "asset"));
  if (project.shots.length) parts.push(plural(project.shots.length, "shot"));
  return `Imported ${parts.join(", ") || "project structure"}. Completeness review is pending.${report.gaps?.length ? ` ${plural(report.gaps.length, "intake finding")} to review.` : ""}`;
}
