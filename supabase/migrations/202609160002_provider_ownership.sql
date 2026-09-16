begin;
-- Provider task IDs are minted only after a successful server-side submission.
-- A browser must not be able to claim another task by inserting an arbitrary ID.
drop policy if exists owner_access on public.film_jobs;
drop policy if exists owner_read on public.film_jobs;
create policy owner_read on public.film_jobs for select to authenticated
  using (owner_id = (select auth.uid()) and coalesce((auth.jwt()->'app_metadata'->>'film_agent_access')::boolean, false));
revoke insert, update, delete on public.film_jobs from authenticated;

create table if not exists public.film_provider_assets (
  owner_id uuid not null references auth.users(id) on delete cascade,
  media_key text not null,
  asset_id text not null,
  primary key(owner_id, media_key),
  unique(owner_id, asset_id)
);
alter table public.film_provider_assets enable row level security;
drop policy if exists owner_read on public.film_provider_assets;
create policy owner_read on public.film_provider_assets for select to authenticated
  using (owner_id = (select auth.uid()) and coalesce((auth.jwt()->'app_metadata'->>'film_agent_access')::boolean, false));
grant select on public.film_provider_assets to authenticated;
revoke insert, update, delete on public.film_provider_assets from authenticated;
commit;
