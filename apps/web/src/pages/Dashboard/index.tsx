import { useCallback, useEffect, useState } from "react"
import {
  UsersIcon,
  StoreIcon,
  PackageIcon,
  UtensilsCrossedIcon,
  LeafIcon,
  TagIcon,
  SlidersHorizontalIcon,
  ReceiptIcon,
} from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

import type { DashboardStats } from "@/api"
import { getDashboardStats } from "@/api"
import {
  STORE_STATUS_LABEL,
  STORE_STATUS_BADGE_CLASSES,
  STORE_STATUS_TEXT_CLASSES,
} from "@dextea-admin/contracts/status"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface Kpi {
  label: string
  value: number
  icon: typeof UsersIcon
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDashboardStats()
      setStats(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const kpis: Kpi[] = stats
    ? [
        { label: "员工人数", value: stats.employeeCount, icon: UsersIcon },
        { label: "门店数量", value: stats.storeCount, icon: StoreIcon },
        { label: "在售商品", value: stats.productCount, icon: PackageIcon },
        { label: "菜单数量", value: stats.menuCount, icon: UtensilsCrossedIcon },
        { label: "原料种类", value: stats.ingredientCount, icon: LeafIcon },
        { label: "商品标签", value: stats.tagCount, icon: TagIcon },
        { label: "客制化项", value: stats.customizationCount, icon: SlidersHorizontalIcon },
        { label: "累计订单", value: stats.orderCount, icon: ReceiptIcon },
      ]
    : []

  const distributionTotal =
    stats?.storeStatusDistribution.reduce((sum, item) => sum + item.count, 0) ?? 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">工作台</h1>

      {/* 核心指标卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="size-4" />
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Spinner className="size-8 text-muted-foreground" />
                ) : (
                  <span className="text-3xl font-bold">{kpi.value}</span>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 门店状态分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">门店状态分布</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loading ? (
            <Spinner className="size-8 text-muted-foreground" />
          ) : distributionTotal === 0 ? (
            <p className="text-sm text-muted-foreground">暂无门店数据</p>
          ) : (
            stats?.storeStatusDistribution.map((item) => {
              const percent =
                distributionTotal > 0
                  ? Math.round((item.count / distributionTotal) * 100)
                  : 0
              return (
                <div key={item.status} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STORE_STATUS_BADGE_CLASSES[item.status]}`}
                    >
                      {STORE_STATUS_LABEL[item.status] ?? `状态 ${item.status}`}
                    </span>
                    <span className={STORE_STATUS_TEXT_CLASSES[item.status]}>
                      {item.count} 家 · {percent}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
