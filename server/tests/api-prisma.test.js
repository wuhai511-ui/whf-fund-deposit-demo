/**
 * API Prisma Migration Test
 * Tests that all routes work with Prisma (not JSON DB)
 */
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  console.log('\n=== API Prisma Migration Tests ===\n');

  // Test 1: Prisma client can connect
  await test('Prisma client can connect', async () => {
    await prisma.$connect();
  });

  // Test 2: Merchant model exists
  await test('prisma.merchant.findMany() works', async () => {
    const merchants = await prisma.merchant.findMany();
    if (!Array.isArray(merchants)) throw new Error('Expected array');
  });

  // Test 3: Consumer model exists
  await test('prisma.consumer.findMany() works', async () => {
    const consumers = await prisma.consumer.findMany();
    if (!Array.isArray(consumers)) throw new Error('Expected array');
  });

  // Test 4: Ledger model exists
  await test('prisma.ledger.findMany() works', async () => {
    const ledgers = await prisma.ledger.findMany();
    if (!Array.isArray(ledgers)) throw new Error('Expected array');
  });

  // Test 5: Transaction model exists
  await test('prisma.transaction.findMany() works', async () => {
    const txs = await prisma.transaction.findMany();
    if (!Array.isArray(txs)) throw new Error('Expected array');
  });

  // Test 6: Settlement model exists
  await test('prisma.settlement.findMany() works', async () => {
    const settlements = await prisma.settlement.findMany();
    if (!Array.isArray(settlements)) throw new Error('Expected array');
  });

  // Test 7: Server starts without db/database.js dependency
  await test('Server starts and /api/v1/merchants returns 200', async () => {
    // Start server in background, then curl
    const http = require('http');
    const { spawn } = require('child_process');
    
    const server = spawn('node', ['index.js'], { 
      cwd: '/home/admin/.openclaw/workspace/whf-fund-deposit-demo/server',
      detached: true 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const result = await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3000/api/v1/merchants', res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.setTimeout(3000, () => { req.destroy(); reject(new Error('Request timeout')); });
      });
      
      if (result.status !== 200) {
        throw new Error(`Expected 200, got ${result.status}: ${result.body}`);
      }
      
      const json = JSON.parse(result.body);
      if (json.code !== 0) throw new Error(`Expected code=0, got ${json.code}`);
    } finally {
      process.kill(-server.pid);
    }
  });

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
