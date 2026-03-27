/**
 * 清分路由
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

// GET /api/v1/settlements - 清分列表
router.get('/', async (req, res) => {
  try {
    const { merchant_id, status, page = 1, pageSize = 20 } = req.query;
    const where = {};
    if (merchant_id) where.merchantId = merchant_id;
    if (status) where.status = status;

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
        include: { merchant: true }
      }),
      prisma.settlement.count({ where })
    ]);

    const result = settlements.map(s => ({
      ...s,
      total_amount: Number(s.amount),
      merchant_name: s.merchant?.name || '-'
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

// GET /api/v1/settlements/:id - 清分详情
router.get('/:id', async (req, res) => {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: req.params.id },
      include: { merchant: true }
    });
    if (!settlement) return res.status(404).json({ code: 404, message: '清分记录不存在' });

    res.json({ code: 0, message: 'success', data: {
      ...settlement,
      total_amount: Number(settlement.amount),
      merchant_name: settlement.merchant?.name || '-'
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// POST /api/v1/settlements - 创建清分
router.post('/', async (req, res) => {
  try {
    const { merchant_id, period, total_amount } = req.body;
    if (!merchant_id || !period) return res.status(400).json({ code: 400, message: 'merchant_id, period 必填' });

    const settlement = await prisma.settlement.create({
      data: {
        id: 'st_' + uuidv4().slice(0, 8),
        merchantId: merchant_id,
        amount: total_amount || 0,
        status: 'pending',
        createdAt: new Date()
      }
    });

    res.json({ code: 0, message: '清分记录创建成功', data: {
      id: settlement.id,
      merchant_id: settlement.merchantId,
      period,
      total_amount: Number(settlement.amount),
      status: settlement.status,
      created_at: settlement.createdAt
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// PATCH /api/v1/settlements/:id - 更新清分
router.patch('/:id', async (req, res) => {
  try {
    const { status, total_amount } = req.body;
    const data = {};
    if (status) data.status = status;
    if (total_amount !== undefined) data.amount = total_amount;
    if (status === 'completed') data.settledAt = new Date();

    const settlement = await prisma.settlement.update({ where: { id: req.params.id }, data });
    res.json({ code: 0, message: '清分更新成功', data: {
      ...settlement,
      total_amount: Number(settlement.amount),
      settled_at: settlement.settledAt
    }});
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ code: 404, message: '清分记录不存在' });
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
