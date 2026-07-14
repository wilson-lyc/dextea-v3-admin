import { useCallback, useEffect, useState } from "react"
import { CircleHelpIcon } from "lucide-react"
import { toast } from "sonner"

import type { Store } from "@/api"
import { AreaSelector } from "@/components/area"
import type { AreaValue } from "@/components/area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { updateStoreLocation, resolveMessage } from "@/api"
import AmapMapPicker from "@/components/amap/amap-map-picker"

interface EditStoreLocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: Store
  onUpdated: () => void
}

export function EditStoreLocationDialog({ open, onOpenChange, store, onUpdated }: EditStoreLocationDialogProps) {
  const [regionCode, setRegionCode] = useState(store.regionCode)
  const [province, setProvince] = useState(store.province)
  const [city, setCity] = useState(store.city)
  const [district, setDistrict] = useState(store.district)
  const [address, setAddress] = useState(store.address)
  const [longitude, setLongitude] = useState(store.longitude)
  const [latitude, setLatitude] = useState(store.latitude)
  const [submitting, setSubmitting] = useState(false)

  // 弹窗打开时从 store 同步省市区字段
  useEffect(() => {
    if (!open) return

    setRegionCode(store.regionCode)
    setProvince(store.province)
    setCity(store.city)
    setDistrict(store.district)
    setAddress(store.address)
    setLongitude(store.longitude)
    setLatitude(store.latitude)
  }, [open, store.regionCode, store.province, store.city, store.district, store.address, store.longitude, store.latitude])

  const handleAreaChange = useCallback((value: AreaValue) => {
    setRegionCode(value.code ?? "")
    setProvince(value.province)
    setCity(value.city)
    setDistrict(value.district)
  }, [])

  const handlePick = useCallback((lng: number, lat: number) => {
    setLongitude(lng)
    setLatitude(lat)
  }, [])

  const fullAddress = [province, city, district, address].filter(Boolean).join(" ")

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await updateStoreLocation(store.id, {
        regionCode,
        address,
        longitude,
        latitude,
      })
      if (res.code === 0) {
        toast.success(resolveMessage(res, "位置信息更新成功"))
        onOpenChange(false)
        onUpdated()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("更新门店位置失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑门店位置</DialogTitle>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field>
            <FieldLabel>
              省市区
            </FieldLabel>
            <AreaSelector
              key={`edit-location-${store.id}-${open}`}
              value={{ code: store.regionCode }}
              onChange={handleAreaChange}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-store-address">
              具体地址
            </FieldLabel>
            <Input
              id="edit-store-address"
              placeholder="请输入具体地址"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel className="flex items-center gap-1">
              定位坐标
              <Tooltip>
                <TooltipTrigger render={<CircleHelpIcon className="size-4 text-muted-foreground" />}>
                </TooltipTrigger>
                <TooltipContent>点击地图可修改定位坐标</TooltipContent>
              </Tooltip>
            </FieldLabel>
            <AmapMapPicker
              longitude={longitude || 116.397428}
              latitude={latitude || 39.90923}
              name={store.name}
              address={fullAddress}
              onPick={handlePick}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "提交中..." : "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
