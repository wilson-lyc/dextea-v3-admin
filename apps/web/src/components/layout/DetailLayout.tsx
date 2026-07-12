import type { ReactElement, ReactNode } from "react"
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/** 详情页 Tab 配置项 */
export interface DetailTabItem {
  /** 与 URL hash 对应的稳定值 */
  value: string
  /** 界面展示文案 */
  label: string
  /** 该标签内容是否由「标签内容区域」自身滚动。
   *  - true：内容（如文本卡片）自身无滚动能力，由本布局负责 overflow 滚动并加底部留白；
   *  - false / 不填：内容（如表格、ScrollArea）自带内部滚动，标签内容区域不滚动。 */
  scrollable?: boolean
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

/** 读取 URL hash 对应的合法 Tab，非法/空则回退到 defaultTab */
function readTabFromHash(validTabs: string[], defaultTab: string) {
  const hash = window.location.hash.replace("#", "")
  return validTabs.includes(hash) ? hash : defaultTab
}

/** 判断子节点是否为 TabsContent 面板 */
function isTabPanel(
  child: ReactNode,
): child is ReactElement<{ value?: string; className?: string; children?: ReactNode }> {
  return isValidElement(child) && child.type === TabsContent
}

/**
 * 详情页 Tab 面板：封装 Tabs UI 与「Tab ↔ URL hash」双向同步逻辑。
 * - 初始化读取 window.location.hash 决定激活 Tab
 * - 监听 hashchange 支持浏览器前进/后退
 * - 切换 Tab 时通过 history.replaceState 更新 hash
 * - 默认 Tab 的 hash 为空（与 Menus/detail.tsx 行为一致）
 *
 * 滚动行为统一由本组件根据 tab 的 `scrollable` 决定，调用方无需在
 * TabsContent 上写 overflow / 滚动相关样式：
 *  - scrollable：标签内容区域自身滚动（overflow-y-auto）+ 底部留白占位块；
 *  - 非 scrollable：标签内容区域不滚动，改为 flex 容器（底部保留 p-6 留白），由内部表格/ScrollArea 滚动。
 *
 * 用法一（配合 DetailLayout）：将 <TabsContent> 作为 children 传入，
 * 并通过 DetailLayout 的 `tabs` 属性声明标签与滚动方式。
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
  const tabValues = tabs.map((t) => t.value)
  const defaultTab = defaultValue ?? tabValues[0] ?? ""
  const scrollableValues = new Set(
    tabs.filter((t) => t.scrollable).map((t) => t.value),
  )

  const [activeTab, setActiveTab] = useState(() =>
    readTabFromHash(tabValues, defaultTab),
  )

  // 浏览器前进/后退时同步 Tab
  useEffect(() => {
    const onHashChange = () =>
      setActiveTab(readTabFromHash(tabValues, defaultTab))
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [tabValues, defaultTab])

  // 切换 Tab 时同步 hash（默认 Tab 不写 hash）
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    window.history.replaceState(
      null,
      "",
      value === defaultTab ? window.location.pathname : `#${value}`,
    )
  }

  // 滚动样式集中在此处处理：scrollable 的面板自身滚动并加底部留白，
  // 其余面板改为 flex 容器，把滚动交给内部表格/ScrollArea。
  const renderedChildren = Children.map(children, (child) => {
    if (!isTabPanel(child)) return child
    const scrollable = child.props.value != null && scrollableValues.has(child.props.value)
    const panelClassName = cn(
      child.props.className,
      "min-h-0 min-w-0",
      scrollable ? "overflow-y-auto p-1" : "flex flex-col pb-6",
    )
    return cloneElement(
      child,
      { className: panelClassName },
      child.props.children,
      scrollable ? <div key="bottom-spacer" className="h-6 shrink-0" /> : null,
    )
  })

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
      {renderedChildren}
    </Tabs>
  )
}

/**
 * 详情页统一布局。参考 Menus/detail.tsx 的 CSS 设计：
 * - 根容器：h-full p-6 pb-0 flex flex-col gap-1
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
    <div className="h-full p-6 pb-0 flex flex-col gap-1">
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
