import {
  Pagination,
  PaginationContent,
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

/** 通用分页组件：接收 total/pageSize 自动计算总页数，完整展示所有页码。 */
export default function PaginationBar({ page, pageSize, total, onPageChange, className }: PaginationBarProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 0) return null

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
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
        ))}
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
