import {
  Clock3,
  History,
} from "lucide-react";

const MAX_HISTORY_ITEMS = 5;

function formatDate(dateValue) {
  if (!dateValue) {
    return "Agora";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Registro recente";
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionTitle(item) {
  return (
    item?.label ||
    item?.title ||
    item?.description ||
    item?.actionName ||
    item?.type ||
    "Ação registrada"
  );
}

function getActionXp(item) {
  return (
    Number(
      item?.xp ??
        item?.xpEarned ??
        item?.rewardXp ??
        0,
    ) || 0
  );
}

function getTimestamp(item) {
  const date = new Date(
    item?.createdAt ??
      item?.date ??
      item?.timestamp ??
      0,
  );

  return Number.isNaN(date.getTime())
    ? 0
    : date.getTime();
}

export default function DashboardHistory({
  history = [],
}) {
  const safeHistory = Array.isArray(history)
    ? history
    : [];

  const recentHistory = safeHistory
    .slice()
    .sort(
      (firstItem, secondItem) =>
        getTimestamp(secondItem) -
        getTimestamp(firstItem),
    )
    .slice(0, MAX_HISTORY_ITEMS);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-green-700">
            Atividades recentes
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-800">
            Histórico
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            As cinco ações mais recentes registradas no
            sistema.
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <History size={24} />
        </div>
      </div>

      {recentHistory.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {recentHistory.map(
            (item, index) => {
              const xp = getActionXp(item);

              return (
                <article
                  key={
                    item?.id ||
                    `${getActionTitle(
                      item,
                    )}-${index}`
                  }
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                      <Clock3 size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">
                        {getActionTitle(item)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(
                          item?.createdAt ??
                            item?.date ??
                            item?.timestamp,
                        )}
                      </p>
                    </div>
                  </div>

                  {xp !== 0 && (
                    <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
                      {xp > 0 ? "+" : ""}
                      {xp} XP
                    </span>
                  )}
                </article>
              );
            },
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <History
            className="mx-auto text-slate-400"
            size={32}
          />

          <p className="mt-3 font-semibold text-slate-700">
            Nenhuma atividade registrada
          </p>

          <p className="mt-1 text-sm text-slate-500">
            As ações realizadas aparecerão neste histórico.
          </p>
        </div>
      )}
    </section>
  );
}