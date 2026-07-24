import { useEffect, useRef, useState } from "react";

import { GAME_EVENTS } from "../../game/events/eventTypes";
import {
  NOTIFICATION_TYPES,
} from "../../game/notifications/notificationEngine";
import { usePlayer } from "../../hooks/usePlayer";
import GameToast from "./GameToast";

const MAX_VISIBLE_TOASTS = 4;

export default function ToastContainer() {
  const { gameEvents } = usePlayer();

  const [visibleToasts, setVisibleToasts] = useState([]);

  const processedEventIds = useRef(new Set());

  useEffect(() => {
    if (!Array.isArray(gameEvents)) {
      return;
    }

    const newNotifications = [];

    /*
     * O PlayerContext coloca os eventos mais novos
     * no início da lista.
     *
     * Invertemos aqui para que os toasts apareçam
     * na ordem correta em que foram gerados.
     */
    [...gameEvents].reverse().forEach((event) => {
      if (
        event.type !==
        GAME_EVENTS.NOTIFICATION_CREATED
      ) {
        return;
      }

      if (processedEventIds.current.has(event.id)) {
        return;
      }

      processedEventIds.current.add(event.id);

      const notification =
        event.payload?.notification;

      if (!notification?.id) {
        return;
      }

      newNotifications.push(notification);
    });

    if (newNotifications.length === 0) {
      return;
    }

    setVisibleToasts((currentToasts) => {
      const combinedToasts = [
        ...currentToasts,
        ...newNotifications,
      ];

      return combinedToasts.slice(
        -MAX_VISIBLE_TOASTS,
      );
    });
  }, [gameEvents]);

  function handleDismiss(notificationId) {
    setVisibleToasts((currentToasts) => {
      return currentToasts.filter(
        (notification) =>
          notification.id !== notificationId,
      );
    });
  }

  function getToastDuration(notification) {
    if (
      notification.type ===
      NOTIFICATION_TYPES.LEVEL_UP
    ) {
      return 7000;
    }

    if (
      notification.type ===
        NOTIFICATION_TYPES.ACHIEVEMENT ||
      notification.type ===
        NOTIFICATION_TYPES.MISSION
    ) {
      return 6000;
    }

    return 4500;
  }

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[calc(100%-2.5rem)] flex-col items-end gap-3 sm:w-auto">
      {visibleToasts.map((notification) => (
        <GameToast
          key={notification.id}
          notification={notification}
          duration={getToastDuration(notification)}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}