/**
 * 记账簿（Ledger）路由
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { findAll, findById, insert, update } = require('../db/database');

// GET /api/v1/ledgers - Ledger 列表
router.get('/', (req, res) => {
  try {
    const { merchant_id, consumer_id, status, page = 1, pageSize = 50 } = req.query;
    let list = findAll('ledgers');

    if (merchant_id) list = list.filter(l => l.merchant_id === merchant_id);
    if (consumer_id) list = list.filter(l => l.consumer_id === consumer_id);
    if (status) list = list.filter(l => l.status === status);

    list = list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    const total = list.length;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const paged = list.slice(offset, offset + parseInt(pageSize));

    const merchants = findAll('merchants');
    const consumers = findAll('consumers');

    const result = paged.map(l => {
      const merchant = findById('merchants', l.merchant_id);
      const consumer = findById('consumers', l.consumer_id);
      return {
        ...l,
        merchant_name: merchant?.name || '-',
        consumer_name: consumer?.name || '-',
        consumer_phone: consumer?.phone || '-'
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

// GET /api/v1/ledgers/:id - Ledger 详情
router.get('/:id', (req, res) => {
  try {
    const ledger = findById('ledgers', req.params.id);
    if (!ledger) return res.status(404).json({ code: 404, message: 'Ledger不存在' });

    const merchant = findById('merchants', ledger.merchant_id);
    const consumer = findById('consumers', ledger.consumer_id);
    const transactions = findAll('transactions').filter(t => t.ledger_id === ledger.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ code: 0, message: 'success', data: {
      ...ledger,
      merchant_name: merchant?.name || '-',
      merchant_industry: merchant?.industry || '-',
      merchant_status: merchant?.status || '-',
      consumer_name: consumer?.name || '-',
      consumer_phone: consumer?.phone || '-',
      consumer_status: consumer?.status || '-',
      transactions
    }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/ledgers - 创建 Ledger（开户）
router.post('/', (req, res) => {
  try {
    const { merchant_id, consumer_id } = req.body;
    if (!merchant_id || !consumer_id) {
      return res.status(400).json({ code: 400, message: 'merchant_id 和 consumer_id 必填' });
    }

    const merchant = findById('merchants', merchant_id);
    if (!merchant) return res.status(404).json({ code: 404, message: '商户不存在' });

    const consumer = findById('consumers', consumer_id);
    if (!consumer) return res.status(404).json({ code: 404, message: '消费者不存在' });

    const existing = findAll('ledgers').find(l => l.merchant_id === merchant_id && l.consumer_id === consumer_id);
    if (existing) return res.status(409).json({ code: 409, message: 'Ledger已存在', data: existing });

    const ledger = {
      id: 'ld_' + uuidv4().slice(0, 8), merchant_id, consumer_id,
      balance: 0, total_deposited: 0, total_spent: 0, status: 'active',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
    insert('ledgers', ledger);
    res.json({ code: 0, message: 'Ledger创建成功', data: ledger });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// PATCH /api/v1/ledgers/:id - 更新 Ledger
router.patch('/:id', (req, res) => {
  try {
    const { status } = req.body;
    const ledger = update('ledgers', req.params.id, { status, updated_at: new Date().toISOString() });
    if (!ledger) return res.status(404).json({ code: 404, message: 'Ledger不存在' });
    res.json({ code: 0, message: 'Ledger状态更新成功', data: ledger });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
