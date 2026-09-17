/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { jobBlockers } from "../lib/domain";

function BatchCard({ project, batch, busy, command, action, catalog }) {
  const [amount, setAmount] = useState(batch.estimate?.total ?? "");
  const [basis, setBasis] = useState(batch.estimate?.basis || "");
  const canRun = batch.jobs.some(
    (job) =>
      job.state === "planned" && !jobBlockers(project, batch, job).length,
  );
  return (
    <article className="batch-card">
      <header>
        <div>
          <span className="eyebrow">{batch.kind}</span>
          <h3>{batch.title}</h3>
        </div>
        <span className="badge">{batch.paused ? "paused" : batch.state}</span>
      </header>
      <p>
        {batch.jobs.length} jobs ·{" "}
        {batch.estimate?.total == null
          ? "Estimate required before approval"
          : `$${batch.estimate.total.toFixed(2)} estimated · ${batch.estimate.currency}`}
      </p>
      <div className="estimate-form">
        <label className="field">
          Estimated total (USD)
          <input
            aria-label={`Estimate for ${batch.title}`}
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label className="field">
          Quote / calculation basis
          <input
            aria-label={`Estimate basis for ${batch.title}`}
            value={basis}
            onChange={(event) => setBasis(event.target.value)}
            placeholder="Provider quote, rate × seconds, date"
          />
        </label>
        <button
          className="secondary"
          disabled={
            busy ||
            amount === "" ||
            !basis.trim() ||
            batch.jobs.some((job) => job.state !== "planned")
          }
          onClick={() =>
            command("batch.estimate", {
              id: batch.id,
              total: Number(amount),
              basis,
            })
          }
        >
          Record estimate
        </button>
      </div>
      {batch.jobs.map((job) => (
        <details key={job.id} open={Boolean(job.error)}>
          <summary>
            <span>{job.title}</span>
            <span>{job.state}</span>
          </summary>
          <dl className="recipe-meta">
            <dt>Model</dt>
            <dd>{job.request.model}</dd>
            <dt>Duration</dt>
            <dd>
              {job.request.duration ? `${job.request.duration}s` : "Still"}
            </dd>
            <dt>Resolution</dt>
            <dd>{job.request.resolution || job.request.size}</dd>
            <dt>Repair route</dt>
            <dd>{job.route || "Original generation"}</dd>
            <dt>Source version</dt>
            <dd>{job.sourceVersionId || "None"}</dd>
          </dl>
          <pre>{job.request.prompt}</pre>
          {batch.jobs.every((entry) => entry.state === "planned") &&
            batch.state !== "superseded" && (
              <details>
                <summary>Customize this request</summary>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fields = Object.fromEntries(
                      new FormData(event.currentTarget),
                    );
                    command("batch.job.update", {
                      batchId: batch.id,
                      jobId: job.id,
                      request: {
                        prompt: fields.prompt,
                        model: fields.model,
                        ...(fields.resolution
                          ? { resolution: fields.resolution }
                          : {}),
                        ...(fields.duration
                          ? { duration: Number(fields.duration) }
                          : {}),
                        seed: fields.seed === "" ? null : Number(fields.seed),
                        ...(fields.timestamp
                          ? { timestamp: Number(fields.timestamp) }
                          : {}),
                      },
                    });
                  }}
                >
                  <label className="field">
                    Exact prompt
                    <textarea
                      name="prompt"
                      rows={7}
                      defaultValue={job.request.prompt}
                      required
                    />
                  </label>
                  <label className="field">
                    Model
                    <select name="model" defaultValue={job.request.model}>
                      {catalog
                        .filter(
                          (entry) =>
                            entry.kind ===
                            (job.request.type === "validation"
                              ? "llm"
                              : job.request.type === "upscale"
                                ? "upscale"
                                : job.request.type === "video"
                                  ? "video"
                                  : "image"),
                        )
                        .map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  {job.request.resolution && (
                    <label className="field">
                      Resolution
                      <input
                        name="resolution"
                        defaultValue={job.request.resolution}
                      />
                    </label>
                  )}
                  {job.request.duration && (
                    <label className="field">
                      Request duration (seconds)
                      <input
                        type="number"
                        name="duration"
                        min="1"
                        step="1"
                        defaultValue={job.request.duration}
                      />
                    </label>
                  )}
                  <label className="field">
                    Seed (when supported)
                    <input
                      name="seed"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={job.request.seed ?? ""}
                    />
                  </label>
                  {job.request.type === "frame-edit" && (
                    <label className="field">
                      Extract frame at (seconds)
                      <input
                        name="timestamp"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={job.request.timestamp}
                      />
                    </label>
                  )}
                  <p className="modal-hint">
                    Saving clears this batch’s prior cost estimate and approval.
                    Already running work keeps its original recipe.
                  </p>
                  <button className="secondary" disabled={busy}>
                    Save request changes
                  </button>
                </form>
              </details>
            )}
          {job.output?.url && (
            <div className="batch-result">
              {job.output.type === "video" ? (
                <video controls preload="metadata" src={job.output.url} />
              ) : (
                <img src={job.output.url} alt={job.title} />
              )}
            </div>
          )}
          {job.request.type === "validation" && job.output && (
            <p className="gate-message">
              {job.output.complete
                ? "Supplied work complete: agent approved."
                : "Completeness gaps: " + job.output.gaps?.join(" ")}{" "}
              {job.output.summary}
            </p>
          )}
          {job.error && <p className="gate-message">{job.error}</p>}
          {["uncertain", "claimed"].includes(job.state) && (
            <details>
              <summary>Resolve an unconfirmed submission</summary>
              <p className="gate-message">
                Refresh results first. If no task can be recovered, check the
                provider dashboard before closing this attempt. Closing
                preserves its history and never retries it; prepare and approve
                a new batch to try again.
              </p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const fields = Object.fromEntries(
                    new FormData(event.currentTarget),
                  );
                  action("resolve", {
                    batchId: batch.id,
                    jobId: job.id,
                    confirmedStopped: fields.confirmed === "on",
                    note: fields.note,
                  });
                }}
              >
                <label className="field">
                  Provider check / outcome
                  <input name="note" required minLength={10} />
                </label>
                <label>
                  <input name="confirmed" type="checkbox" required /> I verified
                  that no live provider task remains.
                </label>
                <button className="secondary" disabled={busy}>
                  Close this attempt
                </button>
              </form>
            </details>
          )}
          {job.state === "planned" &&
            jobBlockers(project, batch, job).map((reason) => (
              <p className="gate-message" key={reason}>
                {reason}
              </p>
            ))}
          {job.actualPayload && (
            <details>
              <summary>Exact submitted payload</summary>
              <pre>{JSON.stringify(job.actualPayload, null, 2)}</pre>
            </details>
          )}
        </details>
      ))}
      <div className="button-row">
        {batch.approval &&
          batch.state !== "superseded" &&
          batch.state !== "completed" && (
            <button
              className="secondary"
              disabled={busy}
              onClick={() =>
                command("batch.pause", { id: batch.id, paused: !batch.paused })
              }
            >
              {batch.paused ? "Resume batch" : "Pause remaining jobs"}
            </button>
          )}
        <button
          className="secondary"
          disabled={
            busy ||
            batch.estimate?.total == null ||
            batch.jobs.some((job) => job.state !== "planned")
          }
          onClick={() => command("batch.approve", { id: batch.id })}
        >
          Approve & queue batch
        </button>
        <button
          className="primary"
          disabled={busy || !canRun}
          onClick={() => action("run", { batchId: batch.id })}
        >
          Run approved jobs
        </button>
        <button
          className="secondary"
          disabled={busy}
          onClick={() => action("reconcile", { batchId: batch.id })}
        >
          Refresh results
        </button>
        {batch.kind === "lookdev" && (
          <button
            className="secondary"
            disabled={
              busy || batch.jobs.some((job) => job.state !== "succeeded")
            }
            onClick={() =>
              command("lookdev.approve", {
                batchId: batch.id,
                scope: batch.scope,
              })
            }
          >
            Approve lookdev results
          </button>
        )}
      </div>
    </article>
  );
}

