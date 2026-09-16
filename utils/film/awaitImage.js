export const awaitImage = async (submitted) => {
  if (!submitted.id || !['queued', 'running'].includes(submitted.status)) return submitted;
  const deadline = Date.now() + 30 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    let response; let result;
    try { response = await fetch('/api/seedance-status?taskId=' + encodeURIComponent(submitted.id)); result = await response.json(); }
    catch { continue; }
    if ([401, 403, 404].includes(response.status)) throw new Error(result.error || 'Cannot access this generation');
    if (result.status === 'succeeded') return result;
    if (['failed', 'cancelled', 'expired'].includes(result.status)) {
      const error = new Error(typeof result.error === 'string' ? result.error : 'Image generation failed');
      error.noRetry = true; throw error;
    }
  }
  throw new Error('Image is still processing. Open Generations to recover it; do not submit again.');
};
