import { withAuth } from '../../../utils/server/withAuth';
import { requestContext } from '../../../utils/server/requestContext';
import { KEY_RE, MAX_MEDIA_BYTES, MEDIA_BUCKET, objectPath, mediaUrl, signedMediaUrl, TYPE_BY_EXT } from '../../../utils/server/mediaStore';
import { catalogueMedia } from '../../../utils/server/catalogueMedia';
export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };
export default withAuth(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { action, key, contentType, size, name } = req.body || {};
  if (!KEY_RE.test(String(key || ''))) return res.status(400).json({ error: 'Valid upload key required' });
  if (action === 'sign') {
    if (!TYPE_BY_EXT[key.split('.').pop()] || TYPE_BY_EXT[key.split('.').pop()] !== contentType || !Number.isFinite(size) || size < 1 || size > MAX_MEDIA_BYTES) {
      return res.status(400).json({ error: 'Unsupported file format or size' });
    }
    const path = objectPath(key);
    const { data, error } = await requestContext().supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path, { upsert: true });
    if (error) throw error;
    return res.json({ path, token: data.token });
  }
  if (action === 'complete') {
    await signedMediaUrl(key);
    const assetId = await catalogueMedia(key, name);
    return res.json({ url: mediaUrl(key), cacheUrl: mediaUrl(key), assetId, contentType: TYPE_BY_EXT[key.split('.').pop()] });
  }
  return res.status(400).json({ error: 'Use a direct signed upload' });
});
