-- BarberXP v67 — totais coletivos iguais para todos os perfis

create or replace function public.get_collective_goal_progress(p_month text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_start date;
  v_end date;
  v_result jsonb;
begin
  if p_month !~ '^\d{4}-\d{2}$' then
    raise exception 'Mês inválido';
  end if;

  v_start := to_date(p_month || '-01', 'YYYY-MM-DD');
  v_end := (v_start + interval '1 month')::date;

  select jsonb_build_object(
    'month_key', p_month,
    'approved_products', count(*) filter (
      where a.status = 'approved'
        and (a.action_key in ('produtos','produto') or a.metadata ? 'product_id')
    ),
    'approved_new_subscriptions', count(*) filter (
      where a.status = 'approved'
        and a.action_key in ('assinaturas','assinatura','planos','plano')
    ),
    'approved_reactivations', count(*) filter (
      where a.status = 'approved'
        and (a.action_key in ('reativacoes','reativacao') or a.metadata->>'subscription_type' = 'reactivation')
    ),
    'pending_products', count(*) filter (
      where a.status = 'pending'
        and (a.action_key in ('produtos','produto') or a.metadata ? 'product_id')
    ),
    'pending_subscriptions', count(*) filter (
      where a.status = 'pending'
        and (
          a.action_key in ('assinaturas','assinatura','planos','plano','reativacoes','reativacao')
          or a.metadata->>'subscription_type' = 'reactivation'
        )
    ),
    'updated_at', now()
  ) into v_result
  from public.barber_actions a
  where a.created_at >= (v_start::timestamp at time zone 'America/Sao_Paulo')
    and a.created_at < (v_end::timestamp at time zone 'America/Sao_Paulo');

  return v_result;
end;
$$;

revoke all on function public.get_collective_goal_progress(text) from public;
grant execute on function public.get_collective_goal_progress(text) to authenticated;

notify pgrst, 'reload schema';
