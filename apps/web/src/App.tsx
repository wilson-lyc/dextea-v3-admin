import { useEffect } from "react"
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import AppLayout from "@/components/layout/AppLayout"
import Login from "@/pages/Login"
import Initialization from "@/pages/Initialization"
import Forbidden from "@/pages/Forbidden"
import DashboardPage from "@/pages/Dashboard"
import EmployeesPage from "@/pages/Employees"
import MenusPage from "@/pages/Menus"
import MenuDetailPage from "@/pages/Menus/detail"
import StoresPage from "@/pages/Stores"
import StoreDetailPage from "@/pages/Stores/detail"
import ProductsPage from "@/pages/Products"
import ProductDetailPage from "@/pages/Products/detail"
import TagListPage from "@/pages/ProductTags"
import IngredientsPage from "@/pages/Ingredients"
import IngredientDetailPage from "@/pages/Ingredients/detail"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/hooks/use-theme"
import { setNavigate } from "@/services/navigation"

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
            <Route index element={<DashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="menus" element={<MenusPage />} />
            <Route path="menus/:id" element={<MenuDetailPage />} />
            <Route path="stores" element={<StoresPage />} />
            <Route path="stores/:id" element={<StoreDetailPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="products/tags" element={<TagListPage />} />
            <Route path="products/ingredients" element={<IngredientsPage />} />
            <Route path="products/ingredients/:id" element={<IngredientDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" />
    </ThemeProvider>
  )
}

export default App
