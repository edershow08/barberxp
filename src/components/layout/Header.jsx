import {
  Bell,
  Flame,
  Trophy,
  Zap,
} from "lucide-react";

import { useLocation } from "react-router-dom";

import { usePlayer } from "../../hooks/usePlayer";

function getProgressPercentage(levelProgress) {
  if (typeof levelProgress === "number") {
    return Math.min(
      Math.max(levelProgress, 0),
      100,
    );
  }

  if (
    levelProgress &&
    typeof levelProgress === "object"
  ) {
    const percentage =
      levelProgress.percentage ??
      levelProgress.percent ??
      levelProgress.progress;

    if (typeof percentage === "number") {
      return Math.min(
        Math.max(percentage, 0),
        100,
      );
    }

    const current =
      Number(
        levelProgress.currentXp ??
          levelProgress.current ??
          0,
      ) || 0;

    const target =
      Number(
        levelProgress.requiredXp ??
          levelProgress.required ??
          levelProgress.target ??
          0,
      ) || 0;

    if (target > 0) {
      return Math.min(
        Math.max((current / target) * 100, 0),
        100,
      );
    }
  }

  return 0;
}

export default function Header() {
  const location = useLocation();

  const {
    player,
    levelProgress,
    unreadNotifications,
  } = usePlayer();

  const isCentralXpPage =
    location.pathname === "/actions" ||
    location.pathname === "/registros";

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Bom dia"
      : hour < 18
        ? "Boa tarde"
        : "Boa noite";

  const playerName =
    player?.name || "Barbeiro";

  const rankingPosition =
    Number(player?.rankingPosition) || 0;

  const totalXp =
    Number(player?.totalXp) || 0;

  const streak =
    Number(player?.streak) || 0;

  const level =
    Number(player?.level) || 1;

  const progress = Math.round(
    getProgressPercentage(levelProgress),
  );

  const unreadCount = Array.isArray(
    unreadNotifications,
  )
    ? unreadNotifications.length
    : 0;

  return (
    <header className="border-b border-slate-800 bg-slate-900 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-green-400">
            BarberXP
          </p>

          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            {greeting}, {playerName} 👋
          </h1>

          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            {isCentralXpPage
              ? "Registre suas ações e continue evoluindo todos os dias."
              : "Continue assim. Você está evoluindo todos os dias."}
          </p>
        </div>

        <button
          type="button"
          aria-label={`Notificações: ${unreadCount} não lidas`}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 transition hover:border-slate-600 hover:bg-slate-700"
        >
          <Bell
            size={20}
            className="text-slate-300"
          />

          {unreadCount > 0 && (
            <>
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-slate-800" />

              <span className="sr-only">
                {unreadCount} notificações não lidas
              </span>
            </>
          )}
        </button>
      </div>

      {!isCentralXpPage && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <HeaderCard
            icon={
              <Trophy
                className="text-yellow-400"
                size={22}
              />
            }
            iconBackground="bg-yellow-500/10"
            label="Ranking"
            value={
              rankingPosition > 0
                ? `#${rankingPosition}`
                : "Sem posição"
            }
            description={
              rankingPosition === 1
                ? "Você está liderando o ranking da equipe."
                : "Continue ganhando XP para avançar no ranking."
            }
          />

          <HeaderCard
            icon={
              <Zap
                className="text-green-400"
                size={22}
              />
            }
            iconBackground="bg-green-500/10"
            label={`Nível ${level}`}
            value={`${progress}% concluído`}
            description={`${totalXp.toLocaleString(
              "pt-BR",
            )} XP acumulados até agora.`}
            progress={progress}
          />

          <HeaderCard
            icon={
              <Flame
                className="text-red-400"
                size={22}
              />
            }
            iconBackground="bg-red-500/10"
            label="Sequência"
            value={`${streak} ${
              streak === 1 ? "dia" : "dias"
            }`}
            description={
              streak > 0
                ? "Mantenha sua sequência de produtividade."
                : "Registre uma ação para iniciar sua sequência."
            }
          />
        </div>
      )}
    </header>
  );
}

function HeaderCard({
  icon,
  iconBackground,
  label,
  value,
  description,
  progress,
}) {
  const hasProgress =
    typeof progress === "number";

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-800 p-5 transition hover:border-slate-700">
      <div className="flex items-center gap-3">
        <div
          className={`rounded-xl p-3 ${iconBackground}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-wider text-slate-500">
            {label}
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            {value}
          </h2>
        </div>
      </div>

      {hasProgress && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{
              width: `${Math.min(
                Math.max(progress, 0),
                100,
              )}%`,
            }}
          />
        </div>
      )}

      <p className="mt-4 text-sm leading-5 text-slate-400">
        {description}
      </p>
    </article>
  );
}