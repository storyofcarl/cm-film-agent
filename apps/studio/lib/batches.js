import {
  uid,
  compileSegments,
  sceneShots,
  selectedVersion,
  revisionItems,
  setupSignature,
  lookdevRequirement,
  lookdevIsApproved,
  sceneIsApproved,
  inputSignature,
  orderedScenes,
  effectiveAssetIds,
  inheritedDirection,
} from "./domain.js";
import { upscaleEstimate, UPSCALE_RATE_SOURCE } from "./upscalers.js";

const fail = (message) => {
  throw new Error(message);
};
const sourceRefs = (project, shot) => [
  ...project.assets
    .filter((asset) =>
      effectiveAssetIds(project, shot?.id || project.id).includes(asset.id),
    )
    .map((asset) => {
      const version = selectedVersion(asset);
      return {
        assetId: asset.id,
        versionId: version?.id || null,
        url: version?.media?.url || null,
        type: "image",
        role: "reference_image",
      };
    }),
  ...(project.guides || [])
    .filter((guide) => shot?.guideVersionIds?.includes(guide.id))
    .map((guide) => ({
      guideId: guide.id,
      url: guide.media.url,
      type: guide.media.type,
      role:
        guide.media.type === "video" ? "reference_video" : "reference_image",
    })),
];
const makeJob = (fields) => ({
  id: uid("job"),
  state: "planned",
  dependsOn: [],
  ...fields,
});
const seed = (project) =>
  Number.isSafeInteger(Number(project.settings.seed)) &&
  project.settings.seed != null
    ? Number(project.settings.seed)
    : Math.floor(Math.random() * 2147483647);
const silhouetteCast = (project) =>
  project.assets
    .filter((asset) => ["character", "creature"].includes(asset.type))
    .map((asset, index) => {
      const palette = [
        "red",
        "blue",
        "yellow",
        "green",
        "magenta",
        "cyan",
        "orange",
        "violet",
      ];
      return `${asset.title}: ${palette[index % palette.length]} faceless dummy; preserve its distinctive silhouette. ${asset.description || ""}`;
    })
    .join("\n");
