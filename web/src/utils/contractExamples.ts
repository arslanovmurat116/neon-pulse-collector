/**
 * Payment contract examples (TON Connect)
 */

import { TonClient } from "@ton/ton";
import { Address } from "@ton/core";
import { CONTRACT_ADDRESSES, PAYMENT_OPCODES, TON_CONFIG } from "@/config/app";
import { buildPaymentPayload } from "@/utils/payment";

export function initializeTonClient() {
  return new TonClient({ endpoint: TON_CONFIG.endpoint });
}

export function buildEnergyPurchasePayload() {
  return buildPaymentPayload(PAYMENT_OPCODES.ENERGY);
}

export function buildShieldPurchasePayload() {
  return buildPaymentPayload(PAYMENT_OPCODES.SHIELD);
}

export function buildMagnetPurchasePayload() {
  return buildPaymentPayload(PAYMENT_OPCODES.MAGNET);
}

export function buildBundlePurchasePayload() {
  return buildPaymentPayload(PAYMENT_OPCODES.BUNDLE);
}

export async function getPaymentContractState() {
  if (!CONTRACT_ADDRESSES.payment) {
    throw new Error("Payment contract address is not set");
  }
  const client = initializeTonClient();
  const address = Address.parse(CONTRACT_ADDRESSES.payment);
  return client.getContractState(address);
}
