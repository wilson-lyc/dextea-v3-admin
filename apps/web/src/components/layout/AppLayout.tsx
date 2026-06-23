import type { ReactNode } from "react"
import Header from "./Header"
import AppSidebar from "./Sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
