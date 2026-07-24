import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { calculateLevel } from "../services/xpService";
import { getPlayerLevelData } from "../game/levels/levelEngine";
import { registerGameAction } from "../game/engine/gameEngine";

export const PlayerContext = createContext(null);

const STORAGE_KEY = "barberxp-player";

const initialPlayer = {
  id: "player-eder",
  name: "Éder",
  role: "Barbeiro",
  avatar: null,

  totalXp: 2450,
  level: calculateLevel(2450),

  points: 350,
  rankingPosition: 2,
  streak: 8,

  stats: {
    haircuts: 0,
    beards: 0,
    extraServices: 0,
    productSales: 0,
    subscriptionSales: 0,
  },

  history: [],
  missions: [],
  achievements: [],
  notifications: [],
};

function normalizePlayer(playerData) {
  const totalXp = Math.max(
    Number(playerData?.totalXp) || 0,
    0,
  );

  return {
    ...initialPlayer,
    ...(playerData ?? {}),

    totalXp,
    level: calculateLevel(totalXp),

    stats: {
      ...initialPlayer.stats,
      ...(playerData?.stats ?? {}),
    },

    history: Array.isArray(playerData?.history)
      ? playerData.history
      : [],

    missions: Array.isArray(playerData?.missions)
      ? playerData.missions
      : [],

    achievements: Array.isArray(
      playerData?.achievements,
    )
      ? playerData.achievements
      : [],

    notifications: Array.isArray(
      playerData?.notifications,
    )
      ? playerData.notifications
      : [],
  };
}

function loadPlayerFromStorage() {
  try {
    const savedPlayer =
      localStorage.getItem(STORAGE_KEY);

    if (!savedPlayer) {
      return initialPlayer;
    }

    return normalizePlayer(
      JSON.parse(savedPlayer),
    );
  } catch (error) {
    console.error(
      "Não foi possível carregar os dados do jogador:",
      error,
    );

    return initialPlayer;
  }
}

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(
    loadPlayerFromStorage,
  );

  const [
    lastActionResult,
    setLastActionResult,
  ] = useState(null);

  const [gameEvents, setGameEvents] =
    useState([]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(player),
      );
    } catch (error) {
      console.error(
        "Não foi possível salvar os dados do jogador:",
        error,
      );
    }
  }, [player]);

  const registerAction = useCallback(
    (actionType) => {
      let gameResult = null;

      setPlayer((currentPlayer) => {
        gameResult = registerGameAction(
          currentPlayer,
          actionType,
        );

        return {
          ...gameResult.player,

          notifications: [
            ...(gameResult.notifications ?? []),
            ...(currentPlayer.notifications ?? []),
          ].slice(0, 50),
        };
      });

      if (gameResult) {
        setLastActionResult(gameResult);

        setGameEvents((currentEvents) => [
          ...gameResult.events,
          ...currentEvents,
        ].slice(0, 100));
      }

      return gameResult;
    },
    [],
  );

  const clearLastActionResult =
    useCallback(() => {
      setLastActionResult(null);
    }, []);

  const clearGameEvents = useCallback(() => {
    setGameEvents([]);
  }, []);

  const markNotificationAsRead = useCallback(
    (notificationId) => {
      setPlayer((currentPlayer) => ({
        ...currentPlayer,

        notifications:
          currentPlayer.notifications.map(
            (notification) => {
              if (
                notification.id !==
                notificationId
              ) {
                return notification;
              }

              return {
                ...notification,
                read: true,
              };
            },
          ),
      }));
    },
    [],
  );

  const clearNotifications =
    useCallback(() => {
      setPlayer((currentPlayer) => ({
        ...currentPlayer,
        notifications: [],
      }));
    }, []);

  const updatePlayer = useCallback(
    (updatedData) => {
      if (
        !updatedData ||
        typeof updatedData !== "object"
      ) {
        return;
      }

      setPlayer((currentPlayer) =>
        normalizePlayer({
          ...currentPlayer,
          ...updatedData,

          stats: {
            ...currentPlayer.stats,
            ...(updatedData.stats ?? {}),
          },

          history: Array.isArray(
            updatedData.history,
          )
            ? updatedData.history
            : currentPlayer.history,
        }),
      );
    },
    [],
  );

  const resetPlayer = useCallback(() => {
    setPlayer(initialPlayer);
    setLastActionResult(null);
    setGameEvents([]);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error(
        "Não foi possível limpar os dados do jogador:",
        error,
      );
    }
  }, []);

  const levelProgress = useMemo(() => {
    return getPlayerLevelData(
      player.totalXp,
    ).progress;
  }, [player.totalXp]);

  const totalRegisteredActions =
    useMemo(() => {
      return Object.values(
        player.stats,
      ).reduce(
        (total, value) =>
          total + (Number(value) || 0),
        0,
      );
    }, [player.stats]);

  const unreadNotifications =
    useMemo(() => {
      return player.notifications.filter(
        (notification) =>
          !notification.read,
      );
    }, [player.notifications]);

  const contextValue = useMemo(
    () => ({
      player,
      levelProgress,
      lastActionResult,
      totalRegisteredActions,

      gameEvents,
      notifications: player.notifications,
      unreadNotifications,

      registerAction,
      clearLastActionResult,
      clearGameEvents,

      markNotificationAsRead,
      clearNotifications,

      updatePlayer,
      resetPlayer,
    }),
    [
      player,
      levelProgress,
      lastActionResult,
      totalRegisteredActions,
      gameEvents,
      unreadNotifications,
      registerAction,
      clearLastActionResult,
      clearGameEvents,
      markNotificationAsRead,
      clearNotifications,
      updatePlayer,
      resetPlayer,
    ],
  );

  return (
    <PlayerContext.Provider
      value={contextValue}
    >
      {children}
    </PlayerContext.Provider>
  );
}