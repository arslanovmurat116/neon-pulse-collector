import fs from "fs";
import path from "path";

const root = process.cwd();
const contractsEnv = path.join(root, "contracts", ".env");
const contractsExample = path.join(root, "contracts", ".env.example");

const frontendEnvWeb = path.join(root, "web", ".env.local");
const frontendExample = path.join(root, "web", ".env.example");

function copyIfMissing(target, source) {
  if (fs.existsSync(target)) return false;
  if (!fs.existsSync(source)) {
    throw new Error(`Missing example file: ${source}`);
  }
  fs.copyFileSync(source, target);
  return true;
}

const created = [];

if (copyIfMissing(contractsEnv, contractsExample)) {
  created.push(contractsEnv);
}

if (copyIfMissing(frontendEnvWeb, frontendExample)) {
  created.push(frontendEnvWeb);
}

const required = [
  "contracts/.env: MNEMONIC",
  "contracts/.env: OWNER_ADDRESS",
  "contracts/.env: RESERVE_ADDRESS (if RESERVE_BPS > 0)",
  "contracts/.env: RESERVE_BPS",
  "web/.env.local: NEXT_PUBLIC_PAYMENT_ADDRESS",
  "web/.env.local: NEXT_PUBLIC_TON_CONNECT_MANIFEST",
  "web/.env.local: NEXT_PUBLIC_TON_ENDPOINT",
  "web/.env.local: NEXT_PUBLIC_APP_URL (optional)",
];

if (created.length > 0) {
  console.log("Created env files:");
  created.forEach((p) => console.log(`  - ${p}`));
}

console.log("Fields to fill:");
required.forEach((f) => console.log(`  - ${f}`));

