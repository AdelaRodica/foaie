create table public.series (
  id uuid primary key default gen_random_uuid(),
  name varchar(250) not null,
  normalized_name varchar(250) generated always as (
    pg_catalog.lower(
      pg_catalog.btrim(
        pg_catalog.regexp_replace(name, '[[:space:]]+', ' ', 'g')
      )
    )
  ) stored,
  description text,
  created_by_profile_id uuid default auth.uid()
    references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint series_name_not_blank check (pg_catalog.btrim(name) <> ''),
  constraint series_description_not_blank check (
    description is null or pg_catalog.btrim(description) <> ''
  )
);

create index series_normalized_name_idx
on public.series (normalized_name);

create index series_created_by_profile_id_idx
on public.series (created_by_profile_id);

create trigger set_series_updated_at
before update on public.series
for each row
execute function private.set_updated_at();

create table public.work_series (
  work_id uuid not null
    references public.works (id) on delete cascade,
  series_id uuid not null
    references public.series (id) on delete restrict,
  position numeric(8, 3),
  position_label varchar(60),
  primary key (work_id, series_id),
  constraint work_series_position_positive check (
    position is null or position > 0
  ),
  constraint work_series_position_label_not_blank check (
    position_label is null or pg_catalog.btrim(position_label) <> ''
  )
);

create index work_series_series_position_idx
on public.work_series (series_id, position, work_id);

alter table public.series enable row level security;
alter table public.work_series enable row level security;

revoke all on table public.series from public, anon, authenticated;
revoke all on table public.work_series from public, anon, authenticated;

grant select on table public.series to authenticated;
grant insert (name, description) on table public.series to authenticated;
grant update (name, description) on table public.series to authenticated;
grant delete on table public.series to authenticated;

grant select on table public.work_series to authenticated;
grant insert (work_id, series_id, position, position_label)
  on table public.work_series to authenticated;
grant update (position, position_label)
  on table public.work_series to authenticated;
grant delete on table public.work_series to authenticated;

create policy "Authenticated users can read series"
on public.series
for select
to authenticated
using (true);

create policy "Authenticated users can create series"
on public.series
for insert
to authenticated
with check (created_by_profile_id = (select auth.uid()));

create policy "Creators can update series"
on public.series
for update
to authenticated
using (created_by_profile_id = (select auth.uid()))
with check (created_by_profile_id = (select auth.uid()));

create policy "Creators can delete series"
on public.series
for delete
to authenticated
using (created_by_profile_id = (select auth.uid()));

create policy "Authenticated users can read work series"
on public.work_series
for select
to authenticated
using (true);

create policy "Work creators can create work series"
on public.work_series
for insert
to authenticated
with check (
  exists (
    select 1
    from public.works as work
    where work.id = work_series.work_id
      and work.created_by_profile_id = (select auth.uid())
  )
);

create policy "Work creators can update work series"
on public.work_series
for update
to authenticated
using (
  exists (
    select 1
    from public.works as work
    where work.id = work_series.work_id
      and work.created_by_profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.works as work
    where work.id = work_series.work_id
      and work.created_by_profile_id = (select auth.uid())
  )
);

create policy "Work creators can delete work series"
on public.work_series
for delete
to authenticated
using (
  exists (
    select 1
    from public.works as work
    where work.id = work_series.work_id
      and work.created_by_profile_id = (select auth.uid())
  )
);
