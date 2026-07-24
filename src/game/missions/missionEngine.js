import {
  getActiveMissions,
} from "./missions.js";

function createLocalDateKey(
  dateValue = new Date(),
) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isActionFromToday(action) {
  const actionDate =
    action?.createdAt ??
    action?.date ??
    action?.timestamp;

  if (!actionDate) {
    return false;
  }

  return (
    createLocalDateKey(actionDate) ===
    createLocalDateKey()
  );
}

function getActionType(action) {
  if (
    !action ||
    typeof action !== "object"
  ) {
    return null;
  }

  return (
    action.actionType ??
    action.type ??
    action.action_type ??
    null
  );
}

function getPlayerHistory(player) {
  if (
    !player ||
    typeof player !== "object"
  ) {
    return [];
  }

  if (Array.isArray(player.history)) {
    return player.history;
  }

  if (Array.isArray(player.actions)) {
    return player.actions;
  }

  if (
    Array.isArray(
      player.actionHistory,
    )
  ) {
    return player.actionHistory;
  }

  return [];
}

function missionAcceptsAction(
  mission,
  actionType,
) {
  if (!actionType) {
    return false;
  }

  if (
    mission.actionType === actionType
  ) {
    return true;
  }

  return (
    Array.isArray(mission.actionTypes) &&
    mission.actionTypes.includes(actionType)
  );
}

export function calculateMissionProgress(
  mission,
  history = [],
) {
  const safeHistory = Array.isArray(history)
    ? history
    : [];

  const todayHistory =
    safeHistory.filter(
      isActionFromToday,
    );

  const progress =
    todayHistory.filter((item) => {
      return missionAcceptsAction(
        mission,
        getActionType(item),
      );
    }).length;

  const target = Math.max(
    Number(mission.target) || 0,
    0,
  );

  const safeProgress = Math.min(
    progress,
    target,
  );

  return {
    ...mission,
    dateKey: createLocalDateKey(),
    progress: safeProgress,
    completed:
      target > 0 &&
      safeProgress >= target,
  };
}

export function calculateAllMissionProgress(
  history = [],
) {
  return getActiveMissions().map(
    (mission) =>
      calculateMissionProgress(
        mission,
        history,
      ),
  );
}

function normalizeSavedMission(
  mission,
  savedMission,
) {
  const todayKey =
    createLocalDateKey();

  if (
    !savedMission ||
    savedMission.dateKey !== todayKey
  ) {
    return {
      ...mission,
      dateKey: todayKey,
      progress: 0,
      completed: false,
    };
  }

  return {
    ...mission,
    ...savedMission,
    dateKey: todayKey,
  };
}

function updateMissionWithAction(
  mission,
  actionType,
  savedMission,
) {
  const normalizedMission =
    normalizeSavedMission(
      mission,
      savedMission,
    );

  const target = Math.max(
    Number(mission.target) || 0,
    0,
  );

  const previousProgress = Math.max(
    Number(
      normalizedMission.progress,
    ) || 0,
    0,
  );

  const wasCompleted =
    normalizedMission.completed === true;

  const acceptsAction =
    missionAcceptsAction(
      mission,
      actionType,
    );

  const nextProgress =
    acceptsAction && !wasCompleted
      ? Math.min(
          previousProgress + 1,
          target,
        )
      : previousProgress;

  return {
    ...mission,
    dateKey: createLocalDateKey(),
    progress: nextProgress,
    completed:
      wasCompleted ||
      (target > 0 &&
        nextProgress >= target),
  };
}

export function checkMissions({
  previousPlayer,
  currentPlayer,
  action,
} = {}) {
  const safeCurrentPlayer =
    currentPlayer &&
    typeof currentPlayer === "object"
      ? currentPlayer
      : {};

  const safePreviousPlayer =
    previousPlayer &&
    typeof previousPlayer === "object"
      ? previousPlayer
      : {};

  const actionType =
    getActionType(action);

  const previousMissions =
    Array.isArray(
      safePreviousPlayer.missions,
    )
      ? safePreviousPlayer.missions
      : [];

  const currentMissions =
    Array.isArray(
      safeCurrentPlayer.missions,
    )
      ? safeCurrentPlayer.missions
      : previousMissions;

  const activeMissions =
    getActiveMissions();

  const updatedMissions =
    activeMissions.map((mission) => {
      const savedMission =
        currentMissions.find(
          (item) =>
            item.id === mission.id,
        ) ??
        previousMissions.find(
          (item) =>
            item.id === mission.id,
        );

      return updateMissionWithAction(
        mission,
        actionType,
        savedMission,
      );
    });

  const completedMissions =
    updatedMissions.filter(
      (mission) => {
        const previousMission =
          previousMissions.find(
            (item) =>
              item.id === mission.id,
          );

        const normalizedPrevious =
          normalizeSavedMission(
            mission,
            previousMission,
          );

        return (
          mission.completed &&
          !normalizedPrevious.completed
        );
      },
    );

  const player = {
    ...safeCurrentPlayer,
    missions: updatedMissions,
  };

  return {
    player,
    events: [],
    updatedMissions,
    completedMissions,
  };
}

export function getPlayerMissions(
  player = {},
) {
  return calculateAllMissionProgress(
    getPlayerHistory(player),
  );
}