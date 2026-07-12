import { ChevronDownIcon, LogOutIcon, SettingsIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/api"
import ThemeToggle from "./ThemeToggle"

export default function Header() {
  const navigate = useNavigate()
  const employee = (() => {
    try {
      const raw = sessionStorage.getItem("employee")
      return raw ? (JSON.parse(raw) as { displayName: string }) : null
    } catch {
      return null
    }
  })()

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // 即使网络请求失败也执行前端清理
    }
    sessionStorage.clear()
    navigate("/login", { replace: true })
    toast.success("已退出登录")
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
      <h1 className="text-lg font-semibold tracking-tight">dextea admin</h1>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" />}>
            {employee?.displayName ?? "admin"}
            <ChevronDownIcon data-icon="inline-end" />
          </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onMouseDown={() => navigate("/me")}>
              <SettingsIcon />
              账户设置
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onMouseDown={handleLogout}>
              <LogOutIcon />
              退出
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
