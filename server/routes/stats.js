/**
 * 统计路由
 */
const express = require('express');
const router = express.Router();
const { findAll } = require('../db/database');

// GET /api/v1/stats/overview - 平台概览
router.get('/overview', (req, res) => {
  try {
    const merchants = findAll('merchants').filter(m => m.status === 'active');
    const consumers = findAll('consumers').filter(c => c.status === 'active');
    const ledgers = findAll('ledgers').filter(l => l.status === 'active');
    const transactions = findAll('transactions').filter(t => t.status === 'completed');
    const pendingTx = findAll('transactions').filter(t => t.status === 'pending');
    const pendingSettlements = findAll('settlements').filter(s => s.status === 'pending');

    const totalBalance = ledgers.reduce((s, l) => s + (l.balance || 0), 0);
    const totalDeposited = ledgers.reduce((s, l) => s + (l.total_deposited || 0), 0);
    const totalSpent = ledgers.reduce((s, l) => s + (l.total_spent || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTx = transactions.filter(t => new Date(t.created_at) >= today);

    const todayDeposit = todayTx.filter(t => t.type === 'deposit').reduce((s, t) => s + (t.amount || 0), 0);
    const todayWithdraw = todayTx.filter(t => t.type === 'withdraw').reduce((s, t) => s + (t.amount || 0), 0);

    res.json({ code: 0, message: 'success', data: {
      merchants: { total: merchants.length, active: merchants.length },
      consumers: { total: consumers.length, active: consumers.length },
      ledgers: { total: ledgers.length },
      balance: { total: totalBalance, deposited: totalDeposited, spent: totalSpent, frozen: 0 },
      today: { transactions: todayTx.length, deposit_amount: todayDeposit, withdraw_amount: todayWithdraw },
      pending: { transactions: pendingTx.length, settlements: pendingSettlements.length }
    }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// GET /api/v1/stats/merchants - 商户统计
router.get('/merchants', (req, res) => {
  try {
    const merchants = findAll('merchants').filter(m => m.status === 'active');
    const ledgers = findAll('ledgers').filter(l => l.status === 'active');

    const stats = merchants.map(m => {
      const mLedgers = ledgers.filter(l => l.merchant_id === m.id);
      return {
        id: m.id, name: m.name, industry: m.industry,
        consumer_count: new Set(mLedgers.map(l => l.consumer_id)).size,
        ledger_count: mLedgers.length,
        total_balance: mLedgers.reduce((s, l) => s + (l.balance || 0), 0),
        total_deposited: mLedgers.reduce((s, l) => s + (l.total_deposited || 0), 0),
        total_spent: mLedgers.reduce((s, l) => s + (l.total_spent || 0), 0),
      };
    });

    stats.sort((a, b) => b.total_deposited - a.total_deposited);
    res.json({ code: 0, message: 'success', data: stats });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// GET /api/v1/stats/transactions - 交易统计
router.get('/transactions', (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    since.setHours(0, 0, 0, 0);

    const transactions = findAll('transactions').filter(t =>
      t.status === 'completed' && new Date(t.created_at) >= since
    );

    // 按日期分组
    const dateMap = {};
    transactions.forEach(t => {
      const date = t.created_at.split('T')[0];
      if (!dateMap[date]) dateMap[date] = { deposit: 0, withdraw: 0, refund: 0, deposit_count: 0, withdraw_count: 0 };
      dateMap[date][t.type] = (dateMap[date][t.type] || 0) + t.amount;
      if (t.type === 'deposit') dateMap[date].deposit_count++;
      if (t.type === 'withdraw') dateMap[date].withdraw_count++;
    });

    const daily = Object.entries(dateMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const summary = [
      { type: 'deposit', count: transactions.filter(t => t.type === 'deposit').length,
        amount: transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0) },
      { type: 'withdraw', count: transactions.filter(t => t.type === 'withdraw').length,
        amount: transactions.filter(t => t.type === 'withdraw').reduce((s, t) => s + t.amount, 0) },
      { type: 'refund', count: transactions.filter(t => t.type === 'refund').length,
        amount: transactions.filter(t => t.type === 'refund').reduce((s, t) => s + t.amount, 0) },
    ];

    res.json({ code: 0, message: 'success', data: { daily, summary }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
