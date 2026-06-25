import { SparklesIcon } from "lucide-react"

import { Empty } from "@/components/ui/empty"

export default function CustomizationPage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Empty
        icon={SparklesIcon}
        title="客制化"
        description="客制化功能正在开发中，敬请期待"
      />
    </div>
  )
}
