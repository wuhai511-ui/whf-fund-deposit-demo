/**
 * 清分路由
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { findAll, findById, insert, update } = require('../db/database');

// GET /api/v1/settlements - 清分列表
router.get('/', (req, res) => {
  try {
    const { merchant_id, status, page = 1, pageSize = 20 } = req.query;
    let list = findAll('settlements');
    if (merchant_id) list = list.filter(s => s.merchant_id === merchant_id);
    if (status) list = list.filter(s => s.status === status);

    list = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = list.length;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const paged = list.slice(offset, offset + parseInt(pageSize));
    const merchants = findAll('merchants');

    const result = paged.map(s => {
      const merchant = findById('merchants', s.merchant_id);
      return { ...s, merchant_name: merchant?.name || '-' };
    });

    res.json({ code: 0, message: 'success', data: {
      list: result,
      pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
    }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// GET /api/v1/settlements/:id - 清分详情
router.get('/:id', (req, res) => {
  try {
    const settlement = findById('settlements', req.params.id);
    if (!settlement) return res.status(404).json({ code: 404, message: '清分记录不存在' });
    const merchant = findById('merchants', settlement.merchant_id);
    res.json({ code: 0, message: 'success', data: { ...settlement, merchant_name: merchant?.name || '-' }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/settlements - 创建清分
router.post('/', (req, res) => {
  try {
    const { merchant_id, period, total_amount } = req.body;
    if (!merchant_id || !period) return res.status(400).json({ code: 400, message: 'merchant_id, period 必填' });

    const settlement = {
      id: 'st_' + uuidv4().slice(0, 8), merchant_id, period,
      total_amount: total_amount || 0, status: 'pending',
      settled_at: null, created_at: new Date().toISOString()
    };
    insert('settlements', settlement);
    res.json({ code: 0, message: '清分记录创建成功', data: settlement });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// PATCH /api/v1/settlements/:id - 更新清分
router.patch('/:id', (req, res) => {
  try {
    const { status, total_amount } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (total_amount !== undefined) updates.total_amount = total_amount;
    if (status === 'completed') updates.settled_at = new Date().toISOString();

    const settlement = update('settlements', req.params.id, updates);
    if (!settlement) return res.status(404).json({ code: 404, message: '清分记录不存在' });
    res.json({ code: 0, message: '清分更新成功', data: settlement });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
