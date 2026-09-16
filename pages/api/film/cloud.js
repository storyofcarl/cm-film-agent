import { withAuth } from '../../../utils/server/withAuth';
import { requestContext } from '../../../utils/server/requestContext';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };
const validId = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id);
const keysIn = (project) => [...new Set([...JSON.stringify(project).matchAll(/\/api\/film\/media\?key=([a-f0-9]{16,64}\.[a-z0-9]{1,5})/gi)].map((m) => m[1]))];

export default withAuth(async (req, res) => {
  const { supabase, user } = requestContext();
  const projects = () => supabase.from('film_projects');
  if (req.method === 'POST') {
    const project = req.body?.project;
    if (!project || !validId(project.id)) return res.status(400).json({ error: 'Valid project ID required' });
    if (/data:(?:image|video|audio)\/[^;]+;base64,[A-Za-z0-9+/=]{100000}/.test(JSON.stringify(project))) {
      return res.status(400).json({ error: 'Finish uploading media before saving this project' });
    }
    const { data: existing, error: readError } = await projects().select('id,project').eq('owner_id', user.id).eq('id', project.id).maybeSingle();
    if (readError) throw readError;
    if (existing?.project?.canvas?.nodes?.length && !project.canvas?.nodes?.length) {
      return res.status(409).json({ error: 'An empty board cannot replace an existing production. Create a new project instead.' });
    }
    const now = new Date().toISOString();
    const { error } = await projects().upsert({ owner_id: user.id, id: project.id, name: project.name || project.title || 'Untitled film', project: { ...project, updatedAt: now }, updated_at: now }, { onConflict: 'owner_id,id' });
    if (error) throw error;
    return res.json({ ok: true, projectId: project.id, mediaCount: keysIn(project).length, uploadedNow: 0, missing: [], savedAt: now });
  }
  if (req.method === 'GET' && (!req.query.action || req.query.action === 'list')) {
    const { data, error } = await projects().select('id,name,updated_at').eq('owner_id', user.id).order('updated_at', { ascending: false }).limit(200);
    if (error) throw error;
    return res.json({ items: data.map((p) => ({ projectId: p.id, name: p.name, savedAt: p.updated_at })) });
  }
  const id = req.query.id;
  if (!validId(id)) return res.status(400).json({ error: 'Valid project ID required' });
  if (req.method === 'GET' && req.query.action === 'load') {
    const { data, error } = await projects().select('project,name,updated_at').eq('owner_id', user.id).eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Project not found' });
    return res.json({ project: data.project, name: data.name, savedAt: data.updated_at, media: keysIn(data.project) });
  }
  if (req.method === 'DELETE') {
    const { error } = await projects().delete().eq('owner_id', user.id).eq('id', id);
    if (error) throw error;
    // Media can be reused by other productions and stays in the owner's library.
    return res.json({ ok: true, projectId: id, removedMedia: 0, keptShared: true });
  }
  return res.status(405).end();
});
