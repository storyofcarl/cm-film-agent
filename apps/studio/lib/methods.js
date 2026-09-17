export const METHODS = [
  {
    id: "auto",
    name: "Crew chooses",
    stage: "all",
    description:
      "Choose the appropriate available craft methods for the director's request and current production.",
  },
  {
    id: "film.crew",
    name: "Film Agent · Production crew",
    stage: "all",
    description:
      "Integrated writing, direction, cast/world and shot preparation.",
  },
  {
    id: "occ-production",
    name: "OCC · Production methodology",
    stage: "direction",
    description:
      "Source-faithful batch planning, typed reusable assets, reference discipline, staging and model-specific prompt assembly.",
  },
  {
    id: "film.develop",
    name: "Film Agent · Develop",
    stage: "writing",
    description: "Develop an idea into a cinematic narrative.",
  },
  {
    id: "screenplay-studio-2",
    name: "Screenplay Studio 2",
    stage: "writing",
    description: "Foundation, scene briefs, and screenplay development.",
  },
  {
    id: "screenplay-analyzer-2",
    name: "Screenplay Analyzer 2",
    stage: "writing",
    description: "Diagnose craft and completeness without rewriting.",
  },
  {
    id: "screenplay-doctor-2",
    name: "Screenplay Doctor 2",
    stage: "writing",
    description: "Repair named problems and preserve successful material.",
  },
  {
    id: "film.shots",
    name: "Film Agent · Shot authoring",
    stage: "direction",
    description: "Source-preserving breakdown and cinematic shot intentions.",
  },
  {
    id: "directors-vision-3",
    name: "Director’s Vision 3",
    stage: "direction",
    description: "Visual thesis, direction, motifs, and creative locks.",
  },
  {
    id: "shot-format-4",
    name: "Shot Format 4",
    stage: "direction",
    description: "Structured shot coverage, timing, and conformance.",
  },
  {
    id: "film.compose",
    name: "Film Agent · Compose",
    stage: "prompts",
    description: "Assemble source, references, camera, and keyframes.",
  },
  {
    id: "film.direct",
    name: "Film Agent · Direct",
    stage: "prompts",
    description: "Apply a focused director note.",
  },
  {
    id: "film.enrich",
    name: "Film Agent · Enrich",
    stage: "prompts",
    description: "Add production detail while preserving intent.",
  },
  {
    id: "film.cast",
    name: "Film Agent · Cast & World",
    stage: "assets",
    description: "Character, location, prop and creature reference planning.",
  },
  {
    id: "film.board",
    name: "Film Agent · Storyboard",
    stage: "boards",
    description: "Conventional image boards and production frames.",
  },
  {
    id: "burst-board-video",
    name: "Burst Board Video",
    stage: "boards",
    description: "Video bursts for storyboards or up to 20 design candidates.",
  },
  {
    id: "film.previs",
    name: "Film Agent · Silhouette previs",
    stage: "boards",
    description: "Color-coded blocking with reusable video references.",
  },
];
export const methodLabel = (id) =>
  METHODS.find((method) => method.id === id)?.name ||
  id ||
  "Imported · method unknown";
