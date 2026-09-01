-- BarberXP v54 — estoque mensal por quantidade e um resgate por semana

alter table public.reward_redemptions
  drop constraint if exists reward_redemptions_season_key_reward_key_key;

drop index if exists public.reward_redemptions_season_name_unique;

alter table public.reward_redemptions
  add column if not exists week_start date;

update public.reward_redemptions
set week_start = (
  (redeemed_at at time zone 'America/Sao_Paulo')::date
  - (extract(isodow from redeemed_at at time zone 'America/Sao_Paulo')::integer - 1)
)
where week_start is null;

alter table public.reward_redemptions
  alter column week_start set default public.barberxp_week_start();

create index if not exists reward_redemptions_stock_idx
on public.reward_redemptions(season_key,reward_key,redeemed_at desc);

create index if not exists reward_redemptions_user_week_idx
on public.reward_redemptions(season_key,user_id,week_start);

drop function if exists public.redeem_team_reward(text,text,text,integer,text);

create function public.redeem_team_reward(
  p_reward_key text,
  p_reward_name text,
  p_reward_icon text,
  p_price integer,
  p_season_key text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_state jsonb;
  current_points integer;
  redemption_id uuid;
  redemption_time timestamptz;
  redemption_record jsonb;
  v_week date := public.barberxp_week_start();
  v_stock integer;
  v_used integer;
  v_remaining integer;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok',false,'code','not_authenticated');
  end if;
  if p_price < 0 or coalesce(trim(p_reward_key),'')='' or coalesce(trim(p_reward_name),'')='' then
    return jsonb_build_object('ok',false,'code','invalid_reward');
  end if;
  if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true) then
    return jsonb_build_object('ok',false,'code','inactive_profile');
  end if;

  -- Evita dois resgates simultâneos do mesmo usuário ou da última unidade.
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text||':'||v_week::text));
  perform pg_advisory_xact_lock(hashtext(p_season_key||':'||p_reward_key));

  if exists(
    select 1 from public.reward_redemptions r
    where r.user_id=auth.uid() and r.season_key=p_season_key and r.week_start=v_week
  ) then
    return jsonb_build_object('ok',false,'code','weekly_limit');
  end if;

  select coalesce(
    (
      select case when coalesce(item->>'stock','') ~ '^\d+$'
        then greatest(1,(item->>'stock')::integer) else null end
      from public.app_configs c
      cross join lateral jsonb_array_elements(c.config_value) item
      where c.config_key='rewards' and lower(item->>'name')=lower(p_reward_name)
      limit 1
    ),
    case when p_price<=90 then 5 when p_price<=160 then 3 else 1 end
  ) into v_stock;

  select count(*) into v_used from public.reward_redemptions r
  where r.season_key=p_season_key
    and (r.reward_key=p_reward_key or lower(r.reward_name)=lower(p_reward_name));
  v_remaining:=greatest(0,v_stock-v_used);
  if v_remaining<=0 then
    return jsonb_build_object('ok',false,'code','out_of_stock');
  end if;

  select state into current_state from public.barber_states
  where user_id=auth.uid() for update;
  if current_state is null then return jsonb_build_object('ok',false,'code','state_not_found'); end if;
  current_points:=coalesce((current_state->>'points')::integer,0);
  if current_points<p_price then return jsonb_build_object('ok',false,'code','insufficient_points'); end if;

  insert into public.reward_redemptions(
    season_key,reward_key,reward_name,reward_icon,price,user_id,week_start
  ) values(
    p_season_key,p_reward_key,p_reward_name,coalesce(p_reward_icon,'🎁'),p_price,auth.uid(),v_week
  ) returning id,redeemed_at into redemption_id,redemption_time;

  redemption_record:=jsonb_build_object(
    'rewardKey',p_reward_key,'name',p_reward_name,'icon',coalesce(p_reward_icon,'🎁'),
    'price',p_price,'redeemedAt',redemption_time,'season',p_season_key
  );
  current_state:=jsonb_set(current_state,'{points}',to_jsonb(current_points-p_price),true);
  current_state:=jsonb_set(current_state,'{rewards}',coalesce(current_state->'rewards','[]'::jsonb)||jsonb_build_array(redemption_record),true);
  update public.barber_states set state=current_state,updated_at=now() where user_id=auth.uid();

  return jsonb_build_object(
    'ok',true,'state',current_state,'redemption_id',redemption_id,
    'redeemed_at',redemption_time,'stock_remaining',v_remaining-1
  );
end $$;

revoke all on function public.redeem_team_reward(text,text,text,integer,text) from public;
grant execute on function public.redeem_team_reward(text,text,text,integer,text) to authenticated;

notify pgrst, 'reload schema';
