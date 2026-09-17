/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { versionSources } from "../lib/provenance";
import PromptField, { InspectDialog } from "./PromptField";

function Media({ media, title }) {
  if (!media?.url) return <p>Source media is not recorded.</p>;
  if (media.type === "video")
    return (
      <video
        aria-label={title}
        src={media.url}
        controls
        playsInline
        preload="metadata"
      />
    );
  if (media.type === "audio")
    return (
      <audio aria-label={title} src={media.url} controls preload="metadata" />
    );
  return <img src={media.url} alt={title} loading="lazy" />;
}

function References({ project, references, known }) {
  return (
    <section className="generation-references" aria-label="Recorded references">
      <h3>References used</h3>
      {!references.length && (
        <p>
          {known
            ? "No references recorded for this request."
            : "Reference provenance is unknown for this version."}
        </p>
      )}
      <div className="reference-grid">
        {references.map((reference, index) => {
          const asset = project.assets.find(
            (entry) => entry.id === reference.assetId,
          );
          const assetVersion = asset?.versions.find(
            (entry) => entry.id === reference.versionId,
          );
          return (
            <figure key={`${index}:${reference.url}`}>
              <Media media={reference} title={`Reference ${index + 1}`} />
              <figcaption>
                {asset?.title || `Reference ${index + 1}`}
                {assetVersion ? ` · V${assetVersion.number}` : ""}
                {reference.role ? ` · ${reference.role}` : ""}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

export default function GenerationDetails({ project, item, version }) {
  const [open, setOpen] = useState(false);
  if (!version) return null;
  const sources = versionSources(project, item, version);
  return (
    <>
      <button
        type="button"
        className="secondary full"
        onClick={() => setOpen(true)}
      >
        View segments & references · V{version.number}
      </button>
      {open && (
        <InspectDialog
          title={`${item.title} · V${version.number} sources`}
          onClose={() => setOpen(false)}
        >
          <p>
            Viewing the sources of this exact version. Shot trims and approval
            remain separate from the full generated segment.
          </p>
          {!sources.length && (
            <>
              <p>
                {version.origin === "fixture"
                  ? "This demo version is an illustrated storyboard. No video segment was generated."
                  : "No generated source segment is linked to this version. Imported media may not include its original generation history."}
              </p>
              <PromptField
                label="Recorded version prompt"
                value={version.prompt || ""}
                readOnly
                rows={10}
              />
              <References
                project={project}
                references={version.references || []}
                known={
                  version.origin === "fixture" || version.references?.length > 0
                }
              />
            </>
          )}
          {sources.map((source, index) => (
            <section key={source.id} className="generation-source">
              <h3>
                {item.kind === "shot"
                  ? `Source segment ${index + 1}`
                  : `Source generation ${index + 1}`}{" "}
                · {source.title}
              </h3>
              <span className="object-code">{source.code}</span>
              <div className="source-media">
                <Media
                  media={source.media}
                  title={`Full source segment ${index + 1}`}
                />
              </div>
              <p>
                {source.ranges.length
                  ? `Used in this shot: ${source.ranges.map((range) => `${Number(range.in).toFixed(2)}–${Number(range.out).toFixed(2)}s`).join(", ")} of the source segment.`
                  : "No shot trim range recorded."}
              </p>
              <p>
                Model: {source.model || "Not recorded"} · Seed:{" "}
                {source.seed ?? "Not recorded"}
              </p>
              <PromptField
                label={`Segment ${index + 1} exact prompt`}
                value={source.prompt}
                readOnly
                rows={10}
              />
              <References
                project={project}
                references={source.references}
                known={source.referencesKnown}
              />
            </section>
          ))}
        </InspectDialog>
      )}
    </>
  );
}
