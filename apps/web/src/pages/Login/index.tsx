import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { EyeIcon, EyeOffIcon, LogInIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiGet, apiPost } from "@/lib/api"

interface LoginResponse {
  code: number
  data: {
    token: string
    user: {
      id: number
      email: string
      displayName: string
    }
  }
  message: string
}

export default function Login() {
  const navigate = useNavigate()
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<{ code: number; data: { initialized: boolean }; message: string }>("/init/status")
        if (!res.data.initialized) {
          navigate("/initialization", { replace: true })
        }
      } catch {
        // 如果请求失败（如后端未启动），停留在登录页
      } finally {
        setChecking(false)
      }
    })()
  }, [navigate])

  const handleLogin = async () => {
    if (!account || !password) {
      toast.error("请输入账号和密码")
      return
    }

    setLoading(true)

    try {
      const res = await apiPost<LoginResponse>("/auth/login", { account, password })
      if (res.code === 0) {
        toast.success("登录成功")
        sessionStorage.setItem("token", res.data.token)
        navigate("/", { replace: true })
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登录失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card size="sm" className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>请输入您的账号和密码</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="account">账号</Label>
              <Input
                id="account"
                type="text"
                placeholder="请输入账号"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
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
            <Button type="submit" className="mt-2" onClick={handleLogin} disabled={loading}>
              <LogInIcon data-icon="inline-start" />
              {loading ? "登录中..." : "登 录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
