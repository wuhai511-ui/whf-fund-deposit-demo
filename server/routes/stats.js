/**
 * 统计路由
 */
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

// GET /api/v1/stats/overview - 平台概览
router.get('/overview', async (req, res) => {
  try {
    const [merchants, consumers, ledgers, transactions, pendingTx, pendingSettlements] = await Promise.all([
      prisma.merchant.findMany({ where: { status: 'active' } }),
      prisma.consumer.findMany({ where: { status: 'active' } }),
      prisma.ledger.findMany({ where: { status: 'active' } }),
      prisma.transaction.findMany({ where: { status: 'completed' } }),
      prisma.transaction.findMany({ where: { status: 'pending' } }),
      prisma.settlement.findMany({ where: { status: 'pending' } })
    ]);

    const totalBalance = ledgers.reduce((s, l) => s + Number(l.balance), 0);
    const totalDeposited = ledgers.reduce((s, l) => s + Number(l.totalDeposited), 0);
    const totalSpent = ledgers.reduce((s, l) => s + Number(l.totalSpent), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTx = transactions.filter(t => new Date(t.createdAt) >= today);

    const todayDeposit = todayTx.filter(t => t.type === 'deposit').reduce((s, t) => s + Number(t.amount), 0);
    const todayWithdraw = todayTx.filter(t => t.type === 'withdraw').reduce((s, t) => s + Number(t.amount), 0);

    res.json({ code: 0, message: 'success', data: {
      merchants: { total: merchants.length, active: merchants.length },
      consumers: { total: consumers.length, active: consumers.length },
      ledgers: { total: ledgers.length },
      balance: { total: totalBalance, deposited: totalDeposited, spent: totalSpent, frozen: 0 },
      today: { transactions: todayTx.length, deposit_amount: todayDeposit, withdraw_amount: todayWithdraw },
      pending: { transactions: pendingTx.length, settlements: pendingSettlements.length }
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// GET /api/v1/stats/merchants - 商户统计
router.get('/merchants', async (req, res) => {
  try {
    const [merchants, ledgers] = await Promise.all([
      prisma.merchant.findMany({ where: { status: 'active' } }),
      prisma.ledger.findMany({ where: { status: 'active' } })
    ]);

    const stats = merchants.map(m => {
      const mLedgers = ledgers.filter(l => l.merchantId === m.id);
      const consumerIds = new Set(mLedgers.map(l => l.consumerId));
      return {
        id: m.id,
        name: m.name,
        industry: m.industry,
        consumer_count: consumerIds.size,
        ledger_count: mLedgers.length,
        total_balance: mLedgers.reduce((s, l) => s + Number(l.balance), 0),
        total_deposited: mLedgers.reduce((s, l) => s + Number(l.totalDeposited), 0),
        total_spent: mLedgers.reduce((s, l) => s + Number(l.totalSpent), 0),
      };
    });

    stats.sort((a, b) => b.total_deposited - a.total_deposited);
    res.json({ code: 0, message: 'success', data: stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

// GET /api/v1/stats/transactions - 交易统计
router.get('/transactions', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    since.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: { status: 'completed', createdAt: { gte: since } }
    });

    // 按日期分组
    const dateMap = {};
    transactions.forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0];
      if (!dateMap[date]) dateMap[date] = { deposit: 0, withdraw: 0, refund: 0, deposit_count: 0, withdraw_count: 0 };
      dateMap[date][t.type] = (dateMap[date][t.type] || 0) + Number(t.amount);
      if (t.type === 'deposit') dateMap[date].deposit_count++;
      if (t.type === 'withdraw') dateMap[date].withdraw_count++;
    });

    const daily = Object.entries(dateMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const summary = [
      {
        type: 'deposit',
        count: transactions.filter(t => t.type === 'deposit').length,
        amount: transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + Number(t.amount), 0)
      },
      {
        type: 'withdraw',
        count: transactions.filter(t => t.type === 'withdraw').length,
        amount: transactions.filter(t => t.type === 'withdraw').reduce((s, t) => s + Number(t.amount), 0)
      },
      {
        type: 'refund',
        count: transactions.filter(t => t.type === 'refund').length,
        amount: transactions.filter(t => t.type === 'refund').reduce((s, t) => s + Number(t.amount), 0)
      },
    ];

    res.json({ code: 0, message: 'success', data: { daily, summary } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
