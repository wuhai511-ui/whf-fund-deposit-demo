/**
 * 消费者路由
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

// GET /api/v1/consumers - 消费者列表
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const [consumers, total] = await Promise.all([
      prisma.consumer.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
        include: {
          ledgers: { select: { balance: true } }
        }
      }),
      prisma.consumer.count({ where })
    ]);

    const result = consumers.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      status: c.status,
      created_at: c.createdAt,
      ledger_count: c.ledgers.length,
      total_balance: c.ledgers.reduce((s, l) => s + Number(l.balance), 0)
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

// GET /api/v1/consumers/:id - 消费者详情
router.get('/:id', async (req, res) => {
  try {
    const consumer = await prisma.consumer.findUnique({ where: { id: req.params.id } });
    if (!consumer) return res.status(404).json({ code: 404, message: '消费者不存在' });

    const ledgers = await prisma.ledger.findMany({
      where: { consumerId: consumer.id },
      include: { merchant: true }
    });
    const recentTx = await prisma.transaction.findMany({
      where: { consumerId: consumer.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { merchant: true }
    });

    const result = {
      id: consumer.id,
      name: consumer.name,
      phone: consumer.phone,
      status: consumer.status,
      created_at: consumer.createdAt,
      ledgers: ledgers.map(l => ({
        ...l,
        balance: Number(l.balance),
        total_deposited: Number(l.totalDeposited),
        total_spent: Number(l.totalSpent),
        merchant_name: l.merchant?.name || '-',
        merchant_industry: l.merchant?.industry || '-'
      })),
      recent_transactions: recentTx.map(t => ({
        ...t,
        amount: Number(t.amount),
        balance_before: Number(t.balanceBefore),
        balance_after: Number(t.balanceAfter),
        merchant_name: t.merchant?.name || '-'
      }))
    };

    res.json({ code: 0, message: 'success', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// POST /api/v1/consumers - 创建消费者
router.post('/', async (req, res) => {
  try {
    const { name, phone, openid, id_card } = req.body;
    if (!phone) return res.status(400).json({ code: 400, message: '手机号必填' });

    const existing = await prisma.consumer.findUnique({ where: { phone } });
    if (existing) return res.status(409).json({ code: 409, message: '该手机号已注册' });

    const consumer = await prisma.consumer.create({
      data: {
        id: 'c_' + uuidv4().slice(0, 8),
        name: name || null,
        phone,
        status: 'active',
        createdAt: new Date()
      }
    });

    res.json({ code: 0, message: '消费者创建成功', data: {
      id: consumer.id,
      name: consumer.name,
      phone: consumer.phone,
      status: consumer.status,
      created_at: consumer.createdAt
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// GET /api/v1/consumers/:id/ledgers - 消费者的所有Ledger
router.get('/:id/ledgers', async (req, res) => {
  try {
    const ledgers = await prisma.ledger.findMany({
      where: { consumerId: req.params.id },
      orderBy: { updatedAt: 'desc' },
      include: { merchant: true }
    });

    const result = ledgers.map(l => ({
      ...l,
      balance: Number(l.balance),
      total_deposited: Number(l.totalDeposited),
      total_spent: Number(l.totalSpent),
      merchant_name: l.merchant?.name || '-',
      merchant_industry: l.merchant?.industry || '-'
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
