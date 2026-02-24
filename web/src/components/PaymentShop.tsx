import React, { useMemo, useState } from "react";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { SHOP_ITEMS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/config/app";
import { buildPaymentMessage } from "@/utils/payment";
import { applyPurchase, getPurchases } from "@/utils/playerUpgrades";
import { useI18n } from "@/i18n";

type PurchaseState = Record<string, boolean>;

function loadPurchases(): PurchaseState {
  return getPurchases();
}

export const PaymentShop: React.FC = () => {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress(true);
  const { t } = useI18n();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchaseState>(() => loadPurchases());

  const isConnected = useMemo(() => Boolean(address), [address]);

  const handlePurchase = async (itemId: string, opcode: number, priceTon: string) => {
    if (!isConnected) {
      alert(t(ERROR_MESSAGES.WALLET_NOT_CONNECTED));
      return;
    }
    if (!tonConnectUI) {
      alert(t(ERROR_MESSAGES.NETWORK_ERROR));
      return;
    }

    setLoadingId(itemId);
    try {
      const message = buildPaymentMessage(opcode, priceTon);
      console.log("[PAYMENT] sendTransaction", {
        address: message.address,
        amount: message.amount,
        payload: message.payload,
      });
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [message],
      });

      applyPurchase(itemId);
      setPurchases((prev) => ({ ...prev, [itemId]: true }));
      alert(t(SUCCESS_MESSAGES.PURCHASE_SUCCESS));
    } catch (error) {
      console.error("Payment error:", error);
      alert(t(ERROR_MESSAGES.TRANSACTION_FAILED));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="ui-caps bg-gradient-to-br from-neon-dark/80 to-neon-dark/60 border border-neon-green/30 rounded-lg p-6 w-full">
      <h2 className="text-2xl font-bold text-neon-green mb-6 animate-glow">{t("shop.title")}</h2>

      <div className="grid grid-cols-1 gap-4">
        {SHOP_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 p-4 bg-neon-dark/60 border border-neon-cyan/20 rounded-lg"
          >
            <div>
              <div className="text-neon-cyan font-semibold">{t(item.titleKey)}</div>
              <div className="text-xs text-neon-purple/70">{item.priceTon} TON</div>
            </div>
            <button
              onClick={() => handlePurchase(item.id, item.opcode, item.priceTon)}
              disabled={!isConnected || loadingId === item.id || purchases[item.id]}
              className="px-4 py-2 bg-gradient-to-r from-neon-green to-neon-cyan text-dark font-bold rounded-lg hover:shadow-lg hover:shadow-neon-green/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {purchases[item.id]
                ? t("shop.unlocked")
                : loadingId === item.id
                  ? t("shop.paying")
                  : t("shop.buy")}
            </button>
          </div>
        ))}
      </div>

      {!isConnected && (
        <button
          onClick={() => tonConnectUI?.openModal()}
          className="mt-4 w-full p-3 bg-neon-pink/20 border border-neon-pink rounded-lg text-neon-pink text-sm font-bold hover:bg-neon-pink/30"
        >
          {t("shop.connectWalletToShop")}
        </button>
      )}
    </div>
  );
};
