-- BarberXP v47: notificações de resgate somente dentro do aplicativo

-- Avisos de prêmio ficam no sino e não geram push na tela bloqueada.
drop trigger if exists app_notification_push on public.app_notifications;
create trigger app_notification_push
after insert on public.app_notifications
for each row
when (coalesce(new.metadata->>'suppress_push', 'false') <> 'true')
execute function public.send_barberxp_push();

notify pgrst, 'reload schema';
