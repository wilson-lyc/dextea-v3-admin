import { useEffect } from "react"
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import AppLayout from "@/components/layout/AppLayout"
import Login from "@/pages/Login"
import Initialization from "@/pages/Initialization"
import Forbidden from "@/pages/Forbidden"
import EmployeesPage from "@/pages/Employees"
import StoresPage from "@/pages/Stores"
import StoreDetailPage from "@/pages/Stores/detail"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/hooks/use-theme"
import { setNavigate } from "@/services/navigation"

function Home() {
  return (
    <div className="flex h-full items-center justify-center p-6 text-muted-foreground">
      Welcome to dextea admin
    </div>
  )
}

function App() {
  const navigate = useNavigate()

  // 将 navigate 注入到全局导航服务中，供 axios 拦截器等非组件代码使用
  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/initialization" element={<Initialization />} />
        <Route path="/403" element={<Forbidden />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="stores" element={<StoresPage />} />
            <Route path="stores/:id" element={<StoreDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" />
    </ThemeProvider>
  )
}

export default App
