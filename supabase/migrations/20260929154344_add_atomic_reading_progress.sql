create table public.progress_entries (
  id uuid
    constraint progress_entries_pkey
    primary key
    default gen_random_uuid(),
  reading_session_id uuid not null
    constraint progress_entries_reading_session_id_fkey
    references public.reading_sessions (id)
    on delete cascade,
  kind text not null,
  previous_value integer not null,
  new_value integer not null,
  occurred_on date not null,
  created_at timestamptz not null default now(),
  constraint progress_entries_kind_valid check (
    kind in ('PROGRESS', 'CORRECTION')
  ),
  constraint progress_entries_previous_value_nonnegative check (
    previous_value >= 0
  ),
  constraint progress_entries_new_value_nonnegative check (
    new_value >= 0
  ),
  constraint progress_entries_change_valid check (
    (
      kind = 'PROGRESS'
      and new_value > previous_value
    )
    or
    (
      kind = 'CORRECTION'
      and new_value <> previous_value
    )
  )
);

create index progress_entries_session_history_idx
on public.progress_entries (
  reading_session_id,
  occurred_on desc,
  created_at desc,
  id desc
);

alter table public.progress_entries enable row level security;

revoke all on table public.progress_entries from public, anon, authenticated;

grant select on table public.progress_entries to authenticated;

create policy "Users can read their own progress entries"
on public.progress_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.reading_sessions as rs
    join public.user_editions as ue
      on ue.id = rs.user_edition_id
    where rs.id = progress_entries.reading_session_id
      and ue.user_id = (select auth.uid())
  )
);

create function public.record_reading_progress(
  p_reading_session_id uuid,
  p_target_value integer,
  p_kind text,
  p_occurred_on date
)
returns table (
  id uuid,
  reading_session_id uuid,
  kind text,
  previous_value integer,
  new_value integer,
  occurred_on date,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_status text;
  v_started_at date;
  v_previous_value integer;
  v_entry_id uuid;
  v_entry_created_at timestamptz;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'Authenticated identity required.'
      using errcode = '42501';
  end if;

  select
    rs.status,
    rs.started_at,
    rs.current_value
  into
    v_status,
    v_started_at,
    v_previous_value
  from public.reading_sessions as rs
  join public.user_editions as ue
    on ue.id = rs.user_edition_id
  where rs.id = p_reading_session_id
    and ue.user_id = v_user_id
  for update of rs;

  if not found then
    return;
  end if;

  if v_status <> 'READING' then
    return;
  end if;

  if p_occurred_on < v_started_at then
    raise exception 'Reading progress date is invalid.'
      using errcode = '23514';
  end if;

  insert into public.progress_entries (
    reading_session_id,
    kind,
    previous_value,
    new_value,
    occurred_on
  )
  values (
    p_reading_session_id,
    p_kind,
    v_previous_value,
    p_target_value,
    p_occurred_on
  )
  returning
    progress_entries.id,
    progress_entries.created_at
  into
    v_entry_id,
    v_entry_created_at;

  update public.reading_sessions
  set current_value = p_target_value
  where reading_sessions.id = p_reading_session_id;

  return query
  select
    v_entry_id,
    p_reading_session_id,
    p_kind,
    v_previous_value,
    p_target_value,
    p_occurred_on,
    v_entry_created_at;
end;
$$;

revoke all
on function public.record_reading_progress(uuid, integer, text, date)
from public, anon, authenticated;

grant execute
on function public.record_reading_progress(uuid, integer, text, date)
to authenticated;
