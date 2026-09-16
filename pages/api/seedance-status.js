import { withAuth } from '../../utils/server/withAuth';
import { requestContext } from '../../utils/server/requestContext';
import { pollVideoJob } from '../../utils/server/videoJobs';
export const config = { maxDuration: 300 };
export default withAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();
  const taskId = req.query.taskId;
  if (typeof taskId !== 'string' || !/^[a-zA-Z0-9_-]{1,200}$/.test(taskId)) return res.status(400).json({ error: 'Invalid task ID' });
  const { supabase, user } = requestContext();
  const { data: job, error } = await supabase.from('film_jobs').select('*').eq('owner_id', user.id).eq('provider_task_id', taskId).maybeSingle();
  if (error) throw error;
  if (!job) return res.status(404).json({ error: 'Generation not found' });
  try { return res.json(await pollVideoJob(job)); }
  catch (error) { return res.status(502).json({ error: error.message }); }
});
