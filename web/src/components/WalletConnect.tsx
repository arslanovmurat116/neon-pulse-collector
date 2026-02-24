import React from "react";
import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useI18n } from "@/i18n";

interface WalletConnectProps {
  onAddressChange?: (address: string) => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onAddressChange }) => {
  const address = useTonAddress(true);
  const [tonConnectUI] = useTonConnectUI();
  const { t } = useI18n();

  React.useEffect(() => {
    onAddressChange?.(address || "");
  }, [address, onAddressChange]);

  return (
    <div className="ui-caps flex items-center gap-3">
      {address && (
        <div className="flex flex-col items-end">
          <div className="text-xs text-neon-cyan/70">{t("wallet.connected")}</div>
          <div className="ui-no-caps text-sm text-neon-green font-semibold">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          <button
            onClick={() => tonConnectUI && tonConnectUI.disconnect()}
            className="text-xs text-neon-pink hover:text-neon-pink/80 transition-colors"
          >
            {t("wallet.disconnect")}
          </button>
        </div>
      )}
      <TonConnectButton />
    </div>
  );
};