export function prepareBatch(project, options, catalog) {
  const { kind, route: defaultRoute = "frames" } = options;
  const model = catalog.find(
    (entry) =>
      entry.id === (options.model || project.settings.videoModel) &&
      entry.kind === "video",
  );
  const imageModel =
    catalog.find(
      (entry) =>
        entry.id === (options.imageModel || project.settings.imageModel) &&
        entry.kind === "image",
    ) || catalog.find((entry) => entry.kind === "image");
  if (model) project.settings.videoModel = model.id;
  if (imageModel) project.settings.imageModel = imageModel.id;
  const scenes = orderedScenes(project);
  const batch = {
    id: uid("batch"),
    kind,
    title: `${project.title} · ${kind}`,
    scope: project.scope,
    createdAt: new Date().toISOString(),
    state: "planned",
    jobs: [],
    estimate: {
      total: null,
      currency: "USD",
      basis: "Enter the provider quote or rate-based estimate before approval.",
    },
  };
  const videoRequest = (segment, refs = []) => ({
    type: "video",
    model: model.id,
    prompt: segment.prompt,
    globalStyle: project.globalStyle,
    duration: segment.duration,
    resolution: segment.resolution,
    ratio: project.settings.aspectRatio,
    seed: model.supportsSeed === false ? null : seed(project),
    audio: project.settings.audio !== false,
    references: refs,
  });
  const imageJob = (asset, extra = {}) => {
    if (!imageModel) fail("Choose an image model before preparing assets.");
    return makeJob({
      title: asset.title,
      targetId: asset.id,
      setupScope: "assets",
      setupSignature: setupSignature(project, "assets"),
      request: {
        type: "image",
        model: imageModel.id,
        prompt: [
          project.globalStyle,
          inheritedDirection(project, asset.id),
          asset.prompt || asset.description,
        ]
          .filter(Boolean)
          .join("\n\n"),
        size: "2K",
        references: asset.kind === "shot" ? sourceRefs(project, asset) : [],
        seed: imageModel.provider === "wavespeed" ? null : seed(project),
      },
      ...extra,
    });
  };
  const profile = () => {
    if (!model) fail("Choose a video model before preparing this batch.");
    return {
      model: model.id,
      minDuration: model.minDuration,
      maxDuration: model.maxDuration,
      resolution: model.resolutions.includes(project.settings.draftResolution)
        ? project.settings.draftResolution
        : model.resolutions[0],
    };
  };
  const ensureSegments = () => {
    const selected = profile();
    project.segmentProfiles = Object.fromEntries(
      scenes.map((scene) => [scene.id, selected]),
    );
    project.segments = scenes.flatMap((scene) =>
      compileSegments(project, scene.id, selected),
    );
  };
  const fromSegment = (segment, extra = {}) =>
    makeJob({
      title: `${project.nodes.find((node) => node.id === segment.sceneId)?.title} · Segment ${segment.order + 1}`,
      sceneId: segment.sceneId,
      segmentId: segment.id,
      parts: segment.parts,
      setupScope: segment.sceneId,
      setupSignature: setupSignature(project, segment.sceneId),
      request: videoRequest(segment, [
        ...new Map(
          segment.parts
            .flatMap((part) =>
              sourceRefs(
                project,
                project.shots.find((shot) => shot.id === part.shotId),
              ),
            )
            .map((reference) => [
              reference.assetId || reference.guideId || reference.url,
              reference,
            ]),
        ).values(),
      ]),
      ...extra,
    });

  if (kind === "intake") {
    const reasoner =
      catalog.find(
        (entry) => entry.id === options.llmModel && entry.kind === "llm",
      ) ||
      catalog.find((entry) => entry.id === "claude-opus-5") ||
      catalog.find((entry) => entry.kind === "llm");
    if (!reasoner)
      fail("Choose a reasoning model for supplied-work validation.");
    for (const item of [...project.assets, ...project.shots])
      for (const version of item.versions.filter(
        (entry) =>
          entry.origin === "imported" &&
          entry.media?.url &&
          entry.review === "pending" &&
          entry.validation?.status !== "complete",
      )) {
        batch.jobs.push(
          makeJob({
            title: `${item.title} · supplied V${version.number}`,
            targetId: item.id,
            sourceVersionId: version.id,
            request: {
              type: "validation",
              model: reasoner.id,
              media: version.media,
              requiredType: item.kind === "shot" ? "video" : "image",
              requiredDuration: item.duration || null,
              prompt: `Validate this supplied ${item.kind} for the production.\nTITLE: ${item.title}\nREQUIREMENTS: ${item.prompt || item.description || "Usable completed media of the declared type."}\nUSED DURATION: ${item.duration || "still"}\nPROJECT: ${project.brief}\nGLOBAL STYLE: ${project.globalStyle}\nImported provenance may be unknown. Return explicit completeness findings, not a rewrite.`,
              references: [],
            },
          }),
        );
      }
    for (const artifact of project.artifacts.filter(
      (entry) =>
        entry.origin === "imported" &&
        entry.review === "pending" &&
        entry.content?.trim(),
    ))
      batch.jobs.push(
        makeJob({
          title: `${artifact.title} · completeness`,
          targetId: artifact.id,
          sourceVersionId: artifact.id,
          request: {
            type: "validation",
            model: reasoner.id,
            prompt: `Validate this supplied production document against its own declared purpose and the production brief. Identify whether it is complete enough to use without recreating its stage. Do not demand optional workflows or rewrite the document. A finished screenplay, director's vision, or shot list may each stand alone.\nPRODUCTION: ${project.title}\nBRIEF: ${project.brief}\nDOCUMENT TITLE: ${artifact.title}\nFULL DOCUMENT:\n${artifact.content}`,
            references: [],
          },
        }),
      );
    for (const guide of (project.guides || []).filter(
      (entry) =>
        entry.origin === "imported" &&
        entry.review === "pending" &&
        entry.media?.url,
    ))
      batch.jobs.push(
        makeJob({
          title: `${guide.title} · supplied guide`,
          targetId: guide.id,
          sourceVersionId: guide.id,
          request: {
            type: "validation",
            model: reasoner.id,
            media: guide.media,
            requiredType: guide.kind === "previs" ? "video" : "image",
            prompt: `Validate this supplied ${guide.kind} guide for reuse. Assess its declared role, visible completeness and alignment with the production intent. Do not require finished character designs for silhouette previs.\nTITLE: ${guide.title}\nBRIEF: ${project.brief}\nDIRECTION: ${guide.prompt || "Use as a production reference; original prompt unknown."}`,
            references: [],
          },
        }),
      );
  } else if (kind === "assets") {
    batch.jobs = project.assets
      .filter(
        (asset) =>
          !asset.versions.some(
            (version) => version.media?.url && version.review !== "revision",
          ),
      )
      .map((asset) => imageJob(asset));
  } else if (kind === "lookdev") {
    const assetsApproved = project.lookdev.some(
      (entry) =>
        entry.scope === "assets" &&
        entry.review === "approved" &&
        entry.signature === setupSignature(project, "assets"),
    );
    if (
      !assetsApproved &&
      project.assets.length &&
      !project.assets.every(
        (asset) => selectedVersion(asset)?.review === "approved",
      )
    ) {
      const representative = ["character", "location"]
        .map((type) => project.assets.find((asset) => asset.type === type))
        .filter(Boolean);
      if (!representative.length) representative.push(project.assets[0]);
      batch.jobs = representative.map((asset) => imageJob(asset));
      batch.scopes = [
        { scope: "assets", signature: setupSignature(project, "assets") },
      ];
    } else {
      ensureSegments();
      batch.scopes = [];
      for (const scene of scenes) {
        const requirement = lookdevRequirement(project, scene.id);
        if (
          !requirement.required ||
          lookdevIsApproved(project, scene.id) ||
          batch.scopes.some((entry) => entry.scope === requirement.scope)
        )
          continue;
        const segment = project.segments.find(
          (entry) => entry.sceneId === scene.id,
        );
        if (!segment) continue;
        batch.jobs.push(fromSegment(segment));
        batch.scopes.push({
          scope: requirement.scope,
          signature: requirement.signature,
        });
      }
    }
  } else if (["production", "previs", "boards"].includes(kind)) {
    ensureSegments();
    if (kind === "boards") {
      batch.jobs = project.shots.map((shot) =>
        imageJob(shot, {
          sceneId: shot.sceneId,
          guide: "board",
          setupScope: shot.sceneId,
          setupSignature: setupSignature(project, shot.sceneId),
        }),
      );
    } else {
      for (const scene of scenes) {
        const missing = sceneShots(project, scene.id).filter(
          (shot) =>
            kind === "previs" ||
            !shot.versions.some(
              (version) =>
                version.media?.type === "video" &&
                version.review !== "revision",
            ),
        );
        const planning = { ...project, shots: missing };
        const reusable =
          kind === "production"
            ? (project.shotFragments || []).filter(
                (fragment) =>
                  fragment.setupSignature ===
                    setupSignature(project, scene.id) &&
                  fragment.sceneId === scene.id &&
                  fragment.originKind === "lookdev" &&
                  lookdevIsApproved(project, scene.id),
              )
            : [];
        const skipBeats = Object.fromEntries(
          missing.map((shot) => [
            shot.id,
            reusable
              .filter(
                (fragment) =>
                  fragment.shotId === shot.id &&
                  fragment.shotPrompt === shot.prompt,
              )
              .map((fragment) => fragment.beat),
          ]),
        );
        const segments = compileSegments(planning, scene.id, {
          ...profile(),
          skipBeats,
        });
        let previous;
        for (const segment of segments) {
          const job = fromSegment(segment);
          const first = segment.parts[0];
          if (first.beat > 0 && !previous) {
            const prefix = reusable.find(
              (fragment) =>
                fragment.shotId === first.shotId &&
                fragment.beat === first.beat - 1,
            );
            if (prefix)
              job.continuationSource = {
                url: prefix.url,
                type: "video",
                in: prefix.in,
                out: prefix.out,
              };
          }
          if (kind === "previs") {
            job.guide = "previs";
            job.request.references = [];
            job.request.prompt = `FACELESS SILHOUETTE PREVIS. No facial features or costume details. Prioritize camera, blocking, timing and screen direction. Use this same cast color map in every segment:\n${silhouetteCast(project) || "Use neutral gray dummies for unnamed figures."}\n\n${segment.prompt}`;
          }
          if (segment.continuationFromOrder !== null && previous) {
            job.dependsOn = [previous.id];
            job.continuation = true;
          }
          batch.jobs.push(job);
          previous = job;
        }
      }
    }
  } else if (["burst-boards", "burst-assets"].includes(kind)) {
    const selected = profile();
    const targets = kind === "burst-assets" ? project.assets : project.shots;
    for (let start = 0; start < targets.length; start += 20) {
      const group = targets.slice(start, start + 20);
      const seconds = Math.max(5, selected.minDuration);
      const prompt =
        `BURST BOARD VIDEO. ${group.length} discrete, static, fully composed still images in ${seconds} seconds. Hard cuts only. No dissolves, morphing, pans, zooms, title text or transitions. Each composition must remain visually stable for its entire interval. Preserve global style and consistent spatial relationships.\nGLOBAL STYLE: ${project.globalStyle}\n` +
        group
          .map(
            (item, index) =>
              `${((index * seconds) / group.length).toFixed(3)}-${(((index + 1) * seconds) / group.length).toFixed(3)}s: ${item.title}. ${inheritedDirection(project, item.id)} ${item.prompt || item.description}`,
          )
          .join("\n");
      batch.jobs.push(
        makeJob({
          title: `${kind === "burst-assets" ? "Design" : "Storyboard"} burst ${Math.floor(start / 20) + 1}`,
          guide: "burst",
          frameMap: group.map((item, index) => ({
            targetId: item.id,
            sceneId: item.sceneId || null,
            title: item.title,
            timestamp: ((index + 0.5) * seconds) / group.length,
            kind: kind === "burst-assets" ? "asset" : "board",
          })),
          request: videoRequest(
            { prompt, duration: seconds, resolution: selected.resolution },
            kind === "burst-boards"
              ? [
                  ...new Map(
                    group
                      .flatMap((shot) => sourceRefs(project, shot))
                      .map((reference) => [
                        reference.assetId || reference.guideId || reference.url,
                        reference,
                      ]),
                  ).values(),
                ]
              : [],
          ),
        }),
      );
    }
  } else if (kind === "revision") {
    if (!["frames", "video-edit", "rerun"].includes(defaultRoute))
      fail("Choose a supported repair method.");
    for (const { item, version } of revisionItems(project)) {
      const route = version.repairRoute || defaultRoute;
      if (!["frames", "video-edit", "rerun"].includes(route))
        fail("Choose a supported repair method for each version.");
      if (item.kind === "asset") {
        const job = imageJob(item, { sourceVersionId: version.id });
        job.request.prompt = `Edit the supplied image. Change only: ${version.note || item.prompt}. Preserve all other design and composition.`;
        job.request.references = [
          { url: version.media?.url, type: "image", role: "reference_image" },
        ];
        batch.jobs.push(job);
        continue;
      }
      const selected = profile();
      const segments = compileSegments(
        { ...project, shots: [item] },
        item.sceneId,
        selected,
      );
      let previous;
      for (const segment of segments) {
        const job = fromSegment(segment, {
          targetId: item.id,
          sourceVersionId: version.id,
          route,
        });
        job.request.prompt =
          route === "rerun"
            ? [
                segment.prompt,
                version.note ? `REVISION DIRECTION: ${version.note}` : "",
              ]
                .filter(Boolean)
                .join("\n\n")
            : `Change only: ${version.note || item.prompt}. Preserve all other timing, composition, action and identity.\n\nORIGINAL: ${segment.prompt}`;
        if (route === "rerun" && options.rerunPrompt === "original") {
          const recorded =
            version.prompts?.find(
              (recipe) =>
                recipe.shotOffset === segment.parts[0].shotOffset &&
                recipe.duration === segment.usedDuration,
            )?.prompt || (segments.length === 1 ? version.prompt : null);
          if (!recorded)
            fail(
              `${item.title} has no exact recorded prompt for this segment. Choose revised direction or supply the original recipe.`,
            );
          job.request.prompt = recorded;
        }
        if (route === "video-edit") {
          if (!model.supportsVideoReference)
            fail(
              "This model cannot accept a video edit reference. Choose a video-reference model or frame repair.",
            );
          job.request.references.unshift({
            url: version.media?.url,
            type: "video",
            role: "reference_video",
            sourceVersionId: version.id,
            in: (version.media?.in || 0) + segment.parts[0].shotOffset,
            out:
              (version.media?.in || 0) +
              segment.parts[0].shotOffset +
              segment.usedDuration,
          });
        }
        if (route === "frames") {
          if (!imageModel) fail("Choose an image model for frame repair.");
          job.frameDependencies = [];
          for (const position of options.repairFrames === "both"
            ? ["first", "last"]
            : ["first"]) {
            const timestamp =
              (version.media?.in || 0) +
              segment.parts[0].shotOffset +
              (position === "last"
                ? Math.max(0, segment.usedDuration - 0.1)
                : 0);
            const frame = makeJob({
              title: `${item.title} · extract and edit ${position === "first" ? "opening" : "closing"} frame`,
              targetId: item.id,
              sceneId: item.sceneId,
              sourceVersionId: version.id,
              guide: "repair-frame",
              request: {
                type: "frame-edit",
                model: imageModel.id,
                prompt: `Change only: ${version.note || item.prompt}. Preserve the rest of this frame.`,
                source: version.media,
                size: "2K",
                references: [],
                timestamp,
              },
            });
            batch.jobs.push(frame);
            job.dependsOn.push(frame.id);
            job.frameDependencies.push({
              id: frame.id,
              role: position === "first" ? "first_frame" : "last_frame",
            });
          }
          job.request.references = [];
          job.referencePolicy =
            "Use the repaired source frame as the opening frame; preserve its embedded character and setting identities.";
        }
        if (segment.continuationFromOrder !== null && previous) {
          job.dependsOn.push(previous.id);
          job.continuation = true;
        }
        batch.jobs.push(job);
        previous = job;
      }
    }
  } else if (kind === "finishing" && options.finishMode !== "v2v") {
    const upscaler =
      catalog.find(
        (entry) =>
          entry.kind === "upscale" && entry.id === options.upscaleModel,
      ) || catalog.find((entry) => entry.kind === "upscale");
    const resolution = project.settings.deliveryResolution;
    if (!upscaler || !upscaler.resolutions.includes(resolution))
      fail(
        "Enable a video upscaler supporting the selected delivery resolution.",
      );
    let estimate = 0;
    for (const scene of scenes.filter((entry) =>
      sceneIsApproved(project, entry.id),
    ))
      for (const shot of sceneShots(project, scene.id)) {
        const source = selectedVersion(shot);
        if (source.media?.type !== "video")
          fail(`${shot.title} needs an approved video source.`);
        for (
          let offset = 0, beat = 0;
          offset < shot.duration;
          offset += 600, beat++
        ) {
          const duration = Math.min(600, shot.duration - offset);
          batch.jobs.push(
            makeJob({
              title: `${shot.title} · ${resolution} upscale`,
              sceneId: scene.id,
              targetId: shot.id,
              sourceVersionId: source.id,
              route: "upscale",
              parts: [
                {
                  shotId: shot.id,
                  beat,
                  shotOffset: offset,
                  start: 0,
                  end: duration,
                  duration,
                },
              ],
              request: {
                type: "upscale",
                model: upscaler.id,
                prompt:
                  "Upscale the approved source without changing its edit, timing, or creative content.",
                resolution,
                duration,
                references: [],
                source: {
                  url: source.media.url,
                  type: "video",
                  in: (source.media.in || 0) + offset,
                  out: (source.media.in || 0) + offset + duration,
                },
                originalPrompt: source.prompt,
                originalSeed: source.seed,
              },
            }),
          );
          estimate += upscaleEstimate(upscaler, resolution, duration);
        }
      }
    batch.estimate = {
      total: Math.round(estimate * 10000) / 10000,
      currency: "USD",
      basis:
        "Published per-second rate, rounded up with 3-second minimum per request. Verified 2026-09-16.",
      source: UPSCALE_RATE_SOURCE,
    };
  } else if (kind === "finishing") {
    const selected = profile();
    const resolution = project.settings.deliveryResolution;
    if (!model.resolutions.includes(resolution))
      fail(
        `This model cannot generate ${resolution}. Choose a supported finish resolution/model or use an external upscaler.`,
      );
    if (!model.supportsVideoReference)
      fail(
        "Choose a model with video-reference support for this finishing pass.",
      );
    for (const scene of scenes.filter((entry) =>
      sceneIsApproved(project, entry.id),
    ))
      for (const shot of sceneShots(project, scene.id)) {
        const source = selectedVersion(shot);
        if (!source.prompt)
          fail(
            `${shot.title} has no recorded prompt. Supply its exact prompt before a same-prompt finishing generation.`,
          );
        if (source.seed == null || !model.supportsSeed)
          fail(
            `${shot.title} cannot use a same-seed finishing generation with this source/model. Use upscale finishing or choose a source and model with a recorded supported seed.`,
          );
        for (const segment of compileSegments(
          { ...project, shots: [{ ...shot, prompt: source.prompt }] },
          scene.id,
          { ...selected, resolution },
        )) {
          const job = fromSegment(segment, {
            targetId: shot.id,
            sourceVersionId: source.id,
            route: "v2v-finish",
            finish: true,
          });
          job.request.prompt = source.prompt;
          job.request.seed = source.seed;
          job.request.resolution = resolution;
          job.request.references.unshift({
            url: source.media.url,
            type: "video",
            role: "reference_video",
            sourceVersionId: source.id,
            in: (source.media.in || 0) + segment.parts[0].shotOffset,
            out:
              (source.media.in || 0) +
              segment.parts[0].shotOffset +
              segment.usedDuration,
          });
          batch.jobs.push(job);
        }
      }
  } else fail("Choose an available production batch type.");
  if (!batch.jobs.length)
    fail(
      "No work is missing for this batch. Review existing versions or prepare the prerequisites shown in the workspace.",
    );
  for (const job of batch.jobs) {
    job.sourceItemIds = [
      ...new Set(
        [
          job.targetId,
          ...(job.parts || []).map((part) => part.shotId),
          ...(job.frameMap || []).map((frame) => frame.targetId),
        ].filter(Boolean),
      ),
    ];
    job.sourceSignature = inputSignature(project, job.sourceItemIds);
  }
  const targets = new Set(batch.jobs.flatMap((job) => job.sourceItemIds));
  for (const previous of project.batches.filter(
    (entry) =>
      entry.kind === kind &&
      entry.state !== "superseded" &&
      entry.jobs.some((job) =>
        job.sourceItemIds?.some((id) => targets.has(id)),
      ),
  )) {
    if (
      previous.jobs.some((job) =>
        ["claimed", "queued", "running", "uncertain"].includes(job.state),
      )
    )
      fail(
        "A batch for these items is already executing or needs recovery. Refresh its results before preparing overlapping work.",
      );
    if (previous.jobs.every((job) => job.state === "planned")) {
      previous.state = "superseded";
      previous.approval = null;
      project.events.push({
        id: uid("event"),
        kind: "batch.superseded",
        actor: "crew",
        role: "agent",
        at: batch.createdAt,
        batchId: previous.id,
        replacementId: batch.id,
      });
    }
  }
  project.batches.unshift(batch);
  project.events.push({
    id: uid("event"),
    kind: "batch.prepared",
    actor: "crew",
    role: "agent",
    at: batch.createdAt,
    batchId: batch.id,
    count: batch.jobs.length,
  });
  return project;
}
