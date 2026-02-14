import { useEffect } from "react";
import { useTonConnectModal, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

export function TonConnectDiagnostics() {
  const [tonConnectUI] = useTonConnectUI();
  const modal = useTonConnectModal();
  const wallet = useTonWallet();

  useEffect(() => {
    if (!tonConnectUI) return;

    const logWallets = async () => {
      const manifestUrl = process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST || "";
      const appUrlEnv = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
      const appUrl =
        appUrlEnv || (typeof window !== "undefined" ? window.location.origin : "");
      let walletsUrl = "";
      if (appUrl) {
        const url = new URL("/wallets.json", appUrl);
        if (url.hostname.endsWith(".ngrok-free.dev")) {
          url.searchParams.set("ngrok-skip-browser-warning", "true");
        }
        walletsUrl = url.toString();
      }
      console.log("[TON_CONNECT] manifestUrl:", manifestUrl || "(auto)");
      console.log("[TON_CONNECT] walletsListSource:", walletsUrl || "(auto)");
      if (manifestUrl) {
        try {
          const res = await fetch(manifestUrl, { cache: "no-store" });
          console.log("[TON_CONNECT] manifest fetch:", res.status, res.headers.get("content-type"));
        } catch (err) {
          console.warn("[TON_CONNECT] manifest fetch failed:", err);
        }
      }
      if (walletsUrl) {
        try {
          const res = await fetch(walletsUrl, { cache: "no-store" });
          console.log("[TON_CONNECT] wallets fetch:", res.status, res.headers.get("content-type"));
        } catch (err) {
          console.warn("[TON_CONNECT] wallets fetch failed:", err);
        }
      }
      const wallets = await tonConnectUI.getWallets();
      const selected = wallet?.device?.appName?.toLowerCase() || "";
      console.log("[TON_CONNECT] Wallets list:");
      wallets.forEach((w) => {
        const bridgeUrl = "bridgeUrl" in w ? w.bridgeUrl : "injected";
        const isSelected = w.appName?.toLowerCase() === selected ? " (selected)" : "";
        console.log(`- ${w.name} | ${bridgeUrl}${isSelected}`);
      });
    };

    const unsubscribe = tonConnectUI.onModalStateChange((state) => {
      if (state.status === "opened") {
        console.log("[TON_CONNECT] Wallet modal opened");
        logWallets();
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI, wallet?.device?.appName]);

  useEffect(() => {
    if (!wallet) return;
    console.log("[TON_CONNECT] Selected wallet:", wallet.device.appName);
  }, [wallet]);

  useEffect(() => {
    if (!modal?.state) return;
    if (modal.state.status === "opened") {
      console.log("[TON_CONNECT] Modal state:", modal.state.status);
    }
  }, [modal?.state]);

  return null;
}
