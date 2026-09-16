import { withAuth } from '../../../utils/server/withAuth';
import { KEY_RE, checkInUrl, signedMediaUrl } from '../../../utils/server/mediaStore';
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };
export default withAuth(async (req, res) => {
  if (req.method === 'GET') {
    const key = String(req.query.key || '');
    if (!KEY_RE.test(key)) return res.status(400).json({ error: 'Invalid media key' });
    try { return res.redirect(307, await signedMediaUrl(key)); }
    catch { return res.status(404).json({ error: 'Media not found' }); }
  }
  if (req.method === 'POST') {
    try { return res.status(200).json(await checkInUrl(req.body?.url)); }
    catch { return res.status(400).json({ error: 'Could not preserve this media' }); }
  }
  return res.status(405).end();
});
