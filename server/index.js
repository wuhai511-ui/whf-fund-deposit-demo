/**
 * 资金预存项目 - API 服务入口
 * 运行: npm start (或在项目 server/ 目录)
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const merchantRoutes = require('./routes/merchants');
const consumerRoutes = require('./routes/consumers');
const ledgerRoutes = require('./routes/ledgers');
const transactionRoutes = require('./routes/transactions');
const settlementRoutes = require('./routes/settlements');
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  const t = new Date().toISOString();
  console.log(`[${t}] ${req.method} ${req.path}`);
  next();
});

// API 路由
app.use('/api/v1/merchants', merchantRoutes);
app.use('/api/v1/consumers', consumerRoutes);
app.use('/api/v1/ledgers', ledgerRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/settlements', settlementRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/stats', statsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'OK', data: { version: '1.0.0', uptime: Math.floor(process.uptime()) }});
});

// 静态文件（GitHub Pages 前端）
const DIST_PATH = process.env.DIST_PATH || path.join(__dirname, '..');
app.use(express.static(DIST_PATH));

// SPA 路由 fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    code: err.code || 500,
    message: err.message || '服务器内部错误',
    data: null
  });
});

app.listen(PORT, () => {
  console.log(`🚀 资金预存 API 服务已启动: http://localhost:${PORT}`);
  console.log(`📖 API 文档: http://localhost:${PORT}/api/v1`);
  console.log(`📦 静态文件: ${DIST_PATH}`);
});

module.exports = app;
