-- BarberXP v57 — gestores podem registrar ocorrências com validação no banco

create or replace function public.apply_team_incident(
  p_user_id uuid,
  p_type text,
  p_xp_loss integer,
  p_point_loss integer,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor public.profiles%rowtype;
  v_target public.profiles%rowtype;
  v_state jsonb;
  v_id text := gen_random_uuid()::text;
  v_created_at timestamptz := now();
  v_xp_loss integer := greatest(0,coalesce(p_xp_loss,0));
  v_point_loss integer := greatest(0,coalesce(p_point_loss,0));
  v_incident jsonb;
begin
  select * into v_actor from public.profiles
  where id=auth.uid() and active=true and role in ('leader','manager');
  if not found then
    raise exception 'Acesso permitido somente para dono ou gestor ativo';
  end if;

  select * into v_target from public.profiles
  where id=p_user_id and active=true and role='barber';
  if not found then
    raise exception 'Barbeiro não encontrado ou inativo';
  end if;

  select state into v_state from public.barber_states
  where user_id=p_user_id for update;
  if not found then
    raise exception 'Estado do barbeiro não encontrado';
  end if;

  v_state:=coalesce(v_state,'{}'::jsonb);
  v_incident:=jsonb_build_object(
    'id',v_id,
    'type',coalesce(nullif(trim(p_type),''),'Ocorrência'),
    'person',coalesce(v_target.full_name,v_target.email,'Barbeiro'),
    'loss',-v_xp_loss,
    'pointLoss',-v_point_loss,
    'note',coalesce(p_note,''),
    'createdAt',v_created_at,
    'registeredBy',auth.uid()
  );

  v_state:=jsonb_set(v_state,'{xp}',to_jsonb(greatest(0,coalesce((v_state->>'xp')::integer,0)-v_xp_loss)),true);
  v_state:=jsonb_set(v_state,'{points}',to_jsonb(greatest(0,coalesce((v_state->>'points')::integer,0)-v_point_loss)),true);
  v_state:=jsonb_set(v_state,'{incidents}',jsonb_build_array(v_incident)||coalesce(v_state->'incidents','[]'::jsonb),true);
  v_state:=jsonb_set(v_state,'{history}',jsonb_build_array(jsonb_build_array(
    'incident',p_type,v_xp_loss,
    to_char(v_created_at at time zone 'America/Sao_Paulo','DD/MM/YYYY HH24:MI')||' • -'||v_point_loss||' pontos • Motivo: '||coalesce(nullif(trim(p_note),''),'Sem observação'),
    'minus',-v_point_loss,v_id
  ))||coalesce(v_state->'history','[]'::jsonb),true);

  update public.barber_states set state=v_state,updated_at=now()
  where user_id=p_user_id;

  return jsonb_build_object('ok',true,'state',v_state,'incident',v_incident);
end $$;

grant execute on function public.apply_team_incident(uuid,text,integer,integer,text) to authenticated;
notify pgrst, 'reload schema';
