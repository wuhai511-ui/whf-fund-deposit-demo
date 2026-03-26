/**
 * JSON 文件数据库（无任何外部依赖）
 * 数据持久化到 fund_deposit.json
 */
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'fund_deposit.json');

let data = null;

function load() {
  if (data) return data;
  if (fs.existsSync(DB_FILE)) {
    try {
      data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (err) {
      data = { merchants: [], consumers: [], ledgers: [], transactions: [], settlements: [], agreements: [], admins: [] };
    }
  } else {
    data = { merchants: [], consumers: [], ledgers: [], transactions: [], settlements: [], agreements: [], admins: [] };
  }
  return data;
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 通用查询
function findAll(table, query = {}) {
  const rows = load()[table] || [];
  if (!Object.keys(query).length) return rows;
  return rows.filter(row =>
    Object.entries(query).every(([k, v]) => row[k] === v)
  );
}

function findOne(table, query) {
  return findAll(table, query)[0] || null;
}

function findById(table, id) {
  const rows = load()[table] || [];
  return rows.find(r => r.id === id) || null;
}

function insert(table, item) {
  load();
  data[table].push(item);
  save();
  return item;
}

function update(table, id, updates) {
  load();
  const idx = data[table].findIndex(r => r.id === id);
  if (idx === -1) return null;
  data[table][idx] = { ...data[table][idx], ...updates };
  save();
  return data[table][idx];
}

function remove(table, id) {
  load();
  const idx = data[table].findIndex(r => r.id === id);
  if (idx === -1) return false;
  data[table].splice(idx, 1);
  save();
  return true;
}

function upsert(table, item) {
  load();
  const idx = data[table].findIndex(r => r.id === item.id);
  if (idx >= 0) {
    data[table][idx] = item;
  } else {
    data[table].push(item);
  }
  save();
  return item;
}

module.exports = { load, save, findAll, findOne, findById, insert, update, remove, upsert };
