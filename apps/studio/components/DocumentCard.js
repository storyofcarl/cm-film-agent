import { useState } from "react";
import PromptField from "./PromptField";
import { REVIEW_LABELS } from "../lib/domain";
import { documentGroups, documentSource } from "../lib/documents";
import { methodLabel } from "../lib/methods";

export default function DocumentCard({
  project,
  group,
  area,
  busy,
  command,
  initialVersionId,
  drafts,
  setDrafts,
  onInspect,
}) {
  const [versionId, setVersionId] = useState(
    initialVersionId || group.versions.at(-1).id,
  );
  const version =
    group.versions.find((entry) => entry.id === versionId) ||
    group.versions.at(-1);
  const source = documentSource(project, version);
  const root = group.versions[0];
  const original = project.inbox?.find(
    (entry) => entry.id === (version.sourceInboxId || root.sourceInboxId),
  );
  const text = drafts[version.id] ?? version.content;
  const changed = text !== version.content;
  const clearDraft = () =>
    setDrafts((current) => {
      const next = { ...current };
      delete next[version.id];
      return next;
    });
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([version.content], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${version.title.replace(/[^a-zA-Z0-9_-]+/g, "-")}-v${version.number || 1}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <article
      className="document-card"
      aria-label={`${root.title} document`}
      onFocus={() => onInspect(version.id)}
    >
      <div className="section-actions">
        <h2>{version.title}</h2>
        <span className="object-code">{root.code}</span>
      </div>
      <div className="document-controls">
        <label className="field">
          Document version
          <select
            value={version.id}
            onChange={(event) => {
              setVersionId(event.target.value);
              onInspect(event.target.value);
            }}
          >
            {group.versions.map((entry) => (
              <option key={entry.id} value={entry.id}>
                V{entry.number || 1} ·{" "}
                {REVIEW_LABELS[entry.review] || "Pending review"}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Document approval
          <select
            className={`review-select ${version.review}`}
            value={version.review || "pending"}
            disabled={busy || changed}
            onChange={(event) =>
              command("artifact.review", {
                id: version.id,
                review: event.target.value,
              })
            }
          >
            {Object.entries(REVIEW_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="secondary" onClick={download}>
          Download V{version.number || 1}
        </button>
      </div>
      {original && (
        <p>
          <a href={original.source.url} target="_blank" rel="noreferrer">
            Open original upload
          </a>
        </p>
      )}
      {original?.warnings?.map((warning, index) => (
        <p className="gate-message" key={index}>
          {warning}
        </p>
      ))}
      <PromptField
        label="Document text"
        value={text || ""}
        rows={16}
        onChange={(event) =>
          setDrafts((current) => ({
            ...current,
            [version.id]: event.target.value,
          }))
        }
      />
      <div className="button-row">
        <button
          type="button"
          className="secondary"
          disabled={busy || !changed || !text.trim()}
          onClick={async () => {
            const saved = await command("document.revise", {
              id: version.id,
              content: text,
            });
            if (!saved) return;
            const next = documentGroups(saved, area)
              .find((entry) => entry.id === group.id)
              ?.versions.at(-1);
            clearDraft();
            if (next) {
              setVersionId(next.id);
              onInspect(next.id);
            }
          }}
        >
          Save new version
        </button>
        {changed && (
          <button type="button" className="text-button" onClick={clearDraft}>
            Discard changes
          </button>
        )}
        <small className="muted">
          {changed
            ? "Unsaved edits · save a new version before approval."
            : `${version.origin === "generated" ? "Generated draft" : version.origin === "manual" ? "Manual revision" : "Supplied document"} · ${version.createdAt ? new Date(version.createdAt).toLocaleDateString() : "Date not recorded"}`}
        </small>
      </div>
      {version.revisesId && (
        <p className="muted">
          Revises V
          {group.versions.find((entry) => entry.id === version.revisesId)
            ?.number || 1}
          ; earlier drafts are retained.
        </p>
      )}
      {source && (
        <details className="document-source">
          <summary>Source prompt and method</summary>
          {source.supplied && (
            <p className="muted">
              Supplied provenance · not independently verified.
            </p>
          )}
          <p>
            {methodLabel(source.method)} ·{" "}
            {source.model || "Model not recorded"}
          </p>
          <PromptField
            label="Document source prompt"
            value={source.prompt || ""}
            readOnly
            rows={8}
          />
          <PromptField
            label="Document source instructions"
            value={source.systemPrompt || ""}
            readOnly
            rows={8}
          />
          {source.methodVersion && (
            <p className="muted">Method version: {source.methodVersion}</p>
          )}
        </details>
      )}
    </article>
  );
}
