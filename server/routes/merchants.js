/**
 * 商户路由
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

// GET /api/v1/merchants - 商户列表
router.get('/', async (req, res) => {
  try {
    const { status, industry, page = 1, pageSize = 20 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (industry) where.industry = industry;

    const [merchants, total] = await Promise.all([
      prisma.merchant.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
        include: {
          ledgers: {
            select: { balance: true, totalDeposited: true, consumerId: true }
          }
        }
      }),
      prisma.merchant.count({ where })
    ]);

    const result = merchants.map(m => ({
      id: m.id,
      name: m.name,
      industry: m.industry,
      status: m.status,
      created_at: m.createdAt,
      ledger_count: m.ledgers.length,
      total_balance: m.ledgers.reduce((s, l) => s + Number(l.balance), 0)
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

// GET /api/v1/merchants/:id - 商户详情
router.get('/:id', async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { id: req.params.id } });
    if (!merchant) return res.status(404).json({ code: 404, message: '商户不存在' });

    const ledgers = await prisma.ledger.findMany({ where: { merchantId: merchant.id } });
    const transactions = await prisma.transaction.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const consumerIds = [...new Set(ledgers.map(l => l.consumerId))];
    const consumers = await prisma.consumer.findMany({ where: { id: { in: consumerIds } } });
    const consumerMap = Object.fromEntries(consumers.map(c => [c.id, c]));

    const stats = {
      consumer_count: consumerIds.length,
      ledger_count: ledgers.length,
      total_balance: ledgers.reduce((s, l) => s + Number(l.balance), 0),
      total_deposited: ledgers.reduce((s, l) => s + Number(l.totalDeposited), 0),
    };

    const recentTx = transactions.map(t => ({
      ...t,
      amount: Number(t.amount),
      balance_before: Number(t.balanceBefore),
      balance_after: Number(t.balanceAfter),
      consumer_name: consumerMap[t.consumerId]?.name || '-'
    }));

    res.json({ code: 0, message: 'success', data: {
      id: merchant.id,
      name: merchant.name,
      industry: merchant.industry,
      status: merchant.status,
      created_at: merchant.createdAt,
      stats,
      recent_transactions: recentTx
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// POST /api/v1/merchants - 创建商户
router.post('/', async (req, res) => {
  try {
    const { name, industry = 'general' } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '商户名称必填' });

    const merchant = await prisma.merchant.create({
      data: {
        id: 'm_' + uuidv4().slice(0, 8),
        name,
        industry,
        status: 'active',
        createdAt: new Date()
      }
    });

    res.json({ code: 0, message: '商户创建成功', data: {
      id: merchant.id,
      name: merchant.name,
      industry: merchant.industry,
      status: merchant.status,
      created_at: merchant.createdAt
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// PATCH /api/v1/merchants/:id - 更新商户
router.patch('/:id', async (req, res) => {
  try {
    const { name, industry, status } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (industry !== undefined) data.industry = industry;
    if (status !== undefined) data.status = status;

    const merchant = await prisma.merchant.update({ where: { id: req.params.id }, data });
    res.json({ code: 0, message: '更新成功', data: {
      id: merchant.id,
      name: merchant.name,
      industry: merchant.industry,
      status: merchant.status,
      created_at: merchant.createdAt
    }});
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ code: 404, message: '商户不存在' });
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// GET /api/v1/merchants/:id/ledgers - 商户的所有Ledger
router.get('/:id/ledgers', async (req, res) => {
  try {
    const ledgers = await prisma.ledger.findMany({
      where: { merchantId: req.params.id },
      orderBy: { updatedAt: 'desc' },
      include: { consumer: true }
    });

    const result = ledgers.map(l => ({
      ...l,
      balance: Number(l.balance),
      total_deposited: Number(l.totalDeposited),
      total_spent: Number(l.totalSpent),
      consumer_name: l.consumer?.name || '-',
      consumer_phone: l.consumer?.phone || '-'
    }));

    res.json({ code: 0, message: 'success', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
