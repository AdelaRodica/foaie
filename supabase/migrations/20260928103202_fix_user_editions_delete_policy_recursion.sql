create function private.can_remove_user_edition(
  target_user_edition_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_editions as ue
    where ue.id = target_user_edition_id
      and ue.user_id = (select auth.uid())
      and not exists (
        select 1
        from public.reading_sessions as rs
        where rs.user_edition_id = ue.id
      )
  );
$$;

revoke all
on function private.can_remove_user_edition(uuid)
from public, anon, authenticated;

grant usage on schema private to authenticated;

grant execute
on function private.can_remove_user_edition(uuid)
to authenticated;

drop policy "Users can remove editions without reading history"
on public.user_editions;

create policy "Users can remove editions without reading history"
on public.user_editions
for delete
to authenticated
using (
  private.can_remove_user_edition(id)
);
