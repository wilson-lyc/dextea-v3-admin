# 门店-实体关联状态设计规范

## 1. 背景

门店与商品、客制化选项、原料等实体之间存在多对多关联。例如一种商品在所有门店均可销售，一个门店可销售多种商品。

**传统做法**：新建门店时，在 `product_store_status` 中批量插入所有商品 × 该门店的记录；新建商品时，在所有门店的 `product_store_status` 中批量插入该商品 × 所有门店的记录。当商品数（如 500）与门店数（如 1000）均较大时，单次批量操作可达 50 万行，对数据库造成巨大压力。

**解决方案**：读取时不做任何 DB 写入，无记录则在应用层默认 `0（禁用）`；写入时按用户指定值 UPSERT。新建门店或实体时不做任何关联插入。

## 2. 适用范围

以下关联表统一采用"读默认 / 写 UPSERT"模式。根据读写特性分为两类：

| 类别 | 表 | 实体侧 FK | 门店侧 FK | 数值字段 | 读写特性 |
|---|---|---|---|---|---|
| 门店状态 | `product_store_status` | `product_id` | `store_id` | `status` (0=下架 1=可售) | 读写 — 管理员可启用/禁用 |
| 门店状态 | `customization_option_store_status` | `customization_option_id` | `store_id` | `status` (0=下架 1=启用) | 读写 — 管理员可启用/禁用 |
| 门店库存 | `store_inventory` | `ingredient_id` | `store_id` | `quantity` (库存数量) | 只读 — 不提供写接口，通过其他系统同步 |

> **库存只读说明**：本系统中库存不会走写操作，都是读操作，无需考虑库存的并发写入管理。后续 3.2 伪代码、3.5 并发安全、4.5 代码示例均仅针对状态表展开。

## 3. 核心规则

### 3.1 读取时不做 DB 写入，应用层返回默认值

查询某实体在某门店的状态时，只读 DB，无记录则在应用层返回默认值，不写数据库：

```
// 状态表：product_store_status / customization_option_store_status
function getStatus(table, entityId, storeId):
    record = SELECT * FROM {table} WHERE {entityFk} = entityId AND store_id = storeId
    if record == null:
        return { entityFk: entityId, storeId, status: 0 }   // 仅内存，不写 DB
    return record

// 库存表：store_inventory
function getInventory(ingredientId, storeId):
    record = SELECT * FROM store_inventory
        WHERE ingredient_id = ingredientId AND store_id = storeId
    if record == null:
        return { ingredientId, storeId, quantity: 0 }       // 仅内存，不写 DB
    return record
```

- 只有用户主动执行写操作（启用/调整库存）时，才通过 UPSERT 写入数据库

### 3.2 写入时 UPSERT（有则更新，无则插入）

用户明确指定状态/数量时，使用 UPSERT 模式——有记录走 UPDATE，无记录走 INSERT：

```
function upsertStatus(table, entityId, storeId, newStatus):
    INSERT INTO {table} ({entityFk}, store_id, status)
    VALUES (entityId, storeId, newStatus)
    ON DUPLICATE KEY UPDATE
        status = VALUES(status)
    // created_at / updated_at 由数据库 ON UPDATE CURRENT_TIMESTAMP 自动维护
```

- **写入和读取的默认值逻辑分离**：读取时缺失 → 默认 0（禁用）；写入时缺失 → 按用户指定值插入。两者不耦合

### 3.3 新建门店/实体不做批量插入

| 场景 | 行为 |
|---|---|
| 新建门店 | 不插入任何 `product_store_status`、`customization_option_store_status`、`store_inventory` |
| 新建商品 | 不插入任何 `product_store_status` |
| 新建客制化选项 | 不插入任何 `customization_option_store_status` |
| 新建原料 | 不插入任何 `store_inventory`（原料无需"上架/下架"概念，库存通过 UPSERT 调整数量） |

### 3.4 批量列表查询

当需要返回"商品列表 + 各商品在当前门店的状态"时，推荐两种方式：

**方案 A（推荐）——LEFT JOIN + COALESCE：**

```sql
SELECT
  p.*,
  COALESCE(pss.status, 0) AS store_status
FROM products p
LEFT JOIN product_store_status pss
  ON pss.product_id = p.id AND pss.store_id = ?
```

此方案无需预创建记录，通过 `COALESCE` 在 SQL 层面直接返回默认值（0）。

**方案 B（复杂场景）——应用层逐条查询：**

批量查询返回实体列表后，逐条调用 4.1 的 get 函数（无记录则返回默认值 0）。此方式仅适用于少量实体的场景（如门店详情页展示几种标签），不推荐用于主列表。

### 3.5 并发安全

#### 库存（只读，无并发风险）

`store_inventory` 仅提供读取接口，不提供写入接口，不存在写并发问题。

#### 状态表（读写）—— Redis 分布式锁

