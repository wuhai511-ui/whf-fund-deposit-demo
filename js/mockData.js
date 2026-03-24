// 演示用的 Mock 数据
window.mockData = {
  merchants: [
    { id: 'm-001', name: '商户A', ledgerCount: 2 },
    { id: 'm-002', name: '商户B', ledgerCount: 1 },
    { id: 'm-003', name: '商户C(测试)', ledgerCount: 0 }
  ],
  ledgers: [
    { ledgerId: 'ld-001', merchantId: 'm-001', consumer: 'c-001', balance: 1200, status: 'active' },
    { ledgerId: 'ld-002', merchantId: 'm-001', consumer: 'c-002', balance: 800, status: 'active' },
    { ledgerId: 'ld-003', merchantId: 'm-002', consumer: 'c-003', balance: 450, status: 'active' }
  ],
  transactions: [
    { tid: 't-01', ledgerId: 'ld-001', merchantId: 'm-001', consumerId: 'c-001', amount: -120, time: '2026-03-23 12:10', status: 'completed' },
    { tid: 't-02', ledgerId: 'ld-001', merchantId: 'm-001', consumerId: 'c-001', amount: -60, time: '2026-03-23 12:40', status: 'completed' },
    { tid: 't-03', ledgerId: 'ld-002', merchantId: 'm-001', consumerId: 'c-002', amount: -20, time: '2026-03-23 12:55', status: 'completed' },
    { tid: 't-04', ledgerId: 'ld-003', merchantId: 'm-002', consumerId: 'c-003', amount: -50, time: '2026-03-23 13:15', status: 'failed' }
  ]
};