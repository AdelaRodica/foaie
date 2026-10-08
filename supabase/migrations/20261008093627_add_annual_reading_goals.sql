create table public.annual_reading_goals (
  id uuid
    constraint annual_reading_goals_pkey
    primary key
    default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    constraint annual_reading_goals_user_id_fkey
    references public.profiles (id)
    on delete cascade,
  year integer not null,
  target_count integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint annual_reading_goals_user_id_year_key
    unique (user_id, year),
  constraint annual_reading_goals_target_count_positive
    check (target_count > 0)
);

create trigger set_annual_reading_goals_updated_at
before update on public.annual_reading_goals
for each row
execute function private.set_updated_at();

alter table public.annual_reading_goals enable row level security;

revoke all
on table public.annual_reading_goals
from public, anon, authenticated;

grant select
on table public.annual_reading_goals
to authenticated;

grant insert (year, target_count)
on table public.annual_reading_goals
to authenticated;

grant update (target_count)
on table public.annual_reading_goals
to authenticated;

grant delete
on table public.annual_reading_goals
to authenticated;

create policy "Users can read their own annual reading goals"
on public.annual_reading_goals
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their own annual reading goals"
on public.annual_reading_goals
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their own annual reading goals"
on public.annual_reading_goals
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their own annual reading goals"
on public.annual_reading_goals
for delete
to authenticated
using (user_id = (select auth.uid()));
