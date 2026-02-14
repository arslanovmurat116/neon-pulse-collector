import { beginCell, toNano } from "@ton/core";

const paymentAddress =
  (process.env.NEXT_PUBLIC_PAYMENT_ADDRESS as string | undefined) || "";

export function buildPaymentPayload(opcode: number, queryId: bigint = 0n): string {
  const body = beginCell().storeUint(opcode, 32).storeUint(queryId, 64).endCell();
  return body.toBoc().toString("base64");
}

export function buildPaymentMessage(opcode: number, amountTon: string) {
  if (!paymentAddress) {
    throw new Error("Payment address is not configured");
  }

  return {
    address: paymentAddress,
    amount: toNano(amountTon).toString(),
    payload: buildPaymentPayload(opcode),
  };
}

// TODO: Snapshot scores
// TODO: Snapshot purchases
// TODO: Jetton airdrop (TEP-74)
