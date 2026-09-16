/** @jest-environment node */
import { buildFalInput, buildMiniMaxInput, submitMiniMaxVideo, imageSettings, pollExternalJob, submitWaveImage } from '../utils/server/providerJobs';
import { providerModel, REASONING_MODEL_SLOTS } from '../utils/providerModels';
import { resolveModelId } from '../utils/film/suiteConfig';
import { claudeContent, callClaude } from '../utils/server/claude';
import { safeFetch } from '../utils/server/safeFetch';
import { checkInUrl } from '../utils/server/mediaStore';
import { createAdminSupabase } from '../utils/server/supabase';
import { isTransient } from '../utils/film/core/retry';
import { animate } from '../utils/film/core/operations';
import { createBrowserClient } from '../utils/film/core/client';
jest.mock('../utils/server/supabase', () => ({ createAdminSupabase: jest.fn() }));
jest.mock('../utils/server/safeFetch', () => ({ safeFetch: jest.fn() }));
jest.mock('../utils/server/mediaStore', () => ({ checkInUrl: jest.fn(), signedMediaUrl: jest.fn(), readStoreBytes: jest.fn() }));
jest.mock('../utils/server/requestContext', () => ({ requestContext: () => ({ user: { id: 'owner' } }) }));
const text = { type: 'text', text: 'A slow camera move through a garden' };
const frame = (role) => ({ type: 'image_url', role, image_url: { url: 'https://media.example/' + role } });
beforeEach(() => { jest.clearAllMocks(); process.env.ANTHROPIC_API_KEY = 'test'; process.env.WAVESPEED_API_KEY = 'test'; });
test('H3 uses multimodal references while Max rejects them', () => {
  const refs = [text, frame('reference_image'), frame('reference_image')];
  expect(buildMiniMaxInput({ duration: 5, content: refs })).toMatchObject({ model: 'MiniMax-H3', content: refs });
  expect(() => buildFalInput(providerModel('minimaxH3Max'), {}, refs)).toThrow('H3 Max');
});
test('Max sends first and last frames with provider-required settings', () => {
  const { input, endpoint } = buildFalInput(providerModel('minimaxH3Max'), { duration: 5, resolution: '480p' }, [text, frame('first_frame'), frame('last_frame')]);
  expect(endpoint).toBe('minimax/h3-max/image-to-video');
  expect(input).toMatchObject({ image_url: expect.any(String), end_image_url: expect.any(String), resolution: '480P', prompt_expansion_mode: 'balanced', enable_safety_checker: true });
  expect(input.generate_audio).toBeUndefined();
});
test.each([{ duration: 30 }, { resolution: '720p' }])('rejects unsupported H3 parameters before billing: %j', (params) => {
  expect(() => buildMiniMaxInput({ ...params, content: [text] })).toThrow();
});
test('WaveSpeed preserves landscape composition from canvas dimensions', () => {
  expect(imageSettings('2560x1440')).toEqual({ resolution: '2k', aspect_ratio: '16:9' });
});
test('denied image references never create a provider request or job', async () => {
  checkInUrl.mockRejectedValue(new Error('Media not found'));
  await expect(submitWaveImage({ model: 'google/nano-banana-2', prompt: 'test', referenceImages: ['/private'] })).rejects.toThrow('Media not found');
  expect(safeFetch).not.toHaveBeenCalled(); expect(createAdminSupabase).not.toHaveBeenCalled();
});
test('completed provider output is not marked successful until durable storage succeeds', async () => {
  safeFetch.mockResolvedValue({ ok: true, json: async () => ({ data: { status: 'completed', outputs: ['https://media.example/result.png'] } }) });
  checkInUrl.mockRejectedValue(new Error('Storage temporarily unavailable'));
  await expect(pollExternalJob({ provider_task_id: 'wavespeed_abc', request: { model: 'google/nano-banana-2' } })).rejects.toThrow('Storage');
  expect(createAdminSupabase).not.toHaveBeenCalled();
});
test('Claude exposes answer text only and rejects truncated output', () => {
  expect(claudeContent({ content: [{ type: 'thinking', thinking: 'private' }, { type: 'text', text: 'answer' }] })).toBe('answer');
  expect(() => claudeContent({ stop_reason: 'max_tokens', content: [{ type: 'text', text: 'partial' }] })).toThrow('output limit');
});
test('Claude uses server authentication and a separate system message', async () => {
  safeFetch.mockResolvedValue({ ok: true, json: async () => ({ content: [{ type: 'text', text: 'done' }] }) });
  await expect(callClaude({ modelId: 'claude-sonnet-5', prompt: 'hello', systemPrompt: 'Be concise' })).resolves.toMatchObject({ content: 'done' });
  const [url, options] = safeFetch.mock.calls[0];
  expect(url).toBe('https://api.anthropic.com/v1/messages');
  expect(options.headers['x-api-key']).toBe('test');
  expect(JSON.parse(options.body)).toMatchObject({ system: 'Be concise', messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }] });
});
test('ambiguous submission failures cannot trigger a paid retry', () => {
  expect(isTransient(new Error('Generation submission could not be confirmed. Check Generations before submitting again. fetch failed'))).toBe(false);
});
test('canvas opening and closing frames reach the H3 Max adapter', async () => {
  process.env.FAL_API_KEY = 'test';
  const startVideo = jest.fn().mockResolvedValue({ taskId: 'fal_test' });
  await animate({ modelKey: 'minimaxH3Max', firstFrameUrl: 'https://media.example/start', lastFrameUrl: 'https://media.example/end', motion: 'A slow push', duration: 5, resolution: '480p' }, { client: { startVideo } });
  const request = startVideo.mock.calls[0][0];
  const built = buildFalInput(providerModel(request.model), request, request.content);
  expect(built.input).toMatchObject({ image_url: 'https://media.example/start', end_image_url: 'https://media.example/end' });
});
test('a browser losing the image submission response cannot auto-submit again', async () => {
  const original = global.fetch;
  global.fetch = jest.fn().mockRejectedValue(new Error('fetch failed'));
  try {
    await expect(createBrowserClient().generateImage({ model: 'google/nano-banana-2', prompt: 'A vase' })).rejects.toMatchObject({ noRetry: true });
  } finally { global.fetch = original; }
});
test('Opus is default and both Fable versions are selectable', () => {
  expect(resolveModelId('reasoner')).toBe('claude-opus-5');
  expect(REASONING_MODEL_SLOTS.map((slot) => resolveModelId(slot))).toEqual(expect.arrayContaining(['claude-fable-5', 'claude-fable-5-1']));
});
test('direct H3 preserves reference roles and does not mix keyframes with references', () => {
  expect(buildMiniMaxInput({ content: [text, frame('reference_image')] }).content[1].role).toBe('reference_image');
  expect(buildMiniMaxInput({ content: [text, frame('first_frame'), frame('last_frame')], ratio: '16:9', duration: 4 })).toMatchObject({ ratio: 'adaptive', duration: 4 });
  expect(() => buildMiniMaxInput({ content: [text, frame('first_frame'), frame('reference_image')] })).toThrow('not both');
});
test('H3 submits directly to MiniMax with its own key and saved task namespace', async () => {
  process.env.MINIMAX_API_KEY = 'minimax-test';
  const query = { error: null, insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'job' } }), update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
  createAdminSupabase.mockReturnValue({ from: () => query });
  safeFetch.mockResolvedValue({ ok: true, json: async () => ({ task_id: '12345' }) });
  await expect(submitMiniMaxVideo({ model: 'MiniMax-H3', content: [text], resolution: '768p', duration: 4 })).resolves.toMatchObject({ id: 'minimax_12345', status: 'queued' });
  expect(safeFetch).toHaveBeenCalledWith('https://api.minimax.io/v2/video_generation', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer minimax-test' }) }));
  expect(query.update).toHaveBeenCalledWith({ provider_task_id: 'minimax_12345', status: 'queued' });
});
