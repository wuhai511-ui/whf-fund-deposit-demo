# 资金预存项目 - 系统架构方案

> 文档版本：v1.0  |  日期：2026-03-26  |  状态：规划中

---

## 一、产品概述

### 1.1 业务模型

**资金预存**（Fund Deposit）是一种消费者预付款担保交易模式：

```
消费者 → 预存资金到商户账户 → 商户提供服务 → 按次/按量扣款 → 资金最终清分
```

**核心参与方：**
- **消费者（Consumer）**：通过小程序预存资金到不同商户
- **商户（Merchant）**：入驻平台，提供服务，收取预存款
- **平台（Platform）**：提供资金存管、清分、账务管理服务
- **银行/合作机构**：提供资金托管服务（本次设计预留接口）

### 1.2 资金流向

```
[消费者钱包] → [平台存管账户] → [商户结算账户]
                    ↓
            [银行资金存管]
```

---

## 二、系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  C端小程序    │  │  B端商户后台  │  │  管理后台    │     │
│  │  (消费者)     │  │  (商户管理)  │  │  (平台运营)  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                       API 网关层                             │
│              (Express.js + JWT Authentication)               │
└─────────────────────────────────────────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      业务逻辑层                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ 商户服务    │ │ 消费者服务  │ │ 账务服务   │ │ 清分服务  │ │
│  │ Merchant   │ │ Consumer   │ │ Ledger    │ │ Clearing │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ 交易服务   │ │ 通知服务    │ │ 协议服务    │              │
│  │ Transaction│ │ Notification│ │ Agreement  │              │
│  └────────────┘ └────────────┘ └────────────┘              │
└─────────────────────────────────────────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                       数据访问层                             │
│                    (SQLite / PostgreSQL)                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端（现有） | Vanilla JS + HTML5 + CSS3 | 保持 GitHub Pages 部署 |
| 前端（新） | React 18 + Vite | 可选升级路径 |
| 后端 | Node.js 18+ / Express.js 4 | RESTful API |
| 数据库 | SQLite（开发/演示）/ PostgreSQL（生产） | |
| 认证 | JWT（HS256） | Token 有效时间 7 天 |
| 部署 | GitHub Pages（前端）+ Railway/Render（后端） | |

---

## 三、数据模型

### 3.1 核心实体关系

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Merchant   │       │  Consumer   │       │   Admin     │
│   商户       │       │   消费者     │       │   管理员     │
└──────┬──────┘       └──────┬──────┘       └─────────────┘
       │                     │
       │  1:N                │  1:N
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│   Ledger    │       │ Transaction │
│  记账簿      │◄──────│   交易记录   │
│ (per m-c)   │       │             │
└──────┬──────┘       └──────┬──────┘
       │                     │
       └─────────┬───────────┘
                 │ 引用
                 ▼
          ┌─────────────┐
          │  Settlement  │
          │    清分记录   │
          └─────────────┘
