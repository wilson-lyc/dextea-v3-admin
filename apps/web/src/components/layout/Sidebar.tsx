"use client"

import { useState } from "react"
import {
  BookOpenIcon,
  PackageIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  ShoppingCartIcon,
  StoreIcon,
  UserCircleIcon,
  UsersIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [
  { label: "员工管理", icon: UsersIcon },
  { label: "门店管理", icon: StoreIcon },
  { label: "商品管理", icon: PackageIcon },
  { label: "菜单管理", icon: BookOpenIcon },
  { label: "顾客管理", icon: UserCircleIcon },
  { label: "订单管理", icon: ShoppingCartIcon },
]

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "flex flex-col overflow-auto border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear",
        collapsed ? "w-12" : "w-60"
      )}
    >
      {/* Navigation */}
      <nav className="no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto p-2 pt-[10px]">
        <ul className="flex w-full min-w-0 flex-col gap-0">
          {navItems.map((item) => (
            <li key={item.label} className="relative">
              <button
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex w-full items-center gap-2 overflow-hidden rounded-md text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
                  collapsed
                    ? "justify-center p-2 [&>svg]:size-5"
                    : "h-8 p-2 [&>svg]:size-4"
                )}
              >
                <item.icon className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer / Collapse toggle */}
      <div className="flex flex-col gap-2 border-t border-sidebar-border p-2">
        <ul className="flex w-full min-w-0 flex-col gap-0">
          <li className="relative">
            <button
              title={collapsed ? "展开" : "折叠"}
              onClick={() => setCollapsed((prev) => !prev)}
              className={cn(
                "flex w-full items-center gap-2 overflow-hidden rounded-md text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
                collapsed
                  ? "justify-center p-2 [&>svg]:size-5"
                  : "h-8 p-2 [&>svg]:size-4"
              )}
            >
              {collapsed ? (
                <PanelLeftOpenIcon className="shrink-0" />
              ) : (
                <PanelLeftCloseIcon className="shrink-0" />
              )}
              {!collapsed && <span className="truncate">折叠</span>}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  )
}
