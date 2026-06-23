import { Outlet } from "react-router-dom"
import Header from "./Header"
import AppSidebar from "./Sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function AppLayout() {
  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
