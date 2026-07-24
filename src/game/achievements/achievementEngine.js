export function checkAchievements({
  previousPlayer,
  currentPlayer,
  action,
}) {
  if (!previousPlayer || !currentPlayer || !action) {
    return {
      player: currentPlayer,
      events: [],
      unlockedAchievements: [],
    };
  }

  /*
   * As conquistas reais serão implementadas na Sprint 5.4.
   *
   * O módulo já está preparado para receber regras como:
   * primeira venda;
   * 100 cortes;
   * 30 dias sem atrasos;
   * quantidade de assinaturas vendidas.
   */

  return {
    player: currentPlayer,
    events: [],
    unlockedAchievements: [],
  };
}