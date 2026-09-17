/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { InspectDialog } from "./PromptField";
import PromptField from "./PromptField";
import { fileArea } from "../lib/fileAreas";

export default function UploadInbox({ project, busy, command, area = null }) {
  const [open, setOpen] = useState(false);
  const entries = (project.inbox || []).filter(
    (entry) =>
      (!area || fileArea(entry) === area) &&
      !(
        ["scripts", "documents"].includes(area) &&
        project.artifacts.some((artifact) => artifact.id === entry.artifactId)
      ),
  );
  if (!entries.length) return null;
  const objects = [...project.assets, ...project.shots];
  const Wrapper = area ? "section" : InspectDialog;
  return (
    <>
      {!area && (
        <button
          type="button"
          className="text-button inbox-summary"
          onClick={() => setOpen(true)}
        >
          Supplied work · {entries.length} files ·{" "}
          {entries.filter((entry) => entry.status === "needs-attention").length}{" "}
          need attention
        </button>
      )}
      {(area || open) && (
        <Wrapper title="Supplied work inbox" onClose={() => setOpen(false)}>
          <p>
            Original files stay with the project. Direct the crew to inventory
            them and propose where they belong, or assign media below.
            Assignment does not approve creative completeness.
          </p>
          {entries.map((entry) => (
            <article className="inbox-entry" key={entry.id}>
              <h3>
                {entry.code || entry.id} · {entry.title}
              </h3>
              <p>
                {entry.kind} ·{" "}
                {entry.status === "ready"
                  ? "Ready for crew review"
                  : "Needs attention"}
              </p>
              <a href={entry.source.url} target="_blank" rel="noreferrer">
                Open original
              </a>
              {entry.media?.type === "image" && (
                <img src={entry.media.url} alt={entry.title} loading="lazy" />
              )}
              {entry.media?.type === "video" && (
                <video controls preload="metadata" src={entry.media.url} />
              )}
              {entry.media?.type === "audio" && (
                <audio controls preload="metadata" src={entry.media.url} />
              )}
              {entry.extraction && (
                <p>
                  {entry.extraction.characters.toLocaleString()} characters
                  extracted
                  {entry.extraction.pages
                    ? ` · ${entry.extraction.pages} pages`
                    : ""}
                  . {entry.extraction.note}
                </p>
              )}
              {area && entry.artifactId && (
                <PromptField
                  label={`${entry.title} content`}
                  readOnly
                  rows={12}
                  value={
                    project.artifacts.find(
                      (artifact) => artifact.id === entry.artifactId,
                    )?.content || ""
                  }
                />
              )}
              {entry.warnings?.map((warning, index) => (
                <p className="gate-message" key={index}>
                  {warning}
                </p>
              ))}
              {entry.assignments?.map((assignment) => (
                <p key={`${assignment.targetId}:${assignment.purpose}`}>
                  Assigned to{" "}
                  {
                    objects.find((item) => item.id === assignment.targetId)
                      ?.code
                  }{" "}
                  ·{" "}
                  {
                    objects.find((item) => item.id === assignment.targetId)
                      ?.title
                  }{" "}
                  ({assignment.purpose})
                </p>
              ))}
              {entry.status === "ready" &&
                ["image", "video"].includes(entry.kind) && (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      command("inbox.assign", {
                        inboxId: entry.id,
                        targetId: data.get("target"),
                        purpose: data.get("purpose"),
                      });
                    }}
                  >
                    <label className="field">
                      Assign to
                      <select name="target" required defaultValue="">
                        <option value="" disabled>
                          Choose an existing object
                        </option>
                        {objects.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.code} · {item.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Use as
                      <select name="purpose">
                        <option value="version">
                          Supplied asset / shot version
                        </option>
                        <option
                          value={entry.kind === "image" ? "board" : "previs"}
                        >
                          {entry.kind === "image"
                            ? "Storyboard / production frame"
                            : "Previs reference"}
                        </option>
                      </select>
                    </label>
                    <button
                      className="secondary"
                      disabled={busy || !objects.length}
                    >
                      Assign supplied media
                    </button>
                  </form>
                )}
            </article>
          ))}
        </Wrapper>
      )}
    </>
  );
}
