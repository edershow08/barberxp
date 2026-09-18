-- BarberXP v82 — resumo individual todo sábado às 21h (horário de Porto Alegre)
-- Inclui também a correção do ranking mensal da v81.

create or replace function public.get_barber_month_ranking(p_month text default null)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_month text := coalesce(nullif(p_month,''),to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM'));
  v_from timestamptz;
  v_to timestamptz;
  v_rows jsonb;
begin
  if not exists (
    select 1 from public.profiles
    where id=auth.uid() and active=true
  ) then
    raise exception 'Acesso permitido somente para colaborador ativo';
  end if;

  if v_month !~ '^\d{4}-(0[1-9]|1[0-2])$' then
    raise exception 'Mês inválido';
  end if;

  v_from := (v_month||'-01 00:00:00 America/Sao_Paulo')::timestamptz;
  v_to := v_from + interval '1 month';

  with ranking as (
    select
      p.id,p.full_name,p.email,p.role,
      coalesce(sum(a.xp),0)::integer as xp,
      coalesce(sum(a.points),0)::integer as generated_points,
      count(a.id)::integer as actions,
      count(a.id) filter (where a.action_key='cortes')::integer as cortes,
      count(a.id) filter (where a.action_key='barbas')::integer as barbas,
      count(a.id) filter (where a.action_key='extras')::integer as extras,
      count(a.id) filter (where a.action_key='produtos')::integer as produtos,
      count(a.id) filter (where a.action_key='assinaturas')::integer as assinaturas,
      count(a.id) filter (where a.action_key='reativacoes')::integer as reativacoes,
      case
        when coalesce(bs.state->>'pointsMonth','')=v_month
          then coalesce(nullif(bs.state->>'points','')::numeric,0)::integer
        else 0
      end as available_points
    from public.profiles p
    left join public.barber_actions a
      on a.user_id=p.id and a.status='approved'
      and a.created_at>=v_from and a.created_at<v_to
    left join public.barber_states bs on bs.user_id=p.id
    where p.active=true and p.role in ('leader','barber')
    group by p.id,p.full_name,p.email,p.role,bs.state
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'full_name',full_name,'email',email,'role',role,
    'xp',xp,'generated_points',generated_points,'available_points',available_points,
    'actions',actions,'cortes',cortes,'barbas',barbas,'extras',extras,
    'produtos',produtos,'assinaturas',assinaturas,'reativacoes',reativacoes
  ) order by xp desc,generated_points desc,full_name),'[]'::jsonb)
  into v_rows from ranking;

  return jsonb_build_object('month',v_month,'rows',v_rows,'updated_at',now());
end $$;

revoke all on function public.get_barber_month_ranking(text) from public;
grant execute on function public.get_barber_month_ranking(text) to authenticated;

create extension if not exists pg_cron;

create or replace function public.create_weekly_barber_summaries(p_week date default null)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_week date := coalesce(p_week,v_today-(extract(isodow from v_today)::integer-1));
  v_from timestamptz := (v_week::timestamp at time zone 'America/Sao_Paulo');
  v_to timestamptz := ((v_week+7)::timestamp at time zone 'America/Sao_Paulo');
  v_previous_from timestamptz := ((v_week-7)::timestamp at time zone 'America/Sao_Paulo');
  v_profile record;
  v_actions integer;
  v_previous_actions integer;
  v_days integer;
  v_xp integer;
  v_points integer;
  v_products integer;
  v_subscriptions integer;
  v_extras integer;
  v_completed integer;
  v_focus text;
  v_comparison text;
  v_message text;
  v_created integer := 0;
begin
  for v_profile in
    select id,full_name,email
    from public.profiles
    where active=true and role in ('leader','barber')
    order by full_name
  loop
    select
      count(*)::integer,
      count(distinct (a.created_at at time zone 'America/Sao_Paulo')::date)::integer,
      coalesce(sum(a.xp),0)::integer,
      coalesce(sum(a.points),0)::integer,
      count(*) filter (where a.action_key='produtos')::integer,
      count(*) filter (where a.action_key in ('assinaturas','reativacoes'))::integer,
      count(*) filter (where a.action_key='extras')::integer
    into v_actions,v_days,v_xp,v_points,v_products,v_subscriptions,v_extras
    from public.barber_actions a
    where a.user_id=v_profile.id
      and a.status='approved'
      and a.created_at>=v_from
      and a.created_at<v_to;

    select count(*)::integer
    into v_previous_actions
    from public.barber_actions a
    where a.user_id=v_profile.id
      and a.status='approved'
      and a.created_at>=v_previous_from
      and a.created_at<v_from;

    select count(*)::integer
    into v_completed
    from public.personal_weekly_missions m
    where m.user_id=v_profile.id
      and m.week_start=v_week
      and m.awarded=true;

    v_focus := case
      when v_actions=0 then 'Na próxima semana, comece registrando seus atendimentos para o BarberXP acompanhar seu ritmo.'
      when v_products=0 then 'Próximo foco: oferecer pelo menos um produto adequado ao cliente.'
      when v_subscriptions=0 then 'Próximo foco: apresentar o clube para clientes com frequência de retorno.'
      when v_extras=0 then 'Próximo foco: identificar uma oportunidade real de serviço extra.'
      else 'Próximo foco: manter a constância e tentar superar esta produção.'
    end;

    v_comparison := case
      when v_previous_actions=0 and v_actions>0 then 'Primeira semana com base para comparação.'
      when v_actions>v_previous_actions then 'Você fez '||(v_actions-v_previous_actions)||' ação(ões) a mais que na semana anterior.'
      when v_actions<v_previous_actions then 'Faltaram '||(v_previous_actions-v_actions)||' ação(ões) para alcançar a semana anterior.'
      else 'Você manteve o mesmo volume da semana anterior.'
    end;

    v_message := 'Sua semana: '||v_actions||' ações aprovadas em '||v_days||' dia(s), '
      ||v_xp||' XP, '||v_points||' pontos e '||v_completed||'/5 missões concluídas. '
      ||v_comparison||' '||v_focus;

    if not exists (
      select 1 from public.app_notifications n
      where n.user_id=v_profile.id
        and n.type='weekly_coach'
        and n.metadata->>'week_key'=v_week::text
        and n.metadata->>'scheduled'='true'
    ) then
      insert into public.app_notifications(user_id,type,title,message,metadata)
      values(
        v_profile.id,
        'weekly_coach',
        'Seu resumo semanal chegou',
        v_message,
        jsonb_build_object(
          'view','ai',
          'week_key',v_week::text,
          'scheduled',true,
          'actions',v_actions,
          'days',v_days,
          'xp',v_xp,
          'points',v_points,
          'missions_completed',v_completed
        )
      );
      v_created := v_created+1;
    end if;
  end loop;

  return jsonb_build_object('ok',true,'week',v_week,'notifications_created',v_created);
end $$;

revoke all on function public.create_weekly_barber_summaries(date) from public;

-- pg_cron usa UTC: domingo 00:00 UTC = sábado 21:00 em Porto Alegre.
-- Reexecutar este SQL atualiza o Job existente com o mesmo nome.
select cron.schedule(
  'barberxp-weekly-summary',
  '0 0 * * 0',
  'select public.create_weekly_barber_summaries();'
);

notify pgrst, 'reload schema';
