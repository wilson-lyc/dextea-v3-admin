---
name: table-specifications
description: 当在列表页中创建或编辑表格时使用本 skill 约束代码框架、统一样式与事件。管理表格区域和分页组件的代码结构、三态渲染。
---

# 列表页表格组件的实现规范

本 skill 定义 dextea-admin 前端 Web 项目中列表页的实现规范，覆盖顶部操作栏、表格三态渲染、分页、列宽样式等模式。页面中其他区域（弹窗、详情等）不在本技能职责范围。

> **注意**：本技能仅提供实现方案的规范和模板，并非所有表格都必须完全照搬。勾选列、批量删除、确认弹窗等功能属于**可选**，按业务需求取舍即可。

---

## 1. 文件结构

```
pages/{EntityName}/
└── index.tsx
```

---

## 2. 代码整体结构

```
imports
  → react
  → react-router-dom (useNavigate, 如需要)
  → @dextea/shared-types (type only)
  → @/components/ui/* (Table, Button, Checkbox, Spinner, Empty, PaginationBar, confirm-dialog)
  → @/services

export default function Page()
  // 列表数据与分页状态
  // UI 状态 (loading, selectedIds)
  // 对话框状态 (按需分组，如 createDialogOpen, deleteDialogOpen)
  // 数据获取 (useCallback + useEffect)
  // 勾选/全选逻辑 (如需要)
  // 操作处理函数
  // Render: TopBar + Table + Pagination + Dialogs
```

### 2.1 State 声明规范

使用分组注释清晰划分不同职责的状态变量，按以下顺序声明：

```typescript
// 列表数据与分页状态
const [items, setItems] = useState<EntityType[]>([])
const [total, setTotal] = useState(0)
const [page, setPage] = useState(1)
const pageSize = 20

// UI 状态
const [loading, setLoading] = useState(true)
const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

// 新建对话框状态 (按需)
const [createDialogOpen, setCreateDialogOpen] = useState(false)

// 删除确认弹窗状态 (按需)
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
const [deleting, setDeleting] = useState(false)
const [deleteError, setDeleteError] = useState<string | null>(null)
```

**规则**：
- `pageSize = 20` 是常量，不放入 state
- 不同用途的状态用注释分组，每组前空一行
- 变量名语义化：`createDialogOpen` 而非 `dialogOpen`，`deleteDialogOpen` 而非 `confirmDialogOpen`

### 2.2 数据获取

```typescript
const fetchData = useCallback(async (targetPage: number) => {
  setLoading(true)
  try {
    const params = { page: targetPage, pageSize }
    const res = await someApi(params)
    if (res.code === 0) {
      setItems(res.data.items)
      setTotal(res.data.total)
      setPage(targetPage)
      setSelectedIds(new Set())   // 切换页面时清空选中
    } else {
      toast.error(res.message)
    }
  } catch (err) {
    console.error(err)
    toast.error("数据加载异常")
  } finally {
    setLoading(false)
  }
}, [pageSize])

useEffect(() => {
  fetchData(1)
}, [fetchData])
```

**规则**：
- 业务错误（`res.code !== 0`）→ `toast.error(res.message)`
- 未知异常（catch）→ `console.error(err)` + `toast.error("数据加载异常")`
- 数据获取成功后应当调用 `setSelectedIds(new Set())` 清空勾选状态
- 翻页、搜索、刷新后都需要重新调用 `fetchData(page)`

### 2.3 勾选与全选 (按需)

```typescript
// 勾选/取消勾选单个
const toggleSelect = (id: number) => {
  setSelectedIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectedIds.size === items.length) {
    setSelectedIds(new Set())
  } else {
    setSelectedIds(new Set(items.map((item) => item.id)))
  }
}

const allSelected = items.length > 0 && selectedIds.size === items.length
```

---

## 3. Render

```
Page Container (flex h-full flex-col gap-4 p-6)
├── Top Bar (flex shrink-0 items-center justify-between)
│   └── Actions (flex items-center gap-2)
│       ├── 新建按钮
│       ├── 批量操作按钮 (selectedIds.size > 0 时显示)
│       └── 刷新按钮 (variant="outline" size="icon")
├── Table Container (flex flex-1 flex-col overflow-auto rounded-lg border)
│   └── Table
│       ├── TableHeader (sticky top-0 z-50 bg-background)
│       └── TableBody (三态互斥渲染: loading/empty/数据行)
└── PaginationBar (数据非空时渲染, 样式: shrink-0 justify-end)
```

### 3.1 顶部操作栏

```tsx
<div className="flex shrink-0 items-center justify-between">
  <div className="flex items-center gap-2">
    <Button onClick={() => setCreateDialogOpen(true)}>
      <PlusIcon data-icon="inline-start" />
      新建{EntityName}
    </Button>
    {selectedIds.size > 0 && (
      <Button variant="destructive" onClick={() => { setDeleteError(null); setDeleteDialogOpen(true) }}>
        <Trash2Icon data-icon="inline-start" />
        删除选中 ({selectedIds.size})
      </Button>
    )}
    <Button variant="outline" size="icon" onClick={() => { setLoading(true); setTimeout(() => fetchData(page), 1000) }}>
      <RotateCwIcon className="size-4" />
    </Button>
  </div>
</div>
```

