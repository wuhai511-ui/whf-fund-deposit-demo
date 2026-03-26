/**
 * 资金预存项目 - 主应用脚本
 *
 * 重构版本 v1.0
 * - 使用模块化 API 客户端
 * - 支持真实后端 API + Mock 数据降级
 * - 更好的错误处理和加载状态
 */
(function() {
  'use strict';

  // =====================
  // 工具函数
  // =====================
  const Utils = {
    formatMoney(n) {
      return '¥' + (n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    formatDate(d) {
      if (!d) return '-';
      const dt = new Date(d);
      return dt.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    },
    formatDateOnly(d) {
      if (!d) return '-';
      const dt = new Date(d);
      return dt.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    },
    txTypeLabel(type) {
      const map = { deposit: '预存', withdraw: '消费', refund: '退款' };
      return map[type] || type;
    },
    txTypeClass(type) {
      const map = { deposit: 'green', withdraw: 'red', refund: 'blue' };
      return map[type] || 'gray';
    },
    statusLabel(s) {
      const map = {
        active: '活跃', pending: '待处理', completed: '已完成', failed: '失败',
        suspended: '已停用', frozen: '已冻结', closed: '已关闭', processing: '处理中'
      };
      return map[s] || s;
    },
    statusClass(s) {
      const map = {
        active: 'success', completed: 'success', pending: 'warning',
        failed: 'danger', suspended: 'danger', frozen: 'warning', closed: 'gray'
      };
      return map[s] || 'gray';
    },
    debounce(fn, ms) {
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    }
  };

  // =====================
  // Toast 通知
  // =====================
  const Toast = {
    container: null,
    init() {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(this.container);
      }
    },
    show(message, type = 'info', duration = 3000) {
      this.init();
      const colors = {
        success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#6366f1'
      };
      const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
      const bg = colors[type] || colors.info;
      const el = document.createElement('div');
      el.style.cssText = `
        background:${bg};color:white;padding:12px 20px;border-radius:8px;
        box-shadow:0 4px 12px rgba(0,0,0,0.15);font-size:14px;max-width:300px;
        display:flex;align-items:center;gap:8px;animation:slideIn 0.3s ease;
      `;
      el.innerHTML = `<span style="font-size:16px">${icons[type] || icons.info}</span><span>${message}</span>`;
      this.container.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100%)';
        el.style.transition = 'all 0.3s';
        setTimeout(() => el.remove(), 300);
      }, duration);
    },
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error', 5000); },
    warn(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); }
  };

  // =====================
  // 模态框管理器
  // =====================
  const Modal = {
    open(title, bodyHtml, footerHtml) {
      const modal = document.getElementById('myModal');
      if (!modal) return;
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-body').innerHTML = bodyHtml;
      modal.classList.remove('hidden');
    },
    close() {
      const modal = document.getElementById('myModal');
      if (modal) modal.classList.add('hidden');
    },
    confirm(title, message, onConfirm) {
      const body = `<p style="margin:0 0 16px">${message}</p>`;
      const footer = `<div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn-outline" onclick="Modal.close()">取消</button>
        <button class="btn-primary" id="modal-confirm-btn">确认</button>
      </div>`;
      this.open(title, body + `<div id="modal-footer-placeholder"></div>`);
      document.getElementById('modal-footer-placeholder').outerHTML = footer;
      document.getElementById('modal-confirm-btn').onclick = () => { onConfirm(); this.close(); };
    }
  };
  window.Modal = Modal;

  // =====================
  // 主应用
  // =====================
  const App = {
    isMockMode: false,
    init() {
      this.bindEvents();
      this.loadData();
    },

    bindEvents() {
      // 关闭模态框
      const modal = document.getElementById('myModal');
      if (modal) {
        modal.querySelector('.close-btn')?.addEventListener('click', () => Modal.close());
        modal.addEventListener('click', (e) => { if (e.target === modal) Modal.close(); });
      }

      // 提交预存表单
      const form = document.getElementById('create-deposit-form');
      if (form) {
        form.addEventListener('submit', (e) => { e.preventDefault(); this.handleDepositSubmit(); });
      }

      // Tab 切换
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
      });
    },

    switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      document.querySelector(`.tab-btn[data-tab="${tab}"]`)?.classList.add('active');
      document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
    },

    async loadData() {
      this.setLoading(true);
      try {
        // 尝试从真实 API 加载
        const [overview, merchantsResult, ledgersResult, txResult] = await Promise.all([
          API.stats.overview().catch(() => null),
          API.merchants.list({ pageSize: 100 }).catch(() => null),
          API.ledgers.list({ pageSize: 100 }).catch(() => null),
          API.transactions.list({ pageSize: 50 }).catch(() => null),
        ]);

        if (overview) {
          this.renderOverview(overview);
        }
        if (merchantsResult?.list) {
          this.renderMerchants(merchantsResult.list);
        }
        if (ledgersResult?.list) {
          this.renderLedgers(ledgersResult.list);
        }
        if (txResult?.list) {
          this.renderTransactions(txResult.list);
        }
        this.isMockMode = false;
      } catch (err) {
        console.warn('API 不可用，切换到 Mock 模式:', err);
        this.loadMockData();
        this.isMockMode = true;
        Toast.warn('后端服务未连接，显示演示数据');
      }
      this.setLoading(false);
    },

    loadMockData() {
      // 使用 mockData.js 中的数据渲染
      const mock = window.mockData || {};
      this.renderMerchants(mock.merchants || []);
      this.renderLedgers(mock.ledgers || []);
      this.renderTransactions(mock.transactions || []);

      // Mock 概览
      const merchants = mock.merchants || [];
      const ledgers = mock.ledgers || [];
      const totalBalance = ledgers.reduce((s, l) => s + (l.balance || 0), 0);
      const uniqueConsumers = new Set(ledgers.map(l => l.consumer)).size;

      this.renderOverview({
        merchants: { total: merchants.length, active: merchants.length },
        consumers: { total: uniqueConsumers, active: uniqueConsumers },
        ledgers: { total: ledgers.length },
        balance: { total: totalBalance, deposited: totalBalance, spent: 0 },
        today: { transactions: 0, deposit_amount: 0, withdraw_amount: 0 },
        pending: { transactions: 0, settlements: 0 }
      });
    },

    setLoading(on) {
      const el = document.getElementById('loading-indicator');
      if (el) el.style.display = on ? 'block' : 'none';
    },

    renderOverview(data) {
      if (!data) return;
      const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };

      el('stat-merchants', data.merchants?.total ?? 0);
      el('stat-consumers', data.consumers?.total ?? 0);
      el('stat-total-amount', Utils.formatMoney(data.balance?.total ?? 0));

      // 额外统计
      const extEl = document.getElementById('stats-extended');
      if (extEl) {
        extEl.innerHTML = `
          <div class="stat-item"><span class="label">今日预存</span><span class="value" style="color:var(--green)">+${Utils.formatMoney(data.today?.deposit_amount || 0)}</span></div>
          <div class="stat-item"><span class="label">今日消费</span><span class="value" style="color:var(--red)">-${Utils.formatMoney(data.today?.withdraw_amount || 0)}</span></div>
          <div class="stat-item"><span class="label">累计预存总额</span><span class="value">${Utils.formatMoney(data.balance?.deposited || 0)}</span></div>
          <div class="stat-item"><span class="label">累计消费总额</span><span class="value">${Utils.formatMoney(data.balance?.spent || 0)}</span></div>
          <div class="stat-item"><span class="label">待处理交易</span><span class="value">${data.pending?.transactions || 0}</span></div>
        `;
      }
    },

    renderMerchants(merchants) {
      const sel = document.getElementById('deposit-merchant');
      if (!sel) return;
      sel.innerHTML = '';
      merchants.forEach(m => {
        const opt = document.createElement('option');
        opt.value = typeof m === 'string' ? m : m.id;
        opt.text = typeof m === 'string' ? m : `${m.name} (${m.id})`;
        sel.appendChild(opt);
      });
    },

    renderLedgers(ledgers) {
      const tbl = document.getElementById('ledger-list');
      if (!tbl) return;
      tbl.innerHTML = '';

      if (!ledgers || ledgers.length === 0) {
        tbl.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px">暂无数据</td></tr>';
        return;
      }

      ledgers.forEach(l => {
        const merchantName = l.merchant_name || l.merchantId || l.name || l.merchant_id || '-';
        const status = l.status || 'active';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code style="font-size:12px">${l.id || l.ledgerId || '-'}</code></td>
          <td>${merchantName}</td>
          <td>${l.consumer_name || l.consumer || l.consumer_id || '-'}</td>
          <td style="font-weight:600;color:var(--green)">${Utils.formatMoney(l.balance)}</td>
          <td><span class="badge ${Utils.statusClass(status)}">${Utils.statusLabel(status)}</span></td>
          <td><button class="btn-outline btn-sm" onclick="App.openLedgerDetail('${l.id || l.ledgerId}')">详情</button></td>
        `;
        tbl.appendChild(tr);
      });
    },

    renderTransactions(txs) {
      const tbl = document.getElementById('transaction-list');
      if (!tbl) return;
      tbl.innerHTML = '';

      if (!txs || txs.length === 0) {
        tbl.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px">暂无数据</td></tr>';
        return;
      }

      txs.forEach(tx => {
        const merchantName = tx.merchant_name || tx.merchant || tx.merchantId || '-';
        const type = tx.type || 'withdraw';
        const amount = tx.amount || 0;
        const status = tx.status || 'completed';
        const isPositive = type === 'deposit' || type === 'refund';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-size:12px;color:#666">${Utils.formatDate(tx.created_at || tx.time)}</td>
          <td><code style="font-size:12px">${tx.id || tx.tid || '-'}</code></td>
          <td>${merchantName}</td>
          <td style="font-weight:600;color:${isPositive ? 'var(--green)' : 'var(--red)'}">
            ${isPositive ? '+' : '-'}${Utils.formatMoney(amount)}
          </td>
          <td><span class="badge ${Utils.statusClass(status)}">${Utils.statusLabel(status)}</span></td>
          <td><button class="btn-outline btn-sm" onclick="App.openTxDetail('${tx.id || tx.tid}')">详情</button></td>
        `;
        tbl.appendChild(tr);
      });
    },

    async openLedgerDetail(id) {
      try {
        let ledger;
        if (this.isMockMode) {
          ledger = (window.mockData?.ledgers || []).find(l => (l.ledgerId || l.id) === id);
          ledger = ledger ? { ...ledger, transactions: window.mockData?.transactions?.filter(t => t.ledgerId === ledger.ledgerId) || [] } : null;
        } else {
          ledger = await API.ledgers.get(id);
        }
        if (!ledger) return Toast.error('Ledger不存在');

        const merchantName = ledger.merchant_name || '-';
        const consumerName = ledger.consumer_name || '-';
        const txs = ledger.transactions || [];

        let txRows = txs.length ? txs.map(tx => `
          <tr>
            <td>${Utils.formatDate(tx.created_at)}</td>
            <td><code>${tx.id}</code></td>
            <td><span class="badge ${tx.type === 'deposit' ? 'success' : 'danger'}">${Utils.txTypeLabel(tx.type)}</span></td>
            <td style="color:${tx.type === 'deposit' ? 'var(--green)' : 'var(--red)'}">${tx.type === 'deposit' ? '+' : '-'}${Utils.formatMoney(tx.amount)}</td>
            <td>${Utils.formatMoney(tx.balance_after)}</td>
            <td><span class="badge ${Utils.statusClass(tx.status)}">${Utils.statusLabel(tx.status)}</span></td>
          </tr>
        `).join('') : '<tr><td colspan="6" style="text-align:center;color:#999">暂无交易记录</td></tr>';

        Modal.open(`Ledger 详情 <small style="color:#999">${id}</small>`, `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
            <div><strong>Ledger ID:</strong> <code>${ledger.id}</code></div>
            <div><strong>商户:</strong> ${merchantName}</div>
            <div><strong>消费者:</strong> ${consumerName}</div>
            <div><strong>状态:</strong> <span class="badge ${Utils.statusClass(ledger.status)}">${Utils.statusLabel(ledger.status)}</span></div>
            <div><strong>当前余额:</strong> <span style="font-weight:700;color:var(--green);font-size:18px">${Utils.formatMoney(ledger.balance)}</span></div>
            <div><strong>累计预存:</strong> ${Utils.formatMoney(ledger.total_deposited || 0)}</div>
            <div><strong>累计消费:</strong> ${Utils.formatMoney(ledger.total_spent || 0)}</div>
            <div><strong>创建时间:</strong> ${Utils.formatDate(ledger.created_at)}</div>
          </div>
          <h4 style="margin:16px 0 8px">交易记录</h4>
          <div style="max-height:300px;overflow-y:auto">
            <table class="mini-table">
              <thead><tr><th>时间</th><th>ID</th><th>类型</th><th>金额</th><th>余额</th><th>状态</th></tr></thead>
              <tbody>${txRows}</tbody>
            </table>
          </div>
        `, '');
      } catch (err) {
        Toast.error('加载失败: ' + err.message);
      }
    },

    async openTxDetail(id) {
      try {
        let tx;
        if (this.isMockMode) {
          tx = (window.mockData?.transactions || []).find(t => (t.tid || t.id) === id);
        } else {
          tx = await API.transactions.get(id);
        }
        if (!tx) return Toast.error('交易不存在');

        const merchantName = tx.merchant_name || '-';
        const consumerName = tx.consumer_name || '-';
        const isPositive = tx.type === 'deposit' || tx.type === 'refund';

        Modal.open(`交易详情 <small style="color:#999">${id}</small>`, `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div><strong>交易流水号:</strong> <code>${tx.id}</code></div>
            <div><strong>商户:</strong> ${merchantName}</div>
            <div><strong>消费者:</strong> ${consumerName}</div>
            <div><strong>类型:</strong> <span class="badge ${isPositive ? 'success' : 'danger'}">${Utils.txTypeLabel(tx.type)}</span></div>
            <div><strong>金额:</strong> <span style="font-size:20px;font-weight:700;color:${isPositive ? 'var(--green)' : 'var(--red)'}">${isPositive ? '+' : '-'}${Utils.formatMoney(tx.amount)}</span></div>
            <div><strong>状态:</strong> <span class="badge ${Utils.statusClass(tx.status)}">${Utils.statusLabel(tx.status)}</span></div>
            <div><strong>交易前余额:</strong> ${Utils.formatMoney(tx.balance_before)}</div>
            <div><strong>交易后余额:</strong> ${Utils.formatMoney(tx.balance_after)}</div>
            <div><strong>描述:</strong> ${tx.description || '-'}</div>
            <div><strong>时间:</strong> ${Utils.formatDate(tx.created_at)}</div>
          </div>
        `, '');
      } catch (err) {
        Toast.error('加载失败: ' + err.message);
      }
    },

    async handleDepositSubmit() {
      const merchantId = document.getElementById('deposit-merchant')?.value;
      const consumerId = document.getElementById('deposit-consumer')?.value?.trim();
      const amount = parseFloat(document.getElementById('deposit-amount')?.value);

      if (!merchantId) return Toast.error('请选择商户');
      if (!consumerId) return Toast.error('请输入消费者ID');
      if (!amount || amount <= 0) return Toast.error('金额必须大于0');

      // 如果是 Mock 模式，使用本地模拟
      if (this.isMockMode) {
        this.handleMockDeposit(merchantId, consumerId, amount);
        return;
      }

      try {
        Toast.info('正在提交预存...');
        await API.transactions.deposit({ merchant_id: merchantId, consumer_id: consumerId, amount });
        Toast.success('预存成功！');
        await this.loadData();
      } catch (err) {
        Toast.error('预存失败: ' + err.message);
      }
    },

    handleMockDeposit(merchantId, consumerId, amount) {
      // Mock 模式下在本地模拟创建
      const ledgerId = 'ld_' + Date.now();
      const tid = 't_' + Date.now();
      const merchant = (window.mockData?.merchants || []).find(m => m.id === merchantId);

      const newLedger = {
        ledgerId, merchantId, consumer: consumerId,
        balance: amount, status: 'active'
      };
      const newTx = {
        tid, ledgerId, merchantId, consumerId,
        amount: -amount,
        time: new Date().toLocaleString('zh-CN'),
        status: 'completed'
      };

      if (window.mockData) {
        window.mockData.ledgers.push(newLedger);
        window.mockData.transactions.unshift(newTx);
      }

      Toast.success('Mock 预存成功（数据仅保存在浏览器内存）');
      this.loadMockData();
    }
  };

  window.App = App;

  // 初始化
  document.addEventListener('DOMContentLoaded', () => App.init());

})();
