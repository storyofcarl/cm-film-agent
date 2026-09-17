import { documentGroups } from "./documents";
import { selectedVersion, sceneIsApproved } from "./domain";
import { deliveryTimeline } from "./delivery";

const phase = (id, label, area, reviews, started = reviews.length > 0) => {
  const approved = reviews.filter((review) => review === "approved").length;
  const state =
    reviews.length > 0 && approved === reviews.length
      ? "approved"
      : reviews.includes("revision")
        ? "revision"
        : started
          ? "pending"
          : "empty";
  return {
    id,
    label,
    area,
    state,
    approved,
    total: reviews.length,
    status: {
      approved: "Approved",
      revision: "Needs revision",
      pending: "Needs review",
      empty: "Not started",
    }[state],
  };
};

export function projectPhases(project) {
  const scripts = documentGroups(project, "scripts").map(
    (group) => group.versions.at(-1).review,
  );
  const assets = project.assets.map(
    (asset) => selectedVersion(asset)?.review || "pending",
  );
  const previs = (project.guides || []).filter(
    (guide) => guide.kind === "previs",
  );
  const scenes = project.nodes.filter((node) => node.type === "scene");
  const picture = (project.deliveries || [])
    .filter((entry) => entry.purpose !== "scene-review" && !entry.sceneId)
    .at(-1);
  let deliveryReview = picture?.review;
  if (deliveryReview === "approved") {
    try {
      if (picture.signature !== deliveryTimeline(project).signature)
        deliveryReview = "pending";
    } catch {
      deliveryReview = "pending";
    }
  }
  return [
    phase("scripting", "Scripting", "Scripts", scripts),
    phase(
      "assets",
      "Assets",
      "Assets",
      assets,
      project.assets.some((asset) => asset.versions.length > 0),
    ),
    phase(
      "previs",
      "Previs",
      "Overview",
      previs.map((guide) => guide.review),
    ),
    phase(
      "animation",
      "Animation",
      "Footage",
      scenes.map((scene) =>
        sceneIsApproved(project, scene.id)
          ? "approved"
          : project.shots.some(
                (shot) =>
                  shot.sceneId === scene.id &&
                  selectedVersion(shot)?.review === "revision",
              )
            ? "revision"
            : "pending",
      ),
      project.shots.some((shot) => selectedVersion(shot)?.media),
    ),
    phase("delivery", "Delivery", "Overview", picture ? [deliveryReview] : []),
  ];
}
