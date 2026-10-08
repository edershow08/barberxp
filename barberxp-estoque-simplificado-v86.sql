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
