import { createCrewLibrary, CREW_CONTEXT_LIMIT } from "./crewContext";
import { fault } from "./errors";

export const OUTPUT_PROTOCOL = `
LARGE DELIVERABLE OUTPUT
When complete writing or production preparation will exceed one response, return {"outputPlan":{"scope":"project","title":"...","summary":"...","notes":"creative continuity and cross-part identities","parts":[{"id":"stable-part-id","title":"specific complete scene or document section","sceneIds":["existing or proposed scene id"]}]}} instead of a partial deliverable. Plan the entire requested deliverable in creative order. Cover every existing project scene across the parts; a selected shot never silently narrows the project. A small explicitly scoped request can use the normal response format. Include a shared asset/hierarchy part before dependent shot parts when needed. New-project writing can use sceneIds:[] until scene identities exist. Boundaries must be complete scenes, document sections or coherent asset groups, never arbitrary clipped text. Do not include preparation outputs alongside outputPlan.
The server requests each planned part in order, retaining earlier exact outputs for reference, then assembles one reviewable result. It does not apply partial proposals or approve anything. Return {"outputPart":{"id":"requested-part-id","content":"brief explanation","notes":"updated cumulative continuity notes","decisions":[],"proposal":{},"documents":[{"key":"stable-document-key","title":"...","area":"scripts|documents","revisesId":"existing version when revising","content":"complete text for this section"}]}}. Omit unused fields. Repeat a document key to append ordered sections to that same deliverable with identical metadata; use distinct keys for separate deliverables. Do not repeat preceding sections or replace full text with summaries. Shared temporary object ids must remain consistent across all parts; define each object/update only once and reference it elsewhere. Every part must contain useful content, writing or proposal work. Use the normal proposal contract. No response may invent approvals, media, provider execution or costs. A single assembled document may contain up to 500,000 characters; plan separate genuine deliverables when appropriate, never silently truncate.`;

const decode = (text) => {
  try {
    return JSON.parse(
      text
        .trim()
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, ""),
    );
  } catch {
    return null;
  }
};
const text = (value) => typeof value === "string" && value.trim().length > 0;
const check = (valid, message) => {
  if (!valid) throw fault(message);
};
const fields = [
  "nodes",
  "assets",
  "shots",
  "updates",
  "nodeUpdates",
  "inboxAssignments",
];

export function outputAssembly(plan, context) {
  check(
    plan?.scope === "project" &&
      text(plan.title) &&
      Array.isArray(plan.parts) &&
      plan.parts.length > 0,
    "A large preparation needs an ordered whole-project output plan.",
  );
  const ids = new Set();
  for (const part of plan.parts) {
    check(
      text(part?.id) &&
        text(part.title) &&
        !ids.has(part.id) &&
        Array.isArray(part.sceneIds) &&
        part.sceneIds.every(text),
      "Output parts need unique IDs, section titles and scene coverage.",
    );
    ids.add(part.id);
  }
  const covered = new Set(plan.parts.flatMap((part) => part.sceneIds));
  check(
    (context.nodes || [])
      .filter((node) => node.type === "scene")
      .every((node) => covered.has(node.id)),
    "The output plan omits existing project scenes. No partial preparation was published.",
  );
  const completed = [];
  const documents = new Map();
  const proposal = {};
  const definitions = new Set();
  const updates = new Set();
  function accept(part) {
    check(
      part?.id === plan.parts[completed.length]?.id,
      "The agent returned an unexpected or repeated output part.",
    );
    check(
      text(part.content) ||
        part.documents?.length ||
        Object.keys(part.proposal || {}).length,
      "An output part was empty. The incomplete deliverable remains unpublished.",
    );
    check(
      part.documents === undefined || Array.isArray(part.documents),
      "Output documents must be an array.",
    );
    for (const document of part.documents || []) {
      check(
        text(document.key) &&
          text(document.title) &&
          ["scripts", "documents"].includes(document.area) &&
          text(document.content),
        "An output document section is incomplete.",
      );
      check(
        !document.revisesId ||
          (context.documents || []).some(
            (entry) =>
              entry.id === document.revisesId && entry.area === document.area,
          ),
        "A document revision must refer to an existing version in the same file area.",
      );
      const earlier = documents.get(document.key);
      check(
        !earlier ||
          (earlier.title === document.title &&
            earlier.area === document.area &&
            earlier.revisesId === document.revisesId),
        "Document identity changed between output parts.",
      );
      const content = earlier
        ? `${earlier.content}\n\n${document.content}`
        : document.content;
      check(
        content.length <= 500000,
        "The assembled document exceeds the supported 500,000-character limit. All completed parts remain in the saved task; no truncated draft was filed.",
      );
      documents.set(document.key, {
        title: document.title,
        area: document.area,
        content,
        ...(document.revisesId ? { revisesId: document.revisesId } : {}),
      });
    }
    if (part.proposal) {
      check(
        typeof part.proposal === "object" &&
          !Array.isArray(part.proposal) &&
          Object.keys(part.proposal).every((key) =>
            [...fields, "project"].includes(key),
          ),
        "An output part contains unsupported proposal fields.",
      );
      for (const field of fields) {
        if (part.proposal[field] === undefined) continue;
        check(
          Array.isArray(part.proposal[field]),
          "Proposal collections must be arrays.",
        );
        for (const entry of part.proposal[field]) {
          if (["nodes", "assets", "shots"].includes(field)) {
            check(
              text(entry?.id) &&
                !definitions.has(entry.id) &&
                ![
                  ...(context.nodes || []),
                  ...(context.assets || []),
                  ...(context.shots || []),
                ].some((item) => item.id === entry.id),
              "Output parts redefined an object ID. Shared objects must be defined once and reused.",
            );
            definitions.add(entry.id);
          } else if (["updates", "nodeUpdates"].includes(field)) {
            check(
              text(entry?.id) && !updates.has(entry.id),
              "Output parts contain conflicting repeated updates.",
            );
            updates.add(entry.id);
          }
        }
        proposal[field] = [...(proposal[field] || []), ...part.proposal[field]];
      }
      if (part.proposal.project) {
        check(
          !proposal.project,
          "Project settings must be proposed once for the whole output batch.",
        );
        proposal.project = part.proposal.project;
      }
    }
    completed.push(part);
  }
  function finish() {
    check(
      completed.length === plan.parts.length,
      "The output batch is incomplete.",
    );
    return {
      title: plan.title,
      content:
        [plan.summary, ...completed.map((part) => part.content)]
          .filter(text)
          .join("\n\n") ||
        `Prepared all ${plan.parts.length} parts together for review.`,
      decisions: completed.flatMap((part) =>
        Array.isArray(part.decisions) ? part.decisions.map(String) : [],
      ),
      nextActions: completed.flatMap((part) =>
        Array.isArray(part.nextActions) ? part.nextActions : [],
      ),
      ...(Object.keys(proposal).length ? { proposal } : {}),
      ...(documents.size ? { documents: [...documents.values()] } : {}),
    };
  }
  return { completed, accept, finish };
}

