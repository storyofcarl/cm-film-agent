import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { safeFetch } from './safeFetch';
import { checkInUrl, readStoreBytes } from './mediaStore';
import { runFfmpeg, inspectMedia } from './ffmpeg';
import { providerModel } from '../providerModels';

export const claudeContent = (data) => {
  if (data.stop_reason === 'max_tokens') throw new Error('Claude reached its output limit. Ask for a shorter response or split the plan into sections.');
  const content = (data.content || []).filter((part) => part.type === 'text').map((part) => part.text).join('\n');
  if (!content) throw new Error('Claude returned no answer text');
  return content;
};
const imageBlock = async (source) => {
  const stored = await checkInUrl(source);
  const { buffer, contentType } = await readStoreBytes(stored.key);
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(contentType) || buffer.length > 7 * 1024 * 1024) throw new Error('Claude references must be PNG, JPEG, GIF or WebP images smaller than 7 MB');
  return { type: 'image', source: { type: 'base64', media_type: contentType, data: buffer.toString('base64') } };
};
const videoFrames = async (source) => {
  const stored = await checkInUrl(source);
  const { buffer } = await readStoreBytes(stored.key);
  const ffmpeg = (await import('ffmpeg-static')).default;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'film-claude-'));
  try {
    const input = path.join(dir, 'input.mp4'); fs.writeFileSync(input, buffer);
    const info = await inspectMedia(ffmpeg, input);
    const interval = Math.max(0.25, info.seconds / 6);
    await runFfmpeg(ffmpeg, ['-i', input, '-vf', `fps=1/${interval},scale=1280:-2`, '-frames:v', '6', '-q:v', '3', path.join(dir, 'frame-%02d.jpg')], 90000);
    return [{ type: 'text', text: `Video reference: ${info.seconds.toFixed(1)} seconds. The following frames are sampled in chronological order, about ${interval.toFixed(1)} seconds apart. Evaluate only the visible evidence; audio and motion between frames have not been provided.` },
      ...fs.readdirSync(dir).filter((name) => name.startsWith('frame-')).sort().map((name) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: fs.readFileSync(path.join(dir, name)).toString('base64') } }))];
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
};
export const callClaude = async ({ modelId, prompt, systemPrompt, images = [], video }) => {
  if (providerModel(modelId)?.provider !== 'anthropic' || !process.env.ANTHROPIC_API_KEY) throw new Error('Claude model is not enabled');
  const refs = [].concat(images || []).filter(Boolean);
  if (refs.length > 20) throw new Error('Use at most 20 image references for Claude');
  const content = [{ type: 'text', text: String(prompt) }, ...await Promise.all(refs.map(imageBlock))];
  if (video) content.push(...await videoFrames(video));
  const response = await safeFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: modelId, max_tokens: 16000, ...(systemPrompt ? { system: systemPrompt } : {}), messages: [{ role: 'user', content }] }),
    signal: AbortSignal.timeout(240000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Claude request failed');
  return { content: claudeContent(data), model: modelId, usage: data.usage, ...(video ? { videoAnalysis: 'sampled-frames' } : {}) };
};
