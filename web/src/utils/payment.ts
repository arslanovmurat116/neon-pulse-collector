import { beginCell, toNano } from "@ton/core";
import { CONTRACT_ADDRESSES, PAYMENT_OPCODES } from "@/config/app";

export type PurchaseType = keyof typeof PAYMENT_OPCODES;

export function buildPaymentPayload(opcode: number, queryId: bigint = 0n): string {
  const body = beginCell().storeUint(opcode, 32).storeUint(queryId, 64).endCell();
  return body.toBoc().toString("base64");
}

export function buildPaymentMessage(opcode: number, amountTon: string) {
  if (!CONTRACT_ADDRESSES.payment) {
    throw new Error("Payment contract address is not configured");
  }

  return {
    address: CONTRACT_ADDRESSES.payment,
    amount: toNano(amountTon).toString(),
    payload: buildPaymentPayload(opcode),
  };
}

// TODO: Snapshot scores
// TODO: Snapshot purchases
// TODO: Jetton airdrop (TEP-74)
