import {
  buildFalInput,
  buildMiniMaxInput,
} from "../../../../utils/server/providerJobs";
import { providerModel } from "../../../../utils/providerModels";
import { requireModel } from "./models";
export function preflight(job) {
  try {
    const request = job.request;
    const kind =
      request.type === "validation"
        ? "llm"
        : request.type === "upscale"
          ? "upscale"
          : request.type === "video"
            ? "video"
            : "image";
    const model = requireModel(request.model, kind);
    const refs = [...(request.references || [])];
    for (const dependency of job.frameDependencies ||
      (job.frameDependency ? [{ role: "first_frame" }] : []))
      refs.push({
        type: "image",
        role: dependency.role,
        url: "https://example.invalid/pending-frame",
      });
    if (
      (job.continuation || job.continuationSource) &&
      !refs.some((ref) => ref.role === "first_frame")
    )
      refs.unshift({
        type: "image",
        role: "first_frame",
        url: "https://example.invalid/pending-frame",
      });
    if (model.references != null && refs.length > model.references)
      throw new Error(
        `${model.label} supports at most ${model.references} references.`,
      );
    if (kind === "video") {
      if (!model.resolutions.includes(request.resolution))
        throw new Error(
          "The chosen resolution is not supported by this model.",
        );
      if (
        !Number.isInteger(request.duration) ||
        request.duration < model.minDuration ||
        request.duration > model.maxDuration
      )
        throw new Error(
          "The segment duration is outside this model’s supported range.",
        );
      const content = [
        { type: "text", text: request.prompt },
        ...refs.map((ref) => ({
          type: `${ref.type}_url`,
          role: ref.role,
          [`${ref.type}_url`]: {
            url: ref.url || "https://example.invalid/pending-reference",
          },
        })),
      ];
      if (model.provider === "fal")
        buildFalInput(providerModel(model.id), request, content);
      if (model.provider === "minimax")
        buildMiniMaxInput({ ...request, content });
    }
    return [];
  } catch (error) {
    return [error.message];
  }
}
