# 预存与分账统一底座重构设计文档 (Design Doc)

## 1. 架构概览 (Architecture Overview)

本次重构目标是将「资金预存项目」升级，并作为统一底层服务，不仅支撑预存业务，还能为接下来的「旅购通」相关分账业务提供统一的钱账通支付基础设施和领域模型。

整体采用 **前后端分离 + 前端 Monorepo** 的架构：

- **Frontend (Monorepo - pnpm workspace)**:
  - `packages/shared-ui`: 统一的 UI 组件、样式变量和基础 utils。
  - `apps/admin`: 运营与管理员后台 (Vue 3 + Vite + Element Plus)。
  - `apps/merchant`: 商户工作台 (Vue 3 + Vite + Element Plus)。
  - `apps/miniprogram`: C 端小程序/H5 (Vue 3 + Vite + Vant)。

- **Backend (Node.js + Express + Prisma)**:
  - `server/api`: 业务路由层 (预存、核销、分账接口)。
  - `server/services`: 业务逻辑层。
  - `server/core/payment`: 钱账通支付核心 SDK (包含加解密、请求封装等核心能力，供上层通用)。
  - `server/prisma`: 统一的数据库 schema，使用 SQLite 作为开发期初始方案，随时无缝接入 PostgreSQL。

## 2. 核心系统职责 (Components and Responsibilities)

### 2.1 钱账通网关层 (Core Payment Service)
- **职责**: 负责与钱账通网关的一切网络交互。
- **能力**: RSA 加解密签名验签，鉴权体系，API Token 维护。
- **包含接口**: 商户入驻推件，用户/子账户开户，预付费充值(主转子)，单笔代付，交易查询与核对。

### 2.2 统一账务层 (Account & Ledger Service)
- **职责**: 管理平台内部与外部同步的系统账户。
- **能力**:
  - 为 Consumer (消费者) 和 Merchant (商户) 在平台内建户并映射外部钱账通账户 `accountId`。
  - 记账薄 `Ledger` 模型，记录平台内的虚拟存量。
  - `Transaction` 模型，完整包含流水事件，用以辅助外部真实流水对账。

### 2.3 资金预存业务层 (Fund Deposit Service)
- **职责**: C 端用户给特定商户预存以及通过预存抵扣服务费的特化业务。
- **流程**: 预存动作 -> 请求支付层完成充值到消费者资金账户 -> 记录资金台账；核销动作 -> 调取内部余额 -> 生成清分流水 (进入后续分账结算池)。

### 2.4 分账结算业务层 (Settlement Service) - 为旅购通预留
- **职责**: 基于核销记录或旅行通分销规则，将款项通过钱账通提供的分账能力划拨到商户的对公结算账户/导游账户。

## 3. 数据流 (Data Flow)

1.  **用户发起充值/支付**:  
    `[小程序]` -> `/api/v1/transactions/deposit` -> `[预存业务层]` -> `[钱账通网关层]` -> `钱账通 API (下单/代扣)`。
2.  **回调验证与记账**:
    `钱账通异步通知` -> `[支付层验签]` -> `更新外部支付状态` -> `[账务层]` -> `更新 Ledger 和 Transaction`。
3.  **商户核销扣款 (C端主动消费)**:
    `[小程序/收银台]` -> `/api/v1/transactions/withdraw` -> `[预存业务层]` -> `内部账务 Ledger 扣减` -> 系统生成待分账记录 (Pending Settlement)。
4.  **自动清分 (T+N)**:
    `[定时任务/清分层]` -> 读取 `Pending Settlement` -> 调用钱账通 `分账/代收付 API` -> 转账给 B 端商户。

## 4. 测试与实施策略 (Testing Strategy & Rollout)

- **TDD (测试驱动)**: 特别是在钱账通网关层，所有涉及到签名、验证以及报文格式的方法必须优先编写单元测试保证不退化。
- **渐进式实施**:
  - 第一步：使用 pnpm 配置并脚手架化 Monorepo 框架，将原来分散的 Vue 3 迁移。
  - 第二步：搭建 Prisma Schema 和重构 Express 路由结构。
  - 第三步：实现钱账通基础工具类 (Signature、Axios 拦截) 及 Fake Mock 网关（如果在开发时无真实连通性可配置降级）。
  - 第四步：完成资金预存业务从 API 到底层真实调用的联调，最终跑通 Demo。

## 5. Scope Boundaries

- 此次改版核心在构建**底层统一支付与多前端架构**。
- 不涉及替换当前 `Vue 3` 的选型，不迁移至类似 `Nuxt/Next` 等重型 SSR 框架，维持客户端渲染。
- 先对接钱账通已有提供的标准接口，暂不做未提及的三方平台。
