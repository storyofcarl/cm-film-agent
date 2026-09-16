begin;

create table if not exists public.film_projects (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (id ~ '^[a-zA-Z0-9_-]{1,100}$'),
  name text not null default 'Untitled film',
  project jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);
create table if not exists public.film_project_versions (
  id bigint generated always as identity primary key,
  owner_id uuid not null,
  project_id text not null,
  project jsonb not null,
  created_at timestamptz not null default now(),
  foreign key (owner_id, project_id) references public.film_projects(owner_id, id) on delete cascade
);
create table if not exists public.film_library (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  item jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.film_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider_task_id text unique,
  kind text not null,
  status text not null default 'submitting',
  request jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists film_jobs_owner_created on public.film_jobs(owner_id, created_at desc);

alter table public.film_projects enable row level security;
alter table public.film_project_versions enable row level security;
alter table public.film_library enable row level security;
alter table public.film_jobs enable row level security;

do $$ declare t text; begin
  foreach t in array array['film_projects','film_project_versions','film_library','film_jobs'] loop
    execute format('drop policy if exists owner_access on public.%I', t);
    execute format('create policy owner_access on public.%I for all to authenticated using (owner_id = (select auth.uid()) and coalesce((auth.jwt()->''app_metadata''->>''film_agent_access'')::boolean, false)) with check (owner_id = (select auth.uid()) and coalesce((auth.jwt()->''app_metadata''->>''film_agent_access'')::boolean, false))', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
grant usage, select on sequence public.film_project_versions_id_seq to authenticated;

create or replace function public.film_project_version() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.project is distinct from new.project then
    insert into public.film_project_versions(owner_id, project_id, project)
      values(old.owner_id, old.id, old.project);
  end if;
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists film_project_version on public.film_projects;
create trigger film_project_version before update on public.film_projects
  for each row execute function public.film_project_version();

insert into storage.buckets(id, name, public, file_size_limit)
  values ('film-media', 'film-media', false, 524288000)
  on conflict (id) do nothing;
drop policy if exists film_media_owner on storage.objects;
create policy film_media_owner on storage.objects for all to authenticated
  using (bucket_id = 'film-media' and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce((auth.jwt()->'app_metadata'->>'film_agent_access')::boolean, false))
  with check (bucket_id = 'film-media' and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce((auth.jwt()->'app_metadata'->>'film_agent_access')::boolean, false));

commit;
