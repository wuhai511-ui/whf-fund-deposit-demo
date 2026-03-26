/**
 * C端小程序 - 共享模块
 * 包含：Mock 数据、路由、通用工具
 */
window.MobileApp = (function() {
  'use strict';

  // =====================
  // Mock 数据
  // =====================
  const MOCK = {
    currentConsumer: {
      id: 'c_001',
      name: '张三',
      phone: '138****1234',
      avatar: '👤',
      verified: true,
    },

    industries: [
      { id: 'ind_01', name: '美容美发', icon: '💇', count: 128 },
      { id: 'ind_02', name: '教育培训', icon: '📚', count: 89 },
      { id: 'ind_03', name: '健身运动', icon: '🏋️', count: 67 },
      { id: 'ind_04', name: '医疗健康', icon: '🏥', count: 45 },
      { id: 'ind_05', name: '餐饮美食', icon: '🍜', count: 203 },
      { id: 'ind_06', name: '休闲娱乐', icon: '🎮', count: 156 },
      { id: 'ind_07', name: '汽车服务', icon: '🚗', count: 78 },
      { id: 'ind_08', name: '家居装修', icon: '🏠', count: 34 },
    ],

    merchants: [
      {
        id: 'm_001',
        name: '美丽人生美容会所',
        industry: '美容美发',
        industry_id: 'ind_01',
        address: '北京市朝阳区建国路88号',
        rating: 4.8,
        service_count: 23,
        description: '专业面部护理、SPA、身体按摩，提供高品质美容服务。',
        tags: ['连锁品牌', '精选商家'],
        logo: '💆',
        status: 'active',
      },
      {
        id: 'm_002',
        name: '智慧英语培训',
        industry: '教育培训',
        industry_id: 'ind_02',
        address: '北京市海淀区中关村大街12号',
        rating: 4.9,
        service_count: 8,
        description: '专业英语培训，雅思托福，小学初中高中同步辅导。',
        tags: ['师资雄厚', '小班教学'],
        logo: '📖',
        status: 'active',
      },
      {
        id: 'm_003',
        name: '动力健身工作室',
        industry: '健身运动',
        industry_id: 'ind_03',
        address: '北京市朝阳区三里屯SOHO',
        rating: 4.6,
        service_count: 12,
        description: '私教一对一，团课，增肌减脂，塑形。',
        tags: ['24小时营业', '私教'],
        logo: '🏋️',
        status: 'active',
      },
      {
        id: 'm_004',
        name: '舌尖上的川菜馆',
        industry: '餐饮美食',
        industry_id: 'ind_05',
        address: '北京市东城区东单北大街18号',
        rating: 4.7,
        service_count: 56,
        description: '正宗川菜，麻辣鲜香，招牌水煮鱼、回锅肉。',
        tags: ['老字号', '必吃榜'],
        logo: '🍲',
        status: 'active',
      },
    ],

    services: [
      { id: 's_001', merchant_id: 'm_001', name: '深层清洁面部护理', price: 198, duration: 60, unit: '次', tag: '热门' },
      { id: 's_002', merchant_id: 'm_001', name: '日式SPA按摩', price: 368, duration: 90, unit: '次', tag: '推荐' },
      { id: 's_003', merchant_id: 'm_001', name: '肩颈舒缓护理', price: 128, duration: 45, unit: '次', tag: null },
      { id: 's_004', merchant_id: 'm_001', name: '眼部紧致护理', price: 228, duration: 60, unit: '次', tag: '新品' },
      { id: 's_005', merchant_id: 'm_002', name: '雅思冲刺班', price: 8800, duration: 30, unit: '期', tag: '热门' },
      { id: 's_006', merchant_id: 'm_002', name: '英语口语一对一', price: 260, duration: 60, unit: '课时', tag: '推荐' },
      { id: 's_007', merchant_id: 'm_003', name: '私教一对一体验课', price: 299, duration: 60, unit: '节', tag: '热门' },
      { id: 's_008', merchant_id: 'm_003', name: '月卡（不限次）', price: 899, duration: 30, unit: '天', tag: null },
    ],

    ledgers: [
      {
        id: 'ld_001',
        merchant_id: 'm_001',
        merchant_name: '美丽人生美容会所',
        merchant_logo: '💆',
        balance: 1200.00,
        total_deposited: 2000.00,
        total_spent: 800.00,
        status: 'active',
        created_at: '2026-02-15T10:00:00+08:00',
        updated_at: '2026-03-20T14:30:00+08:00',
      },
      {
        id: 'ld_002',
        merchant_id: 'm_002',
        merchant_name: '智慧英语培训',
        merchant_logo: '📖',
        balance: 8800.00,
        total_deposited: 10000.00,
        total_spent: 1200.00,
        status: 'active',
        created_at: '2026-01-10T09:00:00+08:00',
        updated_at: '2026-03-22T18:00:00+08:00',
      },
      {
        id: 'ld_003',
        merchant_id: 'm_003',
        merchant_name: '动力健身工作室',
        merchant_logo: '🏋️',
        balance: 300.00,
        total_deposited: 500.00,
        total_spent: 200.00,
        status: 'active',
        created_at: '2026-03-01T20:00:00+08:00',
        updated_at: '2026-03-25T21:00:00+08:00',
      },
    ],

    transactions: [
      { id: 'tx_001', ledger_id: 'ld_001', merchant_id: 'm_001', merchant_name: '美丽人生美容会所', type: 'deposit', amount: 2000, balance_after: 2000, status: 'completed', description: '预存2000元', created_at: '2026-02-15T10:00:00+08:00' },
      { id: 'tx_002', ledger_id: 'ld_001', merchant_id: 'm_001', merchant_name: '美丽人生美容会所', type: 'withdraw', amount: 198, balance_after: 1802, status: 'completed', description: '深层清洁面部护理', created_at: '2026-03-10T11:00:00+08:00' },
      { id: 'tx_003', ledger_id: 'ld_001', merchant_id: 'm_001', merchant_name: '美丽人生美容会所', type: 'withdraw', amount: 368, balance_after: 1434, status: 'completed', description: '日式SPA按摩', created_at: '2026-03-15T15:00:00+08:00' },
      { id: 'tx_004', ledger_id: 'ld_001', merchant_id: 'm_001', merchant_name: '美丽人生美容会所', type: 'withdraw', amount: 234, balance_after: 1200, status: 'completed', description: '消费234元', created_at: '2026-03-20T14:30:00+08:00' },
      { id: 'tx_005', ledger_id: 'ld_002', merchant_id: 'm_002', merchant_name: '智慧英语培训', type: 'deposit', amount: 10000, balance_after: 10000, status: 'completed', description: '预存10000元', created_at: '2026-01-10T09:00:00+08:00' },
      { id: 'tx_006', ledger_id: 'ld_002', merchant_id: 'm_002', merchant_name: '智慧英语培训', type: 'withdraw', amount: 1200, balance_after: 8800, status: 'completed', description: '英语口语课程', created_at: '2026-03-22T18:00:00+08:00' },
      { id: 'tx_007', ledger_id: 'ld_003', merchant_id: 'm_003', merchant_name: '动力健身工作室', type: 'deposit', amount: 500, balance_after: 500, status: 'completed', description: '预存500元', created_at: '2026-03-01T20:00:00+08:00' },
      { id: 'tx_008', ledger_id: 'ld_003', merchant_id: 'm_003', merchant_name: '动力健身工作室', type: 'withdraw', amount: 200, balance_after: 300, status: 'completed', description: '私教课程', created_at: '2026-03-25T21:00:00+08:00' },
    ],

    orders: [
      { id: 'ord_001', merchant_id: 'm_001', merchant_name: '美丽人生美容会所', service_name: '深层清洁面部护理', amount: 198, status: 'completed', created_at: '2026-03-10T11:00:00+08:00', tx_id: 'tx_002' },
      { id: 'ord_002', merchant_id: 'm_001', merchant_name: '美丽人生美容会所', service_name: '日式SPA按摩', amount: 368, status: 'completed', created_at: '2026-03-15T15:00:00+08:00', tx_id: 'tx_003' },
      { id: 'ord_003', merchant_id: 'm_002', merchant_name: '智慧英语培训', service_name: '英语口语一对一', amount: 1200, status: 'completed', created_at: '2026-03-22T18:00:00+08:00', tx_id: 'tx_006' },
      { id: 'ord_004', merchant_id: 'm_003', merchant_name: '动力健身工作室', service_name: '私教一对一体验课', amount: 200, status: 'completed', created_at: '2026-03-25T21:00:00+08:00', tx_id: 'tx_008' },
    ],

    agreements: [
      {
        id: 'agr_001',
        title: '资金预存服务协议',
        version: 'V1.0',
        content: `
**第一条 服务说明**
资金预存服务是平台为消费者提供的资金管理服务。消费者将资金预存至平台，由平台代为存管，并按照消费者指令用于指定商户的消费扣款。

**第二条 资金安全**
1. 消费者预存资金由平台统一存管在银行专用账户。
2. 资金仅能用于在已签约商户处消费，不能提现或转账。
3. 平台对消费者资金安全承担保管责任。

**第三条 退款规则**
1. 消费者可申请退款，经商户确认后，资金原路返回。
2. 已消费金额不可退款，未消费部分可全额退款。
3. 退款将在3-7个工作日内退回原支付渠道。

**第四条 账户安全**
1. 消费者应妥善保管账户信息和支付密码。
2. 如发现账户异常，请立即联系平台客服。
3. 因消费者自身原因导致的资金损失，平台不承担责任。

**第五条 协议变更**
平台有权根据业务需要修改本协议，修改后将在小程序内公告通知。
        `.trim(),
        updated_at: '2026-01-01',
      },
    ],
  };

  // =====================
  // 工具函数
  // =====================
  function formatMoney(n) {
    return '¥' + (n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function formatDateTime(d) {
    if (!d) return '-';
    return new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function formatDateTimeFull(d) {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function txTypeLabel(type) {
    return { deposit: '预存', withdraw: '消费', refund: '退款' }[type] || type;
  }

  function txTypeIcon(type) {
    return { deposit: '💰', withdraw: '💸', refund: '↩️' }[type] || '💳';
  }

  function statusLabel(s) {
    return {
      completed: '已完成',
      pending: '处理中',
      failed: '失败',
      active: '活跃',
      frozen: '已冻结',
      closed: '已关闭',
    }[s] || s;
  }

  function statusClass(s) {
    return {
      completed: 'badge-success',
      pending: 'badge-pending',
      failed: 'badge-failed',
      active: 'badge-success',
      frozen: 'badge-pending',
      closed: 'badge-gray',
    }[s] || 'badge-gray';
  }

  function orderStatusClass(s) {
    return {
      completed: 'badge-success',
      pending: 'badge-pending',
      failed: 'badge-failed',
      processing: 'badge-pending',
      cancelled: 'badge-gray',
    }[s] || 'badge-gray';
  }

  function showToast(msg, duration = 2000) {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  // =====================
  // 路由
  // =====================
  function getQuery(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  function navigate(url) {
    window.location.href = url;
  }

  function back() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'home/index.html';
    }
  }

  // =====================
  // 服务相关
  // =====================
  function getServicesByMerchant(merchantId) {
    return MOCK.services.filter(s => s.merchant_id === merchantId);
  }

  function getMerchant(id) {
    return MOCK.merchants.find(m => m.id === id);
  }

  function getLedgerByMerchant(merchantId) {
    return MOCK.ledgers.find(l => l.merchant_id === merchantId);
  }

  function getLedgersByConsumer() {
    return MOCK.ledgers;
  }

  function getTransactionsByLedger(ledgerId) {
    return MOCK.transactions.filter(t => t.ledger_id === ledgerId);
  }

  function getTransactionsByConsumer() {
    return MOCK.transactions;
  }

  function getOrdersByConsumer() {
    return MOCK.orders;
  }

  // =====================
  // 模拟操作
  // =====================
  function doDeposit(merchantId, amount, description) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const ledgerId = 'ld_' + Date.now();
        const txId = 'tx_' + Date.now();
        const merchant = getMerchant(merchantId);
        const newLedger = {
          id: ledgerId,
          merchant_id: merchantId,
          merchant_name: merchant?.name,
          merchant_logo: merchant?.logo,
          balance: amount,
          total_deposited: amount,
          total_spent: 0,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const newTx = {
          id: txId,
          ledger_id: ledgerId,
          merchant_id: merchantId,
          merchant_name: merchant?.name,
          type: 'deposit',
          amount,
          balance_after: amount,
          status: 'completed',
          description: description || '预存资金',
          created_at: new Date().toISOString(),
        };
        MOCK.ledgers.push(newLedger);
        MOCK.transactions.unshift(newTx);
        resolve({ ledger: newLedger, transaction: newTx });
      }, 1000);
    });
  }

  function doWithdraw(ledgerId, amount, description) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const ledger = MOCK.ledgers.find(l => l.id === ledgerId);
        if (!ledger || ledger.balance < amount) {
          reject(new Error('余额不足'));
          return;
        }
        const txId = 'tx_' + Date.now();
        ledger.balance -= amount;
        ledger.total_spent += amount;
        ledger.updated_at = new Date().toISOString();
        const newTx = {
          id: txId,
          ledger_id: ledgerId,
          merchant_id: ledger.merchant_id,
          merchant_name: ledger.merchant_name,
          type: 'withdraw',
          amount,
          balance_after: ledger.balance,
          status: 'completed',
          description: description || '消费',
          created_at: new Date().toISOString(),
        };
        MOCK.transactions.unshift(newTx);
        resolve({ transaction: newTx, ledger });
      }, 800);
    });
  }

  return {
    MOCK,
    formatMoney,
    formatDate,
    formatDateTime,
    formatDateTimeFull,
    txTypeLabel,
    txTypeIcon,
    statusLabel,
    statusClass,
    orderStatusClass,
    showToast,
    getQuery,
    navigate,
    back,
    getServicesByMerchant,
    getMerchant,
    getLedgerByMerchant,
    getLedgersByConsumer,
    getTransactionsByLedger,
    getTransactionsByConsumer,
    getOrdersByConsumer,
    doDeposit,
    doWithdraw,
  };
})();
