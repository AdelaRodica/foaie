drop trigger normalize_and_validate_editions_isbn
on public.editions;

alter table public.editions
  alter column isbn10 type text,
  alter column isbn13 type text;

create trigger normalize_and_validate_editions_isbn
before insert or update of isbn10, isbn13 on public.editions
for each row
execute function private.normalize_and_validate_edition_isbn();
