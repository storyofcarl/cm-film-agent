begin;

-- Studio is additive. Legacy project records and media remain intact.
create table if not exists public.studio_projects (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  document jsonb not null,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(document) = 'object')
);
create index if not exists studio_projects_owner on public.studio_projects(owner_id, updated_at desc);
create table if not exists public.studio_project_versions (
  project_id text not null references public.studio_projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision bigint not null,
  document jsonb not null,
  created_at timestamptz not null default now(),
  primary key(project_id, revision)
);
create table if not exists public.studio_jobs (
  id text primary key,
  project_id text not null references public.studio_projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  batch_id text not null,
  state text not null default 'claimed',
  request jsonb not null,
  result jsonb,
  error text,
  provider_job_id uuid references public.film_jobs(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (state in ('claimed','queued','running','succeeded','failed','uncertain'))
);
create index if not exists studio_jobs_project on public.studio_jobs(owner_id,project_id);
alter table public.studio_projects enable row level security;
alter table public.studio_project_versions enable row level security;
alter table public.studio_jobs enable row level security;
-- Clients can read their records. Commands, approvals, and execution claims must
-- pass the authenticated server contract; direct client writes are forbidden.
create policy studio_projects_read on public.studio_projects for select to authenticated using (owner_id=auth.uid());
create policy studio_versions_read on public.studio_project_versions for select to authenticated using (owner_id=auth.uid());
create policy studio_jobs_read on public.studio_jobs for select to authenticated using (owner_id=auth.uid());
revoke all on public.studio_projects,public.studio_project_versions,public.studio_jobs from anon,authenticated;
grant select on public.studio_projects,public.studio_project_versions,public.studio_jobs to authenticated;
grant all on public.studio_projects,public.studio_project_versions,public.studio_jobs to service_role;

create or replace function public.studio_snapshot() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.studio_project_versions(project_id,owner_id,revision,document)
  values(new.id,new.owner_id,new.revision,new.document);
  return new;
end $$;
create trigger studio_snapshot after insert or update on public.studio_projects for each row execute function public.studio_snapshot();
revoke all on function public.studio_snapshot() from public,anon,authenticated;
commit;
