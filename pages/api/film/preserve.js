import { withAuth } from '../../../utils/server/withAuth';
import { checkInUrl } from '../../../utils/server/mediaStore';
import { catalogueMedia } from '../../../utils/server/catalogueMedia';
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };
export default withAuth(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const stored = await checkInUrl(req.body?.url);
  const assetId = await catalogueMedia(stored.key, req.body?.name);
  return res.json({ ...stored, assetId, objectKey: stored.key });
});
