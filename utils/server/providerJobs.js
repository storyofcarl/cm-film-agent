import { providerModel } from '../providerModels';
import { safeFetch } from './safeFetch';
import { checkInUrl, signedMediaUrl } from './mediaStore';
import { requestContext } from './requestContext';
import { createAdminSupabase } from './supabase';

const WAVE = 'https://api.wavespeed.ai/api/v3';
const FAL = 'https://queue.fal.run';
const MINIMAX = 'https://api.minimax.io';
const headersFor = (provider) => ({ 'Content-Type': 'application/json', Authorization: provider === 'fal' ? 'Key ' + process.env.FAL_API_KEY : 'Bearer ' + process.env[provider === 'minimax' ? 'MINIMAX_API_KEY' : 'WAVESPEED_API_KEY'] });
const json = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || data.message || (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || 'Provider request failed')));
    error.status = response.status; throw error;
  }
  return data;
};
const mediaReference = async (value) => {
  let source = value;
  if (String(source).startsWith('asset://')) {
    const { user, supabase } = requestContext();
    const { data, error } = await supabase.from('film_provider_assets').select('media_key').eq('owner_id', user.id).eq('asset_id', source.slice(8)).maybeSingle();
    if (error || !data) throw new Error('Reference asset does not belong to this account');
    return signedMediaUrl(data.media_key);
  }
  const stored = await checkInUrl(source);
  return signedMediaUrl(stored.key);
};

