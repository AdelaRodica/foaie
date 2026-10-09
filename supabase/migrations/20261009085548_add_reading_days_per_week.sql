alter table public.profiles
add column reading_days_per_week smallint not null default 1
  constraint profiles_reading_days_per_week_valid
  check (reading_days_per_week between 1 and 7);

grant update (reading_days_per_week)
on table public.profiles
to authenticated;
