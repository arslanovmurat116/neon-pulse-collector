import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import type { TonConnect } from "@tonconnect/sdk";
import { TonConnectDiagnostics } from "@/components/TonConnectDiagnostics";
import "@/styles/globals.css";

const TonConnectUIProvider = dynamic(
  () => import("@tonconnect/ui-react").then((m) => m.TonConnectUIProvider),
  { ssr: false }
);

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
    if (tg.isVersionAtLeast("8.0")) tg.requestFullscreen();
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
        <TonConnectDiagnostics />
        <Component {...pageProps} />
      </TonConnectUIProvider>
    </>
  );
}
