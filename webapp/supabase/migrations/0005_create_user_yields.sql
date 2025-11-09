create table if not exists public.user_yields (
  wallet_address text primary key references public.profiles(wallet_address) on delete cascade,
  yield_amount_usd numeric not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_yields enable row level security;

drop policy if exists "public can read user_yields" on public.user_yields;
create policy "public can read user_yields"
on public.user_yields for select to anon using (true);

drop policy if exists "anon can upsert user_yields" on public.user_yields;
create policy "anon can upsert user_yields"
on public.user_yields for insert to anon with check (true);

drop policy if exists "anon can update user_yields" on public.user_yields;
create policy "anon can update user_yields"
on public.user_yields for update to anon using (true) with check (true);

create or replace function public.set_user_yields_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_user_yields_updated_at on public.user_yields;
create trigger trg_set_user_yields_updated_at
before update on public.user_yields
for each row execute function public.set_user_yields_updated_at();


