# Deployment (Single Method)

This project uses one non-interactive deployment flow based on `@ton/ton` and `@ton/crypto`.
It compiles FunC to code BOC and deploys a single Payment contract with StateInit on TON testnet.
No ton-cli is used.

## Prerequisites

1. Node.js 18+
2. Testnet TON on your wallet

## Configure

Copy `contracts/.env.example` to `contracts/.env` and fill:

- `MNEMONIC` (24 words)
- `NETWORK` (default: `testnet`)
- `TONCENTER_API_KEY` (optional but recommended)
- `OWNER_ADDRESS` (wallet that receives payments)
- `RESERVE_ADDRESS` (wallet for reserved share)
- `RESERVE_BPS` (share for reserve, 0..10000)

The reserve share is intended for future airdrop funding (offchain snapshots).

## Deploy

Run a single command from the project root:

```bash
npm run deploy
```

This command:

1. Compiles `payment.fc` into code BOC
2. Builds StateInit for the Payment contract
3. Deploys the contract
4. Writes addresses to `contracts/deployment.json`

## Frontend update

Copy the deployed address into `.env`:

- `NEXT_PUBLIC_PAYMENT_ADDRESS`
