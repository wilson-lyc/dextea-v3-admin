import { Navigate, Outlet, useLocation } from "react-router-dom"

/**
 * 白名单页面 — 不需要 token 即可访问。
 * 在 ProtectedRoute 外层的路由自然不受保护，
 * 此处显式声明以便一目了然。
 */
const WHITE_LIST = ["/login", "/initialization", "/forgot-password"]

export function ProtectedRoute() {
  const token = sessionStorage.getItem("token")
  const location = useLocation()

  // 若当前路径在白名单中，直接放行（兜底逻辑）
  if (WHITE_LIST.includes(location.pathname)) {
    return <Outlet />
  }

  // 无 token → 重定向到登录页，并记住来源地址
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
