import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { EyeIcon, EyeOffIcon, LogInIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { initSystem } from "@/services"

export default function Initialization() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleInit = async () => {
    if (!email || !password || !displayName) {
      toast.error("请填写所有必填字段")
      return
    }

    setLoading(true)
    try {
      const res = await initSystem({ email, password, displayName })
      if (res.code === 0) {
        toast.success("初始化成功")
        navigate("/login")
      } else {
        toast.error(res.message)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "初始化失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card size="sm" className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>系统初始化</CardTitle>
          <CardDescription>请设置管理员账号信息</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleInit()
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">显示名称</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="请输入显示名称"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="mt-2" disabled={loading}>
              <LogInIcon data-icon="inline-start" />
              {loading ? "初始化中..." : "初 始 化"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
