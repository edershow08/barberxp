-- BarberXP v33: módulo Espírito de Equipe
create table if not exists public.team_recognitions (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('ajuda','tecnica','horario','orientacao','motivacao')),
  message text not null check (char_length(message) between 8 and 240),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint team_recognitions_no_self check (sender_id <> recipient_id)
);

create unique index if not exists team_recognitions_one_per_day
on public.team_recognitions (
  sender_id,
  recipient_id,
  ((created_at at time zone 'America/Sao_Paulo')::date)
);

create index if not exists team_recognitions_status_created_idx
on public.team_recognitions (status, created_at desc);

alter table public.team_recognitions enable row level security;

drop policy if exists "recognitions_read" on public.team_recognitions;
create policy "recognitions_read" on public.team_recognitions
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active = true
  )
);

drop policy if exists "recognitions_create" on public.team_recognitions;
create policy "recognitions_create" on public.team_recognitions
for insert to authenticated
with check (
  sender_id = auth.uid()
  and sender_id <> recipient_id
  and status = 'pending'
  and reviewed_by is null
  and exists (
    select 1 from public.profiles recipient
    where recipient.id = recipient_id
      and recipient.role in ('barber','leader')
      and recipient.active = true
  )
);

drop policy if exists "recognitions_review" on public.team_recognitions;
create policy "recognitions_review" on public.team_recognitions
for update to authenticated
using (
  exists (
    select 1 from public.profiles manager
    where manager.id = auth.uid()
      and manager.active = true
      and manager.role in ('leader','manager')
  )
)
with check (
  exists (
    select 1 from public.profiles manager
    where manager.id = auth.uid()
      and manager.active = true
      and manager.role in ('leader','manager')
  )
);

grant select, insert, update on public.team_recognitions to authenticated;
notify pgrst, 'reload schema';
