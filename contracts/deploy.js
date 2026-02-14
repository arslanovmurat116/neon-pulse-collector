#!/usr/bin/env node

/**
 * Non-interactive deployment to TON using @ton/ton.
 * Requires MNEMONIC in contracts/.env.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { mnemonicToPrivateKey } from '@ton/crypto';
import {
  Address,
  beginCell,
  Cell,
  contractAddress,
  fromNano,
  internal,
  SendMode,
  toNano,
} from '@ton/core';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const MNEMONIC = process.env.MNEMONIC;
const NETWORK = (process.env.NETWORK || 'testnet').toLowerCase();
const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY || '';
const WORKCHAIN = Number(process.env.WORKCHAIN || 0);
const DEPLOY_VALUE = process.env.DEPLOY_VALUE_TON || '0.05';
const OWNER_ADDRESS = process.env.OWNER_ADDRESS || '';
const RESERVE_ADDRESS = process.env.RESERVE_ADDRESS || '';
const RESERVE_BPS = Number(process.env.RESERVE_BPS || 0);

if (!MNEMONIC) {
  console.error('MNEMONIC is required in contracts/.env');
  process.exit(1);
}

const endpoints = {
  testnet: 'https://testnet.toncenter.com/api/v2/jsonRPC',
  mainnet: 'https://toncenter.com/api/v2/jsonRPC',
};

if (!endpoints[NETWORK]) {
  console.error(`Unknown NETWORK: ${NETWORK}. Use "testnet" or "mainnet".`);
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(label, endpoint, fn) {
  const delays = [1000, 2000, 4000, 8000, 16000];
  let lastError;

  for (let attempt = 0; attempt < delays.length; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const status = error?.response?.status || error?.status || 'unknown';
      console.warn(`[${label}] endpoint=${endpoint} status=${status} attempt=${attempt + 1}/${delays.length}`);

      if (status !== 429 && !(Number(status) >= 500)) {
        throw error;
      }

      lastError = error;
      await sleep(delays[attempt]);
    }
  }

  throw lastError;
}

async function waitForSeqno(walletContract, seqno, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const current = await walletContract.getSeqno();
    if (current > seqno) return current;
    await sleep(1500);
  }
  throw new Error('Timeout waiting for seqno to update');
}

function loadCode(name) {
  const codePath = path.join(__dirname, 'build', `${name}.code.boc`);
  if (!fs.existsSync(codePath)) {
    throw new Error(`Missing code BOC: ${codePath}. Run "npm run build" first.`);
  }
  return Cell.fromBoc(fs.readFileSync(codePath))[0];
}

function buildPaymentData(owner, reserve, reserveBps) {
  return beginCell()
    .storeAddress(owner)
    .storeAddress(reserve)
    .storeUint(reserveBps, 16)
    .endCell();
}

async function main() {
  console.log('Neon Pulse Collector - TON Deployment');
  console.log(`Network: ${NETWORK}`);

  const keyPair = await mnemonicToPrivateKey(MNEMONIC.split(' '));
  const wallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: WORKCHAIN });
  const walletAddress = wallet.address;

  let endpoint = '';
  let endpointSource = '';
  try {
    endpoint = await getHttpEndpoint({ network: NETWORK });
    endpointSource = 'ton-access';
  } catch (e) {
    endpoint = endpoints[NETWORK];
    endpointSource = 'toncenter';
  }

  if (TONCENTER_API_KEY && endpoint.includes('toncenter.com/api/v2/jsonRPC')) {
    const hasQuery = endpoint.includes('?');
    endpoint = `${endpoint}${hasQuery ? '&' : '?'}api_key=${TONCENTER_API_KEY}`;
  }

  console.log(`Endpoint: ${endpoint} (${endpointSource})`);

  const client = new TonClient({
    endpoint,
    apiKey: TONCENTER_API_KEY || undefined,
  });

  const walletState = await withRetry('getContractState(wallet)', endpoint, () =>
    client.getContractState(walletAddress)
  );
  console.log(`Wallet: ${walletAddress.toString({ testOnly: NETWORK === 'testnet' })}`);
  console.log(`Wallet balance: ${fromNano(walletState.balance)} TON`);

  if (Number.isNaN(RESERVE_BPS) || RESERVE_BPS < 0 || RESERVE_BPS > 10000) {
    throw new Error('RESERVE_BPS must be in range 0..10000');
  }
  if (RESERVE_BPS > 0 && !RESERVE_ADDRESS) {
    throw new Error('RESERVE_ADDRESS is required when RESERVE_BPS > 0');
  }

  const ownerAddress = OWNER_ADDRESS ? Address.parse(OWNER_ADDRESS) : walletAddress;
  const reserveAddress = RESERVE_ADDRESS ? Address.parse(RESERVE_ADDRESS) : walletAddress;

  const paymentCode = loadCode('payment');
  const paymentData = buildPaymentData(ownerAddress, reserveAddress, RESERVE_BPS);
  const paymentStateInit = { code: paymentCode, data: paymentData };
  const paymentAddress = contractAddress(WORKCHAIN, paymentStateInit);

  console.log(`Payment contract: ${paymentAddress.toString({ testOnly: NETWORK === 'testnet' })}`);

  const paymentState = await withRetry('getContractState(payment)', endpoint, () =>
    client.getContractState(paymentAddress)
  );
  if (paymentState.state === 'active') {
    throw new Error(`Payment contract already active at ${paymentAddress.toString({ testOnly: NETWORK === 'testnet' })}`);
  }

  const walletContract = client.open(wallet);
  let seqno = await withRetry('getSeqno', endpoint, () => walletContract.getSeqno());

  console.log('Deploying payment contract...');
  await withRetry('sendTransfer', endpoint, () =>
    walletContract.sendTransfer({
      secretKey: keyPair.secretKey,
      seqno,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      messages: [
        internal({
          to: paymentAddress,
          value: toNano(DEPLOY_VALUE),
          init: paymentStateInit,
          body: beginCell().endCell(),
          bounce: false,
        }),
      ],
    })
  );

  seqno = await withRetry('waitForSeqno', endpoint, () => waitForSeqno(walletContract, seqno));

  const deployment = {
    timestamp: new Date().toISOString(),
    network: NETWORK,
    wallet: walletAddress.toString({ testOnly: NETWORK === 'testnet' }),
    contracts: {
      payment: paymentAddress.toString({ testOnly: NETWORK === 'testnet' }),
    },
    config: {
      owner: ownerAddress.toString({ testOnly: NETWORK === 'testnet' }),
      reserve: reserveAddress.toString({ testOnly: NETWORK === 'testnet' }),
      reserveBps: RESERVE_BPS,
    },
  };

  fs.writeFileSync(path.join(__dirname, 'deployment.json'), JSON.stringify(deployment, null, 2));
  console.log('Deployment complete. Saved: contracts/deployment.json');
}

main().catch((error) => {
  console.error('Deployment error:', error.message);
  process.exit(1);
});
