# 门店登录账号 + 邮箱 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为门店表新增 `account`（登录账号，全局唯一）、`password`（argon2 哈希）、`email`（邮箱）三列；创建门店时填写账号+邮箱，系统自动生成随机密码（仅展示一次）；门店详情页增加密码重置按钮和邮箱展示/编辑。

**Architecture:** 与员工管理（users）保持一致的密码生成模式：nanoid(12) 生成明文 → argon2 哈希存储。创建门店返回 `initialPassword`；密码重置走 `POST /stores/:id/reset-password` 返回 `newPassword`。邮箱在基础信息卡片和编辑弹窗中维护。

**Tech Stack:** Drizzle ORM (MySQL), Fastify 5, React 19, shadcn/ui, argon2, nanoid

---

## Task 1: DB Schema — 新增 account / password / email 列

**Files:**
- Modify: `apps/api/src/db/schema.ts:97-112`

- [ ] **Step 1: 修改 storesTable schema**

在 `storesTable` 的 `latitude` 之后、`createdAt` 之前添加三列：

```typescript
// 在 latitude 之后添加：
account: varchar({ length: 255 }).notNull().unique(),
password: varchar({ length: 255 }).notNull(),
email: varchar({ length: 255 }).notNull().default(''),
```

完整 schema 变为：

```typescript
export const storesTable = mysqlTable('stores', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  province: varchar({ length: 100 }).notNull().default(''),
  city: varchar({ length: 100 }).notNull().default(''),
  district: varchar({ length: 100 }).notNull().default(''),
  address: varchar({ length: 500 }).notNull().default(''),
  status: tinyint().$type<StoreStatus>().notNull().default(2),
  businessHours: varchar('business_hours', { length: 255 }).notNull().default(''),
  phone: varchar({ length: 50 }).notNull().default(''),
  longitude: double().notNull().default(0),
  latitude: double().notNull().default(0),
  account: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().default(''),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});
```

- [ ] **Step 2: 运行 db:push 同步 schema 到数据库**

```bash
pnpm --filter dextea-admin-api db:push
```

Expected: Schema pushed successfully.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/db/schema.ts
git commit -m "feat: 门店表新增 account、password、email 列"
```

---

## Task 2: Shared Types — 更新 Store 相关类型

**Files:**
- Modify: `packages/shared-types/src/types/store.ts`
- Modify: `packages/shared-types/src/index.ts`

- [ ] **Step 1: 更新 Store interface 和相关类型**

修改 `packages/shared-types/src/types/store.ts`：

```typescript
import type { StoreStatus } from '../status/store.js';

