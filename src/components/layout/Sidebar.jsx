import {
  Gift,
  Home,
  LogOut,
  Scissors,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { usePlayer } from "../../hooks/usePlayer";

import { calculateLevelProgress } from "../../services/xpService";

const menuItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: Home,
  },
  {
    name: "Registrar Ação",
    path: "/actions",
    icon: Zap,
  },
  {
    name: "Ranking",
    path: "/ranking",
    icon: Trophy,
  },
  {
    name: "Loja de Prêmios",
    path: "/store",
    icon: Gift,
  },
  {
    name: "Meu Perfil",
    path: "/profile",
    icon: UserRound,
  },
];

export default function Sidebar() {
  const { player } = usePlayer();

  const totalXp =
    Number(player?.totalXp) || 0;

  const levelProgress =
    calculateLevelProgress(totalXp);

  const level =
    Number(
      levelProgress?.level ??
        player?.level ??
        1,
    ) || 1;

  const xpInCurrentLevel =
    Number(
      levelProgress?.xpInCurrentLevel,
    ) || 0;

  const xpForCurrentLevel =
    Number(
      levelProgress?.xpForCurrentLevel,
    ) || 0;

  const xpToNextLevel =
    Number(
      levelProgress?.xpToNextLevel,
    ) || 0;

  const progressPercentage = Math.min(
    Math.max(
      Number(
        levelProgress?.progressPercentage,
      ) || 0,
      0,
    ),
    100,
  );

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 lg:flex">
      <div className="flex min-h-screen flex-col">
        <div className="border-b border-slate-800 px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10 text-green-400">
              <Scissors
                size={22}
                strokeWidth={2}
              />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-wide text-white">
                EDERSHOW
              </h1>

              <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                Performance Hub
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-600">
            Menu
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    [
                      "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-200",
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-green-500" />
                      )}

                      <Icon
                        size={20}
                        strokeWidth={
                          isActive
                            ? 2.2
                            : 1.8
                        }
                        className={
                          isActive
                            ? "text-green-400"
                            : "text-slate-500"
                        }
                      />

                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="px-4 pb-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Seu progresso
                </p>

                <p className="mt-1 text-base font-semibold text-white">
                  Nível {level}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-sm font-bold text-green-400">
                {String(level).padStart(
                  2,
                  "0",
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-green-400">
                  {xpInCurrentLevel.toLocaleString(
                    "pt-BR",
                  )}{" "}
                  XP
                </span>

                <span className="text-slate-500">
                  {xpForCurrentLevel.toLocaleString(
                    "pt-BR",
                  )}{" "}
                  XP
                </span>
              </div>

              <div
                className="h-2 overflow-hidden rounded-full bg-slate-800"
                role="progressbar"
                aria-label={`Progresso do nível ${level}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(
                  progressPercentage,
                )}
              >
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Faltam{" "}
                  <span className="font-semibold text-slate-300">
                    {xpToNextLevel.toLocaleString(
                      "pt-BR",
                    )}{" "}
                    XP
                  </span>
                </p>

                <span className="text-xs font-bold text-green-400">
                  {Math.round(
                    progressPercentage,
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 p-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-900 hover:text-slate-200"
          >
            <LogOut
              size={19}
              strokeWidth={1.8}
            />

            Sair
          </button>

          <p className="mt-4 text-center text-xs text-slate-700">
            BarberXP versão 1.0
          </p>
        </div>
      </div>
    </aside>
  );
}