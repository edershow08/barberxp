-- BarberXP v32: WhatsApp dos integrantes para envio direto de feedback
alter table public.profiles
add column if not exists phone text;

comment on column public.profiles.phone is
'Número do WhatsApp com DDI e DDD usado para envio direto de feedback pelo BarberXP';
