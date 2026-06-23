import { Routes, Route, Navigate } from "react-router-dom"
import Login from "@/pages/Login"
import Initialization from "@/pages/Initialization"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/initialization" element={<Initialization />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
