/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import {
  REVIEW_LABELS,
  selectedVersion,
  sceneShots,
  sceneSignature,
  contextShots,
} from "../lib/domain";

function Media({ media, title = "" }) {
  return media?.url ? (
    media.type === "video" ? (
      <video controls preload="metadata" src={media.url} />
    ) : (
      <img src={media.url} alt={title} />
    )
  ) : (
    <span className="muted">No media yet</span>
  );
}

export function ReviewGrid({
  items,
  busy,
  command,
  selectItem,
  project,
  editable = false,
  actions,
  assetTypes = false,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [type, setType] = useState("all");
  const [inspectedVersions, setInspectedVersions] = useState({});
  const inspectedVersion = (item) =>
    item.versions?.find(
      (version) => version.id === inspectedVersions[item.id],
    ) || selectedVersion(item);
  const containers = items.some((item) => !item.kind);
  const edit = (id, key, value) =>
    setDrafts((previous) => ({
      ...previous,
      [id]: { ...previous[id], [key]: value },
    }));
  const filtered = items.filter(
    (item) =>
      `${item.code || item.id} ${item.title}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (type === "all" || item.type === type) &&
      (status === "all" || selectedVersion(item)?.review === status),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 24));
  const current = Math.min(page, pages - 1);
  return (
    <div>
      <div className="button-row collection-toolbar">
        <label className="field">
          Find an item
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
          />
        </label>
        {assetTypes && (
          <label className="field">
            Asset type
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(0);
              }}
            >
              <option value="all">All types</option>
              {[...new Set(items.map((item) => item.type))]
                .filter(Boolean)
                .sort()
                .map((value) => (
                  <option key={value} value={value}>
                    {value[0].toUpperCase() + value.slice(1)}
                  </option>
                ))}
            </select>
          </label>
        )}
        {!containers && (
          <label className="field">
            Review filter
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(0);
              }}
            >
              <option value="all">All selected versions</option>
              {Object.entries(REVIEW_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
        <span>
          {filtered.length} items
          {pages > 1 ? ` · page ${current + 1} of ${pages}` : ""}
        </span>
        {pages > 1 && (
          <>
            <button
              className="secondary"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              Previous page
            </button>
            <button
              className="secondary"
              disabled={current + 1 >= pages}
              onClick={() => setPage(current + 1)}
            >
              Next page
            </button>
          </>
        )}
        {actions}
      </div>
      {editable && Object.keys(drafts).length > 0 && (
        <div className="button-row grid-save">
          <span>{Object.keys(drafts).length} items changed</span>
          <button
            className="secondary"
            disabled={busy}
            onClick={async () => {
              const result = await command("grid.update", {
                updates: Object.entries(drafts).map(([id, fields]) => ({
                  id,
                  ...fields,
                })),
              });
              if (result) setDrafts({});
            }}
          >
            Save grid changes
          </button>
        </div>
      )}
      <div className="review-grid">
        {filtered.slice(current * 24, (current + 1) * 24).map((item) => {
          const version = inspectedVersion(item);
          const shots =
            !item.kind && project ? contextShots(project, item.id) : [];
          const thumbnail =
            version?.media ||
            shots.map(selectedVersion).find((entry) => entry?.media)?.media;
          return (
            <article className="review-card" key={item.id}>
              <div className="review-media">
                <Media media={thumbnail} title={item.title} />
              </div>
              <div className="review-body">
                <span className="object-code">
                  {item.code || item.id}
                  {item.kind === "asset" ? ` · ${item.type}` : ""}
                </span>
                <button
                  className="text-button"
                  onClick={() => selectItem(item, version?.id)}
                >
                  <b>{item.title}</b>
                </button>
                {editable && (
                  <>
                    <label className="field">
                      Title
                      <input
                        aria-label={`${item.code || item.id} title`}
                        disabled={busy}
                        value={drafts[item.id]?.title ?? item.title}
                        onChange={(event) =>
                          edit(item.id, "title", event.target.value)
                        }
                      />
                    </label>
                    {item.kind === "shot" ? (
                      <label className="field">
                        Runtime (seconds)
                        <input
                          aria-label={`${item.code || item.id} runtime`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          disabled={busy}
                          value={drafts[item.id]?.duration ?? item.duration}
                          onChange={(event) =>
                            edit(item.id, "duration", event.target.value)
                          }
                        />
                      </label>
                    ) : (
                      <p className="muted">
                        {shots.length} shots ·{" "}
                        {shots
                          .reduce(
                            (sum, shot) => sum + Number(shot.duration || 0),
                            0,
                          )
                          .toFixed(1)}
                        s
                      </p>
                    )}
                  </>
                )}
                {item.kind && (
                  <>
                    <label className="field">
                      Reviewing version
                      <select
                        aria-label={`${item.title} version`}
                        disabled={busy || !item.versions.length}
                        value={version?.id || ""}
                        onChange={(event) =>
                          setInspectedVersions((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                      >
                        {!item.versions.length && (
                          <option value="">No versions yet</option>
                        )}
                        {item.versions.map((entry) => (
                          <option value={entry.id} key={entry.id}>
                            V{entry.number} · {REVIEW_LABELS[entry.review]}
                            {entry.id === item.selectedVersionId
                              ? " · selected"
                              : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="muted collection-selection">
                      {selectedVersion(item)
                        ? `V${selectedVersion(item).number} selected for ${item.kind === "asset" ? "reference" : "edit"}`
                        : "Nothing selected"}
                    </p>
                    {version && version.id !== item.selectedVersionId && (
                      <button
                        className="secondary compact"
                        disabled={busy}
                        onClick={() =>
                          command("version.select", {
                            itemId: item.id,
                            versionId: version.id,
                          })
                        }
                      >
                        Use V{version.number} for{" "}
                        {item.kind === "asset" ? "reference" : "edit"}
                      </button>
                    )}
                    <label className="field">
                      Approval status
                      <select
                        aria-label={`${item.title} approval`}
                        className={`review-select ${version?.review}`}
                        disabled={busy || !version}
                        value={version?.review || "pending"}
                        onChange={(event) =>
                          command("version.review", {
                            itemId: item.id,
                            versionId: version.id,
                            review: event.target.value,
                          })
                        }
                      >
                        {Object.entries(REVIEW_LABELS).map(([value, label]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                {item.kind === "shot" && (
                  <div className="button-row">
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        command("item.move", { id: item.id, direction: "up" })
                      }
                    >
                      Move earlier
                    </button>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        command("item.move", { id: item.id, direction: "down" })
                      }
                    >
                      Move later
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export { default as HierarchyStrip } from "./ProjectStrip";

export function GuidesPanel({ project, busy, command }) {
  return (
    <section className="overview-card">
      <span className="eyebrow">STORYBOARDS, PREVIS & DESIGN BURSTS</span>
      <p>
        Review guides, then choose which ones inform production. Final character
        approval is not required for silhouette previs.
      </p>
      <div className="review-grid">
        {(project.guides || []).map((guide) => {
          const selected = project.shots.some((shot) =>
            shot.guideVersionIds?.includes(guide.id),
          );
          return (
            <article key={guide.id} className="review-card">
              <div className="review-media">
                <Media media={guide.media} title={guide.title} />
              </div>
              <div className="review-body">
                <span className="eyebrow">{guide.kind}</span>
                <h3>{guide.title}</h3>
                <label className="field">
                  Guide review
                  <select
                    value={guide.review}
                    disabled={busy}
                    onChange={(event) =>
                      command("guide.review", {
                        id: guide.id,
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
                {guide.kind === "design-candidate" ? (
                  <button
                    className="secondary full"
                    disabled={busy}
                    onClick={() => command("guide.promote", { id: guide.id })}
                  >
                    Use as asset candidate
                  </button>
                ) : (
                  <button
                    className="secondary full"
                    disabled={busy || guide.review !== "approved"}
                    onClick={() =>
                      command("guide.select", {
                        id: guide.id,
                        selected: !selected,
                      })
                    }
                  >
                    {selected
                      ? "Remove production reference"
                      : "Use as production reference"}
                  </button>
                )}
                <details>
                  <summary>Source & prompt</summary>
                  <pre>{guide.prompt}</pre>
                  {guide.timestamp != null && (
                    <p>Extracted at {guide.timestamp.toFixed(3)}s</p>
                  )}
                </details>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function DeliveryPanel({ project, sceneId, busy, action, command }) {
  return (
    <section className="overview-card">
      <span className="eyebrow">ASSEMBLY & DELIVERY</span>
      <p>
        Render a scene for review, or export the complete approved picture with
        its media links, edit timeline, versions and prompt history.
      </p>
      <div className="button-row">
        <button
          className="secondary"
          disabled={busy}
          onClick={() => action("review", { sceneId })}
        >
          Render selected scene
        </button>
        <button
          className="secondary"
          disabled={busy}
          onClick={() => action("render")}
        >
          Render picture
        </button>
        <button
          className="primary"
          disabled={busy}
          onClick={() => action("package")}
        >
          Download delivery package
        </button>
      </div>
      <p className="modal-hint">
        Hosted renders: up to 180 seconds / 30 shots. Longer productions use the
        delivery package with the local assembly tool. Download links last one
        hour; saved media and project recipes remain yours.
      </p>
      {(project.deliveries || []).map((delivery) => (
        <article className="delivery-card" key={delivery.id}>
          <h3>{delivery.title}</h3>
          <video controls preload="metadata" src={delivery.media.url} />
          <div className="button-row">
            {delivery.purpose === "scene-review" && (
              <button
                className="secondary"
                disabled={
                  busy ||
                  delivery.sceneSignature !==
                    sceneSignature(project, delivery.sceneId)
                }
                onClick={() =>
                  command("scene.approve", { sceneId: delivery.sceneId })
                }
              >
                {delivery.sceneSignature !==
                sceneSignature(project, delivery.sceneId)
                  ? "Edit changed — render current scene"
                  : "Approve this scene"}
              </button>
            )}
            <span className={`badge ${delivery.review}`}>
              {REVIEW_LABELS[delivery.review]}
            </span>
            {delivery.purpose !== "scene-review" && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  action("approve", {
                    deliveryId: delivery.id,
                    sceneId: delivery.sceneId,
                  })
                }
              >
                Approve this delivery
              </button>
            )}
            <a className="text-button" href={delivery.media.url} download>
              Download video
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}
