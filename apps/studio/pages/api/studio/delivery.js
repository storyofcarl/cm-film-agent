import { withStudioAuth } from "../../../lib/server/auth";
import { loadProject, mergeProject, ownerId } from "../../../lib/server/store";
import {
  deliveryTimeline,
  editorialManifest,
  otioTimeline,
} from "../../../lib/delivery";
import { assembleClips } from "../../../lib/server/media";
import { uid, sceneSignature } from "../../../lib/domain";
import {
  signedMediaUrl,
  storeKeyFromUrl,
} from "../../../../../utils/server/mediaStore";
export const config = { maxDuration: 300 };
export default withStudioAuth(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const { project } = await loadProject(req.body.id);
  const review = req.body.action === "review";
  if (review && !req.body.sceneId)
    return res.status(400).json({ error: "Choose a scene to review." });
  const timeline = deliveryTimeline(project, req.body.sceneId || null, {
    review,
  });
  if (req.body.action === "package") {
    const manifest = editorialManifest(project, timeline);
    for (const clip of manifest.clips)
      clip.downloadUrl = await signedMediaUrl(storeKeyFromUrl(clip.url), 3600);
    return res.json({
      manifest,
      otio: otioTimeline(timeline),
      downloadUrlsExpireAt: new Date(Date.now() + 3600000).toISOString(),
    });
  }
  if (req.body.action === "render" || review) {
    if (timeline.duration > 180 || timeline.clips.length > 30)
      return res.status(400).json({
        error:
          "Render this long production with the delivery package and local assembly tool, or render individual scenes here. Hosted renders support 180 seconds / 30 shots per request.",
      });
    const media = await assembleClips(timeline.clips, {
      ...timeline.dimensions,
      fps: timeline.fps,
    });
    return res.json(
      await mergeProject(project.id, (current) => {
        current.deliveries ||= [];
        current.deliveries.push({
          id: uid("delivery"),
          title: req.body.sceneId
            ? `Scene assembly · ${timeline.title}`
            : timeline.title,
          sceneId: req.body.sceneId || null,
          purpose: review ? "scene-review" : "delivery",
          sceneSignature: req.body.sceneId
            ? sceneSignature(project, req.body.sceneId)
            : null,
          signature: timeline.signature,
          media,
          review: "pending",
          createdAt: new Date().toISOString(),
          actor: ownerId(),
        });
        return current;
      }),
    );
  }
  if (req.body.action === "approve")
    return res.json(
      await mergeProject(project.id, (current) => {
        const delivery = current.deliveries?.find(
          (entry) => entry.id === req.body.deliveryId,
        );
        const currentTimeline = deliveryTimeline(
          current,
          req.body.sceneId || null,
        );
        if (!delivery || delivery.signature !== currentTimeline.signature)
          throw new Error(
            "The edit changed after this delivery was rendered. Render and review the current assembly.",
          );
        delivery.review = "approved";
        current.events.push({
          id: uid("event"),
          kind: "delivery.approved",
          role: "human",
          actor: ownerId(),
          at: new Date().toISOString(),
          deliveryId: delivery.id,
        });
        return current;
      }),
    );
  return res.status(400).json({ error: "Choose a delivery action." });
});
