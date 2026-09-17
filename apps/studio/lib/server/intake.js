import {
  checkInUrl,
  readStoreBytes,
} from "../../../../utils/server/mediaStore";
import { validateProject, uid } from "../domain";
import { documentArea, documentSource } from "../documents";
import { fault } from "./errors";
import { inspectStoredMedia } from "./media";

export async function validateMedia(media) {
  if (!media?.url || !["image", "video", "audio"].includes(media.type))
    throw fault("Choose an image, video, or audio reference.");
  const stored = await checkInUrl(media.url);
  // Read through the owner's namespace, proving both ownership and availability.
  const { buffer, contentType } = await readStoreBytes(stored.key);
  if (!contentType.startsWith(media.type + "/") || !buffer.length)
    throw fault("The media file does not match its declared type.");
  const start = Number(media.in || 0);
  const end = media.out == null ? null : Number(media.out);
  if (
    !Number.isFinite(start) ||
    start < 0 ||
    (end !== null && (!Number.isFinite(end) || end <= start))
  )
    throw fault("Invalid source trim range.");
  return inspectStoredMedia({
    url: stored.url,
    type: media.type,
    in: start,
    ...(end === null ? {} : { out: end }),
    verifiedAt: new Date().toISOString(),
  });
}

export async function importManifest(input) {
  validateProject(input);
  const project = JSON.parse(JSON.stringify(input));
  project.id = uid("film");
  project.sample = false;
  project.batches = [];
  project.events = [];
  project.lookdev = [];
  project.sceneApprovals = [];
  project.guides = [];
  project.deliveries = [];
  project.shotFragments = [];
  project.inbox = [];
  project.segmentProfiles = {};
  project.segments = [];
  project.createdAt = new Date().toISOString();
  project.updatedAt = project.createdAt;
  const report = {
    approved: 0,
    gaps: [],
    provenance:
      "Supplied work validated on intake. Historical claims retained as supplied metadata, not as new human approvals.",
  };
  if (input.inbox?.length)
    report.gaps.push(
      "Unassigned inbox uploads need their original files uploaded into this production; imported storage claims are not trusted.",
    );
  // Imported manifests are untrusted data. Never import executable jobs or forged
  // human approvals. Completed media can receive a clearly attributed agent review.
  for (const item of [...project.assets, ...project.shots]) {
    item.guideVersionIds = [];
    for (const version of item.versions) {
      const supplied = {
        review: version.review,
        origin: version.origin,
        model: version.model ?? null,
        prompt: version.prompt ?? null,
        seed: version.seed ?? null,
      };
      version.review = "pending";
      version.origin = "imported";
      version.suppliedMetadata = supplied;
      delete version.jobId;
      delete version.batchId;
      try {
        version.media = await validateMedia(version.media);
        version.validation = {
          by: "intake-agent",
          at: project.createdAt,
          checks: [
            "available",
            "owned-copy",
            "decodable",
            "measured-trim-range",
          ],
          status: "technical-pass",
          limits:
            "Creative completeness validation is pending. Unknown prompts and seeds remain unknown.",
        };
        report.gaps.push(
          `${item.title} V${version.number}: media preserved; crew completeness check pending.`,
        );
      } catch (error) {
        version.media = null;
        version.note = error.message;
        report.gaps.push(`${item.title} V${version.number}: ${error.message}`);
      }
      project.events.push({
        id: uid("event"),
        kind: "intake.validated",
        actor: "intake-agent",
        role: "agent",
        at: project.createdAt,
        itemId: item.id,
        versionId: version.id,
        review: version.review,
      });
    }
    if (!item.versions.length)
      report.gaps.push(`${item.title}: no completed media supplied.`);
  }
  for (const supplied of input.guides || []) {
    if (!["board", "previs", "design-candidate"].includes(supplied.kind))
      continue;
    if (
      ![...project.assets, ...project.shots].some(
        (item) => item.id === supplied.targetId,
      ) &&
      !project.nodes.some(
        (node) => node.id === supplied.sceneId && node.type === "scene",
      )
    )
      continue;
    try {
      const media = await validateMedia(supplied.media);
      project.guides.push({
        id: uid("guide"),
        title: String(supplied.title || "Supplied guide"),
        kind: supplied.kind,
        targetId: supplied.targetId || null,
        sceneId: supplied.sceneId || null,
        media,
        prompt: supplied.prompt ?? null,
        origin: "imported",
        review: "pending",
        createdAt: project.createdAt,
      });
      report.gaps.push(
        `${supplied.title || "Guide"}: preserved; completeness check and reference selection pending.`,
      );
    } catch (error) {
      report.gaps.push(`${supplied.title || "Guide"}: ${error.message}`);
    }
  }
  const artifactIds = new Map(
    input.artifacts.map((entry) => [entry.id, uid("artifact")]),
  );
  const familyCounts = new Map();
  project.artifacts = input.artifacts.map((artifact) => {
    const area = documentArea(input, artifact) || "documents";
    const root = input.artifacts.find(
      (entry) =>
        entry.id === artifact.documentId && documentArea(input, entry) === area,
    );
    const familyId = artifactIds.get(root?.id || artifact.id);
    const parent = input.artifacts.find(
      (entry) =>
        entry.id === artifact.revisesId &&
        (entry.documentId || entry.id) === (root?.id || artifact.id),
    );
    const source = documentSource(input, artifact) || artifact;
    const number = (familyCounts.get(familyId) || 0) + 1;
    familyCounts.set(familyId, number);
    return {
      id: artifactIds.get(artifact.id),
      kind: "document",
      documentId: familyId,
      documentArea: area,
      number,
      revisesId: parent ? artifactIds.get(parent.id) : null,
      title: String(artifact.title || "Supplied document"),
      content: String(artifact.content || ""),
      method: "import",
      origin: "imported",
      review: "pending",
      prompt: null,
      seed: null,
      suppliedMetadata: {
        review: artifact.review ?? null,
        number: artifact.number ?? null,
        origin: artifact.origin ?? null,
        prompt: source.prompt ?? null,
        systemPrompt: source.systemPrompt ?? null,
        method: source.method ?? null,
        methodVersion: source.methodVersion ?? null,
        model: source.model ?? null,
        seed: source.seed ?? null,
        createdAt: artifact.createdAt ?? null,
      },
      createdAt: project.createdAt,
    };
  });
  project.artifacts.push({
    id: uid("artifact"),
    title: "Intake validation report",
    method: "intake",
    content: JSON.stringify(report, null, 2),
    createdAt: project.createdAt,
  });
  return { project: validateProject(project), report };
}
