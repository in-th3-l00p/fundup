create table if not exists public.projects (
  id bigint primary key generated always as identity,
  owner_wallet_address text not null,
  name text not null,
  description_md text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_projects_owner foreign key (owner_wallet_address)
    references public.profiles(wallet_address)
    on delete cascade
);

create index if not exists idx_projects_owner on public.projects(owner_wallet_address);
create index if not exists idx_projects_created_at on public.projects(created_at);

alter table public.projects enable row level security;

-- public can read all projects
drop policy if exists "public can read projects" on public.projects;
create policy "public can read projects"
on public.projects for select to anon using (true);

-- hackathon-speed: allow anon insert/update/delete (replace with proper auth later)
drop policy if exists "anon can insert projects" on public.projects;
create policy "anon can insert projects"
on public.projects for insert to anon with check (true);

drop policy if exists "anon can update projects" on public.projects;
create policy "anon can update projects"
on public.projects for update to anon using (true) with check (true);

drop policy if exists "anon can delete projects" on public.projects;
create policy "anon can delete projects"
on public.projects for delete to anon using (true);

create or replace function public.set_projects_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_projects_updated_at on public.projects;
create trigger trg_set_projects_updated_at
before update on public.projects
for each row execute function public.set_projects_updated_at();


