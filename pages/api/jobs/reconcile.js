import crypto from 'node:crypto';
import { createAdminSupabase } from '../../../utils/server/supabase';
import { runWithRequest } from '../../../utils/server/requestContext';
import { pollVideoJob } from '../../../utils/server/videoJobs';

export const config = { maxDuration: 300 };
export default async function reconcile(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();
  const expected = process.env.CRON_SECRET;
  const token = String(req.headers.authorization || '').replace(/^Bearer /, '');
  if (!expected || Buffer.byteLength(token) !== Buffer.byteLength(expected) || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return res.status(401).end();
  const supabase = createAdminSupabase();
  const { data, error } = await supabase.from('film_jobs').select('*').in('status', ['queued', 'running', 'pending']).not('provider_task_id', 'is', null).order('updated_at').limit(3);
  if (error) return res.status(503).json({ error: 'Job store unavailable' });
  const results = [];
  for (const job of data) {
    try {
      const result = await runWithRequest({ user: { id: job.owner_id }, supabase }, () => pollVideoJob(job));
      results.push({ id: job.id, status: result.status });
    } catch { results.push({ id: job.id, status: 'retry' }); }
  }
  return res.json({ results });
}