export interface Store {
  id: number;
  name: string;
  province: string;
  city: string;
  district: string;
  address: string;
  status: StoreStatus;
  businessHours: string;
  phone: string;
  longitude: number;
  latitude: number;
  account: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreInput {
  name: string;
  province: string;
  city: string;
  district: string;
  address: string;
  businessHours: string;
  phone: string;
  account: string;
  email: string;
  longitude?: number;
  latitude?: number;
}

export interface UpdateStoreInput {
  name: string;
  province: string;
  city: string;
  district: string;
  address: string;
  status: StoreStatus;
  businessHours: string;
  phone: string;
  longitude?: number;
  latitude?: number;
}

export interface CreateStoreResponse {
  id: number;
  initialPassword: string;
}

export interface UpdateStoreResponse {
  id: number;
}

export interface UpdateStoreStatusRequest {
  status: StoreStatus;
}

export interface UpdateStoreStatusResponse {
  status: StoreStatus;
}

export interface UpdateStoreBasicInfoRequest {
  name: string;
  phone: string;
  businessHours: string;
  email: string;
}

export interface UpdateStoreBasicInfoResponse {
  id: number;
}

export interface UpdateStoreLocationRequest {
  province: string;
  city: string;
  district: string;
  address: string;
  longitude: number;
  latitude: number;
}

export interface UpdateStoreLocationResponse {
  id: number;
}

export interface ResetStorePasswordResponse {
  newPassword: string;
}

/** Query string shape for GET /stores */
export interface StoreQuery {
  page?: string;
  pageSize?: string;
  keyword?: string;
}
```

- [ ] **Step 2: 更新 shared-types index 导出**

修改 `packages/shared-types/src/index.ts`，在 Store 类型导出块中添加 `ResetStorePasswordResponse`：

```typescript
export type {
  Store,
  CreateStoreInput,
  UpdateStoreInput,
  CreateStoreResponse,
  UpdateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  UpdateStoreBasicInfoRequest,
  UpdateStoreBasicInfoResponse,
  UpdateStoreLocationRequest,
  UpdateStoreLocationResponse,
  ResetStorePasswordResponse,
  StoreQuery,
} from './types/index.js';
```

- [ ] **Step 3: Commit**

```bash
git add packages/shared-types/src/types/store.ts packages/shared-types/src/index.ts
git commit -m "feat: 门店类型新增 account、email、initialPassword、ResetStorePasswordResponse"
```

---

## Task 3: Error Codes — 新增门店相关错误码

**Files:**
- Modify: `apps/api/src/errorcode/stores.ts`

- [ ] **Step 1: 新增错误码**

在 `storeErrors` 对象中 `LOCATION_UPDATE_FAILED` 之后添加：

```typescript
ACCOUNT_REQUIRED: {
  code: 1310,
  message: '门店登录账号不能为空',
  httpStatus: 400,
} satisfies BizError,

ACCOUNT_EXISTS: {
  code: 1311,
  message: '该登录账号已被使用',
  httpStatus: 400,
} satisfies BizError,

RESET_PASSWORD_FAILED: {
  code: 1312,
  message: '重置密码失败',
  httpStatus: 500,
} satisfies BizError,
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/errorcode/stores.ts
git commit -m "feat: 门店错误码新增 ACCOUNT_REQUIRED、ACCOUNT_EXISTS、RESET_PASSWORD_FAILED"
```

---

## Task 4: API Routes — 更新门店创建、基础信息编辑、新增密码重置

**Files:**
- Modify: `apps/api/src/routes/stores.ts`

- [ ] **Step 1: 更新 import**

在 `stores.ts` 顶部 import 中添加：

```typescript
import { nanoid } from 'nanoid';
import { hashPassword } from '../utils/password.js';
```

在 shared-types import 中添加 `ResetStorePasswordResponse`：

```typescript
import type {
  ApiResponse,
  PaginatedData,
  Store,
  StoreQuery,
  CreateStoreInput,
  CreateStoreResponse,
  UpdateStoreInput,
  UpdateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  UpdateStoreBasicInfoRequest,
  UpdateStoreBasicInfoResponse,
  UpdateStoreLocationRequest,
  UpdateStoreLocationResponse,
  ResetStorePasswordResponse,
} from '@dextea/shared-types';
```

- [ ] **Step 2: 更新 POST /stores（创建门店）**

替换原有创建门店路由为：

```typescript
app.post<{
  Body: CreateStoreInput;
  Reply: ApiResponse<CreateStoreResponse>;
}>('/stores', async (request, reply) => {
  try {
    const db = await getDb();
    const { name, province, city, district, address, businessHours, phone, account, email } = request.body;

    if (!name) {
      throw new AppError(storeErrors.NAME_REQUIRED);
    }

    if (!account) {
      throw new AppError(storeErrors.ACCOUNT_REQUIRED);
    }

    // Check account uniqueness
    const existingStore = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.account, account))
      .limit(1);

    if (existingStore.length > 0) {
      throw new AppError(storeErrors.ACCOUNT_EXISTS);
    }

    // Auto-geocode from address
    const coords = await geocode(province, city, district, address);
    const longitude = coords?.longitude ?? 0;
    const latitude = coords?.latitude ?? 0;

    if (!coords) {
      request.log.warn({ address: [province, city, district, address].filter(Boolean).join('') }, 'Geocoding failed, using default coordinates');
    }

    // Generate random password
    const initialPassword = nanoid(12);
    const hashedPassword = await hashPassword(initialPassword);

    const result = await db.insert(storesTable).values({
      name,
      province: province ?? '',
      city: city ?? '',
      district: district ?? '',
      address: address ?? '',
      businessHours: businessHours ?? '',
      phone: phone ?? '',
      account,
      password: hashedPassword,
      email: email ?? '',
      longitude,
      latitude,
    });

    const insertId = Number(result[0]?.insertId ?? 0);

    // Store location in Redis for nearby search
    try {
      await request.server.redis.geoadd('dextea:store:location', longitude, latitude, String(insertId));
    } catch (redisError) {
      request.log.error(redisError, 'Failed to store location in Redis');
    }

    return {
      code: 0,
      data: { id: insertId, initialPassword },
      message: '创建成功',
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    request.log.error(error);
    throw new AppError(storeErrors.CREATE_FAILED);
  }
});
```

- [ ] **Step 3: 更新 PATCH /stores/:id/basic-info（支持 email）**

替换原有基础信息更新路由为：

```typescript
app.patch<{
  Params: { id: string };
  Body: UpdateStoreBasicInfoRequest;
  Reply: ApiResponse<UpdateStoreBasicInfoResponse>;
}>('/stores/:id/basic-info', async (request, reply) => {
  try {
    const db = await getDb();
    const id = parseInt(request.params.id, 10);
    const { name, phone, businessHours, email } = request.body;

    if (!name) {
      throw new AppError(storeErrors.NAME_REQUIRED);
    }

    const store = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, id))
      .limit(1);

    if (store.length === 0) {
      throw new AppError(storeErrors.STORE_NOT_FOUND);
    }

    await db
      .update(storesTable)
      .set({ name, phone, businessHours, email: email ?? '' })
      .where(eq(storesTable.id, id));

    return {
      code: 0,
      data: { id },
      message: '门店基础信息更新成功',
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    request.log.error(error);
    throw new AppError(storeErrors.BASIC_INFO_UPDATE_FAILED);
  }
});
```

- [ ] **Step 4: 新增 POST /stores/:id/reset-password（密码重置）**

在 `storeRoutes` 函数末尾（`status` 路由之后、函数闭合 `}` 之前）添加：

```typescript
/**
 * 重置门店密码
 * url：/api/v1/stores/:id/reset-password
 */
