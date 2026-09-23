create function public.create_catalog_entry(
  p_work jsonb,
  p_author_relations jsonb,
  p_genre_relations jsonb,
  p_series_relations jsonb,
  p_edition jsonb
)
returns table (
  work_id uuid,
  edition_id uuid
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_work_id uuid;
  v_edition_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authenticated identity required.'
      using errcode = '42501';
  end if;

  if p_work is null
    or pg_catalog.jsonb_typeof(p_work) is distinct from 'object'
    or p_edition is null
    or pg_catalog.jsonb_typeof(p_edition) is distinct from 'object'
    or p_author_relations is null
    or pg_catalog.jsonb_typeof(p_author_relations) is distinct from 'array'
    or p_genre_relations is null
    or pg_catalog.jsonb_typeof(p_genre_relations) is distinct from 'array'
    or p_series_relations is null
    or pg_catalog.jsonb_typeof(p_series_relations) is distinct from 'array'
  then
    raise exception 'Invalid catalog entry payload shape.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_object_keys(p_work) as work_key(key_name)
    where not (key_name = any (array[
      'title',
      'original_title',
      'description',
      'original_publication_year',
      'original_language_code'
    ]))
  ) then
    raise exception 'Unknown work payload key.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_object_keys(p_edition) as edition_key(key_name)
    where not (key_name = any (array[
      'publisher_id',
      'edition_title',
      'subtitle',
      'isbn10',
      'isbn13',
      'publication_date',
      'publication_date_precision',
      'language_code',
      'format',
      'page_count',
      'audio_duration_minutes',
      'cover_url',
      'cover_storage_key'
    ]))
  ) then
    raise exception 'Unknown edition payload key.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_author_relations) as relation(value)
    where pg_catalog.jsonb_typeof(value) is distinct from 'object'
  ) or exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_genre_relations) as relation(value)
    where pg_catalog.jsonb_typeof(value) is distinct from 'object'
  ) or exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_series_relations) as relation(value)
    where pg_catalog.jsonb_typeof(value) is distinct from 'object'
  ) then
    raise exception 'Catalog relations must contain objects.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_author_relations) as relation(value)
    cross join lateral pg_catalog.jsonb_object_keys(relation.value) as relation_key(key_name)
    where not (key_name = any (array['author_id', 'position']))
  ) then
    raise exception 'Unknown author relation key.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_genre_relations) as relation(value)
    cross join lateral pg_catalog.jsonb_object_keys(relation.value) as relation_key(key_name)
    where not (key_name = any (array['genre_id', 'is_primary']))
  ) then
    raise exception 'Unknown genre relation key.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_series_relations) as relation(value)
    cross join lateral pg_catalog.jsonb_object_keys(relation.value) as relation_key(key_name)
    where not (key_name = any (array['series_id', 'position', 'position_label']))
  ) then
    raise exception 'Unknown series relation key.'
      using errcode = '22023';
  end if;

  insert into public.works (
    title,
    original_title,
    description,
    original_publication_year,
    original_language_code
  ) values (
    p_work ->> 'title',
    p_work ->> 'original_title',
    p_work ->> 'description',
    (p_work ->> 'original_publication_year')::integer,
    p_work ->> 'original_language_code'
  )
  returning id into v_work_id;

  insert into public.work_authors (work_id, author_id, position)
  select v_work_id, relation.author_id, relation.position
  from pg_catalog.jsonb_to_recordset(p_author_relations)
    as relation(author_id uuid, position integer);

  insert into public.work_genres (work_id, genre_id, is_primary)
  select v_work_id, relation.genre_id, relation.is_primary
  from pg_catalog.jsonb_to_recordset(p_genre_relations)
    as relation(genre_id uuid, is_primary boolean);

  insert into public.work_series (
    work_id,
    series_id,
    position,
    position_label
  )
  select
    v_work_id,
    relation.series_id,
    relation.position,
    relation.position_label
  from pg_catalog.jsonb_to_recordset(p_series_relations)
    as relation(
      series_id uuid,
      position numeric(8,3),
      position_label varchar(60)
    );

  insert into public.editions (
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
  ) values (
    v_work_id,
    (p_edition ->> 'publisher_id')::uuid,
    p_edition ->> 'edition_title',
    p_edition ->> 'subtitle',
    p_edition ->> 'isbn10',
    p_edition ->> 'isbn13',
    (p_edition ->> 'publication_date')::date,
    p_edition ->> 'publication_date_precision',
    p_edition ->> 'language_code',
    p_edition ->> 'format',
    (p_edition ->> 'page_count')::integer,
    (p_edition ->> 'audio_duration_minutes')::integer,
    p_edition ->> 'cover_url',
    p_edition ->> 'cover_storage_key'
  )
  returning id into v_edition_id;

  return query
  select v_work_id, v_edition_id;
end;
$$;

revoke execute on function public.create_catalog_entry(
  jsonb, jsonb, jsonb, jsonb, jsonb
) from public;

revoke execute on function public.create_catalog_entry(
  jsonb, jsonb, jsonb, jsonb, jsonb
) from anon;

revoke execute on function public.create_catalog_entry(
  jsonb, jsonb, jsonb, jsonb, jsonb
) from authenticated;

grant execute on function public.create_catalog_entry(
  jsonb, jsonb, jsonb, jsonb, jsonb
) to authenticated;
