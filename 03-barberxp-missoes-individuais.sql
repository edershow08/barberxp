-- BarberXP v53 — cinco missões semanais individuais

create table if not exists public.personal_weekly_sets (
  week_start date not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_level text not null default 'normal' check (week_level in ('fraca','normal','forte')),
  completion_bonus integer not null default 5 check (completion_bonus >= 0),
  completion_awarded boolean not null default false,
  development boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (week_start,user_id)
);

create table if not exists public.personal_weekly_missions (
  week_start date not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_key text not null check (mission_key in ('atendimentos','ritmo','extras','produtos','assinaturas')),
  target integer not null check (target > 0),
  progress integer not null default 0 check (progress >= 0),
  bonus_points integer not null default 0 check (bonus_points >= 0),
  awarded boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (week_start,user_id,mission_key),
  foreign key (week_start,user_id) references public.personal_weekly_sets(week_start,user_id) on delete cascade
);

alter table public.personal_weekly_sets enable row level security;
alter table public.personal_weekly_missions enable row level security;

drop policy if exists personal_weekly_sets_read on public.personal_weekly_sets;
create policy personal_weekly_sets_read on public.personal_weekly_sets
for select to authenticated using (
  user_id=auth.uid() or exists (
    select 1 from public.profiles p where p.id=auth.uid() and p.role in ('leader','manager')
  )
);

drop policy if exists personal_weekly_missions_read on public.personal_weekly_missions;
create policy personal_weekly_missions_read on public.personal_weekly_missions
for select to authenticated using (
  user_id=auth.uid() or exists (
    select 1 from public.profiles p where p.id=auth.uid() and p.role in ('leader','manager')
  )
);

grant select on public.personal_weekly_sets,public.personal_weekly_missions to authenticated;

create or replace function public.ensure_personal_weekly_missions()
returns void language plpgsql security definer set search_path=public as $$
declare
  v_week date := public.barberxp_week_start();
  v_member record;
  v_key text;
  v_avg numeric;
  v_team_avg numeric;
  v_team_last numeric;
  v_team_base numeric;
  v_level text;
  v_factor numeric;
  v_target integer;
  v_progress integer;
  v_bonus integer;
  v_minimum integer;
  v_people integer;
begin
  select count(*) into v_people from public.profiles
  where active=true and role in ('leader','barber');

  select count(*)::numeric into v_team_last
  from public.barber_actions a
  join public.profiles p on p.id=a.user_id
  where p.active=true and p.role in ('leader','barber') and a.status='approved'
    and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week-7 and v_week-1;

  select count(*)::numeric/4 into v_team_base
  from public.barber_actions a
  join public.profiles p on p.id=a.user_id
  where p.active=true and p.role in ('leader','barber') and a.status='approved'
    and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week-35 and v_week-8;

  v_level:=case
    when coalesce(v_team_base,0)=0 then 'normal'
    when v_team_last < v_team_base*.85 then 'fraca'
    when v_team_last > v_team_base*1.15 then 'forte'
    else 'normal' end;

  for v_member in
    select p.id,coalesce(m.development,false) development
    from public.profiles p
    left join public.member_game_settings m on m.user_id=p.id
    where p.active=true and p.role in ('leader','barber')
  loop
    insert into public.personal_weekly_sets(week_start,user_id,week_level,completion_bonus,development)
    values(v_week,v_member.id,v_level,5,v_member.development)
    on conflict(week_start,user_id) do nothing;

    foreach v_key in array array['atendimentos','ritmo','extras','produtos','assinaturas'] loop
      if v_key='ritmo' then
        select count(distinct (a.created_at at time zone 'America/Sao_Paulo')::date)::numeric/4 into v_avg
        from public.barber_actions a
        where a.user_id=v_member.id and a.status='approved'
          and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week-28 and v_week-1;
      elsif v_key='atendimentos' then
        select count(*)::numeric/4 into v_avg from public.barber_actions a
        where a.user_id=v_member.id and a.status='approved' and a.action_key in ('cortes','barbas')
          and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week-28 and v_week-1;
      else
        select count(*)::numeric/4 into v_avg from public.barber_actions a
        where a.user_id=v_member.id and a.status='approved' and a.action_key=v_key
          and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week-28 and v_week-1;
      end if;
      v_avg:=coalesce(v_avg,0);

      if v_avg=0 and not v_member.development and v_people>0 then
        if v_key='ritmo' then
          select count(distinct (a.created_at at time zone 'America/Sao_Paulo')::date)::numeric/greatest(1,v_people*4) into v_team_avg
          from public.barber_actions a join public.profiles p on p.id=a.user_id
          where p.active=true and p.role in ('leader','barber') and a.status='approved'
            and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week-28 and v_week-1;
        elsif v_key='atendimentos' then
          select count(*)::numeric/greatest(1,v_people*4) into v_team_avg
          from public.barber_actions a join public.profiles p on p.id=a.user_id
          where p.active=true and p.role in ('leader','barber') and a.status='approved'
            and a.action_key in ('cortes','barbas')
            and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week-28 and v_week-1;
        else
          select count(*)::numeric/greatest(1,v_people*4) into v_team_avg
          from public.barber_actions a join public.profiles p on p.id=a.user_id
          where p.active=true and p.role in ('leader','barber') and a.status='approved' and a.action_key=v_key
            and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week-28 and v_week-1;
        end if;
        v_avg:=coalesce(v_team_avg,0);
      end if;

      v_factor:=case v_level when 'fraca' then .90 when 'forte' then 1.10 else 1 end;
      if v_member.development then v_factor:=v_factor*.70; end if;
      v_minimum:=case v_key when 'atendimentos' then (case when v_member.development then 4 else 10 end)
        when 'ritmo' then (case when v_member.development then 2 else 3 end)
        else 1 end;
      v_target:=greatest(v_minimum,ceil(v_avg*v_factor)::integer);
      v_bonus:=case v_key when 'atendimentos' then 3 when 'ritmo' then 5 when 'extras' then 4 when 'produtos' then 5 else 6 end;
      if v_level='forte' then v_bonus:=v_bonus+2; end if;

      if v_key='ritmo' then
        select count(distinct (a.created_at at time zone 'America/Sao_Paulo')::date) into v_progress
        from public.barber_actions a where a.user_id=v_member.id and a.status='approved'
          and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week and v_week+6;
      elsif v_key='atendimentos' then
        select count(*) into v_progress from public.barber_actions a
        where a.user_id=v_member.id and a.status='approved' and a.action_key in ('cortes','barbas')
          and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week and v_week+6;
      else
        select count(*) into v_progress from public.barber_actions a
        where a.user_id=v_member.id and a.status='approved' and a.action_key=v_key
          and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week and v_week+6;
      end if;

      insert into public.personal_weekly_missions(week_start,user_id,mission_key,target,progress,bonus_points)
      values(v_week,v_member.id,v_key,v_target,coalesce(v_progress,0),v_bonus)
      on conflict(week_start,user_id,mission_key) do nothing;
    end loop;
  end loop;
