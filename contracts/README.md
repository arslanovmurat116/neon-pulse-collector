# Neon Pulse Contracts

This folder contains the Payment contract and a single deployment flow.
No ton-cli, no jettons.

## Contracts

- `payment.fc` — payment contract for game purchases
- `stdlib.fc` — standard library

## Opcodes

- `0x01` energy
- `0x02` shield
- `0x03` magnet
- `0x04` bundle

## Build

```bash
npm run build
```

## Deploy (single method)

```bash
npm run deploy
```

Deployment writes addresses to `contracts/deployment.json`.
See `contracts/DEPLOYMENT.md` for environment configuration.
