export const PAYMENT_OPCODES = {
  ENERGY: 0x01,
  SHIELD: 0x02,
  MAGNET: 0x03,
  BUNDLE: 0x04,
};

export const SHOP_ITEMS = [
  { id: "energy", title: "Energy cooldown reset", opcode: PAYMENT_OPCODES.ENERGY, priceTon: "0.2" },
  { id: "shield", title: "Extra shields", opcode: PAYMENT_OPCODES.SHIELD, priceTon: "0.3" },
  { id: "magnet", title: "Extra magnets", opcode: PAYMENT_OPCODES.MAGNET, priceTon: "0.25" },
  { id: "bundle", title: "Bundle (1+2+3 discount)", opcode: PAYMENT_OPCODES.BUNDLE, priceTon: "0.6" },
];

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Wallet not connected",
  TRANSACTION_FAILED: "Transaction failed",
  PAYMENT_ADDRESS_MISSING: "Payment address is not configured",
};

export const SUCCESS_MESSAGES = {
  PURCHASE_SUCCESS: "Purchase completed",
};
