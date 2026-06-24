import { ShieldXIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Forbidden() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card size="sm" className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <ShieldXIcon className="mb-2 size-12 text-destructive" />
          <CardTitle>403 - 禁止访问</CardTitle>
          <CardDescription>
            您没有权限访问此页面，请确认账号已登录且有足够权限。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate("/")}>
            返回首页
          </Button>
          <Button onClick={() => navigate("/login", { replace: true })}>
            重新登录
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
