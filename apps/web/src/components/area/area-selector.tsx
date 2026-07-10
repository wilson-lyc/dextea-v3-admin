"use client"

import { useCallback, useEffect, useState } from "react"

import type { Division } from "@/api"
import { getProvinces, getChildren } from "@/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox"

export interface AreaValue {
  province: string
  city: string
  district: string
}

interface AreaSelectorProps {
  /** 当前选中的省市区名称，用于初始化回显 */
  value?: Partial<AreaValue>
  /** 选择变化时的回调 */
  onChange?: (value: AreaValue) => void
  /** 是否禁用所有选择器 */
  disabled?: boolean
  /** 额外的 wrapper className */
  className?: string
}

export function AreaSelector({
  value,
  onChange,
  disabled = false,
  className,
}: AreaSelectorProps) {
  const [provinces, setProvinces] = useState<Division[]>([])
  const [cities, setCities] = useState<Division[]>([])
  const [districts, setDistricts] = useState<Division[]>([])
  const [selectedProvince, setSelectedProvince] = useState<Division | null>(null)
  const [selectedCity, setSelectedCity] = useState<Division | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<Division | null>(null)
  const [areasLoading, setAreasLoading] = useState(false)

  // ── 加载省份列表 ──────────────────────────────────
  useEffect(() => {
    if (disabled) return

    setAreasLoading(true)
    getProvinces().then((res) => {
      if (res.code === 0) {
        setProvinces(res.data)
      }
      setAreasLoading(false)
    })
  }, [disabled])

  // ── 回显：自动匹配初始省份 ──────────────────────────
  useEffect(() => {
    if (!value?.province || !provinces.length) return
    const matched = provinces.find((p) => p.name === value.province)
    if (matched && (!selectedProvince || selectedProvince.code !== matched.code)) {
      setSelectedProvince(matched)
    }
  }, [provinces, value?.province])

  // ── 省份变化 → 清空下级并加载城市列表 ────────────────
  useEffect(() => {
    if (!selectedProvince) {
      setCities([])
      setSelectedCity(null)
      setDistricts([])
      setSelectedDistrict(null)
      return
    }

    // 切换省份时清空市/区
    setSelectedCity(null)
    setSelectedDistrict(null)
    setCities([])
    setDistricts([])

    getChildren(selectedProvince.code).then((res) => {
      if (res.code === 0) setCities(res.data)
    })
  }, [selectedProvince])

  // ── 回显：自动匹配初始城市 ──────────────────────────
  useEffect(() => {
    if (!value?.city || !cities.length || !selectedProvince) return
    const matched = cities.find((c) => c.name === value.city)
    if (matched && (!selectedCity || selectedCity.code !== matched.code)) {
      setSelectedCity(matched)
    }
  }, [cities, value?.city, selectedProvince])

  // ── 城市变化 → 清空下级并加载区县列表 ────────────────
  useEffect(() => {
    if (!selectedCity) {
      setDistricts([])
      setSelectedDistrict(null)
      return
    }

    // 切换城市时清空区
    setSelectedDistrict(null)
    setDistricts([])

    getChildren(selectedCity.code).then((res) => {
      if (res.code === 0) setDistricts(res.data)
    })
  }, [selectedCity])

  // ── 回显：自动匹配初始区县 ──────────────────────────
  useEffect(() => {
    if (!value?.district || !districts.length || !selectedCity) return
    const matched = districts.find((d) => d.name === value.district)
    if (matched && (!selectedDistrict || selectedDistrict.code !== matched.code)) {
      setSelectedDistrict(matched)
    }
  }, [districts, value?.district, selectedCity])

  // ── 用户交互回调（不触发自动回显）───────────────────
  const handleProvinceChange = useCallback(
    (item: Division | null) => {
      setSelectedProvince(item)
      setSelectedCity(null)
      setSelectedDistrict(null)
      setCities([])
      setDistricts([])
      onChange?.({ province: item?.name ?? "", city: "", district: "" })
    },
    [onChange],
  )

  const handleCityChange = useCallback(
    (item: Division | null) => {
      setSelectedCity(item)
      setSelectedDistrict(null)
      setDistricts([])
      if (selectedProvince) {
        onChange?.({ province: selectedProvince.name, city: item?.name ?? "", district: "" })
      }
    },
    [selectedProvince, onChange],
  )

  const handleDistrictChange = useCallback(
    (item: Division | null) => {
      setSelectedDistrict(item)
      if (selectedProvince && selectedCity) {
        onChange?.({
          province: selectedProvince.name,
          city: selectedCity.name,
          district: item?.name ?? "",
        })
      }
    },
    [selectedProvince, selectedCity, onChange],
  )

  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {/* 省 */}
      <Combobox
        items={provinces}
        value={selectedProvince}
        onValueChange={handleProvinceChange}
        itemToStringValue={(item: Division | null) => item?.name ?? ""}
      >
        <ComboboxTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
              disabled={areasLoading || disabled}
            />
          }
        >
          {selectedProvince ? (
            selectedProvince.name
          ) : (
            <span className="text-muted-foreground">选择省</span>
          )}
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

      {/* 市 */}
      <Combobox
        items={cities}
        value={selectedCity}
        onValueChange={handleCityChange}
        itemToStringValue={(item: Division | null) => item?.name ?? ""}
      >
        <ComboboxTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
              disabled={!selectedProvince || disabled}
            />
          }
        >
          {selectedCity ? (
            selectedCity.name
          ) : (
            <span className="text-muted-foreground">选择市</span>
          )}
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

      {/* 区 */}
      <Combobox
        items={districts}
        value={selectedDistrict}
        onValueChange={handleDistrictChange}
        itemToStringValue={(item: Division | null) => item?.name ?? ""}
      >
        <ComboboxTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
              disabled={!selectedCity || disabled}
            />
          }
        >
          {selectedDistrict ? (
            selectedDistrict.name
          ) : (
            <span className="text-muted-foreground">选择区</span>
          )}
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
  )
}
