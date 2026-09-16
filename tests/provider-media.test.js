/** @jest-environment node */
import { createMocks } from 'node-mocks-http';
import seed from '../pages/api/seed';
import seedream from '../pages/api/seedream';
import { signedMediaUrl } from '../utils/server/mediaStore';
import { safeFetch } from '../utils/server/safeFetch';

jest.mock('../utils/server/withAuth', () => ({ withAuth: (handler) => handler }));
jest.mock('../utils/server/supabase', () => ({ createAdminSupabase: jest.fn() }));
jest.mock('../utils/server/safeFetch', () => ({ safeFetch: jest.fn() }));
jest.mock('../utils/config', () => ({ CONFIG: { API_BASE_URL: 'https://provider.example/api/v3' }, getEndpointUrl: () => 'https://provider.example/api/v3/images/generations' }));
jest.mock('../utils/server/mediaStore', () => ({
  signedMediaUrl: jest.fn(), readStoreBytes: jest.fn(),
  storeKeyFromUrl: (value) => /\/api\/film\/media\?key=([a-f0-9]+\.\w+)/.exec(value || '')?.[1] || null,
}));

const key = 'a'.repeat(32) + '.mp4';
const protectedUrl = '/api/film/media?key=' + key;
const signedUrl = 'https://storage.example/signed/video.mp4?token=test';
beforeEach(() => {
  jest.clearAllMocks();
  process.env.MODELARK_API_KEY = 'test-key';
  delete process.env.MODELARK_REASONER_PROTOCOL;
  signedMediaUrl.mockResolvedValue(signedUrl);
  safeFetch.mockResolvedValue({ ok: true, text: async () => JSON.stringify({ output_text: 'Analyzed', choices: [{ message: { content: 'Analyzed' } }] }), json: async () => ({ data: [{ url: 'https://storage.example/generated.png' }] }) });
});

test.each(['seed-2-0-pro-test', 'chat-model-test'])('reasoning sends an owned video as a signed URL over %s', async (modelId) => {
  const { req, res } = createMocks({ method: 'POST', body: { prompt: 'Describe this shot', modelId, video: protectedUrl } });
  await seed(req, res);
  expect(res.statusCode).toBe(200);
  expect(signedMediaUrl).toHaveBeenCalledWith(key);
  const payload = JSON.parse(safeFetch.mock.calls[0][1].body);
  expect(JSON.stringify(payload)).toContain(signedUrl);
  expect(JSON.stringify(payload)).not.toContain('/api/film/media');
});

test('a denied video reference never reaches the billable provider', async () => {
  signedMediaUrl.mockRejectedValue(new Error('Media not found'));
  const { req, res } = createMocks({ method: 'POST', body: { prompt: 'Describe this shot', modelId: 'seed-2-0-pro-test', video: protectedUrl } });
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  try { await seed(req, res); } finally { spy.mockRestore(); }
  expect(res.statusCode).toBe(500);
  expect(safeFetch).not.toHaveBeenCalled();
});

test('the image tools resolve every protected reference before generation', async () => {
  const { req, res } = createMocks({ method: 'POST', body: { model: 'image-test', prompt: 'A storyboard', image: [protectedUrl, 'https://example.com/public.png'] } });
  await seedream(req, res);
  expect(res.statusCode).toBe(200);
  const payload = JSON.parse(safeFetch.mock.calls[0][1].body);
  expect(payload.image).toEqual([signedUrl, 'https://example.com/public.png']);
});
