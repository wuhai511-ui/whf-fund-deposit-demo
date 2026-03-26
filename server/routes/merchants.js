/**
 * 商户路由
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { findAll, findById, insert, update } = require('../db/database');

// GET /api/v1/merchants - 商户列表
router.get('/', (req, res) => {
  try {
    const { status, industry, page = 1, pageSize = 20 } = req.query;
    let list = findAll('merchants');

    if (status) list = list.filter(m => m.status === status);
    if (industry) list = list.filter(m => m.industry === industry);

    const total = list.length;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const paged = list.slice(offset, offset + parseInt(pageSize));

    // 补充统计
    const ledgers = findAll('ledgers');
    const result = paged.map(m => {
      const mLedgers = ledgers.filter(l => l.merchant_id === m.id);
      return {
        ...m,
        ledger_count: mLedgers.length,
        total_balance: mLedgers.reduce((s, l) => s + (l.balance || 0), 0)
      };
    });

    res.json({ code: 0, message: 'success', data: {
      list: result,
      pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
    }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// GET /api/v1/merchants/:id - 商户详情
router.get('/:id', (req, res) => {
  try {
    const merchant = findById('merchants', req.params.id);
    if (!merchant) return res.status(404).json({ code: 404, message: '商户不存在' });

    const ledgers = findAll('ledgers').filter(l => l.merchant_id === merchant.id);
    const transactions = findAll('transactions').filter(t => t.merchant_id === merchant.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
    const consumers = findAll('consumers');

    const stats = {
      consumer_count: new Set(ledgers.map(l => l.consumer_id)).size,
      ledger_count: ledgers.length,
      total_balance: ledgers.reduce((s, l) => s + (l.balance || 0), 0),
      total_deposited: ledgers.reduce((s, l) => s + (l.total_deposited || 0), 0),
    };

    const recentTx = transactions.map(t => {
      const consumer = findById('consumers', t.consumer_id);
      return { ...t, consumer_name: consumer?.name || '-' };
    });

    res.json({ code: 0, message: 'success', data: { ...merchant, stats, recent_transactions: recentTx }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/merchants - 创建商户
router.post('/', (req, res) => {
  try {
    const { name, industry = 'general', contact_phone } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '商户名称必填' });

    const merchant = {
      id: 'm_' + uuidv4().slice(0, 8),
      name, industry, contact_phone: contact_phone || null,
      status: 'active', created_at: new Date().toISOString()
    };
    insert('merchants', merchant);
    res.json({ code: 0, message: '商户创建成功', data: merchant });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// PATCH /api/v1/merchants/:id - 更新商户
router.patch('/:id', (req, res) => {
  try {
    const { name, industry, contact_phone, status } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (industry !== undefined) updates.industry = industry;
    if (contact_phone !== undefined) updates.contact_phone = contact_phone;
    if (status !== undefined) updates.status = status;
    updates.updated_at = new Date().toISOString();

    const merchant = update('merchants', req.params.id, updates);
    if (!merchant) return res.status(404).json({ code: 404, message: '商户不存在' });
    res.json({ code: 0, message: '更新成功', data: merchant });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// GET /api/v1/merchants/:id/ledgers - 商户的所有Ledger
router.get('/:id/ledgers', (req, res) => {
  try {
    const ledgers = findAll('ledgers').filter(l => l.merchant_id === req.params.id)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    const consumers = findAll('consumers');

    const result = ledgers.map(l => {
      const consumer = findById('consumers', l.consumer_id);
      return { ...l, consumer_name: consumer?.name || '-', consumer_phone: consumer?.phone || '-' };
    });
    res.json({ code: 0, message: 'success', data: result });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
