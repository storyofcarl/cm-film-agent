import crypto from "node:crypto";
import { uid, stable } from "../domain";
import { fault, loadProject, mergeProject } from "./store";
import { runCrew } from "./crew";
import { invokeHandler } from "./invoke";

const LEASE_MS = 6 * 60 * 1000;
const copy = (value) => JSON.parse(JSON.stringify(value));
const signature = (value) =>
  crypto.createHash("sha256").update(stable(value)).digest("hex");
class YieldRun extends Error {}
const taskIn = (project, id) => {
  const task = project.crewRuns?.find((entry) => entry.id === id);
  if (!task)
    throw fault("That chat task does not belong to this project.", 404);
  return task;
};
const progress = (project, task) => {
  const artifact = project.artifacts.find(
    (entry) => entry.id === task.artifactId,
  );
  if (!artifact || task.state === "completed") return;
  artifact.content =
    task.state === "cancelled"
      ? "Stopped. Completed work is retained."
      : task.state === "attention"
        ? task.error
        : `Working · ${task.calls.filter((call) => call.state === "completed").length} steps saved.`;
};

export async function startCrewRun(project, input) {
  if (
    typeof input.instruction !== "string" ||
    !input.instruction.trim() ||
    input.instruction.length > 40000
  )
    throw fault("Give a direction of up to 40,000 characters.");
  const snapshot = copy(project);
  delete snapshot.crewRuns;
  const options = Object.fromEntries(
    [
      "method",
      "instruction",
      "model",
      "sceneId",
      "itemId",
      "contextId",
      "inspectingVersionId",
      "inspectingDocumentId",
      "inspectingDocumentDraft",
      "activeFileArea",
    ]
      .filter((key) => input[key] !== undefined)
      .map((key) => [key, copy(input[key])]),
  );
  const task = {
    id: uid("chat"),
    artifactId: uid("artifact"),
    state: "queued",
    createdAt: new Date().toISOString(),
    input: options,
    sourceProject: snapshot,
    calls: [],
  };
  return mergeProject(project.id, (current) => {
    current.crewRuns ||= [];
    current.crewRuns.push(copy(task));
    current.artifacts.push({
      id: task.artifactId,
      crewRunId: task.id,
      title: "Chat task",
      instruction: options.instruction,
      content: "Working · 0 steps saved.",
      createdAt: task.createdAt,
      review: "pending",
    });
    return current;
  });
}

export async function cancelCrewRun(projectId, taskId) {
  return mergeProject(projectId, (project) => {
    const task = taskIn(project, taskId);
    if (["queued", "running"].includes(task.state)) {
      task.state = "cancelled";
      task.stoppedAt = new Date().toISOString();
      progress(project, task);
    }
    return project;
  });
}

// One newly submitted model call per worker request. Replaying the saved journal
// reconstructs the exact source coverage and notes without repeating paid calls.
export async function advanceCrewRun(projectId, taskId) {
  const token = uid("lease");
  const claimed = await mergeProject(projectId, (project) => {
    const task = taskIn(project, taskId);
    if (task.state === "running" && Date.parse(task.leaseUntil) <= Date.now()) {
      const unresolved = task.calls.some((call) => call.state !== "completed");
      task.state = unresolved ? "attention" : "queued";
      if (unresolved) {
        task.pauseReason = "unconfirmed";
        task.error =
          "This task was interrupted during a model request. Saved steps are retained; no request was automatically repeated. Review it before sending a new direction.";
      }
      progress(project, task);
    }
    if (task.state === "queued") {
      task.state = "running";
      task.lease = token;
      task.leaseUntil = new Date(Date.now() + LEASE_MS).toISOString();
    }
    return project;
  });
  const task = taskIn(claimed.project, taskId);
  if (task.state !== "running" || task.lease !== token) return claimed;
  let ordinal = 0;
  let submitted = false;
  const checkpoint = (change, allowStopped = false) =>
    mergeProject(projectId, (project) => {
      const current = taskIn(project, taskId);
      if (
        current.lease !== token ||
        (!allowStopped && current.state !== "running")
      )
        throw new YieldRun();
      change(current, project);
      progress(project, current);
      return project;
    });
  try {
    return await runCrew(task.sourceProject, task.input, {
      durable: true,
      artifactId: task.artifactId,
      invoke: async (handler, request) => {
        const index = ordinal++;
        const hash = signature(request);
        const prior = task.calls[index];
        if (prior) {
          if (prior.signature !== hash || prior.state !== "completed")
            throw fault(
              "Saved task inputs changed or a prior response is unconfirmed. No model request was repeated.",
            );
          return copy(prior.result);
        }
        if (submitted) throw new YieldRun();
        if (task.calls.some((call) => call.signature === hash))
          throw fault(
            "The source review repeated an identical step without progress. Saved work is retained; send a revised direction to continue.",
          );
        await checkpoint((current) => {
          current.calls.push({
            signature: hash,
            request: copy(request),
            state: "submitted",
            startedAt: new Date().toISOString(),
          });
        });
        submitted = true;
        const result = await invokeHandler(handler, request);
        await checkpoint((current) => {
          current.calls[index] = {
            ...current.calls[index],
            state: "completed",
            result: copy(result),
            completedAt: new Date().toISOString(),
          };
          if (
            current.state === "attention" &&
            current.pauseReason === "unconfirmed"
          ) {
            current.state = "queued";
            delete current.pauseReason;
            delete current.error;
          }
        }, true);
        return result;
      },
      commit: (_id, update) =>
        checkpoint((current, project) => {
          project.artifacts = project.artifacts.filter(
            (entry) => entry.id !== current.artifactId,
          );
          update(project);
          project.artifacts.find(
            (entry) => entry.id === current.artifactId,
          ).crewRunId = current.id;
          current.state = "completed";
          current.completedAt = new Date().toISOString();
          delete current.lease;
          delete current.leaseUntil;
        }),
    });
  } catch (error) {
    if (error instanceof YieldRun) {
      await checkpoint((current) => {
        current.state = "queued";
        delete current.lease;
        delete current.leaseUntil;
      }).catch((failure) => {
        if (!(failure instanceof YieldRun)) throw failure;
      });
      return loadProject(projectId);
    }
    return checkpoint((current) => {
      current.state = "attention";
      current.error = String(
        error.message || "Task interrupted. Saved steps are retained.",
      );
    }).catch(async (failure) => {
      if (failure instanceof YieldRun) return loadProject(projectId);
      throw failure;
    });
  }
}
