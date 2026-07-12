import type { ReactNode } from "react"

interface InfoFieldProps {
  /** 左侧标签 */
  label: ReactNode
  /** 右侧值 */
  value: ReactNode
  /** 附加在值上的 className（如状态色 `text-*`、等宽字体 `font-mono`） */
  valueClassName?: string
}

/**
 * 详情页信息行。以 fragment 形式渲染 label/value 两个 span，
 * 需作为 DetailInfoGrid 的直接子元素以保持 CSS Grid 布局。
 */
export function InfoField({ label, value, valueClassName }: InfoFieldProps) {
  return (
    <>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={valueClassName ? `text-sm ${valueClassName}` : "text-sm"}>
        {value}
      </span>
    </>
  )
}

interface DetailInfoGridProps {
  children: ReactNode
  className?: string
}

/**
 * 详情页「标签 - 值」信息网格。统一门店/商品/原料等模块基础信息卡的内部布局：
 * grid grid-cols-[160px_1fr] gap-x-4 gap-y-3。
 * 通常需要配合 InfoField 作为子元素；也可在其中混入自定义内容（如地图）。
 */
export default function DetailInfoGrid({ children, className }: DetailInfoGridProps) {
  return (
    <div className={`grid grid-cols-[160px_1fr] gap-x-4 gap-y-3 ${className ?? ""}`}>
      {children}
    </div>
  )
}
