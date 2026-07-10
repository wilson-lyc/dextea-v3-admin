import { useCallback, useEffect, useState } from "react"
import { PencilIcon } from "lucide-react"

import type { Menu } from "@/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { getMenu } from "@/api"
import EditBasicInfoDialog from "./EditBasicInfoDialog"

function formatDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface BasicInfoPanelProps {
  menuId: string
}

export default function BasicInfoPanel({ menuId }: BasicInfoPanelProps) {
  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await getMenu(Number(menuId))
      if (res.code === 0) {
        setMenu(res.data)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [menuId])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (error || !menu) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        加载菜单信息失败
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 基础信息 */}
      < Card >
        <CardHeader>
          <CardTitle>基础信息</CardTitle>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInfoDialogOpen(true)}
            >
              <PencilIcon data-icon="inline-start" />
              编辑
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
            <span className="text-sm text-muted-foreground">菜单名称</span>
            <span className="text-sm">{menu.name}</span>

            <span className="text-sm text-muted-foreground">描述</span>
            <span className="text-sm">{menu.description || "-"}</span>

          </div>
        </CardContent>
      </Card >

      {/* 维护记录 */}
      < Card >
        <CardHeader>
          <CardTitle>维护记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
            <span className="text-sm text-muted-foreground">创建时间</span>
            <span className="text-sm">{formatDate(menu.createdAt)}</span>

            <span className="text-sm text-muted-foreground">更新时间</span>
            <span className="text-sm">{formatDate(menu.updatedAt)}</span>
          </div>
        </CardContent>
      </Card >

      <EditBasicInfoDialog
        open={infoDialogOpen}
        onOpenChange={setInfoDialogOpen}
        menuId={Number(menuId)}
        menu={menu}
        onUpdated={fetchMenu}
      />
    </div >
  )
}
