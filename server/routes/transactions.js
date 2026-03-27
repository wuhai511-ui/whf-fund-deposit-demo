/**
 * 交易路由
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

// GET /api/v1/transactions - 交易列表
router.get('/', async (req, res) => {
  try {
    const { merchant_id, consumer_id, ledger_id, type, status, page = 1, pageSize = 50 } = req.query;
    const where = {};
    if (merchant_id) where.merchantId = merchant_id;
    if (consumer_id) where.consumerId = consumer_id;
    if (ledger_id) where.ledgerId = ledger_id;
    if (type) where.type = type;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
        include: { merchant: true, consumer: true }
      }),
      prisma.transaction.count({ where })
    ]);

    const result = transactions.map(t => ({
      ...t,
      amount: Number(t.amount),
      balance_before: Number(t.balanceBefore),
      balance_after: Number(t.balanceAfter),
      merchant_name: t.merchant?.name || '-',
      consumer_name: t.consumer?.name || '-'
    }));

    res.json({ code: 0, message: 'success', data: {
      list: result,
      pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// GET /api/v1/transactions/:id - 交易详情
router.get('/:id', async (req, res) => {
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { merchant: true, consumer: true, ledger: true }
    });
    if (!tx) return res.status(404).json({ code: 404, message: '交易不存在' });

    res.json({ code: 0, message: 'success', data: {
      ...tx,
      amount: Number(tx.amount),
      balance_before: Number(tx.balanceBefore),
      balance_after: Number(tx.balanceAfter),
      merchant_name: tx.merchant?.name || '-',
      consumer_name: tx.consumer?.name || '-',
      current_balance: tx.ledger ? Number(tx.ledger.balance) : 0
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// POST /api/v1/transactions/deposit - 预存资金
router.post('/deposit', async (req, res) => {
  const { merchant_id, consumer_id, amount, description = '资金预存' } = req.body;

  if (!merchant_id || !consumer_id || !amount) {
    return res.status(400).json({ code: 400, message: 'merchant_id, consumer_id, amount 必填' });
  }
  if (amount <= 0) return res.status(400).json({ code: 400, message: '金额必须大于0' });

  try {
    // 查找或创建 Ledger
    let ledger = await prisma.ledger.findFirst({
      where: { merchantId: merchant_id, consumerId: consumer_id }
    });

    if (!ledger) {
      ledger = await prisma.ledger.create({
        data: {
          id: 'ld_' + uuidv4().slice(0, 8),
          merchantId: merchant_id,
          consumerId: consumer_id,
          balance: 0,
          totalDeposited: 0,
          totalSpent: 0,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else if (ledger.status !== 'active') {
      return res.status(400).json({ code: 400, message: 'Ledger状态不允许交易' });
    }

    const txId = 't_' + uuidv4().slice(0, 8);
    const balanceBefore = Number(ledger.balance);
    const balanceAfter = balanceBefore + Number(amount);

    // 更新 Ledger
    const [updatedLedger, tx] = await prisma.$transaction([
      prisma.ledger.update({
        where: { id: ledger.id },
        data: {
          balance: balanceAfter,
          totalDeposited: Number(ledger.totalDeposited) + Number(amount),
          updatedAt: new Date()
        }
      }),
      prisma.transaction.create({
        data: {
          id: txId,
          ledgerId: ledger.id,
          merchantId: merchant_id,
          consumerId: consumer_id,
          type: 'deposit',
          amount: Number(amount),
          balanceBefore,
          balanceAfter,
          status: 'completed',
          description,
          createdAt: new Date()
        }
      })
    ]);

    res.json({ code: 0, message: '预存成功', data: {
      transaction: {
        ...tx,
        amount: Number(tx.amount),
        balance_before: Number(tx.balanceBefore),
        balance_after: Number(tx.balanceAfter)
      },
      ledger: {
        id: updatedLedger.id,
        balance: Number(updatedLedger.balance),
        total_deposited: Number(updatedLedger.totalDeposited),
        total_spent: Number(updatedLedger.totalSpent)
      }
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// POST /api/v1/transactions/withdraw - 消费扣款
router.post('/withdraw', async (req, res) => {
  const { ledger_id, amount, description = '消费扣款' } = req.body;
  if (!ledger_id || !amount) return res.status(400).json({ code: 400, message: 'ledger_id, amount 必填' });
  if (amount <= 0) return res.status(400).json({ code: 400, message: '金额必须大于0' });

  try {
    const ledger = await prisma.ledger.findUnique({ where: { id: ledger_id } });
    if (!ledger) return res.status(404).json({ code: 404, message: 'Ledger不存在' });
    if (ledger.status !== 'active') return res.status(400).json({ code: 400, message: 'Ledger状态不允许交易' });
    if (Number(ledger.balance) < amount) {
      return res.status(400).json({ code: 400, message: '余额不足', data: { available: Number(ledger.balance) } });
    }

    const txId = 't_' + uuidv4().slice(0, 8);
    const balanceBefore = Number(ledger.balance);
    const balanceAfter = balanceBefore - Number(amount);

    const [updatedLedger, tx] = await prisma.$transaction([
      prisma.ledger.update({
        where: { id: ledger.id },
        data: {
          balance: balanceAfter,
          totalSpent: Number(ledger.totalSpent) + Number(amount),
          updatedAt: new Date()
        }
      }),
      prisma.transaction.create({
        data: {
          id: txId,
          ledgerId: ledger.id,
          merchantId: ledger.merchantId,
          consumerId: ledger.consumerId,
          type: 'withdraw',
          amount: Number(amount),
          balanceBefore,
          balanceAfter,
          status: 'completed',
          description,
          createdAt: new Date()
        }
      })
    ]);

    res.json({ code: 0, message: '扣款成功', data: {
      transaction: {
        ...tx,
        amount: Number(tx.amount),
        balance_before: Number(tx.balanceBefore),
        balance_after: Number(tx.balanceAfter)
      },
      ledger: {
        id: updatedLedger.id,
        balance: Number(updatedLedger.balance),
        total_deposited: Number(updatedLedger.totalDeposited),
        total_spent: Number(updatedLedger.totalSpent)
      }
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// POST /api/v1/transactions/refund - 退款
router.post('/refund', async (req, res) => {
  const { ledger_id, amount, description = '退款' } = req.body;
  if (!ledger_id || !amount) return res.status(400).json({ code: 400, message: 'ledger_id, amount 必填' });
  if (amount <= 0) return res.status(400).json({ code: 400, message: '金额必须大于0' });

  try {
    const ledger = await prisma.ledger.findUnique({ where: { id: ledger_id } });
    if (!ledger) return res.status(404).json({ code: 404, message: 'Ledger不存在' });
    if (ledger.status !== 'active') return res.status(400).json({ code: 400, message: 'Ledger状态不允许交易' });

    const txId = 't_' + uuidv4().slice(0, 8);
    const balanceBefore = Number(ledger.balance);
    const balanceAfter = balanceBefore + Number(amount);

    const [updatedLedger, tx] = await prisma.$transaction([
      prisma.ledger.update({
        where: { id: ledger.id },
        data: { balance: balanceAfter, updatedAt: new Date() }
      }),
      prisma.transaction.create({
        data: {
          id: txId,
          ledgerId: ledger.id,
          merchantId: ledger.merchantId,
          consumerId: ledger.consumerId,
          type: 'refund',
          amount: Number(amount),
          balanceBefore,
          balanceAfter,
          status: 'completed',
          description,
          createdAt: new Date()
        }
      })
    ]);

    res.json({ code: 0, message: '退款成功', data: {
      ...tx,
      amount: Number(tx.amount),
      balance_before: Number(tx.balanceBefore),
      balance_after: Number(tx.balanceAfter)
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
