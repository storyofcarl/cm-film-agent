import { requestContext } from './requestContext';
import { getEndpointUrl } from '../config';
import { checkInUrl } from './mediaStore';
import { safeFetch } from './safeFetch';
import { createAdminSupabase } from './supabase';

export const pollVideoJob = async (job) => {
  if (['succeeded', 'failed', 'cancelled'].includes(job.status) && job.result) return job.result;
  const response = await safeFetch(`${getEndpointUrl('video')}/${encodeURIComponent(job.provider_task_id)}`, {
    headers: { Authorization: `Bearer ${process.env.MODELARK_API_KEY}`, 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Provider status failed (${response.status})`);
  const result = { id: data.id, status: data.status };
  if (data.error) result.error = data.error;
  if (data.status === 'succeeded' && data.content?.video_url) {
    // A successful provider task is not considered durable until the output is
    // in our own storage. Storage failures remain retryable without re-generation.
    const video = await checkInUrl(data.content.video_url);
    const last = data.content.last_frame_url || data.content.last_frame_image_url || data.content.last_frame;
    const frame = last ? await checkInUrl(last) : null;
    result.video_url = video.url;
    result.video_cache_url = video.url;
    result.last_frame_url = frame?.url || null;
    result.last_frame_cache_url = frame?.url || null;
  }
  const { user } = requestContext();
  const { error } = await createAdminSupabase().from('film_jobs').update({ status: result.status, result, updated_at: new Date().toISOString() }).eq('id', job.id).eq('owner_id', user.id);
  if (error) throw error;
  return result;
};
