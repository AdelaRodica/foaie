grant update (
  status,
  finished_at,
  abandoned_at
) on table public.reading_sessions
to authenticated;

create policy "Users can close their own reading sessions"
on public.reading_sessions
for update
to authenticated
using (
  status = 'READING'
  and exists (
    select 1
    from public.user_editions as ue
    where ue.id = reading_sessions.user_edition_id
      and ue.user_id = (select auth.uid())
  )
)
with check (
  status in ('FINISHED', 'ABANDONED')
  and exists (
    select 1
    from public.user_editions as ue
    where ue.id = reading_sessions.user_edition_id
      and ue.user_id = (select auth.uid())
  )
);
