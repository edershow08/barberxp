self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "BarberXP",
    message: "Você recebeu uma nova notificação.",
    url: "/",
  };

  try {
    data = { ...data, ...event.data.json() };
  } catch (_) {
    // Mantém a mensagem padrão quando o push não tiver JSON.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `barberxp-${data.id || Date.now()}`,
      data: { url: data.url || "/" },
      vibrate: [180, 80, 180],
      requireInteraction: data.type === "pending",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        if (windows[0]) {
          return windows[0].focus().then((client) => client.navigate(targetUrl));
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
