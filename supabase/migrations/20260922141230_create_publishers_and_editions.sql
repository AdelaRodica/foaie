create table public.publishers (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  normalized_name varchar(200)
    generated always as (
      pg_catalog.lower(
        pg_catalog.btrim(
          pg_catalog.regexp_replace(
            name,
            '[[:space:]]+',
            ' ',
            'g'
          )
        )
      )
    ) stored,
  created_by_profile_id uuid default auth.uid()
    references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publishers_name_not_blank
    check (pg_catalog.btrim(name) <> '')
);

create index publishers_normalized_name_idx
on public.publishers (normalized_name);

create index publishers_created_by_profile_id_idx
on public.publishers (created_by_profile_id);

create trigger set_publishers_updated_at
before update on public.publishers
for each row
execute function private.set_updated_at();

create function private.normalize_and_validate_edition_isbn()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  normalized_isbn10 text;
  normalized_isbn13 text;
  derived_isbn13 text;
  checksum_total integer;
  checksum_digit integer;
  digit_value integer;
  position_index integer;
begin
  if new.isbn10 is not null then
    normalized_isbn10 := pg_catalog.upper(
      pg_catalog.regexp_replace(new.isbn10, '[[:space:]-]+', '', 'g')
    );

    if normalized_isbn10 !~ '^[0-9]{9}[0-9X]$' then
      raise exception using
        errcode = '23514',
        message = 'isbn10 must contain a valid ISBN-10';
    end if;

    checksum_total := 0;
    for position_index in 1..9 loop
      checksum_total := checksum_total
        + pg_catalog.substring(normalized_isbn10, position_index, 1)::integer
          * (11 - position_index);
    end loop;

    digit_value := case pg_catalog.right(normalized_isbn10, 1)
      when 'X' then 10
      else pg_catalog.right(normalized_isbn10, 1)::integer
    end;
    checksum_total := checksum_total + digit_value;

    if checksum_total % 11 <> 0 then
      raise exception using
        errcode = '23514',
        message = 'isbn10 must contain a valid ISBN-10';
    end if;

    new.isbn10 := normalized_isbn10;
  end if;

  if new.isbn13 is not null then
    normalized_isbn13 := pg_catalog.regexp_replace(
      new.isbn13,
      '[[:space:]-]+',
      '',
      'g'
    );

    if normalized_isbn13 !~ '^97[89][0-9]{10}$' then
      raise exception using
        errcode = '23514',
        message = 'isbn13 must contain a valid ISBN-13';
    end if;

    checksum_total := 0;
    for position_index in 1..12 loop
      digit_value := pg_catalog.substring(
        normalized_isbn13,
        position_index,
        1
      )::integer;
      checksum_total := checksum_total + digit_value
        * case when position_index % 2 = 0 then 3 else 1 end;
    end loop;
    checksum_total := checksum_total
      + pg_catalog.right(normalized_isbn13, 1)::integer;

    if checksum_total % 10 <> 0 then
      raise exception using
        errcode = '23514',
        message = 'isbn13 must contain a valid ISBN-13';
    end if;

    new.isbn13 := normalized_isbn13;
  end if;

  if new.isbn10 is not null then
    derived_isbn13 := '978' || pg_catalog.left(new.isbn10, 9);
    checksum_total := 0;

    for position_index in 1..12 loop
      digit_value := pg_catalog.substring(
        derived_isbn13,
        position_index,
        1
      )::integer;
      checksum_total := checksum_total + digit_value
        * case when position_index % 2 = 0 then 3 else 1 end;
    end loop;

    checksum_digit := (10 - (checksum_total % 10)) % 10;
    derived_isbn13 := derived_isbn13 || checksum_digit::text;

    if new.isbn13 is null then
      new.isbn13 := derived_isbn13;
    elsif new.isbn13 <> derived_isbn13 then
      raise exception using
        errcode = '23514',
        message = 'isbn10 and isbn13 must identify the same edition';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.normalize_and_validate_edition_isbn()
from public, anon, authenticated;

