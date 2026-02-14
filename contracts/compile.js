#!/usr/bin/env node

/**
 * Compile FunC contracts with @ton-community/func-js.
 * Produces code BOC files in ./build.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compileFunc } from '@ton-community/func-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(__dirname, 'build');

const sources = {
  'payment.fc': fs.readFileSync(path.join(__dirname, 'payment.fc'), 'utf8'),
  'stdlib.fc': fs.readFileSync(path.join(__dirname, 'stdlib.fc'), 'utf8'),
};

const targets = [{ name: 'payment', target: 'payment.fc' }];

function ensureBuildDir() {
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
}

async function compileTarget({ name, target }) {
  const result = await compileFunc({
    targets: [target],
    sources,
  });

  if (result.status === 'error') {
    throw new Error(`Compile failed for ${name}: ${result.message}`);
  }

  const codeBoc = Buffer.from(result.codeBoc, 'base64');
  const outPath = path.join(buildDir, `${name}.code.boc`);
  fs.writeFileSync(outPath, codeBoc);

  const reportPath = path.join(buildDir, `${name}.compile.json`);
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

  return { name, outPath, size: codeBoc.length };
}

async function main() {
  console.log('Neon Pulse Collector - Contract Compilation');
  ensureBuildDir();

  const results = [];
  for (const target of targets) {
    const info = await compileTarget(target);
    results.push(info);
    console.log(`Compiled ${info.name}: ${info.outPath} (${info.size} bytes)`);
  }

  const summary = {
    timestamp: new Date().toISOString(),
    outputs: results,
  };
  fs.writeFileSync(path.join(buildDir, 'build-info.json'), JSON.stringify(summary, null, 2));
  console.log('Build info: build/build-info.json');
}

main().catch((error) => {
  console.error('Compilation error:', error.message);
  process.exit(1);
});
