-- V90: comissão marginal por faixas e consulta de meses anteriores.
-- Requer a estrutura v89. Não ativa faixas nem altera registros de vendas.
begin;
create table if not exists public.product_commission_tiers_v90(
 month_key text not null check(month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
 seller_role text not null check(seller_role in ('barber','manager')),
 enabled boolean not null default false,
 threshold_15 numeric(14,2),threshold_20 numeric(14,2),threshold_25 numeric(14,2),
 updated_by uuid references public.profiles(id),updated_at timestamptz not null default now(),
 primary key(month_key,seller_role),
 check(not enabled or (threshold_15 is not null and threshold_20 is not null and threshold_25 is not null and threshold_15>0 and threshold_20>threshold_15 and threshold_25>threshold_20))
);
alter table public.product_commission_tiers_v90 enable row level security;
revoke all on public.product_commission_tiers_v90 from anon,authenticated;
create or replace function public.effective_commission_tiers_v90(p_month text)
returns setof public.product_commission_tiers_v90 language sql stable security definer set search_path=public,pg_temp as $$
 select distinct on(t.seller_role) t.* from product_commission_tiers_v90 t where t.month_key<=p_month order by t.seller_role,t.month_key desc
$$;
revoke all on function public.effective_commission_tiers_v90(text) from public,anon,authenticated;
create or replace function public.tier_commission_total_v90(p_sales numeric,p_15 numeric,p_20 numeric,p_25 numeric)
returns numeric language sql immutable set search_path=public,pg_temp as $$
 select round(least(greatest(p_sales,0),p_15)*0.10
 +least(greatest(p_sales-p_15,0),p_20-p_15)*0.15
 +least(greatest(p_sales-p_20,0),p_25-p_20)*0.20
 +greatest(p_sales-p_25,0)*0.25,2)
$$;
revoke all on function public.tier_commission_total_v90(numeric,numeric,numeric,numeric) from public,anon,authenticated;
create or replace function public.save_commission_tiers_v90(p_month text,p_role text,p_enabled boolean,p_15 numeric default null,p_20 numeric default null,p_25 numeric default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_result jsonb;
begin
 if not exists(select 1 from profiles where id=auth.uid() and role='leader' and active) then raise exception 'Somente o dono pode configurar as faixas.';end if;
 if p_month is null or p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' or p_month<to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM') then raise exception 'Meses encerrados não podem ter as faixas alteradas.';end if;
 if p_role is null or p_role not in ('barber','manager') or p_enabled is null then raise exception 'Selecione barbeiro ou recepção/gestor.';end if;
 if p_enabled and (p_15 is null or p_20 is null or p_25 is null or p_15<=0 or p_20<=p_15 or p_25<=p_20 or p_15::text in ('NaN','Infinity','-Infinity') or p_20::text in ('NaN','Infinity','-Infinity') or p_25::text in ('NaN','Infinity','-Infinity')) then raise exception 'Informe três limites positivos e crescentes para 15%%, 20%% e 25%%.';end if;
 insert into product_commission_tiers_v90(month_key,seller_role,enabled,threshold_15,threshold_20,threshold_25,updated_by)
 values(p_month,p_role,p_enabled,case when p_enabled then round(p_15,2) end,case when p_enabled then round(p_20,2) end,case when p_enabled then round(p_25,2) end,auth.uid())
 on conflict(month_key,seller_role) do update set enabled=excluded.enabled,threshold_15=excluded.threshold_15,threshold_20=excluded.threshold_20,threshold_25=excluded.threshold_25,updated_by=auth.uid(),updated_at=now()
 returning to_jsonb(product_commission_tiers_v90.*) into v_result;
 return v_result;
end;$$;
revoke all on function public.save_commission_tiers_v90(text,text,boolean,numeric,numeric,numeric) from public,anon;
grant execute on function public.save_commission_tiers_v90(text,text,boolean,numeric,numeric,numeric) to authenticated;
create or replace function public.product_commission_lines_v90(p_month text)
returns table(action_id bigint,user_id uuid,unit_id bigint,sale numeric,cost numeric,original_commission numeric,commission numeric,margin numeric,fixed_percent numeric,tiered boolean,role_key text)
language sql stable security definer set search_path=public,pg_temp as $$
 with raw as materialized (
 select a.id,a.user_id,a.barberxp_unit_id,a.created_at,(a.metadata->>'sale_price')::numeric as sale,(a.metadata->>'cost_price')::numeric as cost,
 (a.metadata->>'commission_amount')::numeric as original_commission,(a.metadata->>'commission_percent')::numeric as fixed_percent,
 case when a.metadata->>'seller_role'='manager' then 'manager' else 'barber' end as role_key
 from barber_actions a where a.action_key='produtos' and a.status='approved'
 and a.created_at >= (p_month||'-01')::timestamp at time zone 'America/Sao_Paulo'
 and a.created_at < ((p_month||'-01')::date+interval '1 month') at time zone 'America/Sao_Paulo'
 and a.metadata->>'financial_version'='84'
 and jsonb_typeof(a.metadata->'sale_price')='number' and jsonb_typeof(a.metadata->'cost_price')='number'
 and jsonb_typeof(a.metadata->'commission_amount')='number' and jsonb_typeof(a.metadata->'commission_percent')='number' and jsonb_typeof(a.metadata->'profit')='number'
 ),running as (
 select r.*,sum(r.sale) over(partition by r.user_id order by r.created_at,r.id rows between unbounded preceding and current row) as cumulative from raw r
 ),calculated as (
 select r.*,coalesce(t.enabled,false) as tiered,
 case when coalesce(t.enabled,false) then tier_commission_total_v90(r.cumulative,t.threshold_15,t.threshold_20,t.threshold_25)-tier_commission_total_v90(r.cumulative-r.sale,t.threshold_15,t.threshold_20,t.threshold_25) else r.original_commission end as calculated_commission
 from running r left join effective_commission_tiers_v90(p_month) t on t.seller_role=r.role_key
 ) select c.id,c.user_id,c.barberxp_unit_id,c.sale,c.cost,c.original_commission,c.calculated_commission,c.sale-c.cost-c.calculated_commission,c.fixed_percent,c.tiered,c.role_key from calculated c
$$;
revoke all on function public.product_commission_lines_v90(text) from public,anon,authenticated;
create or replace function public.get_management_report_v90(p_month text,p_unit bigint default null)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_base jsonb;v_rows jsonb;v_totals jsonb;
begin
 -- v89 checks active owner/manager, valid month and unit.
 v_base:=get_management_report_v89(p_month,p_unit);
 with lines as materialized (select * from product_commission_lines_v90(p_month)),sums as (
 select l.user_id,sum(l.commission) as commission,sum(l.margin) as margin,sum(l.original_commission) as original_commission,count(*) filter(where l.tiered) as tiered_sales,
 coalesce(jsonb_agg(distinct l.fixed_percent) filter(where not l.tiered),'[]'::jsonb) as rates
 from lines l where p_unit is null or (p_unit=-1 and l.unit_id is null) or l.unit_id=p_unit group by l.user_id
 ),enriched as (
 select j.value || jsonb_build_object('commission',coalesce(s.commission,0),'margin',coalesce(s.margin,0),'original_commission',coalesce(s.original_commission,0),'adjustment',coalesce(s.commission-s.original_commission,0),'tiered_sales',coalesce(s.tiered_sales,0),'rates',coalesce(s.rates,'[]'::jsonb)) as row
 from jsonb_array_elements(v_base->'professionals') j left join sums s on s.user_id=(j.value->>'user_id')::uuid
 ) select coalesce(jsonb_agg(e.row order by (e.row->>'revenue')::numeric desc,e.row->>'name'),'[]'::jsonb) into v_rows from enriched e;
 select jsonb_build_object('sales',coalesce(sum((r->>'sales')::numeric),0),'known_sales',coalesce(sum((r->>'known_sales')::numeric),0),'legacy_sales',coalesce(sum((r->>'legacy_sales')::numeric),0),
 'revenue',coalesce(sum((r->>'revenue')::numeric),0),'cost',coalesce(sum((r->>'cost')::numeric),0),'commission',coalesce(sum((r->>'commission')::numeric),0),'margin',coalesce(sum((r->>'margin')::numeric),0))
 into v_totals from jsonb_array_elements(v_rows) r;
 return v_base || jsonb_build_object('professionals',v_rows,'totals',v_totals,'commission_method','marginal',
 'tier_policies',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from effective_commission_tiers_v90(p_month) t),
 'available_months',(select coalesce(jsonb_agg(m.month_key order by m.month_key desc),'[]'::jsonb) from (select distinct to_char(a.created_at at time zone 'America/Sao_Paulo','YYYY-MM') as month_key from barber_actions a where a.action_key='produtos' union select to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM') union select p_month) m));
end;$$;
revoke all on function public.get_management_report_v90(text,bigint) from public,anon;
grant execute on function public.get_management_report_v90(text,bigint) to authenticated;
create or replace function public.get_my_product_commission_v85()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_role text;v_month text;v_percent numeric;v_result jsonb;v_policy public.product_commission_tiers_v90%rowtype;v_legacy integer;
begin
 select case when p.role='manager' then 'manager' else 'barber' end into v_role from profiles p where p.id=auth.uid() and p.active;
 if not found then raise exception 'Entre em uma conta ativa para consultar sua comissão.';end if;
 v_month:=to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM');
 select * into v_policy from effective_commission_tiers_v90(v_month) t where t.seller_role=v_role;
 select case when v_role='manager' then r.reception_percent else r.barber_percent end into v_percent from product_commission_rules r where r.id=1;
 select jsonb_build_object('month',v_month,'current_percent',v_percent,'commission_amount',coalesce(sum(l.commission),0),'approved_sales',count(*),'applied_rates',coalesce(jsonb_agg(distinct l.fixed_percent) filter(where not l.tiered),'[]'::jsonb),
 'tiered_sales',count(*) filter(where l.tiered),'revenue',coalesce(sum(l.sale),0),'mode',case when coalesce(v_policy.enabled,false) or count(*) filter(where l.tiered)>0 then 'tiered' else 'fixed' end,'tier_policy',case when v_policy.enabled then to_jsonb(v_policy) else null end)
 into v_result from product_commission_lines_v90(v_month) l where l.user_id=auth.uid();
 select count(*) into v_legacy from barber_actions a where a.user_id=auth.uid() and a.action_key='produtos' and a.status='approved' and to_char(a.created_at at time zone 'America/Sao_Paulo','YYYY-MM')=v_month
 and not exists(select 1 from product_commission_lines_v90(v_month) l where l.action_id=a.id);
 return v_result || jsonb_build_object('legacy_sales',v_legacy);
end;$$;
revoke all on function public.get_my_product_commission_v85() from public,anon;
grant execute on function public.get_my_product_commission_v85() to authenticated;
notify pgrst,'reload schema';
commit;
