create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create table public.works (
  id uuid primary key default gen_random_uuid(),
  title varchar(300) not null,
  normalized_title varchar(300)
    generated always as (
      pg_catalog.lower(
        pg_catalog.btrim(
          pg_catalog.regexp_replace(
            title,
            '[[:space:]]+',
            ' ',
            'g'
          )
        )
      )
    ) stored,
  original_title varchar(300),
  description text,
  original_publication_year smallint,
  original_language_code varchar(35),
  created_by_profile_id uuid default auth.uid()
    references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint works_title_not_blank
    check (pg_catalog.btrim(title) <> ''),
  constraint works_original_title_not_blank
    check (
      original_title is null
      or pg_catalog.btrim(original_title) <> ''
    ),
  constraint works_original_publication_year_valid
    check (
      original_publication_year is null
      or (
        original_publication_year between -5000 and 3000
        and original_publication_year <> 0
      )
    ),
  constraint works_original_language_code_not_blank
    check (
      original_language_code is null
      or pg_catalog.btrim(original_language_code) <> ''
    )
);

create index works_normalized_title_idx
on public.works (normalized_title);

create index works_created_by_profile_id_idx
on public.works (created_by_profile_id);

create trigger set_works_updated_at
before update on public.works
for each row
execute function private.set_updated_at();

create table public.authors (
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
  sort_name varchar(200),
  created_by_profile_id uuid default auth.uid()
    references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authors_name_not_blank
    check (pg_catalog.btrim(name) <> ''),
  constraint authors_sort_name_not_blank
    check (
      sort_name is null
      or pg_catalog.btrim(sort_name) <> ''
    )
);

create index authors_normalized_name_idx
on public.authors (normalized_name);

create index authors_created_by_profile_id_idx
on public.authors (created_by_profile_id);

create trigger set_authors_updated_at
before update on public.authors
for each row
execute function private.set_updated_at();

-- A work may temporarily have no author while a future transactional CRUD
-- operation is in progress. The completed-work invariant belongs to that RPC.
create table public.work_authors (
  work_id uuid not null
    references public.works (id) on delete cascade,
  author_id uuid not null
    references public.authors (id) on delete restrict,
  position smallint not null,
  primary key (work_id, author_id),
  constraint work_authors_position_positive
    check (position > 0),
  constraint work_authors_work_position_unique
    unique (work_id, position)
    deferrable initially immediate
);

create index work_authors_author_id_idx
on public.work_authors (author_id);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  slug varchar(140) not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint genres_name_not_blank
    check (pg_catalog.btrim(name) <> ''),
  constraint genres_slug_not_blank
    check (pg_catalog.btrim(slug) <> '')
);

create trigger set_genres_updated_at
before update on public.genres
for each row
execute function private.set_updated_at();

create table public.work_genres (
  work_id uuid not null
    references public.works (id) on delete cascade,
  genre_id uuid not null
    references public.genres (id) on delete restrict,
  is_primary boolean not null default false,
  primary key (work_id, genre_id)
);

create index work_genres_genre_id_idx
on public.work_genres (genre_id);

create unique index work_genres_one_primary_per_work_idx
on public.work_genres (work_id)
where is_primary;

alter table public.works enable row level security;
alter table public.authors enable row level security;
alter table public.work_authors enable row level security;
alter table public.genres enable row level security;
alter table public.work_genres enable row level security;

revoke all on table public.works from public, anon, authenticated;
revoke all on table public.authors from public, anon, authenticated;
revoke all on table public.work_authors from public, anon, authenticated;
revoke all on table public.genres from public, anon, authenticated;
revoke all on table public.work_genres from public, anon, authenticated;

grant select on table public.works to authenticated;
grant insert (
  title,
  original_title,
  description,
  original_publication_year,
  original_language_code
) on table public.works to authenticated;
grant update (
  title,
  original_title,
  description,
  original_publication_year,
  original_language_code
) on table public.works to authenticated;
grant delete on table public.works to authenticated;

grant select on table public.authors to authenticated;
grant insert (
  name,
  sort_name
) on table public.authors to authenticated;
grant update (
  name,
  sort_name
) on table public.authors to authenticated;
grant delete on table public.authors to authenticated;

grant select on table public.work_authors to authenticated;
grant insert (
  work_id,
  author_id,
  position
) on table public.work_authors to authenticated;
grant update (position) on table public.work_authors to authenticated;
grant delete on table public.work_authors to authenticated;

grant select on table public.genres to authenticated;

grant select on table public.work_genres to authenticated;
grant insert (
  work_id,
  genre_id,
  is_primary
) on table public.work_genres to authenticated;
grant update (is_primary) on table public.work_genres to authenticated;
grant delete on table public.work_genres to authenticated;

create policy "Authenticated users can read works"
on public.works
for select
to authenticated
using (true);

create policy "Authenticated users can create works as themselves"
on public.works
for insert
to authenticated
with check (created_by_profile_id = (select auth.uid()));

create policy "Creators can update their works"
on public.works
for update
to authenticated
using (created_by_profile_id = (select auth.uid()))
with check (created_by_profile_id = (select auth.uid()));

create policy "Creators can delete their works"
on public.works
for delete
to authenticated
using (created_by_profile_id = (select auth.uid()));

create policy "Authenticated users can read authors"
on public.authors
for select
to authenticated
using (true);

create policy "Authenticated users can create authors as themselves"
on public.authors
for insert
to authenticated
with check (created_by_profile_id = (select auth.uid()));

create policy "Creators can update their authors"
on public.authors
for update
to authenticated
using (created_by_profile_id = (select auth.uid()))
with check (created_by_profile_id = (select auth.uid()));

create policy "Creators can delete their authors"
on public.authors
for delete
to authenticated
using (created_by_profile_id = (select auth.uid()));

create policy "Authenticated users can read work authors"
on public.work_authors
for select
to authenticated
using (true);

create policy "Creators can add authors to their works"
on public.work_authors
for insert
to authenticated
with check (
  exists (
    select 1
    from public.works as work
    where work.id = work_authors.work_id
      and work.created_by_profile_id = (select auth.uid())
  )
);

create policy "Creators can update authors on their works"
on public.work_authors
for update
to authenticated
using (
  exists (
    select 1
    from public.works as work
    where work.id = work_authors.work_id
      and work.created_by_profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.works as work
    where work.id = work_authors.work_id
      and work.created_by_profile_id = (select auth.uid())
  )
);

create policy "Creators can remove authors from their works"
on public.work_authors
for delete
to authenticated
using (
  exists (
    select 1
    from public.works as work
    where work.id = work_authors.work_id
      and work.created_by_profile_id = (select auth.uid())
  )
);

create policy "Authenticated users can read genres"
on public.genres
for select
to authenticated
using (true);

create policy "Authenticated users can read work genres"
on public.work_genres
for select
to authenticated
using (true);

create policy "Creators can add genres to their works"
on public.work_genres
for insert
to authenticated
with check (
  exists (
    select 1
    from public.works as work
    where work.id = work_genres.work_id
      and work.created_by_profile_id = (select auth.uid())
  )
);

create policy "Creators can update genres on their works"
on public.work_genres
for update
to authenticated
using (
  exists (
    select 1
    from public.works as work
    where work.id = work_genres.work_id
      and work.created_by_profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.works as work
    where work.id = work_genres.work_id
      and work.created_by_profile_id = (select auth.uid())
  )
);

create policy "Creators can remove genres from their works"
on public.work_genres
for delete
to authenticated
using (
  exists (
    select 1
    from public.works as work
    where work.id = work_genres.work_id
      and work.created_by_profile_id = (select auth.uid())
  )
);
