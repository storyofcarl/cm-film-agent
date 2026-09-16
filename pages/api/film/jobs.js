import { withAuth } from '../../../utils/server/withAuth';
import { requestContext } from '../../../utils/server/requestContext';
export default withAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();
  const { supabase, user } = requestContext();
  const { data, error } = await supabase.from('film_jobs').select('id,provider_task_id,kind,status,result,created_at').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return res.json({ jobs: data });
});
