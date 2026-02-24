export type PurchaseState = Record<string, boolean>;

export type PlayerUpgrades = {
  energyBonus: number;
  shieldBoost: number;
  magnetBoost: number;
  ballsBonus: number;
};

const PURCHASES_KEY = "neon-pulse-purchases";
const UPGRADES_KEY = "neon-pulse-upgrades";

export function getPurchases(): PurchaseState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PURCHASES_KEY);
    return raw ? (JSON.parse(raw) as PurchaseState) : {};
  } catch {
    return {};
  }
}

export function savePurchases(purchases: PurchaseState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
}

export function computeUpgrades(purchases: PurchaseState): PlayerUpgrades {
  const upgrades: PlayerUpgrades = {
    energyBonus: 0,
    shieldBoost: 0,
    magnetBoost: 0,
    ballsBonus: 0,
  };

  if (purchases.energy) {
    upgrades.energyBonus += 30;
    upgrades.ballsBonus += 20;
  }
  if (purchases.shield) {
    upgrades.shieldBoost += 1;
    upgrades.ballsBonus += 20;
  }
  if (purchases.magnet) {
    upgrades.magnetBoost += 1;
    upgrades.ballsBonus += 20;
  }
  if (purchases.bundle) {
    upgrades.energyBonus += 30;
    upgrades.shieldBoost += 1;
    upgrades.magnetBoost += 1;
    upgrades.ballsBonus += 40;
  }
  return upgrades;
}

export function getUpgrades(): PlayerUpgrades {
  if (typeof window === "undefined") {
    return { energyBonus: 0, shieldBoost: 0, magnetBoost: 0, ballsBonus: 0 };
  }
  const purchases = getPurchases();
  const upgrades = computeUpgrades(purchases);
  saveUpgrades(upgrades);
  return upgrades;
}

export function saveUpgrades(upgrades: PlayerUpgrades) {
  if (typeof window === "undefined") return;
  localStorage.setItem(UPGRADES_KEY, JSON.stringify(upgrades));
}

export function applyPurchase(itemId: string): PlayerUpgrades {
  const purchases = getPurchases();
  purchases[itemId] = true;
  savePurchases(purchases);
  const upgrades = computeUpgrades(purchases);
  saveUpgrades(upgrades);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("player-upgrades-changed", { detail: upgrades }));
  }
  return upgrades;
}

export function subscribeUpgradesChange(handler: (upgrades: PlayerUpgrades) => void) {
  if (typeof window === "undefined") return () => {};
  const onEvent = (event: Event) => {
    const detail = (event as CustomEvent<PlayerUpgrades>).detail;
    if (detail) handler(detail);
  };
  window.addEventListener("player-upgrades-changed", onEvent);
  return () => window.removeEventListener("player-upgrades-changed", onEvent);
}
