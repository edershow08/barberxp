import {
  CreditCard,
  Package,
  Scissors,
  Sparkles,
  UserRound,
} from "lucide-react";

import { ACTION_TYPES } from "../../data/xpRules";
import ActionButton from "./ActionButton";

const actions = [
  {
    type: ACTION_TYPES.HAIRCUT,
    title: "Corte",
    description:
      "Registre um corte concluído e adicione XP ao seu desempenho.",
    xp: 20,
    icon: Scissors,
  },
  {
    type: ACTION_TYPES.BEARD,
    title: "Barba",
    description:
      "Registre um serviço de barba concluído para aumentar sua pontuação.",
    xp: 15,
    icon: UserRound,
  },
  {
    type: ACTION_TYPES.EXTRA_SERVICE,
    title: "Serviço extra",
    description:
      "Registre procedimentos adicionais realizados durante o atendimento.",
    xp: 20,
    icon: Sparkles,
  },
  {
    type: ACTION_TYPES.PRODUCT_SALE,
    title: "Venda de produto",
    description:
      "Registre uma venda de produto realizada para um cliente.",
    xp: 40,
    icon: Package,
  },
  {
    type: ACTION_TYPES.SUBSCRIPTION_SALE,
    title: "Venda de assinatura",
    description:
      "Registre uma nova assinatura vendida e conquiste uma recompensa maior.",
    xp: 100,
    icon: CreditCard,
  },
];

export default function ActionGrid({
  onRegisterAction,
  registeringAction,
  lastRegisteredAction,
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {actions.map((action) => (
        <ActionButton
          key={action.type}
          title={action.title}
          description={action.description}
          xp={action.xp}
          icon={action.icon}
          onRegister={() => onRegisterAction(action.type)}
          isRegistering={registeringAction === action.type}
          isLastRegistered={lastRegisteredAction === action.type}
        />
      ))}
    </div>
  );
}