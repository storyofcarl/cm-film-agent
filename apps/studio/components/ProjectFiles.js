import UploadInbox from "./UploadInbox";
import DocumentCard from "./DocumentCard";
import PromptField from "./PromptField";
import { documentGroups, KNOWLEDGE_TYPES } from "../lib/documents";
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
  const draftKey = `knowledge-draft:${project.id}`;
  const draft = documentDrafts[draftKey];
  const updateDraft = (change) =>
    setDocumentDrafts((current) => ({
      ...current,
      [draftKey]: { ...current[draftKey], ...change },
    }));
  const clearDraft = () =>
    setDocumentDrafts((current) => {
      const next = { ...current };
      delete next[draftKey];
      return next;
    });
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
      {area === "documents" && (
        <section
          className="overview-card"
          aria-label="Project notes and learnings"
        >
          <div className="section-actions">
            <h2>Notes & learnings</h2>
            <div className="button-row">
              <button
                type="button"
                className="secondary compact"
                disabled={busy || Boolean(draft)}
                onClick={() =>
                  updateDraft({ purpose: "note", title: "", content: "" })
                }
              >
                Add note
              </button>
              <button
                type="button"
                className="secondary compact"
                disabled={busy || Boolean(draft)}
                onClick={() =>
                  updateDraft({ purpose: "learning", title: "", content: "" })
                }
              >
                Add learning
              </button>
            </div>
          </div>
          <p className="muted">
            Project direction, decisions and lessons stay available to chat
            across tasks. Include the shot or test behind a learning.
          </p>
          {draft && (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const saved = await command("document.add", {
                  ...draft,
                  title: draft.title.trim() || KNOWLEDGE_TYPES[draft.purpose],
                  area: "documents",
                });
                if (!saved) return;
                const created = saved.artifacts.find(
                  (entry) =>
                    !project.artifacts.some((before) => before.id === entry.id),
                );
                clearDraft();
                if (created) onInspectDocument(created.id);
              }}
            >
              <label className="field">
                Title
                <input
                  aria-label="Note title"
                  value={draft.title}
                  maxLength={300}
                  onChange={(event) =>
                    updateDraft({ title: event.target.value })
                  }
                  placeholder={KNOWLEDGE_TYPES[draft.purpose]}
                />
              </label>
              <PromptField
                label={
                  draft.purpose === "learning" ? "Learning" : "Project note"
                }
                rows={6}
                value={draft.content}
                onChange={(event) =>
                  updateDraft({ content: event.target.value })
                }
              />
              <div className="button-row">
                <button
                  type="submit"
                  className="primary"
                  disabled={busy || !draft.content.trim()}
                >
                  Save {draft.purpose}
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={clearDraft}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}
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
