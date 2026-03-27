/**
 * 记账簿（Ledger）路由
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

// GET /api/v1/ledgers - Ledger 列表
router.get('/', async (req, res) => {
  try {
    const { merchant_id, consumer_id, status, page = 1, pageSize = 50 } = req.query;
    const where = {};
    if (merchant_id) where.merchantId = merchant_id;
    if (consumer_id) where.consumerId = consumer_id;
    if (status) where.status = status;

    const [ledgers, total] = await Promise.all([
      prisma.ledger.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
        orderBy: { updatedAt: 'desc' },
        include: { merchant: true, consumer: true }
      }),
      prisma.ledger.count({ where })
    ]);

    const result = ledgers.map(l => ({
      ...l,
      balance: Number(l.balance),
      total_deposited: Number(l.totalDeposited),
      total_spent: Number(l.totalSpent),
      merchant_name: l.merchant?.name || '-',
      consumer_name: l.consumer?.name || '-',
      consumer_phone: l.consumer?.phone || '-'
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

// GET /api/v1/ledgers/:id - Ledger 详情
router.get('/:id', async (req, res) => {
  try {
    const ledger = await prisma.ledger.findUnique({
      where: { id: req.params.id },
      include: { merchant: true, consumer: true, transactions: { orderBy: { createdAt: 'desc' } } }
    });
    if (!ledger) return res.status(404).json({ code: 404, message: 'Ledger不存在' });

    res.json({ code: 0, message: 'success', data: {
      id: ledger.id,
      merchant_id: ledger.merchantId,
      consumer_id: ledger.consumerId,
      balance: Number(ledger.balance),
      total_deposited: Number(ledger.totalDeposited),
      total_spent: Number(ledger.totalSpent),
      status: ledger.status,
      created_at: ledger.createdAt,
      updated_at: ledger.updatedAt,
      merchant_name: ledger.merchant?.name || '-',
      merchant_industry: ledger.merchant?.industry || '-',
      merchant_status: ledger.merchant?.status || '-',
      consumer_name: ledger.consumer?.name || '-',
      consumer_phone: ledger.consumer?.phone || '-',
      consumer_status: ledger.consumer?.status || '-',
      transactions: ledger.transactions.map(t => ({
        ...t,
        amount: Number(t.amount),
        balance_before: Number(t.balanceBefore),
        balance_after: Number(t.balanceAfter)
      }))
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// POST /api/v1/ledgers - 创建 Ledger（开户）
router.post('/', async (req, res) => {
  try {
    const { merchant_id, consumer_id } = req.body;
    if (!merchant_id || !consumer_id) {
      return res.status(400).json({ code: 400, message: 'merchant_id 和 consumer_id 必填' });
    }

    const [merchant, consumer] = await Promise.all([
      prisma.merchant.findUnique({ where: { id: merchant_id } }),
      prisma.consumer.findUnique({ where: { id: consumer_id } })
    ]);
    if (!merchant) return res.status(404).json({ code: 404, message: '商户不存在' });
    if (!consumer) return res.status(404).json({ code: 404, message: '消费者不存在' });

    const existing = await prisma.ledger.findFirst({ where: { merchantId: merchant_id, consumerId: consumer_id } });
    if (existing) return res.status(409).json({ code: 409, message: 'Ledger已存在', data: {
      id: existing.id,
      merchant_id: existing.merchantId,
      consumer_id: existing.consumerId,
      balance: Number(existing.balance),
      total_deposited: Number(existing.totalDeposited),
      total_spent: Number(existing.totalSpent),
      status: existing.status,
      created_at: existing.createdAt,
      updated_at: existing.updatedAt
    }});

    const ledger = await prisma.ledger.create({
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

    res.json({ code: 0, message: 'Ledger创建成功', data: {
      id: ledger.id,
      merchant_id: ledger.merchantId,
      consumer_id: ledger.consumerId,
      balance: Number(ledger.balance),
      total_deposited: Number(ledger.totalDeposited),
      total_spent: Number(ledger.totalSpent),
      status: ledger.status,
      created_at: ledger.createdAt,
      updated_at: ledger.updatedAt
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// PATCH /api/v1/ledgers/:id - 更新 Ledger
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const ledger = await prisma.ledger.update({
      where: { id: req.params.id },
      data: { status, updatedAt: new Date() }
    });
    res.json({ code: 0, message: 'Ledger状态更新成功', data: {
      id: ledger.id,
      merchant_id: ledger.merchantId,
      consumer_id: ledger.consumerId,
      balance: Number(ledger.balance),
      total_deposited: Number(ledger.totalDeposited),
      total_spent: Number(ledger.totalSpent),
      status: ledger.status,
      created_at: ledger.createdAt,
      updated_at: ledger.updatedAt
    }});
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ code: 404, message: 'Ledger不存在' });
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
