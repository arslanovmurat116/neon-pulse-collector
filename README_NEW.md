# Neon Pulse Collector

Deployment is now a single non-interactive command for the Payment contract:

```bash
npm run deploy
```

See `DEPLOYMENT.md` and `contracts/DEPLOYMENT.md` for details.

## Telegram Analytics Env

Set these in `web/.env.local` (or Vercel Production env):

```bash
NEXT_PUBLIC_TG_ANALYTICS_TOKEN=...
NEXT_PUBLIC_TG_ANALYTICS_APP_NAME=...
```

## TG-ready (5 steps)

1. `npm run deploy`
2. Copy `contracts/deployment.json` → set `NEXT_PUBLIC_PAYMENT_ADDRESS` in `.env.local`
3. Delete `web/.next` if it exists, then `cd web && npm run dev`
4. Open the web app inside Telegram WebView
5. Connect wallet and make a payment
