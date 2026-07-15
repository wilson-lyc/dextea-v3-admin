"use client"

import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  BookOpenIcon,
  ChevronDownIcon,
  HardDriveIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  StoreIcon,
  TagsIcon,
  UserCircleIcon,
  UsersIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  path?: string
  children?: { label: string; path: string }[]
}

const navItems: NavItem[] = [
  { label: "工作台", icon: LayoutDashboardIcon, path: "/" },
  { label: "图库", icon: ImagesIcon, path: "/gallery" },
  { label: "存储位置", icon: HardDriveIcon, path: "/storage-locations" },
  { label: "员工管理", icon: UsersIcon, path: "/employees" },
  { label: "门店管理", icon: StoreIcon, path: "/stores" },
  {
    label: "商品管理",
    icon: PackageIcon,
    children: [
      { label: "商品", path: "/products" },
      { label: "标签", path: "/products/tags" },
      { label: "原料", path: "/products/ingredients" },
    ],
  },
  { label: "菜单管理", icon: BookOpenIcon, path: "/menus" },
  { label: "顾客管理", icon: UserCircleIcon, path: "/customers" },
  { label: "订单管理", icon: ShoppingCartIcon, path: "/orders" },
  {
    label: "系统管理",
    icon: ShieldCheckIcon,
    children: [
      { label: "角色管理", path: "/roles" },
      { label: "权限管理", path: "/permissions" },
    ],
  },
]

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedNav, setExpandedNav] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavClick = (item: NavItem) => {
    if (item.children) {
      if (collapsed) {
        // When collapsed, navigate to the first child
        navigate(item.children[0].path)
      } else {
        // When expanded, toggle the sub-menu
        setExpandedNav((prev) => (prev === item.label ? null : item.label))
      }
    } else if (item.path) {
      navigate(item.path)
    }
  }

  const isChildActive = (children: { label: string; path: string }[]) =>
    children.some((child) => location.pathname === child.path)

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
            const isActive = item.children
              ? isChildActive(item.children)
              : location.pathname === item.path
            const isExpanded = expandedNav === item.label && !collapsed

            return (
              <li key={item.label}>
                <button
                  title={collapsed ? item.label : undefined}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "flex w-full items-center gap-2 overflow-hidden rounded-md text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
                    collapsed
                      ? "justify-center p-2 [&>svg]:size-5"
                      : "h-8 p-2 [&>svg]:size-4",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {item.children && (
                        <ChevronDownIcon
                          className={cn(
                            "ml-auto size-3.5 shrink-0 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Sub-menu */}
                {item.children && isExpanded && (
                  <ul className="ml-2 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
                    {item.children.map((child) => {
                      const isChildActive = location.pathname === child.path
                      return (
                        <li key={child.label}>
                          <button
                            onClick={() => navigate(child.path)}
                            className={cn(
                              "flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
                              isChildActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                            )}
                          >
                            <TagsIcon className="size-4 shrink-0" />
                            <span className="truncate">{child.label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
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
