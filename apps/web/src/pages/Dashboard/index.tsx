import { useCallback, useEffect, useState } from "react"
import { UsersIcon, StoreIcon } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

import type { DashboardStats } from "@dextea/shared-types"
import { getDashboardStats } from "@/services"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

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

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">工作台</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <UsersIcon className="size-4" />
              员工人数
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Spinner className="size-8 text-muted-foreground" />
            ) : (
              <span className="text-3xl font-bold">{stats?.employeeCount ?? 0}</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <StoreIcon className="size-4" />
              门店数量
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Spinner className="size-8 text-muted-foreground" />
            ) : (
              <span className="text-3xl font-bold">{stats?.storeCount ?? 0}</span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