app.post<{
  Params: { id: string };
  Reply: ApiResponse<ResetStorePasswordResponse>;
}>('/stores/:id/reset-password', async (request, reply) => {
  try {
    const db = await getDb();
    const id = parseInt(request.params.id, 10);

    const store = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, id))
      .limit(1);

    if (store.length === 0) {
      throw new AppError(storeErrors.STORE_NOT_FOUND);
    }

    const newPassword = nanoid(12);
    const hashedPassword = await hashPassword(newPassword);

    await db
      .update(storesTable)
      .set({ password: hashedPassword })
      .where(eq(storesTable.id, id));

    return {
      code: 0,
      data: { newPassword },
      message: '密码重置成功',
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    request.log.error(error);
    throw new AppError(storeErrors.RESET_PASSWORD_FAILED);
  }
});
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/stores.ts
git commit -m "feat: 门店 API 支持登录账号创建、邮箱编辑、密码重置"
```

---

## Task 5: Web Service — 更新前端服务层

**Files:**
- Modify: `apps/web/src/services/store.ts`
- Modify: `apps/web/src/services/index.ts`

- [ ] **Step 1: 更新 store.ts**

```typescript
import type {
  Store,
  StoreStatus,
  ApiResponse,
  PaginatedData,
  CreateStoreInput,
  UpdateStoreInput,
  CreateStoreResponse,
  UpdateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  UpdateStoreBasicInfoRequest,
  UpdateStoreBasicInfoResponse,
  UpdateStoreLocationRequest,
  UpdateStoreLocationResponse,
  ResetStorePasswordResponse,
} from '@dextea/shared-types'
import { http } from './http'

