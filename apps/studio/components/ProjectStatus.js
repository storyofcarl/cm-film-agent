import { useState } from "react";
import { sceneIsApproved, selectedVersion } from "../lib/domain";
import { InspectDialog } from "./PromptField";

export default function ProjectStatus({ project, onNavigate }) {
  const [open, setOpen] = useState(false);
  const scenes = project.nodes.filter((node) => node.type === "scene");
  const approved = scenes.filter((scene) =>
    sceneIsApproved(project, scene.id),
  ).length;
  const percent = scenes.length ? (approved / scenes.length) * 100 : 0;
  const assets = project.assets.filter(
    (item) => selectedVersion(item)?.review === "approved",
  ).length;
  const shots = project.shots.filter(
    (item) => selectedVersion(item)?.review === "approved",
  ).length;
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
        aria-label={`Project status: ${approved} of ${scenes.length} scenes approved`}
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
            {approved}/{scenes.length}
          </b>{" "}
          scenes approved
        </span>
      </button>
      {open && (
        <InspectDialog title="Production status" onClose={() => setOpen(false)}>
          <p>
            {approved} of {scenes.length} scenes approved for the current
            selected versions.
          </p>
          <div className="status-summary">
            <span>
              {assets}/{project.assets.length} assets approved
            </span>
            <span>
              {shots}/{project.shots.length} shots approved
            </span>
            <span>{active} jobs active</span>
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
