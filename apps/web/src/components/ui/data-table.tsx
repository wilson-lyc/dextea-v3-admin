import * as React from "react"
import { RotateCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import PaginationBar from "@/components/ui/pagination-bar"
import { cn } from "@/lib/utils"

interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

interface DataTableProps {
  /** Content placed on the left side of the toolbar, before the refresh button */
  toolbarLeft?: React.ReactNode
  /** Content placed on the right side of the toolbar */
  toolbarRight?: React.ReactNode
  /** The <TableHeader> element containing column definitions (always rendered, sticky) */
  header: React.ReactNode
  /** The <TableRow> elements for data rows (only rendered when not loading and not empty) */
  body?: React.ReactNode
  /** Whether the table is in loading state */
  loading?: boolean
  /** Whether the table has no data (empty state) */
  isEmpty?: boolean
  /** The number of columns, used as colSpan for loading/empty placeholder rows */
  colSpan?: number
  /** Refresh callback — called when the refresh button is clicked */
  onRefresh?: () => void
  /** Whether the refresh button should be disabled */
  refreshDisabled?: boolean
  /** Whether the refresh button should be hidden (default: false, i.e. visible) */
  hideRefresh?: boolean
  /** Whether the toolbar (the bar above the table holding toolbarLeft/toolbarRight/refresh) should be hidden. When true the whole bar is removed, leaving no placeholder height (default: false, i.e. visible) */
  hideToolbar?: boolean
  /** Pagination configuration (if provided, renders PaginationBar at the bottom) */
  pagination?: PaginationConfig
  /** Icon shown in the empty state */
  emptyIcon?: React.ReactNode
  /** Text shown in the empty state */
  emptyText?: string
  /** Additional class name for the outer container */
  className?: string
  /** Use fixed table layout so column widths are strictly honored (set via <TableHead> widths) */
  fixedLayout?: boolean
  /** 开启行选择（复选框）能力：自动渲染表头「全选」列与每行的复选框单元 */
  showSelection?: boolean
  /** 当前选中的行 id 集合（受控） */
  selectedIds?: Set<number> | number[]
  /** 从行元素中提取 id；缺省时读取行上的 data-id 属性 */
  getRowId?: (row: React.ReactElement) => number
  /** 选择变化回调，返回最新的选中 id 集合 */
  onSelectionChange?: (ids: Set<number>) => void
}

/**
 * 通用三态表格组件
 *
 * 封装了列表页常见的「操作栏 + 表格（loading/empty/数据三态）+ 分页」布局模式。
 * 本身不负责数据获取，所有交互通过回调通知外部。
 *
 * @example
 * ```tsx
 * <DataTable
 *   toolbarLeft={<Button>新建菜单</Button>}
 *   toolbarRight={<SearchInput />}
 *   header={(
 *     <TableHeader className="sticky top-0 z-50 bg-background">
 *       <TableRow>
 *         <TableHead>名称</TableHead>
 *         <TableHead className="text-right">操作</TableHead>
 *       </TableRow>
 *     </TableHeader>
 *   )}
 *   body={items.map(item => (
 *     <TableRow key={item.id}>
 *       <TableCell>{item.name}</TableCell>
 *       <TableCell className="text-right">
 *         <Button variant="outline" size="sm">管理</Button>
 *       </TableCell>
 *     </TableRow>
 *   ))}
 *   loading={loading}
 *   isEmpty={items.length === 0}
 *   colSpan={2}
 *   onRefresh={handleRefresh}
 *   pagination={{ page, pageSize, total, onPageChange: fetchData }}
 * />
 * ```
 */
export default function DataTable({
  toolbarLeft,
  toolbarRight,
  header,
  body,
  loading = false,
  isEmpty = false,
  colSpan = 1,
  onRefresh,
  refreshDisabled = false,
  hideRefresh = false,
  hideToolbar = false,
  pagination,
  emptyIcon,
  emptyText = "暂无数据",
  className,
  fixedLayout = false,
  showSelection,
  selectedIds,
  getRowId,
  onSelectionChange,
}: DataTableProps) {
  const selectionEnabled = !!showSelection

  const selectedSet = React.useMemo(
    () =>
      new Set(
        Array.isArray(selectedIds)
          ? (selectedIds as number[])
          : ((selectedIds as Set<number> | undefined) ?? []),
      ),
    [selectedIds],
  )

  const visibleRowIds = React.useMemo(() => {
    if (!selectionEnabled || !body) return []
    const ids: number[] = []
    React.Children.forEach(body, (child) => {
      if (!React.isValidElement(child)) return
      const el = child as React.ReactElement
      const id = getRowId
        ? getRowId(el)
        : Number((el.props as Record<string, unknown>)["data-id"])
      if (Number.isFinite(id)) ids.push(id)
    })
    return ids
  }, [selectionEnabled, body, getRowId])

  const allChecked =
    visibleRowIds.length > 0 && visibleRowIds.every((id) => selectedSet.has(id))
  const someChecked = visibleRowIds.some((id) => selectedSet.has(id))

  const handleToggleRow = React.useCallback(
    (id: number) => {
      if (!onSelectionChange) return
      const next = new Set(selectedSet)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      onSelectionChange(next)
    },
    [selectedSet, onSelectionChange],
  )

  const handleToggleAll = React.useCallback(
    (checked: boolean) => {
      if (!onSelectionChange) return
      const next = new Set(selectedSet)
      if (checked) visibleRowIds.forEach((id) => next.add(id))
      else visibleRowIds.forEach((id) => next.delete(id))
      onSelectionChange(next)
    },
    [selectedSet, visibleRowIds, onSelectionChange],
  )

  const renderedHeader =
    selectionEnabled && header
      ? (() => {
          const headerEl = header as React.ReactElement
          const rowEl = headerEl.props.children as React.ReactElement
          const originalHeads = React.Children.toArray(rowEl.props.children)
          return React.cloneElement(
            headerEl,
            {},
            React.cloneElement(
              rowEl,
              {},
              <TableHead key="__selection_head" className="w-10">
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked && !allChecked}
                  onCheckedChange={(v) => handleToggleAll(v === true)}
                  aria-label="全选"
                />
              </TableHead>,
              ...originalHeads,
            ),
          )
        })()
      : header

  const renderedBody =
    selectionEnabled && body
      ? React.Children.map(body, (child) => {
          if (!React.isValidElement(child)) return child
          const el = child as React.ReactElement
          const id = getRowId
            ? getRowId(el)
            : Number((el.props as Record<string, unknown>)["data-id"])
          const originalCells = React.Children.toArray(el.props.children)
          return React.cloneElement(
            el,
            {},
            <TableCell key="__selection_cell" className="w-10">
              <Checkbox
                checked={selectedSet.has(id)}
                onCheckedChange={() => handleToggleRow(id)}
                aria-label="选择"
              />
            </TableCell>,
            ...originalCells,
          )
        })
      : body

  const effectiveColSpan = colSpan + (selectionEnabled ? 1 : 0)

  return (
    <div className={cn("flex h-full flex-col gap-4", className)}>
      {/* Toolbar */}
      {!hideToolbar && (
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          {toolbarLeft}
          {!hideRefresh && onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={refreshDisabled}
            >
              <RotateCwIcon className="size-4" />
            </Button>
          )}
        </div>
        {toolbarRight && (
          <div className="flex items-center gap-2">
            {toolbarRight}
          </div>
        )}
      </div>
      )}

      {/* Table */}
      <div className="flex flex-1 flex-col overflow-auto rounded-lg border">
        <Table
          className={cn(
            (isEmpty || loading) && "flex-1",
            fixedLayout && "table-fixed",
          )}
        >
          {renderedHeader}
          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={effectiveColSpan} className="h-96">
                  <div className="flex items-center justify-center">
                    <Spinner className="size-6 text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : isEmpty ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={effectiveColSpan} className="h-96">
                  <div className="flex items-center justify-center">
                    <Empty>
                      <EmptyMedia variant="icon">
                        {emptyIcon}
                      </EmptyMedia>
                      <EmptyTitle>{emptyText}</EmptyTitle>
                    </Empty>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : renderedBody ? (
            <TableBody>
              {renderedBody}
            </TableBody>
          ) : null}
        </Table>
      </div>

      {/* Pagination */}
      {pagination && !loading && !isEmpty && (
        <PaginationBar
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
          className="shrink-0 justify-end"
        />
      )}
    </div>
  )
}
