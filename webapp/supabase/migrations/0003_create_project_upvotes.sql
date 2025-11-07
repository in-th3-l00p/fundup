create table if not exists public.project_upvotes (
  id bigint primary key generated always as identity,
  project_id bigint not null references public.projects(id) on delete cascade,
  voter_wallet_address text not null references public.profiles(wallet_address) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uq_project_voter unique (project_id, voter_wallet_address)
);

create index if not exists idx_project_upvotes_project on public.project_upvotes(project_id);
create index if not exists idx_project_upvotes_voter on public.project_upvotes(voter_wallet_address);

alter table public.project_upvotes enable row level security;

drop policy if exists "public can read project_upvotes" on public.project_upvotes;
create policy "public can read project_upvotes"
on public.project_upvotes for select to anon using (true);

drop policy if exists "anon can insert project_upvotes" on public.project_upvotes;
create policy "anon can insert project_upvotes"
on public.project_upvotes for insert to anon with check (true);

drop policy if exists "anon can delete project_upvotes" on public.project_upvotes;
create policy "anon can delete project_upvotes"
on public.project_upvotes for delete to anon using (true);
