begin;
create or replace function public.studio_claim_jobs(p_project text,p_owner uuid,p_revision bigint,p_jobs jsonb)
returns setof public.studio_jobs language plpgsql security definer set search_path=public as $$
declare current_revision bigint;
begin
  select revision into current_revision from public.studio_projects where id=p_project and owner_id=p_owner for update;
  if current_revision is null or current_revision<>p_revision then raise exception 'STUDIO_STALE'; end if;
  return query insert into public.studio_jobs(id,project_id,owner_id,batch_id,state,request)
    select x->>'id',p_project,p_owner,x->>'batchId','claimed',x->'request' from jsonb_array_elements(p_jobs) as x
    on conflict(id) do nothing returning *;
end $$;
revoke all on function public.studio_claim_jobs(text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.studio_claim_jobs(text,uuid,bigint,jsonb) to service_role;
create index if not exists film_jobs_studio_link on public.film_jobs ((request->>'studioJobId')) where request->>'namespace'='studio';
commit;
