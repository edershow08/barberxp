-- BarberXP v35: estoque de prêmios único para toda a equipe
create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  season_key text not null,
  reward_key text not null,
  reward_name text not null,
  reward_icon text not null default '🎁',
  price integer not null check (price >= 0),
  user_id uuid not null references public.profiles(id) on delete restrict,
  redeemed_at timestamptz not null default now(),
  legacy boolean not null default false,
  unique (season_key, reward_key)
);

create unique index if not exists reward_redemptions_season_name_unique
on public.reward_redemptions (season_key, lower(reward_name));

create index if not exists reward_redemptions_season_date_idx
on public.reward_redemptions (season_key, redeemed_at desc);

alter table public.reward_redemptions enable row level security;

drop policy if exists "reward_redemptions_read" on public.reward_redemptions;
create policy "reward_redemptions_read" on public.reward_redemptions
for select to authenticated
using (
  exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid() and profile.active = true
  )
);

-- Importa os resgates feitos antes da criação do estoque compartilhado.
insert into public.reward_redemptions (
  season_key, reward_key, reward_name, reward_icon, price, user_id, redeemed_at, legacy
)
select distinct on (
  coalesce(states.state->>'pointsMonth', to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM')),
  lower(case when jsonb_typeof(reward.entry) = 'string'
    then reward.entry #>> '{}'
    else coalesce(reward.entry->>'name','Prêmio resgatado') end)
)
  coalesce(states.state->>'pointsMonth', to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM')),
  case
    when jsonb_typeof(reward.entry) = 'object' and coalesce(reward.entry->>'rewardKey','') <> ''
      then reward.entry->>'rewardKey'
    else 'legacy-' || md5(lower(
      case when jsonb_typeof(reward.entry) = 'string'
        then reward.entry #>> '{}'
        else coalesce(reward.entry->>'name','Prêmio resgatado') end
    ))
  end,
  case when jsonb_typeof(reward.entry) = 'string'
    then reward.entry #>> '{}'
    else coalesce(reward.entry->>'name','Prêmio resgatado') end,
  case when jsonb_typeof(reward.entry) = 'object'
    then coalesce(reward.entry->>'icon','🎁') else '🎁' end,
  case when jsonb_typeof(reward.entry) = 'object' and coalesce(reward.entry->>'price','') ~ '^[0-9]+$'
    then (reward.entry->>'price')::integer else 0 end,
  states.user_id,
  now(),
  true
from public.barber_states states
cross join lateral jsonb_array_elements(coalesce(states.state->'rewards','[]'::jsonb)) as reward(entry)
where jsonb_array_length(coalesce(states.state->'rewards','[]'::jsonb)) > 0
order by
  coalesce(states.state->>'pointsMonth', to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM')),
  lower(case when jsonb_typeof(reward.entry) = 'string'
    then reward.entry #>> '{}'
    else coalesce(reward.entry->>'name','Prêmio resgatado') end),
  states.user_id
on conflict do nothing;

create or replace function public.redeem_team_reward(
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
begin
  if auth.uid() is null then
    return jsonb_build_object('ok',false,'code','not_authenticated');
  end if;

  if p_price < 0 or coalesce(trim(p_reward_key),'') = '' or coalesce(trim(p_reward_name),'') = '' then
    return jsonb_build_object('ok',false,'code','invalid_reward');
  end if;

  if not exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid() and profile.active = true
  ) then
    return jsonb_build_object('ok',false,'code','inactive_profile');
  end if;

  select states.state into current_state
  from public.barber_states states
  where states.user_id = auth.uid()
  for update;

  if current_state is null then
    return jsonb_build_object('ok',false,'code','state_not_found');
  end if;

  current_points := coalesce((current_state->>'points')::integer,0);
  if current_points < p_price then
    return jsonb_build_object('ok',false,'code','insufficient_points');
  end if;

  insert into public.reward_redemptions (
    season_key, reward_key, reward_name, reward_icon, price, user_id
  ) values (
    p_season_key, p_reward_key, p_reward_name, coalesce(p_reward_icon,'🎁'), p_price, auth.uid()
  )
  on conflict do nothing
  returning id, redeemed_at into redemption_id, redemption_time;

  if redemption_id is null then
    return jsonb_build_object('ok',false,'code','already_redeemed');
  end if;

  redemption_record := jsonb_build_object(
    'rewardKey',p_reward_key,
    'name',p_reward_name,
    'icon',coalesce(p_reward_icon,'🎁'),
    'price',p_price,
    'redeemedAt',redemption_time,
    'season',p_season_key
  );

  current_state := jsonb_set(current_state,'{points}',to_jsonb(current_points-p_price),true);
  current_state := jsonb_set(
    current_state,
    '{rewards}',
    coalesce(current_state->'rewards','[]'::jsonb) || jsonb_build_array(redemption_record),
    true
  );

  update public.barber_states
  set state = current_state, updated_at = now()
  where user_id = auth.uid();

  return jsonb_build_object(
    'ok',true,
    'state',current_state,
    'redemption_id',redemption_id,
    'redeemed_at',redemption_time
  );
end;
$$;

revoke all on function public.redeem_team_reward(text,text,text,integer,text) from public;
grant execute on function public.redeem_team_reward(text,text,text,integer,text) to authenticated;
grant select on public.reward_redemptions to authenticated;
notify pgrst, 'reload schema';
