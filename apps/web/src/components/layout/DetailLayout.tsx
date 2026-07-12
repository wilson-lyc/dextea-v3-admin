import type { ReactNode } from "react"
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/** 详情页 Tab 配置项 */
export interface DetailTabItem {
  /** 与 URL hash 对应的稳定值 */
  value: string
  /** 界面展示文案 */
  label: string
}

interface DetailLayoutProps {
  /** 加载中：展示居中 Spinner */
  loading?: boolean
  /** 数据不存在：展示提示与返回按钮 */
  notFound?: boolean
  /** 不存在时的提示文案 */
  notFoundText?: string
  /** 面包屑导航内容（返回按钮由布局统一提供，无需传入） */
  breadcrumb?: ReactNode
  /** Tab 配置：传入后内容区自动渲染固定 TabsList + 与 URL hash 双向同步的 Tab 面板 */
  tabs?: DetailTabItem[]
  /** 默认选中的 Tab（空 hash 时生效），默认取 tabs 第一项 */
  defaultTab?: string
  /** 页面主体内容，通常为 Tab 面板 */
  children?: ReactNode
}

/**
 * 详情页 Tab 面板：封装 Tabs UI 与「Tab ↔ URL hash」双向同步逻辑。
 * - 初始化读取 window.location.hash 决定激活 Tab
 * - 监听 hashchange 支持浏览器前进/后退
 * - 切换 Tab 时通过 history.replaceState 更新 hash
 * - 默认 Tab 的 hash 为空（与 Menus/detail.tsx 行为一致）
 *
 * 用法一（配合 DetailLayout）：将 <TabsContent> 作为 children 传入，
 * 并通过 DetailLayout 的 `tabs` 属性声明标签。
 * 用法二（独立使用，页面有自定义布局时）：直接渲染 <DetailTabs>，
 * 将 <TabsContent> 作为 children 传入。
 */
export function DetailTabs({
  tabs,
  defaultValue,
  className,
  children,
}: {
  tabs: DetailTabItem[]
  /** 默认选中的 Tab（空 hash 时生效），默认取 tabs 第一项 */
  defaultValue?: string
  /** 覆盖 Tabs 容器 className，默认 flex flex-1 min-h-0 flex-col */
  className?: string
  children: ReactNode
}) {
  const tabValues = useMemo(() => tabs.map((t) => t.value), [tabs])
  const defaultTab = defaultValue ?? tabValues[0] ?? ""

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace("#", "")
    return tabValues.includes(hash) ? hash : defaultTab
  })

  // 浏览器前进/后退时同步 Tab
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      if (tabValues.includes(hash)) {
        setActiveTab(hash)
      }
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [tabValues])

  // 切换 Tab 时同步 hash
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value)
      const newHash = value === defaultTab ? "" : value
      window.history.replaceState(
        null,
        "",
        newHash ? `#${newHash}` : window.location.pathname,
      )
    },
    [defaultTab, tabValues],
  )

  // 在每个 TabsContent 底部追加一个与 p-6 等高（1.5rem）的占位块，
  // 让滚动内容底部留白，避免贴底。
  const tabChildren = useMemo(
    () =>
      Children.map(children, (child) => {
        if (!isValidElement(child) || child.type !== TabsContent) {
          return child
        }
        const content = (child.props as { children?: ReactNode }).children
        return cloneElement(child, undefined, content, (
          <div key="tab-content-bottom-spacer" className="h-6 shrink-0" />
        ))
      }),
    [children],
  )

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className={className ?? "flex flex-1 min-h-0 flex-col"}
    >
      <TabsList variant="line">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabChildren}
    </Tabs>
  )
}

/**
 * 详情页统一布局。参考 Menus/detail.tsx 的 CSS 设计：
 * - 根容器：h-full p-6 flex flex-col gap-3
 * - 顶栏：返回按钮 + 面包屑（不参与滚动）
 * - 内容区：传入 `tabs` 时自动渲染固定 TabsList + 滚动 TabsContent；
 *   否则直接渲染 children（如 ScrollArea 包裹的内容）
 */
export default function DetailLayout({
  loading,
  notFound,
  notFoundText = "内容不存在",
  breadcrumb,
  tabs,
  defaultTab,
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
    <div className="h-full p-6 pt-6 pb-0 flex flex-col gap-1">
      {breadcrumb && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeftIcon data-icon="inline-start" />
            返回
          </Button>
          {breadcrumb}
        </div>
      )}

      {tabs ? (
        <DetailTabs tabs={tabs} defaultValue={defaultTab}>
          {children}
        </DetailTabs>
      ) : (
        children
      )}
    </div>
  )
}
