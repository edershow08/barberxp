import { registerXpAction } from "../../services/xpService";

import { checkAchievements } from "../achievements/achievementEngine";
import { GAME_EVENTS } from "../events/eventTypes";
import { updatePlayerLevel } from "../levels/levelEngine";
import { checkMissions } from "../missions/missionEngine";
import {
  createActionNotification,
  createLevelUpNotification,
} from "../notifications/notificationEngine";
import { updateRanking } from "../ranking/rankingEngine";

function createGameEvent(type, payload = {}) {
  return {
    id: `event-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`,

    type,
    payload,
    createdAt: new Date().toISOString(),
  };
}

export function registerGameAction(player, actionType) {
  if (!player || typeof player !== "object") {
    throw new Error(
      "Não foi possível registrar a ação: jogador inválido.",
    );
  }

  if (!actionType) {
    throw new Error(
      "Não foi possível registrar a ação: tipo não informado.",
    );
  }

  const previousPlayer = player;

  /*
   * 1. Registra a ação, o XP, as estatísticas
   * e o histórico usando o serviço já existente.
   */
  const xpResult = registerXpAction(
    previousPlayer,
    actionType,
  );

  /*
   * 2. Garante que o nível e o progresso estejam atualizados.
   */
  const levelResult = updatePlayerLevel(
    xpResult.player,
  );

  let currentPlayer = levelResult.player;

  /*
   * 3. Verifica missões.
   */
  const missionResult = checkMissions({
    previousPlayer,
    currentPlayer,
    action: xpResult.action,
  });

  currentPlayer =
    missionResult.player ?? currentPlayer;

  /*
   * 4. Verifica conquistas.
   */
  const achievementResult = checkAchievements({
    previousPlayer,
    currentPlayer,
    action: xpResult.action,
  });

  currentPlayer =
    achievementResult.player ?? currentPlayer;

  /*
   * 5. Atualiza ranking.
   */
  const rankingResult = updateRanking(
    currentPlayer,
  );

  currentPlayer =
    rankingResult.player ?? currentPlayer;

  /*
   * 6. Cria os eventos gerados pela ação.
   */
  const events = [
    createGameEvent(
      GAME_EVENTS.ACTION_REGISTERED,
      {
        action: xpResult.action,
      },
    ),

    createGameEvent(GAME_EVENTS.XP_GAINED, {
      value: xpResult.earnedXp,
      totalXp: currentPlayer.totalXp,
      actionId: xpResult.action.id,
    }),
  ];

  if (xpResult.leveledUp) {
    events.push(
      createGameEvent(GAME_EVENTS.LEVEL_UP, {
        previousLevel:
          xpResult.previousLevel,
        newLevel: xpResult.newLevel,
      }),
    );
  }

  events.push(
    ...(missionResult.events ?? []),
    ...(achievementResult.events ?? []),
    ...(rankingResult.events ?? []),
  );

  /*
   * 7. Cria notificações para a interface.
   */
  const notifications = [
    createActionNotification(
      xpResult.action,
      xpResult.earnedXp,
    ),
  ];

  if (xpResult.leveledUp) {
    notifications.push(
      createLevelUpNotification(
        xpResult.newLevel,
      ),
    );
  }

  notifications.forEach((notification) => {
    events.push(
      createGameEvent(
        GAME_EVENTS.NOTIFICATION_CREATED,
        {
          notification,
        },
      ),
    );
  });

  /*
   * Mantemos também os campos antigos para não quebrar
   * a página Registrar Ação.
   */
  return {
    player: currentPlayer,

    action: xpResult.action,
    earnedXp: xpResult.earnedXp,

    previousLevel: xpResult.previousLevel,
    newLevel: xpResult.newLevel,
    leveledUp: xpResult.leveledUp,
    levelProgress: levelResult.progress,

    events,
    notifications,

    missions: {
      updated:
        missionResult.updatedMissions ?? [],
      completed:
        missionResult.completedMissions ?? [],
    },

    achievements: {
      unlocked:
        achievementResult.unlockedAchievements ??
        [],
    },

    ranking: {
      previousPosition:
        rankingResult.previousPosition,
      currentPosition:
        rankingResult.currentPosition,
      changed: rankingResult.changed,
    },
  };
}