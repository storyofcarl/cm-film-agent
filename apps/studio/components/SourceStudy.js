import { useState } from "react";
import PromptField from "./PromptField";

export default function SourceStudy({ study }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  if (!study?.transcript?.length) return null;
  const record = study.transcript[Math.min(step, study.transcript.length - 1)];
  const coverage = study.coverage || [];
  const read = coverage.reduce((sum, entry) => sum + entry.readParts.length, 0);
  const total = coverage.reduce((sum, entry) => sum + entry.totalParts, 0);
  return (
    <details
      className="document-source"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Source read history · {study.transcript.length} steps</summary>
      {open && (
        <>
          <p>
            {study.mode === "partitioned"
              ? `${study.outputPlan?.parts?.length || 0} planned output parts were assembled together. Exact source reads and output responses are retained below; this does not approve the result.`
              : study.mode === "journal"
                ? "Completed model steps are saved here while the task continues."
                : `${read} of ${total} indexed text parts read. This records source access, not creative approval.`}
          </p>
          <label className="field">
            Source read step
            <select
              value={step}
              onChange={(event) => setStep(Number(event.target.value))}
            >
              {study.transcript.map((_, index) => (
                <option key={index} value={index}>
                  Step {index + 1}
                </option>
              ))}
            </select>
          </label>
          <PromptField
            label="Recorded source request"
            value={record.prompt}
            readOnly
            rows={8}
          />
          <PromptField
            label="Recorded source response"
            value={record.response}
            readOnly
            rows={5}
          />
        </>
      )}
    </details>
  );
}
