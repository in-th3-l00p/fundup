create table if not exists public.profiles (
  wallet_address text primary key,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "public can read profiles"
on public.profiles for select
to anon
using (true);

create policy "anon can insert profiles"
on public.profiles for insert
to anon
with check (true);

create policy "anon can update profiles"
on public.profiles for update
to anon
using (true)
with check (true);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_profiles_updated_at on public.profiles;
create trigger trg_set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();


