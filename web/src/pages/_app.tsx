import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import type { TonConnect } from "@tonconnect/sdk";
import { useTonConnectUI } from "@tonconnect/ui-react";
import TelegramAnalytics from "@telegram-apps/analytics";
import { TonConnectDiagnostics } from "@/components/TonConnectDiagnostics";
import "@/styles/globals.css";

const TonConnectUIProvider = dynamic(
  () => import("@tonconnect/ui-react").then((m) => m.TonConnectUIProvider),
  { ssr: false }
);

const analyticsToken = (process.env.NEXT_PUBLIC_TG_ANALYTICS_TOKEN || "").trim();
const analyticsAppName = (process.env.NEXT_PUBLIC_TG_ANALYTICS_APP_NAME || "").trim();
let analyticsInitialized = false;

if (
  typeof window !== "undefined" &&
  !analyticsInitialized &&
  analyticsToken &&
  analyticsAppName
) {
  analyticsInitialized = true;
  TelegramAnalytics.init({ token: analyticsToken, appName: analyticsAppName }).catch((err) => {
    console.warn("[TG_ANALYTICS] init failed", err);
  });
}

function TonConnectRestore() {
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    const connector = (tonConnectUI as unknown as { connector?: { restoreConnection?: () => void; connected?: boolean } }).connector;
    connector?.restoreConnection?.();
    console.log("[TON_CONNECT] restoreConnection done", connector?.connected);
  }, [tonConnectUI]);

  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  const [ready, setReady] = useState(false);
  const [connector, setConnector] = useState<TonConnect | null>(null);
  const manifestUrl = useMemo(() => {
    const fromEnv = (process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST || "").trim();
    if (process.env.NODE_ENV === "development") {
      return fromEnv || "http://localhost:3000/tonconnect-manifest.json";
    }
    return fromEnv;
  }, []);
  const baseUrl = useMemo(() => {
    const envUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
    if (envUrl) return envUrl.replace(/\/$/, "");
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  const walletsListSource = useMemo(() => {
    if (process.env.NODE_ENV === "production") {
      return "https://raw.githubusercontent.com/ton-blockchain/wallets-list/main/wallets-v2.json";
    }
    if (!baseUrl) return "";
    const url = new URL("/wallets.json", baseUrl);
    if (url.hostname.endsWith(".ngrok-free.dev")) {
      url.searchParams.set("ngrok-skip-browser-warning", "true");
    }
    return url.toString();
  }, [baseUrl]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import("@tonconnect/sdk");
      if (!mounted) return;
      const instance = new mod.TonConnect({
        manifestUrl,
        ...(walletsListSource ? { walletsListSource } : {}),
        walletsListCacheTTLMs: 0,
        analytics: { mode: "off" },
      });
      setConnector(instance);
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [manifestUrl, walletsListSource]);

  useEffect(() => {
    const tg = (window as typeof window & { Telegram?: { WebApp?: any } }).Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.disableVerticalSwipes();
    tg.expand();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <>
      <Head>
        <meta name="theme-color" content="#020617" />
        <link rel="icon" href="/ton-icon.png" />
      </Head>
      <TonConnectUIProvider connector={connector!} restoreConnection={false}>
        <TonConnectRestore />
        <TonConnectDiagnostics />
        <Component {...pageProps} />
      </TonConnectUIProvider>
    </>
  );
}

