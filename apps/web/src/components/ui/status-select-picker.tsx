"use client"

import * as React from "react"
import { SelectPicker, type SelectOption } from "@/components/ui/select-picker"

interface StatusSelectPickerProps {
  statusEnum: Record<string, { value: number }>
  labels: Record<number, string>
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function StatusSelectPicker({
  statusEnum,
  labels,
  value,
  onValueChange,
  placeholder = "请选择",
  className,
  disabled,
}: StatusSelectPickerProps) {
  const options: SelectOption[] = React.useMemo(
    () =>
      Object.values(statusEnum).map((s) => ({
        label: labels[s.value] ?? String(s.value),
        value: String(s.value),
      })),
    [statusEnum, labels],
  )

  return (
    <SelectPicker
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  )
}
