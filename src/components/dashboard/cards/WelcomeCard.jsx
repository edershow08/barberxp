import {
  Flame,
  TrendingUp,
} from "lucide-react";

function getProgressData(levelProgress) {
  if (
    !levelProgress ||
    typeof levelProgress !== "object"
  ) {
    return {
      percentage: 0,
      xpToNextLevel: 0,
    };
  }

  const percentage =
    Number(
      levelProgress.progressPercentage ??
        levelProgress.percentage ??
        levelProgress.progress ??
        0,
    ) || 0;

  const xpToNextLevel =
    Number(
      levelProgress.xpToNextLevel ??
        levelProgress.remainingXp ??
        0,
    ) || 0;

  return {
    percentage: Math.min(
      Math.max(percentage, 0),
      100,
    ),
    xpToNextLevel: Math.max(xpToNextLevel, 0),
  };
}

export default function WelcomeCard({
  player,
  levelProgress,
}) {
  const totalXp = Number(player?.totalXp) || 0;
  const level = Number(player?.level) || 1;

  const {
    percentage,
    xpToNextLevel,
  } = getProgressData(levelProgress);

  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-green-950 via-green-900 to-slate-950 p-6 text-white shadow-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-green-200">
            Painel de desempenho
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Sua evolução no BarberXP
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Acompanhe seu nível, complete as missões do dia
            e continue avançando no ranking da equipe.
          </p>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-green-100">
                Nível atual
              </p>

              <p className="mt-1 text-3xl font-bold">
                Nível {level}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/20 text-yellow-300">
              <Flame size={26} />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-green-100">
                Progresso para o próximo nível
              </span>

              <span className="font-semibold">
                {Math.round(percentage)}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm text-green-100">
              <TrendingUp size={16} />

              {totalXp.toLocaleString("pt-BR")} XP acumulados
            </div>

            {xpToNextLevel > 0 && (
              <p className="mt-2 text-xs text-slate-300">
                Faltam {xpToNextLevel} XP para o próximo nível.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}