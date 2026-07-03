import { useCallback, useEffect, useState } from "react"
import { PencilIcon } from "lucide-react"

import type { Ingredient } from "@dextea/shared-types"
import { INGREDIENT_STATUS } from "@dextea/shared-types"
import { INGREDIENT_STATUS_LABEL, INGREDIENT_STATUS_TEXT_CLASSES } from "@/lib/status"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { getIngredient } from "@/services"
import { EditIngredientBasicInfoDialog } from "./EditIngredientBasicInfoDialog"
import { EditIngredientStatusDialog } from "./EditIngredientStatusDialog"

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
  ingredientId: string
}

export default function BasicInfoPanel({ ingredientId }: BasicInfoPanelProps) {
  const [ingredient, setIngredient] = useState<Ingredient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)

  const fetchIngredient = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await getIngredient(Number(ingredientId))
      if (res.code === 0) {
        setIngredient(res.data)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [ingredientId])

  useEffect(() => {
    fetchIngredient()
  }, [fetchIngredient])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (error || !ingredient) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        加载原料信息失败
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>原料状态</CardTitle>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusDialogOpen(true)}
            >
              <PencilIcon data-icon="inline-start" />
              编辑
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
            <span className="text-sm text-muted-foreground">当前状态</span>
            <span className={`text-sm ${INGREDIENT_STATUS_TEXT_CLASSES[ingredient.status] ?? ""}`}>
              {INGREDIENT_STATUS_LABEL[ingredient.status]}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
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
            <span className="text-sm text-muted-foreground">原料名称</span>
            <span className="text-sm">{ingredient.name}</span>

            <span className="text-sm text-muted-foreground">单位</span>
            <span className="text-sm">{ingredient.unit}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>维护记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
            <span className="text-sm text-muted-foreground">创建时间</span>
            <span className="text-sm">{formatDate(ingredient.createdAt)}</span>

            <span className="text-sm text-muted-foreground">更新时间</span>
            <span className="text-sm">{formatDate(ingredient.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>

      <EditIngredientStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        ingredientId={ingredient.id}
        currentStatus={ingredient.status}
        onUpdated={fetchIngredient}
      />
      <EditIngredientBasicInfoDialog
        open={infoDialogOpen}
        onOpenChange={setInfoDialogOpen}
        ingredient={ingredient}
        onUpdated={fetchIngredient}
      />
    </>
  )
}