**规则**：
- 刷新按钮点击后先设置 `loading=true` 显示加载状态，延迟 1 秒后才发起请求
- 使用 `setTimeout(() => fetchData(page), 1000)` 实现强制等待
- 批量操作按钮仅在 `selectedIds.size > 0` 时渲染
- 顶部操作栏使用 `shrink-0` 防止被压缩

### 3.2 表格和三态渲染逻辑

```tsx
<div className="flex flex-1 flex-col overflow-auto rounded-lg border">
  <Table className={`base-class ${(items.length === 0 || loading) && 'flex-1'}`}>
    <TableHeader className="sticky top-0 z-50 bg-background">
      <TableRow>
        {selectedIds !== undefined && (
          <TableHead className="w-10">
            <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
          </TableHead>
        )}
        <TableHead className="w-24">XXID</TableHead>
        {/* 按需求配置更多列... */}
        <TableHead className="w-36 text-right">操作</TableHead>
      </TableRow>
    </TableHeader>
    {loading ? (
      <TableBody>
        <TableRow>
          <TableCell colSpan={7} className="h-96">
            <div className="flex items-center justify-center">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    ) : items.length === 0 ? (
      <TableBody>
        <TableRow>
          <TableCell colSpan={7} className="h-96">
            <div className="flex items-center justify-center">
              <Empty>
                <EmptyMedia variant="icon">
                  <ClipboardListIcon className="size-4" />
                </EmptyMedia>
                <EmptyTitle>暂无数据</EmptyTitle>
              </Empty>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    ) : (
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            {selectedIds !== undefined && (
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={() => toggleSelect(item.id)}
                />
              </TableCell>
            )}
            <TableCell className="font-mono text-xs">{item.id}</TableCell>
            {/* 按需求配置更多列... */}
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                {/* 管理/编辑按钮 */}
                {/* 删除按钮 */}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    )}
  </Table>
</div>
```

**三态规则**：

| 状态 | TableBody 内容 |
|------|----------------|
| `loading === true` | `flex-1` 居中 `Spinner` |
| `items.length === 0` | `flex-1` 居中 `Empty` 组件 |
| 正常数据 | `items.map(item => <TableRow>)` |

**说明**：
- 外层 `<div className="flex flex-1 flex-col overflow-auto rounded-lg border">` 作为滚动容器
- `<TableHeader>` 添加 `sticky top-0 z-50 bg-background` 实现滚动固定表头
- loading/empty 状态使用单独的 `<TableBody>` 包裹，`<TableCell colSpan={7} className="h-96">` 确保高度一致
- 三种状态互斥渲染，使用三元运算符确保只渲染其中一种：loading → empty → 数据
- ID 列使用 `font-mono text-xs` 样式
- 操作列使用 `text-right` 对齐，内部使用 `<div className="flex items-center justify-end gap-1">` 包裹多个按钮
- Checkbox 列宽度 `w-10`

### 3.3 分页

```tsx
{items.length > 0 && (
  <PaginationBar
    page={page}
    pageSize={pageSize}
    total={total}
    onPageChange={fetchData}
    className="shrink-0 justify-end"
  />
)}
```

**规则**:
- 分页组件仅在数据非空时渲染（`items.length > 0 && (...)`）
- 传入 `total`、`pageSize`、`page` 和 `onPageChange` 回调，组件自动计算总页数和页码列表
- 不可使用 `@/components/ui/pagination` 原始组件组合，始终使用 `PaginationBar` 封装组件
- 分页容器使用 `shrink-0` 防止被压缩

---

## 4. 删除确认弹窗 (按需)

```tsx
{/* 删除确认弹窗 */}
<ConfirmDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  title="确认删除"
  description={
    <>
      确定要删除选中的 <span className="font-semibold text-foreground">{selectedIds.size}</span> 个{EntityName}吗？
    </>
  }
  confirmText="删除"
  variant="destructive"
  loading={deleting}
  errorMessage={deleteError}
  onConfirm={handleDeleteConfirm}
/>
```

---

## 5. 导入模板

```typescript
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PlusIcon, Trash2Icon, RotateCwIcon, ClipboardListIcon } from "lucide-react"
import { toast } from "sonner"

import type { EntityType } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import PaginationBar from "@/components/ui/pagination-bar"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { getXxxList, batchDeleteXxx } from "@/services"
```

---

## 实现 checklist

按业务需求从以下项中选择适用的：

- [ ] 页面组件中定义 table state（items/loading/page/total），用分组注释归类
- [ ] 实现 `fetchData`（useCallback + useEffect），获取成功后清空 `selectedIds`（如无勾选列可跳过）
- [ ] Render 顶部操作栏（新建按钮 + 可选批量操作按钮 + 刷新按钮）
- [ ] Render 表格容器（三态渲染 + 可选 Checkbox 勾选列）
- [ ] Render 分页（PaginationBar，数据非空时显示）
- [ ] 如需要删除功能，Render 删除确认弹窗（ConfirmDialog）
- [ ] 操作列按钮使用 `flex items-center justify-end gap-1` 包裹

---

## 7. 注释规范

- 在关键逻辑和区块分界处适当加入注释，提升代码可读性
- 注释使用纯文本描述，禁止使用 `---`、`===`、`***`、`+++` 等装饰性符号
- JSX 区块注释使用 `{/* 描述 */}`，代码逻辑注释使用 `// 描述`
- State 声明用分组注释（`// 列表数据与分页状态`、`// UI 状态` 等）
