create table public.reading_sessions (
  id uuid
    constraint reading_sessions_pkey
    primary key
    default gen_random_uuid(),
  user_edition_id uuid not null
    constraint reading_sessions_user_edition_id_fkey
    references public.user_editions (id)
    on delete cascade,
  status text not null,
  started_at date,
  finished_at date,
  abandoned_at date,
  current_value integer not null default 0,
  progress_unit text not null,
  created_at timestamptz not null default now(),
  constraint reading_sessions_status_valid check (
    status in ('READING', 'FINISHED', 'ABANDONED')
  ),
  constraint reading_sessions_progress_unit_valid check (
    progress_unit in ('PAGES', 'PERCENT', 'MINUTES')
  ),
  constraint reading_sessions_current_value_nonnegative check (
    current_value >= 0
  ),
  constraint reading_sessions_percent_range_valid check (
    progress_unit <> 'PERCENT'
    or current_value <= 100
  ),
  constraint reading_sessions_status_dates_valid check (
    (
      status = 'READING'
      and started_at is not null
      and finished_at is null
      and abandoned_at is null
    )
    or
    (
      status = 'FINISHED'
      and finished_at is not null
      and abandoned_at is null
      and (
        started_at is null
        or finished_at >= started_at
      )
    )
    or
    (
      status = 'ABANDONED'
      and abandoned_at is not null
      and finished_at is null
      and (
        started_at is null
        or abandoned_at >= started_at
      )
    )
  )
);

create index reading_sessions_user_edition_id_idx
on public.reading_sessions (user_edition_id);

create unique index reading_sessions_one_active_per_user_edition_idx
on public.reading_sessions (user_edition_id)
where status = 'READING';

alter table public.reading_sessions enable row level security;

revoke all on table public.reading_sessions from public, anon, authenticated;

grant select on table public.reading_sessions to authenticated;
grant insert (
  user_edition_id,
  status,
  started_at,
  current_value,
  progress_unit
) on table public.reading_sessions to authenticated;

create policy "Users can read their own reading sessions"
on public.reading_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.user_editions as ue
    where ue.id = reading_sessions.user_edition_id
      and ue.user_id = (select auth.uid())
  )
);

create policy "Users can start reading sessions in their own library"
on public.reading_sessions
for insert
to authenticated
with check (
  status = 'READING'
  and exists (
    select 1
    from public.user_editions as ue
    where ue.id = reading_sessions.user_edition_id
      and ue.user_id = (select auth.uid())
  )
);

drop policy "Users can remove editions from their own library"
on public.user_editions;

create policy "Users can remove editions without reading history"
on public.user_editions
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and not exists (
    select 1
    from public.reading_sessions as rs
    where rs.user_edition_id = user_editions.id
  )
);
