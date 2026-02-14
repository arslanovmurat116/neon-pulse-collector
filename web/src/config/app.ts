export const APP_NAME = "Neon Pulse Collector";
export const APP_DESCRIPTION = "Offchain game with onchain TON payments";

export const TON_CONFIG = {
  network: "testnet" as const,
  endpoint: process.env.NEXT_PUBLIC_TON_ENDPOINT || "https://testnet.toncenter.com/api/v2/jsonRPC",
};

export const CONTRACT_ADDRESSES = {
  payment: process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || "",
};

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
  { id: "bundle", title: "Bundle (1+2+3 со скидкой)", opcode: PAYMENT_OPCODES.BUNDLE, priceTon: "0.6" },
];

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Кошелек не подключен",
  INVALID_AMOUNT: "Неверная сумма",
  TRANSACTION_FAILED: "Ошибка при отправке транзакции",
  NETWORK_ERROR: "Ошибка сети",
  CONTRACT_ERROR: "Ошибка смарт-контракта",
  INSUFFICIENT_BALANCE: "Недостаточно средств",
};

export const SUCCESS_MESSAGES = {
  PURCHASE_SUCCESS: "Покупка успешно выполнена",
};
