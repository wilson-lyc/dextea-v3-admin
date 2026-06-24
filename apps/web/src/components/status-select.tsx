import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StatusOption {
  key: string
  label: string
  value: number
}

interface StatusSelectProps {
  value: string | number
  onValueChange: (value: string) => void
  options: Record<string, StatusOption>
  placeholder?: string
  className?: string
}

export function StatusSelect({ value, onValueChange, options, placeholder, className }: StatusSelectProps) {
  const entries = Object.values(options)
  const strValue = String(value)
  const currentLabel = entries.find((e) => String(e.value) === strValue)?.label ?? ""

  return (
    <Select value={strValue} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {entries.map((opt) => (
          <SelectItem key={opt.value} value={String(opt.value)}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
