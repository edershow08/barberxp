-- BarberXP v81 — ranking mensal igual para todos os colaboradores

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
      p.id,
      p.full_name,
      p.email,
      p.role,
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
      on a.user_id=p.id
      and a.status='approved'
      and a.created_at>=v_from
      and a.created_at<v_to
    left join public.barber_states bs on bs.user_id=p.id
    where p.active=true and p.role in ('leader','barber')
    group by p.id,p.full_name,p.email,p.role,bs.state
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,
    'full_name',full_name,
    'email',email,
    'role',role,
    'xp',xp,
    'generated_points',generated_points,
    'available_points',available_points,
    'actions',actions,
    'cortes',cortes,
    'barbas',barbas,
    'extras',extras,
    'produtos',produtos,
    'assinaturas',assinaturas,
    'reativacoes',reativacoes
  ) order by xp desc,generated_points desc,full_name),'[]'::jsonb)
  into v_rows
  from ranking;

  return jsonb_build_object(
    'month',v_month,
    'rows',v_rows,
    'updated_at',now()
  );
end $$;

revoke all on function public.get_barber_month_ranking(text) from public;
grant execute on function public.get_barber_month_ranking(text) to authenticated;

notify pgrst, 'reload schema';