`product_store_status` 和 `customization_option_store_status` 有写入操作，需跨后端协调。未来门店端（独立后端）也会写入这些表，因此需要**分布式互斥**。选择 Redis 分布式锁而非消息队列：
- **管理后台需要同步反馈**：管理员点击启用/禁用后期望立即看到结果，MQ 异步难以满足
- **锁粒度细**：按 `(entityId, storeId)` 加锁，不会阻塞无关操作
- **Redis 已存在**：项目已在使用 Redis（门店坐标），无新增依赖

**设计要点：**

| 维度 | 方案 |
|---|---|
| 锁 Key 格式 | `dextea:lock:store-status:{table}:{entityId}:{storeId}`（例：`dextea:lock:store-status:product:5:3`） |
| 锁 Value | UUID（用于安全释放，避免误删其他客户端的锁） |
| TTL | 5 秒（远大于一次 UPSERT 耗时，防死锁） |
| 获取方式 | `SET key uuid NX EX 5` |
| 释放方式 | Lua 脚本原子比对 value 后 DEL |
| 获取失败 | 轮询等待（间隔 50ms，最多 3 秒），超时后返回"操作过于频繁，请稍后重试" |

**锁获取失败不阻塞用户操作**——如果等不到锁，直接提示前端稍后重试，避免请求挂死。

**时序示例：**

```
时间线  管理后台 A                         门店端 B
  │     UPSERT status=1                    UPSERT status=0
  │     → SET lock NX EX 5 (成功)           → SET lock NX EX 5 (失败)
  │     → 执行 UPSERT                       → 轮询等待锁...
  │     → DEL lock (释放)                   → 3 秒后 GET lock → null
  │                                         → 返回"操作过于频繁，请稍后重试"
  ▼
最终状态: status=1（门店端 B 被告知稍后重试）
```

**SQL 层面的 UPSERT 本身是安全的**（InnoDB 行级锁），加分布式锁解决的是应用层"读取-修改"往返的丢失更新问题，以及跨后端（管理后台 + 门店端）的写入协调。

## 4. 代码模式

### 4.1 读取单条状态（示例：商品门店状态）

```typescript
import { eq, and } from 'drizzle-orm';

async function getProductStoreStatus(
  db: DrizzleDB,
  productId: number,
  storeId: number,
): Promise<{ productId: number; storeId: number; status: number }> {
  const [existing] = await db
    .select()
    .from(productStoreStatusTable)
    .where(
      and(
        eq(productStoreStatusTable.productId, productId),
        eq(productStoreStatusTable.storeId, storeId),
      ),
    )
    .limit(1);

  // 无记录则返回默认值 0（禁用），不操作数据库
  return existing ?? { productId, storeId, status: 0 };
}
```

### 4.2 UPSERT 状态（示例：启用商品在某门店的销售）

```typescript
async function upsertProductStoreStatus(
  db: DrizzleDB,
  productId: number,
  storeId: number,
  status: number,
) {
  await db
    .insert(productStoreStatusTable)
    .values({ productId, storeId, status })
    .onDuplicateKeyUpdate({
      set: { status },
    });
  // updated_at 由数据库 ON UPDATE CURRENT_TIMESTAMP 自动更新
}
```

### 4.3 批量列表查询（LEFT JOIN + COALESCE）

```typescript
async function getProductsWithStoreStatus(
  db: DrizzleDB,
  storeId: number,
) {
  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      // ... 其他商品字段
      storeStatus: sql<number>`COALESCE(${productStoreStatusTable.status}, 0)`,
    })
    .from(productsTable)
    .leftJoin(
      productStoreStatusTable,
      and(
        eq(productStoreStatusTable.productId, productsTable.id),
        eq(productStoreStatusTable.storeId, storeId),
      ),
    );

  return rows;
}
```

### 4.4 库存读取（示例：原料在某门店的库存）

```typescript
import { eq, and } from 'drizzle-orm';

async function getStoreInventory(
  db: DrizzleDB,
  ingredientId: number,
  storeId: number,
): Promise<{ ingredientId: number; storeId: number; quantity: number }> {
  const [existing] = await db
    .select()
    .from(storeInventoryTable)
    .where(
      and(
        eq(storeInventoryTable.ingredientId, ingredientId),
        eq(storeInventoryTable.storeId, storeId),
      ),
    )
    .limit(1);

  // 无记录则返回默认数量 0，不操作数据库
  return existing ?? { ingredientId, storeId, quantity: 0 };
}
```

### 4.5 UPSERT 库存（预留）

`store_inventory` 在本系统中为只读，不提供 UPSERT 接口。库存数据通过外部系统同步写入，此处预留代码模式供同步脚本使用：

```typescript
// 库存同步脚本中使用，业务接口不调用
async function upsertStoreInventory(
  db: DrizzleDB,
  ingredientId: number,
  storeId: number,
  quantity: number,
) {
  await db
    .insert(storeInventoryTable)
    .values({ ingredientId, storeId, quantity })
    .onDuplicateKeyUpdate({
      set: { quantity },
    });
  // updated_at 由数据库 ON UPDATE CURRENT_TIMESTAMP 自动更新
}
```

### 4.6 Redis 分布式锁实现

