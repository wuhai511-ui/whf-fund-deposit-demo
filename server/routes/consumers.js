/**
 * 消费者路由
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { findAll, findById, insert } = require('../db/database');

// GET /api/v1/consumers - 消费者列表
router.get('/', (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    let list = findAll('consumers');
    if (status) list = list.filter(c => c.status === status);

    const total = list.length;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const paged = list.slice(offset, offset + parseInt(pageSize));

    const ledgers = findAll('ledgers');
    const result = paged.map(c => {
      const cLedgers = ledgers.filter(l => l.consumer_id === c.id);
      return {
        ...c,
        ledger_count: cLedgers.length,
        total_balance: cLedgers.reduce((s, l) => s + (l.balance || 0), 0)
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

// GET /api/v1/consumers/:id - 消费者详情
router.get('/:id', (req, res) => {
  try {
    const consumer = findById('consumers', req.params.id);
    if (!consumer) return res.status(404).json({ code: 404, message: '消费者不存在' });

    const ledgers = findAll('ledgers').filter(l => l.consumer_id === consumer.id);
    const merchants = findAll('merchants');
    const txResult = ledgers.map(l => {
      const merchant = findById('merchants', l.merchant_id);
      return { ...l, merchant_name: merchant?.name || '-', merchant_industry: merchant?.industry || '-' };
    });

    const recentTx = findAll('transactions').filter(t => t.consumer_id === consumer.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)
      .map(t => { const m = findById('merchants', t.merchant_id); return { ...t, merchant_name: m?.name || '-' }; });

    res.json({ code: 0, message: 'success', data: { ...consumer, ledgers: txResult, recent_transactions: recentTx }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/consumers - 创建消费者
router.post('/', (req, res) => {
  try {
    const { name, phone, openid, id_card } = req.body;
    if (!phone) return res.status(400).json({ code: 400, message: '手机号必填' });

    const existing = findAll('consumers').find(c => c.phone === phone);
    if (existing) return res.status(409).json({ code: 409, message: '该手机号已注册' });

    const consumer = {
      id: 'c_' + uuidv4().slice(0, 8), name: name || null, phone, openid: openid || null,
      id_card: id_card || null, status: 'active', created_at: new Date().toISOString()
    };
    insert('consumers', consumer);
    res.json({ code: 0, message: '消费者创建成功', data: consumer });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// GET /api/v1/consumers/:id/ledgers - 消费者的所有Ledger
router.get('/:id/ledgers', (req, res) => {
  try {
    const ledgers = findAll('ledgers').filter(l => l.consumer_id === req.params.id)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .map(l => { const m = findById('merchants', l.merchant_id); return { ...l, merchant_name: m?.name || '-', merchant_industry: m?.industry || '-' }; });
    res.json({ code: 0, message: 'success', data: ledgers });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
