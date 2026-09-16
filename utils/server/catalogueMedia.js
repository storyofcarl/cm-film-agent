import { registerAsset } from '../film/server/registerAsset';
import { signedMediaUrl, TYPE_BY_EXT } from './mediaStore';
import { requestContext } from './requestContext';
import { createAdminSupabase } from './supabase';

export const catalogueMedia = async (key, name) => {
  const { user, supabase } = requestContext();
  const { data: existing } = await supabase.from('film_provider_assets').select('asset_id').eq('owner_id', user.id).eq('media_key', key).maybeSingle();
  if (existing?.asset_id) return existing.asset_id;
  const contentType = TYPE_BY_EXT[key.split('.').pop()] || '';
  const assetType = contentType.startsWith('image/') ? 'Image' : contentType.startsWith('video/') ? 'Video' : null;
  if (!assetType || !process.env.MODELARK_ASSET_ACCESS_KEY || !process.env.MODELARK_ASSET_SECRET_KEY) return null;
  try {
    const assetId = await registerAsset({ accessKey: process.env.MODELARK_ASSET_ACCESS_KEY,
      secretKey: process.env.MODELARK_ASSET_SECRET_KEY, url: await signedMediaUrl(key), name, assetType, waitForActive: true });
    if (!assetId) return null;
    const { error } = await createAdminSupabase().from('film_provider_assets').upsert({ owner_id: user.id, media_key: key, asset_id: assetId });
    if (error) throw error;
    return assetId;
  } catch (error) { console.warn('[asset registration]', error.code || 'unavailable'); return null; }
};