```typescript
import { randomUUID } from 'node:crypto';
import type { Redis } from 'ioredis';

/** 获取分布式锁，返回锁标识（UUID），获取失败返回 null */
async function acquireLock(
  redis: Redis,
  lockKey: string,
  ttl = 5,
): Promise<string | null> {
  const uuid = randomUUID();
  const ok = await redis.set(lockKey, uuid, 'NX', 'EX', ttl);
  return ok ? uuid : null;
}

/** 安全释放锁（Lua 脚本确保只释放自己的锁） */
const RELEASE_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  end
  return 0
`;

async function releaseLock(redis: Redis, lockKey: string, uuid: string): Promise<void> {
  await redis.eval(RELEASE_SCRIPT, 1, lockKey, uuid);
}

/** 带分布式锁的 UPSERT */
async function upsertProductStoreStatusWithLock(
  redis: Redis,
  db: DrizzleDB,
  productId: number,
  storeId: number,
  status: number,
) {
  const lockKey = `dextea:lock:store-status:product:${productId}:${storeId}`;
  const uuid = await acquireLock(redis, lockKey);
  if (!uuid) {
    throw new AppError('操作过于频繁，请稍后重试');
  }
  try {
    await upsertProductStoreStatus(db, productId, storeId, status);
  } finally {
    await releaseLock(redis, lockKey, uuid);
  }
}
```

> 锁 Key 按表名区分：`dextea:lock:store-status:customization-option:{optionId}:{storeId}` 用于客制化选项。

### 4.7 反向查询（示例：门店 × 所有商品的状态）

与 4.3 相同的 `LEFT JOIN + COALESCE` 模式，仅调换主表和关联方向：

```typescript
async function getStoreProductsWithStatus(
  db: DrizzleDB,
  storeId: number,
) {
  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      storeStatus: sql<number>`COALESCE(${productStoreStatusTable.status}, 0)`,
    })
    .from(productsTable)
    .leftJoin(
      productStoreStatusTable,
      and(
        eq(productStoreStatusTable.productId, productsTable.id),
        eq(productStoreStatusTable.storeId, storeId),
      ),
    );

  return rows;
}
```

此模式适用于所有实体-门店关联表，只需替换主表、关联表和 COALESCE 字段即可。

## 5. 状态总览查询（管理后台）

管理后台中，展示"所有门店 × 某商品"的状态矩阵时，查询模式如下：

```
GET /api/v1/products/:id/store-status?page=1&pageSize=20
```

返回该商品在所有门店中的状态。由于门店列表是完整的（stores 表全量），当 `product_store_status` 中无记录时，该门店下该商品状态应显示为"禁用"。

**实现策略**：以 stores 为主表 LEFT JOIN

```sql
SELECT
  s.id   AS store_id,
  s.name AS store_name,
  COALESCE(pss.status, 0) AS status
FROM stores s
LEFT JOIN product_store_status pss
  ON pss.store_id = s.id AND pss.product_id = ?
ORDER BY s.id
LIMIT ? OFFSET ?
```

无需预填充记录，JOIN 时缺失即为 0（禁用）。

> 此矩阵模式仅适用于带 `status` 字段的关联表。`store_inventory` 不存在"所有门店 × 某原料"的总览需求，其查询总是针对具体门店+具体原料。

## 6. 注意事项

### 6.1 不要提前批量预热

禁止在以下时机批量预创建关联记录：

- 门店创建成功后
- 商品创建成功后
- 定时任务/数据库迁移中

关联表中缺失记录代表"未操作过"，读取时自动视为默认值 0。只有用户主动操作（启用/禁用门店状态）时才会产生记录。DB 中仅存储"有实际状态变更"的数据行，行数 ≈ 启用的门店数 × 启用的商品数，远小于 门店总数 × 商品总数。

### 6.2 分布式锁

状态表的写操作通过 Redis 分布式锁互斥（详见 3.5），锁 Key 按 `(table, entityId, storeId)` 粒度分配。确保：

- **同一门店-实体对**的并发写被串行化
- **不同门店-实体对**的写互不阻塞
- 锁获取失败直接返回"稍后重试"，避免请求挂死

管理后台和门店端使用**相同的 Key 模式**和**相同的 Redis 实例**，天然跨后端协调。

### 6.3 避免在一次请求中重复查询

在一次请求中若需多次查询同一门店-实体对的状态/库存，可在应用层做简单缓存：

```typescript
const statusCache = new Map<string, number>();

function getStoreStatus(productId: number, storeId: number): number {
  const key = `${productId}:${storeId}`;
  if (statusCache.has(key)) return statusCache.get(key)!;
  // 查 DB 或返回默认值 0，写入 cache
}
```

> 缓存 value 类型：状态表为 `number(status)`，库存表为 `number(quantity)`。

对于批量场景优先使用 4.3 节的 `LEFT JOIN + COALESCE`，避免逐条查询。

### 6.4 统计口径

涉及"门店内商品总数"等统计时，应以 `stores` 或 `products` 主表为准，而非关联表——因为关联表中缺失的记录不代表实体不存在，仅代表未启用。
