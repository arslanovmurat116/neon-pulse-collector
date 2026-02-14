import React, { useMemo, useState } from "react";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { SHOP_ITEMS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "../config/payment";
import { buildPaymentMessage } from "../utils/payment";

type PurchaseState = Record<string, boolean>;

const STORAGE_KEY = "neon-pulse-purchases";

function loadPurchases(): PurchaseState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PurchaseState) : {};
  } catch {
    return {};
  }
}

function savePurchases(state: PurchaseState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const PaymentShop: React.FC = () => {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchaseState>(() => loadPurchases());

  const isConnected = useMemo(() => Boolean(address), [address]);

  const handlePurchase = async (itemId: string, opcode: number, priceTon: string) => {
    if (!isConnected) {
      alert(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      return;
    }
    if (!tonConnectUI) {
      alert(ERROR_MESSAGES.TRANSACTION_FAILED);
      return;
    }

    setLoadingId(itemId);
    try {
      const message = buildPaymentMessage(opcode, priceTon);
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [message],
      });

      const next = { ...purchases, [itemId]: true };
      setPurchases(next);
      savePurchases(next);
      alert(SUCCESS_MESSAGES.PURCHASE_SUCCESS);
    } catch (error) {
      console.error("Payment error:", error);
      alert(ERROR_MESSAGES.TRANSACTION_FAILED);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-5 w-full">
      <h3 className="text-lg font-bold text-white mb-4">Shop (TON)</h3>

      <div className="flex flex-col gap-3">
        {SHOP_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl"
          >
            <div>
              <div className="text-slate-100 font-semibold">{item.title}</div>
              <div className="text-xs text-slate-400">{item.priceTon} TON</div>
            </div>
            <button
              onClick={() => handlePurchase(item.id, item.opcode, item.priceTon)}
              disabled={!isConnected || loadingId === item.id || purchases[item.id]}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {purchases[item.id]
                ? "Unlocked"
                : loadingId === item.id
                ? "Paying..."
                : "Buy"}
            </button>
          </div>
        ))}
      </div>

      {!isConnected && (
        <div className="mt-3 text-xs text-amber-300">
          Connect wallet to unlock purchases.
        </div>
      )}
    </div>
  );
};
