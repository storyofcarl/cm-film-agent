// Pure studio contract. No provider calls, UI state, secrets, or legacy orchestration.
import { appendDocument, documentArea } from "./documents";
export const REVIEW = ["pending", "approved", "revision"];
export const REVIEW_LABELS = {
  pending: "Pending review",
  approved: "Approved",
  revision: "Needs revision",
};
export const REVISION_ROUTES = ["frames", "video-edit", "rerun"];
export const SCHEMA_VERSION = 2;
export const uid = (prefix = "id") =>
  `${prefix}_${globalThis.crypto.randomUUID()}`;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const now = () => new Date().toISOString();
const clone = (value) => JSON.parse(JSON.stringify(value));
export function ensureProductionIds(project) {
  project.idCounters ||= {};
  const documentRoots = (project.artifacts || []).filter(
    (entry) =>
      (!entry.documentId || entry.documentId === entry.id) &&
      documentArea(project, entry),
  );
  const records = [
    [project, "PRJ"],
    ...project.nodes.map((node) => [
      node,
      { act: "ACT", sequence: "SEQ", scene: "SC" }[node.type],
    ]),
    ...project.shots.map((shot) => [shot, "SH"]),
    ...project.assets.map((asset) => [asset, "AST"]),
    ...(project.inbox || []).map((entry) => [entry, "IN"]),
    ...documentRoots.map((entry) => [entry, "DOC"]),
    ...(project.segments || []).map((segment) => [segment, "SEG"]),
    ...(project.batches || []).flatMap((batch) => [
      [batch, "BAT"],
      ...batch.jobs.map((job) => [job, "JOB"]),
    ]),
  ];
  const used = new Set(records.map(([record]) => record.code).filter(Boolean));
  for (const [record, prefix] of records) {
    if (record.code || !prefix) continue;
    let number = Number(project.idCounters[prefix]) || 0;
    do {
      number += 1;
    } while (used.has(`${prefix}-${String(number).padStart(3, "0")}`));
    project.idCounters[prefix] = number;
    record.code = `${prefix}-${String(number).padStart(3, "0")}`;
    used.add(record.code);
  }
  for (const entry of project.artifacts || []) {
    if (entry.documentId)
      entry.code =
        documentRoots.find((root) => root.id === entry.documentId)?.code ||
        entry.code;
  }
  return project;
}
const finite = (value) => Number.isFinite(Number(value));
export const stable = (value) =>
  JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.keys(item)
          .sort()
          .reduce((out, key) => {
            out[key] = item[key];
            return out;
          }, {})
      : item,
  );

export function createProject({
  id = uid("film"),
  title = "Untitled picture",
  scope = "film",
  brief = "",
} = {}) {
  const act = uid("act");
  const sequence = uid("seq");
  const scene = uid("scene");
  return ensureProductionIds({
    schemaVersion: SCHEMA_VERSION,
    id,
    title,
    scope,
    brief,
    globalStyle: "",
    createdAt: now(),
    updatedAt: now(),
    settings: {
      lookdevMode: "scene",
      lookdevThreshold: 3,
      timingMode: "picture",
      aspectRatio: "16:9",
      draftResolution: "480p",
      deliveryResolution: "1080p",
    },
    nodes: [
      { id: act, parentId: null, type: "act", title: "Act I", order: 0 },
      {
        id: sequence,
        parentId: act,
        type: "sequence",
        title: "Sequence 01",
        order: 0,
      },
      {
        id: scene,
        parentId: sequence,
        type: "scene",
        title: "Scene 01",
        location: "",
        time: "",
        order: 0,
      },
    ],
    assets: [],
    shots: [],
    segments: [],
    batches: [],
    artifacts: [],
    events: [],
    lookdev: [],
    sceneApprovals: [],
    decisions: [],
    guides: [],
    deliveries: [],
  });
}

