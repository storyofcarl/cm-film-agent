import {
  sceneShots,
  selectedVersion,
  sceneIsApproved,
  stable,
  orderedScenes,
} from "./domain";

export function deliveryTimeline(
  project,
  sceneId = null,
  { review = false } = {},
) {
  const scenes = orderedScenes(project).filter(
    (node) => !sceneId || node.id === sceneId,
  );
  const clips = [];
  let position = 0;
  for (const scene of scenes) {
    if (!review && !sceneIsApproved(project, scene.id))
      throw new Error(
        `Approve ${scene.title}'s current assembly before delivery.`,
      );
    for (const shot of sceneShots(project, scene.id)) {
      const version = selectedVersion(shot);
      if (
        version?.media?.type !== "video" ||
        !version.media.url ||
        (!review && version.review !== "approved")
      )
        throw new Error(
          `${shot.title} needs an approved video take for video delivery.`,
        );
      const clip = {
        sceneId: scene.id,
        scene: scene.title,
        shotId: shot.id,
        title: shot.title,
        versionId: version.id,
        url: version.media.url,
        in: Number(version.media.in || 0),
        out: Number(
          version.media.out ?? Number(version.media.in || 0) + shot.duration,
        ),
        timelineIn: position,
        duration: shot.duration,
      };
      if (!(clip.out > clip.in))
        throw new Error(`${shot.title} has an invalid source range.`);
      clips.push(clip);
      position += shot.duration;
    }
  }
  if (!clips.length) throw new Error("The delivery has no approved shots.");
  const edge = review
    ? 854
    : { "1080p": 1920, "2K": 2560, "4K": 3840 }[
        project.settings.deliveryResolution
      ] || 1920;
  const [a, b] = project.settings.aspectRatio.split(":").map(Number);
  if (!(a > 0 && b > 0 && Number.isFinite(a / b)))
    throw new Error("Choose a valid aspect ratio before assembly.");
  const ratio = a / b;
  const dimensions =
    ratio >= 1
      ? { width: edge, height: Math.round(edge / ratio / 2) * 2 }
      : { width: Math.round((edge * ratio) / 2) * 2, height: edge };
  return {
    title: project.title,
    projectId: project.id,
    sceneId,
    duration: position,
    fps: 24,
    dimensions,
    clips,
    signature: stable({
      clips: clips.map(({ shotId, versionId, in: start, out }) => ({
        shotId,
        versionId,
        in: start,
        out,
      })),
      dimensions,
    }),
  };
}
export function editorialManifest(project, timeline) {
  return {
    format: "film-agent-editorial-v1",
    createdAt: new Date().toISOString(),
    ...timeline,
    clips: timeline.clips.map((clip) => ({
      ...clip,
      sourceFilename: `${clip.shotId}-${clip.versionId}.mp4`,
      recipe: project.shots
        .find((shot) => shot.id === clip.shotId)
        .versions.find((version) => version.id === clip.versionId),
    })),
    globalStyle: project.globalStyle,
    settings: project.settings,
    approvals: project.sceneApprovals,
    decisionHistory: project.events,
  };
}
export function otioTimeline(timeline) {
  const time = (seconds) => ({
    OTIO_SCHEMA: "RationalTime.1",
    value: seconds * timeline.fps,
    rate: timeline.fps,
  });
  return {
    OTIO_SCHEMA: "Timeline.1",
    name: timeline.title,
    global_start_time: time(0),
    metadata: { filmAgentProject: timeline.projectId },
    tracks: {
      OTIO_SCHEMA: "Stack.1",
      name: "Production",
      children: [
        {
          OTIO_SCHEMA: "Track.1",
          name: "Picture and source sound",
          kind: "Video",
          children: timeline.clips.map((clip) => ({
            OTIO_SCHEMA: "Clip.2",
            name: clip.title,
            metadata: {
              shotId: clip.shotId,
              versionId: clip.versionId,
              scene: clip.scene,
            },
            source_range: {
              OTIO_SCHEMA: "TimeRange.1",
              start_time: time(clip.in),
              duration: time(clip.out - clip.in),
            },
            media_references: {
              DEFAULT_MEDIA: {
                OTIO_SCHEMA: "ExternalReference.1",
                target_url: `${clip.shotId}-${clip.versionId}.mp4`,
                metadata: {},
              },
            },
            active_media_reference_key: "DEFAULT_MEDIA",
            effects: [],
            markers: [],
            enabled: true,
          })),
          effects: [],
          markers: [],
        },
      ],
      effects: [],
      markers: [],
    },
  };
}
