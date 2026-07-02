---
name: "detail-page"
description: "当需要创建或修改详情页组件时使用本 skill。标准详情页设计规范。包含面包屑导航（必须）和可选的 Tab 面板（TabsList 固定、TabsContent 滚动）。"
---

# Detail Page 设计规范

用于 dextea-admin 后台详情页的标准化设计。

## 页面结构

```
Root div: h-full p-6 flex flex-col
├── 面包屑导航 (必须)
└── Tab 面板 (可选)
    ├── TabsList (固定，不滚动)
    └── ScrollArea: flex-1 min-h-0
        └── TabsContent (滚动区域)
```

## 必选组件：面包屑导航

每个详情页顶部都必须包含返回按钮和面包屑。

```tsx
<div className="flex items-center gap-2">
  <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
    <ArrowLeftIcon data-icon="inline-start" />
    返回
  </Button>
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbPage>{/* 父级页面名称 */}</BreadcrumbPage>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>{/* 当前详情名称 */}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</div>
```

## 内容区滚动

当页面不需要 Tab 面板时，直接在内容区外层包裹 `ScrollArea`：

```tsx
<ScrollArea className="flex-1 min-h-0">
  {/* 页面内容 */}
</ScrollArea>
```

## 可选组件：Tab 面板

当页面包含多个信息区块时使用 Tab 面板。

### 布局规则

- `Tabs` 使用 `flex flex-1 min-h-0 flex-col` 填充剩余空间
- `TabsList` 在顶部，不参与滚动
- `ScrollArea` 使用 `flex-1 min-h-0 p-1`，只包裹 `TabsContent`
- 每个 `TabsContent` 不需要单独设置滚动

```tsx
<Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-1 min-h-0 flex-col">
  <TabsList variant="line">
    <TabsTrigger value="basic">基础信息</TabsTrigger>
    <TabsTrigger value="groups">菜单分组</TabsTrigger>
  </TabsList>

  <ScrollArea className="flex-1 min-h-0 p-1">
    <TabsContent value="basic">
      {/* Tab 内容组件 */}
    </TabsContent>

    <TabsContent value="groups">
      {/* Tab 内容组件 */}
    </TabsContent>
  </ScrollArea>
</Tabs>
```

### Tab 与 URL Hash 同步

Tab 切换需与 URL hash 双向同步，支持浏览器前进/后退：

- 初始化时从 `window.location.hash` 读取当前 tab
- `hashchange` 事件监听浏览器前进/后退
- 切换 Tab 时通过 `history.replaceState` 更新 hash
- 第一个 tab（默认）的 hash 为空

```tsx
const tabValues = useMemo(() => ["basic", "groups"], [])
const [activeTab, setActiveTab] = useState(() => {
  const hash = window.location.hash.replace("#", "")
  return tabValues.includes(hash) ? hash : "basic"
})

// 浏览器前进后退时同步 Tab
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
const handleTabChange = useCallback((value: string) => {
  setActiveTab(value)
  const newHash = value === "basic" ? "" : value
  window.history.replaceState(null, "", newHash ? `#${newHash}` : window.location.pathname)
}, [])
```

## 页面通用状态

详情页通常包含以下三种渲染状态：

```tsx
// 加载中
if (loading) {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  )
}

// 数据不存在
if (notFound) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">{/* 错误提示 */}</p>
      <Button variant="outline" onClick={() => navigate(-1)}>返回</Button>
    </div>
  )
}

// 正常渲染
return (
  <div className="h-full p-6 flex flex-col">
    {/* 面包屑导航 */}
    {/* Tab 面板（可选） */}
  </div>
)
```

## 导入参考

```tsx
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Spinner } from "@/components/ui/spinner"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs"
```
