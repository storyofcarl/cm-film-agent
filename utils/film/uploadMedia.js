import { getBrowserSupabase } from '../supabase/browser';

const types = { 'image/png': 'png', 'image/jpeg': 'jpeg', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg' };
export const uploadMedia = async (source, name = '') => {
  const blob = typeof source === 'string' ? await (await fetch(source)).blob() : source;
  const ext = types[blob.type];
  if (!ext) throw new Error('Unsupported media format. Use PNG, JPEG, WebP, GIF, MP4, WebM, MP3, WAV, M4A, or OGG.');
  if (!blob.size || blob.size > 500 * 1024 * 1024) throw new Error('Upload files smaller than 500 MB.');
  const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  const key = [...new Uint8Array(hash)].map((n) => n.toString(16).padStart(2, '0')).join('').slice(0, 32) + '.' + ext;
  const ticketResponse = await fetch('/api/film/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sign', key, contentType: blob.type, size: blob.size }) });
  const ticket = await ticketResponse.json();
  if (!ticketResponse.ok) throw new Error(ticket.error || 'Could not authorize upload');
  const { error } = await getBrowserSupabase().storage.from('film-media').uploadToSignedUrl(ticket.path, ticket.token, blob, { contentType: blob.type });
  if (error) throw error;
  const finalResponse = await fetch('/api/film/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete', key, name }) });
  const result = await finalResponse.json();
  if (!finalResponse.ok) throw new Error(result.error || 'Could not finish upload');
  return result;
};

// Also removes repeated inline originals left on asset nodes after upload. The
// project manifest contains durable references rather than megabytes of base64.
export const prepareProjectForSave = async (project) => {
  const uploaded = new Map();
  const walk = async (value) => {
    if (typeof value === 'string' && /^data:(image|video|audio)\//.test(value) && value.length > 50000) {
      if (!uploaded.has(value)) uploaded.set(value, uploadMedia(value, 'Project media'));
      return (await uploaded.get(value)).url;
    }
    if (Array.isArray(value)) {
      const out = []; for (const item of value) out.push(await walk(item)); return out;
    }
    if (value && typeof value === 'object') {
      const out = {};
      for (const [key, item] of Object.entries(value)) {
        if (key === 'localUrl' && /^\/api\/film\/media\?key=/.test(value.url || '')) continue;
        out[key] = await walk(item);
      }
      return out;
    }
    return value;
  };
  return walk(project);
};
