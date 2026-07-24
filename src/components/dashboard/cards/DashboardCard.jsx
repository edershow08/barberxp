export default function DashboardCard({
  titulo,
  valor,
  icone,
  cor = "text-green-700",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">
          {titulo}
        </span>

        <div className={cor}>
          {icone}
        </div>
      </div>

      <h2 className={`text-3xl font-bold ${cor}`}>
        {valor}
      </h2>
    </div>
  );
}