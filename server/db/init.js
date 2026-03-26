/**
 * 数据库初始化脚本
 * 运行: node db/init.js
 */
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { load, save, findAll, insert } = require('./database');

function init() {
  load();
  const existing = findAll('merchants');
  if (existing.length > 0) {
    console.log('ℹ️  数据已存在，跳过初始化演示数据');
    printStats();
    return;
  }

  console.log('📦 插入演示数据...');

  // 商户
  const merchants = [
    { id: 'm_' + uuidv4().slice(0, 8), name: '商户A（美容美发）', industry: 'beauty', status: 'active', created_at: new Date().toISOString() },
    { id: 'm_' + uuidv4().slice(0, 8), name: '商户B（餐饮连锁）', industry: 'catering', status: 'active', created_at: new Date().toISOString() },
    { id: 'm_' + uuidv4().slice(0, 8), name: '商户C（教育培训）', industry: 'education', status: 'active', created_at: new Date().toISOString() },
  ];
  merchants.forEach(m => insert('merchants', m));

  // 消费者
  const consumers = [
    { id: 'c_' + uuidv4().slice(0, 8), name: '张三', phone: '13800138001', status: 'active', created_at: new Date().toISOString() },
    { id: 'c_' + uuidv4().slice(0, 8), name: '李四', phone: '13800138002', status: 'active', created_at: new Date().toISOString() },
    { id: 'c_' + uuidv4().slice(0, 8), name: '王五', phone: '13800138003', status: 'active', created_at: new Date().toISOString() },
  ];
  consumers.forEach(c => insert('consumers', c));

  // 管理员
  const hashedPwd = bcrypt.hashSync('admin123', 10);
  insert('admins', {
    id: 'a_' + uuidv4().slice(0, 8),
    username: 'admin',
    password: hashedPwd,
    role: 'super_admin',
    created_at: new Date().toISOString()
  });

  // Ledgers
  const ledgers = [
    { id: 'ld_' + uuidv4().slice(0, 8), merchant_id: merchants[0].id, consumer_id: consumers[0].id, balance: 1200, total_deposited: 1500, total_spent: 300, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'ld_' + uuidv4().slice(0, 8), merchant_id: merchants[0].id, consumer_id: consumers[1].id, balance: 800, total_deposited: 1000, total_spent: 200, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'ld_' + uuidv4().slice(0, 8), merchant_id: merchants[1].id, consumer_id: consumers[0].id, balance: 500, total_deposited: 500, total_spent: 0, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'ld_' + uuidv4().slice(0, 8), merchant_id: merchants[1].id, consumer_id: consumers[2].id, balance: 300, total_deposited: 300, total_spent: 0, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];
  ledgers.forEach(l => insert('ledgers', l));

  // 交易记录
  const now = new Date();
  const transactions = [
    { id: 't_' + uuidv4().slice(0, 8), ledger_id: ledgers[0].id, merchant_id: merchants[0].id, consumer_id: consumers[0].id, type: 'deposit', amount: 1500, balance_before: 0, balance_after: 1500, status: 'completed', description: '首次预存', created_at: offsetDays(now, 5).toISOString() },
    { id: 't_' + uuidv4().slice(0, 8), ledger_id: ledgers[0].id, merchant_id: merchants[0].id, consumer_id: consumers[0].id, type: 'withdraw', amount: 150, balance_before: 1500, balance_after: 1350, status: 'completed', description: '美发服务', created_at: offsetDays(now, 4).toISOString() },
    { id: 't_' + uuidv4().slice(0, 8), ledger_id: ledgers[0].id, merchant_id: merchants[0].id, consumer_id: consumers[0].id, type: 'withdraw', amount: 150, balance_before: 1350, balance_after: 1200, status: 'completed', description: '美发服务', created_at: offsetDays(now, 2).toISOString() },
    { id: 't_' + uuidv4().slice(0, 8), ledger_id: ledgers[1].id, merchant_id: merchants[0].id, consumer_id: consumers[1].id, type: 'deposit', amount: 1000, balance_before: 0, balance_after: 1000, status: 'completed', description: '首次预存', created_at: offsetDays(now, 3).toISOString() },
    { id: 't_' + uuidv4().slice(0, 8), ledger_id: ledgers[1].id, merchant_id: merchants[0].id, consumer_id: consumers[1].id, type: 'withdraw', amount: 200, balance_before: 1000, balance_after: 800, status: 'completed', description: '美容护理', created_at: offsetDays(now, 1).toISOString() },
    { id: 't_' + uuidv4().slice(0, 8), ledger_id: ledgers[2].id, merchant_id: merchants[1].id, consumer_id: consumers[0].id, type: 'deposit', amount: 500, balance_before: 0, balance_after: 500, status: 'completed', description: '餐饮预存', created_at: offsetDays(now, 6).toISOString() },
  ];
  transactions.forEach(t => insert('transactions', t));

  save();
  console.log('✅ 演示数据插入完成');
  printStats();
}

function offsetDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function printStats() {
  const { findAll } = require('./database');
  console.log('📊 当前数据统计:');
  console.log('  商户:', findAll('merchants').length);
  console.log('  消费者:', findAll('consumers').length);
  console.log('  Ledger:', findAll('ledgers').length);
  console.log('  交易:', findAll('transactions').length);
}

init();
