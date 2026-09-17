begin;
create or replace function public.studio_claim_jobs(p_project text,p_owner uuid,p_revision bigint,p_jobs jsonb)
returns setof public.studio_jobs language plpgsql security definer set search_path=public as $$
declare current_revision bigint; claimed text[];
begin
  select revision into current_revision from public.studio_projects where id=p_project and owner_id=p_owner for update;
  if current_revision is null or current_revision<>p_revision then raise exception 'STUDIO_STALE'; end if;
  with inserted as (
    insert into public.studio_jobs(id,project_id,owner_id,batch_id,state,request)
    select x->>'id',p_project,p_owner,x->>'batchId','claimed',x->'request' from jsonb_array_elements(p_jobs) as x
    on conflict(id) do nothing returning id
  ) select array_agg(id) into claimed from inserted;
  if claimed is null then return; end if;
  -- The claim is a real project revision, so a concurrent replan cannot erase it
  -- or silently authorize the same target in another batch.
  update public.studio_projects set
    document=jsonb_set(document,'{batches}',(
      select jsonb_agg(batch || jsonb_build_object('jobs',(
        select jsonb_agg(case when job->>'id'=any(claimed) then job || '{"state":"claimed"}'::jsonb else job end)
        from jsonb_array_elements(batch->'jobs') as job
      ))) from jsonb_array_elements(document->'batches') as batch
    )), revision=revision+1, updated_at=now()
    where id=p_project and owner_id=p_owner;
  return query select * from public.studio_jobs where id=any(claimed) and owner_id=p_owner;
end $$;
revoke all on function public.studio_claim_jobs(text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.studio_claim_jobs(text,uuid,bigint,jsonb) to service_role;
commit;
