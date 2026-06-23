import { Routes, Route, Navigate } from "react-router-dom"
import AppLayout from "@/components/layout/AppLayout"
import Login from "@/pages/Login"
import Initialization from "@/pages/Initialization"
import { Toaster } from "@/components/ui/sonner"

function Home() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      Welcome to dextea admin
    </div>
  )
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/initialization" element={<Initialization />} />
        <Route
          path="/"
          element={
            <AppLayout>
              <Home />
            </AppLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