export function validateProject(project) {
  assert(
    project?.schemaVersion === SCHEMA_VERSION,
    "Choose a Studio v2 project manifest. Legacy projects need explicit import.",
  );
  assert(
    typeof project.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(project.id),
    "Invalid project identifier.",
  );
  assert(
    typeof project.title === "string" && project.title.trim(),
    "A project title is required.",
  );
  assert(
    ["film", "episode", "scene"].includes(project.scope),
    "Choose a film, episode, or scene deliverable.",
  );
  assert(
    project.settings &&
      ["scene", "picture"].includes(project.settings.lookdevMode),
    "Choose a lookdev coverage policy.",
  );
  assert(
    [
      "16:9",
      "9:16",
      "1:1",
      "4:3",
      "3:4",
      "21:9",
      "9:21",
      "2:3",
      "3:2",
    ].includes(project.settings.aspectRatio),
    "Choose a supported aspect ratio.",
  );
  assert(
    ["1080p", "2K", "4K"].includes(project.settings.deliveryResolution),
    "Choose a supported delivery resolution.",
  );
  if (project.settings.seed != null)
    assert(
      Number.isSafeInteger(project.settings.seed) &&
        project.settings.seed >= 0 &&
        project.settings.seed <= 2147483647,
      "Seed must be an integer from 0 to 2147483647.",
    );
  for (const key of [
    "nodes",
    "assets",
    "shots",
    "segments",
    "batches",
    "artifacts",
    "events",
    "lookdev",
    "sceneApprovals",
  ])
    assert(Array.isArray(project[key]), `Project is missing ${key}.`);
  const ids = new Set();
  for (const item of [
    ...project.nodes,
    ...project.assets,
    ...project.shots,
    ...project.segments,
    ...project.batches,
  ]) {
    assert(
      typeof item.id === "string" &&
        /^[\w-]{1,100}$/.test(item.id) &&
        !ids.has(item.id),
      "Project contains invalid or duplicate identifiers.",
    );
    ids.add(item.id);
  }
  const nodes = new Map(project.nodes.map((node) => [node.id, node]));
  for (const node of project.nodes) {
    assert(
      typeof node.title === "string" &&
        node.title.trim() &&
        Number.isFinite(node.order),
      "Every creative container needs a title and numeric position.",
    );
    assert(
      ["act", "sequence", "scene"].includes(node.type),
      "Invalid creative container.",
    );
    const expected = { act: null, sequence: "act", scene: "sequence" }[
      node.type
    ];
    assert(
      expected ? nodes.get(node.parentId)?.type === expected : !node.parentId,
      "Creative hierarchy contains an invalid parent.",
    );
  }
  for (const object of [project, ...project.nodes, ...project.shots]) {
    assert(
      object.prompt == null ||
        (typeof object.prompt === "string" && object.prompt.length <= 40000),
      "Object direction must be text of up to 40,000 characters.",
    );
    assert(
      object.assetIds == null ||
        (Array.isArray(object.assetIds) &&
          new Set(object.assetIds).size === object.assetIds.length &&
          object.assetIds.every((id) =>
            project.assets.some((asset) => asset.id === id),
          )),
      "Choose existing, unique asset references or inherit them.",
    );
  }
  for (const item of [...project.assets, ...project.shots]) {
    assert(
      typeof item.title === "string" &&
        item.title.trim() &&
        (item.prompt == null || typeof item.prompt === "string"),
      "Every asset and shot needs a title and text intent.",
    );
    assert(
      Array.isArray(item.versions),
      "Every asset and shot needs a version list.",
    );
    if (project.shots.includes(item)) {
      assert(
        nodes.get(item.sceneId)?.type === "scene",
        "Shot must belong to a scene.",
      );
      assert(
        finite(item.duration) && Number(item.duration) > 0,
        "Shot duration must be positive.",
      );
    }
    const versions = new Set();
    for (const version of item.versions) {
      assert(
        typeof version.id === "string" &&
          /^[\w-]{1,100}$/.test(version.id) &&
          !versions.has(version.id),
        "Duplicate or missing version identifier.",
      );
      versions.add(version.id);
      assert(REVIEW.includes(version.review), "Invalid review status.");
      if (version.media?.url)
        assert(
          /^(https?:\/\/|\/api\/film\/media\?|\/samples\/[^.]+\.svg$)/.test(
            version.media.url,
          ),
          "Media must be an uploaded reference or HTTPS URL.",
        );
    }
    assert(
      !item.selectedVersionId || versions.has(item.selectedVersionId),
      "Selected version does not exist.",
    );
  }
  return project;
}

export const findItem = (project, id) =>
  [...project.assets, ...project.shots].find((item) => item.id === id);
