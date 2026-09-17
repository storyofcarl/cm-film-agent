// Read historical records only: never substitute a current asset/version for a
// reference or segment that was actually used by an earlier generation.
export function recordedReferences(payload, planned) {
  if (payload?.content) {
    return payload.content
      .filter((entry) => /^(image|video|audio)_url$/.test(entry.type))
      .map((entry) => {
        const url = entry[entry.type]?.url;
        return {
          ...(planned || []).find((ref) => ref.url === url),
          url,
          type: entry.type.replace("_url", ""),
          role: entry.role,
        };
      });
  }
  if (Array.isArray(payload?.referenceImages))
    return payload.referenceImages.map((url) => ({
      ...(planned || []).find((ref) => ref.url === url),
      url,
      type: "image",
    }));
  return planned || [];
}

export function versionSources(project, item, version) {
  if (!version) return [];
  const ids = [
    ...new Set(
      [
        ...(version.jobIds || []),
        ...(version.prompts || []).map((recipe) => recipe.jobId),
      ].filter(Boolean),
    ),
  ];
  return ids.map((id) => {
    const job = project.batches
      .flatMap((batch) => batch.jobs)
      .find((entry) => entry.id === id);
    const recipe = version.prompts?.find((entry) => entry.jobId === id);
    const payload = recipe?.actualPayload || job?.actualPayload;
    const recorded = recipe?.references || job?.request?.references;
    const fragments = (project.shotFragments || []).filter(
      (part) => part.jobId === id && part.shotId === item.id,
    );
    return {
      id,
      code:
        project.segments.find((segment) => segment.id === job?.segmentId)
          ?.code ||
        job?.code ||
        id,
      title: job?.title || "Recorded generation",
      media: job?.output?.url
        ? job.output
        : fragments[0]?.url
          ? { url: fragments[0].url, type: "video" }
          : null,
      prompt: recipe?.prompt ?? job?.request?.prompt ?? "",
      model: payload?.model || job?.request?.model || version.model,
      seed: payload?.seed ?? recipe?.seed ?? null,
      references: recordedReferences(payload, recorded),
      referencesKnown: Boolean(
        payload?.content ||
        Array.isArray(payload?.referenceImages) ||
        Array.isArray(recorded),
      ),
      ranges: fragments.length
        ? fragments.map((part) => ({ in: part.in, out: part.out }))
        : (job?.parts || [])
            .filter((part) => part.shotId === item.id)
            .map((part) => ({ in: part.start, out: part.end })),
    };
  });
}
