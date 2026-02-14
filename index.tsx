
import "./polyfills";
import React from "react";
import ReactDOM from "react-dom/client";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import App from "./App";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const rawManifest =
  (process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST ||
    "/tonconnect-manifest.json") as string;
const manifestUrl =
  rawManifest.startsWith("http://") || rawManifest.startsWith("https://")
    ? rawManifest
    : `${window.location.origin}${rawManifest.startsWith("/") ? rawManifest : `/${rawManifest}`}`;

root.render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl} restoreConnection>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>
);
