import React from "react";
import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";

function shortAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

export const WalletConnect: React.FC = () => {
  const address = useTonAddress(true);
  const [tonConnectUI] = useTonConnectUI();

  const handleDisconnect = async () => {
    if (tonConnectUI) {
      await tonConnectUI.disconnect();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <TonConnectButton />
      {address ? (
        <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
          <span className="truncate">Connected: {shortAddress(address)}</span>
          <button
            onClick={handleDisconnect}
            className="px-2 py-1 rounded-md bg-slate-800/60 hover:bg-slate-700/80 transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="text-xs text-slate-400">Connect wallet to enable purchases.</div>
      )}
    </div>
  );
};
