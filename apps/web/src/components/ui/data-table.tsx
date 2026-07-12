import { RotateCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
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
  /** Pagination configuration (if provided, renders PaginationBar at the bottom) */
  pagination?: PaginationConfig
  /** Icon shown in the empty state */
  emptyIcon?: React.ReactNode
  /** Text shown in the empty state */
  emptyText?: string
  /** Additional class name for the outer container */
  className?: string
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
  pagination,
  emptyIcon,
  emptyText = "暂无数据",
  className,
}: DataTableProps) {
  return (
    <div className={cn("flex h-full flex-col gap-4", className)}>
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          {toolbarLeft}
          {onRefresh && (
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

      {/* Table */}
      <div className="flex flex-1 flex-col overflow-auto rounded-lg border">
        <Table
          className={cn(
            (isEmpty || loading) && "flex-1",
          )}
        >
          {header}
          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={colSpan} className="h-96">
                  <div className="flex items-center justify-center">
                    <Spinner className="size-6 text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : isEmpty ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={colSpan} className="h-96">
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
          ) : body ? (
            <TableBody>
              {body}
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
