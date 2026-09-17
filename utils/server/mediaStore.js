import { safeFetch as fetch } from './safeFetch';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { requestContext } from './requestContext';

export const MEDIA_BUCKET = 'film-media';
export const KEY_RE = /^[a-f0-9]{16,64}\.[a-z0-9]{1,5}$/i;
export const TYPE_BY_EXT = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', ogg: 'audio/ogg' };
export const EXT_BY_TYPE = Object.fromEntries(Object.entries(TYPE_BY_EXT).map(([ext, type]) => [type, ext]));
export const MAX_MEDIA_BYTES = 500 * 1024 * 1024;
export const storeKeyFromUrl = (url) => /\/api\/film\/media\?key=([a-f0-9]{16,64}\.[a-z0-9]{1,5})\b/.exec(String(url || ''))?.[1] || null;
export const mediaUrl = (key) => '/api/film/media?key=' + encodeURIComponent(key);
export const objectPath = (key) => {
  if (!KEY_RE.test(String(key))) throw new Error('Invalid media key');
  const context = requestContext();
  return context.user.id + (context.namespace === 'studio' ? '/studio/' : '/') + key;
};
export const mediaFilePath = (key) => path.join(os.tmpdir(), 'film-agent-media', objectPath(key));
export const mediaFileExists = (key) => fs.existsSync(mediaFilePath(key));
export const checkInBytes = async (buffer, contentType = '') => {
  if (!buffer.length || buffer.length > MAX_MEDIA_BYTES) throw new Error('Media must be between 1 byte and 500 MB');
  const type = contentType.split(';')[0].trim().toLowerCase();
  const ext = EXT_BY_TYPE[type];
  if (!ext) throw new Error('Unsupported media type');
  const key = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 32) + '.' + ext;
  const { error } = await requestContext().supabase.storage.from(MEDIA_BUCKET)
    .upload(objectPath(key), buffer, { contentType: type, upsert: true });
  if (error) throw error;
  return { key, url: mediaUrl(key) };
};
export const signedMediaUrl = async (key, seconds = 3600) => {
  const { data, error } = await requestContext().supabase.storage.from(MEDIA_BUCKET).createSignedUrl(objectPath(key), seconds);
  if (error) throw error;
  return data.signedUrl;
};
export const readStoreBytes = async (key) => {
  // Authorize through Storage even when a temporary file exists locally.
  const { data, error } = await requestContext().supabase.storage.from(MEDIA_BUCKET).download(objectPath(key));
  if (error) throw error;
  if (data.size > MAX_MEDIA_BYTES) throw new Error('Media exceeds processing limit');
  return { buffer: Buffer.from(await data.arrayBuffer()), contentType: data.type || TYPE_BY_EXT[key.split('.').pop()] };
};
export const checkInUrl = async (url, { timeoutMs = 120000 } = {}) => {
  const key = storeKeyFromUrl(url);
  if (key) { await signedMediaUrl(key); return { key, url: mediaUrl(key) }; }
  const src = String(url || '');
  if (!/^(https?:\/\/|data:)/.test(src)) throw new Error('An HTTP or data URL is required');
  const response = await fetch(src, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error('Media download failed (' + response.status + ')');
  if (Number(response.headers.get('content-length')) > MAX_MEDIA_BYTES) throw new Error('Media exceeds 500 MB');
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > MAX_MEDIA_BYTES) throw new Error('Media exceeds 500 MB');
    chunks.push(chunk);
  }
  const type = response.headers.get('content-type')?.split(';')[0] || TYPE_BY_EXT[src.split('?')[0].split('.').pop()];
  return { ...await checkInBytes(Buffer.concat(chunks), type), contentType: type, size };
};
export const ensureStoreFile = async (key) => {
  const { buffer } = await readStoreBytes(key);
  const file = mediaFilePath(key);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
  return file;
};
export const deleteStoreKey = (key) => {
  const file = mediaFilePath(key);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return true;
};
