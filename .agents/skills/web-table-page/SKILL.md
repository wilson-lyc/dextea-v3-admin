---
name: web-table-page
description: dextea-admin 前端表格页统一渲染规范。无论有无数据，表格组件始终渲染；空状态渲染在表格 TableBody 内（含 icon + 暂无数据 + 立即添加按钮）；有数据时分页组件才渲染。
---

# dextea-admin 前端表格页渲染规范

本 skill 定义了 dextea-admin 前端 Web 项目中表格页的统一渲染模式，覆盖标准表格、空状态、分页三部分的 JSX 结构。

## 核心规则

| 规则          | 说明                                                  |
| ----------- | --------------------------------------------------- |
| **表格始终渲染**  | `<Table>` 组件无条件渲染，不依赖 `loading` 或数据长度               |
| **空状态在表格内** | 空数据行（`Empty`）渲染在 `<TableBody>` 内部，而非替换表格            |
| **分页有条件渲染** | `<Pagination>` 仅在 `!loading && data.length > 0` 时渲染 |

## JSX 结构模板

```tsx
return (
  <div className="flex flex-col gap-4">
    {/* 顶部操作栏：左右布局，左侧放置操作按钮，右侧放置统计信息等 */}
    <div className="flex items-center justify-between">
      {/* 左侧：操作按钮 */}
      {/* 右侧：统计信息等 */}
    </div>

    {/* 表格区域（始终渲染） */}
    <ScrollArea className="max-h-[calc(100vh-480px)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>列名 A</TableHead>
            <TableHead className="w-28 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            // ── 加载态（Spinner 居中转动） ──
            <TableRow>
              <TableCell colSpan={N} className="h-48 text-center">
                <Spinner className="mx-auto size-6 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            // ── 空数据态 ──
            <TableRow>
              <TableCell colSpan={N} className="h-48 text-center">
                <Empty>
                  <EmptyMedia variant="icon">
                    <SomeIcon className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>暂无数据</EmptyTitle>
                  <Button onClick={() => setSomeOpen(true)}>
                    立即添加
                  </Button>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            // ── 数据行 ──
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right">
                  {/* 操作按钮组 */}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ScrollArea>

    {/* 分页（仅在有数据时显示） */}
    {!loading && data.length > 0 && (
      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                if (page > 1) fetchData(page - 1)
              }}
              text="上一页"
            />
          </PaginationItem>
          {(() => {
            const totalPages = Math.ceil(total / pageSize)
            const pages: (number | "...")[] = []
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i)
            } else {
              pages.push(1)
              if (page > 3) pages.push("...")
              for (
                let i = Math.max(2, page - 1);
                i <= Math.min(totalPages - 1, page + 1);
                i++
              ) {
                pages.push(i)
              }
              if (page < totalPages - 2) pages.push("...")
              pages.push(totalPages)
            }
            return pages.map((p, idx) =>
              p === "..." ? (
                <PaginationItem key={`e-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      fetchData(p)
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )
          })()}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                if (page < Math.ceil(total / pageSize)) fetchData(page + 1)
              }}
              text="下一页"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )}
  </div>
)
```

## 组件状态结构

每个表格页组件需要维护以下状态：

```typescript
const [data, setData] = useState<DataType[]>([])       // 列表数据
const [loading, setLoading] = useState(true)            // 加载状态
const [page, setPage] = useState(1)                     // 当前页
const [total, setTotal] = useState(0)                   // 总记录数
const pageSize = 20                                     // 每页条数（常量）
```

## 数据请求模式

```typescript
const fetchData = useCallback(async (targetPage: number) => {
  setLoading(true)
  try {
    const res = await someApi(params, { page: targetPage, pageSize })
    if (res.code === 0) {
      setData(res.data.items)
      setTotal(res.data.total)
      setPage(targetPage)
    } else {
      toast.error(res.message)
    }
  } catch {
    toast.error("获取数据失败")
  } finally {
    setLoading(false)
  }
}, [/* 依赖 */, pageSize])

useEffect(() => {
  fetchData(1)
}, [fetchData])
```

## 三态条件对照

| 状态  | 条件                                       | 渲染内容                             |
| --- | ---------------------------------------- | -------------------------------- |
| 加载中 | `loading === true`                       | 单行 `<Spinner>` 居中旋转             |
| 空数据 | `loading === false && data.length === 0` | `Empty` 组件（icon + 暂无数据 + 立即添加按钮） |
| 有数据 | `loading === false && data.length > 0`   | 数据行 + 分页组件                       |

## imports 模板

创建新表格页时默认导入以下模块：

```typescript
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
```

根据实际需要额外添加：

- `lucide-react` icons
- `@/services` 中对应的 API 函数

## 注意事项

- `colSpan` 必须等于 `TableHeader` 中 `TableHead` 的总列数
- 分页的智能省略号算法已在三个 Panel 中验证无误，直接复制使用即可
- 空状态的 `Button` 文本统一为 `"立即添加"`，icon 用 `EmptyMedia variant="icon"`
- `pageSize` 统一使用常量 `20`（无须放入 state）

