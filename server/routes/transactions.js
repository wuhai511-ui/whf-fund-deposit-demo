/**
 * 交易路由
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { findAll, findById, insert, update } = require('../db/database');

// GET /api/v1/transactions - 交易列表
router.get('/', (req, res) => {
  try {
    const { merchant_id, consumer_id, ledger_id, type, status, page = 1, pageSize = 50 } = req.query;
    let list = findAll('transactions');

    if (merchant_id) list = list.filter(t => t.merchant_id === merchant_id);
    if (consumer_id) list = list.filter(t => t.consumer_id === consumer_id);
    if (ledger_id) list = list.filter(t => t.ledger_id === ledger_id);
    if (type) list = list.filter(t => t.type === type);
    if (status) list = list.filter(t => t.status === status);

    list = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = list.length;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const paged = list.slice(offset, offset + parseInt(pageSize));

    const merchants = findAll('merchants');
    const consumers = findAll('consumers');

    const result = paged.map(t => {
      const merchant = findById('merchants', t.merchant_id);
      const consumer = findById('consumers', t.consumer_id);
      return { ...t, merchant_name: merchant?.name || '-', consumer_name: consumer?.name || '-' };
    });

    res.json({ code: 0, message: 'success', data: {
      list: result,
      pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
    }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// GET /api/v1/transactions/:id - 交易详情
router.get('/:id', (req, res) => {
  try {
    const tx = findById('transactions', req.params.id);
    if (!tx) return res.status(404).json({ code: 404, message: '交易不存在' });

    const merchant = findById('merchants', tx.merchant_id);
    const consumer = findById('consumers', tx.consumer_id);
    const ledger = findById('ledgers', tx.ledger_id);

    res.json({ code: 0, message: 'success', data: {
      ...tx, merchant_name: merchant?.name || '-', consumer_name: consumer?.name || '-',
      current_balance: ledger?.balance || 0
    }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/transactions/deposit - 预存资金
router.post('/deposit', (req, res) => {
  try {
    const { merchant_id, consumer_id, amount, description = '资金预存' } = req.body;

    if (!merchant_id || !consumer_id || !amount) {
      return res.status(400).json({ code: 400, message: 'merchant_id, consumer_id, amount 必填' });
    }
    if (amount <= 0) return res.status(400).json({ code: 400, message: '金额必须大于0' });

    // 查找或创建 Ledger
    let ledger = findAll('ledgers').find(l => l.merchant_id === merchant_id && l.consumer_id === consumer_id);
    if (!ledger) {
      ledger = {
        id: 'ld_' + uuidv4().slice(0, 8), merchant_id, consumer_id,
        balance: 0, total_deposited: 0, total_spent: 0, status: 'active',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      insert('ledgers', ledger);
    } else if (ledger.status !== 'active') {
      return res.status(400).json({ code: 400, message: 'Ledger状态不允许交易' });
    }

    const txId = 't_' + uuidv4().slice(0, 8);
    const balanceBefore = ledger.balance;
    const balanceAfter = balanceBefore + amount;

    // 更新 Ledger
    update('ledgers', ledger.id, {
      balance: balanceAfter,
      total_deposited: ledger.total_deposited + amount,
      updated_at: new Date().toISOString()
    });

    // 创建交易
    const tx = {
      id: txId, ledger_id: ledger.id, merchant_id, consumer_id,
      type: 'deposit', amount, balance_before: balanceBefore, balance_after: balanceAfter,
      status: 'completed', description, created_at: new Date().toISOString()
    };
    insert('transactions', tx);

    const updatedLedger = findById('ledgers', ledger.id);
    res.json({ code: 0, message: '预存成功', data: { transaction: tx, ledger: updatedLedger }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/transactions/withdraw - 消费扣款
router.post('/withdraw', (req, res) => {
  try {
    const { ledger_id, amount, description = '消费扣款' } = req.body;
    if (!ledger_id || !amount) return res.status(400).json({ code: 400, message: 'ledger_id, amount 必填' });
    if (amount <= 0) return res.status(400).json({ code: 400, message: '金额必须大于0' });

    const ledger = findById('ledgers', ledger_id);
    if (!ledger) return res.status(404).json({ code: 404, message: 'Ledger不存在' });
    if (ledger.status !== 'active') return res.status(400).json({ code: 400, message: 'Ledger状态不允许交易' });
    if ((ledger.balance || 0) < amount) {
      return res.status(400).json({ code: 400, message: '余额不足', data: { available: ledger.balance }});
    }

    const txId = 't_' + uuidv4().slice(0, 8);
    const balanceBefore = ledger.balance;
    const balanceAfter = balanceBefore - amount;

    update('ledgers', ledger.id, {
      balance: balanceAfter,
      total_spent: ledger.total_spent + amount,
      updated_at: new Date().toISOString()
    });

    const tx = {
      id: txId, ledger_id: ledger.id, merchant_id: ledger.merchant_id, consumer_id: ledger.consumer_id,
      type: 'withdraw', amount, balance_before: balanceBefore, balance_after: balanceAfter,
      status: 'completed', description, created_at: new Date().toISOString()
    };
    insert('transactions', tx);

    const updatedLedger = findById('ledgers', ledger.id);
    res.json({ code: 0, message: '扣款成功', data: { transaction: tx, ledger: updatedLedger }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/transactions/refund - 退款
router.post('/refund', (req, res) => {
  try {
    const { ledger_id, amount, description = '退款' } = req.body;
    if (!ledger_id || !amount) return res.status(400).json({ code: 400, message: 'ledger_id, amount 必填' });
    if (amount <= 0) return res.status(400).json({ code: 400, message: '金额必须大于0' });

    const ledger = findById('ledgers', ledger_id);
    if (!ledger) return res.status(404).json({ code: 404, message: 'Ledger不存在' });
    if (ledger.status !== 'active') return res.status(400).json({ code: 400, message: 'Ledger状态不允许交易' });

    const txId = 't_' + uuidv4().slice(0, 8);
    const balanceBefore = ledger.balance;
    const balanceAfter = balanceBefore + amount;

    update('ledgers', ledger.id, { balance: balanceAfter, updated_at: new Date().toISOString() });

    const tx = {
      id: txId, ledger_id: ledger.id, merchant_id: ledger.merchant_id, consumer_id: ledger.consumer_id,
      type: 'refund', amount, balance_before: balanceBefore, balance_after: balanceAfter,
      status: 'completed', description, created_at: new Date().toISOString()
    };
    insert('transactions', tx);
    res.json({ code: 0, message: '退款成功', data: tx });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
