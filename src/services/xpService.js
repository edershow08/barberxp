import {
  getXpRule,
  LEVEL_CONFIG,
  XP_RULES,
} from "../data/xpRules";

function createActionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEmptyStats() {
  return {
    haircuts: 0,
    beards: 0,
    extraServices: 0,
    productSales: 0,
    subscriptionSales: 0,
  };
}

export function calculateLevel(totalXp = 0) {
  const safeXp = Math.max(Number(totalXp) || 0, 0);

  return (
    LEVEL_CONFIG.initialLevel +
    Math.floor(safeXp / LEVEL_CONFIG.xpPerLevel)
  );
}

export function calculateLevelProgress(totalXp = 0) {
  const safeXp = Math.max(Number(totalXp) || 0, 0);

  const level = calculateLevel(safeXp);

  const xpInCurrentLevel =
    safeXp % LEVEL_CONFIG.xpPerLevel;

  const xpToNextLevel =
    LEVEL_CONFIG.xpPerLevel - xpInCurrentLevel;

  const progressPercentage = Math.min(
    Math.round(
      (xpInCurrentLevel / LEVEL_CONFIG.xpPerLevel) * 100,
    ),
    100,
  );

  return {
    level,
    totalXp: safeXp,
    xpInCurrentLevel,
    xpForCurrentLevel: LEVEL_CONFIG.xpPerLevel,
    xpToNextLevel,
    progressPercentage,
  };
}

export function getAvailableActions() {
  return Object.values(XP_RULES);
}

export function registerXpAction(player, actionType) {
  if (!player || typeof player !== "object") {
    throw new Error(
      "Não foi possível registrar a ação: jogador inválido.",
    );
  }

  const rule = getXpRule(actionType);

  if (!rule) {
    throw new Error(
      `Não foi possível registrar a ação: tipo "${actionType}" inválido.`,
    );
  }

  const currentTotalXp = Math.max(
    Number(player.totalXp) || 0,
    0,
  );

  const previousLevel = calculateLevel(currentTotalXp);
  const newTotalXp = currentTotalXp + rule.xp;
  const newLevel = calculateLevel(newTotalXp);

  const currentStats = {
    ...createEmptyStats(),
    ...(player.stats ?? {}),
  };

  const updatedStats = {
    ...currentStats,
    [rule.statKey]:
      (Number(currentStats[rule.statKey]) || 0) + 1,
  };

  const newHistoryItem = {
    id: createActionId(),
    type: rule.type,
    label: rule.label,
    xp: rule.xp,
    createdAt: new Date().toISOString(),
  };

  const updatedPlayer = {
    ...player,
    totalXp: newTotalXp,
    level: newLevel,
    stats: updatedStats,
    history: [
      newHistoryItem,
      ...(Array.isArray(player.history)
        ? player.history
        : []),
    ],
  };

  return {
    player: updatedPlayer,
    action: newHistoryItem,
    earnedXp: rule.xp,
    previousLevel,
    newLevel,
    leveledUp: newLevel > previousLevel,
    levelProgress: calculateLevelProgress(newTotalXp),
  };
}