import { useState } from "react";
import {
  sceneIsApproved,
  selectedVersion,
  effectiveAssetIds,
} from "../lib/domain";
import { InspectDialog } from "./PromptField";

export default function ProjectStatus({
  project,
  containerId = null,
  onNavigate,
}) {
  const [open, setOpen] = useState(false);
  const container = project.nodes.find((node) => node.id === containerId);
  const descendants = new Set([containerId]);
  let size;
  do {
    size = descendants.size;
    project.nodes
      .filter((node) => descendants.has(node.parentId))
      .forEach((node) => descendants.add(node.id));
  } while (size !== descendants.size);
  const scenes = project.nodes.filter(
    (node) => node.type === "scene" && (!container || descendants.has(node.id)),
  );
  const sceneIds = new Set(scenes.map((scene) => scene.id));
  const scopeShots = project.shots.filter(
    (shot) => !container || sceneIds.has(shot.sceneId),
  );
  const assetIds = new Set(
    scopeShots.flatMap((shot) => effectiveAssetIds(project, shot.id)),
  );
  const scopeAssets = project.assets.filter(
    (asset) => !container || assetIds.has(asset.id),
  );
  const approved = scenes.filter((scene) =>
    sceneIsApproved(project, scene.id),
  ).length;
  const assets = scopeAssets.filter(
    (item) => selectedVersion(item)?.review === "approved",
  ).length;
  const shots = scopeShots.filter(
    (item) => selectedVersion(item)?.review === "approved",
  ).length;
  const isScene = container?.type === "scene";
  const count = isScene ? shots : approved;
  const total = isScene ? scopeShots.length : scenes.length;
  const unit = isScene ? "shots" : "scenes";
  const percent = total ? (count / total) * 100 : 0;
  const label = container
    ? container.type[0].toUpperCase() + container.type.slice(1)
    : "Project";
  const sceneState = isScene
    ? sceneIsApproved(project, container.id)
      ? "Scene approved"
      : "Scene awaiting approval"
    : null;
  const active = project.batches
    .flatMap((batch) => batch.jobs)
    .filter((job) =>
      ["claimed", "queued", "running"].includes(job.state),
    ).length;
  return (
    <>
      <button
        type="button"
        className="project-status"
        aria-label={`${label} status: ${count} of ${total} ${unit} approved${sceneState ? `. ${sceneState}` : ""}`}
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="15.915" className="status-track" />
          <circle
            cx="18"
            cy="18"
            r="15.915"
            className="status-progress"
            strokeDasharray={`${percent} 100`}
          />
        </svg>
        <span>
          <b>
            {count}/{total}
          </b>{" "}
          {unit} approved
          {sceneState && <small>{sceneState}</small>}
        </span>
      </button>
      {open && (
        <InspectDialog
          title={
            container ? `${container.title} · Status` : "Production status"
          }
          onClose={() => setOpen(false)}
        >
          <p>
            {approved} of {scenes.length} scenes approved for the current
            selected versions.
          </p>
          <div className="status-summary">
            <span>
              {assets}/{scopeAssets.length} {container ? "referenced " : ""}
              assets approved
            </span>
            <span>
              {shots}/{scopeShots.length} shots approved
            </span>
            <span>{active} project jobs active</span>
          </div>
          <p>
            Scene approval follows the director’s review of the assembled scene.
            It is separate from approving individual shots or final delivery.
          </p>
          <ul className="status-scenes">
            {scenes.map((scene) => (
              <li key={scene.id}>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => {
                    onNavigate(scene.id);
                    setOpen(false);
                  }}
                >
                  {scene.code || scene.id} · {scene.title}
                </button>
                <span>
                  {sceneIsApproved(project, scene.id)
                    ? "Approved"
                    : "Awaiting scene approval"}
                </span>
              </li>
            ))}
          </ul>
        </InspectDialog>
      )}
    </>
  );
}
