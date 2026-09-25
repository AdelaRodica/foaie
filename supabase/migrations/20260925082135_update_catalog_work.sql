create function public.update_catalog_work(
  p_work_id uuid,
  p_work jsonb,
  p_author_relations jsonb,
  p_genre_relations jsonb,
  p_series_relations jsonb
)
returns table (
  work_id uuid
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_work_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authenticated identity required.'
      using errcode = '42501';
  end if;

  if p_work is null
    or pg_catalog.jsonb_typeof(p_work) is distinct from 'object'
    or p_author_relations is null
    or pg_catalog.jsonb_typeof(p_author_relations) is distinct from 'array'
    or p_genre_relations is null
    or pg_catalog.jsonb_typeof(p_genre_relations) is distinct from 'array'
    or p_series_relations is null
    or pg_catalog.jsonb_typeof(p_series_relations) is distinct from 'array'
  then
    raise exception 'Invalid catalog work payload shape.'
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
    cross join lateral pg_catalog.jsonb_object_keys(relation.value)
      as relation_key(key_name)
    where not (key_name = any (array['author_id', 'position']))
  ) then
    raise exception 'Unknown author relation key.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_genre_relations) as relation(value)
    cross join lateral pg_catalog.jsonb_object_keys(relation.value)
      as relation_key(key_name)
    where not (key_name = any (array['genre_id', 'is_primary']))
  ) then
    raise exception 'Unknown genre relation key.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_series_relations) as relation(value)
    cross join lateral pg_catalog.jsonb_object_keys(relation.value)
      as relation_key(key_name)
    where not (
      key_name = any (array['series_id', 'position', 'position_label'])
    )
  ) then
    raise exception 'Unknown series relation key.'
      using errcode = '22023';
  end if;

  update public.works as work
  set
    title = p_work ->> 'title',
    original_title = p_work ->> 'original_title',
    description = p_work ->> 'description',
    original_publication_year =
      (p_work ->> 'original_publication_year')::integer,
    original_language_code = p_work ->> 'original_language_code'
  where work.id = p_work_id
  returning work.id into v_work_id;

  if v_work_id is null then
    return;
  end if;

  delete from public.work_authors as relation
  where relation.work_id = v_work_id;

  delete from public.work_genres as relation
  where relation.work_id = v_work_id;

  delete from public.work_series as relation
  where relation.work_id = v_work_id;

  insert into public.work_authors (work_id, author_id, position)
  select v_work_id, relation.author_id, relation.position
  from pg_catalog.jsonb_to_recordset(p_author_relations)
    as relation(author_id uuid, position smallint);

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

  return query
  select v_work_id;
end;
$$;

revoke execute on function public.update_catalog_work(
  uuid, jsonb, jsonb, jsonb, jsonb
) from public;

revoke execute on function public.update_catalog_work(
  uuid, jsonb, jsonb, jsonb, jsonb
) from anon;

revoke execute on function public.update_catalog_work(
  uuid, jsonb, jsonb, jsonb, jsonb
) from authenticated;

grant execute on function public.update_catalog_work(
  uuid, jsonb, jsonb, jsonb, jsonb
) to authenticated;
