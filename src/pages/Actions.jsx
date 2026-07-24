import { useEffect, useState } from "react";
import {
  CheckCircle2,
  History,
  Trophy,
  X,
  Zap,
} from "lucide-react";

import ActionGrid from "../components/actions/ActionGrid";
import { usePlayer } from "../hooks/usePlayer";

export default function Actions() {
  const {
    player,
    levelProgress,
    registerAction,
    lastActionResult,
    clearLastActionResult,
    totalRegisteredActions,
  } = usePlayer();

  const [registeringAction, setRegisteringAction] =
    useState(null);

  const [lastRegisteredAction, setLastRegisteredAction] =
    useState(null);

  useEffect(() => {
    if (!lastActionResult) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      clearLastActionResult();
      setLastRegisteredAction(null);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [lastActionResult, clearLastActionResult]);

  function handleRegisterAction(actionType) {
    if (registeringAction) {
      return;
    }

    try {
      setRegisteringAction(actionType);

      const result = registerAction(actionType);

      setLastRegisteredAction(actionType);

      return result;
    } catch (error) {
      console.error("Erro ao registrar ação:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a ação.",
      );

      return null;
    } finally {
      setRegisteringAction(null);
    }
  }

  function handleCloseNotification() {
    clearLastActionResult();
    setLastRegisteredAction(null);
  }

  return (
    <div className="space-y-6">
      {lastActionResult && (
        <section
          className={`relative overflow-hidden rounded-3xl border p-6 ${
            lastActionResult.leveledUp
              ? "border-green-400/50 bg-green-500/10"
              : "border-green-500/30 bg-green-500/5"
          }`}
        >
          <button
            type="button"
            onClick={handleCloseNotification}
            aria-label="Fechar notificação"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-green-300 transition hover:bg-green-500/10 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col gap-5 pr-10 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-500 text-slate-950">
              {lastActionResult.leveledUp ? (
                <Trophy size={27} />
              ) : (
                <CheckCircle2 size={27} />
              )}
            </div>

            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-green-400">
                {lastActionResult.leveledUp
                  ? "Novo nível alcançado"
                  : "Ação registrada"}
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white">
                {lastActionResult.action.label} concluído!
              </h2>

              <p className="mt-2 text-sm text-green-100/70">
                Você conquistou{" "}
                <strong className="text-green-400">
                  +{lastActionResult.earnedXp} XP
                </strong>
                {lastActionResult.leveledUp &&
                  ` e chegou ao nível ${lastActionResult.newLevel}.`}
              </p>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-slate-950/50 px-5 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                XP total
              </p>

              <p className="mt-1 text-2xl font-bold text-white">
                {player.totalXp.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5">
              <Zap size={15} className="text-green-400" />

              <span className="text-xs font-bold uppercase tracking-wider text-green-400">
                Área do barbeiro
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">
              Registrar ação
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Selecione uma atividade concluída. O XP será adicionado
              automaticamente ao seu perfil, histórico e progresso de nível.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                XP total
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                {player.totalXp.toLocaleString("pt-BR")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Nível
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                {player.level}
              </p>
            </div>

            <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 sm:col-span-1">
              <p className="text-xs font-medium text-slate-500">
                Ações
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                {totalRegisteredActions}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-400">
              Progresso do nível {player.level}
            </span>

            <span className="font-semibold text-green-400">
              {levelProgress.xpInCurrentLevel} de{" "}
              {levelProgress.xpForCurrentLevel} XP
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{
                width: `${levelProgress.progressPercentage}%`,
              }}
            />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Faltam {levelProgress.xpToNextLevel} XP para alcançar o
            nível {player.level + 1}.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Atividades
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              O que você realizou?
            </h2>
          </div>

          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <History size={17} />
            Tudo será salvo no histórico
          </div>
        </div>

        <ActionGrid
          onRegisterAction={handleRegisterAction}
          registeringAction={registeringAction}
          lastRegisteredAction={lastRegisteredAction}
        />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-white">
              Registre somente ações concluídas
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Cada registro altera seu XP, nível, estatísticas e histórico.
              Futuramente, essas informações também serão enviadas para
              aprovação e armazenadas no banco de dados da Edershow.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}