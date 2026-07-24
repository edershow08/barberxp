import {
  CheckCircle2,
  Target,
} from "lucide-react";

import MissionCard from "./MissionCard";

import {
  calculateAllMissionProgress,
} from "../../../game/missions/missionEngine";

export default function DashboardMissionPanel({
  history = [],
}) {
  const safeHistory = Array.isArray(history)
    ? history
    : [];

  let missions = [];

  try {
    const result =
      calculateAllMissionProgress(
        safeHistory,
      );

    missions = Array.isArray(result)
      ? result
      : [];
  } catch (error) {
    console.error(
      "Não foi possível calcular as missões:",
      error,
    );
  }

  const completedMissions =
    missions.filter(
      (mission) => mission.completed,
    ).length;

  const allCompleted =
    missions.length > 0 &&
    completedMissions === missions.length;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
            Metas diárias
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-800">
            Missões do dia
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            O progresso aumenta conforme as ações são registradas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
            {completedMissions}/{missions.length}
          </span>

          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              allCompleted
                ? "bg-green-600 text-white"
                : "bg-green-100 text-green-700"
            }`}
          >
            {allCompleted ? (
              <CheckCircle2 size={19} />
            ) : (
              <Target size={19} />
            )}
          </div>
        </div>
      </div>

      {missions.length > 0 ? (
        <div className="grid flex-1 content-center gap-2">
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
          <Target
            className="text-slate-400"
            size={28}
          />

          <p className="mt-2 text-sm font-semibold text-slate-700">
            Nenhuma missão disponível
          </p>

          <p className="mt-1 text-xs text-slate-500">
            As missões configuradas aparecerão aqui.
          </p>
        </div>
      )}
    </section>
  );
}