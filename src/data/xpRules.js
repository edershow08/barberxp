export const ACTION_TYPES = {
  HAIRCUT: "HAIRCUT",
  BEARD: "BEARD",
  EXTRA_SERVICE: "EXTRA_SERVICE",
  PRODUCT_SALE: "PRODUCT_SALE",
  SUBSCRIPTION_SALE: "SUBSCRIPTION_SALE",
};

export const XP_RULES = {
  [ACTION_TYPES.HAIRCUT]: {
    type: ACTION_TYPES.HAIRCUT,
    label: "Corte",
    xp: 20,
    statKey: "haircuts",
  },

  [ACTION_TYPES.BEARD]: {
    type: ACTION_TYPES.BEARD,
    label: "Barba",
    xp: 15,
    statKey: "beards",
  },

  [ACTION_TYPES.EXTRA_SERVICE]: {
    type: ACTION_TYPES.EXTRA_SERVICE,
    label: "Serviço extra",
    xp: 20,
    statKey: "extraServices",
  },

  [ACTION_TYPES.PRODUCT_SALE]: {
    type: ACTION_TYPES.PRODUCT_SALE,
    label: "Venda de produto",
    xp: 40,
    statKey: "productSales",
  },

  [ACTION_TYPES.SUBSCRIPTION_SALE]: {
    type: ACTION_TYPES.SUBSCRIPTION_SALE,
    label: "Venda de assinatura",
    xp: 100,
    statKey: "subscriptionSales",
  },
};

export const LEVEL_CONFIG = {
  xpPerLevel: 500,
  initialLevel: 1,
};

export function getXpRule(actionType) {
  return XP_RULES[actionType] ?? null;
}