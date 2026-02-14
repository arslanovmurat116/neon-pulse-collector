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

const env = parseEnv(envPath);
const baseUrl =
  env.NEXT_PUBLIC_APP_URL && env.NEXT_PUBLIC_APP_URL.trim()
    ? env.NEXT_PUBLIC_APP_URL.trim()
    : "http://localhost:3000";

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