/** GET /stores (paginated) */
export function getStores(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http
    .get<ApiResponse<PaginatedData<Store>>>('/stores', { params })
    .then((res) => res.data)
}

/** GET /stores/:id */
export function getStore(id: number) {
  return http
    .get<ApiResponse<Store>>(`/stores/${id}`)
    .then((res) => res.data)
}

/** POST /stores */
export function createStore(data: CreateStoreInput) {
  return http
    .post<ApiResponse<CreateStoreResponse>>('/stores', data)
    .then((res) => res.data)
}

/** PUT /stores/:id */
export function updateStore(id: number, data: UpdateStoreInput) {
  return http
    .put<ApiResponse<UpdateStoreResponse>>(`/stores/${id}`, data)
    .then((res) => res.data)
}

/** PATCH /stores/:id/status */
export function updateStoreStatus(id: number, data: UpdateStoreStatusRequest) {
  return http
    .patch<ApiResponse<UpdateStoreStatusResponse>>(`/stores/${id}/status`, data)
    .then((res) => res.data)
}

/** PATCH /stores/:id/basic-info */
export function updateStoreBasicInfo(id: number, data: UpdateStoreBasicInfoRequest) {
  return http
    .patch<ApiResponse<UpdateStoreBasicInfoResponse>>(`/stores/${id}/basic-info`, data)
    .then((res) => res.data)
}

/** PATCH /stores/:id/location */
export function updateStoreLocation(id: number, data: UpdateStoreLocationRequest) {
  return http
    .patch<ApiResponse<UpdateStoreLocationResponse>>(`/stores/${id}/location`, data)
    .then((res) => res.data)
}

/** POST /stores/:id/reset-password */
export function resetStorePassword(id: number) {
  return http
    .post<ApiResponse<ResetStorePasswordResponse>>(`/stores/${id}/reset-password`)
    .then((res) => res.data)
}

// Re-export types used by pages
export type { StoreStatus }
```

- [ ] **Step 2: 更新 services/index.ts 导出**

修改 `apps/web/src/services/index.ts` 第 6 行：

```typescript
export { getStores, getStore, createStore, updateStore, updateStoreStatus, updateStoreBasicInfo, updateStoreLocation, resetStorePassword } from './store'
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/store.ts apps/web/src/services/index.ts
git commit -m "feat: 前端服务层新增 resetStorePassword、更新 store 类型导入"
```

---

## Task 6: 前端 — 创建门店弹窗增加账号 + 邮箱字段，创建后显示密码

**Files:**
- Modify: `apps/web/src/pages/Stores/components/CreateStoreDialog.tsx`

- [ ] **Step 1: 重写 CreateStoreDialog**

完整替换文件内容：

```tsx
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { AreaSelector } from "@/components/area"
import type { AreaValue } from "@/components/area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { createStore } from "@/services"

