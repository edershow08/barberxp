import {
  calculateLevel,
  calculateLevelProgress,
} from "../../services/xpService";

export function getPlayerLevelData(totalXp) {
  const normalizedXp = Math.max(Number(totalXp) || 0, 0);

  return {
    level: calculateLevel(normalizedXp),
    progress: calculateLevelProgress(normalizedXp),
  };
}

export function updatePlayerLevel(player) {
  if (!player || typeof player !== "object") {
    throw new Error(
      "Jogador inválido ao atualizar o nível.",
    );
  }

  const levelData = getPlayerLevelData(player.totalXp);

  return {
    player: {
      ...player,
      level: levelData.level,
    },

    level: levelData.level,
    progress: levelData.progress,
  };
}