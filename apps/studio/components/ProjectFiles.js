import UploadInbox from "./UploadInbox";
import DocumentCard from "./DocumentCard";
import { documentGroups } from "../lib/documents";
import { FILE_AREAS, fileArea } from "../lib/fileAreas";

export default function ProjectFiles({
  project,
  area,
  busy,
  command,
  onUpload,
  focusDocumentId,
  documentDrafts,
  setDocumentDrafts,
  onInspectDocument,
}) {
  const entries = (project.inbox || []).filter(
    (entry) => fileArea(entry) === area,
  );
  const documents = ["scripts", "documents"].includes(area)
    ? documentGroups(project, area).sort(
        (a, b) =>
          Number(b.versions.some((entry) => entry.id === focusDocumentId)) -
          Number(a.versions.some((entry) => entry.id === focusDocumentId)),
      )
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
      {documents.map((group) => (
        <DocumentCard
          key={group.id}
          {...{ project, group, area, busy, command }}
          initialVersionId={
            group.versions.some((entry) => entry.id === focusDocumentId)
              ? focusDocumentId
              : null
          }
          drafts={documentDrafts}
          setDrafts={setDocumentDrafts}
          onInspect={onInspectDocument}
        />
      ))}
    </section>
  );
}
