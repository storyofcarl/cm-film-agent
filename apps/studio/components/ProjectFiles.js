import UploadInbox from "./UploadInbox";
import PromptField from "./PromptField";
import { FILE_AREAS, fileArea } from "../lib/fileAreas";

export default function ProjectFiles({
  project,
  area,
  busy,
  command,
  onUpload,
}) {
  const entries = (project.inbox || []).filter(
    (entry) => fileArea(entry) === area,
  );
  const documents = ["scripts", "documents"].includes(area)
    ? project.artifacts.filter((artifact) => {
        if (artifact.sourceInboxId || artifact.instruction || artifact.proposal)
          return false;
        const isScript =
          /screenplay|screenwriting|film\.develop/.test(
            artifact.method || "",
          ) || /screenplay|\bscript\b/i.test(artifact.title || "");
        return area === "scripts" ? isScript : !isScript;
      })
    : [];
  return (
    <section className="project-files" aria-label={`${FILE_AREAS[area]} files`}>
      <div className="section-actions">
        <h2>Files</h2>
        <button
          type="button"
          className="secondary"
          title={`Upload to ${FILE_AREAS[area]}`}
          aria-label={`Upload to ${FILE_AREAS[area]}`}
          disabled={busy}
          onClick={() => onUpload(area)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.55"
            aria-hidden="true"
          >
            <path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5" />
          </svg>
        </button>
      </div>
      {!entries.length && !documents.length && (
        <p className="muted">No files here yet.</p>
      )}
      <UploadInbox {...{ project, area, busy, command }} />
      {documents.map((artifact) => (
        <article className="inbox-entry" key={artifact.id}>
          <h3>{artifact.title}</h3>
          <PromptField
            label={`${artifact.title} content`}
            value={artifact.content || ""}
            readOnly
            rows={12}
          />
        </article>
      ))}
    </section>
  );
}
