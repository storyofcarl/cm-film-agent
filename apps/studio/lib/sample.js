import { createProject, compileSegments } from "./domain";
export function sampleProject() {
  const project = createProject({
    id: "sample_last_light",
    title: "The Last Light",
    scope: "film",
    brief:
      "At a remote observatory, a keeper receives one final signal before the station goes dark. A quiet science-fiction story about the things we choose to carry home.",
  });
  project.sample = true;
  project.globalStyle =
    "Restrained cinematic science fiction. Warm amber practicals against blue-hour atmospheres. Tactile surfaces, naturalistic contrast, considered negative space. Patient, deliberate camera movement.";
  project.nodes = [
    {
      id: "act1",
      type: "act",
      parentId: null,
      title: "Act I · The signal",
      order: 0,
    },
    {
      id: "seq1",
      type: "sequence",
      parentId: "act1",
      title: "Sequence 01 · A final transmission",
      order: 0,
    },
    {
      id: "sc1",
      type: "scene",
      parentId: "seq1",
      title: "The observatory",
      location: "EXT. RIDGE STATION",
      time: "BLUE HOUR",
      order: 0,
    },
    {
      id: "sc2",
      type: "scene",
      parentId: "seq1",
      title: "A familiar voice",
      location: "INT. CONTROL ROOM",
      time: "CONTINUOUS",
      order: 1,
    },
    {
      id: "seq2",
      type: "sequence",
      parentId: "act1",
      title: "Sequence 02 · The departure",
      order: 1,
    },
    {
      id: "sc3",
      type: "scene",
      parentId: "seq2",
      title: "What we carry",
      location: "EXT. LANDING FIELD",
      time: "DAWN",
      order: 2,
    },
  ];
  const version = (id, media, review, prompt, number = 1) => ({
    id,
    number,
    review,
    createdAt: "2026-09-16T12:00:00Z",
    media: { url: `/samples/${media}.svg`, type: "image", in: 0, out: 8 },
    prompt,
    model: "Storyboard fixture",
    method: "film.board",
    seed: null,
    origin: "fixture",
    references: [],
    note: "",
  });
  const shots = [
    [
      "The last light",
      "sc1",
      "ridge",
      "approved",
      "A distant observatory rests on a dark ridge. A single amber window holds against the blue hour. Slow, almost imperceptible push inward.",
    ],
    [
      "Crossing the ridge",
      "sc1",
      "keeper",
      "approved",
      "The keeper walks toward the station, small against the immense landscape. Coat moving gently in the wind.",
    ],
    [
      "A moment at the door",
      "sc1",
      "door",
      "revision",
      "The keeper pauses at the lit doorway, listening. Frame the silhouette in the warm light without revealing the face.",
    ],
    [
      "The signal returns",
      "sc1",
      "room",
      "pending",
      "Inside the quiet station, an amber indicator begins to pulse. Hold on the console as the keeper enters the edge of frame.",
    ],
    [
      "Someone is still there",
      "sc2",
      "room",
      "pending",
      "The keeper leans toward the receiver. “I thought you had gone.” Let the room fall still around the voice.",
    ],
    [
      "A small departure",
      "sc3",
      "ridge",
      "pending",
      "At first light the station is dark. The keeper walks away with a small case. A wide frame holds after the departure.",
    ],
  ];
  project.shots = shots.map(
    ([title, sceneId, image, review, prompt], index) => {
      const item = {
        id: `sh${index + 1}`,
        kind: "shot",
        title,
        sceneId,
        order: index,
        duration: 8,
        prompt,
        description: prompt,
        versions: [version(`sh${index + 1}v1`, image, review, prompt)],
        selectedVersionId: `sh${index + 1}v1`,
      };
      if (index === 2) {
        item.versions[0].note =
          "Keep the original silhouette; soften the light at the doorway.";
        item.versions.push(version("sh3v2", "door", "pending", prompt, 2));
      }
      return item;
    },
  );
  project.assets = [
    {
      id: "keeper",
      kind: "asset",
      type: "character",
      title: "The keeper",
      description: "A solitary station keeper in a weathered field coat.",
      versions: [
        version(
          "keeper_v1",
          "keeper",
          "approved",
          "Full silhouette, weathered field coat, purposeful posture.",
        ),
      ],
      selectedVersionId: "keeper_v1",
    },
    {
      id: "station",
      kind: "asset",
      type: "location",
      title: "Ridge observatory",
      description: "Remote, utilitarian, a single warm window.",
      versions: [
        version(
          "station_v1",
          "ridge",
          "approved",
          "Concrete observatory on a remote ridge, amber practical light.",
        ),
      ],
      selectedVersionId: "station_v1",
    },
    {
      id: "receiver",
      kind: "asset",
      type: "prop",
      title: "Signal console",
      description: "Analog controls and one amber signal light.",
      versions: [
        version(
          "receiver_v1",
          "room",
          "pending",
          "Tactile analog signal receiver, understated amber indicator.",
        ),
      ],
      selectedVersionId: "receiver_v1",
    },
  ];
  project.segments = project.nodes
    .filter((node) => node.type === "scene")
    .flatMap((node) =>
      compileSegments(project, node.id, {
        model: "Sample model · no API execution",
        minDuration: 5,
        maxDuration: 15,
      }),
    );
  project.events = [
    {
      id: "sample_event",
      kind: "sample.loaded",
      actor: "Example project",
      role: "fixture",
      at: "2026-09-16T12:00:00Z",
      note: "Illustrated storyboard fixtures. No provider generation has run.",
    },
  ];
  return project;
}
