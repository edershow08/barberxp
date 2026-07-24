import { Award, Crown, Medal, Trophy } from "lucide-react";

const ranking = [
  {
    id: 1,
    position: 1,
    name: "Carlos",
    xp: 2540,
    Icon: Crown,
    iconClass: "text-yellow-500",
    positionClass: "bg-yellow-100 text-yellow-700",
  },
  {
    id: 2,
    position: 2,
    name: "João",
    xp: 2310,
    Icon: Medal,
    iconClass: "text-slate-500",
    positionClass: "bg-slate-200 text-slate-700",
  },
  {
    id: 3,
    position: 3,
    name: "Pedro",
    xp: 2150,
    Icon: Award,
    iconClass: "text-orange-500",
    positionClass: "bg-orange-100 text-orange-700",
  },
];

export default function TopBarbersCard() {
  return (
    <section className="flex min-h-[455px] flex-col rounded-2xl border border-slate-200 bg-white px-4 pb-4 pt-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-yellow-600">
            Peças da equipe
          </p>

          <h2 className="mt-0.5 text-lg font-bold text-slate-800">
            Melhores Barbeiros
          </h2>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
          <Trophy size={18} />
        </div>
      </div>

      <div className="space-y-2.5">
        {ranking.map((barber) => {
          const Icon = barber.Icon;

          return (
            <article
              key={barber.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 transition-all duration-200 hover:bg-slate-100"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${barber.positionClass}`}
              >
                {barber.position}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Icon size={17} className={barber.iconClass} />

                  <p className="truncate text-base font-bold text-slate-800">
                    {barber.name}
                  </p>
                </div>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {barber.xp.toLocaleString("pt-BR")} XP
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex-1" />
    </section>
  );
}
