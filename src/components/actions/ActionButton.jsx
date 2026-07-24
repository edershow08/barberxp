import { Check, LoaderCircle, Plus } from "lucide-react";

export default function ActionButton({
  title,
  description,
  xp,
  icon: Icon,
  onRegister,
  isRegistering = false,
  isLastRegistered = false,
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border p-6 transition duration-300 ${
        isLastRegistered
          ? "border-green-500/50 bg-green-500/5"
          : "border-slate-800 bg-slate-900 hover:-translate-y-1 hover:border-slate-700"
      }`}
    >
      {isLastRegistered && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-400">
          <Check size={13} />
          Registrado
        </div>
      )}

      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition ${
          isLastRegistered
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : "border-slate-700 bg-slate-950 text-slate-300 group-hover:border-green-500/30 group-hover:text-green-400"
        }`}
      >
        <Icon size={26} strokeWidth={1.8} />
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">{title}</h2>

          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-400">
            +{xp} XP
          </span>
        </div>

        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onRegister}
        disabled={isRegistering}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRegistering ? (
          <>
            <LoaderCircle size={17} className="animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            <Plus size={17} />
            Registrar ação
          </>
        )}
      </button>
    </article>
  );
}