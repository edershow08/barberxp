-- Complemento v90: equipe ativa, desativação e identidade consistente.
begin;
create or replace function public.get_active_team_v90() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from profiles where id=auth.uid() and active) then raise exception 'Entre em uma conta ativa.';end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'full_name',p.full_name,'role',p.role) order by p.full_name),'[]'::jsonb) from profiles p where p.active);
end;$$;
revoke all on function public.get_active_team_v90() from public,anon;
grant execute on function public.get_active_team_v90() to authenticated;
create or replace function public.deactivate_team_member_v90(p_user uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_member public.profiles%rowtype;
begin
 if not exists(select 1 from profiles where id=auth.uid() and active and role='leader') then raise exception 'Somente o dono pode desativar colaboradores.';end if;
 select * into v_member from profiles where id=p_user for update;
 if not found then raise exception 'Colaborador não encontrado.';end if;
 if p_user=auth.uid() or v_member.role='leader' then raise exception 'O acesso do dono não pode ser desativado aqui.';end if;
 update profiles set active=false,updated_at=now() where id=p_user returning * into v_member;
 return jsonb_build_object('id',v_member.id,'full_name',v_member.full_name,'email',v_member.email,'active',false,'updated_at',v_member.updated_at);
end;$$;
revoke all on function public.deactivate_team_member_v90(uuid) from public,anon;
grant execute on function public.deactivate_team_member_v90(uuid) to authenticated;
create or replace function public.save_team_member_name_v90(p_user uuid,p_name text,p_expected_name text default null) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_member public.profiles%rowtype;
begin
 if not exists(select 1 from profiles where id=auth.uid() and active and role='leader') then raise exception 'Somente o dono pode editar colaboradores.';end if;
 select * into v_member from profiles where id=p_user and active and role in ('barber','manager') for update;
 if not found then raise exception 'Colaborador ativo não encontrado.';end if;
 if p_name is null or length(btrim(p_name)) not between 2 and 120 then raise exception 'Informe um nome de 2 a 120 caracteres.';end if;
 if p_expected_name is not null and v_member.full_name is distinct from p_expected_name and v_member.full_name is distinct from btrim(p_name) then raise exception 'O cadastro mudou em outro aparelho. Reabra a ficha antes de salvar.';end if;
 update profiles set full_name=btrim(p_name),updated_at=now() where id=p_user returning * into v_member;
 return jsonb_build_object('id',v_member.id,'full_name',v_member.full_name,'email',v_member.email,'active',v_member.active,'updated_at',v_member.updated_at);
end;$$;
revoke all on function public.save_team_member_name_v90(uuid,text,text) from public,anon;
grant execute on function public.save_team_member_name_v90(uuid,text,text) to authenticated;
create or replace function public.reject_inactive_action_v90() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from profiles where id=new.user_id and active) then raise exception 'Colaborador desativado não pode registrar novas ações.';end if;
 return new;
end;$$;
revoke all on function public.reject_inactive_action_v90() from public,anon,authenticated;
drop trigger if exists reject_inactive_action_v90 on public.barber_actions;
create trigger reject_inactive_action_v90 before insert on public.barber_actions for each row execute function public.reject_inactive_action_v90();
create or replace function public.sync_auth_identity_to_profile_v90() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_name text;v_name_changed boolean;v_active boolean;
begin
 v_name_changed:=new.raw_user_meta_data->>'full_name' is distinct from old.raw_user_meta_data->>'full_name' or new.raw_user_meta_data->>'name' is distinct from old.raw_user_meta_data->>'name' or new.raw_user_meta_data->>'barberxp_identity_revision' is distinct from old.raw_user_meta_data->>'barberxp_identity_revision';
 if new.email is not distinct from old.email and not v_name_changed then return new;end if;
 select active into v_active from profiles where id=new.id for update;
 if found and not v_active then raise exception 'Conta desativada: os dados de acesso não podem ser alterados.';end if;
 if v_name_changed then v_name:=coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'),''),nullif(btrim(new.raw_user_meta_data->>'name'),''));end if;
 update profiles set email=new.email,full_name=case when v_name is not null then v_name else full_name end,updated_at=now() where id=new.id;
 return new;
end;$$;
revoke all on function public.sync_auth_identity_to_profile_v90() from public,anon,authenticated;
drop trigger if exists sync_auth_identity_to_profile_v90 on auth.users;
create trigger sync_auth_identity_to_profile_v90 after update of email,raw_user_meta_data on auth.users for each row execute function public.sync_auth_identity_to_profile_v90();
create or replace function public.require_auth_email_v90() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_email text;
begin
 if new.email is distinct from old.email then
 select email into v_email from auth.users where id=new.id;
 if found and new.email is distinct from v_email then raise exception 'Altere o e-mail de acesso pela função administrativa.';end if;
 end if;
 return new;
end;$$;
revoke all on function public.require_auth_email_v90() from public,anon,authenticated;
drop trigger if exists require_auth_email_v90 on public.profiles;
create trigger require_auth_email_v90 before update of email on public.profiles for each row execute function public.require_auth_email_v90();
-- Corrige apenas divergências do e-mail exibido com a Autenticação; preserva nomes.
update public.profiles p set email=u.email,updated_at=now() from auth.users u where u.id=p.id and p.email is distinct from u.email;
notify pgrst,'reload schema';
commit;
