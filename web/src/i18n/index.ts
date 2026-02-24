import { useEffect, useState } from "react";

export type Lang = "ru" | "en";

const LANG_KEY = "lang";
const LANG_CHANGED_EVENT = "lang-changed";

const MESSAGES: Record<Lang, Record<string, string>> = {
  en: {
    "app.name": "Neon Pulse Collector",
    "home.play": "Play",
    "home.leaderboard": "Leaderboard",
    "home.shop": "Shop",
    "home.playDesc": "Start game",
    "home.leaderboardDesc": "Local ranking",
    "home.shopDesc": "Game upgrades",
    "app.metaDescription": "Decentralized app for emission collection on TON",
    "common.close": "Close",
    "common.langRu": "RU",
    "common.langEn": "EN",
    "wallet.connected": "Connected",
    "wallet.disconnect": "Disconnect",
    "shop.title": "Purchases for TON",
    "shop.buy": "Buy",
    "shop.paying": "Paying...",
    "shop.unlocked": "Unlocked",
    "shop.connectWalletToPay": "Connect wallet to pay",
    "shop.connectWalletToShop": "CONNECT WALLET TO SHOP",
    "shop.item.energy": "Energy cooldown reset",
    "shop.item.shield": "Extra shields",
    "shop.item.magnet": "Extra magnets",
    "shop.item.bundle": "Bundle (1+2+3 discounted)",
    "purchaseStatus.title": "Active purchases",
    "purchaseStatus.notPurchased": "Not purchased",
    "purchaseStatus.energyBonus": "Energy bonus",
    "purchaseStatus.shieldBoost": "Shield boost",
    "purchaseStatus.magnetBoost": "Magnet boost",
    "purchaseStatus.maxBalls": "Max balls",
    "leaderboard.title": "Leaderboard",
    "leaderboard.total": "Total balls collected",
    "leaderboard.best": "Best run",
    "leaderboard.top10": "Top-10 runs (local)",
    "leaderboard.empty": "No results yet.",
    "leaderboard.globalLater": "Global leaderboard coming later.",
    "error.walletNotConnected": "Wallet is not connected",
    "error.invalidAmount": "Invalid amount",
    "error.transactionFailed": "Failed to send transaction",
    "error.network": "Network error",
    "error.contract": "Smart-contract error",
    "error.insufficientBalance": "Insufficient balance",
    "success.purchase": "Purchase completed successfully",
    "game.sound": "Sound",
    "game.muted": "Muted",
    "game.pause": "Pause",
    "game.resume": "Resume",
    "game.score": "SCORE",
    "game.highScore": "High Score",
    "game.energy": "Energy",
    "game.maxBalls": "Max balls",
    "game.shield": "Shield",
    "game.magnet": "Magnet",
    "game.title": "Neon Pulse",
    "game.onboarding.catchPrefix": "Catch ",
    "game.onboarding.catchHighlight": "energy orbs",
    "game.onboarding.avoidPrefix": "Avoid ",
    "game.onboarding.avoidHighlight": "threats",
    "game.onboarding.unlockHighlight": "Unlock upgrades",
    "game.onboarding.unlockConnector": " with ",
    "game.onboarding.ton": "TON",
    "game.start": "Start Game",
    "game.paused": "Paused",
    "game.gameOver": "Game Over",
    "game.newRecord": "New record",
    "game.restart": "Restart",
  },
  ru: {
    "app.name": "Neon Pulse Collector",
    "home.play": "Играть",
    "home.leaderboard": "Лидерборд",
    "home.shop": "Покупки",
    "home.playDesc": "Начать игру",
    "home.leaderboardDesc": "Локальный рейтинг",
    "home.shopDesc": "Улучшения для игры",
    "app.metaDescription": "Децентрализованное приложение для сбора эмиссии на TON",
    "common.close": "Закрыть",
    "common.langRu": "RU",
    "common.langEn": "EN",
    "wallet.connected": "Подключен",
    "wallet.disconnect": "Отключить",
    "shop.title": "Покупки за TON",
    "shop.buy": "Купить",
    "shop.paying": "Оплата...",
    "shop.unlocked": "Открыто",
    "shop.connectWalletToPay": "Подключите кошелек для оплаты",
    "shop.connectWalletToShop": "ПОДКЛЮЧИТЕ КОШЕЛЁК ДЛЯ ПОКУПОК",
    "shop.item.energy": "Сброс кулдауна энергии",
    "shop.item.shield": "Дополнительные щиты",
    "shop.item.magnet": "Дополнительные магниты",
    "shop.item.bundle": "Набор (1+2+3 со скидкой)",
    "purchaseStatus.title": "Активные покупки",
    "purchaseStatus.notPurchased": "Не куплено",
    "purchaseStatus.energyBonus": "Бонус энергии",
    "purchaseStatus.shieldBoost": "Бонус щита",
    "purchaseStatus.magnetBoost": "Бонус магнита",
    "purchaseStatus.maxBalls": "Макс. шаров",
    "leaderboard.title": "Лидерборд",
    "leaderboard.total": "Собрано шаров за всё время",
    "leaderboard.best": "Лучшая попытка",
    "leaderboard.top10": "Топ-10 попыток (локально)",
    "leaderboard.empty": "Пока нет результатов.",
    "leaderboard.globalLater": "Глобальный лидерборд будет позже.",
    "error.walletNotConnected": "Кошелек не подключен",
    "error.invalidAmount": "Неверная сумма",
    "error.transactionFailed": "Ошибка при отправке транзакции",
    "error.network": "Ошибка сети",
    "error.contract": "Ошибка смарт-контракта",
    "error.insufficientBalance": "Недостаточно средств",
    "success.purchase": "Покупка успешно выполнена",
    "game.sound": "Звук",
    "game.muted": "Без звука",
    "game.pause": "Пауза",
    "game.resume": "Продолжить",
    "game.score": "СЧЕТ",
    "game.highScore": "Рекорд",
    "game.energy": "Энергия",
    "game.maxBalls": "Макс. шаров",
    "game.shield": "Щит",
    "game.magnet": "Магнит",
    "game.title": "Neon Pulse",
    "game.onboarding.catchPrefix": "Лови ",
    "game.onboarding.catchHighlight": "энерго-сферы",
    "game.onboarding.avoidPrefix": "Избегай ",
    "game.onboarding.avoidHighlight": "угроз",
    "game.onboarding.unlockHighlight": "Открывай улучшения",
    "game.onboarding.unlockConnector": " за ",
    "game.onboarding.ton": "TON",
    "game.start": "Начать игру",
    "game.paused": "Пауза",
    "game.gameOver": "Игра окончена",
    "game.newRecord": "Новый рекорд",
    "game.restart": "Начать заново",
  },
};

