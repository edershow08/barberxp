import {
  ACTION_TYPES,
} from "../../data/xpRules";

export const MISSION_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
};

export const MISSIONS = [
  {
    id: "daily-haircuts",
    title: "Mestre da Tesoura",
    description: "Realize 5 cortes hoje.",
    actionType: ACTION_TYPES.HAIRCUT,
    target: 5,
    rewardXp: 100,
    rewardPoints: 50,
    status: MISSION_STATUS.ACTIVE,
  },
  {
    id: "daily-beards",
    title: "Barba na Régua",
    description:
      "Realize 3 serviços de barba hoje.",
    actionType: ACTION_TYPES.BEARD,
    target: 3,
    rewardXp: 80,
    rewardPoints: 40,
    status: MISSION_STATUS.ACTIVE,
  },
  {
    id: "daily-extra-services",
    title: "Detalhes que Fazem Diferença",
    description:
      "Realize 2 serviços extras hoje.",
    actionType: ACTION_TYPES.EXTRA_SERVICE,
    target: 2,
    rewardXp: 60,
    rewardPoints: 30,
    status: MISSION_STATUS.ACTIVE,
  },
  {
    id: "daily-products",
    title: "Vendedor do Dia",
    description: "Venda 2 produtos hoje.",
    actionType: ACTION_TYPES.PRODUCT,
    target: 2,
    rewardXp: 70,
    rewardPoints: 35,
    status: MISSION_STATUS.ACTIVE,
  },
  {
    id: "daily-subscriptions",
    title: "Clube em Alta",
    description: "Venda 1 assinatura hoje.",
    actionType: ACTION_TYPES.SUBSCRIPTION,
    target: 1,
    rewardXp: 120,
    rewardPoints: 60,
    status: MISSION_STATUS.ACTIVE,
  },
];

export function getActiveMissions() {
  return MISSIONS.filter(
    (mission) =>
      mission.status ===
      MISSION_STATUS.ACTIVE,
  );
}