export const imageSettings = (size = '2K') => {
  const match = /^(\d+)x(\d+)$/i.exec(String(size));
  const ratios = ['1:1', '3:2', '2:3', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
  if (!match) return { resolution: ['1k', '2k', '4k'].includes(String(size).toLowerCase()) ? String(size).toLowerCase() : '2k', aspect_ratio: '1:1' };
  const width = Number(match[1]); const height = Number(match[2]);
  const ratio = width / height;
  const distance = (r) => { const [w, h] = r.split(':').map(Number); return Math.abs(Math.log(ratio / (w / h))); };
  return { resolution: Math.min(width, height) > 2048 ? '4k' : Math.min(width, height) > 1024 ? '2k' : '1k', aspect_ratio: ratios.sort((a, b) => distance(a) - distance(b))[0] };
};

export const buildFalInput = (spec, params, content) => {
  if (spec.provider !== 'fal') throw new Error('Choose a fal video model');
  const text = content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  if (!text.trim() || text.length > 50000) throw new Error('Provide a video prompt of 1–50,000 characters');
  const images = content.filter((c) => c.type === 'image_url');
  const videos = content.filter((c) => c.type === 'video_url');
  const audios = content.filter((c) => c.type === 'audio_url');
  const first = images.filter((c) => c.role === 'first_frame');
  const last = images.filter((c) => c.role === 'last_frame');
  if (first.length > 1 || last.length > 1) throw new Error('Use one opening frame and one closing frame');
  const refs = images.filter((c) => !['first_frame', 'last_frame'].includes(c.role));
  if (images.length > 9 || videos.length > 3 || audios.length > 3 || images.length + videos.length + audios.length > 12) throw new Error('H3 supports up to 9 images, 3 videos, 3 audio clips and 12 references total');
  const useReferences = refs.length > 1 || videos.length || audios.length || (refs.length && (first.length || last.length));
  if (spec.slot === 'minimaxH3Max' && useReferences) throw new Error('H3 Max supports one opening image and an optional closing image. Choose H3 for multiple image, video or audio references.');
  if (useReferences && (first.length || last.length)) throw new Error('Use either first/last frames or multimodal references for H3, not both');
  const mode = useReferences ? 'reference-to-video' : images.length ? 'image-to-video' : 'text-to-video';
  const resolution = String(params.resolution || spec.defaultResolution);
  if (!spec.resolutions.some((r) => r.toLowerCase() === resolution.toLowerCase())) throw new Error('Choose a supported resolution for ' + spec.label);
  const duration = params.duration == null || params.duration === 'auto' ? 5 : Number(params.duration);
  if (!Number.isInteger(duration) || duration < 5 || duration > 15) throw new Error('H3 clips must be between 5 and 15 seconds');
  const input = { prompt: text, duration, resolution: resolution.toUpperCase(), prompt_expansion_mode: 'balanced', enable_safety_checker: true };
  if (Number.isInteger(params.seed) && params.seed >= 0) input.seed = params.seed;
  if (mode !== 'image-to-video') {
    input.aspect_ratio = params.ratio && params.ratio !== 'adaptive' ? params.ratio : '16:9';
    if (!['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'].includes(input.aspect_ratio)) throw new Error('Unsupported H3 aspect ratio');
  }
  if (mode === 'image-to-video') {
    if (first[0] || refs[0]) input.image_url = (first[0] || refs[0]).image_url.url;
    if (last[0]) input.end_image_url = last[0].image_url.url;
  } else if (mode === 'reference-to-video') {
    input.reference_image_urls = images.map((c) => c.image_url.url);
    input.reference_video_urls = videos.map((c) => c.video_url.url);
    input.reference_audio_urls = audios.map((c) => c.audio_url.url);
  }
  return { endpoint: spec.id + '/' + mode, input };
};

const submit = async (spec, endpoint, input) => {
  const { user } = requestContext(); const db = createAdminSupabase();
  const { data: job, error } = await db.from('film_jobs').insert({ owner_id: user.id, kind: spec.kind, status: 'submitting', request: { model: spec.id, prompt: input.prompt || input.content?.find((c) => c.type === 'text')?.text, provider: spec.provider, endpoint } }).select('id').single();
  if (error) throw error;
  try {
    const data = await json(await safeFetch(({ fal: FAL, wavespeed: WAVE, minimax: MINIMAX })[spec.provider] + '/' + endpoint, { method: 'POST', headers: headersFor(spec.provider), body: JSON.stringify(input) }));
    const requestId = String((spec.provider === 'fal' ? data.request_id : spec.provider === 'minimax' ? data.task_id : data.data?.id) || '');
    if (!requestId || !/^[a-zA-Z0-9_-]+$/.test(requestId)) throw new Error('Provider accepted the request without a usable task ID');
    const id = spec.provider + '_' + requestId;
    const saved = await db.from('film_jobs').update({ provider_task_id: id, status: 'queued' }).eq('id', job.id);
    if (saved.error) throw saved.error;
    return { id, jobId: job.id, status: 'queued', model: spec.id };
  } catch (error) {
    if (error.status >= 400 && error.status < 500) await db.from('film_jobs').update({ status: 'failed', result: { status: 'failed', error: error.message } }).eq('id', job.id);
    throw new Error('Generation submission could not be confirmed. Check Generations before submitting again. ' + error.message);
  }
};
export const submitWaveImage = async ({ model, prompt, referenceImages = [], size }) => {
  const spec = providerModel(model);
  if (spec?.provider !== 'wavespeed' || !process.env.WAVESPEED_API_KEY) throw new Error('Image model is not enabled');
  const refs = [].concat(referenceImages || []).filter(Boolean);
  if (!String(prompt || '').trim() || refs.length > spec.refs) throw new Error('Provide a prompt and no more than ' + spec.refs + ' reference images');
  const input = { prompt, ...imageSettings(size), output_format: 'png', enable_sync_mode: false };
  if (refs.length) input.images = await Promise.all(refs.map(mediaReference));
  return submit(spec, spec.id + (refs.length ? '/edit' : '/text-to-image'), input);
};
export const submitFalVideo = async ({ model, content, ...params }) => {
  const spec = providerModel(model);
  if (spec?.provider !== 'fal' || !process.env.FAL_API_KEY || !Array.isArray(content)) throw new Error('Video model or content is not enabled');
  // Validate counts/options before downloading any references or creating a paid task.
  const normalized = content.map((item) => item.type === 'image_asset_id' ? { type: 'image_url', role: item.role, image_url: { url: 'asset://' + item.asset_id } } : item);
  for (const item of normalized) if (!['text', 'image_url', 'video_url', 'audio_url'].includes(item.type)) throw new Error('Unsupported video input');
  const { endpoint, input } = buildFalInput(spec, params, normalized);
  for (const field of ['image_url', 'end_image_url']) if (input[field]) input[field] = await mediaReference(input[field]);
  for (const field of ['reference_image_urls', 'reference_video_urls', 'reference_audio_urls']) if (input[field]) input[field] = await Promise.all(input[field].map(mediaReference));
  return submit(spec, endpoint, input);
};

export const buildMiniMaxInput = ({ content, resolution = '2K', duration = 5, ratio = 'adaptive' }) => {
  if (!Array.isArray(content) || !content.length || content.length > 16) throw new Error('Invalid H3 content');
  const normalized = content.map((item) => item.type === 'image_asset_id' ? { type: 'image_url', role: item.role, image_url: { url: 'asset://' + item.asset_id } } : item);
  let first = 0; let last = 0; let refs = 0; let videos = 0; let audios = 0;
  const text = normalized.filter(c => c.type === 'text').map(c => c.text).join('\n');
  if (!text.trim() || text.length > 50000) throw new Error('Provide an H3 prompt of 1–50,000 characters');
  const media = normalized.filter(c => c.type !== 'text').map((c) => {
    if (!['image_url', 'video_url', 'audio_url'].includes(c.type) || typeof c[c.type]?.url !== 'string') throw new Error('Invalid H3 reference');
    const role = c.role || (c.type === 'image_url' ? 'first_frame' : c.type === 'video_url' ? 'reference_video' : 'reference_audio');
    if (c.type === 'image_url') {
      if (role === 'first_frame') first++; else if (role === 'last_frame') last++; else if (role === 'reference_image') refs++; else throw new Error('Invalid image role');
    } else if (c.type === 'video_url' && role === 'reference_video') videos++;
    else if (c.type === 'audio_url' && role === 'reference_audio') audios++;
    else throw new Error('Invalid media role');
    return { type: c.type, role, [c.type]: { url: c[c.type].url } };
  });
  if (first > 1 || last > 1 || refs > 9 || videos > 3 || audios > 3) throw new Error('Too many H3 references');
  if ((first || last) && (refs || videos || audios)) throw new Error('Use opening/closing frames or multimodal references, not both');
  const res = String(resolution).toUpperCase();
  const seconds = duration === 'auto' ? 5 : Number(duration);
  if (!['768P', '2K'].includes(res)) throw new Error('Direct MiniMax H3 supports 768p and 2K');
  if (!Number.isInteger(seconds) || seconds < 4 || seconds > 15) throw new Error('H3 clips must be 4–15 seconds');
  const aspect = first || last ? 'adaptive' : !media.length && ratio === 'adaptive' ? '16:9' : ratio;
  if (!['adaptive', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'].includes(aspect)) throw new Error('Unsupported H3 aspect ratio');
  return { model: 'MiniMax-H3', content: [{ type: 'text', text }, ...media], resolution: res, duration: seconds, ratio: aspect };
};
export const submitMiniMaxVideo = async (params) => {
  const spec = providerModel(params.model);
  if (spec?.provider !== 'minimax' || !process.env.MINIMAX_API_KEY) throw new Error('MiniMax H3 is not enabled');
  const input = buildMiniMaxInput(params);
  for (const c of input.content) if (c.type !== 'text') c[c.type].url = await mediaReference(c[c.type].url);
  return submit(spec, 'v2/video_generation', input);
};

export const pollExternalJob = async (job) => {
  // Keep already-created fal H3 tasks recoverable, without offering new fal H3 submissions.
  const spec = job.request?.model === 'minimax/h3' ? { id: 'minimax/h3', provider: 'fal', kind: 'video' } : providerModel(job.request?.model);
  if (!spec || !['fal', 'wavespeed', 'minimax'].includes(spec.provider)) throw new Error('Unknown job provider');
  const prefix = spec.provider + '_';
  if (!job.provider_task_id.startsWith(prefix)) throw new Error('Invalid provider task');
  const id = encodeURIComponent(job.provider_task_id.slice(prefix.length));
  let status; let output; let failure;
  if (spec.provider === 'minimax') {
    const data = await json(await safeFetch(MINIMAX + '/v2/query/video_generation/' + id, { headers: headersFor('minimax') }));
    if (!data.task || !['queued', 'running', 'succeeded', 'failed', 'cancelled'].includes(data.task.status)) throw new Error('Invalid MiniMax task response');
    status = data.task.status === 'cancelled' ? 'failed' : data.task.status;
    output = data.task.content?.url; failure = data.task.error?.message || data.task.error;
  } else if (spec.provider === 'wavespeed') {
    const data = (await json(await safeFetch(WAVE + '/predictions/' + id + '/result', { headers: headersFor('wavespeed') }))).data;
    status = data?.status === 'completed' ? 'succeeded' : ['failed', 'cancelled', 'timeout', 'deleted'].includes(data?.status) ? 'failed' : 'running';
    output = data?.outputs?.[0]; failure = data?.error;
  } else {
    const url = FAL + '/' + spec.id + '/requests/' + id;
    const state = await json(await safeFetch(url + '/status', { headers: headersFor('fal') }));
    status = state.status === 'COMPLETED' ? 'succeeded' : state.status === 'IN_QUEUE' ? 'queued' : 'running';
    if (status === 'succeeded') {
      const response = await safeFetch(url, { headers: headersFor('fal') });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status >= 500) throw new Error('Video result temporarily unavailable');
        status = 'failed'; failure = result.detail || result.error || 'Video generation failed';
      } else output = result.video?.url;
    }
  }
  const result = { id: job.provider_task_id, status, kind: spec.kind, model: spec.id };
  if (status === 'failed') result.error = typeof failure === 'string' ? failure : JSON.stringify(failure || 'Generation failed');
  if (status === 'succeeded') {
    if (!output) throw new Error('Completed generation has no output');
    const stored = await checkInUrl(output);
    if (spec.kind === 'image') Object.assign(result, { url: stored.url, cacheUrl: stored.url, imageUrl: stored.url, data: [{ url: stored.url }], prompt: job.request.prompt });
    else Object.assign(result, { video_url: stored.url, video_cache_url: stored.url });
  }
  const { error } = await createAdminSupabase().from('film_jobs').update({ status, result, updated_at: new Date().toISOString() }).eq('id', job.id).eq('owner_id', requestContext().user.id);
  if (error) throw error;
  return result;
};
