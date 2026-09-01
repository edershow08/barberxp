-- BarberXP v52 — divisão manual mensal do Clube

create table if not exists public.club_divisions (
  month_key text primary key check (month_key ~ '^\d{4}-\d{2}$'),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  shop_percentage numeric(5,2) not null default 50 check (shop_percentage >= 0 and shop_percentage <= 100),
  team_percentage numeric(5,2) not null default 50 check (team_percentage >= 0 and team_percentage <= 100),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  check (shop_percentage + team_percentage = 100)
);

create table if not exists public.club_division_members (
  month_key text not null references public.club_divisions(month_key) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  production_percentage numeric(6,2) not null default 0 check (production_percentage >= 0 and production_percentage <= 100),
  calculated_amount numeric(12,2) not null default 0 check (calculated_amount >= 0),
  updated_at timestamptz not null default now(),
  primary key (month_key,user_id)
);

alter table public.club_divisions enable row level security;
alter table public.club_division_members enable row level security;

drop policy if exists club_divisions_owner on public.club_divisions;
create policy club_divisions_owner on public.club_divisions
for all to authenticated
using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='leader')
)
with check (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='leader')
);

drop policy if exists club_division_members_owner on public.club_division_members;
create policy club_division_members_owner on public.club_division_members
for all to authenticated
using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='leader')
)
with check (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='leader')
);

grant select,insert,update,delete on public.club_divisions,public.club_division_members to authenticated;

notify pgrst, 'reload schema';
