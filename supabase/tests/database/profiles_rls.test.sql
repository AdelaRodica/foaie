begin;

select plan(11);

do $$
declare
  user_a_id uuid;
  user_b_id uuid;
begin
  select id
  into strict user_a_id
  from auth.users
  where email = 'foaie.test.a@example.com';

  select id
  into strict user_b_id
  from auth.users
  where email = 'foaie.test.b@example.com';

  perform pg_catalog.set_config('foaie.test_user_a_id', user_a_id::text, true);
  perform pg_catalog.set_config('foaie.test_user_b_id', user_b_id::text, true);
end;
$$;

select pg_catalog.set_config(
  'request.jwt.claims',
  pg_catalog.json_build_object(
    'sub', pg_catalog.current_setting('foaie.test_user_a_id'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.profiles
    where id = pg_catalog.current_setting('foaie.test_user_a_id')::uuid
  ),
  1::bigint,
  'User A can read their own profile'
);

select is(
  (
    select count(*)
    from public.profiles
    where id = pg_catalog.current_setting('foaie.test_user_b_id')::uuid
  ),
  0::bigint,
  'User A cannot read user B profile'
);

select is(
  (
    with updated_profile as (
      update public.profiles
      set display_name = 'RLS test user A'
      where id = pg_catalog.current_setting('foaie.test_user_a_id')::uuid
      returning id
    )
    select count(*) from updated_profile
  ),
  1::bigint,
  'User A can update an allowed column on their own profile'
);

select is(
  (
    with updated_profile as (
      update public.profiles
      set display_name = 'RLS test user B'
      where id = pg_catalog.current_setting('foaie.test_user_b_id')::uuid
      returning id
    )
    select count(*) from updated_profile
  ),
  0::bigint,
  'User A cannot update user B profile'
);

select throws_ok(
  $$
    update public.profiles
    set status = 'SUSPENDED'
    where id = pg_catalog.current_setting('foaie.test_user_a_id')::uuid
  $$,
  '42501',
  null,
  'User A cannot update status'
);

select throws_ok(
  $$
    update public.profiles
    set id = pg_catalog.current_setting('foaie.test_user_b_id')::uuid
    where id = pg_catalog.current_setting('foaie.test_user_a_id')::uuid
  $$,
  '42501',
  null,
  'User A cannot update profile id'
);

select throws_ok(
  $$
    insert into public.profiles (id)
    values (pg_catalog.current_setting('foaie.test_user_a_id')::uuid)
  $$,
  '42501',
  null,
  'User A cannot insert profiles'
);

select throws_ok(
  $$
    delete from public.profiles
    where id = pg_catalog.current_setting('foaie.test_user_a_id')::uuid
  $$,
  '42501',
  null,
  'User A cannot delete profiles'
);

reset role;

select pg_catalog.set_config(
  'request.jwt.claims',
  pg_catalog.json_build_object(
    'sub', pg_catalog.current_setting('foaie.test_user_b_id'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.profiles
    where id = pg_catalog.current_setting('foaie.test_user_b_id')::uuid
  ),
  1::bigint,
  'User B can read their own profile'
);

select is(
  (
    select count(*)
    from public.profiles
    where id = pg_catalog.current_setting('foaie.test_user_a_id')::uuid
  ),
  0::bigint,
  'User B cannot read user A profile'
);

reset role;

select pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"anon"}',
  true
);
set local role anon;

select throws_ok(
  'select * from public.profiles',
  '42501',
  null,
  'Anonymous users cannot read profiles'
);

reset role;

select * from finish();

rollback;
