-- v91: configuração única, recepção nos gráficos e diagnóstico de vendas.
begin;
create or replace function public.get_commission_settings_v91() returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare m text:=to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM');
begin
 if not exists(select 1 from profiles where id=auth.uid() and active and role in ('leader','manager')) then raise exception 'Acesso permitido somente para dono e gestor.';end if;
 return jsonb_build_object('month',m,'policies',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from effective_commission_tiers_v90(m) t),'goal',(select coalesce(monthly_product_profit_goal,0) from game_strategy where id=1),'rules',(select to_jsonb(r) from product_commission_rules r where id=1));
end;$$;
create or replace function public.save_commission_settings_v91(p_barber jsonb,p_reception jsonb,p_goal numeric) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare m text:=to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM');r record;
begin
 if not exists(select 1 from profiles where id=auth.uid() and active and role='leader') then raise exception 'Somente o dono pode configurar as comissões.';end if;
 if p_barber is null or p_reception is null or jsonb_typeof(p_barber->'enabled') is distinct from 'boolean' or jsonb_typeof(p_reception->'enabled') is distinct from 'boolean' then raise exception 'Informe as duas funções.';end if;
 -- Tudo é confirmado na mesma transação, inclusive a meta de margem.
 perform save_commission_tiers_v90(m,'barber',(p_barber->>'enabled')::boolean,(p_barber->>'b15')::numeric,(p_barber->>'b20')::numeric,(p_barber->>'b25')::numeric);
 perform save_commission_tiers_v90(m,'manager',(p_reception->>'enabled')::boolean,(p_reception->>'b15')::numeric,(p_reception->>'b20')::numeric,(p_reception->>'b25')::numeric);
 select barber_percent,reception_percent into r from product_commission_rules where id=1;
 perform save_product_settings_v85(r.barber_percent,r.reception_percent,p_goal);
 return get_commission_settings_v91();
end;$$;
create or replace function public.get_management_report_v91(p_month text,p_unit bigint default null) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare b jsonb;v_from timestamptz;v_to timestamptz;a jsonb;
begin
 b:=get_management_report_v90(p_month,p_unit);
 v_from:=(p_month||'-01')::timestamp at time zone 'America/Sao_Paulo';v_to:=((p_month||'-01')::date+interval '1 month') at time zone 'America/Sao_Paulo';
 select coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) into a from (
 select p.id as user_id,coalesce(p.full_name,p.email,'Colaborador') as name,
 count(x.id) filter(where x.status='pending') as pending,
 count(x.id) filter(where x.status='rejected') as rejected,
 count(x.id) filter(where x.status='approved') as approved,
 count(x.id) filter(where x.status='approved' and not coalesce(x.metadata->>'financial_version'='84' and jsonb_typeof(x.metadata->'sale_price')='number' and jsonb_typeof(x.metadata->'cost_price')='number' and jsonb_typeof(x.metadata->'commission_amount')='number' and jsonb_typeof(x.metadata->'commission_percent')='number' and jsonb_typeof(x.metadata->'profit')='number',false)) as without_calculation,
 count(x.id) filter(where x.action_key<>'produtos') as other_product_actions
 from profiles p left join barber_actions x on x.user_id=p.id and x.created_at>=v_from and x.created_at<v_to and (x.action_key='produtos' or x.metadata ? 'product_id') and (p_unit is null or (p_unit=-1 and x.barberxp_unit_id is null) or x.barberxp_unit_id=p_unit)
 where p.id in(select (j->>'user_id')::uuid from jsonb_array_elements(b->'professionals') j)
 group by p.id,p.full_name,p.email
 ) s;
 return b||jsonb_build_object('sales_audit',a);
end;$$;
revoke all on function public.get_commission_settings_v91(),public.save_commission_settings_v91(jsonb,jsonb,numeric),public.get_management_report_v91(text,bigint) from public,anon;
grant execute on function public.get_commission_settings_v91(),public.save_commission_settings_v91(jsonb,jsonb,numeric),public.get_management_report_v91(text,bigint) to authenticated;
commit;
