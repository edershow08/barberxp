-- BarberXP v47: notificações internas de resgate e controle de entrega

alter table public.reward_redemptions
  add column if not exists delivered_at timestamptz,
  add column if not exists delivered_by uuid references public.profiles(id) on delete set null;

-- Resgates anteriores à atualização não entram como pendência retroativa.
update public.reward_redemptions
set delivered_at = redeemed_at,
    delivered_by = user_id
where delivered_at is null;

create or replace function public.mark_reward_delivered(p_redemption_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'code', 'not_authenticated');
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.active = true
      and profile.role in ('leader', 'manager')
  ) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  update public.reward_redemptions
  set delivered_at = coalesce(delivered_at, now()),
      delivered_by = coalesce(delivered_by, auth.uid())
  where id = p_redemption_id
  returning id into updated_id;

  if updated_id is null then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  return jsonb_build_object('ok', true, 'redemption_id', updated_id);
end;
$$;

revoke all on function public.mark_reward_delivered(uuid) from public;
grant execute on function public.mark_reward_delivered(uuid) to authenticated;

-- Avisos de prêmio ficam somente no sino do aplicativo, sem push externo.
drop trigger if exists app_notification_push on public.app_notifications;
create trigger app_notification_push
after insert on public.app_notifications
for each row
when (coalesce(new.metadata->>'suppress_push', 'false') <> 'true')
execute function public.send_barberxp_push();

grant select on public.reward_redemptions to authenticated;
notify pgrst, 'reload schema';