export function getStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(LANG_KEY);
  if (saved === "ru" || saved === "en") return saved;

  const tgLang = (
    window as typeof window & {
      Telegram?: { WebApp?: { initDataUnsafe?: { user?: { language_code?: string } } } };
    }
  ).Telegram?.WebApp?.initDataUnsafe?.user?.language_code;

  const next: Lang = typeof tgLang === "string" && tgLang.toLowerCase().startsWith("ru") ? "ru" : "en";
  window.localStorage.setItem(LANG_KEY, next);
  return next;
}

export function setStoredLang(lang: Lang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANG_KEY, lang);
  window.dispatchEvent(new CustomEvent<Lang>(LANG_CHANGED_EVENT, { detail: lang }));
}

export function translate(lang: Lang, key: string): string {
  return MESSAGES[lang][key] || MESSAGES.en[key] || key;
}

export function useI18n() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(getStoredLang());

    const onStorage = (event: StorageEvent) => {
      if (event.key === LANG_KEY) {
        setLang(getStoredLang());
      }
    };

    const onLangChanged = (event: Event) => {
      const next = (event as CustomEvent<Lang>).detail;
      if (next === "ru" || next === "en") {
        setLang(next);
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(LANG_CHANGED_EVENT, onLangChanged as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LANG_CHANGED_EVENT, onLangChanged as EventListener);
    };
  }, []);

  const t = (key: string) => translate(lang, key);

  return { lang, t };
}
