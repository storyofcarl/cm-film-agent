import { safeFetch } from "../../../../utils/server/safeFetch";
import {
  checkInUrl,
  signedMediaUrl,
  storeKeyFromUrl,
} from "../../../../utils/server/mediaStore";
import { assembleClips } from "./media";
import { requireModel } from "./models";

const base = "https://api.wavespeed.ai/api/v3";
const headers = () => ({
  Authorization: "Bearer " + process.env.WAVESPEED_API_KEY,
  "Content-Type": "application/json",
});
export async function submitUpscale(request, recordPayload) {
  requireModel(request.model, "upscale");
  const source =
    request.source.in || request.source.out
      ? await assembleClips([request.source])
      : request.source;
  const payload = {
    video: await signedMediaUrl(storeKeyFromUrl(source.url)),
    target_resolution: request.resolution.toLowerCase(),
  };
  await recordPayload(payload);
  const response = await safeFetch(base + "/" + request.model, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(90000),
  });
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(data.message || "Upscaler submission failed."),
      { providerStatus: response.status },
    );
  const id = data.data?.id;
  if (typeof id !== "string" || !/^[\w-]+$/.test(id))
    throw new Error(
      "Upscale submission has no recoverable task ID. Do not resubmit automatically.",
    );
  return id;
}
export async function pollUpscale(taskId) {
  if (!/^[\w-]+$/.test(taskId))
    throw new Error("Invalid upscale task identifier.");
  const response = await safeFetch(
    base + "/predictions/" + encodeURIComponent(taskId) + "/result",
    { headers: headers() },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error("Upscale result is temporarily unavailable.");
  const result = data.data;
  if (["failed", "cancelled", "timeout", "deleted"].includes(result?.status))
    return {
      state: "failed",
      error: String(result.error || "Upscale failed."),
      result: { taskId },
    };
  if (result?.status !== "completed")
    return { state: "running", result: { taskId } };
  const stored = await checkInUrl(result.outputs?.[0]);
  return {
    state: "succeeded",
    result: { taskId, url: stored.url, type: "video" },
  };
}
