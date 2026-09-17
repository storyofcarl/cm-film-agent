import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import {
  createProject,
  ensureProductionIds,
  validateProject,
  compileSegments,
  lookdevRequirement,
} from "../apps/studio/lib/domain.js";

// Preparation only. No credentials, network, approvals, or provider submissions.
const destination = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../docs/workflow/pilot",
);
const project = createProject({
  id: "pilot_last_light",
  title: "The Last Light · proposed production pilot",
  scope: "film",
  brief:
    "A keeper rescues the final light of a closing observatory. A 68-second, two-scene silent short for director review. Provisional material adapted from the Studio demo, not an approved production assignment.",
});
project.globalStyle =
  "Restrained, tactile science fiction. An aging remote observatory with practical controls, brushed metal, worn painted surfaces and believable scale. Warm amber practicals against cool window light. Naturalistic contrast and patient camera movement. Preserve screen direction, character identity, prop geometry and room geography across cuts. No captions, logos or readable invented interface text. No spoken dialogue; quiet room tone and subtle mechanical sound only.";
project.settings = {
  ...project.settings,
  llmModel: "claude-opus-5",
  audio: true,
  seed: 41723,
};
project.nodes = [
  {
    id: "pilot_act",
    type: "act",
    parentId: null,
    title: "The last shift",
    order: 0,
  },
  {
    id: "pilot_sequence",
    type: "sequence",
    parentId: "pilot_act",
    title: "Carry the light",
    order: 0,
  },
  {
    id: "pilot_night",
    type: "scene",
    parentId: "pilot_sequence",
    title: "The final signal",
    location: "INT. OBSERVATORY CONTROL ROOM",
    time: "NIGHT",
    order: 0,
    prompt:
      "Keep the window on screen left and the console on screen right. One amber status light is the visual focus.",
  },
  {
    id: "pilot_dawn",
    type: "scene",
    parentId: "pilot_sequence",
    title: "A light to carry",
    location: "INT. OBSERVATORY CONTROL ROOM",
    time: "DAWN, LATER",
    order: 1,
    prompt:
      "The same room and geography, now in cold dawn light. Keep the exit beyond the console on screen right.",
  },
];
project.assets = [
  {
    id: "pilot_keeper",
    title: "The keeper",
    type: "character",
    description:
      "Recurring lead in both scenes; identity and silhouette must remain consistent.",
    prompt:
      "Design one observatory keeper, a woman in her fifties with a compact practical silhouette, short silver-streaked dark hair and an unbranded charcoal work jacket. Quiet, observant expression. Full-body three-quarter view and clear face in one coherent character reference; neutral unobtrusive background. No text or duplicate figures.",
  },
  {
    id: "pilot_room",
    title: "Observatory control room",
    type: "location",
    description:
      "The same location at night and dawn; a reusable geography reference, not a mandatory fixed camera angle.",
    prompt:
      "Design a small aging observatory control room. A broad window occupies the left wall; a waist-high instrument console runs along the right; the exit is beyond the console. Brushed metal, worn pale paint, simple controls. Eye-level wide view making the geography legible. No people, captions or readable interface text.",
  },
  {
    id: "pilot_recorder",
    title: "Signal recorder",
    type: "prop",
    description:
      "Recurring story prop; its shape and single amber indicator must match across close-ups and handling.",
    prompt:
      "Design a palm-sized dark brushed-metal signal recorder with one circular amber indicator, one recessed physical button and a short wrist strap. Simple practical object, no display or branding. Three-quarter product view that clearly establishes proportions and the button location.",
  },
].map((asset, order) => ({
  ...asset,
  kind: "asset",
  order,
  versions: [],
  selectedVersionId: null,
}));
const roster = project.assets.map((asset) => asset.id);
project.shots = [
  {
    id: "pilot_shot1",
    sceneId: "pilot_night",
    title: "The last shift",
    duration: 30,
    prompt:
      "One continuous, deliberate tracking shot from the window toward the console. Follow the keeper into the room as she notices the amber signal. Preserve the camera direction and physical action through the continuation; do not introduce a cut at the segment boundary.",
    beats: [
      {
        duration: 15,
        text: "Track slowly right from the dark window. The keeper enters and walks to the console, coming to a complete stop with her right hand resting beside the recorder.",
      },
      {
        duration: 15,
        text: "Continue the same shot and camera motion from that resting pose. The keeper turns toward the amber indicator, leans close and settles, studying its steady light.",
      },
    ],
  },
  {
    id: "pilot_shot2",
    sceneId: "pilot_night",
    title: "Receive",
    duration: 15,
    prompt:
      "Cut to a clear close-up of the keeper's right hand and the recorder. Keep object geometry and hand contact physically coherent.",
    beats: [
      {
        duration: 15,
        text: "The keeper places her fingertip on the recorder's recessed button, presses it once and releases. The amber indicator gives one slow pulse and settles to a steady glow.",
      },
    ],
  },
  {
    id: "pilot_shot3",
    sceneId: "pilot_night",
    title: "Keep it",
    duration: 15,
    prompt:
      "Cut to a medium side view on the established screen axis. A quiet decision, expressed through handling and posture.",
    beats: [
      {
        duration: 15,
        text: "The keeper takes the recorder in her right hand, disconnects its loose lead with her left, then brings it carefully to her chest and becomes still. Its amber light stays on.",
      },
    ],
  },
  {
    id: "pilot_shot4",
    sceneId: "pilot_dawn",
    title: "One light remains",
    duration: 3,
    prompt:
      "Cut to an insert at dawn. The recorder is held in the keeper's right hand; preserve its approved shape and amber indicator.",
    beats: [
      {
        duration: 3,
        text: "In cold dawn light, the keeper's fingers close securely around the recorder while its amber indicator remains visible.",
      },
    ],
  },
  {
    id: "pilot_shot5",
    sceneId: "pilot_dawn",
    title: "Leave",
    duration: 5,
    prompt:
      "Cut to the established wide room view. Keep the recorder in the same hand and maintain the exit's screen-right position.",
    beats: [
      {
        duration: 5,
        text: "The keeper walks through the exit on screen right, carrying the small amber light out of the cold room. The camera holds on the now-empty console.",
      },
    ],
  },
].map((shot, order) => ({
  ...shot,
  kind: "shot",
  order,
  assetIds: roster,
  versions: [],
  selectedVersionId: null,
}));
project.artifacts = [
  {
    id: "pilot_preparation",
    title: "Provisional pilot direction and acceptance brief",
    method: "manual",
    review: "pending",
    origin: "prepared",
    content:
      "This is a proposed 68-second silent short, awaiting director acceptance. Validate the complete source, character/location/prop roster and five-shot coverage. Use a verified 15-second maximum draft model for the planned four-plus-one segment exercise; changing that profile requires recompilation and a new cost estimate. No supplied media is claimed. Upload any real completed work and preserve it after completeness validation. Technical lookdev is reviewed by the director. Do not submit paid requests without an approved, priced batch. See PILOT_REVIEW.md for the full acceptance run.",
    createdAt: project.createdAt,
  },
];
project.decisions = [
  {
    id: "pilot_material",
    status: "pending-owner-review",
    detail:
      "Use the demo's original Last Light premise provisionally; replace it if the director supplies a project.",
  },
  {
    id: "pilot_profile",
    status: "pending-owner-review",
    detail:
      "Use an enabled video model with a verified 15-second maximum and 480p draft support. Select the actual endpoint and obtain current prices before spending.",
  },
];
project.idCounters = { PRJ: 1 };
ensureProductionIds(project);
validateProject(project);
const profile = {
  model: "planning-profile-only",
  minDuration: 5,
  maxDuration: 15,
  resolution: "480p",
};
const planned = structuredClone(project);
planned.segmentProfiles = { pilot_night: profile, pilot_dawn: profile };
planned.segments = ["pilot_night", "pilot_dawn"].flatMap((id) =>
  compileSegments(planned, id, profile),
);
assert.equal(
  planned.segments.filter((entry) => entry.sceneId === "pilot_night").length,
  4,
);
assert.equal(
  planned.segments.filter((entry) => entry.sceneId === "pilot_dawn").length,
  1,
);
assert.equal(lookdevRequirement(planned, "pilot_night").required, true);
assert.equal(lookdevRequirement(planned, "pilot_dawn").required, false);
assert.equal(
  project.shots.reduce((total, shot) => total + shot.duration, 0),
  68,
);
const revision = structuredClone(project);
revision.shots = revision.shots.filter((shot) => shot.id === "pilot_shot4");
const repair = compileSegments(revision, "pilot_dawn", profile)[0];
assert.equal(repair.duration, 5);
assert.equal(repair.usedDuration, 3);
assert.match(repair.prompt, /2.00 seconds as a removable tail/);
assert.equal(project.batches.length, 0);
assert.equal(project.assets.flatMap((asset) => asset.versions).length, 0);
fs.mkdirSync(destination, { recursive: true });
fs.writeFileSync(
  path.join(destination, "last-light-pilot.studio.json"),
  JSON.stringify(project, null, 2) + "\n",
);
console.log(
  "Prepared importable pilot: 68 seconds, 2 scenes, 5 shots, 3 assets. Verified 4+1 segment planning and independent 3-second repair padding. No jobs or approvals created.",
);
