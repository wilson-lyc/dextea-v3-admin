---
name: table-specifications
description: 当在列表页中创建或编辑表格时使用本 skill 约束代码框架、统一样式与事件。管理表格区域和分页组件的代码结构、三态渲染。
---

# 列表页表格组件的实现规范

本 skill 定义 dextea-admin 前端 Web 项目中列表页的实现规范，覆盖顶部操作栏、表格三态渲染、分页、列宽样式等模式。页面中其他区域（弹窗、详情等）不在本技能职责范围。

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
  → @dextea/shared-types (type only)
  → @/components/ui/* (Table, Pagination, Spinner, Empty)
  → @/services

export default function Page()
  // Table State
  // Data Fetching
  // Render: Table + Pagination
```

### 2.1 Table State

```typescript
const [items, setItems] = useState<EntityType[]>([])
const [loading, setLoading] = useState(true)
const [page, setPage] = useState(1)
const [total, setTotal] = useState(0)
const pageSize = 20
```

**规则**：
- `pageSize = 20` 是常量，不放入 state

### 2.2 Data Fetching

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

---

## 3. Render

```
Page Container (flex h-full flex-col gap-4 p-6)
├── Top Bar (flex shrink-0 items-center justify-between)
│   └── Actions (flex items-center gap-2)
├── Table Container (flex flex-1 flex-col overflow-auto rounded-lg border)
│   └── Table
│       ├── TableHeader (sticky top-0 bg-background)
│       └── TableBody (三态互斥渲染: loading/empty/数据行)
└── Pagination (数据非空时渲染, 样式: shrink-0, justify-end)
```

### 3.1 顶部操作栏

```tsx
<div className="flex shrink-0 items-center justify-between">
  <div className="flex items-center gap-2">
    <Button onClick={() => setDialogOpen(true)}>
      <PlusIcon data-icon="inline-start" />
      新建{EntityName}
    </Button>
    <Button
      variant="outline"
      size="icon"
      onClick={() => { setLoading(true); setTimeout(() => fetchData(page), 1000) }}
    >
      <RotateCwIcon className="size-4" />
    </Button>
  </div>
</div>
```

**规则**：
- 刷新按钮点击后先设置 `loading=true` 显示加载状态，延迟 1 秒后才发起请求
- 使用 `setTimeout(() => fetchData(page), 1000)` 实现强制等待

### 3.2 表格和三态渲染逻辑

详细代码模板如下:
```tsx
<div className="flex flex-1 flex-col overflow-auto rounded-lg border">
        <Table className={`base-class ${(items.length === 0 || loading) && 'flex-1'}`}>
    <TableHeader>
      <TableRow className="sticky top-0 bg-background">
        <TableHead className="w-24">xxID</TableHead>
        {/* 按需求配置更多列... */}
        <TableHead className="w-36 text-right">操作</TableHead>
      </TableRow>
    </TableHeader>
    {loading ? (
      <TableBody>
        <TableRow>
          <TableCell colSpan={5} className="h-96">
            <div className="flex items-center justify-center">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    ) : items.length === 0 ? (
      <TableBody>
        <TableRow>
          <TableCell colSpan={5} className="h-96">
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
            <TableCell className="font-mono text-xs">{item.id}</TableCell>
            {/* 按需求配置更多列... */}
            <TableCell className="text-right">
              {/* 按需求配置 */}
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
- `<TableHeader>` 添加 `sticky top-0 bg-background` 实现滚动固定表头
- loading/empty 状态使用单独的 `<TableBody>` 包裹，`<TableCell colSpan={5} className="h-96">` 确保高度一致
- 三种状态互斥渲染，使用三元运算符确保只渲染其中一种：loading → empty → 数据
- ID 列使用 `font-mono text-xs` 样式

### 3.3 分页

```tsx
{items.length > 0 && (() => {
  const totalPages = Math.ceil(total / pageSize)
  const pages: (number | "...")[] = []
  if (totalPages <= 6) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("...")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }
  return (
    <Pagination className="shrink-0 justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text="上一页"
            onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) fetchData(page - 1) }}
          />
        </PaginationItem>
        {pages.map((p, idx) =>
          p === "..." ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e: React.MouseEvent) => { e.preventDefault(); fetchData(p) }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            text="下一页"
            onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < totalPages) fetchData(page + 1) }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
})()}
```
**规则**:
- 分页组件仅在数据非空时渲染（`items.length > 0 && (...)`）
- 使用 IIFE 内联计算页码数组
- 页码按钮最多显示 6 个，超出时用 `"..."` 省略

---

## 4. 导入模板

```typescript
import { useCallback, useEffect, useState } from "react"
import { PlusIcon, ClipboardListIcon, RotateCwIcon } from "lucide-react"
import { toast } from "sonner"

import type { EntityType } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { getXxxList } from "@/services"
```
---

## 5. 实现 checklist

- [ ] 页面组件中定义 table state（items/loading/page/total）
- [ ] 实现 `fetchData`（useCallback + useEffect）
- [ ] Render 顶部操作栏（新建按钮 + 刷新按钮）
- [ ] Render 表格容器（三态渲染）
- [ ] Render 分页（数据非空时显示）
