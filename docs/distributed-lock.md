# 分布式锁使用说明

## 1. 实现概览

- 位置：`apps/api/src/plugins/lock/index.ts`
- 后端：Redis（`apps/api/src/plugins/db/redis/index.ts` 导出的 ioredis 单例）
- 抽象：`DistributedLock` 接口 + `RedisDistributedLock` 实现 + `distributedLock` 单例，更换锁后端（数据库锁 / ZooKeeper / etcd）只需替换该单例，调用方无需改动。
- 对外 API：`withDistributedLock(key, fn, ttlMs?)`

加锁流程：

1. `SET dextea:lock:{key} {token} PX {ttlMs} NX` 抢锁，`token = {pid}-{timestamp}-{random}`。
2. 抢锁失败抛出 `SystemErrorCodes.LOCK_CONFLICT`（10009，"资源正被其他操作占用，请稍后重试"）；Redis 异常抛出 `SystemErrorCodes.LOCK_ACQUIRE_FAILED`（10010）。
3. 业务函数执行完毕后，在 `finally` 中用 Lua 脚本比对 token 再删除，避免误删他人持有的锁；释放失败不阻断主流程，锁按 TTL 自动过期。

关键参数：

| 项 | 值 |
| --- | --- |
| Redis key 前缀 | `dextea:lock:` |
| 默认 TTL | `10_000` ms（10 秒） |
| 锁类型 | 非阻塞、不重试、不可重入 |

注意：当前实现**不会等待重试**，抢不到锁直接失败返回给调用方，由前端/调用方决定是否重试。

## 2. 已使用分布式锁的位置

| # | 模块 / 方法 | 接口 | 锁键（不含前缀） | Redis 实际 key | TTL |
| --- | --- | --- | --- | --- | --- |
| 1 | `products` / `productService.updateProduct` | `PUT /products/:id/info`（仅当请求体包含 `status` 时加锁） | `product:status:{id}` | `dextea:lock:product:status:{id}` | 10s |
| 2 | `products` / `productService.updateProductStatus` | `PATCH /products/:id/status` | `product:status:{id}` | `dextea:lock:product:status:{id}` | 10s |
| 3 | `stores` / `storeService.updateStoreStatus` | `PATCH /stores/:id/status` | `store:status:{id}` | `dextea:lock:store:status:{id}` | 10s |
| 4 | `store-catalog` / `storeCatalogService.upsertProductStoreStatus` | `PATCH /stores/:storeId/products/:productId/status` | `store-catalog:product-status:{storeId}:{productId}` | `dextea:lock:store-catalog:product-status:{storeId}:{productId}` | 10s |
| 5 | `store-catalog` / `storeCatalogService.upsertCustomizationOptionStoreStatus` | `PATCH /stores/:storeId/customization-options/:optionId/status` | `store-catalog:option-status:{storeId}:{optionId}` | `dextea:lock:store-catalog:option-status:{storeId}:{optionId}` | 10s |

### 2.1 商品全局状态（#1、#2）

`apps/api/src/module/products/product.service.ts`

```ts
withDistributedLock(`product:status:${id}`, runMutation)
```

两个入口共用同一把商品级锁：`updateProduct`（携带 `status` 字段时）与 `updateProductStatus`，避免"编辑商品"与"上下架"并发写导致状态互相覆盖。当 `updateProduct` 不含 `status` 时不加锁，直接执行。

### 2.2 门店状态（#3）

`apps/api/src/module/stores/store.service.ts`

```ts
withDistributedLock(`store:status:${id}`, async () => { ... })
```

按门店 ID 加锁，保证门店营业状态写入串行。注意"门店是否存在"的校验在锁外执行，锁内只做状态落库。

### 2.3 门店商品 / 客制化选项状态（#4、#5）

`apps/api/src/module/store-catalog/store-catalog.service.ts`

两处均为 upsert（不存在则插入、存在则更新）语义，锁键精确到 `门店 + 资源` 维度，既保证同一条记录串行写入，又不影响其他门店或其他商品的并发操作。

## 3. 锁键命名约定

```
{业务域}:{操作/资源维度}:{资源标识...}
```

- 业务域与模块目录名一致（`product`、`store`、`store-catalog`）。
- 锁粒度取到能唯一确定被写记录的最小维度，避免全局大锁。
- 同一份数据的多个写入入口必须复用同一锁键（如 #1 与 #2）。
- 新增锁时请同步更新本文档表格。

## 4. 使用示例

```ts
import { withDistributedLock } from '@/plugins/lock/index.js';

await withDistributedLock(`order:pay:${orderId}`, async () => {
  // 受保护的写操作
}, 5_000);
```

## 5. 使用注意事项

- **只包写操作**：把只读校验尽量放在锁外，缩短持锁时间。
- **TTL 要大于业务耗时**：默认 10 秒，若锁内包含慢查询或外部调用，需显式传入更大的 `ttlMs`，否则锁会提前过期导致并发失效。
- **不可重入**：同一请求链路中不要对同一锁键嵌套加锁，会直接抛 `LOCK_CONFLICT`。
- **与数据库事务的顺序**：先获取锁再开启事务，避免长事务持锁。
- **失败语义**：`LOCK_CONFLICT` 属于可重试错误，前端应提示用户稍后重试而非当作系统故障。
