import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const corsHeaders = { "content-type": "application/json" }

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: corsHeaders })
  }

  const expectedSecret = Deno.env.get("PUSH_WEBHOOK_SECRET")
  if (!expectedSecret || request.headers.get("x-webhook-secret") !== expectedSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders })
  }

  const payload = await request.json().catch(() => null)
  const notification = payload?.record
  if (!notification?.user_id) {
    return new Response(JSON.stringify({ error: "missing_notification" }), { status: 400, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")!
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")!
  if (!serviceKey || !vapidPublic || !vapidPrivate) {
    return new Response(JSON.stringify({ error: "missing_secrets" }), { status: 500, headers: corsHeaders })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("user_id", notification.user_id)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  webpush.setVapidDetails("mailto:edershow08@gmail.com", vapidPublic, vapidPrivate)
  const message = JSON.stringify({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    url: "https://barberxp.pages.dev"
  })

  let sent = 0
  for (const subscription of subscriptions ?? []) {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth }
      }, message, { TTL: 86400 })
      sent++
    } catch (pushError) {
      const status = Number((pushError as { statusCode?: number }).statusCode || 0)
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", subscription.id)
      } else {
        console.error("push_failed", status, pushError)
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), { headers: corsHeaders })
})