export function assignInbox(
  project,
  { inboxId, targetId, purpose = "version" },
) {
  const entry = project.inbox?.find((candidate) => candidate.id === inboxId);
  const item = findItem(project, targetId);
  assert(
    entry?.status === "ready" && entry.media?.url && item,
    "Choose usable supplied media and an existing asset or shot.",
  );
  assert(
    ["version", "board", "previs"].includes(purpose),
    "Choose a version, storyboard or previs assignment.",
  );
  const requiredType =
    purpose === "previs" || (purpose === "version" && item.kind === "shot")
      ? "video"
      : "image";
  assert(
    entry.media.type === requiredType,
    `This assignment requires ${requiredType} media.`,
  );
  entry.assignments ||= [];
  if (
    entry.assignments.some(
      (assignment) =>
        assignment.targetId === targetId && assignment.purpose === purpose,
    )
  )
    return;
  const record = {
    id: uid(purpose === "version" ? "version" : "guide"),
    media: clone(entry.media),
    sourceInboxId: entry.id,
    prompt: null,
    seed: null,
    model: null,
    method: "import",
    origin: "imported",
    review: "pending",
    createdAt: now(),
  };
  if (purpose === "version") {
    record.number = item.versions.length + 1;
    record.note = "Supplied work; completeness review pending.";
    item.versions.push(record);
    if (!item.selectedVersionId) item.selectedVersionId = record.id;
  } else {
    project.guides ||= [];
    project.guides.push({
      ...record,
      title: entry.title,
      kind: purpose,
      targetId,
    });
  }
  entry.assignments.push({ targetId, purpose, recordId: record.id });
}
export function creativePath(project, id) {
  const item = findItem(project, id);
  const chain = item?.kind === "shot" ? [item] : [];
  let node = project.nodes.find((entry) => entry.id === (item?.sceneId || id));
  while (node) {
    chain.unshift(node);
    node = project.nodes.find((entry) => entry.id === node.parentId);
  }
  return [project, ...chain];
}
export function effectiveAssetIds(project, id) {
  const source = creativePath(project, id)
    .reverse()
    .find((entry) => Array.isArray(entry.assetIds));
  return source ? source.assetIds : project.assets.map((asset) => asset.id);
}
export function contextShots(project, id) {
  const shot = project.shots.find((entry) => entry.id === id);
  if (shot) return [shot];
  return project.shots.filter((entry) =>
    creativePath(project, entry.id).some((parent) => parent.id === id),
  );
}
export function inheritedDirection(project, id) {
  return creativePath(project, id)
    .slice(1)
    .filter((entry) => !entry.kind)
    .map((node) =>
      [
        node.prompt ? `${node.type} direction: ${node.prompt}` : "",
        node.type === "scene" && node.location
          ? `Location: ${node.location}`
          : "",
        node.type === "scene" && node.time ? `Time: ${node.time}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .filter(Boolean)
    .join("\n\n");
}
export const selectedVersion = (item) =>
  item?.versions?.find((version) => version.id === item.selectedVersionId) ||
  null;
export const sceneShots = (project, id) =>
  project.shots
    .filter((shot) => shot.sceneId === id)
    .sort((a, b) => a.order - b.order);
export const orderedScenes = (project) =>
  project.nodes
    .filter((node) => node.type === "act")
    .sort((a, b) => a.order - b.order)
    .flatMap((act) =>
      project.nodes
        .filter((node) => node.parentId === act.id)
        .sort((a, b) => a.order - b.order)
        .flatMap((sequence) =>
          project.nodes
            .filter((node) => node.parentId === sequence.id)
            .sort((a, b) => a.order - b.order),
        ),
    );
export const revisionItems = (project) =>
  [...project.assets, ...project.shots].flatMap((item) => {
    const candidates = item.versions.filter(
      (version) =>
        version.review === "revision" &&
        !item.versions.some(
          (newer) =>
            newer.parentVersionId === version.id &&
            newer.createdAt >= version.createdAt &&
            newer.review !== "revision",
        ),
    );
    const version =
      candidates.find((entry) => entry.id === item.selectedVersionId) ||
      candidates.at(-1);
    return version ? [{ item, version }] : [];
  });
export const sceneSignature = (project, id) =>
  stable(
    sceneShots(project, id).map((shot) => ({
      id: shot.id,
      version: shot.selectedVersionId,
      range: selectedVersion(shot)?.media,
      duration: shot.duration,
    })),
  );
export const sceneIsApproved = (project, id) => {
  const shots = sceneShots(project, id);
  return (
    shots.length > 0 &&
    shots.every((shot) => selectedVersion(shot)?.review === "approved") &&
    project.sceneApprovals.some(
      (approval) =>
        approval.sceneId === id &&
        approval.signature === sceneSignature(project, id),
    )
  );
};
export const setupSignature = (project, sceneId = null) =>
  stable({
    style: project.globalStyle,
    settings: Object.fromEntries(
      Object.entries(project.settings).filter(
        ([key]) =>
          !["deliveryResolution", "lookdevMode", "lookdevThreshold"].includes(
            key,
          ),
      ),
    ),
    sceneId,
    creativeContext:
      sceneId === "assets"
        ? undefined
        : (sceneId
            ? creativePath(project, sceneId)
            : [project, ...project.nodes]
          ).map(({ id, prompt, assetIds, location, time }) => ({
            id,
            prompt,
            assetIds,
            location,
            time,
          })),
    references:
      sceneId === "assets"
        ? []
        : project.assets
            .map((asset) => ({
              id: asset.id,
              selected: asset.selectedVersionId,
            }))
            .sort((a, b) => a.id.localeCompare(b.id)),
  });
export function lookdevRequirement(project, sceneId) {
  if (project.settings.lookdevMode === "picture")
    return {
      required: true,
      scope: "picture",
      signature: setupSignature(project),
    };
  let count = project.segments.filter(
    (segment) => segment.sceneId === sceneId,
  ).length;
  const profile = project.segmentProfiles?.[sceneId];
  let planningError = null;
  if (profile) {
    count = 0;
    let used = 0;
    for (const shot of sceneShots(project, sceneId)) {
      const beats = shot.beats?.length
        ? shot.beats
        : [{ duration: shot.duration }];
      if (
        Math.abs(
          beats.reduce((sum, beat) => sum + Number(beat.duration), 0) -
            Number(shot.duration),
        ) > 0.01
      )
        planningError = "Timed beats must add up to the shot duration.";
      for (const beat of beats) {
        const duration = Number(beat.duration);
        if (
          !Number.isFinite(duration) ||
          duration <= 0 ||
          duration > profile.maxDuration
        ) {
          planningError =
            "Replan complete action beats within the selected model duration.";
          continue;
        }
        if (!count || used + duration > profile.maxDuration) {
          count++;
          used = 0;
        }
        used += duration;
      }
    }
  }
  return {
    required: Boolean(planningError) || count > 3,
    scope: sceneId,
    signature: setupSignature(project, sceneId),
    count,
    planningError,
  };
}
export function lookdevIsApproved(project, sceneId) {
  const required = lookdevRequirement(project, sceneId);
  if (required.planningError) return false;
  return (
    !required.required ||
    project.lookdev.some(
      (entry) =>
        entry.scope === required.scope &&
        entry.signature === required.signature &&
        entry.review === "approved",
    )
  );
}

// Each atomic beat must fit a model request. Long shots continue across complete beats.
// The compiler never guesses a split inside a sentence or indivisible action.
export function compileSegments(
  project,
  sceneId,
  {
    model,
    minDuration = 5,
    maxDuration = 15,
    resolution = "480p",
    skipBeats = {},
  },
) {
  assert(
    model && minDuration > 0 && maxDuration >= minDuration,
    "A valid model profile is required.",
  );
  const units = sceneShots(project, sceneId).flatMap((shot) => {
    const beats = shot.beats?.length
      ? shot.beats
      : [{ text: shot.prompt || shot.description, duration: shot.duration }];
    const beatDuration = beats.reduce(
      (total, beat) => total + Number(beat.duration),
      0,
    );
    assert(
      Math.abs(beatDuration - Number(shot.duration)) < 0.01,
      `Timed beats for ${shot.title} must add up to its used duration.`,
    );
    return beats
      .map((beat, index) => {
        assert(
          beat.text?.trim() &&
            finite(beat.duration) &&
            Number(beat.duration) > 0,
          `Shot ${shot.title} needs timed action beats.`,
        );
        assert(
          Number(beat.duration) <= maxDuration,
          `An indivisible action in ${shot.title} exceeds ${maxDuration}s. Define complete continuation beats or choose a longer model.`,
        );
        return {
          shotId: shot.id,
          beat: index,
          shotOffset: beats
            .slice(0, index)
            .reduce((sum, entry) => sum + Number(entry.duration), 0),
          text: beat.text,
          duration: Number(beat.duration),
        };
      })
      .filter((unit) => !skipBeats[shot.id]?.includes(unit.beat));
  });
  const groups = [];
  for (const unit of units) {
    let group = groups[groups.length - 1];
    if (!group || group.usedDuration + unit.duration > maxDuration) {
      group = { parts: [], usedDuration: 0 };
      groups.push(group);
    }
    group.parts.push({
      ...unit,
      start: group.usedDuration,
      end: group.usedDuration + unit.duration,
    });
    group.usedDuration += unit.duration;
  }
  return groups.map((group, index) => {
    const padding = Math.max(
      0,
      Math.ceil(Math.max(minDuration, group.usedDuration)) - group.usedDuration,
    );
    const previous = groups[index - 1];
    const continuation =
      previous && previous.parts.at(-1).shotId === group.parts[0].shotId;
    return {
      id: uid("segment"),
      sceneId,
      order: index,
      model,
      resolution,
      ...group,
      duration: group.usedDuration + padding,
      padding: { head: 0, tail: padding },
      continuationFromOrder: continuation ? index - 1 : null,
      prompt: [
        project.globalStyle,
        inheritedDirection(project, sceneId),
        ...[...new Set(group.parts.map((part) => part.shotId))]
          .map((id) => project.shots.find((shot) => shot.id === id))
          .filter((shot) => shot.beats?.length && shot.prompt)
          .map((shot) => `Shot direction (${shot.title}): ${shot.prompt}`),
        ...group.parts.map(
          (part) =>
            `${part.start.toFixed(2)}–${part.end.toFixed(2)}s: ${part.text}`,
        ),
        padding
          ? `After the action, hold the ending for ${padding.toFixed(2)} seconds as a removable tail.`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    };
  });
}

export const inputSignature = (project, ids) =>
  stable(
    ids.map((id) => {
      const item =
        findItem(project, id) ||
        project.artifacts.find((entry) => entry.id === id);
      return {
        id,
        prompt: item?.prompt,
        content: item?.content,
        beats: item?.beats,
        duration: item?.duration,
        order: item?.order,
        sceneId: item?.sceneId,
        assetIds: item?.assetIds,
        creativeContext:
          item?.kind === "shot"
            ? creativePath(project, item.id).map(
                ({ id, prompt, assetIds, location, time }) => ({
                  id,
                  prompt,
                  assetIds,
                  location,
                  time,
                }),
              )
            : undefined,
        guides: item?.guideVersionIds,
      };
    }),
  );
export function batchFingerprint(batch) {
  return stable({
    kind: batch.kind,
    scope: batch.scope,
    scopes: batch.scopes,
    setupSignature: batch.setupSignature,
    jobs: batch.jobs.map(
      ({
        id,
        request,
        targetId,
        sourceVersionId,
        segmentId,
        dependsOn,
        sceneId,
        parts,
        setupSignature,
        setupScope,
        continuation,
        continuationSource,
        frameDependency,
        frameDependencies,
        frameMap,
        sourceSignature,
      }) => ({
        id,
        request,
        targetId,
        sourceVersionId,
        segmentId,
        dependsOn,
        sceneId,
        parts,
        setupSignature,
        setupScope,
        continuation,
        continuationSource,
        frameDependency,
        frameDependencies,
        frameMap,
        sourceSignature,
      }),
    ),
    estimate: batch.estimate,
  });
}
export function jobBlockers(project, batch, job) {
  const reasons = [];
  if (batch.paused)
    reasons.push("This batch is paused. Resume it to release remaining jobs.");
  reasons.push(...(job.preflightErrors || []));
  if (batch.state === "superseded")
    reasons.push("This plan was replaced by a newer batch.");
  if (batch.approval?.fingerprint !== batchFingerprint(batch))
    reasons.push("Approve this batch plan before execution.");
  if (!job.request?.prompt?.trim())
    reasons.push("A compiled prompt is required.");
  if (!job.request?.model) reasons.push("Choose a supported model.");
  if (["production", "assets", "lookdev"].includes(batch.kind)) {
    const configured =
      job.request.type === "video"
        ? project.settings.videoModel
        : project.settings.imageModel;
    if (configured && job.request.model !== configured)
      reasons.push(
        "This model differs from the shared lookdev setup. Choose it in Crew and prepare a new batch so lookdev covers the actual production model.",
      );
  }
  if (
    batch.estimate?.total == null ||
    !Number.isFinite(batch.estimate.total) ||
    batch.estimate.total < 0
  )
    reasons.push("Record a total cost estimate before approving this batch.");
  if (
    job.setupSignature &&
    job.setupSignature !==
      setupSignature(project, job.setupScope ?? job.sceneId ?? null)
  )
    reasons.push(
      "The shared setup changed after this plan was prepared. Prepare an updated batch.",
    );
  if (
    job.sourceSignature &&
    job.sourceSignature !== inputSignature(project, job.sourceItemIds)
  )
    reasons.push(
      "Shot intent or reference selection changed after this plan was prepared. Prepare an updated batch.",
    );
  for (const dependency of job.dependsOn || []) {
    const source = batch.jobs.find((candidate) => candidate.id === dependency);
    if (source?.state !== "succeeded" || !source.output?.url)
      reasons.push(
        "A continuation or input job has not produced usable media.",
      );
  }
  for (const reference of job.request?.references || []) {
    if (
      reference.guideId &&
      project.guides?.find((guide) => guide.id === reference.guideId)
        ?.review !== "approved"
    )
      reasons.push(
        "Approve a selected storyboard or previs guide before using it as a production reference.",
      );
    if (!reference.assetId) continue;
    const version = findItem(project, reference.assetId)?.versions.find(
      (candidate) => candidate.id === reference.versionId,
    );
    if (version?.review !== "approved")
      reasons.push("A required asset version is not approved.");
  }
  if (
    batch.kind === "assets" &&
    !project.lookdev.some(
      (entry) =>
        entry.scope === "assets" &&
        entry.review === "approved" &&
        entry.signature === setupSignature(project, "assets"),
    )
  )
    reasons.push("Approve representative asset lookdev first.");
  if (
    ["production", "finishing"].includes(batch.kind) &&
    project.assets.some(
      (asset) => selectedVersion(asset)?.review !== "approved",
    )
  )
    reasons.push("Review the full asset batch before using it in production.");
  if (
    ["production", "revision"].includes(batch.kind) &&
    job.sceneId &&
    !lookdevIsApproved(project, job.sceneId)
  )
    reasons.push("Human lookdev approval is required for this scope.");
  if (batch.kind === "finishing" && !sceneIsApproved(project, job.sceneId))
    reasons.push("Approve the scene assembly before finishing.");
  if (
    batch.kind === "revision" &&
    !findItem(project, job.targetId)?.versions.some(
      (version) => version.id === job.sourceVersionId,
    )
  )
    reasons.push("The source version for this revision is missing.");
  if (job.request?.references?.some((reference) => !reference.url))
    reasons.push("A required reference has no usable media.");
  if (
    batch.kind === "production" &&
    job.parts?.some((part) =>
      project.shotFragments?.some(
        (fragment) =>
          fragment.shotId === part.shotId &&
          fragment.beat === part.beat &&
          fragment.originKind === "lookdev" &&
          fragment.setupSignature === setupSignature(project, job.sceneId) &&
          lookdevIsApproved(project, job.sceneId),
      ),
    )
  )
    reasons.push(
      "Usable lookdev footage is now available. Prepare an updated batch to reuse it.",
    );
  return [...new Set(reasons)];
}

export function applyCommand(
  input,
  command,
  actor = { id: "director", role: "human" },
) {
  const project = ensureProductionIds(clone(input));
  const payload = command.payload || {};
  const time = now();
  const human = () =>
    assert(actor.role === "human", "Human approval is required.");
  const event = (kind, detail) =>
    project.events.push({
      id: uid("event"),
      kind,
      actor: actor.id,
      role: actor.role,
      at: time,
      ...detail,
    });
  switch (command.type) {
    case "project.update":
      for (const key of ["title", "brief", "globalStyle"])
        if (typeof payload[key] === "string") project[key] = payload[key];
      if (payload.assetIds !== undefined) project.assetIds = payload.assetIds;
      if (payload.settings) {
        human();
        assert(
          !payload.settings.lookdevMode ||
            ["scene", "picture"].includes(payload.settings.lookdevMode),
          "Choose scene-default or whole-picture lookdev.",
        );
        const allowed = [
          "lookdevMode",
          "timingMode",
          "aspectRatio",
          "draftResolution",
          "deliveryResolution",
          "videoModel",
          "imageModel",
          "llmModel",
          "seed",
          "audio",
          "methodDefaults",
        ];
        project.settings = {
          ...project.settings,
          ...Object.fromEntries(
            Object.entries(payload.settings).filter(([key]) =>
              allowed.includes(key),
            ),
          ),
          lookdevThreshold: 3,
        };
      }
      event("project.updated", { fields: Object.keys(payload) });
      break;
    case "node.add": {
      assert(
        ["act", "sequence", "scene"].includes(payload.type),
        "Choose a creative container.",
      );
      project.nodes.push({
        id: uid(payload.type),
        parentId: payload.parentId || null,
        type: payload.type,
        title: payload.title || "Untitled",
        order: project.nodes.length,
        location: payload.location || "",
        time: payload.time || "",
        prompt: payload.prompt || "",
        assetIds: payload.assetIds ?? null,
      });
      break;
    }
    case "node.update": {
      const node = project.nodes.find((entry) => entry.id === payload.id);
      assert(node, "Creative container not found.");
      for (const key of [
        "title",
        "parentId",
        "location",
        "time",
        "order",
        "prompt",
        "assetIds",
      ])
        if (payload[key] !== undefined) node[key] = payload[key];
      event("node.updated", { nodeId: node.id });
      break;
    }
    case "item.move": {
      human();
      const item = findItem(project, payload.id);
      assert(item, "Item not found.");
      const siblings = (
        item.kind === "shot"
          ? project.shots.filter((entry) => entry.sceneId === item.sceneId)
          : project.assets
      ).sort((a, b) => a.order - b.order);
      const index = siblings.findIndex((entry) => entry.id === item.id);
      const destination = index + (payload.direction === "up" ? -1 : 1);
      if (destination < 0 || destination >= siblings.length) break;
      [siblings[index], siblings[destination]] = [
        siblings[destination],
        siblings[index],
      ];
      siblings.forEach((entry, order) => {
        entry.order = order;
      });
      event("item.moved", { itemId: item.id, direction: payload.direction });
      break;
    }
    case "item.add": {
      assert(["asset", "shot"].includes(payload.kind), "Choose asset or shot.");
      const list = payload.kind === "asset" ? project.assets : project.shots;
      list.push({
        id: uid(payload.kind),
        kind: payload.kind,
        title: payload.title || "Untitled",
        type: payload.assetType || "character",
        sceneId: payload.sceneId,
        order: list.length,
        duration: Number(payload.duration) || 5,
        prompt: payload.prompt || "",
        description: payload.description || "",
        versions: [],
        selectedVersionId: null,
        beats: payload.beats || [],
      });
      break;
    }
    case "item.update": {
      const item = findItem(project, payload.id);
      assert(item, "Item not found.");
      for (const key of [
        "title",
        "prompt",
        "description",
        "type",
        "duration",
        "beats",
        "sceneId",
        "assetIds",
        "guideVersionIds",
      ])
        if (payload[key] !== undefined) item[key] = payload[key];
      event("item.updated", { itemId: item.id });
      break;
    }
    case "artifact.apply": {
      human();
      const artifact = project.artifacts.find(
        (entry) => entry.id === payload.id,
      );
      assert(
        artifact?.proposal && !artifact.appliedAt,
        "Choose an unapplied crew proposal.",
      );
      const proposal = artifact.proposal;
      const proposalIds = new Set([
        project.id,
        ...project.nodes.map((node) => node.id),
        ...project.assets.map((asset) => asset.id),
        ...project.shots.map((shot) => shot.id),
      ]);
      const reserveId = (id) => {
        assert(
          typeof id === "string" && id && !proposalIds.has(id),
          "Every proposed new object needs a unique identifier distinct from existing objects.",
        );
        proposalIds.add(id);
      };
      const assetIds = new Map(
        project.assets.map((asset) => [asset.id, asset.id]),
      );
      for (const asset of proposal.assets || []) {
        const key = asset.id || uid("proposed_asset");
        reserveId(key);
        assetIds.set(key, uid("asset"));
        asset.id = key;
      }
      const resolveAssets = (ids) =>
        ids == null
          ? null
          : ids.map((id) => {
              assert(
                assetIds.has(id),
                "A proposed reference refers to an unknown asset.",
              );
              return assetIds.get(id);
            });
      const ids = new Map(project.nodes.map((node) => [node.id, node.id]));
      for (const node of proposal.nodes || []) {
        reserveId(node.id);
        ids.set(node.id, uid(node.type));
      }
      for (const node of proposal.nodes || [])
        project.nodes.push({
          id: ids.get(node.id),
          type: node.type,
          parentId: node.parentId ? ids.get(node.parentId) : null,
          title: String(node.title || "Untitled"),
          location: String(node.location || ""),
          time: String(node.time || ""),
          prompt: String(node.prompt || ""),
          assetIds: resolveAssets(node.assetIds),
          order: project.nodes.length,
        });
      for (const asset of proposal.assets || [])
        project.assets.push({
          id: assetIds.get(asset.id),
          kind: "asset",
          type: asset.type || "character",
          title: String(asset.title || "Untitled"),
          prompt: String(asset.prompt || ""),
          description: String(asset.description || ""),
          versions: [],
          selectedVersionId: null,
          order: project.assets.length,
        });
      for (const shot of proposal.shots || []) {
        assert(
          Number(shot.duration) > 0 && ids.get(shot.sceneId),
          "Every proposed shot needs a scene and positive duration.",
        );
        const shotId = uid("shot");
        if (shot.id) {
          reserveId(shot.id);
          ids.set(shot.id, shotId);
        }
        project.shots.push({
          id: shotId,
          kind: "shot",
          title: String(shot.title || "Untitled"),
          sceneId: ids.get(shot.sceneId),
          prompt: String(shot.prompt || ""),
          description: String(shot.description || ""),
          assetIds: resolveAssets(shot.assetIds),
          duration: Number(shot.duration),
          beats: shot.beats || [],
          versions: [],
          selectedVersionId: null,
          order: project.shots.length,
        });
      }
      for (const update of proposal.updates || []) {
        const item = findItem(project, update.id);
        assert(item, "A proposed update refers to an unknown asset or shot.");
        if (update.baseSignature)
          assert(
            update.baseSignature === inputSignature(project, [item.id]),
            "This item changed after the crew proposal. Request an updated proposal.",
          );
        if (update.previousPrompt != null)
          assert(
            item.prompt === update.previousPrompt,
            "This item changed after the crew proposal. Request an updated proposal.",
          );
        for (const key of [
          "title",
          "prompt",
          "description",
          "duration",
          "beats",
          "type",
        ])
          if (update[key] !== undefined) item[key] = update[key];
        if (update.assetIds !== undefined)
          item.assetIds = resolveAssets(update.assetIds);
        event("item.updated", { itemId: item.id, artifactId: artifact.id });
      }
      for (const update of proposal.nodeUpdates || []) {
        const node = project.nodes.find((entry) => entry.id === update.id);
        assert(node, "A proposed update refers to an unknown container.");
        assert(
          !update.baseSignature || stable(node) === update.baseSignature,
          "This container changed after the crew proposal. Request an updated proposal.",
        );
        for (const key of ["title", "prompt", "location", "time"])
          if (typeof update[key] === "string") node[key] = update[key];
        if (update.assetIds !== undefined)
          node.assetIds = resolveAssets(update.assetIds);
        event("node.updated", { nodeId: node.id, artifactId: artifact.id });
      }
      if (proposal.project) {
        const change = proposal.project;
        assert(
          !change.baseSignature ||
            change.baseSignature ===
              stable({
                title: project.title,
                brief: project.brief,
                globalStyle: project.globalStyle,
                settings: project.settings,
              }),
          "Project settings changed after the crew proposal. Request an updated proposal.",
        );
        for (const key of ["title", "brief", "globalStyle"])
          if (typeof change[key] === "string") project[key] = change[key];
        for (const key of [
          "llmModel",
          "imageModel",
          "videoModel",
          "aspectRatio",
          "draftResolution",
          "deliveryResolution",
          "seed",
          "audio",
          "lookdevMode",
          "methodDefaults",
        ])
          if (change.settings?.[key] !== undefined)
            project.settings[key] = change.settings[key];
        event("project.updated", { artifactId: artifact.id });
      }
      for (const assignment of proposal.inboxAssignments || [])
        assignInbox(project, {
          ...assignment,
          targetId:
            assetIds.get(assignment.targetId) ||
            ids.get(assignment.targetId) ||
            assignment.targetId,
        });
      artifact.appliedAt = time;
      artifact.review = "approved";
      event("crew.proposal.applied", { artifactId: artifact.id });
      break;
    }
    case "inbox.assign": {
      human();
      assignInbox(project, payload);
      event("work.assigned", {
        inboxId: payload.inboxId,
        targetId: payload.targetId,
        purpose: payload.purpose || "version",
      });
      break;
    }
    case "artifact.add": {
      assert(
        typeof payload.content === "string" &&
          payload.content.trim() &&
          payload.content.length <= 500000,
        "Supply a nonempty document up to 500,000 characters.",
      );
      const artifact = {
        id: uid("artifact"),
        title: String(payload.title || "Supplied document"),
        content: payload.content,
        method: payload.method || "import",
        origin: "imported",
        review: "pending",
        createdAt: time,
        prompt: null,
        seed: null,
      };
      project.artifacts.push(artifact);
      event("document.supplied", { artifactId: artifact.id });
      break;
    }
    case "document.revise": {
      human();
      const parent = project.artifacts.find((entry) => entry.id === payload.id);
      assert(parent && documentArea(project, parent), "Document not found.");
      const document = appendDocument(
        project,
        {
          title: payload.title || parent.title,
          content: payload.content,
          area: documentArea(project, parent),
          revisesId: parent.id,
        },
        { origin: "manual", actor: actor.id, createdAt: time },
      );
      event("document.revised", {
        artifactId: document.id,
        revisesId: parent.id,
      });
      break;
    }
    case "artifact.review": {
      human();
      assert(REVIEW.includes(payload.review), "Invalid review status.");
      const artifact = project.artifacts.find(
        (entry) => entry.id === payload.id,
      );
      assert(artifact, "Document not found.");
      artifact.review = payload.review;
      event("document.reviewed", {
        artifactId: artifact.id,
        review: artifact.review,
      });
      break;
    }
    case "guide.add": {
      assert(
        ["board", "previs", "design-candidate"].includes(payload.kind) &&
          payload.media?.url,
        "Choose a guide type and uploaded media.",
      );
      const target = findItem(project, payload.targetId);
      assert(target, "Choose the shot or asset this guide informs.");
      const guide = {
        id: uid("guide"),
        kind: payload.kind,
        title: String(payload.title || target.title),
        targetId: target.id,
        sceneId: target.sceneId || null,
        media: payload.media,
        prompt: payload.prompt ?? null,
        origin: "imported",
        review: "pending",
        createdAt: time,
      };
      project.guides ||= [];
      project.guides.push(guide);
      event("guide.supplied", { guideId: guide.id, itemId: target.id });
      break;
    }
    case "guide.review": {
      human();
      assert(REVIEW.includes(payload.review), "Invalid guide review status.");
      const guide = project.guides?.find((entry) => entry.id === payload.id);
      assert(guide, "Guide not found.");
      guide.review = payload.review;
      guide.note = String(payload.note || "");
      event("guide.reviewed", { guideId: guide.id, review: guide.review });
      break;
    }
    case "guide.select": {
      human();
      const guide = project.guides?.find((entry) => entry.id === payload.id);
      assert(guide, "Guide not found.");
      const targets = project.shots.filter((shot) =>
        payload.shotId
          ? shot.id === payload.shotId
          : guide.targetId
            ? shot.id === guide.targetId
            : shot.sceneId === guide.sceneId,
      );
      assert(targets.length, "Choose the shots this guide informs.");
      for (const shot of targets)
        shot.guideVersionIds =
          payload.selected === false
            ? (shot.guideVersionIds || []).filter((id) => id !== guide.id)
            : [...new Set([...(shot.guideVersionIds || []), guide.id])];
      event("guide.selected", {
        guideId: guide.id,
        shotIds: targets.map((shot) => shot.id),
        selected: payload.selected !== false,
      });
      break;
    }
    case "guide.promote": {
      human();
      const guide = project.guides?.find((entry) => entry.id === payload.id);
      const asset = project.assets.find(
        (entry) => entry.id === guide?.targetId,
      );
      assert(
        guide?.kind === "design-candidate" && asset,
        "Choose an asset design candidate.",
      );
      assert(
        !asset.versions.some((version) => version.guideId === guide.id),
        "This candidate already has an asset version.",
      );
      const version = {
        id: uid("version"),
        number: asset.versions.length + 1,
        review: "pending",
        createdAt: time,
        media: guide.media,
        guideId: guide.id,
        prompt: guide.prompt,
        model: guide.actualPayload?.model || null,
        seed: guide.actualPayload?.seed ?? null,
        sourceVideo: guide.sourceVideo,
        timestamp: guide.timestamp,
        origin: "generated",
        method: "burst-board-video",
      };
      asset.versions.push(version);
      if (!asset.selectedVersionId) asset.selectedVersionId = version.id;
      event("burst.promoted", {
        itemId: asset.id,
        versionId: version.id,
        guideId: guide.id,
      });
      break;
    }
    case "version.add": {
      const item = findItem(project, payload.itemId);
      assert(item, "Item not found.");
      assert(payload.media?.url, "Upload or choose source media first.");
      const version = {
        id: uid("version"),
        number: item.versions.length + 1,
        createdAt: time,
        review: "pending",
        note: "",
        media: payload.media,
        prompt: payload.prompt ?? null,
        seed: payload.seed ?? null,
        model: payload.model || null,
        method: payload.method || "import",
        references: payload.references || [],
        parentVersionId: payload.parentVersionId || null,
        origin: "imported",
      };
      item.versions.push(version);
      if (!item.selectedVersionId) item.selectedVersionId = version.id;
      event("version.added", { itemId: item.id, versionId: version.id });
      break;
    }
    case "version.review": {
      human();
      assert(REVIEW.includes(payload.review), "Invalid review status.");
      const item = findItem(project, payload.itemId);
      const version = item?.versions.find(
        (candidate) => candidate.id === payload.versionId,
      );
      assert(version, "Version not found.");
      if (payload.review === "approved")
        assert(
          version.media?.url,
          "A version needs usable media before approval.",
        );
      const previous = version.review;
      version.review = payload.review;
      version.note = String(payload.note ?? version.note ?? "");
      if (payload.repairRoute !== undefined) {
        assert(
          payload.repairRoute === "" ||
            REVISION_ROUTES.includes(payload.repairRoute),
          "Choose a supported repair method.",
        );
        version.repairRoute = payload.repairRoute || null;
      }
      event("version.reviewed", {
        itemId: item.id,
        versionId: version.id,
        previous,
        review: version.review,
        note: version.note,
        repairRoute: version.repairRoute || null,
      });
      break;
    }
    case "version.select": {
      human();
      const item = findItem(project, payload.itemId);
      assert(
        item?.versions.some((version) => version.id === payload.versionId),
        "Version not found.",
      );
      item.selectedVersionId = payload.versionId;
      event("version.selected", {
        itemId: item.id,
        versionId: payload.versionId,
      });
      break;
    }
    case "scene.approve": {
      human();
      const shots = sceneShots(project, payload.sceneId);
      assert(
        shots.length &&
          shots.every((shot) => selectedVersion(shot)?.review === "approved"),
        "Approve each selected shot version before approving the scene.",
      );
      project.sceneApprovals.push({
        sceneId: payload.sceneId,
        signature: sceneSignature(project, payload.sceneId),
        actor: actor.id,
        at: time,
      });
      event("scene.approved", { sceneId: payload.sceneId });
      break;
    }
    case "segments.compile": {
      const segments = compileSegments(
        project,
        payload.sceneId,
        payload.profile,
      );
      project.segmentProfiles ||= {};
      project.segmentProfiles[payload.sceneId] = payload.profile;
      project.segments = [
        ...project.segments.filter(
          (segment) => segment.sceneId !== payload.sceneId,
        ),
        ...segments,
      ];
      event("segments.compiled", {
        sceneId: payload.sceneId,
        count: segments.length,
      });
      break;
    }
    case "lookdev.approve": {
      human();
      const batch = project.batches.find(
        (candidate) => candidate.id === payload.batchId,
      );
      assert(
        batch?.kind === "lookdev" &&
          batch.jobs.length &&
          batch.jobs.every(
            (job) => job.state === "succeeded" && job.output?.url,
          ),
        "A completed lookdev batch is required.",
      );
      for (const entry of batch.scopes || [
        { scope: batch.scope, signature: batch.setupSignature },
      ]) {
        const signature = setupSignature(
          project,
          entry.scope === "picture" ? null : entry.scope,
        );
        assert(
          entry.signature === signature,
          "The setup changed after this lookdev was prepared. Review a test for the current setup.",
        );
        project.lookdev.push({
          scope: entry.scope,
          signature,
          batchId: batch.id,
          review: "approved",
          actor: actor.id,
          at: time,
        });
        event("lookdev.approved", { scope: entry.scope, batchId: batch.id });
      }
      break;
    }
    case "batch.estimate": {
      human();
      const batch = project.batches.find(
        (candidate) => candidate.id === payload.id,
      );
      assert(batch, "Batch not found.");
      assert(
        !batch.jobs.some((job) => job.state !== "planned"),
        "An executing batch cannot be repriced.",
      );
      assert(
        finite(payload.total) &&
          Number(payload.total) >= 0 &&
          String(payload.basis || "").trim(),
        "Record the estimated amount and its source.",
      );
      batch.estimate = {
        total: Number(payload.total),
        currency: "USD",
        basis: String(payload.basis),
        recordedBy: actor.id,
        at: time,
      };
      batch.approval = null;
      event("batch.estimated", { batchId: batch.id, estimate: batch.estimate });
      break;
    }
    case "batch.job.update": {
      human();
      const batch = project.batches.find(
        (entry) => entry.id === payload.batchId,
      );
      assert(
        batch &&
          batch.state !== "superseded" &&
          batch.jobs.every((job) => job.state === "planned"),
        "Edit a current batch before any job starts. Prepare a revision batch for work already running.",
      );
      const job = batch.jobs.find((entry) => entry.id === payload.jobId);
      assert(job, "Job not found.");
      for (const key of [
        "prompt",
        "model",
        "resolution",
        "duration",
        "seed",
        "size",
        "timestamp",
        "audio",
      ])
        if (payload.request?.[key] !== undefined)
          job.request[key] = payload.request[key];
      if (job.parts?.length)
        assert(
          Number(job.request.duration) >=
            Math.max(...job.parts.map((part) => part.end)),
          "The request must contain the complete shot actions before trimming.",
        );
      batch.approval = null;
      batch.state = "planned";
      batch.estimate = {
        total: null,
        currency: "USD",
        basis: "Request changed; update the estimate before approval.",
      };
      event("batch.job.updated", { batchId: batch.id, jobId: job.id });
      break;
    }
    case "batch.pause": {
      human();
      const batch = project.batches.find((entry) => entry.id === payload.id);
      assert(
        batch?.approval && batch.state !== "superseded",
        "Choose an approved current batch.",
      );
      batch.paused = payload.paused !== false;
      event(batch.paused ? "batch.paused" : "batch.resumed", {
        batchId: batch.id,
      });
      break;
    }
    case "batch.approve": {
      human();
      const batch = project.batches.find(
        (candidate) => candidate.id === payload.id,
      );
      assert(batch?.jobs.length, "Prepare a nonempty batch first.");
      assert(batch.state !== "superseded", "A newer batch replaced this plan.");
      assert(
        Number.isFinite(batch.estimate?.total) && batch.estimate.total >= 0,
        "Record a total cost estimate before approving the batch.",
      );
      batch.approval = {
        actor: actor.id,
        at: time,
        fingerprint: batchFingerprint(batch),
      };
      batch.state = "approved";
      event("batch.approved", { batchId: batch.id, estimate: batch.estimate });
      break;
    }
    default:
      throw new Error("Unsupported studio command.");
  }
  project.updatedAt = time;
  return validateProject(ensureProductionIds(project));
}
