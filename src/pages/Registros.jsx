import {
  BadgeDollarSign,
  Beard,
  CalendarDays,
  CheckCircle2,
  Scissors,
  ShoppingBag,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

import {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { PlayerContext } from "../context/PlayerContext";

import {
  calculateLevelProgress,
  getAvailableActions,
} from "../services/xpService";

const ACTION_ICONS = {
  haircuts: Scissors,
  beards: Beard,
  extraServices: Sparkles,
  productSales: ShoppingBag,
  subscriptionSales: Star,
};

const ACTION_DESCRIPTIONS = {
  haircuts: "Registre um corte realizado.",
  beards: "Registre uma barba realizada.",
  extraServices:
    "Registre um serviço adicional realizado.",
  productSales:
    "Registre uma venda de produto.",
  subscriptionSales:
    "Registre uma nova assinatura realizada.",
};

const ACTION_SHORT_LABELS = {
  haircuts: "Cortes",
  beards: "Barbas",
  extraServices: "Serviços extras",
  productSales: "Produtos",
  subscriptionSales: "Assinaturas",
};

function getActionIcon(statKey) {
  return ACTION_ICONS[statKey] ?? BadgeDollarSign;
}

function getActionDescription(statKey) {
  return (
    ACTION_DESCRIPTIONS[statKey] ??
    "Registre esta ação e ganhe XP."
  );
}

function getActionShortLabel(statKey) {
  return ACTION_SHORT_LABELS[statKey] ?? "Ações";
}

export default function Registros() {
  const context = useContext(PlayerContext);

  const [feedback, setFeedback] = useState(null);

  const [registeringType, setRegisteringType] =
    useState(null);

  if (!context) {
    throw new Error(
      "A página Central de XP precisa estar dentro do PlayerProvider.",
    );
  }

  const { player, registerAction } = context;

  const availableActions = useMemo(
    () => getAvailableActions(),
    [],
  );

  const progress = useMemo(
    () => calculateLevelProgress(player.totalXp),
    [player.totalXp],
  );

  const nextLevel = progress.level + 1;

  const currentLevelStartXp =
    player.totalXp - progress.xpInCurrentLevel;

  const nextLevelTotalXp =
    currentLevelStartXp +
    progress.xpForCurrentLevel;

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setFeedback(null);
    }, 2500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [feedback]);

  function handleRegisterAction(action) {
    if (!action?.type || registeringType) {
      return;
    }

    try {
      setRegisteringType(action.type);

      registerAction(action.type);

      setFeedback({
        label: action.label,
        xp: action.xp,
      });
    } catch (error) {
      console.error(
        "Não foi possível registrar a ação:",
        error,
      );

      setFeedback({
        error: true,
        label:
          "Não foi possível registrar esta ação.",
      });
    } finally {
      window.setTimeout(() => {
        setRegisteringType(null);
      }, 250);
    }
  }

  function handleActionKeyDown(event, action) {
    if (
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }

    event.preventDefault();
    handleRegisterAction(action);
  }

  return (
    <main className="space-y-7">
      <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center justify-center">
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[7px] border-green-500 bg-slate-950 shadow-[0_0_35px_rgba(34,197,94,0.18)] sm:h-32 sm:w-32">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Nível
              </span>

              <strong className="mt-1 text-4xl font-black text-white">
                {String(progress.level).padStart(
                  2,
                  "0",
                )}
              </strong>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-bold text-white">
                  Progresso para o nível{" "}
                  {nextLevel}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Continue registrando suas ações para
                  evoluir.
                </p>
              </div>

              <p className="text-sm font-bold text-green-400">
                {progress.progressPercentage}%
              </p>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500 ease-out"
                style={{
                  width: `${progress.progressPercentage}%`,
                }}
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p>
                <span className="font-bold text-green-400">
                  {player.totalXp.toLocaleString(
                    "pt-BR",
                  )}{" "}
                  XP
                </span>

                <span className="text-slate-500">
                  {" "}
                  /{" "}
                  {nextLevelTotalXp.toLocaleString(
                    "pt-BR",
                  )}{" "}
                  XP
                </span>
              </p>

              <p className="text-slate-400">
                Faltam{" "}
                <span className="font-bold text-green-400">
                  {progress.xpToNextLevel.toLocaleString(
                    "pt-BR",
                  )}{" "}
                  XP
                </span>{" "}
                para o próximo nível
              </p>
            </div>
          </div>
        </div>
      </section>

      {feedback && (
        <section
          className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${
            feedback.error
              ? "border-red-500/20 bg-red-500/10 text-red-300"
              : "border-green-500/20 bg-green-500/10 text-green-300"
          }`}
        >
          <CheckCircle2 size={22} />

          <div>
            <p className="font-bold">
              {feedback.error
                ? feedback.label
                : `${feedback.label} registrado com sucesso`}
            </p>

            {!feedback.error && (
              <p className="text-sm opacity-80">
                +{feedback.xp} XP adicionado
              </p>
            )}
          </div>
        </section>
      )}

      <section>
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
              <Zap size={22} />
            </div>

            <h1 className="text-2xl font-black text-white sm:text-3xl">
              Registrar ação
            </h1>
          </div>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
            Clique ou toque em uma atividade concluída.
            O XP será adicionado automaticamente ao seu
            perfil, histórico e progresso de nível.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {availableActions.map((action) => {
            const Icon = getActionIcon(
              action.statKey,
            );

            const totalRegistered =
              Number(
                player.stats?.[action.statKey],
              ) || 0;

            const isRegistering =
              registeringType === action.type;

            const isDisabled =
              Boolean(registeringType);

            return (
              <article
                key={action.type}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                aria-disabled={isDisabled}
                aria-label={`Registrar ${action.label} e ganhar ${action.xp} XP`}
                onClick={() =>
                  handleRegisterAction(action)
                }
                onKeyDown={(event) =>
                  handleActionKeyDown(
                    event,
                    action,
                  )
                }
                className={`
                  group
                  flex
                  min-h-[280px]
                  flex-col
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-900
                  p-5
                  outline-none
                  transition-all
                  duration-200
                  ${
                    isDisabled
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:-translate-y-1 hover:scale-[1.02] hover:border-green-500/60 hover:shadow-[0_15px_40px_rgba(34,197,94,0.15)] focus-visible:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500/40 active:translate-y-0 active:scale-[0.97]"
                  }
                  ${
                    isRegistering
                      ? "border-green-500/70 bg-green-500/10"
                      : ""
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 text-green-400 transition-all duration-200 group-hover:bg-green-500 group-hover:text-slate-950">
                    <Icon size={28} />
                  </div>

                  <span className="rounded-lg border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-black text-green-400">
                    +{action.xp} XP
                  </span>
                </div>

                <h2 className="mt-5 text-lg font-black text-white">
                  {action.label}
                </h2>

                <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-400">
                  {getActionDescription(
                    action.statKey,
                  )}
                </p>

                <div className="mt-auto border-t border-slate-800 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total registrado
                  </p>

                  <div className="mt-1 flex items-end justify-between gap-3">
                    <p className="text-2xl font-black text-green-400">
                      {totalRegistered}
                    </p>

                    <span className="text-xs font-bold text-slate-500 transition-colors group-hover:text-green-400">
                      {isRegistering
                        ? "Registrando..."
                        : "Clique para registrar"}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
            <CalendarDays size={21} />
          </div>

          <div>
            <h2 className="text-lg font-black text-white">
              Resumo de hoje
            </h2>

            <p className="text-sm text-slate-400">
              Acompanhe o total registrado em cada ação.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {availableActions.map((action) => {
            const Icon = getActionIcon(
              action.statKey,
            );

            const totalRegistered =
              Number(
                player.stats?.[action.statKey],
              ) || 0;

            return (
              <div
                key={action.type}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                  <Icon size={22} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-400">
                    {getActionShortLabel(
                      action.statKey,
                    )}
                  </p>

                  <p className="text-xl font-black text-white">
                    {totalRegistered}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}