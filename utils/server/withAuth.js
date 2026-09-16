import { createRequestSupabase } from './supabase';
import { runWithRequest } from './requestContext';

export const isApprovedUser = (user) => user?.app_metadata?.film_agent_access === true;

export const sameOriginRequest = (req) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  if (!req.headers.origin) return true; // non-browser clients still need valid auth
  try { return new URL(req.headers.origin).host === req.headers.host; } catch { return false; }
};

export const withAuth = (handler) => async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!sameOriginRequest(req)) return res.status(403).json({ error: 'Cross-origin request denied' });
  try {
    const supabase = createRequestSupabase(req, res);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return res.status(401).json({ error: 'Sign in to continue' });
    if (!isApprovedUser(user)) return res.status(403).json({ error: 'This account has not been granted Film Agent access' });
    // Hosted accounts use deployment credentials exclusively. A browser cannot
    // redirect authenticated provider requests or override the server's API key.
    for (const source of [req.body, req.query]) {
      if (source && typeof source === 'object') {
        delete source.apiKey;
        delete source.baseUrl;
      }
    }
    delete req.headers.authorization;
    const model = req.body?.model || req.body?.modelId;
    if (model) {
      const configured = Object.entries(process.env).filter(([name]) => name.startsWith('MODELARK_MODEL_')).map(([, value]) => value);
      if (!configured.includes(model)) return res.status(400).json({ error: 'Choose a model enabled for this workspace' });
    }
    return await runWithRequest({ user, supabase }, () => handler(req, res));
  } catch (error) {
    console.error('[api]', error.code || error.name || 'request error');
    if (!res.headersSent) return res.status(500).json({ error: 'Request could not be completed. Please retry.' });
    return undefined;
  }
};
