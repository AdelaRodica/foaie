create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name varchar(80),
  timezone varchar(64) not null default 'UTC',
  locale varchar(10) not null default 'es-ES',
  theme varchar(10) not null default 'SYSTEM',
  status varchar(20) not null default 'ACTIVE',
  week_starts_on smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank
    check (display_name is null or pg_catalog.btrim(display_name) <> ''),
  constraint profiles_timezone_not_blank
    check (pg_catalog.btrim(timezone) <> ''),
  constraint profiles_locale_not_blank
    check (pg_catalog.btrim(locale) <> ''),
  constraint profiles_theme_valid
    check (theme in ('SYSTEM', 'LIGHT', 'DARK')),
  constraint profiles_status_valid
    check (status in ('ACTIVE', 'SUSPENDED', 'DELETION_PENDING')),
  constraint profiles_week_starts_on_valid
    check (week_starts_on between 0 and 6)
);

create function private.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.set_profile_updated_at() from public, anon, authenticated;

create trigger set_profile_updated_at
before update on public.profiles
for each row
execute function private.set_profile_updated_at();

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

create trigger create_profile_after_auth_user
after insert on auth.users
for each row
execute function private.handle_new_auth_user();

alter table public.profiles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (
  display_name,
  timezone,
  locale,
  theme,
  week_starts_on
) on table public.profiles to authenticated;

create policy "Authenticated users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Authenticated users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
