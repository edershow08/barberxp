function createNotificationId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `notification-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export const NOTIFICATION_TYPES = Object.freeze({
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  LEVEL_UP: "level-up",
  ACHIEVEMENT: "achievement",
  MISSION: "mission",
});

export function createNotification({
  title,
  message,
  type = NOTIFICATION_TYPES.INFO,
  eventType = null,
  metadata = {},
}) {
  if (!title || !message) {
    throw new Error(
      "Título e mensagem são obrigatórios para criar uma notificação.",
    );
  }

  return {
    id: createNotificationId(),
    title,
    message,
    type,
    eventType,
    metadata,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

export function createActionNotification(action, earnedXp) {
  return createNotification({
    title: `${action.label} registrado`,
    message: `Você conquistou +${earnedXp} XP.`,
    type: NOTIFICATION_TYPES.SUCCESS,
    eventType: "ACTION_REGISTERED",
    metadata: {
      actionId: action.id,
      actionType: action.type,
      earnedXp,
    },
  });
}

export function createLevelUpNotification(level) {
  return createNotification({
    title: "Novo nível alcançado",
    message: `Parabéns! Você chegou ao nível ${level}.`,
    type: NOTIFICATION_TYPES.LEVEL_UP,
    eventType: "LEVEL_UP",
    metadata: {
      level,
    },
  });
}