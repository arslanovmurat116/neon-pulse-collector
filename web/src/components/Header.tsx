import React from "react";
import { WalletConnect } from "./WalletConnect";

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-neon-dark via-neon-dark to-neon-dark border-b border-neon-green/30 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🌿</div>
          <div>
            <h1 className="text-2xl font-bold text-neon-green animate-glow">
              Neon Pulse Collector
            </h1>
            <p className="text-xs text-neon-cyan/70">
              Offchain game with onchain TON payments
            </p>
          </div>
        </div>
        <WalletConnect />
      </div>
    </header>
  );
};
