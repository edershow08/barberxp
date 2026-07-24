import {
  Medal,
  Trophy,
} from "lucide-react";

export default function DashboardRanking({
  player,
  position = 0,
  points = 0,
}) {
  const playerName = player?.name || "Barbeiro";
  const totalXp = Number(player?.totalXp) || 0;

  const safePosition = Number(position) || 0;
  const safePoints = Number(points) || 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-yellow-600">
            Competição da equipe
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-800">
            Sua classificação
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Continue ganhando XP para avançar no ranking.
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
          <Trophy size={25} />
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-green-950 p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xl font-bold text-slate-900">
            {safePosition > 0
              ? safePosition
              : "—"}
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-bold">
              {playerName}
            </p>

            <p className="mt-1 text-sm text-slate-300">
              {totalXp.toLocaleString("pt-BR")} XP
              acumulados
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-slate-300">
              Posição atual
            </p>

            <p className="mt-1 text-xl font-bold">
              {safePosition > 0
                ? `${safePosition}º`
                : "Sem posição"}
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-slate-300">
              Pontos
            </p>

            <p className="mt-1 text-xl font-bold">
              {safePoints.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-xl bg-yellow-50 p-4">
        <Medal
          className="shrink-0 text-yellow-600"
          size={22}
        />

        <p className="text-sm leading-5 text-yellow-900">
          Complete missões e registre serviços para subir
          na classificação.
        </p>
      </div>
    </section>
  );
}