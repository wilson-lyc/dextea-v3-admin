---
name: status-update-distributed-lock
overview: 在三个「门店相关状态」修改接口（门店状态、商品门店状态、客制化选项门店状态）中引入 Redis 分布式锁：拿到锁才执行写操作，未拿到锁即返回「请稍后重试」。复用现有 withDistributedLock 工具与 LOCK_CONFLICT 错误码，按资源维度加锁。
todos:
  - id: lock-store-status
    content: 在 store.service.ts 的 updateStoreStatus 用 withDistributedLock 包裹写操作
    status: completed
  - id: lock-catalog-status
    content: 在 store-catalog.service.ts 两个 status 方法用 withDistributedLock 包裹写操作
    status: completed
  - id: api-typecheck
    content: 运行 pnpm --filter api typecheck 校验类型
    status: completed
    dependencies:
      - lock-store-status
      - lock-catalog-status
---

## 需求概述

在三类「门店维度状态」的写操作上增加 Redis 分布式锁保护：只有成功获取锁的请求才能修改状态，未获取到锁的请求直接返回「请稍后重试」（冲突提示）。

## 核心功能

- 修改门店状态（`PATCH /stores/:id/status`）时加锁，锁维度为单个门店。
- 修改商品门店状态（`PATCH /stores/:storeId/products/:productId/status`）时加锁，锁维度为「门店 + 商品」。
- 修改客制化选项门店状态（`PATCH /stores/:storeId/customization-options/:optionId/status`）时加锁，锁维度为「门店 + 选项」。
- 加锁失败立即返回冲突提示，不执行写操作；持有锁期间异常亦能自动释放锁。

## 技术栈

- 后端：Fastify 5 + TypeScript，复用既有 `withDistributedLock` 工具（基于 ioredis 的 `SET NX PX` + Lua 释放）。
- 既有基础设施已满足全部需求，无需新建锁实现、错误码或数据表。

## 实现方案

复用 `apps/api/src/plugins/utils/distributed-lock.ts` 的 `withDistributedLock(key, fn, ttlMs?)`：

- 申请锁失败（key 已被占用）时，该函数内部直接 `throw new BizError(SystemErrorCodes.LOCK_CONFLICT)`，消息为「资源正被其他操作占用，请稍后重试」，已包含需求要求的「请稍后重试」字样，全局错误处理器会原样返回给前端，无需额外处理。
- 锁获取成功后执行 `fn`，`finally` 中通过 Lua 脚本（仅当仍由自己持有时）自动释放，避免误删他人锁或持有者崩溃死锁。
- 保持默认 `TTL = 10_000ms`，状态写操作耗时极短，足以覆盖正常执行且防止死锁。

### 锁键设计（按资源维度，与 `customizations` 模块既有模式一致）

- 门店状态：`store:status:${id}`
- 商品门店状态：`store-catalog:product-status:${storeId}:${productId}`
- 客制化选项门店状态：`store-catalog:option-status:${storeId}:${optionId}`

### 关键决策

- 仅对「实际写状态」的临界区加锁；前置校验（状态值合法性、门店存在性 `ensureStoreExists`）放在锁外执行，避免非法请求徒增 Redis 加锁往返开销。
- 不改动 controller / 路由 / 前端 / 契约包：锁逻辑下沉到 service 层，对调用方透明，符合现有分层与「不在 controller 里 try/catch」的约定。
- 锁粒度精确到单资源（门店/商品/选项），不同资源的并发状态修改互不影响，仅同一资源的并发写被串行化。

## 实现注意

- 复用既有 `withDistributedLock`，不要重新实现加锁/释放逻辑。
- `withDistributedLock` 的释放在 `finally` 中，fn 内抛 `BizError`（如门店不存在）也会自动释放，不会留下死锁。
- `store.service.ts` 当前已 `import { redis }`，仅需追加 `import { withDistributedLock } from '@/plugins/utils/distributed-lock.js'`（注意 `.js` 扩展名）。
- `store-catalog.service.ts` 当前未引入该工具，需新增同样的 import。
- 包路径统一为 `@/plugins/utils/distributed-lock.js`，与 `customization.service.ts` 用法保持一致。

## 架构设计

不涉及架构调整，仅在既有 service 方法内嵌一层分布式锁包裹，调用链保持：
Controller → Service（加锁包裹写操作）→ Repository → MySQL/Redis。

## 目录结构与修改点

```
apps/api/src/module/stores/store.service.ts
  # [MODIFY] import 新增 withDistributedLock；updateStoreStatus 在门店存在性校验后，
  # 用 withDistributedLock(`store:status:${id}`, () => { updateStoreById(id, { status }); return { status }; })
  # 包裹写操作，before/after 校验保持锁外。

apps/api/src/module/store-catalog/store-catalog.service.ts
  # [MODIFY] import 新增 withDistributedLock；
  # upsertProductStoreStatus 在状态值校验 + ensureStoreExists 之后，用
  # withDistributedLock(`store-catalog:product-status:${storeId}:${productId}`, () => upsertProductStoreStatus(...)) 包裹；
  # upsertCustomizationOptionStoreStatus 同理用 key `store-catalog:option-status:${storeId}:${optionId}` 包裹。
```

## 关键代码结构

无新增类型/接口，全部复用既有 `withDistributedLock<T>(key, fn, ttlMs?)` 签名。