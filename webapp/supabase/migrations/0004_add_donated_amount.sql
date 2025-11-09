alter table if exists public.projects
  add column if not exists donated_amount_usd numeric not null default 0;

-- allow anon to update donated_amount_usd (already covered by broad update policy)


