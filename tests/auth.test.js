/** @jest-environment node */
import { createMocks } from 'node-mocks-http';
import { withAuth } from '../utils/server/withAuth';
import { requestContext } from '../utils/server/requestContext';
import { createRequestSupabase } from '../utils/server/supabase';

jest.mock('../utils/server/supabase', () => ({ createRequestSupabase: jest.fn() }));
const user = { id: 'owner-one', app_metadata: { film_agent_access: true } };
const authenticate = (value = user) => createRequestSupabase.mockReturnValue({ auth: { getUser: async () => ({ data: { user: value } }) } });
beforeEach(() => { jest.clearAllMocks(); authenticate(); });

test('anonymous and unapproved users cannot invoke a provider handler', async () => {
  for (const candidate of [null, { id: 'unapproved', user_metadata: { film_agent_access: true } }]) {
    authenticate(candidate);
    const handler = jest.fn(); const { req, res } = createMocks({ method: 'GET' });
    await withAuth(handler)(req, res);
    expect(res.statusCode).toBe(candidate ? 403 : 401);
    expect(handler).not.toHaveBeenCalled();
  }
});
test('cross-origin writes are rejected before authentication', async () => {
  const { req, res } = createMocks({ method: 'POST', headers: { origin: 'https://attacker.example', host: 'studio.example' } });
  await withAuth(jest.fn())(req, res);
  expect(res.statusCode).toBe(403);
  expect(createRequestSupabase).not.toHaveBeenCalled();
});
test('provider destinations and credentials cannot be overridden by the browser', async () => {
  const { req, res } = createMocks({ method: 'POST', headers: { origin: 'https://studio.example', host: 'studio.example', authorization: 'Bearer attacker' }, body: { baseUrl: 'https://attacker.example', apiKey: 'attacker', prompt: 'a film' }, query: { baseUrl: 'https://attacker.example' } });
  await withAuth(async (request, response) => {
    expect(request.body).toEqual({ prompt: 'a film' });
    expect(request.query.baseUrl).toBeUndefined();
    expect(request.headers.authorization).toBeUndefined();
    expect(requestContext().user.id).toBe(user.id);
    response.json({ ok: true });
  })(req, res);
  expect(res.statusCode).toBe(200);
  expect(res.getHeader('Cache-Control')).toBe('private, no-store');
});
test('an authentication outage fails closed', async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  createRequestSupabase.mockImplementation(() => { throw new Error('unavailable'); });
  const handler = jest.fn(); const { req, res } = createMocks({ method: 'GET' });
  await withAuth(handler)(req, res);
  expect(res.statusCode).toBe(500); expect(handler).not.toHaveBeenCalled(); spy.mockRestore();
});
