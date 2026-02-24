import React, { useEffect, useMemo, useState } from "react";
import { GameScreen } from "@/components/GameScreen";
import { Leaderboard } from "@/components/Leaderboard";
import { PaymentShop } from "@/components/PaymentShop";
import { PurchaseStatus } from "@/components/PurchaseStatus";
import { ModalOverlay } from "@/components/ModalOverlay";
import { WalletConnect } from "@/components/WalletConnect";
import { getUpgrades, PlayerUpgrades, subscribeUpgradesChange } from "@/utils/playerUpgrades";
import { Lang, setStoredLang, useI18n } from "@/i18n";

type ActiveView = "home" | "play" | "leaderboard" | "shop";

const TILE_BASE =
  "w-full p-6 md:p-8 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99]";

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const { lang, t } = useI18n();
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>({
    energyBonus: 0,
    shieldBoost: 0,
    magnetBoost: 0,
    ballsBonus: 0,
  });
  const [latestScore, setLatestScore] = useState<number | null>(null);

  useEffect(() => {
    setUpgrades(getUpgrades());
    const unsubscribe = subscribeUpgradesChange(setUpgrades);
    return () => unsubscribe();
  }, []);

  const changeLang = (nextLang: Lang) => {
    setStoredLang(nextLang);
  };

  const tiles = useMemo(
    () => [
      {
        key: "play",
        title: t("home.play"),
        desc: t("home.playDesc"),
        className: "border-neon-green/40 bg-neon-green/10",
      },
      {
        key: "leaderboard",
        title: t("home.leaderboard"),
        desc: t("home.leaderboardDesc"),
        className: "border-neon-cyan/40 bg-neon-cyan/10",
      },
      {
        key: "shop",
        title: t("home.shop"),
        desc: t("home.shopDesc"),
        className: "border-neon-purple/40 bg-neon-purple/10",
      },
    ],
    [t]
  );

  return (
    <div className="ui-caps relative min-h-screen bg-gradient-to-b from-neon-dark via-neon-dark to-neon-dark/90 text-white">
      {activeView === "home" && (
        <>
          <div className="absolute inset-0 pointer-events-none">
            <GameScreen upgrades={upgrades} active demo />
          </div>
          <div className="absolute inset-0 pointer-events-none bg-slate-950/55 backdrop-blur-[2px]" />
        </>
      )}

      <main className="relative z-10 min-h-screen px-4 md:px-6 py-6 flex items-center justify-center">
        <section className="w-full max-w-xl mx-auto">
          <div className="mb-5 text-center">
            <h1
              className="text-3xl md:text-4xl font-black text-neon-green"
              style={{ textShadow: "0 0 7px rgba(57,255,20,0.7), 0 0 14px rgba(57,255,20,0.7)" }}
            >
              {t("app.name")}
            </h1>
          </div>

          <div className="mb-4 flex items-center justify-center gap-2">
            <WalletConnect />
            <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden text-[10px]">
              <button
                onClick={() => changeLang("ru")}
                className={`px-2 py-1 font-bold ${
                  lang === "ru" ? "bg-neon-green/20 text-neon-green" : "bg-slate-900/60 text-slate-300"
                }`}
              >
                {t("common.langRu")}
              </button>
              <button
                onClick={() => changeLang("en")}
                className={`px-2 py-1 font-bold ${
                  lang === "en" ? "bg-neon-green/20 text-neon-green" : "bg-slate-900/60 text-slate-300"
                }`}
              >
                {t("common.langEn")}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-md mx-auto">
          {tiles.map((tile) => (
            <button
              key={tile.key}
              onClick={() => setActiveView(tile.key as ActiveView)}
              className={`${TILE_BASE} ${tile.className}`}
            >
              <div className="text-xl font-bold">{tile.title}</div>
              <div className="text-sm text-neon-cyan/70 mt-2">{tile.desc}</div>
            </button>
          ))}
          </div>
        </section>
      </main>

      {activeView === "play" && (
        <div className="fixed inset-0 z-50 bg-slate-950">
          <div className="absolute inset-0">
            <GameScreen
              upgrades={upgrades}
              onGameOver={setLatestScore}
              active={activeView === "play"}
            />
          </div>
          <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between bg-slate-950/60 backdrop-blur-sm">
            <h2 className="text-lg md:text-2xl font-bold text-neon-green">{t("home.play")}</h2>
            <button
              onClick={() => setActiveView("home")}
              className="px-3 py-2 rounded-lg bg-slate-800/60 text-white text-sm hover:bg-slate-700/80"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}

      {activeView === "leaderboard" && (
        <ModalOverlay title={t("home.leaderboard")} onClose={() => setActiveView("home")}>
          <Leaderboard latestScore={latestScore} />
        </ModalOverlay>
      )}

      {activeView === "shop" && (
        <ModalOverlay title={t("home.shop")} onClose={() => setActiveView("home")}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentShop />
            <PurchaseStatus />
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
