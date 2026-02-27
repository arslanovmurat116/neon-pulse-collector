export const APP_NAME = "Neon Pulse Collector";
export const APP_DESCRIPTION = "Offchain game with onchain TON payments";

export const TON_CONFIG = {
  network: "mainnet" as const,
  endpoint: process.env.NEXT_PUBLIC_TON_ENDPOINT || "https://toncenter.com/api/v2/jsonRPC",
};

export const CONTRACT_ADDRESSES = {
  payment:
    process.env.NEXT_PUBLIC_PAYMENT_ADDRESS ||
    "UQDGavrN438GIgDJ0cdYKXgAM-DoCW7vptMxgaitS13FRWcV",
};

export const PAYMENT_OPCODES = {
  ENERGY: 0x01,
  SHIELD: 0x02,
  MAGNET: 0x03,
  BUNDLE: 0x04,
};

export const SHOP_ITEMS = [
  { id: "energy", titleKey: "shop.item.energy", opcode: PAYMENT_OPCODES.ENERGY, priceTon: "2" },
  { id: "shield", titleKey: "shop.item.shield", opcode: PAYMENT_OPCODES.SHIELD, priceTon: "3" },
  { id: "magnet", titleKey: "shop.item.magnet", opcode: PAYMENT_OPCODES.MAGNET, priceTon: "3" },
  { id: "bundle", titleKey: "shop.item.bundle", opcode: PAYMENT_OPCODES.BUNDLE, priceTon: "0.6" },
];

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "error.walletNotConnected",
  INVALID_AMOUNT: "error.invalidAmount",
  TRANSACTION_FAILED: "error.transactionFailed",
  NETWORK_ERROR: "error.network",
  CONTRACT_ERROR: "error.contract",
  INSUFFICIENT_BALANCE: "error.insufficientBalance",
};

export const SUCCESS_MESSAGES = {
  PURCHASE_SUCCESS: "success.purchase",
};
