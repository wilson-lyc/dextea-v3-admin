---
name: table-specifications
description: 当在列表页中创建或编辑表格时使用本 skill 约束代码框架、统一样式与事件。管理表格区域和分页组件的代码结构、三态渲染。
---

# 列表页表格组件的实现规范

本 skill 定义 dextea-admin 前端 Web 项目中表格区域和分页组件的实现规范，覆盖表格三态渲染、分页、列宽样式等模式。页面中其他区域（顶部操作栏、弹窗等）不在本技能职责范围。

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
Table Container (flex flex-1 flex-col overflow-auto rounded-lg border)
├── Table (始终渲染)
│   ├── TableHeader (始终渲染, 样式: sticky top-0 bg-background)
│   └── TableBody (数据非空时, 内部渲染TableRow展示数据)
├── Loading (Loading态时渲染, 样式: flex flex-1 居中)
└── Empty (数据为空时渲染, 样式: flex flex-1 居中)
Pagination (数据非空时渲染, 样式: shrink-0, justify-end)
```

### 3.1 表格和三态渲染逻辑

详细代码模板如下: 
```tsx
<div className="flex flex-1 flex-col overflow-auto rounded-lg border">
  <Table>
    <TableHeader>
      <TableRow className="sticky top-0 bg-background">
        <TableHead className="w-24">xxID</TableHead>
        {/* 按需求配置更多列... */}
        <TableHead className="w-36 text-right">操作</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.id}</TableCell>
          {/* 按需求配置更多列... */}
          <TableCell className="text-right">
            {/* 按需求配置 */}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>

  {loading ? (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  ) : items.length === 0 ? (
    <div className="flex flex-1 items-center justify-center">
      <Empty>
        <EmptyMedia variant="icon">
          <ClipboardListIcon className="size-4" />
        </EmptyMedia>
        <EmptyTitle>暂无数据</EmptyTitle>
      </Empty>
    </div>
  ) : null}
</div>
```

**三态规则**：

| 状态 | TableBody | 表格下方 |
|------|-----------|----------|
| `loading === true` | 空 | `flex-1` 居中 `Spinner` |
| `items.length === 0` | 空 | `flex-1` 居中 `Empty` 组件 |
| 正常数据 | `items.map(item => <TableRow>)` | 空 |

**说明**：
- `<Table>` 始终渲染，header 的 `<TableRow>` 加 `sticky top-0 bg-background` 实现滚动固定表头
- `<TableBody>` 只在 data 态有子元素；loading/empty 态 body 为空
- loading/empty 态渲染在 `<Table>` 下方，`flex-1` 撑满容器剩余高度
- 表格容器 `flex flex-col overflow-auto`，数据超过容器高度时自动出现滚动条
- Sticky header 确保滚动时列名始终可见

### 3.2 分页

```tsx
const totalPages = Math.ceil(total / pageSize)

function getPageNumbers(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  if (page <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages]
  }
  if (page >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages]
}

<Pagination className="shrink-0 justify-end">
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious
        text="上一页"
        href="#"
        onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) fetchData(page - 1) }}
      />
    </PaginationItem>
    {getPageNumbers(page, totalPages).map((p, idx) => (
      <PaginationItem key={p === 'ellipsis' ? `ellipsis-${idx}` : p}>
        {p === 'ellipsis' ? (
          <PaginationEllipsis />
        ) : (
          <PaginationLink
            href="#"
            isActive={p === page}
            onClick={(e: React.MouseEvent) => { e.preventDefault(); fetchData(p) }}
          >
            {p}
          </PaginationLink>
        )}
      </PaginationItem>
    ))}
    <PaginationItem>
      <PaginationNext
        text="下一页"
        href="#"
        onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < totalPages) fetchData(page + 1) }}
      />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```
**规则**:
- 分页组件仅在数据非空时渲染。
- 页码按钮最多显示 6 个，超出时用 `<PaginationEllipsis />` 省略。

---

## 4. 导入模板

```typescript
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import type { EntityType } from "@dextea/shared-types"
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
- [ ] Render 表格容器（三态渲染）+ 分页
