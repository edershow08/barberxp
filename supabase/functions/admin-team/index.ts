import { createClient } from "npm:@supabase/supabase-js@2";

// Exported factory permits isolated authorization tests without real accounts.
export function createAdminTeamHandler(makeClient: typeof createClient, readEnv: (name: string) => string | undefined) {
  const headers = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info,x-supabase-api-version","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), {status, headers});
  return async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, {status:204,headers});
    if (req.method !== "POST") return reply(405,{error:"Use POST."});
    const token = req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!token) return reply(401,{error:"Entre novamente na conta do dono."});
    try {
      const url = readEnv("SUPABASE_URL");
      let key: string | undefined;
      try { key = JSON.parse(readEnv("SUPABASE_SECRET_KEYS") || "{}").default; } catch (_) {}
      key ||= readEnv("SUPABASE_SERVICE_ROLE_KEY");
      if (!url || !key) return reply(503,{error:"A função administrativa não está configurada."});
      const admin = makeClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
      const verified = await admin.auth.getUser(token);
      if (verified.error || !verified.data?.user) return reply(401,{error:"Sessão inválida. Entre novamente."});
      const actor = await admin.from("profiles").select("id,role,active").eq("id",verified.data.user.id).single();
      if (actor.error || !actor.data?.active || actor.data.role !== "leader") return reply(403,{error:"Somente o dono pode alterar o e-mail de um colaborador."});
      const raw = await req.text();
      if (raw.length > 8192) return reply(413,{error:"Solicitação muito grande."});
      let body: Record<string, unknown>;
      try { body = JSON.parse(raw); } catch (_) { return reply(400,{error:"Dados inválidos."}); }
      const id = typeof body?.member_id === "string" ? body.member_id : "";
      const name = typeof body?.full_name === "string" ? body.full_name.trim() : "";
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || name.length<2 || name.length>120 || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400,{error:"Confira o nome e o e-mail."});
      const selected = await admin.from("profiles").select("id,full_name,email,role,active,updated_at").eq("id",id).single();
      const member = selected.data;
      if (selected.error || !member) return reply(404,{error:"Colaborador não encontrado."});
      if (!member.active || !["barber","manager"].includes(member.role)) return reply(403,{error:"Selecione um colaborador ativo da equipe."});
      const authRecord = await admin.auth.admin.getUserById(id);
      if (authRecord.error || !authRecord.data?.user) return reply(404,{error:"A conta de acesso deste colaborador não foi encontrada."});
      const actual = authRecord.data.user;
      const same = member.full_name===name && member.email?.toLowerCase()===email && actual.email?.toLowerCase()===email;
      if (same) return reply(200,{member});
      if (typeof body.expected_email!=="string" || typeof body.expected_name!=="string" || (member.email||"").toLowerCase()!==body.expected_email.trim().toLowerCase() || (member.full_name||"")!==body.expected_name) return reply(409,{error:"O cadastro mudou em outro aparelho. Reabra a ficha antes de salvar."});
      // Auth update and profile synchronization occur in the same DB transaction
      // through sync_auth_identity_to_profile_v90. Never put an admin key in HTML.
      const updated = await admin.auth.admin.updateUserById(id,{email,email_confirm:true,user_metadata:{...actual.user_metadata,full_name:name,name,barberxp_identity_revision:crypto.randomUUID()}});
      if (updated.error) {
        const duplicate = /already|registered|duplicate|exist/i.test(updated.error.message||"");
        return reply(duplicate?409:400,{error:duplicate?"Este e-mail já pertence a outra conta.":"O Supabase não confirmou a alteração. Confira os dados e tente novamente."});
      }
      const confirmed = await admin.from("profiles").select("id,full_name,email,role,active,updated_at").eq("id",id).single();
      if (confirmed.error || !confirmed.data || confirmed.data.full_name!==name || confirmed.data.email?.toLowerCase()!==email || updated.data?.user?.email?.toLowerCase()!==email) return reply(503,{error:"Alteração não confirmada. Confira se o SQL v90 atualizado foi executado e tente novamente."});
      return reply(200,{member:confirmed.data});
    } catch (_) { return reply(500,{error:"Não foi possível confirmar a alteração. Tente novamente."}); }
  };
}

// Runtime entry point. Secrets are supplied by Supabase, never by the browser.
Deno.serve(createAdminTeamHandler(createClient,(name: string)=>Deno.env.get(name)));
