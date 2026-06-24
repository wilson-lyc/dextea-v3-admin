import { useCallback, useEffect, useState } from "react"
import { CircleHelpIcon } from "lucide-react"

import type { Store } from "@dextea/shared-types"
import type { Division } from "@/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox"
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
import { getProvinces, getChildren } from "@/services"
import AmapMapPicker from "@/components/amap/amap-map-picker"

interface EditLocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: Store
}

export function EditLocationDialog({ open, onOpenChange, store }: EditLocationDialogProps) {
  const [province, setProvince] = useState(store.province)
  const [city, setCity] = useState(store.city)
  const [district, setDistrict] = useState(store.district)
  const [address, setAddress] = useState(store.address)
  const [longitude, setLongitude] = useState(store.longitude)
  const [latitude, setLatitude] = useState(store.latitude)

  const [provinces, setProvinces] = useState<Division[]>([])
  const [cities, setCities] = useState<Division[]>([])
  const [districts, setDistricts] = useState<Division[]>([])
  const [selectedProvince, setSelectedProvince] = useState<Division | null>(null)
  const [selectedCity, setSelectedCity] = useState<Division | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<Division | null>(null)
  const [areasLoading, setAreasLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    setProvince(store.province)
    setCity(store.city)
    setDistrict(store.district)
    setAddress(store.address)
    setLongitude(store.longitude)
    setLatitude(store.latitude)
    setSelectedProvince(null)
    setSelectedCity(null)
    setSelectedDistrict(null)
    setCities([])
    setDistricts([])

    setAreasLoading(true)
    getProvinces().then((res) => {
      if (res.code === 0) {
        setProvinces(res.data)
        const matched = res.data.find((p) => p.name === store.province)
        if (matched) setSelectedProvince(matched)
      }
      setAreasLoading(false)
    })
  }, [open, store.province, store.city, store.district, store.address, store.longitude, store.latitude])

  useEffect(() => {
    if (!selectedProvince) {
      setCities([])
      setSelectedCity(null)
      setDistricts([])
      setSelectedDistrict(null)
      return
    }

    setProvince(selectedProvince.name)
    getChildren(selectedProvince.code).then((res) => {
      if (res.code === 0) {
        setCities(res.data)
        const matched = res.data.find((c) => c.name === store.city)
        if (matched) setSelectedCity(matched)
      }
    })
  }, [selectedProvince])

  useEffect(() => {
    if (!selectedCity) {
      setDistricts([])
      setSelectedDistrict(null)
      return
    }

    setCity(selectedCity.name)
    getChildren(selectedCity.code).then((res) => {
      if (res.code === 0) {
        setDistricts(res.data)
        const matched = res.data.find((d) => d.name === store.district)
        if (matched) setSelectedDistrict(matched)
      }
    })
  }, [selectedCity])

  useEffect(() => {
    setDistrict(selectedDistrict?.name ?? "")
  }, [selectedDistrict])

  const handlePick = useCallback((lng: number, lat: number) => {
    setLongitude(lng)
    setLatitude(lat)
  }, [])

  const fullAddress = [province, city, district, address].filter(Boolean).join(" ")

  const handleSubmit = () => {
    // TODO: 调用 updateStore API
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑门店位置</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label>
              省市区 <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <Combobox
                items={provinces}
                value={selectedProvince}
                onValueChange={setSelectedProvince}
                itemToStringValue={(item: Division | null) => item?.name ?? ""}
              >
                <ComboboxTrigger
                  render={
                    <Button variant="outline" className="w-full justify-between font-normal" disabled={areasLoading} />
                  }
                >
                  {selectedProvince ? selectedProvince.name : <span className="text-muted-foreground">选择省</span>}
                </ComboboxTrigger>
                <ComboboxContent>
                  <ComboboxInput showTrigger={false} placeholder="搜索省..." />
                  <ComboboxEmpty>未找到</ComboboxEmpty>
                  <ComboboxList>
                    {(item: Division) => (
                      <ComboboxItem key={item.code} value={item}>
                        {item.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <Combobox
                items={cities}
                value={selectedCity}
                onValueChange={setSelectedCity}
                itemToStringValue={(item: Division | null) => item?.name ?? ""}
              >
                <ComboboxTrigger
                  render={
                    <Button variant="outline" className="w-full justify-between font-normal" disabled={!selectedProvince} />
                  }
                >
                  {selectedCity ? selectedCity.name : <span className="text-muted-foreground">选择市</span>}
                </ComboboxTrigger>
                <ComboboxContent>
                  <ComboboxInput showTrigger={false} placeholder="搜索市..." />
                  <ComboboxEmpty>未找到</ComboboxEmpty>
                  <ComboboxList>
                    {(item: Division) => (
                      <ComboboxItem key={item.code} value={item}>
                        {item.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <Combobox
                items={districts}
                value={selectedDistrict}
                onValueChange={setSelectedDistrict}
                itemToStringValue={(item: Division | null) => item?.name ?? ""}
              >
                <ComboboxTrigger
                  render={
                    <Button variant="outline" className="w-full justify-between font-normal" disabled={!selectedCity} />
                  }
                >
                  {selectedDistrict ? selectedDistrict.name : <span className="text-muted-foreground">选择区</span>}
                </ComboboxTrigger>
                <ComboboxContent>
                  <ComboboxInput showTrigger={false} placeholder="搜索区..." />
                  <ComboboxEmpty>未找到</ComboboxEmpty>
                  <ComboboxList>
                    {(item: Division) => (
                      <ComboboxItem key={item.code} value={item}>
                        {item.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-store-address">
              具体地址 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-store-address"
              placeholder="请输入具体地址"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1">
              定位坐标 <span className="text-destructive">*</span>
              <Tooltip>
                <TooltipTrigger render={<CircleHelpIcon className="size-4 text-muted-foreground" />}>
                </TooltipTrigger>
                <TooltipContent>点击地图可修改定位坐标</TooltipContent>
              </Tooltip>
            </Label>
            <AmapMapPicker
              longitude={longitude || 116.397428}
              latitude={latitude || 39.90923}
              name={store.name}
              address={fullAddress}
              onPick={handlePick}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
