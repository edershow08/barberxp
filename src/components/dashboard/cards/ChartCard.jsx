import {
  BarChart3,
  TrendingUp,
} from "lucide-react";

function createLocalDateKey(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonday(dateValue = new Date()) {
  const date = new Date(dateValue);

  date.setHours(0, 0, 0, 0);

  const day = date.getDay();

  const difference =
    day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + difference);

  return date;
}

function createCurrentWeek() {
  const labels = [
    "Seg",
    "Ter",
    "Qua",
    "Qui",
    "Sex",
    "Sáb",
  ];

  const monday = getMonday();

  return labels.map((label, index) => {
    const date = new Date(monday);

    date.setDate(monday.getDate() + index);

    return {
      key: createLocalDateKey(date),
      label,
      date,
      xp: 0,
    };
  });
}

function groupWeeklyXp(history = []) {
  const week = createCurrentWeek();

  const daysMap = new Map(
    week.map((day) => [day.key, day]),
  );

  history.forEach((item) => {
    const key = createLocalDateKey(
      item?.createdAt,
    );

    if (!key || !daysMap.has(key)) {
      return;
    }

    const day = daysMap.get(key);

    day.xp += Math.max(
      Number(item?.xp) || 0,
      0,
    );
  });

  return week;
}

export default function ChartCard({
  history = [],
}) {
  const safeHistory = Array.isArray(history)
    ? history
    : [];

  const data = groupWeeklyXp(safeHistory);

  const totalXp = data.reduce(
    (total, day) => total + day.xp,
    0,
  );

  const highestXp = Math.max(
    ...data.map((day) => day.xp),
    1,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-green-700">
            Evolução semanal
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-800">
            XP conquistado
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Desempenho de segunda-feira a sábado.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
          <TrendingUp size={16} />

          {totalXp.toLocaleString("pt-BR")} XP
        </div>
      </div>

      {totalXp > 0 ? (
        <div className="flex h-64 items-end justify-between gap-3">
          {data.map((item) => {
            const height =
              item.xp > 0
                ? Math.max(
                    (item.xp / highestXp) * 100,
                    10,
                  )
                : 0;

            return (
              <div
                key={item.key}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              >
                <div className="flex h-full w-full items-end">
                  <div
                    className={`relative w-full rounded-t-xl transition-all duration-500 ${
                      item.xp > 0
                        ? "bg-green-700 hover:bg-green-800"
                        : "bg-slate-100"
                    }`}
                    style={{
                      height:
                        item.xp > 0
                          ? `${height}%`
                          : "5px",
                    }}
                    title={`${item.label}: ${item.xp} XP`}
                  >
                    {item.xp > 0 && (
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-slate-600">
                        {item.xp}
                      </span>
                    )}
                  </div>
                </div>

                <span className="mt-3 text-xs font-semibold text-slate-500">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
          <BarChart3
            size={34}
            className="text-slate-400"
          />

          <p className="mt-3 font-semibold text-slate-700">
            Nenhum XP registrado nesta semana
          </p>

          <p className="mt-1 text-sm text-slate-500">
            As barras aparecerão quando novas ações forem
            registradas.
          </p>
        </div>
      )}
    </section>
  );
}