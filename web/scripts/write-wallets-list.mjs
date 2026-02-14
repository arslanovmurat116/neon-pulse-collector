import fs from "fs";
import path from "path";
import https from "https";

const root = process.cwd();
const publicDir = path.join(root, "public");
const walletsPath = path.join(publicDir, "wallets.json");

const SOURCE_URL = "https://config.ton.org/wallets-v2.json";
const ALLOWED_APPS = new Set(["tonkeeper"]);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

const wallets = await fetchJson(SOURCE_URL);
const filtered = Array.isArray(wallets)
  ? wallets.filter((w) => ALLOWED_APPS.has(String(w.app_name || "").toLowerCase()))
  : [];

if (filtered.length === 0) {
  throw new Error("Filtered wallets list is empty. Check source or allowlist.");
}

ensureDir(publicDir);
fs.writeFileSync(walletsPath, JSON.stringify(filtered, null, 2));

console.log(`Wallets list written: ${walletsPath}`);
console.log(`Allowed wallets: ${[...ALLOWED_APPS].join(", ")}`);
