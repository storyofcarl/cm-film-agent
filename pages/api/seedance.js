import { getEndpointUrl } from '../../utils/config';
import { withAuth } from '../../utils/server/withAuth';
import { requestContext } from '../../utils/server/requestContext';
import { checkInUrl, signedMediaUrl, storeKeyFromUrl } from '../../utils/server/mediaStore';
import { safeFetch } from '../../utils/server/safeFetch';
import { createAdminSupabase } from '../../utils/server/supabase';
import { providerModel } from '../../utils/providerModels';
import { submitFalVideo, submitMiniMaxVideo } from '../../utils/server/providerJobs';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } }, maxDuration: 300 };
export default withAuth(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (providerModel(req.body?.model)?.provider === 'minimax') {
    try { return res.status(202).json(await submitMiniMaxVideo(req.body)); }
    catch (error) { return res.status(400).json({ error: error.message }); }
  }
  if (providerModel(req.body?.model)?.provider === 'fal') {
    try { return res.status(202).json(await submitFalVideo(req.body)); }
    catch (error) { return res.status(400).json({ error: error.message }); }
  }
  const { model, content, ...params } = req.body || {};
  const models = ['MODELARK_MODEL_SEEDANCE', 'MODELARK_MODEL_SEEDANCE_FAST', 'MODELARK_MODEL_SEEDANCE_MINI', 'MODELARK_MODEL_SEEDANCE_25'].map((k) => process.env[k]).filter(Boolean);
  if (!models.includes(model)) return res.status(400).json({ error: 'Choose a configured video model' });
  if (!Array.isArray(content) || content.length > 60) return res.status(400).json({ error: 'Invalid generation content' });
  const { supabase: userClient, user } = requestContext();
  const supabase = createAdminSupabase();
  const normalized = [];
  for (const item of content) {
    if (item.type === 'image_asset_id') {
      const { data: owned } = await userClient.from('film_provider_assets').select('asset_id').eq('owner_id', user.id).eq('asset_id', String(item.asset_id)).maybeSingle();
      if (!owned) return res.status(403).json({ error: 'Register this reference in your own asset library first' });
      normalized.push({ type: 'image_url', image_url: { url: 'asset://' + item.asset_id }, role: item.role || 'reference_image' });
      continue;
    }
    if (!['image_url', 'video_url', 'audio_url'].includes(item.type)) { normalized.push(item); continue; }
    const source = item[item.type]?.url;
    if (String(source).startsWith('asset://')) {
      const { data: owned } = await userClient.from('film_provider_assets').select('asset_id').eq('owner_id', user.id).eq('asset_id', source.slice(8)).maybeSingle();
      if (!owned) return res.status(403).json({ error: 'Reference asset does not belong to this account' });
    }
    let key = storeKeyFromUrl(source);
    if (String(source).startsWith('data:')) key = (await checkInUrl(source)).key;
    if (item.type === 'audio_url' && key && !key.endsWith('.mp3')) return res.status(400).json({ error: 'Seedance audio references must be MP3' });
    normalized.push({ ...item, [item.type]: { ...item[item.type], url: key ? await signedMediaUrl(key) : source } });
  }
  const { data: job, error } = await supabase.from('film_jobs').insert({ owner_id: user.id, kind: 'video', status: 'submitting', request: { model, content, ...params } }).select('id').single();
  if (error) throw error;
  try {
    const response = await safeFetch(getEndpointUrl('video'), {
      method: 'POST', headers: { Authorization: 'Bearer ' + process.env.MODELARK_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, model, content: normalized }),
    });
    const data = await response.json();
    const taskId = data.id || data.task_id;
    if (!response.ok || !taskId) {
      const message = data.error?.message || 'Video provider rejected this request';
      await supabase.from('film_jobs').update({ status: 'failed', result: { status: 'failed', error: message } }).eq('id', job.id);
      return res.status(response.ok ? 502 : response.status).json({ error: message });
    }
    const { error: saveError } = await supabase.from('film_jobs').update({ provider_task_id: taskId, status: 'queued' }).eq('id', job.id);
    if (saveError) throw new Error('Video started but its task could not be saved. Do not resubmit; contact the workspace owner.');
    return res.json({ ...data, id: taskId, jobId: job.id });
  } catch (error) {
    // A network timeout can occur after the provider accepts the task. Keep the
    // ambiguous submission visible and never automatically generate a duplicate.
    return res.status(502).json({ error: error.message, jobId: job.id });
  }
});
