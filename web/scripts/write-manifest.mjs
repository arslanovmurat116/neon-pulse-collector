import fs from "fs";
import path from "path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const publicDir = path.join(root, "public");
const manifestPath = path.join(publicDir, "tonconnect-manifest.json");
const iconPath = path.join(publicDir, "ton-icon.png");

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    out[key] = val;
  }
  return out;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const fileEnv = parseEnv(envPath);

const appUrlFromEnv =
  (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim()) ||
  (fileEnv.NEXT_PUBLIC_APP_URL && fileEnv.NEXT_PUBLIC_APP_URL.trim());

const vercelUrl =
  process.env.VERCEL_URL && process.env.VERCEL_URL.trim()
    ? `https://${process.env.VERCEL_URL.trim()}`
    : "";

let baseUrl = appUrlFromEnv || vercelUrl;

if (!baseUrl) {
  if (process.env.NODE_ENV === "development") baseUrl = "http://localhost:3000";
  else
    throw new Error(
      "NEXT_PUBLIC_APP_URL (или VERCEL_URL) не задан — нельзя собрать manifest без домена"
    );
}

baseUrl = baseUrl.replace(/\/$/, "");

const manifest = {
  url: baseUrl,
  name: "Neon Pulse Collector",
  iconUrl: `${baseUrl.replace(/\/$/, "")}/ton-icon.png`,
};

ensureDir(publicDir);
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

if (!fs.existsSync(iconPath)) {
  const b64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1+f6wAAAAASUVORK5CYII=";
  const bytes = Buffer.from(b64, "base64");
  fs.writeFileSync(iconPath, bytes);
}

console.log(`Manifest written: ${manifestPath}`);
console.log(`Manifest URL: ${manifest.url}`);