end $$;

create or replace function public.apply_personal_weekly_missions(p_action_id bigint)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_action public.barber_actions%rowtype;
  v_mission record;
  v_week date;
  v_progress integer;
  v_bonus integer:=0;
  v_completed integer;
  v_state jsonb;
begin
  select * into v_action from public.barber_actions where id=p_action_id and status='approved';
  if not found then return jsonb_build_object('ok',false,'code','action_not_approved'); end if;
  perform public.ensure_personal_weekly_missions();
  v_week:=public.barberxp_week_start();

  for v_mission in
    select * from public.personal_weekly_missions
    where week_start=v_week and user_id=v_action.user_id for update
  loop
    if v_mission.mission_key='ritmo' then
      select count(distinct (a.created_at at time zone 'America/Sao_Paulo')::date) into v_progress
      from public.barber_actions a where a.user_id=v_action.user_id and a.status='approved'
        and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week and v_week+6;
    elsif v_mission.mission_key='atendimentos' then
      select count(*) into v_progress from public.barber_actions a
      where a.user_id=v_action.user_id and a.status='approved' and a.action_key in ('cortes','barbas')
        and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week and v_week+6;
    else
      select count(*) into v_progress from public.barber_actions a
      where a.user_id=v_action.user_id and a.status='approved' and a.action_key=v_mission.mission_key
        and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week and v_week+6;
    end if;
    if v_progress>=v_mission.target and not v_mission.awarded then
      v_bonus:=v_bonus+v_mission.bonus_points;
      update public.personal_weekly_missions set progress=v_progress,awarded=true,updated_at=now()
      where week_start=v_week and user_id=v_action.user_id and mission_key=v_mission.mission_key;
    else
      update public.personal_weekly_missions set progress=v_progress,updated_at=now()
      where week_start=v_week and user_id=v_action.user_id and mission_key=v_mission.mission_key;
    end if;
  end loop;

  select count(*) into v_completed from public.personal_weekly_missions
  where week_start=v_week and user_id=v_action.user_id and awarded=true;
  if v_completed=5 and exists(
    select 1 from public.personal_weekly_sets where week_start=v_week and user_id=v_action.user_id and completion_awarded=false
  ) then
    update public.personal_weekly_sets set completion_awarded=true,updated_at=now()
    where week_start=v_week and user_id=v_action.user_id;
    v_bonus:=v_bonus+5;
  end if;

  if v_bonus>0 then
    select state into v_state from public.barber_states where user_id=v_action.user_id for update;
    v_state:=coalesce(v_state,'{}'::jsonb);
    v_state:=jsonb_set(v_state,'{points}',to_jsonb(coalesce((v_state->>'points')::integer,0)+v_bonus),true);
    v_state:=jsonb_set(v_state,'{history}',jsonb_build_array(jsonb_build_array('weekly','Missão semanal concluída',0,'Bônus automático das missões','plus',v_bonus,'personal-weekly:'||v_week))||coalesce(v_state->'history','[]'::jsonb),true);
    update public.barber_states set state=v_state,updated_at=now() where user_id=v_action.user_id;
    insert into public.app_notifications(user_id,type,title,message,metadata)
    values(v_action.user_id,'weekly_goal','Missão semanal concluída','Você conquistou +'||v_bonus||' pontos extras.',jsonb_build_object('view','dashboard'));
  end if;
  return jsonb_build_object('ok',true,'bonus',v_bonus,'completed',v_completed);
end $$;

grant execute on function public.ensure_personal_weekly_missions() to authenticated;
grant execute on function public.apply_personal_weekly_missions(bigint) to authenticated;

select public.ensure_personal_weekly_missions();
notify pgrst, 'reload schema';
