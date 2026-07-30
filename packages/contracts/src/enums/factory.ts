export type StatusItem = {
  readonly key: string
  readonly label: string
  readonly value: number
}

export type StatusTone =
  | 'destructive'
  | 'muted'
  | 'red'
  | 'green'
  | 'blue'
  | 'amber'
  | 'cyan'
  | 'violet'
  | 'orange'

export const TONE_TEXT_CLASSES: Record<StatusTone, string> = {
  destructive: 'text-destructive',
  muted: 'text-muted-foreground',
  red: 'text-red-600 dark:text-red-400',
  green: 'text-green-600 dark:text-green-400',
  blue: 'text-blue-600 dark:text-blue-400',
  amber: 'text-amber-600 dark:text-amber-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  violet: 'text-violet-600 dark:text-violet-400',
  orange: 'text-orange-600 dark:text-orange-400',
}

export const TONE_BADGE_CLASSES: Record<StatusTone, string> = {
  destructive: 'bg-muted text-muted-foreground ring-muted',
  muted: 'bg-muted text-muted-foreground ring-muted',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200 dark:ring-blue-800/30',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-200 dark:ring-amber-800/30',
  cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 ring-cyan-200 dark:ring-cyan-800/30',
  violet:
    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 ring-violet-200 dark:ring-violet-800/30',
  orange:
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 ring-orange-200 dark:ring-orange-800/30',
}

export interface DefinedStatus<T extends Record<string, StatusItem>> {
  readonly items: T
  readonly Item: T[keyof T]
  readonly Value: T[keyof T]['value']
  readonly values: readonly T[keyof T]['value'][]
  readonly label: Record<number, string>
  readonly textClasses: Record<number, string>
  readonly badgeClasses: Record<number, string>
}

export function defineStatus<const T extends Record<string, StatusItem>>(
  items: T,
  tones: Partial<Record<T[keyof T]['value'], StatusTone>> = {},
): DefinedStatus<T> {
  const entries = Object.values(items) as StatusItem[]
  const values = entries.map((s) => s.value)
  const label = Object.fromEntries(entries.map((s) => [s.value, s.label])) as Record<number, string>
  const textClasses: Record<number, string> = {}
  const badgeClasses: Record<number, string> = {}
  for (const s of entries) {
    const tone = tones[s.value as T[keyof T]['value']] ?? 'muted'
    textClasses[s.value] = TONE_TEXT_CLASSES[tone]
    badgeClasses[s.value] = TONE_BADGE_CLASSES[tone]
  }
  return {
    items,
    Item: undefined as unknown as T[keyof T],
    Value: undefined as unknown as T[keyof T]['value'],
    values: values as readonly T[keyof T]['value'][],
    label,
    textClasses,
    badgeClasses,
  }
}
