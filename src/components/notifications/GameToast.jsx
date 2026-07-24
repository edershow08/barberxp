import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Info,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

import {
  NOTIFICATION_TYPES,
} from "../../game/notifications/notificationEngine";

const notificationStyles = {
  [NOTIFICATION_TYPES.SUCCESS]: {
    icon: CheckCircle2,
    iconContainer:
      "border-green-500/30 bg-green-500/10 text-green-400",
    border: "border-green-500/30",
    progress: "bg-green-500",
    label: "Ação concluída",
  },

  [NOTIFICATION_TYPES.INFO]: {
    icon: Info,
    iconContainer:
      "border-sky-500/30 bg-sky-500/10 text-sky-400",
    border: "border-sky-500/30",
    progress: "bg-sky-500",
    label: "Informação",
  },

  [NOTIFICATION_TYPES.WARNING]: {
    icon: Info,
    iconContainer:
      "border-amber-500/30 bg-amber-500/10 text-amber-400",
    border: "border-amber-500/30",
    progress: "bg-amber-500",
    label: "Atenção",
  },

  [NOTIFICATION_TYPES.LEVEL_UP]: {
    icon: Trophy,
    iconContainer:
      "border-green-400/40 bg-green-400/15 text-green-300",
    border: "border-green-400/50",
    progress: "bg-green-400",
    label: "Novo nível",
  },

  [NOTIFICATION_TYPES.ACHIEVEMENT]: {
    icon: Trophy,
    iconContainer:
      "border-violet-500/30 bg-violet-500/10 text-violet-400",
    border: "border-violet-500/30",
    progress: "bg-violet-500",
    label: "Conquista",
  },

  [NOTIFICATION_TYPES.MISSION]: {
    icon: Sparkles,
    iconContainer:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    border: "border-emerald-500/30",
    progress: "bg-emerald-500",
    label: "Missão",
  },
};

export default function GameToast({
  notification,
  duration = 4500,
  onDismiss,
}) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const style = useMemo(() => {
    return (
      notificationStyles[notification.type] ??
      notificationStyles[NOTIFICATION_TYPES.INFO]
    );
  }, [notification.type]);

  const Icon = style.icon;

  useEffect(() => {
    const showTimer = window.setTimeout(() => {
      setVisible(true);
    }, 30);

    return () => {
      window.clearTimeout(showTimer);
    };
  }, []);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      window.clearTimeout(closeTimer);
    };
  }, [duration]);

  function handleClose() {
    if (closing) {
      return;
    }

    setClosing(true);
    setVisible(false);

    window.setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  }

  const isLevelUp =
    notification.type === NOTIFICATION_TYPES.LEVEL_UP;

  return (
    <article
      role="status"
      aria-live="polite"
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-300 sm:w-[390px] ${
        style.border
      } ${
        visible
          ? "translate-x-0 scale-100 opacity-100"
          : "translate-x-12 scale-95 opacity-0"
      } ${
        isLevelUp
          ? "ring-1 ring-green-400/20"
          : ""
      }`}
    >
      {isLevelUp && (
        <>
          <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-green-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 right-0 h-32 w-32 rounded-full bg-green-400/10 blur-3xl" />
        </>
      )}

      <div className="relative flex gap-4 p-4 pr-12">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${style.iconContainer}`}
        >
          <Icon
            size={23}
            strokeWidth={isLevelUp ? 2.2 : 1.9}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {style.label}
          </p>

          <h3 className="mt-1 truncate font-bold text-white">
            {notification.title}
          </h3>

          <p className="mt-1.5 text-sm leading-5 text-slate-400">
            {notification.message}
          </p>

          {notification.metadata?.earnedXp && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1">
              <Sparkles
                size={12}
                className="text-green-400"
              />

              <span className="text-xs font-bold text-green-400">
                +{notification.metadata.earnedXp} XP
              </span>
            </div>
          )}

          {notification.metadata?.level && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1">
              <Trophy
                size={13}
                className="text-green-300"
              />

              <span className="text-xs font-bold text-green-300">
                Nível {notification.metadata.level}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar notificação"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="h-1 bg-slate-800">
        <div
          className={`h-full origin-left ${style.progress}`}
          style={{
            animation: `barberxp-toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>
    </article>
  );
}