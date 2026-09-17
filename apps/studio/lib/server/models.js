import {
  resolveConfig,
  videoTraits,
  imageTraits,
} from "../../../../utils/film/suiteConfig";
import { providerModel } from "../../../../utils/providerModels";
import { fault } from "./store";
import { UPSCALERS } from "../upscalers";

export function modelCatalog() {
  return Object.entries(resolveConfig().models)
    .filter(([, id]) => id)
    .map(([slot, id]) => {
      const provider = providerModel(id);
      const kind =
        provider?.kind ||
        (/seedance/.test(slot)
          ? "video"
          : /seedream/.test(slot)
            ? "image"
            : "llm");
      const video = kind === "video" ? videoTraits(slot) : null;
      return {
        id,
        slot,
        label: provider?.label || slot,
        kind,
        provider: provider?.provider || "modelark",
        ...(video
          ? {
              minDuration: provider?.provider === "minimax" ? 4 : 5,
              maxDuration: video.maxSeconds,
              resolutions: video.res,
              references: video.refCap,
              supportsVideoReference: provider?.provider !== "fal",
              supportsSeed: provider?.provider !== "minimax",
            }
          : {}),
        ...(kind === "image" ? { references: imageTraits(slot).refCap } : {}),
      };
    })
    .filter(
      (model, index, models) =>
        models.findIndex((entry) => entry.id === model.id) === index,
    )
    .concat(process.env.WAVESPEED_API_KEY ? UPSCALERS : []);
}
export function requireModel(id, kind) {
  const model = modelCatalog().find(
    (entry) => entry.id === id && entry.kind === kind,
  );
  if (!model) throw fault(`Choose an enabled ${kind} model.`);
  return model;
}
export function videoProfile(id, resolution) {
  const model = requireModel(id, "video");
  return {
    model: id,
    minDuration: model.minDuration,
    maxDuration: model.maxDuration,
    resolution: model.resolutions.includes(resolution)
      ? resolution
      : model.resolutions[0],
  };
}
