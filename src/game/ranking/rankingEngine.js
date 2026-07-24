export function updateRanking(player) {
  if (!player || typeof player !== "object") {
    throw new Error(
      "Jogador inválido ao atualizar o ranking.",
    );
  }

  /*
   * Nesta primeira versão, a posição continua sendo mantida
   * no próprio jogador.
   *
   * Quando o Supabase for integrado, este módulo comparará
   * todos os barbeiros da equipe.
   */

  return {
    player,
    previousPosition: player.rankingPosition ?? null,
    currentPosition: player.rankingPosition ?? null,
    changed: false,
    events: [],
  };
}