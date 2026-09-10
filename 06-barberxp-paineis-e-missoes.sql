-- BarberXP v56 — meta coletiva de setembro recalibrada

insert into public.team_goals (
  month_key, products_target, subscriptions_target,
  reward_name, active, updated_at
)
values (
  '2026-09', 32, 20,
  'Pizza para toda a equipe', true, now()
)
on conflict (month_key) do update set
  products_target = 32,
  subscriptions_target = 20,
  active = true,
  updated_at = now();

notify pgrst, 'reload schema';
