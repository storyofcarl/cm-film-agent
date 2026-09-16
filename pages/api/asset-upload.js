import { withAuth } from '../../utils/server/withAuth';
import { checkInUrl, TYPE_BY_EXT } from '../../utils/server/mediaStore';
import { catalogueMedia } from '../../utils/server/catalogueMedia';
import { callAssetApi } from '../../utils/server/assetApi';

// Local files travel directly to private Storage; this route receives references.
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };
export default withAuth(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }
  const { assetType = 'Image', imageUrl, videoUrl, assetName, stageOnly = false } = req.body || {};
  if (!['Image', 'Video'].includes(assetType)) return res.status(400).json({ error: 'Choose an image or video asset' });
  const source = assetType === 'Video' ? videoUrl : imageUrl;
  if (!source) return res.status(400).json({ error: 'Upload a file or provide a media URL first' });
  // checkInUrl verifies ownership for private references and safely imports remote
  // media. Registration always records the owner through catalogueMedia.
  const stored = await checkInUrl(source);
  const contentType = TYPE_BY_EXT[stored.key.split('.').pop()] || '';
  if (!contentType.startsWith(assetType === 'Video' ? 'video/' : 'image/')) {
    return res.status(400).json({ error: 'The media format does not match the selected asset type' });
  }
  if (stageOnly) return res.json({ stagedOnly: true, imageUrl: stored.url, mediaUrl: stored.url });
  const assetId = await catalogueMedia(stored.key, assetName);
  if (!assetId) return res.status(503).json({ error: 'Media saved, but provider registration is unavailable. Retry to register it.', mediaUrl: stored.url });
  let asset;
  try {
    const status = await callAssetApi({
      action: 'GetAsset', payload: { Id: assetId, ProjectName: 'default' },
      accessKey: process.env.MODELARK_ASSET_ACCESS_KEY,
      secretKey: process.env.MODELARK_ASSET_SECRET_KEY,
    });
    asset = status?.Result;
  } catch { /* Registration is durable; a status outage must not cause a re-upload. */ }
  return res.json({
    assetId, assetType, projectName: 'default', mediaUrl: stored.url, imageUrl: stored.url,
    assetName: String(assetName || '').slice(0, 120),
    asset: { ...asset, Id: assetId, URL: stored.url },
    poll: { done: ['Active', 'Failed'].includes(asset?.Status) },
  });
});
