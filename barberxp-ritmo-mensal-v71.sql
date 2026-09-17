-- BarberXP v71 — ritmo mensal completo e igual para dono e gestores

create or replace function public.get_monthly_team_pace(p_month text default null)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_actor public.profiles%rowtype;
  v_month text := coalesce(nullif(p_month,''),to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM'));
  v_from timestamptz;
  v_to timestamptz;
  v_members jsonb;
  v_actions jsonb;
begin
  select * into v_actor from public.profiles
  where id=auth.uid() and active=true and role in ('leader','manager');
  if not found then
    raise exception 'Acesso permitido somente para dono ou gestor ativo';
  end if;

  if v_month !~ '^\d{4}-(0[1-9]|1[0-2])$' then
    raise exception 'Mês inválido';
  end if;

  v_from := (v_month||'-01 00:00:00 America/Sao_Paulo')::timestamptz;
  v_to := v_from + interval '1 month';

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',p.id,'full_name',p.full_name,'email',p.email,'role',p.role,'active',p.active
  ) order by p.full_name),'[]'::jsonb)
  into v_members
  from public.profiles p
  where p.active=true and p.role in ('leader','barber');

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',a.id,'user_id',a.user_id,'action_key',a.action_key,
    'action_label',a.action_label,'xp',a.xp,'points',a.points,
    'status',a.status,'created_at',a.created_at
  ) order by a.created_at),'[]'::jsonb)
  into v_actions
  from public.barber_actions a
  where a.status='approved' and a.created_at>=v_from and a.created_at<v_to;

  return jsonb_build_object('month',v_month,'members',v_members,'actions',v_actions,'updated_at',now());
end $$;

revoke all on function public.get_monthly_team_pace(text) from public;
grant execute on function public.get_monthly_team_pace(text) to authenticated;

notify pgrst, 'reload schema';
