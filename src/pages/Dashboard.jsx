import ChartCard from "../components/dashboard/cards/ChartCard";
import TopBarbersCard from "../components/dashboard/cards/TopBarbersCard";
import WelcomeCard from "../components/dashboard/cards/WelcomeCard";

import DashboardHistory from "../components/dashboard/history/DashboardHistory";
import DashboardMissionPanel from "../components/dashboard/missions/DashboardMissionPanel";
import DashboardRanking from "../components/dashboard/ranking/DashboardRanking";

import { usePlayer } from "../hooks/usePlayer";

export default function Dashboard() {
  const {
    player,
    levelProgress,
  } = usePlayer();

  const history = Array.isArray(player?.history)
    ? player.history
    : [];

  const points = Number(player?.points) || 0;

  const rankingPosition =
    Number(player?.rankingPosition) || 0;

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-5 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <WelcomeCard
          player={player}
          levelProgress={levelProgress}
        />

        <section className="grid items-stretch gap-5 xl:grid-cols-[1.5fr_1fr]">
          <ChartCard history={history} />

          <DashboardRanking
            player={player}
            position={rankingPosition}
            points={points}
          />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[0.85fr_1.4fr]">
          <TopBarbersCard />

          <DashboardMissionPanel
            history={history}
          />
        </section>

        <DashboardHistory
          history={history}
        />
      </div>
    </main>
  );
}