create table public.editions (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null
    references public.works (id) on delete restrict,
  publisher_id uuid
    references public.publishers (id) on delete restrict,
  edition_title varchar(300),
  subtitle varchar(300),
  isbn10 varchar(10),
  isbn13 varchar(13),
  publication_date date,
  publication_date_precision text,
  language_code varchar(35),
  format text not null,
  page_count integer,
  audio_duration_minutes integer,
  cover_url text,
  cover_storage_key text,
  created_by_profile_id uuid default auth.uid()
    references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editions_edition_title_not_blank
    check (
      edition_title is null
      or pg_catalog.btrim(edition_title) <> ''
    ),
  constraint editions_subtitle_not_blank
    check (
      subtitle is null
      or pg_catalog.btrim(subtitle) <> ''
    ),
  constraint editions_isbn10_format
    check (
      isbn10 is null
      or isbn10 ~ '^[0-9]{9}[0-9X]$'
    ),
  constraint editions_isbn13_format
    check (
      isbn13 is null
      or isbn13 ~ '^97[89][0-9]{10}$'
    ),
  constraint editions_isbn10_unique unique (isbn10),
  constraint editions_isbn13_unique unique (isbn13),
  constraint editions_publication_date_complete
    check (
      (publication_date is null and publication_date_precision is null)
      or (
        publication_date is not null
        and publication_date_precision is not null
      )
    ),
  constraint editions_publication_date_precision_valid
    check (
      publication_date_precision is null
      or publication_date_precision in ('YEAR', 'MONTH', 'DAY')
    ),
  constraint editions_publication_date_matches_precision
    check (
      publication_date_precision is null
      or publication_date_precision = 'DAY'
      or (
        publication_date_precision = 'MONTH'
        and extract(day from publication_date) = 1
      )
      or (
        publication_date_precision = 'YEAR'
        and extract(month from publication_date) = 1
        and extract(day from publication_date) = 1
      )
    ),
  constraint editions_language_code_not_blank
    check (
      language_code is null
      or pg_catalog.btrim(language_code) <> ''
    ),
  constraint editions_format_valid
    check (format in ('PHYSICAL', 'EBOOK', 'AUDIOBOOK')),
  constraint editions_page_count_positive
    check (page_count is null or page_count > 0),
  constraint editions_audio_duration_minutes_positive
    check (
      audio_duration_minutes is null
      or audio_duration_minutes > 0
    ),
  constraint editions_cover_url_not_blank
    check (
      cover_url is null
      or pg_catalog.btrim(cover_url) <> ''
    ),
  constraint editions_cover_storage_key_not_blank
    check (
      cover_storage_key is null
      or pg_catalog.btrim(cover_storage_key) <> ''
    ),
  constraint editions_at_most_one_cover_source
    check (cover_url is null or cover_storage_key is null)
);

create index editions_work_id_idx
on public.editions (work_id);

create index editions_publisher_id_idx
on public.editions (publisher_id);

create index editions_created_by_profile_id_idx
on public.editions (created_by_profile_id);

create index editions_publication_date_idx
on public.editions (publication_date);

create trigger normalize_and_validate_editions_isbn
before insert or update of isbn10, isbn13 on public.editions
for each row
execute function private.normalize_and_validate_edition_isbn();

create trigger set_editions_updated_at
before update on public.editions
for each row
execute function private.set_updated_at();

alter table public.publishers enable row level security;
alter table public.editions enable row level security;

revoke all on table public.publishers from public, anon, authenticated;
revoke all on table public.editions from public, anon, authenticated;

grant select on table public.publishers to authenticated;
grant insert (name) on table public.publishers to authenticated;
grant update (name) on table public.publishers to authenticated;
grant delete on table public.publishers to authenticated;

grant select on table public.editions to authenticated;
grant insert (
  work_id,
  publisher_id,
  edition_title,
  subtitle,
  isbn10,
  isbn13,
  publication_date,
  publication_date_precision,
  language_code,
  format,
  page_count,
  audio_duration_minutes,
  cover_url,
  cover_storage_key
) on table public.editions to authenticated;
grant update (
  publisher_id,
  edition_title,
  subtitle,
  isbn10,
  isbn13,
  publication_date,
  publication_date_precision,
  language_code,
  format,
  page_count,
  audio_duration_minutes,
  cover_url,
  cover_storage_key
) on table public.editions to authenticated;
grant delete on table public.editions to authenticated;

create policy "Authenticated users can read publishers"
on public.publishers
for select
to authenticated
using (true);

create policy "Authenticated users can create publishers as themselves"
on public.publishers
for insert
to authenticated
with check (created_by_profile_id = (select auth.uid()));

create policy "Creators can update their publishers"
on public.publishers
for update
to authenticated
using (created_by_profile_id = (select auth.uid()))
with check (created_by_profile_id = (select auth.uid()));

create policy "Creators can delete their publishers"
on public.publishers
for delete
to authenticated
using (created_by_profile_id = (select auth.uid()));

create policy "Authenticated users can read editions"
on public.editions
for select
to authenticated
using (true);

create policy "Authenticated users can create editions as themselves"
on public.editions
for insert
to authenticated
with check (created_by_profile_id = (select auth.uid()));

create policy "Creators can update their editions"
on public.editions
for update
to authenticated
using (created_by_profile_id = (select auth.uid()))
with check (created_by_profile_id = (select auth.uid()));

create policy "Creators can delete their editions"
on public.editions
for delete
to authenticated
using (created_by_profile_id = (select auth.uid()));
