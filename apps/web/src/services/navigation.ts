import type { NavigateFunction } from "react-router-dom"

/**
 * 全局导航引用 — 供 axios 拦截器等非 React 组件内使用
 *
 * 通过在 App.tsx 中调用 setNavigate(navigate) 注入。
 * 若注入前拦截器已触发，则回退为 window.location.href 硬跳转。
 */

let navigateFn: NavigateFunction | null = null

export function setNavigate(fn: NavigateFunction) {
  navigateFn = fn
}

/** 跳转到登录页（同时清除失效的 token） */
export function redirectToLogin() {
  sessionStorage.removeItem("token")
  if (navigateFn) {
    navigateFn("/login", { replace: true })
  } else {
    window.location.href = "/login"
  }
}

/** 跳转到 403 禁止访问页 */
export function redirectToForbidden() {
  if (navigateFn) {
    navigateFn("/403", { replace: true })
  } else {
    window.location.href = "/403"
  }
}
