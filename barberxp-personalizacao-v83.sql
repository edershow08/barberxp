-- BarberXP v83: fotos comprimidas e apelido pessoal comprado com pontos.
-- Executar uma vez no SQL Editor. Não apaga tabelas ou dados existentes.
begin;

create table if not exists public.barberxp_photos (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  object_path text not null,
  updated_at timestamptz not null default now(),
  check (split_part(object_path, '/', 1) = user_id::text)
);
create table if not exists public.barberxp_personalization_rules (
  id integer primary key default 1 check (id = 1),
  nickname_enabled boolean not null default false,
  nickname_price integer not null default 0 check (nickname_price between 0 and 100000),
  check (not nickname_enabled or nickname_price > 0)
);
insert into public.barberxp_personalization_rules(id) values (1) on conflict do nothing;
create table if not exists public.barberxp_private_identity (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 24),
  updated_at timestamptz not null default now()
);
create table if not exists public.barberxp_nickname_purchases (
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null,
  nickname text not null,
  price integer not null,
  season_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
alter table public.barberxp_photos enable row level security;
alter table public.barberxp_personalization_rules enable row level security;
alter table public.barberxp_private_identity enable row level security;
alter table public.barberxp_nickname_purchases enable row level security;

drop policy if exists barberxp_photos_read on public.barberxp_photos;
create policy barberxp_photos_read on public.barberxp_photos for select to authenticated
using (exists (select 1 from public.profiles where id=auth.uid() and active));
drop policy if exists barberxp_photos_own on public.barberxp_photos;
create policy barberxp_photos_own on public.barberxp_photos for all to authenticated
using (user_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and active))
with check (user_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and active));
drop policy if exists barberxp_personalization_read on public.barberxp_personalization_rules;
create policy barberxp_personalization_read on public.barberxp_personalization_rules for select to authenticated using (true);
drop policy if exists barberxp_personalization_owner on public.barberxp_personalization_rules;
create policy barberxp_personalization_owner on public.barberxp_personalization_rules for update to authenticated
using (exists(select 1 from public.profiles where id=auth.uid() and role='leader' and active))
with check (exists(select 1 from public.profiles where id=auth.uid() and role='leader' and active));
drop policy if exists barberxp_identity_read_own on public.barberxp_private_identity;
create policy barberxp_identity_read_own on public.barberxp_private_identity for select to authenticated using (user_id=auth.uid());
drop policy if exists barberxp_purchases_read_own on public.barberxp_nickname_purchases;
create policy barberxp_purchases_read_own on public.barberxp_nickname_purchases for select to authenticated using (user_id=auth.uid());
grant select,insert,update,delete on public.barberxp_photos to authenticated;
grant select,update on public.barberxp_personalization_rules to authenticated;
grant select on public.barberxp_private_identity,public.barberxp_nickname_purchases to authenticated;
revoke insert,update,delete on public.barberxp_private_identity,public.barberxp_nickname_purchases from authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('barberxp-avatars','barberxp-avatars',false,102400,array['image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=102400,allowed_mime_types=array['image/jpeg'];
drop policy if exists barberxp_avatars_read on storage.objects;
create policy barberxp_avatars_read on storage.objects for select to authenticated
using (bucket_id='barberxp-avatars' and exists(select 1 from public.profiles where id=auth.uid() and active));
drop policy if exists barberxp_avatars_insert on storage.objects;
create policy barberxp_avatars_insert on storage.objects for insert to authenticated
with check (bucket_id='barberxp-avatars' and (storage.foldername(name))[1]=auth.uid()::text
and exists(select 1 from public.profiles where id=auth.uid() and active));
drop policy if exists barberxp_avatars_delete on storage.objects;
create policy barberxp_avatars_delete on storage.objects for delete to authenticated
using (bucket_id='barberxp-avatars' and (storage.foldername(name))[1]=auth.uid()::text);

-- Recusa uma gravação antiga que tentaria devolver os pontos gastos no apelido.
create or replace function public.barberxp_guard_customization_revision()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if coalesce((new.state->>'customizationRevision')::bigint,0)
     < coalesce((old.state->>'customizationRevision')::bigint,0) then
    raise exception 'Saldo mudou em outro aparelho. Atualize antes de salvar.' using errcode='40001';
  end if;
  return new;
end;
$$;
drop trigger if exists barberxp_customization_revision on public.barber_states;
create trigger barberxp_customization_revision before update on public.barber_states
for each row execute function public.barberxp_guard_customization_revision();

create or replace function public.buy_barberxp_nickname(p_nickname text,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(p_nickname);
  v_state jsonb;
  v_price integer;
  v_enabled boolean;
  v_month text := to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM');
  v_points integer;
begin
  if v_uid is null or not exists(select 1 from public.profiles where id=v_uid and active) then
    raise exception 'Entre em uma conta ativa.';
  end if;
  if p_request_id is null or v_name is null or char_length(v_name) not between 2 and 24
     or v_name ~ '[[:cntrl:]]' then raise exception 'Use um apelido entre 2 e 24 caracteres.'; end if;
  select state into v_state from public.barber_states where user_id=v_uid for update;
  if not found then raise exception 'Seu saldo ainda não foi carregado.'; end if;
  if exists(select 1 from public.barberxp_nickname_purchases where user_id=v_uid and request_id=p_request_id)
     or exists(select 1 from public.barberxp_private_identity where user_id=v_uid and nickname=v_name) then
    return jsonb_build_object('state',v_state,'nickname',(select nickname from public.barberxp_private_identity where user_id=v_uid),'charged',0);
  end if;
  select nickname_enabled,nickname_price into v_enabled,v_price
    from public.barberxp_personalization_rules where id=1 for share;
  if not coalesce(v_enabled,false) or coalesce(v_price,0)<=0 then raise exception 'A compra de apelido ainda não foi liberada pelo dono.'; end if;
  v_points := case when v_state->>'pointsMonth'=v_month then coalesce((v_state->>'points')::integer,0) else 0 end;
  if v_points<v_price then raise exception 'Pontos insuficientes para este apelido.'; end if;
  v_state := jsonb_set(v_state,'{points}',to_jsonb(v_points-v_price));
  v_state := jsonb_set(v_state,'{customizationRevision}',to_jsonb(coalesce((v_state->>'customizationRevision')::bigint,0)+1));
  update public.barber_states set state=v_state,updated_at=now() where user_id=v_uid;
  insert into public.barberxp_private_identity(user_id,nickname) values(v_uid,v_name)
  on conflict(user_id) do update set nickname=excluded.nickname,updated_at=now();
  insert into public.barberxp_nickname_purchases(user_id,request_id,nickname,price,season_key)
    values(v_uid,p_request_id,v_name,v_price,v_month);
  return jsonb_build_object('state',v_state,'nickname',v_name,'charged',v_price);
end;
$$;
revoke all on function public.buy_barberxp_nickname(text,uuid) from public,anon;
grant execute on function public.buy_barberxp_nickname(text,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
