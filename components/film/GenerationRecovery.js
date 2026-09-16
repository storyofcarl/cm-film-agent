import { useEffect, useState } from 'react';

export default function GenerationRecovery() {
  const [jobs, setJobs] = useState([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/film/jobs');
        if (!response.ok) return;
        const data = await response.json();
        if (alive) setJobs(data.jobs || []);
        const pending = (data.jobs || []).filter((j) => j.provider_task_id && ['queued', 'running', 'pending'].includes(j.status)).slice(0, 3);
        for (const job of pending) await fetch('/api/seedance-status?taskId=' + encodeURIComponent(job.provider_task_id));
      } catch { /* next refresh retries */ }
    };
    refresh(); const timer = setInterval(refresh, 15000);
    return () => { alive = false; clearInterval(timer); };
  }, []);
  return <div className="generation-recovery">
    <button onClick={() => setOpen(!open)}>Generations {jobs.filter((j) => ['queued', 'running', 'pending'].includes(j.status)).length || ''}</button>
    {open && <section aria-label="Recent generations"><h3>Recent generations</h3>
      <p>Your queued image and video tasks remain available after you close the canvas.</p>
      {!jobs.length && <p>No generations yet.</p>}
      {jobs.map((job) => <div key={job.id} className="generation-row"><span>{new Date(job.created_at).toLocaleString()}<br /><small>{job.status}</small></span>
        {job.kind === 'image' && job.result?.url && <a href={job.result.url} target="_blank" rel="noreferrer">Open image</a>}
        {job.result?.video_url && <a href={job.result.video_url} target="_blank" rel="noreferrer">Open video ↗</a>}
        {job.result?.error && <small role="status">{typeof job.result.error === 'string' ? job.result.error : job.result.error.message}</small>}
      </div>)}
    </section>}
  </div>;
}
