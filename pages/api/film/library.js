import { withAuth } from '../../../utils/server/withAuth';
import { requestContext } from '../../../utils/server/requestContext';
export default withAuth(async (req, res) => {
  const { supabase, user } = requestContext();
  const table = () => supabase.from('film_library');
  const list = async () => {
    const { data, error } = await table().select('id,item,created_at').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(400);
    if (error) throw error;
    return data.map((row) => ({ ...row.item, id: row.id, createdAt: row.created_at }));
  };
  if (req.method === 'GET') return res.json({ items: await list() });
  if (req.method !== 'POST') return res.status(405).end();
  const { action } = req.query;
  const { id, url, assetId, name, kind = 'image', thumb } = req.body || {};
  if (action === 'add') {
    if (typeof url !== 'string' || !url) return res.status(400).json({ error: 'Media URL required' });
    const item = { url, assetId: assetId || null, name: name || 'Asset', kind, thumb: typeof thumb === 'string' && thumb.length < 100000 ? thumb : null };
    const { data, error } = await table().insert({ owner_id: user.id, item }).select('id,created_at').single();
    if (error) throw error;
    return res.json({ item: { ...item, id: data.id, createdAt: data.created_at }, items: await list() });
  }
  if (['remove', 'delete', 'clear'].includes(action)) {
    let query = table().delete().eq('owner_id', user.id);
    if (action !== 'clear') {
      if (id) query = query.eq('id', id);
      else if (url) query = query.eq('item->>url', url);
      else return res.status(400).json({ error: 'Asset ID or URL required' });
    }
    const { error } = await query;
    if (error) throw error;
    return res.json({ ok: true, items: await list(), storage: { media: 'retained for existing projects' } });
  }
  return res.status(400).json({ error: 'Unknown library action' });
});
