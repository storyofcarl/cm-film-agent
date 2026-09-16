import { withAuth } from '../../../utils/server/withAuth';
import { signedMediaUrl, storeKeyFromUrl, KEY_RE } from '../../../utils/server/mediaStore';
export default withAuth(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const key = storeKeyFromUrl(req.body?.url) || req.body?.objectKey;
  if (!KEY_RE.test(String(key || ''))) return res.status(400).json({ error: 'Owned media key required' });
  try { return res.json({ url: await signedMediaUrl(key), objectKey: key }); }
  catch { return res.status(404).json({ error: 'Media not found' }); }
});
