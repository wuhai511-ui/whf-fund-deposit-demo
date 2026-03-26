// 演示用的 Mock 数据
window.mockData = {
  merchants: [
    { id: 'm-001', name: '美发会所 A', industry: 'hair', ledgerCount: 5, balance: 125600, status: 'active', created_at: '2026-01-15 10:30:00' },
    { id: 'm-002', name: '美容中心 B', industry: 'beauty', ledgerCount: 8, balance: 89000, status: 'active', created_at: '2026-01-20 14:22:00' },
    { id: 'm-003', name: '餐饮连锁 C', industry: 'food', ledgerCount: 12, balance: 234000, status: 'active', created_at: '2026-02-01 09:00:00' },
  ],
  ledgers: [
    { ledgerId: 'ld-001', id: 'ld-001', merchantId: 'm-001', merchant_name: '美发会所 A', consumer: 'c-001', consumer_name: '张三', balance: 1200, total_deposited: 2000, total_spent: 800, status: 'active', created_at: '2026-01-15 11:00:00', updated_at: '2026-03-26 10:23:15' },
    { ledgerId: 'ld-002', id: 'ld-002', merchantId: 'm-001', merchant_name: '美发会所 A', consumer: 'c-002', consumer_name: '李四', balance: 800, total_deposited: 1000, total_spent: 200, status: 'active', created_at: '2026-01-20 15:30:00', updated_at: '2026-03-26 09:45:30' },
    { ledgerId: 'ld-003', id: 'ld-003', merchantId: 'm-002', merchant_name: '美容中心 B', consumer: 'c-003', consumer_name: '王五', balance: 450, total_deposited: 1000, total_spent: 550, status: 'frozen', created_at: '2026-02-05 10:00:00', updated_at: '2026-03-25 18:00:00' },
  ],
  transactions: [
    { tid: 't-2026032601', id: 't-2026032601', ledgerId: 'ld-001', merchantId: 'm-001', merchant_name: '美发会所 A', consumerId: 'c-001', consumer_name: '张三', type: 'deposit', amount: 500, balance_before: 700, balance_after: 1200, status: 'completed', description: '首次充值优惠', created_at: '2026-03-26 10:23:15' },
    { tid: 't-2026032602', id: 't-2026032602', ledgerId: 'ld-002', merchantId: 'm-001', merchant_name: '美发会所 A', consumerId: 'c-002', consumer_name: '李四', type: 'withdraw', amount: 80, balance_before: 880, balance_after: 800, status: 'completed', description: '美发服务', created_at: '2026-03-26 09:45:30' },
    { tid: 't-2026032603', id: 't-2026032603', ledgerId: 'ld-003', merchantId: 'm-002', merchant_name: '美容中心 B', consumerId: 'c-003', consumer_name: '王五', type: 'deposit', amount: 1000, balance_before: -550, balance_after: 450, status: 'completed', description: '', created_at: '2026-03-25 18:00:00' },
    { tid: 't-2026032604', id: 't-2026032604', ledgerId: 'ld-001', merchantId: 'm-001', merchant_name: '美发会所 A', consumerId: 'c-001', consumer_name: '张三', type: 'withdraw', amount: 120, balance_before: 820, balance_after: 700, status: 'completed', description: '美发服务', created_at: '2026-03-25 16:30:00' },
    { tid: 't-2026032605', id: 't-2026032605', ledgerId: 'ld-003', merchantId: 'm-002', merchant_name: '美容中心 B', consumerId: 'c-003', consumer_name: '王五', type: 'refund', amount: 50, balance_before: 500, balance_after: 550, status: 'completed', description: '退款', created_at: '2026-03-24 18:00:00' },
    { tid: 't-2026032606', id: 't-2026032606', ledgerId: 'ld-002', merchantId: 'm-001', merchant_name: '美发会所 A', consumerId: 'c-002', consumer_name: '李四', type: 'withdraw', amount: 200, balance_before: 1000, balance_after: 800, status: 'completed', description: '美发+护理', created_at: '2026-03-24 14:20:00' },
  ],
  consumers: [
    { id: 'c-001', name: '张三', phone: '138****1234', ledgerCount: 2, totalBalance: 1200, status: 'active', created_at: '2026-01-15 11:00:00' },
    { id: 'c-002', name: '李四', phone: '139****5678', ledgerCount: 1, totalBalance: 800, status: 'active', created_at: '2026-01-20 15:30:00' },
    { id: 'c-003', name: '王五', phone: '136****9012', ledgerCount: 1, totalBalance: 450, status: 'frozen', created_at: '2026-02-05 10:00:00' },
  ],
  settlements: [
    { id: 'st-001', merchantId: 'm-001', merchant_name: '美发会所 A', period: '2026-W12', total_amount: 25600, fee: 512, net_amount: 25088, status: 'completed', created_at: '2026-03-23 00:00:00' },
    { id: 'st-002', merchantId: 'm-002', merchant_name: '美容中心 B', period: '2026-W12', total_amount: 18900, fee: 378, net_amount: 18522, status: 'pending', created_at: '2026-03-25 00:00:00' },
  ]
};
