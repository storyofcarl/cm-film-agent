import { projectPhases } from "../lib/phases";

export default function PhaseChecklist({ project, onOpen }) {
  return (
    <section className="phase-checklist" aria-label="Production phases">
      {projectPhases(project).map((phase) => (
        <div className={`phase-row ${phase.state}`} key={phase.id}>
          <input
            type="checkbox"
            checked={phase.state === "approved"}
            disabled
            aria-label={`${phase.label} approved`}
          />
          <button
            type="button"
            onClick={() => onOpen(phase.area)}
            aria-label={`Review ${phase.label}`}
          >
            {phase.label}
          </button>
          <span
            className="phase-status"
            title={`${phase.approved} of ${phase.total} approved`}
          >
            <i aria-hidden="true" />
            {phase.status}
          </span>
        </div>
      ))}
    </section>
  );
}
