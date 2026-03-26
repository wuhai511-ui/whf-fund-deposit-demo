/**
 * API 客户端模块
 * 封装所有与后端 API 的交互
 */
window.API = (function() {
  const BASE_URL = window.API_BASE_URL || '';

  // 统一请求方法
  async function request(method, path, data = null, options = {}) {
    const url = BASE_URL + '/api/v1' + path;
    const headers = { 'Content-Type': 'application/json' };

    // 如果有 token，附加到 headers
    const token = localStorage.getItem('auth_token');
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const config = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const resp = await fetch(url, config);
      const json = await resp.json();
      if (json.code !== 0) {
        throw new Error(json.message || '请求失败');
      }
      return json.data;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }

  // 简化方法
  const get = (path, params) => {
    let query = '';
    if (params) {
      query = '?' + Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('');
    }
    return request('GET', path + query);
  };

  const post = (path, data) => request('POST', path, data);
  const patch = (path, data) => request('PATCH', path, data);
  const del = (path) => request('DELETE', path);

  return {
    // 统计
    stats: {
      overview: () => get('/stats/overview'),
      merchants: () => get('/stats/merchants'),
      transactions: (days) => get('/stats/transactions', { days }),
    },

    // 商户
    merchants: {
      list: (params) => get('/merchants', params),
      get: (id) => get('/merchants/' + id),
      create: (data) => post('/merchants', data),
      update: (id, data) => patch('/merchants/' + id, data),
      ledgers: (id) => get('/merchants/' + id + '/ledgers'),
    },

    // 消费者
    consumers: {
      list: (params) => get('/consumers', params),
      get: (id) => get('/consumers/' + id),
      create: (data) => post('/consumers', data),
      ledgers: (id) => get('/consumers/' + id + '/ledgers'),
    },

    // 记账簿
    ledgers: {
      list: (params) => get('/ledgers', params),
      get: (id) => get('/ledgers/' + id),
      create: (data) => post('/ledgers', data),
      update: (id, data) => patch('/ledgers/' + id, data),
    },

    // 交易
    transactions: {
      list: (params) => get('/transactions', params),
      get: (id) => get('/transactions/' + id),
      deposit: (data) => post('/transactions/deposit', data),
      withdraw: (data) => post('/transactions/withdraw', data),
      refund: (data) => post('/transactions/refund', data),
    },

    // 清分
    settlements: {
      list: (params) => get('/settlements', params),
      get: (id) => get('/settlements/' + id),
      create: (data) => post('/settlements', data),
      update: (id, data) => patch('/settlements/' + id, data),
    },

    // 认证
    auth: {
      login: (username, password) => post('/auth/login', { username, password }),
      me: () => get('/auth/me'),
      refresh: () => post('/auth/refresh'),
      register: (username, password, role) => post('/auth/register', { username, password, role }),
      logout: () => { localStorage.removeItem('auth_token'); },
      getToken: () => localStorage.getItem('auth_token'),
      setToken: (token) => localStorage.setItem('auth_token', token),
    },

    // 健康检查
    health: () => get('/health'),
  };
})();
