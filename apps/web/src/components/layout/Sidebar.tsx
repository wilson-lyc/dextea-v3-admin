"use client"

import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
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
  { label: "员工管理", icon: UsersIcon, path: "/employees" },
  { label: "门店管理", icon: StoreIcon, path: "/stores" },
  { label: "商品管理", icon: PackageIcon, path: "/products" },
  { label: "菜单管理", icon: BookOpenIcon, path: "/menus" },
  { label: "顾客管理", icon: UserCircleIcon, path: "/customers" },
  { label: "订单管理", icon: ShoppingCartIcon, path: "/orders" },
]

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

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
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <li key={item.label} className="relative">
                <button
                  title={collapsed ? item.label : undefined}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex w-full items-center gap-2 overflow-hidden rounded-md text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
                    collapsed
                      ? "justify-center p-2 [&>svg]:size-5"
                      : "h-8 p-2 [&>svg]:size-4",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              </li>
            )
          })}
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
