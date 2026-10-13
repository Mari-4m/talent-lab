-- Apply to the user's confirmed Supabase project. No existing Sites data is deleted.
begin;
create table if not exists public.talent_lab_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  document jsonb not null default '{"state":{},"practice":{}}'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  constraint talent_lab_document_shape check (
    jsonb_typeof(document) = 'object'
    and document ? 'state' and document ? 'practice'
    and jsonb_typeof(document->'state') = 'object'
    and jsonb_typeof(document->'practice') = 'object'
    and octet_length(document::text) <= 250000
  )
);
alter table public.talent_lab_progress enable row level security;
revoke all on public.talent_lab_progress from public, anon, authenticated;
grant select, insert, update on public.talent_lab_progress to authenticated;
drop policy if exists "Read own Talent Lab progress" on public.talent_lab_progress;
drop policy if exists "Create own Talent Lab progress" on public.talent_lab_progress;
drop policy if exists "Update own Talent Lab progress" on public.talent_lab_progress;
create policy "Read own Talent Lab progress" on public.talent_lab_progress
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own Talent Lab progress" on public.talent_lab_progress
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own Talent Lab progress" on public.talent_lab_progress
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Atomic compare-and-swap. No caller-supplied ID chooses the owner.
-- p_account is an additional guard against an old tab writing after account switching.
create or replace function public.talent_lab_save_progress(p_account uuid, p_revision bigint, p_document jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid := auth.uid(); saved public.talent_lab_progress%rowtype;
begin
  if owner_id is null or p_account is distinct from owner_id then
    raise exception 'Sign in to the original account again' using errcode = '42501';
  end if;
  if p_revision is null or p_revision < 0 or p_document is null then
    raise exception 'Invalid progress' using errcode = '22023';
  end if;
  insert into public.talent_lab_progress(user_id) values (owner_id)
  on conflict (user_id) do nothing;
  update public.talent_lab_progress set document = p_document,
    revision = revision + 1, updated_at = now()
  where user_id = owner_id and revision = p_revision returning * into saved;
  if found then
    return jsonb_build_object('saved', true, 'data', saved.document,
      'revision', saved.revision, 'updatedAt', saved.updated_at);
  end if;
  select * into saved from public.talent_lab_progress where user_id = owner_id;
  return jsonb_build_object('saved', false, 'data', saved.document,
    'revision', saved.revision, 'updatedAt', saved.updated_at);
end;
$$;
revoke all on function public.talent_lab_save_progress(uuid,bigint,jsonb) from public, anon;
grant execute on function public.talent_lab_save_progress(uuid,bigint,jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