interface CreateStoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateStoreDialog({ open, onOpenChange, onCreated }: CreateStoreDialogProps) {
  const [formName, setFormName] = useState("")
  const [formProvince, setFormProvince] = useState("")
  const [formCity, setFormCity] = useState("")
  const [formDistrict, setFormDistrict] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formBusinessHours, setFormBusinessHours] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formAccount, setFormAccount] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Password display state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [initialPassword, setInitialPassword] = useState("")

  useEffect(() => {
    if (!open) {
      setFormName("")
      setFormProvince("")
      setFormCity("")
      setFormDistrict("")
      setFormAddress("")
      setFormBusinessHours("")
      setFormPhone("")
      setFormAccount("")
      setFormEmail("")
    }
  }, [open])

  const handleAreaChange = useCallback((value: AreaValue) => {
    setFormProvince(value.province)
    setFormCity(value.city)
    setFormDistrict(value.district)
  }, [])

  const handleSubmit = async () => {
    if (!formName) {
      toast.error("门店名称不能为空")
      return
    }
    if (!formAccount) {
      toast.error("登录账号不能为空")
      return
    }

    setSubmitting(true)
    try {
      const res = await createStore({
        name: formName,
        province: formProvince,
        city: formCity,
        district: formDistrict,
        address: formAddress,
        businessHours: formBusinessHours,
        phone: formPhone,
        account: formAccount,
        email: formEmail,
      })
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        setInitialPassword(res.data.initialPassword)
        setPasswordDialogOpen(true)
        onCreated()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>创建门店</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="store-name">
                门店名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store-name"
                placeholder="请输入门店名称"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="store-account">
                登录账号 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store-account"
                placeholder="请输入登录账号（全局唯一）"
                value={formAccount}
                onChange={(e) => setFormAccount(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="store-email">
                邮箱
              </Label>
              <Input
                id="store-email"
                type="email"
                placeholder="请输入邮箱地址"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>省市区 <span className="text-destructive">*</span></Label>
              <AreaSelector key={open} onChange={handleAreaChange} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="store-address">
                具体地址 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store-address"
                placeholder="请输入具体地址"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="store-phone">
                  联系电话 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="store-phone"
                  placeholder="请输入联系电话"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="store-hours">
                  营业时间 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="store-hours"
                  placeholder="例如：09:00-22:00"
                  value={formBusinessHours}
                  onChange={(e) => setFormBusinessHours(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "提交中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initial Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>门店创建成功</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-4">
            <div className="rounded-lg border bg-muted px-6 py-3 font-mono text-lg tracking-widest">
              {initialPassword}
            </div>
            <p className="text-xs text-destructive font-medium">
              此密码仅显示一次，关闭后将不再显示
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setPasswordDialogOpen(false)}>
              我已保存，关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/Stores/components/CreateStoreDialog.tsx
git commit -m "feat: 创建门店弹窗新增账号+邮箱字段，创建后显示初始密码"
```

---

## Task 7: 前端 — 门店详情页增加账号展示、邮箱展示、密码重置按钮

**Files:**
- Modify: `apps/web/src/pages/Stores/detail.tsx`

- [ ] **Step 1: 更新 imports 和新增 state**

在 detail.tsx 顶部 import 中：
- 将 `PencilIcon` 改为同时导入 `KeyRoundIcon`（从 lucide-react）
- 新增 import `resetStorePassword` from `@/services`

```tsx
import { ArrowLeftIcon, Loader2Icon, PencilIcon, KeyRoundIcon } from "lucide-react"
```

```tsx
import { getStore, resetStorePassword } from "@/services"
```

在组件 state 中新增：

```tsx
const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
const [newPassword, setNewPassword] = useState("")
```

- [ ] **Step 2: 新增 handleResetPassword 方法**

在 `fetchStore` 函数之后添加：

```tsx
const handleResetPassword = async () => {
  if (!id) return
  try {
    const res = await resetStorePassword(Number(id))
    if (res.code === 0) {
      setNewPassword(res.data.newPassword)
      setPasswordDialogOpen(true)
      fetchStore()
    } else {
      toast.error(res.message)
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "重置密码失败")
  }
}
```

- [ ] **Step 3: 在基础信息卡片中添加账号、邮箱展示**

在 detail.tsx 的基础信息 CardContent 中，将 grid 内容改为：

```tsx
<CardContent>
  <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
    <span className="text-sm text-muted-foreground">门店名称</span>
    <span className="text-sm">{store.name}</span>

    <span className="text-sm text-muted-foreground">登录账号</span>
    <span className="text-sm font-mono">{store.account}</span>

    <span className="text-sm text-muted-foreground">邮箱</span>
    <span className="text-sm">{store.email || "-"}</span>

    <span className="text-sm text-muted-foreground">联系电话</span>
    <span className="text-sm">{store.phone || "-"}</span>

    <span className="text-sm text-muted-foreground">营业时间</span>
    <span className="text-sm">{store.businessHours || "-"}</span>
  </div>
</CardContent>
```

- [ ] **Step 4: 在基础信息卡片 CardHeader 中增加密码重置按钮**

在基础信息卡片的 `CardAction` 中，编辑按钮旁边添加密码重置按钮：

```tsx
<CardAction>
  <Button variant="ghost" size="sm" onClick={() => setBasicInfoDialogOpen(true)}>
    <PencilIcon data-icon="inline-start" />
    编辑
  </Button>
  <Button variant="ghost" size="sm" onClick={handleResetPassword}>
    <KeyRoundIcon data-icon="inline-start" />
    重置密码
  </Button>
</CardAction>
```

- [ ] **Step 5: 在页面底部添加密码重置结果弹窗**

在 `</ScrollArea>` 之后、 `{store && (` 之前添加密码弹窗：

```tsx
{/* Reset Password Dialog */}
<Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>密码重置成功</DialogTitle>
    </DialogHeader>

    <div className="flex flex-col items-center gap-3 py-4">
      <div className="rounded-lg border bg-muted px-6 py-3 font-mono text-lg tracking-widest">
        {newPassword}
      </div>
      <p className="text-xs text-destructive font-medium">
        此密码仅显示一次，关闭后将不再显示
      </p>
    </div>

    <DialogFooter>
      <Button onClick={() => setPasswordDialogOpen(false)}>
        我已保存，关闭
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

同时需要在顶部 import 中添加 Dialog 相关组件：

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/Stores/detail.tsx
git commit -m "feat: 门店详情页增加账号展示、邮箱展示、密码重置功能"
```

---

## Task 8: 前端 — 编辑基础信息弹窗增加 email 字段

**Files:**
- Modify: `apps/web/src/pages/Stores/components/EditBasicInfoDialog.tsx`

- [ ] **Step 1: 更新 EditBasicInfoDialog**

完整替换文件内容：

```tsx
import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { Store } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { updateStoreBasicInfo } from "@/services"

interface EditBasicInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: Store
  onUpdated: () => void
}

export function EditBasicInfoDialog({ open, onOpenChange, store, onUpdated }: EditBasicInfoDialogProps) {
  const [name, setName] = useState(store.name)
  const [phone, setPhone] = useState(store.phone)
  const [businessHours, setBusinessHours] = useState(store.businessHours)
  const [email, setEmail] = useState(store.email)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(store.name)
      setPhone(store.phone)
      setBusinessHours(store.businessHours)
      setEmail(store.email)
    }
  }, [open, store])

  const handleSubmit = async () => {
    if (!name) {
      toast.error("门店名称不能为空")
      return
    }

    setSubmitting(true)
    try {
      const res = await updateStoreBasicInfo(store.id, { name, phone, businessHours, email })
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        onUpdated()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("更新门店基础信息失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑基础信息</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-store-name">
              门店名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-store-name"
              placeholder="请输入门店名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-store-email">
              邮箱
            </Label>
            <Input
              id="edit-store-email"
              type="email"
              placeholder="请输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-store-phone">
                联系电话 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-store-phone"
                placeholder="请输入联系电话"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-store-hours">
                营业时间 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-store-hours"
                placeholder="例如：09:00-22:00"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "提交中..." : "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/Stores/components/EditBasicInfoDialog.tsx
git commit -m "feat: 编辑门店基础信息弹窗增加邮箱字段"
```

---

## Task 9: 验证

- [ ] **Step 1: Type-check**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 2: Build**

```bash
pnpm build
```

Expected: Build succeeds.
