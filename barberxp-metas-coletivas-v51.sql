-- BarberXP v51 — meta coletiva mensal da equipe

create table if not exists public.team_goals (
  month_key text primary key check (month_key ~ '^\d{4}-\d{2}$'),
  products_target integer not null default 38 check (products_target >= 0),
  subscriptions_target integer not null default 20 check (subscriptions_target >= 0),
  reward_name text not null default 'Pizza para toda a equipe',
  active boolean not null default true,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

alter table public.team_goals enable row level security;

drop policy if exists team_goals_read on public.team_goals;
create policy team_goals_read on public.team_goals
for select to authenticated using (true);

drop policy if exists team_goals_owner on public.team_goals;
create policy team_goals_owner on public.team_goals
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'leader'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'leader'
  )
);

grant select, insert, update, delete on public.team_goals to authenticated;

insert into public.team_goals (
  month_key,
  products_target,
  subscriptions_target,
  reward_name
)
values (
  to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM'),
  38,
  20,
  'Pizza para toda a equipe'
)
on conflict (month_key) do nothing;

-- Um profissional sem histórico e que não esteja marcado como iniciante
-- recebe a média da equipe como base, evitando uma primeira meta fácil demais.
create or replace function public.ensure_current_weekly_challenges()
returns void language plpgsql security definer set search_path=public as $$
declare
  v_week date := public.barberxp_week_start();
  v_mode text;
  v_focus text;
  v_member record;
  v_avg numeric;
  v_easy integer;
  v_medium integer;
  v_hard integer;
  v_progress integer;
begin
  select focus_mode into v_mode from public.game_strategy where id=1;
  v_mode := coalesce(v_mode,'auto');
  if v_mode <> 'auto' then v_focus := v_mode;
  else
    v_focus := case (extract(week from v_week)::integer % 4)
      when 0 then 'produtos' when 1 then 'extras'
      when 2 then 'produtos' else 'assinaturas' end;
  end if;

  for v_member in
    select p.id,coalesce(m.development,false) development
    from public.profiles p
    left join public.member_game_settings m on m.user_id=p.id
    where p.active=true and p.role in ('leader','barber')
  loop
    select count(*)::numeric/4 into v_avg
    from public.barber_actions a
    where a.user_id=v_member.id and a.status='approved' and a.action_key=v_focus
      and a.created_at >= (v_week-28)::timestamptz and a.created_at < v_week::timestamptz;
    v_avg := coalesce(v_avg,0);

    if v_avg=0 and not v_member.development then
      select coalesce(avg(person_weekly),0) into v_avg
      from (
        select count(*)::numeric/4 as person_weekly
        from public.barber_actions a
        join public.profiles p on p.id=a.user_id
        left join public.member_game_settings m on m.user_id=p.id
        where p.active=true and p.role in ('leader','barber')
          and coalesce(m.development,false)=false
          and a.status='approved' and a.action_key=v_focus
          and a.created_at >= (v_week-28)::timestamptz and a.created_at < v_week::timestamptz
        group by a.user_id
      ) experienced;
    end if;

    if v_focus='extras' then
      v_easy:=greatest(2,ceil(v_avg*(case when v_member.development then .65 else .85 end))::int);
      v_medium:=greatest(v_easy+1,ceil(v_avg*(case when v_member.development then .9 else 1.10 end))::int);
      v_hard:=greatest(v_medium+1,ceil(v_avg*(case when v_member.development then 1.15 else 1.40 end))::int);
    elsif v_focus='produtos' then
      v_easy:=greatest(1,ceil(v_avg*(case when v_member.development then .65 else .85 end))::int);
      v_medium:=greatest(v_easy+1,ceil(v_avg*(case when v_member.development then .9 else 1.10 end))::int);
      v_hard:=greatest(v_medium+1,ceil(v_avg*(case when v_member.development then 1.15 else 1.40 end))::int);
    else
      v_easy:=greatest(1,ceil(v_avg*.8)::int);
      v_medium:=greatest(v_easy,ceil(v_avg*1.10)::int);
      v_hard:=greatest(v_medium+1,ceil(v_avg*1.40)::int);
    end if;

    select count(*) into v_progress from public.barber_actions a
    where a.user_id=v_member.id and a.status='approved' and a.action_key=v_focus
      and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week and v_week+6;

    insert into public.weekly_challenges(week_start,user_id,focus_key,easy_target,medium_target,hard_target,progress,development)
      values(v_week,v_member.id,v_focus,v_easy,v_medium,v_hard,v_progress,v_member.development)
    on conflict(week_start,user_id) do nothing;
  end loop;
end $$;

grant execute on function public.ensure_current_weekly_challenges() to authenticated;

notify pgrst, 'reload schema';
