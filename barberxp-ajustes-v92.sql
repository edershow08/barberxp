-- v92: unidades editáveis e quatro metas/percentuais configuráveis.
begin;
create or replace function public.rename_unit_v92(p_unit bigint,p_name text,p_expected_name text default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare u public.barberxp_units%rowtype;
begin
 if not exists(select 1 from profiles where id=auth.uid() and active and role='leader') then raise exception 'Somente o dono pode alterar as unidades.';end if;
 if p_name is null or length(btrim(p_name)) not between 1 and 80 then raise exception 'Informe um nome de 1 a 80 caracteres.';end if;
 perform pg_advisory_xact_lock(92001);
 select * into u from barberxp_units where id=p_unit for update;
 if not found then raise exception 'Unidade não encontrada.';end if;
 if p_expected_name is not null and u.name<>p_expected_name then raise exception 'O nome foi alterado em outro aparelho. Recarregue e confira.';end if;
 if exists(select 1 from barberxp_units where id<>p_unit and lower(btrim(name))=lower(btrim(p_name))) then raise exception 'Já existe uma unidade com esse nome.';end if;
 update barberxp_units set name=btrim(p_name) where id=p_unit returning * into u;
 return to_jsonb(u);
end;$$;
create table if not exists public.product_commission_bands_v92(
 month_key text not null check(month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
 seller_role text not null check(seller_role in ('barber','manager')),
 enabled boolean not null default false,base_percent numeric(6,2),bands jsonb,
 updated_by uuid references public.profiles(id),updated_at timestamptz not null default now(),
 primary key(month_key,seller_role)
);
alter table public.product_commission_bands_v92 enable row level security;
revoke all on public.product_commission_bands_v92 from anon,authenticated;
create or replace function public.effective_commission_bands_v92(p_month text)
returns setof public.product_commission_bands_v92 language sql stable security definer set search_path=public,pg_temp as $$
 select distinct on(seller_role) * from product_commission_bands_v92 where month_key<=p_month order by seller_role,month_key desc
$$;
create or replace function public.band_commission_total_v92(p_sales numeric,p_bands jsonb,p_base numeric) returns numeric
language plpgsql immutable set search_path=public,pg_temp as $$
declare b jsonb;lo numeric:=0;hi numeric;rate numeric:=p_base;total numeric:=0;
begin
 for b in select value from jsonb_array_elements(p_bands) loop
 hi:=(b->>'threshold')::numeric;
 total:=total+greatest(least(greatest(p_sales,0),hi)-lo,0)*rate/100;
 lo:=hi;rate:=(b->>'percent')::numeric;
 end loop;
 return round(total+greatest(p_sales-lo,0)*rate/100,2);
end;$$;
create or replace function public.get_commission_settings_v92() returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 return get_commission_settings_v91()||jsonb_build_object('custom_policies',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from effective_commission_bands_v92(to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM')) t));
end;$$;
create or replace function public.save_commission_settings_v92(p_barber jsonb,p_reception jsonb,p_goal numeric) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare m text:=to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM');r text;d jsonb;b jsonb;last_value numeric;v numeric;pc numeric;base numeric;rules record;
begin
 if not exists(select 1 from profiles where id=auth.uid() and active and role='leader') then raise exception 'Somente o dono pode configurar as comissões.';end if;
 foreach r in array array['barber','manager'] loop
 d:=case when r='barber' then p_barber else p_reception end;
 if d is null or jsonb_typeof(d->'enabled') is distinct from 'boolean' then raise exception 'Informe as duas funções.';end if;
 if (d->>'enabled')::boolean then
  if jsonb_typeof(d->'base_percent') is distinct from 'number' or jsonb_typeof(d->'bands') is distinct from 'array' then raise exception 'Defina a comissão antes da primeira meta e as quatro metas.';end if;
  base:=(d->>'base_percent')::numeric;
  if base<0 or base>100 or base::text in ('NaN','Infinity','-Infinity') or jsonb_array_length(d->'bands')<>4 then raise exception 'Informe quatro metas e percentuais de 0 a 100.';end if;
  last_value:=-1;
  for b in select value from jsonb_array_elements(d->'bands') loop
   if jsonb_typeof(b->'threshold') is distinct from 'number' or jsonb_typeof(b->'percent') is distinct from 'number' then raise exception 'Preencha todos os valores e percentuais.';end if;
   v:=round((b->>'threshold')::numeric,2);pc:=round((b->>'percent')::numeric,2);
   if (b->>'threshold')::numeric<0 or (b->>'percent')::numeric not between 0 and 100 or v<0 or v<=last_value or pc<0 or pc>100 or v::text in ('NaN','Infinity','-Infinity') or pc::text in ('NaN','Infinity','-Infinity') then raise exception 'Metas devem ser crescentes e percentuais de 0 a 100.';end if;
   last_value:=v;
  end loop;
 end if;
 insert into product_commission_bands_v92(month_key,seller_role,enabled,base_percent,bands,updated_by)
 values(m,r,(d->>'enabled')::boolean,case when (d->>'enabled')::boolean then round((d->>'base_percent')::numeric,2) end,case when (d->>'enabled')::boolean then (select jsonb_agg(jsonb_build_object('threshold',round((x.value->>'threshold')::numeric,2),'percent',round((x.value->>'percent')::numeric,2)) order by x.ord) from jsonb_array_elements(d->'bands') with ordinality as x(value,ord)) end,auth.uid())
 on conflict(month_key,seller_role) do update set enabled=excluded.enabled,base_percent=excluded.base_percent,bands=excluded.bands,updated_by=auth.uid(),updated_at=now();
 end loop;
 select barber_percent,reception_percent into rules from product_commission_rules where id=1;
 perform save_product_settings_v85(rules.barber_percent,rules.reception_percent,p_goal);
 return get_commission_settings_v92();
end;$$;

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
 select r.*,case when n.seller_role is not null then n.enabled else coalesce(t.enabled,false) end as tiered,
 case when n.seller_role is not null then case when n.enabled then band_commission_total_v92(r.cumulative,n.bands,n.base_percent)-band_commission_total_v92(r.cumulative-r.sale,n.bands,n.base_percent) else r.original_commission end when coalesce(t.enabled,false) then tier_commission_total_v90(r.cumulative,t.threshold_15,t.threshold_20,t.threshold_25)-tier_commission_total_v90(r.cumulative-r.sale,t.threshold_15,t.threshold_20,t.threshold_25) else r.original_commission end as calculated_commission
 from running r left join effective_commission_tiers_v90(p_month) t on t.seller_role=r.role_key left join effective_commission_bands_v92(p_month) n on n.seller_role=r.role_key
 ) select c.id,c.user_id,c.barberxp_unit_id,c.sale,c.cost,c.original_commission,c.calculated_commission,c.sale-c.cost-c.calculated_commission,c.fixed_percent,c.tiered,c.role_key from calculated c
$$;
revoke all on function public.product_commission_lines_v90(text) from public,anon,authenticated;

create or replace function public.get_my_product_commission_v85()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_role text;v_month text;v_percent numeric;v_result jsonb;v_policy public.product_commission_tiers_v90%rowtype;v_legacy integer;v_custom public.product_commission_bands_v92%rowtype;
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
 select * into v_custom from effective_commission_bands_v92(v_month) where seller_role=v_role;
 if found then v_result:=v_result||jsonb_build_object('mode',case when v_custom.enabled then 'custom_tiered' else 'fixed' end,'tier_policy',case when v_custom.enabled then to_jsonb(v_custom) else null end);end if;
 return v_result || jsonb_build_object('legacy_sales',v_legacy);
end;$$;
revoke all on function public.get_my_product_commission_v85() from public,anon;
grant execute on function public.get_my_product_commission_v85() to authenticated;

revoke all on function public.rename_unit_v92(bigint,text,text),public.get_commission_settings_v92(),public.save_commission_settings_v92(jsonb,jsonb,numeric) from public,anon;
grant execute on function public.rename_unit_v92(bigint,text,text),public.get_commission_settings_v92(),public.save_commission_settings_v92(jsonb,jsonb,numeric) to authenticated;
revoke all on function public.effective_commission_bands_v92(text),public.band_commission_total_v92(numeric,jsonb,numeric) from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
