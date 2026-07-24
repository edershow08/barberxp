import {
  Check,
  Target,
} from "lucide-react";

export default function MissionCard({
  mission,
}) {
  const target = Math.max(
    Number(mission?.target) || 0,
    0,
  );

  const progress = Math.min(
    Math.max(
      Number(mission?.progress) || 0,
      0,
    ),
    target,
  );

  const percentage =
    target > 0
      ? Math.min(
          Math.round(
            (progress / target) * 100,
          ),
          100,
        )
      : 0;

  const completed =
    mission?.completed === true;

  return (
    <article
      className={`rounded-xl border px-3 py-2.5 transition-all duration-300 ${
        completed
          ? "border-green-200 bg-green-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            completed
              ? "bg-green-600 text-white"
              : "bg-white text-slate-500"
          }`}
        >
          {completed ? (
            <Check size={16} />
          ) : (
            <Target size={16} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-800">
                {mission?.title ||
                  "Missão diária"}
              </h3>

              <p className="truncate text-xs text-slate-500">
                {mission?.description ||
                  "Complete esta missão hoje."}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
                completed
                  ? "bg-green-600 text-white"
                  : "bg-white text-slate-600"
              }`}
            >
              {completed
                ? "Concluída"
                : `${progress}/${target}`}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completed
                    ? "bg-green-600"
                    : "bg-gradient-to-r from-green-700 to-green-500"
                }`}
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>

            <span className="w-9 shrink-0 text-right text-xs font-semibold text-slate-500">
              {percentage}%
            </span>
          </div>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-xs font-bold text-green-700">
            +{Number(mission?.rewardXp) || 0} XP
          </p>

          <p className="mt-0.5 text-[11px] text-slate-500">
            +{Number(
              mission?.rewardPoints,
            ) || 0} pontos
          </p>
        </div>
      </div>
    </article>
  );
}