export default function BatchPanel({
  project,
  revisions,
  revisionRoute,
  setRevisionRoute,
  busy,
  command,
  batchAction,
  catalog = [],
}) {
  const [finishMode, setFinishMode] = useState("upscale");
  const [repairFrames, setRepairFrames] = useState("first");
  const [rerunPrompt, setRerunPrompt] = useState("revised");
  return (
    <div className="batch-section">
      <div className="batch-summary">
        <div>
          <span className="eyebrow">NEXT REVISION BATCH</span>
          <h2>{revisions.length} versions need attention</h2>
          <p>
            Review repair methods, source versions, prompts and estimated cost
            once for the whole batch.
          </p>
        </div>
        <select
          aria-label="Revision method"
          value={revisionRoute}
          onChange={(event) => setRevisionRoute(event.target.value)}
        >
          <option value="frames">Extract & revise frames</option>
          <option value="video-edit">Targeted video edit</option>
          <option value="rerun">Full clip rerun</option>
        </select>
        {revisionRoute === "frames" && (
          <select
            aria-label="Repair frame coverage"
            value={repairFrames}
            onChange={(event) => setRepairFrames(event.target.value)}
          >
            <option value="first">Opening frame</option>
            <option value="both">Opening & closing frames</option>
          </select>
        )}
        {revisionRoute === "rerun" && (
          <select
            aria-label="Rerun prompt"
            value={rerunPrompt}
            onChange={(event) => setRerunPrompt(event.target.value)}
          >
            <option value="revised">
              Apply current intent & revision notes
            </option>
            <option value="original">Use exact recorded prompt</option>
          </select>
        )}
        <button
          className="primary"
          disabled={busy || !revisions.length}
          onClick={() =>
            batchAction("prepare", {
              kind: "revision",
              repairFrames,
              rerunPrompt,
            })
          }
        >
          Prepare revision batch
        </button>
      </div>
      <div className="button-row batch-tools">
        {[
          "intake",
          "lookdev",
          "assets",
          "boards",
          "burst-boards",
          "burst-assets",
          "previs",
          "production",
        ].map((kind) => (
          <button
            key={kind}
            className="secondary"
            disabled={busy}
            onClick={() => batchAction("prepare", { kind })}
          >
            {kind === "intake" ? "Validate supplied work" : `Prepare ${kind}`}
          </button>
        ))}
        <select
          aria-label="Finishing method"
          value={finishMode}
          onChange={(event) => setFinishMode(event.target.value)}
        >
          <option value="upscale">Upscale approved footage</option>
          <option value="v2v">V2V · same prompt & seed</option>
        </select>
        <button
          className="secondary"
          disabled={busy}
          onClick={() =>
            batchAction("prepare", { kind: "finishing", finishMode })
          }
        >
          Prepare finishing
        </button>
      </div>
      {!project.batches.length && (
        <div className="empty-state">
          <h2>No batches in flight.</h2>
          <p>
            Prepare work across your deliverable. The plan shows every job and
            its real prerequisites.
          </p>
        </div>
      )}
      {project.batches.map((batch) => (
        <BatchCard
          key={batch.id}
          project={project}
          batch={batch}
          busy={busy}
          command={command}
          action={batchAction}
          catalog={catalog}
        />
      ))}
    </div>
  );
}
