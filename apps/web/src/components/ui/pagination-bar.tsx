import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PaginationBarProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
}

/** 通用分页组件：接收 total/pageSize 自动计算总页数，封装页码列表与翻页按钮。 */
export default function PaginationBar({ page, pageSize, total, onPageChange, className }: PaginationBarProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 0) return null

  // 生成带省略号的页码列表
  const getPageNumbers = (current: number, total: number): (number | "...")[] => {
    const pages: (number | "...")[] = []
    if (total <= 6) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      if (current > 3) pages.push("...")
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i)
      }
      if (current < total - 2) pages.push("...")
      pages.push(total)
    }
    return pages
  }

  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <Pagination className={className ?? "justify-end"}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text="上一页"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault()
              if (page > 1) onPageChange(page - 1)
            }}
          />
        </PaginationItem>
        {pageNumbers.map((p, idx) =>
          p === "..." ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  onPageChange(p)
                }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            text="下一页"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault()
              if (page < totalPages) onPageChange(page + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