```

### 3.2 数据表设计

#### merchants（商户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (PK) | 商户ID，格式 m_xxx |
| name | TEXT | 商户名称 |
| industry | TEXT | 行业分类 |
| status | TEXT | pending/active/suspended |
| created_at | DATETIME | 创建时间 |
| balance | REAL | 当前账户余额（累计） |

#### consumers（消费者表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (PK) | 消费者ID |
| openid | TEXT | 微信 OpenID（预留） |
| phone | TEXT | 手机号 |
| name | TEXT | 姓名 |
| status | TEXT | active/inactive |
| created_at | DATETIME | 创建时间 |

#### ledgers（记账簿表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (PK) | Ledger ID |
| merchant_id | TEXT (FK) | 所属商户 |
| consumer_id | TEXT (FK) | 所属消费者 |
| balance | REAL | 当前余额 |
| total_deposited | REAL | 累计预存 |
| total_spent | REAL | 累计消费 |
| status | TEXT | active/frozen/closed |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### transactions（交易记录表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (PK) | 交易ID |
| ledger_id | TEXT (FK) | 所属Ledger |
| merchant_id | TEXT (FK) | 商户ID |
| consumer_id | TEXT (FK) | 消费者ID |
| type | TEXT | deposit/withdraw/refund |
| amount | REAL | 金额（正数） |
| balance_before | REAL | 交易前余额 |
| balance_after | REAL | 交易后余额 |
| status | TEXT | pending/completed/failed |
| description | TEXT | 交易描述 |
| created_at | DATETIME | 创建时间 |

#### settlements（清分记录表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (PK) | 清分ID |
| merchant_id | TEXT (FK) | 商户ID |
| period | TEXT | 清分周期（如 2026-W13） |
| total_amount | REAL | 清分总额 |
| status | TEXT | pending/completed |
| created_at | DATETIME | 创建时间 |

#### agreements（协议记录表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (PK) | 协议ID |
| consumer_id | TEXT (FK) | 消费者ID |
| merchant_id | TEXT (FK) | 商户ID |
| type | TEXT | deposit_agreement/service_agreement |
| content | TEXT | 协议内容（JSON） |
| signed_at | DATETIME | 签署时间 |
| status | TEXT | active/terminated |

---

## 四、API 设计

### 4.1 基础信息

- 基础路径：`/api/v1`
- 认证方式：`Authorization: Bearer <token>`
- 统一响应格式：`{ code, message, data }`

### 4.2 API 端点

#### 商户管理
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /merchants | 入驻商户 |
| GET | /merchants | 商户列表 |
| GET | /merchants/:id | 商户详情 |
| PATCH | /merchants/:id | 更新商户 |
| GET | /merchants/:id/ledgers | 商户所有Ledger |

#### 消费者
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /consumers | 注册消费者 |
| GET | /consumers/:id | 消费者详情 |
| GET | /consumers/:id/ledgers | 消费者所有Ledger |

#### 记账簿
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /ledgers | Ledger列表 |
| GET | /ledgers/:id | Ledger详情 |
| POST | /ledgers | 创建Ledger（开户） |

#### 交易
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /transactions/deposit | 预存资金 |
| POST | /transactions/withdraw | 消费扣款 |
| POST | /transactions/refund | 退款 |
| GET | /transactions | 交易列表 |
| GET | /transactions/:id | 交易详情 |

#### 清分
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /settlements | 创建清分 |
| GET | /settlements | 清分列表 |
| GET | /settlements/:id | 清分详情 |

#### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/login | 登录（获取Token） |
| POST | /auth/refresh | 刷新Token |

---

## 五、页面重构规划

### 5.1 现有页面（静态Mock）
- `index.html` - 管理后台首页（Ledger + Transaction 视图）

### 5.2 待新增页面

#### C端小程序（消费者视角）
| 页面 | 文件 | 功能 |
|------|------|------|
| 首页 | pages/home/index.html | 商户搜索、行业列表 |
| 商户详情 | pages/merchant/detail.html | 商户信息、服务列表 |
| 服务详情 | pages/service/detail.html | 服务项目、购买 |
| 收银台 | pages/checkout/index.html | 支付/预存 |
| 账户首页 | pages/account/index.html | 个人Ledger总览 |
| 订单记录 | pages/orders/index.html | 交易历史 |
| 订单详情 | pages/orders/detail.html | 单笔交易详情 |
| 消费者开户 | pages/onboarding/index.html | 实名认证、签协议 |

#### B端商户后台
| 页面 | 文件 | 功能 |
|------|------|------|
| 商户首页 | merchant/pages/dashboard.html | 经营概览 |
| Ledger管理 | merchant/pages/ledgers.html | 商户下所有消费者Ledger |
| 交易记录 | merchant/pages/transactions.html | 交易流水 |
| 清分记录 | merchant/pages/settlements.html | 清分对账 |

#### 管理后台
| 页面 | 文件 | 功能 |
|------|------|------|
| 管理员首页 | admin/pages/dashboard.html | 平台全局概览 |
| 商户管理 | admin/pages/merchants.html | 商户入驻审核 |
| 消费者管理 | admin/pages/consumers.html | 消费者管理 |
| 账务管理 | admin/pages/accounts.html | 全部Ledger/交易 |
| 清分管理 | admin/pages/clearing.html | 清分操作 |
| 系统配置 | admin/pages/settings.html | 费率、规则配置 |

---

## 六、GitHub Pages 部署策略

### 6.1 分支管理
```
main          → GitHub Pages（最新稳定版）
feature/*     → 功能分支
```

### 6.2 目录结构（部署时）
```
/                   → C端小程序首页
/pages/*            → C端页面
/merchant/*        → B端商户后台
/admin/*           → 管理后台
/css/*             → 样式文件
/js/*              → 脚本文件
/assets/*          → 静态资源（截图、图标）
```

### 6.3 后端 API 部署
- 开发/演示：本地运行 `node server/index.js`
- 生产：Railway / Render（免费 tier）

---

## 七、实施计划

### Phase 1：基础架构（本周）
- [x] 文档分析 & UI 截图下载
- [ ] 搭建 Node.js/Express 后端骨架
- [ ] 设计 SQLite 数据库结构
- [ ] 实现商户、消费者基础 API

### Phase 2：核心功能（下周）
- [ ] 实现 Ledger 和交易 API
- [ ] 重构前端 `index.html` 对接真实 API
- [ ] 新增账户首页和消费者开户流程

### Phase 3：完整功能（第3周）
- [ ] 商户后台页面
- [ ] 管理后台页面
- [ ] 清分功能
- [ ] JWT 认证

### Phase 4：上线准备（第4周）
- [ ] 后端部署到 Railway/Render
- [ ] 域名绑定（可选）
- [ ] 演示数据填充
- [ ] 上线验证

---

## 八、UI 截图参考

已下载的 UI 截图存放于 `assets/ui-screenshots/`：

| 文件 | 说明 |
|------|------|
| 01-资金存管业务介绍.png | 业务介绍页 |
| 02-业务流程图.png | 整体业务流程 |
| 03-消费者开户流程.png | 消费者开户步骤 |
| 04-商户入驻流程.png | 商户入驻步骤 |
| 05-系统产品架构.png | 系统模块架构 |
| 06-帐户体系.png | 账户关系图 |
| 07-小程序首页.png | C端首页 |
| 08-小程序首页状态1.png | C端首页（有数据） |
| 09-订单详情.png | 订单详情页 |
| 10-账户首页.png | 账户总览页 |
| 11-消费者开户页面.png | 开户表单页 |
| 12-协议阅读页.png | 协议展示页 |
| 13-收银台.png | 收银台页面 |
| 14-商户详情.png | 商户详情页 |
| 15-服务详情.png | 服务详情页 |
| 16-订单页面.png | 订单列表页 |
| 17-行业列表.png | 行业分类页 |
