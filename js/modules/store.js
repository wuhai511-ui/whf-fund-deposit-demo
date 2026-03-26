/**
 * 状态管理模块
 * 简化版 Store，用于管理前端状态
 */
window.Store = (function() {
  let state = {
    // 数据
    merchants: [],
    consumers: [],
    ledgers: [],
    transactions: [],
    settlements: [],
    // 概览统计
    overview: null,
    // UI状态
    loading: false,
    error: null,
    // 当前选中
    currentMerchant: null,
    currentLedger: null,
  };

  const listeners = [];

  function getState() {
    return state;
  }

  function setState(updates) {
    state = { ...state, ...updates };
    listeners.forEach(fn => fn(state));
  }

  function subscribe(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }

  // 数据加载
  async function loadOverview() {
    setState({ loading: true, error: null });
    try {
      const data = await window.API.stats.overview();
      setState({ overview: data, loading: false });
      return data;
    } catch (err) {
      setState({ error: err.message, loading: false });
      throw err;
    }
  }

  async function loadMerchants(params) {
    try {
      const result = await window.API.merchants.list(params);
      setState({ merchants: result.list || [] });
      return result;
    } catch (err) {
      setState({ error: err.message });
      throw err;
    }
  }

  async function loadLedgers(params) {
    try {
      const result = await window.API.ledgers.list(params);
      setState({ ledgers: result.list || [] });
      return result;
    } catch (err) {
      setState({ error: err.message });
      throw err;
    }
  }

  async function loadTransactions(params) {
    try {
      const result = await window.API.transactions.list(params);
      setState({ transactions: result.list || [] });
      return result;
    } catch (err) {
      setState({ error: err.message });
      throw err;
    }
  }

  async function loadSettlements(params) {
    try {
      const result = await window.API.settlements.list(params);
      setState({ settlements: result.list || [] });
      return result;
    } catch (err) {
      setState({ error: err.message });
      throw err;
    }
  }

  // 操作
  async function createDeposit(data) {
    const result = await window.API.transactions.deposit(data);
    await loadOverview();
    await loadLedgers();
    await loadTransactions();
    return result;
  }

  async function createWithdraw(data) {
    const result = await window.API.transactions.withdraw(data);
    await loadOverview();
    await loadLedgers();
    await loadTransactions();
    return result;
  }

  async function createLedger(data) {
    const result = await window.API.ledgers.create(data);
    await loadOverview();
    await loadLedgers();
    return result;
  }

  async function createSettlement(data) {
    const result = await window.API.settlements.create(data);
    await loadSettlements();
    return result;
  }

  return {
    getState,
    setState,
    subscribe,
    loadOverview,
    loadMerchants,
    loadLedgers,
    loadTransactions,
    loadSettlements,
    createDeposit,
    createWithdraw,
    createLedger,
    createSettlement,
  };
})();
