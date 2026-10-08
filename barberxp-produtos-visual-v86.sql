-- BarberXP v86: configuracao completa desta atualizacao. Nao apaga dados.
begin;
create table if not exists public.product_save_requests_v85 (
  user_id uuid not null references public.profiles(id),request_id uuid not null,
  result jsonb not null,primary key(user_id,request_id)
);
alter table public.product_save_requests_v85 enable row level security;
revoke all on public.product_save_requests_v85 from authenticated,anon;
create or replace function public.save_product_v85(p_id bigint,p_name text,p_sale numeric,p_cost numeric,p_quantity integer,p_request uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_product public.products%rowtype;v_result jsonb;v_entry bigint;
begin
 if not exists(select 1 from profiles where id=auth.uid() and active and role in ('leader','manager')) then raise exception 'Acesso permitido somente para dono e gestor.';end if;
 if p_request is null then raise exception 'Identificador obrigatório.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_request::text,0));
 select result into v_result from product_save_requests_v85 where user_id=auth.uid() and request_id=p_request;
 if found then return v_result;end if;
 if p_name is null or btrim(p_name)='' or char_length(p_name)>120 or p_sale is null or p_cost is null or p_sale<0 or p_cost<0 or p_sale::text in ('NaN','Infinity','-Infinity') or p_cost::text in ('NaN','Infinity','-Infinity') or p_quantity is null or p_quantity<0 then raise exception 'Confira nome, preços e quantidade.';end if;
 if p_id is null then
 insert into products(name,sale_price,cost_price,active,created_by,updated_at) values(btrim(p_name),round(p_sale,2),round(p_cost,2),true,auth.uid(),now()) returning * into v_product;
 else
 update products set name=btrim(p_name),sale_price=round(p_sale,2),cost_price=round(p_cost,2),updated_at=now() where id=p_id and active returning * into v_product;
 if not found then raise exception 'Produto não encontrado no catálogo.';end if;
 end if;
 if p_quantity>0 then insert into product_stock_entries(product_id,quantity,created_by,note) values(v_product.id,p_quantity,auth.uid(),'Entrada junto ao cadastro do produto') returning id into v_entry;end if;
 v_result:=jsonb_build_object('product',to_jsonb(v_product),'entry_id',v_entry,'quantity_added',p_quantity);
 insert into product_save_requests_v85 values(auth.uid(),p_request,v_result);
 return v_result;
end;$$;
revoke all on function public.save_product_v85(bigint,text,numeric,numeric,integer,uuid) from public,anon;
grant execute on function public.save_product_v85(bigint,text,numeric,numeric,integer,uuid) to authenticated;
create or replace function public.save_product_settings_v85(p_barber numeric,p_reception numeric,p_goal numeric)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from profiles where id=auth.uid() and active and role='leader') then raise exception 'Alteração exclusiva do dono.';end if;
 if p_barber is null or p_reception is null or p_goal is null or p_barber not between 0 and 100 or p_reception not between 0 and 100 or p_goal<0 or p_goal::text in ('NaN','Infinity','-Infinity') then raise exception 'Confira os percentuais e a meta.';end if;
 update product_commission_rules set barber_percent=round(p_barber,2),reception_percent=round(p_reception,2),updated_at=now() where id=1;
 update game_strategy set monthly_product_profit_goal=round(p_goal,2),updated_by=auth.uid(),updated_at=now() where id=1;
 return (select to_jsonb(r) from product_commission_rules r where id=1);
end;$$;
revoke all on function public.save_product_settings_v85(numeric,numeric,numeric) from public,anon;
grant execute on function public.save_product_settings_v85(numeric,numeric,numeric) to authenticated;
create or replace function public.get_my_product_commission_v85()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_role text;v_month text;v_start timestamptz;v_end timestamptz;v_percent numeric;v_total numeric;v_count integer;v_legacy integer;v_rates jsonb;
begin
 select role into v_role from profiles where id=auth.uid() and active;
 if not found then raise exception 'Entre em uma conta ativa para consultar sua comissão.';end if;
 v_month:=to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM');
 v_start:=date_trunc('month',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
 v_end:=(date_trunc('month',now() at time zone 'America/Sao_Paulo')+interval '1 month') at time zone 'America/Sao_Paulo';
 select case when v_role='manager' then reception_percent else barber_percent end into v_percent from product_commission_rules where id=1;
 select coalesce(sum((a.metadata->>'commission_amount')::numeric),0),count(*),coalesce(jsonb_agg(distinct (a.metadata->>'commission_percent')::numeric),'[]'::jsonb)
 into v_total,v_count,v_rates from barber_actions a
 where a.user_id=auth.uid() and a.action_key='produtos' and a.status='approved' and a.created_at>=v_start and a.created_at<v_end
 and a.metadata->>'financial_version'='84' and jsonb_typeof(a.metadata->'commission_amount')='number' and jsonb_typeof(a.metadata->'commission_percent')='number';
 select count(*) into v_legacy from barber_actions a
 where a.user_id=auth.uid() and a.action_key='produtos' and a.status='approved' and a.created_at>=v_start and a.created_at<v_end
 and not coalesce(a.metadata->>'financial_version'='84' and jsonb_typeof(a.metadata->'commission_amount')='number' and jsonb_typeof(a.metadata->'commission_percent')='number',false);
 return jsonb_build_object('month',v_month,'current_percent',v_percent,'commission_amount',round(v_total,2),'approved_sales',v_count,'legacy_sales',v_legacy,'applied_rates',v_rates);
end;$$;
revoke all on function public.get_my_product_commission_v85() from public,anon;
grant execute on function public.get_my_product_commission_v85() to authenticated;
notify pgrst,'reload schema';
commit;

begin;
create or replace function public.add_product_stock_v86(p_product_id bigint,p_quantity integer,p_request uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_product public.products%rowtype;v_entry bigint;v_result jsonb;
begin
 if not exists(select 1 from profiles where id=auth.uid() and active and role in ('leader','manager')) then raise exception 'Acesso permitido somente para dono e gestor.';end if;
 if p_request is null or p_quantity is null or p_quantity<1 then raise exception 'Informe uma quantidade inteira maior que zero.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_request::text,0));
 select result into v_result from product_save_requests_v85 where user_id=auth.uid() and request_id=p_request;
 if found then return v_result;end if;
 select * into v_product from products where id=p_product_id and active for update;
 if not found then raise exception 'Selecione um produto ativo do catálogo.';end if;
 insert into product_stock_entries(product_id,quantity,created_by,note) values(v_product.id,p_quantity,auth.uid(),'Reposição de estoque') returning id into v_entry;
 v_result:=jsonb_build_object('product',to_jsonb(v_product),'entry_id',v_entry,'quantity_added',p_quantity);
 insert into product_save_requests_v85 values(auth.uid(),p_request,v_result);
 return v_result;
end;$$;
revoke all on function public.add_product_stock_v86(bigint,integer,uuid) from public,anon;
grant execute on function public.add_product_stock_v86(bigint,integer,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
