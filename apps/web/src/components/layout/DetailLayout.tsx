import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface DetailLayoutProps {
  /** 加载中：展示居中 Spinner */
  loading?: boolean
  /** 数据不存在：展示提示与返回按钮 */
  notFound?: boolean
  /** 不存在时的提示文案 */
  notFoundText?: string
  /** 面包屑导航内容（返回按钮由布局统一提供，无需传入） */
  breadcrumb?: ReactNode
  /** 页面主体内容，通常为 Tab 面板 */
  children?: ReactNode
}

/**
 * 详情页统一布局。参考 Menus/detail.tsx 的 CSS 设计：
 * - 根容器：h-full p-6 flex flex-col gap-3
 * - 顶栏：返回按钮 + 面包屑（不参与滚动）
 * - 内容区：由 children 提供，通常为固定 TabsList + 滚动 TabsContent
 */
export default function DetailLayout({
  loading,
  notFound,
  notFoundText = "内容不存在",
  breadcrumb,
  children,
}: DetailLayoutProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{notFoundText}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full p-6 flex flex-col gap-3">
      {breadcrumb && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeftIcon data-icon="inline-start" />
            返回
          </Button>
          {breadcrumb}
        </div>
      )}

      {children}
    </div>
  )
}
