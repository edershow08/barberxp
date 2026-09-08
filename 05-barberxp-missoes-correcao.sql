-- BarberXP v55 — sincronização confiável das missões semanais

create or replace function public.sync_personal_weekly_missions(p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_week date := public.barberxp_week_start();
  v_user uuid;
  v_action_id bigint;
  v_result jsonb;
  v_synced integer := 0;
begin
  perform public.ensure_personal_weekly_missions();

  for v_user in
    select distinct m.user_id
    from public.personal_weekly_missions m
    join public.profiles p on p.id=m.user_id
    where m.week_start=v_week and p.active=true
      and (p_user_id is null or m.user_id=p_user_id)
      and (
        m.user_id=auth.uid()
        or exists(select 1 from public.profiles me where me.id=auth.uid() and me.role in ('leader','manager'))
      )
  loop
    select a.id into v_action_id
    from public.barber_actions a
    where a.user_id=v_user and a.status='approved'
      and (a.created_at at time zone 'America/Sao_Paulo')::date between v_week and v_week+6
    order by a.created_at desc,a.id desc limit 1;

    if v_action_id is not null then
      v_result:=public.apply_personal_weekly_missions(v_action_id);
      v_synced:=v_synced+1;
    end if;
    v_action_id:=null;
  end loop;

  return jsonb_build_object('ok',true,'users_synced',v_synced);
end $$;

grant execute on function public.sync_personal_weekly_missions(uuid) to authenticated;

create or replace function public.barberxp_sync_missions_after_approval()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='approved' and old.status is distinct from 'approved' then
    perform public.apply_personal_weekly_missions(new.id);
  end if;
  return new;
end $$;

drop trigger if exists barberxp_sync_missions_after_approval on public.barber_actions;
create trigger barberxp_sync_missions_after_approval
after update of status on public.barber_actions
for each row execute function public.barberxp_sync_missions_after_approval();

-- Recupera o progresso e os bônus que ficaram pendentes na semana atual.
do $$
declare
  v_user uuid;
  v_action bigint;
begin
  perform public.ensure_personal_weekly_missions();
  for v_user in
    select distinct user_id from public.personal_weekly_missions
    where week_start=public.barberxp_week_start()
  loop
    select id into v_action from public.barber_actions
    where user_id=v_user and status='approved'
      and (created_at at time zone 'America/Sao_Paulo')::date
        between public.barberxp_week_start() and public.barberxp_week_start()+6
    order by created_at desc,id desc limit 1;
    if v_action is not null then
      perform public.apply_personal_weekly_missions(v_action);
    end if;
    v_action:=null;
  end loop;
end $$;

notify pgrst, 'reload schema';
