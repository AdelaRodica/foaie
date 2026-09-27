create table public.user_editions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  edition_id uuid not null
    references public.editions (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint user_editions_user_id_edition_id_key unique (user_id, edition_id)
);

create index user_editions_edition_id_idx
on public.user_editions (edition_id);

alter table public.user_editions enable row level security;

revoke all on table public.user_editions from public, anon, authenticated;

grant select on table public.user_editions to authenticated;
grant insert (edition_id) on table public.user_editions to authenticated;
grant delete on table public.user_editions to authenticated;

create policy "Users can read their own library editions"
on public.user_editions
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can add editions to their own library"
on public.user_editions
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can remove editions from their own library"
on public.user_editions
for delete
to authenticated
using (user_id = (select auth.uid()));
