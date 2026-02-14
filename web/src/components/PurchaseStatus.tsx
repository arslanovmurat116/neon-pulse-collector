import React, { useEffect, useState } from "react";
import { SHOP_ITEMS } from "@/config/app";
import { getPurchases, getUpgrades, PlayerUpgrades } from "@/utils/playerUpgrades";

type PurchaseState = Record<string, boolean>;

export const PurchaseStatus: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseState>({});
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>({
    energyBonus: 0,
    shieldBoost: 0,
    magnetBoost: 0,
    ballsBonus: 0,
  });

  useEffect(() => {
    setPurchases(getPurchases());
    setUpgrades(getUpgrades());
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<PlayerUpgrades>).detail;
      if (detail) setUpgrades(detail);
      setPurchases(getPurchases());
    };
    window.addEventListener("player-upgrades-changed", handler);
    return () => window.removeEventListener("player-upgrades-changed", handler);
  }, []);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-neon-green mb-4 animate-glow">Активные покупки</h2>
      <div className="grid grid-cols-1 gap-3">
        {SHOP_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 p-4 bg-neon-dark/60 border border-neon-purple/20 rounded-lg"
          >
            <div className="text-neon-cyan font-semibold">{item.title}</div>
            <div className="text-sm">
              {purchases[item.id] ? (
                <span className="text-neon-green font-semibold">Unlocked</span>
              ) : (
                <span className="text-neon-pink/80">Not purchased</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-neon-cyan/70 space-y-1">
        <div>Energy bonus: +{upgrades.energyBonus}</div>
        <div>Shield boost: +{upgrades.shieldBoost}</div>
        <div>Magnet boost: +{upgrades.magnetBoost}</div>
        <div>Max balls: +{upgrades.ballsBonus}</div>
      </div>
    </div>
  );
};
