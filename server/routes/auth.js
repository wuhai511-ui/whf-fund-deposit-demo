/**
 * 认证路由
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { findAll, findOne, insert } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'whf-fund-deposit-secret-key-2026';
const JWT_EXPIRES = '7d';

// 登录
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ code: 400, message: '用户名和密码必填' });

    const user = findOne('admins', { username });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET, { expiresIn: JWT_EXPIRES }
    );

    res.json({ code: 0, message: '登录成功', data: {
      token, user: { id: user.id, username: user.username, role: user.role }
    }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 获取当前用户
router.get('/me', (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, message: '未授权' });
    }
    const token = auth.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ code: 0, message: 'success', data: decoded });
  } catch (err) {
    res.status(401).json({ code: 401, message: 'Token无效或已过期' });
  }
});

// 刷新 Token
router.post('/refresh', (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ code: 401, message: '未授权' });
    const token = auth.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    const newToken = jwt.sign({ id: decoded.id, username: decoded.username, role: decoded.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ code: 0, message: 'Token已刷新', data: { token: newToken }});
  } catch (err) {
    res.status(401).json({ code: 401, message: 'Token无效' });
  }
});

// 注册管理员（演示环境开放）
router.post('/register', (req, res) => {
  try {
    const { username, password, role = 'admin' } = req.body;
    if (!username || !password) return res.status(400).json({ code: 400, message: '用户名和密码必填' });
    const existing = findOne('admins', { username });
    if (existing) return res.status(409).json({ code: 409, message: '用户名已存在' });

    const hashed = bcrypt.hashSync(password, 10);
    const admin = { id: 'a_' + uuidv4().slice(0, 8), username, password: hashed, role, created_at: new Date().toISOString() };
    insert('admins', admin);
    res.json({ code: 0, message: '管理员创建成功', data: { id: admin.id, username, role }});
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
