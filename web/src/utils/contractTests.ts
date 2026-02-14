/**
 * Payment contract integration checks
 */

import { CONTRACT_ADDRESSES, PAYMENT_OPCODES } from "@/config/app";
import { buildPaymentPayload } from "@/utils/payment";

export function testPaymentAddress() {
  const ok = Boolean(CONTRACT_ADDRESSES.payment);
  console.log(ok ? "Payment address set" : "Payment address missing");
  return ok;
}

export function testPayloadEncoding() {
  const payload = buildPaymentPayload(PAYMENT_OPCODES.ENERGY);
  const ok = typeof payload === "string" && payload.length > 0;
  console.log(ok ? "Payload encoded" : "Payload encoding failed");
  return ok;
}

export function runAllTests() {
  const results = {
    address: testPaymentAddress(),
    payload: testPayloadEncoding(),
  };
  return results;
}
