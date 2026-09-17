/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import ProjectStatus from "./ProjectStatus";
import {
  REVIEW_LABELS,
  selectedVersion,
  sceneShots,
  sceneSignature,
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

export function ReviewGrid({ items, busy, command, selectItem }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) &&
      (status === "all" || selectedVersion(item)?.review === status),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 24));
  const current = Math.min(page, pages - 1);
  return (
    <div>
      <div className="button-row">
        <label className="field">
          Find an asset or shot
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
          />
        </label>
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
        <span>
          {filtered.length} items · page {current + 1} of {pages}
        </span>
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
      </div>
      <div className="review-grid">
        {filtered.slice(current * 24, (current + 1) * 24).map((item) => {
          const version = selectedVersion(item);
          return (
            <article className="review-card" key={item.id}>
              <div className="review-media">
                <Media media={version?.media} title={item.title} />
              </div>
              <div className="review-body">
                <button
                  className="text-button"
                  onClick={() => selectItem(item)}
                >
                  <b>{item.title}</b>
                </button>
                <label className="field">
                  Selected version
                  <select
                    aria-label={`${item.title} version`}
                    disabled={busy || !item.versions.length}
                    value={item.selectedVersionId || ""}
                    onChange={(event) =>
                      command("version.select", {
                        itemId: item.id,
                        versionId: event.target.value,
                      })
                    }
                  >
                    {!item.versions.length && (
                      <option value="">No versions yet</option>
                    )}
                    {item.versions.map((entry) => (
                      <option value={entry.id} key={entry.id}>
                        V{entry.number} · {REVIEW_LABELS[entry.review]}
                      </option>
                    ))}
                  </select>
                </label>
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

export function HierarchyStrip({
  project,
  containerId,
  selectedId,
  onNavigate,
  onInspect,
  onShot,
  onAdd,
  onEdit,
}) {
  const container = project.nodes.find((node) => node.id === containerId);
  const children =
    container?.type === "scene"
      ? sceneShots(project, containerId)
      : project.nodes
          .filter((node) => node.parentId === (containerId || null))
          .sort((a, b) => a.order - b.order);
  const descendantShots = (id) => {
    const ids = new Set([id]);
    let size;
    do {
      size = ids.size;
      project.nodes
        .filter((node) => ids.has(node.parentId))
        .forEach((node) => ids.add(node.id));
    } while (ids.size !== size);
    return project.shots.filter((shot) => ids.has(shot.sceneId));
  };
  const addType =
    { scene: "shot", sequence: "scene", act: "sequence" }[container?.type] ||
    "act";
  return (
    <section
      className="project-strip"
      aria-label="Project strip"
      data-scope={containerId || project.id}
    >
      <div className="project-strip-heading">
        <h1 className="strip-project-title">{project.title}</h1>
        <div className="button-row strip-actions">
          <ProjectStatus project={project} onNavigate={onNavigate} />
          <button
            className="icon-button"
            aria-label={`Add ${addType}`}
            title={`Add ${addType}`}
            onClick={() => onAdd(addType)}
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
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          {container && (
            <button
              className="icon-button"
              aria-label={`Edit ${container.type}`}
              title={`Edit ${container.type}`}
              onClick={() => onEdit(container)}
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
                <path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="strip-track">
        <button
          type="button"
          className="icon-button strip-up"
          aria-label="Up one level"
          title="Up one level"
          disabled={!container}
          onClick={() => onNavigate(container.parentId || null)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="m6 10 6-6 6 6M12 4v16" />
          </svg>
        </button>
        <div className="hierarchy-cards" key={containerId || project.id}>
          {children.map((node) => {
            const shots =
              node.kind === "shot" ? [node] : descendantShots(node.id);
            const take =
              node.kind === "shot"
                ? selectedVersion(node)
                : shots
                    .map(selectedVersion)
                    .find((version) => version?.media?.url);
            return (
              <div className="hierarchy-entry" key={node.id}>
                <button
                  key={node.id}
                  className={`hierarchy-card ${node.id === selectedId ? "selected" : ""}`}
                  data-kind={node.type || "shot"}
                  title={`${node.code || node.id} · ${node.title}`}
                  aria-label={`${node.code || node.id} · ${node.title}`}
                  aria-pressed={node.id === selectedId}
                  onClick={() =>
                    node.kind === "shot" ? onShot(node) : onInspect(node)
                  }
                >
                  <div>
                    {take?.media?.type === "image" ? (
                      <img src={take.media.url} alt="" />
                    ) : take?.media?.type === "video" ? (
                      <video
                        muted
                        preload="metadata"
                        src={take.media.url + "#t=0.1"}
                      />
                    ) : (
                      <span aria-hidden="true">—</span>
                    )}
                  </div>
                  <span className="strip-thumb-caption">
                    <span>{node.code || node.id}</span>
                    <span>
                      {shots
                        .reduce(
                          (sum, shot) => sum + Number(shot.duration || 0),
                          0,
                        )
                        .toFixed(1)}
                      s
                    </span>
                  </span>
                </button>
                {node.kind !== "shot" && (
                  <button
                    type="button"
                    className="strip-down"
                    aria-label={`Open ${node.code || node.id} contents`}
                    title={`Open ${node.title} contents`}
                    onClick={() => onNavigate(node.id)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M6 4v12h13m-5-5 5 5-5 5" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
          {!children.length && (
            <p className="strip-empty">
              No {container?.type === "scene" ? "shots" : "items"} here yet. Add
              one to begin.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

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