export async function completeCrewOutput({
  context,
  instruction,
  study,
  invoke,
  maxPasses = 12,
}) {
  const initial = decode(study.result.content);
  if (!initial?.outputPlan) return study;
  check(
    !initial.proposal && !initial.documents,
    "An output plan cannot publish partial deliverables.",
  );
  const plan = initial.outputPlan;
  const assembly = outputAssembly(plan, context);
  let notes = plan.notes || "";
  let parts = [];
  let library = createCrewLibrary({
    production: context,
    completed: assembly.completed,
  });
  const transcript = [
    ...(study.contextStudy?.transcript || [
      {
        prompt: study.prompt,
        response: study.result.content,
        usage: study.result.usage || null,
      },
    ]),
  ];
  const systemPrompt = `${study.systemPrompt}\nOUTPUT PART EXECUTION\nComplete only the requested part, using the full-project output plan and already completed outputs. The index retains the complete production and exact earlier parts. Return contextRequest reads/notes to inspect exact records when needed; never infer long text from a record descriptor. Return outputPart only after those reads. Do not return another plan or a normal final response. The server assembles all planned parts automatically; no partial changes are applied.`;
  const started = Date.now();
  for (let pass = 0; pass < maxPasses; pass++) {
    check(
      typeof notes === "string" && notes.length <= 40000,
      "Invalid output continuity notes.",
    );
    const prompt = `DIRECTOR'S REQUEST\n${instruction}\n\nOUTPUT PART REQUEST\n${JSON.stringify({ plan, currentPart: plan.parts[assembly.completed.length], completedPartIds: assembly.completed.map((part) => part.id), index: library.index, notes, parts })}`;
    check(
      prompt.length + systemPrompt.length <= CREW_CONTEXT_LIMIT,
      "The output-part index exceeds chat capacity. No completed output was removed.",
    );
    check(
      Date.now() - started <= 220000,
      "Output preparation reached this worker's time limit. Completed calls remain saved.",
    );
    const result = await invoke(prompt, systemPrompt);
    transcript.push({
      prompt,
      response: result.content,
      usage: result.usage || null,
    });
    const output = decode(result.content);
    check(
      output,
      "The output part was incomplete or invalid JSON. No partial draft was published.",
    );
    check(
      !(output.contextRequest && output.outputPart),
      "Return a source read or an output part, not both.",
    );
    if (output.contextRequest) {
      parts = library.read(output.contextRequest.reads);
      notes = output.contextRequest.notes;
      continue;
    }
    assembly.accept(output.outputPart);
    if (assembly.completed.length === plan.parts.length) {
      return {
        ...study,
        prompt,
        systemPrompt,
        result: { content: JSON.stringify(assembly.finish()) },
        contextStudy: {
          mode: "partitioned",
          coverage: study.contextStudy?.coverage || [],
          outputPlan: plan,
          transcript,
        },
      };
    }
    notes = output.outputPart.notes ?? notes;
    parts = [];
    library = createCrewLibrary({
      production: context,
      completed: assembly.completed,
    });
  }
  throw fault(
    "Output preparation needs another worker request. No partial result was published.",
  );
}
