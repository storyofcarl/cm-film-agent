// Verified against WaveSpeed's own rate card, 2026-09-16. Estimates, not invoices.
export const UPSCALERS = [
  {
    id: "wavespeed-ai/video-upscaler",
    label: "WaveSpeed Video Upscaler",
    kind: "upscale",
    provider: "wavespeed",
    resolutions: ["1080p", "2K", "4K"],
    rates: { "1080p": 0.005, "2K": 0.01, "4K": 0.02 },
  },
  {
    id: "wavespeed-ai/video-upscaler-pro",
    label: "WaveSpeed Video Upscaler Pro",
    kind: "upscale",
    provider: "wavespeed",
    resolutions: ["1080p", "2K", "4K"],
    rates: { "1080p": 0.04, "2K": 0.05, "4K": 0.07 },
  },
];
export const UPSCALE_RATE_SOURCE =
  "https://wavespeed.ai/blog/ai-comparisons/video-upscaler-api-which-tier/";
export const upscaleEstimate = (model, resolution, seconds) =>
  Math.max(3, Math.ceil(seconds)) * model.rates[resolution];
