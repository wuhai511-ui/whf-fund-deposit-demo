# Unified Architecture Refactor Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** Refactor whf-fund-deposit-demo into a Monorepo, use Prisma/SQLite for backend, and build the Qianzhangtong payment core.

**Architecture:** pnpm workspace with Vue 3 apps, Express backend with Prisma ORM, Qianzhangtong SDK for payment integration.

**Tech Stack:** Node.js, Express, Prisma, SQLite, Vue 3, Vite, pnpm

---

### Task 1: Initialize pnpm Monorepo and Scaffold Apps

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (Root)
- Modify: Move `admin/`, `merchant/`, `miniprogram/`, `pages/` to `apps/`

**Step 1: Write the failing test**
Command: `pnpm ls -r --depth -1`
Expected: FAIL - No workspace configuration found.

**Step 2: Run test — confirm it fails**
Run the command above.

**Step 3: Write minimal implementation**
1. Create `pnpm-workspace.yaml` with `packages: - 'apps/*'`
2. Create root `package.json` with `{ "name": "whf-fund-deposit-monorepo", "private": true }`
3. `mkdir apps`
4. `mv admin merchant miniprogram pages apps/` (Note: adjust references in existing files later, just structure for now)

**Step 4: Run test — confirm it passes**
Command: `pnpm ls -r --depth -1`
Expected: PASS - Should list the moved folders as workspace projects.

**Step 5: Commit**
`git add . && git commit -m "chore: setup pnpm monorepo structure"`

---

### Task 2: Initialize Prisma & Define Schema

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/package.json` (ensure dependencies)

**Step 1: Write the failing test**
Create `server/test-db.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.merchant.findMany().then(console.log).catch(console.error).finally(() => prisma.$disconnect());
```

**Step 2: Run test — confirm it fails**
Command: `cd server && node test-db.js`
Expected: FAIL - Module '@prisma/client' not found.

**Step 3: Write minimal implementation**
1. `cd server && npm install prisma @prisma/client`
2. `npx prisma init --datasource-provider sqlite`
3. Define `Merchant`, `Consumer`, `Ledger`, `Transaction`, `Settlement` models in `prisma/schema.prisma`.
4. Run `npx prisma db push`.

**Step 4: Run test — confirm it passes**
Command: `cd server && node test-db.js`
Expected: PASS - Outputs `[]`.

**Step 5: Commit**
`git add . && git commit -m "feat: init prisma schema"`

---

### Task 3: Build Qianzhangtong SDK Core (RSA Sig/Verify)

**Files:**
- Create: `server/core/payment/qzt.js`
- Create: `server/tests/qzt.test.js`

**Step 1: Write the failing test**
Write test in `server/tests/qzt.test.js` (using a basic assert script):
```javascript
const assert = require('assert');
const { sign, verify } = require('../core/payment/qzt');

const payload = { test: 123 };
const signature = sign(payload);
assert.ok(signature, 'Signature should be generated');
assert.ok(verify(payload, signature), 'Signature should be verified');
console.log('PASS');
```

**Step 2: Run test — confirm it fails**
Command: `node server/tests/qzt.test.js`
Expected: FAIL - missing modules.

**Step 3: Write minimal implementation**
Create `server/core/payment/qzt.js`.
1. Load dummy/test `private_key.pem` and `cloud_public_key.pem`.
2. Implement `sign(payload)` using `crypto.createSign('SHA256')`.
3. Implement `verify(payload, signature)` using `crypto.createVerify('SHA256')`.

**Step 4: Run test — confirm it passes**
Command: `node server/tests/qzt.test.js`
Expected: PASS

**Step 5: Commit**
`git add . && git commit -m "feat: core qzt sdk with rsa sign/verify"`

---

### Task 4: API Layer Data Migration (Refactor)

**Files:**
- Modify: `server/routes/merchants.js` and other routes.
- Modify: `server/index.js`

**Step 1: Write the failing test**
Use curl or supertest to hit `GET /api/v1/merchants` relying on Prisma.

**Step 2: Run test — confirm it fails**
Expected: Existing implementation reads from `fund_deposit.json` instead of SQLite.

**Step 3: Write minimal implementation**
Update `server/routes/merchants.js`, `consumers.js`, `ledgers.js` to use `PrismaClient` instead of the local JSON file.

**Step 4: Run test — confirm it passes**
Test endpoints and ensure they return 200 OK with correct JSON DB data.

**Step 5: Commit**
`git add . && git commit -m "refactor: migrate existing API to prisma"`