/* eslint-disable @next/next/no-img-element */
import ProjectStatus from "./ProjectStatus";
import { useEffect, useRef, useState } from "react";
import { selectedVersion, sceneShots } from "../lib/domain";

// Creative order, not creation order, determines the continuous shot strip.
export function shotRanges(project) {
  const nodes = new Map(project.nodes.map((node) => [node.id, node]));
  const children = (parentId) =>
    project.nodes
      .filter((node) => (node.parentId || null) === parentId)
      .sort((a, b) => a.order - b.order);
  const scenes = [];
  const visit = (parentId) => {
    for (const node of children(parentId)) {
      if (node.type === "scene") scenes.push(node);
      else visit(node.id);
    }
  };
  visit(null);
  const acts = [];
  for (const scene of scenes) {
    const shots = sceneShots(project, scene.id);
    if (!shots.length) continue;
    let parent = nodes.get(scene.parentId),
      act = null,
      sequence = null;
    while (parent) {
      if (parent.type === "act") act = parent;
      if (parent.type === "sequence") sequence = parent;
      parent = nodes.get(parent.parentId);
    }
    let group = acts.at(-1);
    if (!group || group.node?.id !== act?.id) {
      group = { node: act, sequences: [] };
      acts.push(group);
    }
    let section = group.sequences.at(-1);
    if (!section || section.node?.id !== sequence?.id) {
      section = { node: sequence, scenes: [] };
      group.sequences.push(section);
    }
    const color =
      [...scene.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6;
    section.scenes.push({ node: scene, shots, color });
  }
  return acts;
}

export default function ProjectStrip({
  project,
  containerId,
  selectedId,
  onNavigate,
  onShot,
  onAdd,
  onEdit,
}) {
  const track = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const container = project.nodes.find((node) => node.id === containerId);
  const groups = shotRanges(project);
  useEffect(() => {
    const node = track.current;
    const update = () =>
      setEdges((previous) => {
        const next = {
          left: node.scrollLeft > 1,
          right: node.scrollLeft + node.clientWidth < node.scrollWidth - 1,
        };
        return next.left === previous.left && next.right === previous.right
          ? previous
          : next;
      });
    const wheel = (event) => {
      if (event.ctrlKey) return;
      const delta =
        (Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY) *
        (event.deltaMode === 1
          ? 24
          : event.deltaMode === 2
            ? node.clientWidth
            : 1);
      const next = Math.max(
        0,
        Math.min(node.scrollWidth - node.clientWidth, node.scrollLeft + delta),
      );
      if (next !== node.scrollLeft) {
        event.preventDefault();
        node.scrollLeft = next;
      }
    };
    const observer = new ResizeObserver(update);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    node.addEventListener("scroll", update, { passive: true });
    node.addEventListener("wheel", wheel, { passive: false });
    update();
    return () => {
      observer.disconnect();
      node.removeEventListener("scroll", update);
      node.removeEventListener("wheel", wheel);
    };
  }, [project.nodes, project.shots]);
  useEffect(() => {
    const node = track.current;
    const target =
      [...node.querySelectorAll("[data-shot-id]")].find(
        (entry) => entry.dataset.shotId === selectedId,
      ) ||
      [...node.querySelectorAll("[data-range-id]")].find(
        (entry) => entry.dataset.rangeId === containerId,
      );
    if (!target) return;
    const bounds = node.getBoundingClientRect(),
      item = target.getBoundingClientRect();
    if (item.left < bounds.left || item.right > bounds.right)
      node.scrollTo({
        left: node.scrollLeft + item.left - bounds.left,
        behavior: "instant",
      });
  }, [containerId, selectedId, project.id]);
  const pan = (direction) =>
    track.current.scrollBy({
      left: direction * Math.max(100, track.current.clientWidth * 0.75),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  const addType =
    { scene: "shot", sequence: "scene", act: "sequence" }[container?.type] ||
    "act";
  const label = (node, level) => (
    <div className={`strip-range-label ${level}`}>
      {node && (
        <button
          type="button"
          aria-label={`View ${node.type} ${node.code || node.id} ${node.title}`}
          title={node.title}
          aria-pressed={containerId === node.id}
          onClick={() => onNavigate(node.id)}
        >
          {node.code || node.id} · {node.title}
        </button>
      )}
    </div>
  );
  return (
    <section
      className="project-strip"
      aria-label="Project strip"
      data-scope={project.id}
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
      <div className="shot-strip-navigation">
        <button
          type="button"
          className="icon-button strip-pan"
          aria-label="Pan shots left"
          disabled={!edges.left}
          onClick={() => pan(-1)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <div
          ref={track}
          className="shot-strip-track"
          aria-label="All project shots"
        >
          {groups.map((act, actIndex) => (
            <div
              className="strip-act-range"
              key={act.node?.id || `act-${actIndex}`}
              data-range-id={act.node?.id}
            >
              {label(act.node, "act")}
              <div className="strip-sequence-ranges">
                {act.sequences.map((sequence, sequenceIndex) => (
                  <div
                    className="strip-sequence-range"
                    key={sequence.node?.id || `sequence-${sequenceIndex}`}
                    data-range-id={sequence.node?.id}
                  >
                    {label(sequence.node, "sequence")}
                    <div className="strip-scene-ranges">
                      {sequence.scenes.map(({ node: scene, shots, color }) => (
                        <div
                          className={`strip-scene-range scene-color-${color}`}
                          key={scene.id}
                          data-range-id={scene.id}
                        >
                          {label(scene, "scene")}
                          <div className="strip-scene-shots">
                            {shots.map((shot) => {
                              const take = selectedVersion(shot);
                              return (
                                <button
                                  type="button"
                                  key={shot.id}
                                  className={`hierarchy-card ${shot.id === selectedId ? "selected" : ""}`}
                                  data-kind="shot"
                                  data-shot-id={shot.id}
                                  title={`${shot.code || shot.id} · ${shot.title}`}
                                  aria-label={`${shot.code || shot.id} · ${shot.title}`}
                                  aria-pressed={shot.id === selectedId}
                                  onClick={() => onShot(shot)}
                                >
                                  <div>
                                    {take?.media?.type === "image" ? (
                                      <img
                                        loading="lazy"
                                        src={take.media.url}
                                        alt=""
                                      />
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
                                    <span>{shot.code || shot.id}</span>
                                    <span>
                                      {Number(shot.duration || 0).toFixed(1)}s
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!groups.length && <p className="strip-empty">No shots yet.</p>}
        </div>
        <button
          type="button"
          className="icon-button strip-pan"
          aria-label="Pan shots right"
          disabled={!edges.right}
          onClick={() => pan(1)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
