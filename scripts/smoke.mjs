import fs from "fs";
import path from "path";
// Avoid dependency on @ton/core at root; use a lightweight friendly address check.

const root = process.cwd();

const contractsEnv = path.join(root, "contracts", ".env");
const frontendEnvWeb = path.join(root, "web", ".env.local");
const manifestPath = path.join(root, "web", "public", "tonconnect-manifest.json");
const deploymentPath = path.join(root, "contracts", "deployment.json");

function readEnv(filePath) {
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

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

// 1) .env presence
assert(fs.existsSync(contractsEnv), "contracts/.env отсутствует");
const frontendEnv = frontendEnvWeb;
assert(fs.existsSync(frontendEnv), "web/.env.local отсутствует");

// 2) manifest exists
assert(fs.existsSync(manifestPath), "tonconnect-manifest.json missing");

// 3) manifest URL in env
const env = readEnv(frontendEnv);
const manifestUrl = env.NEXT_PUBLIC_TON_CONNECT_MANIFEST || "";
assert(Boolean(manifestUrl), "NEXT_PUBLIC_TON_CONNECT_MANIFEST is not set");
const okManifest =
  manifestUrl === "/tonconnect-manifest.json" ||
  manifestUrl.endsWith("/tonconnect-manifest.json") ||
  manifestUrl.startsWith("http://") ||
  manifestUrl.startsWith("https://");
assert(okManifest, "NEXT_PUBLIC_TON_CONNECT_MANIFEST has invalid URL");
const placeholder = ["<", "public-domain", ">"].join("");
assert(!manifestUrl.includes(placeholder), "NEXT_PUBLIC_TON_CONNECT_MANIFEST contains placeholder");
assert(!manifestUrl.includes("VITE_"), "NEXT_PUBLIC_TON_CONNECT_MANIFEST contains VITE_");

// 3.1) manifest JSON validity
const manifestRaw = fs.readFileSync(manifestPath, "utf8");
const manifestJson = JSON.parse(manifestRaw);
assert(Boolean(manifestJson.url), "manifest.url missing");
assert(Boolean(manifestJson.name), "manifest.name missing");
assert(Boolean(manifestJson.iconUrl), "manifest.iconUrl missing");

function isValidFriendlyAddress(addr) {
  if (typeof addr !== "string") return false;
  const trimmed = addr.trim();
  if (trimmed.length < 48 || trimmed.length > 50) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return false;
  return true;
}

// 4) deployment.json + valid address
assert(fs.existsSync(deploymentPath), "contracts/deployment.json отсутствует");
const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
const addr = deployment?.contracts?.payment;
assert(Boolean(addr), "deployment.json не содержит contracts.payment");
assert(isValidFriendlyAddress(addr), "contracts.payment не похож на валидный адрес");

console.log("OK: smoke checks passed");

