import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { getMe } from "@/services"

const WHITE_LIST = ["/login", "/initialization", "/forgot-password"]

export function ProtectedRoute() {
  const token = sessionStorage.getItem("token")
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)

  useEffect(() => {
    if (WHITE_LIST.includes(location.pathname) || !token) {
      setChecking(false)
      return
    }

    getMe()
      .then((res) => {
        sessionStorage.setItem("user", JSON.stringify(res.data.user))
        setValid(true)
      })
      .catch(() => {
        sessionStorage.removeItem("token")
        sessionStorage.removeItem("user")
        setValid(false)
      })
      .finally(() => {
        setChecking(false)
      })
  }, [token, location.pathname])

  if (WHITE_LIST.includes(location.pathname)) {
    return <Outlet />
  }

  if (checking) {
    return null
  }

  if (!token || !valid) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
