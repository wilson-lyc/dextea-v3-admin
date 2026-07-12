import { useEffect, useState } from "react"
import { KeyRoundIcon, UserIcon } from "lucide-react"
import { toast } from "sonner"

import { getMe, changePassword, type AuthMeResponse } from "@/api"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

type UserInfo = AuthMeResponse["user"]

export default function MePage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // 修改密码表单状态
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [oldError, setOldError] = useState("")
  const [newError, setNewError] = useState("")
  const [confirmError, setConfirmError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getMe()
      .then((res) => {
        if (res.code === 0) {
          setUser(res.data.user)
        } else {
          toast.error(res.message)
        }
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "获取用户信息失败"))
      .finally(() => setLoadingUser(false))
  }, [])

  const resetForm = () => {
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setOldError("")
    setNewError("")
    setConfirmError("")
    setSubmitting(false)
  }

  const handleSubmit = async () => {
    let hasError = false

    if (!oldPassword) {
      setOldError("请输入原密码")
      hasError = true
    } else {
      setOldError("")
    }

    if (!newPassword) {
      setNewError("请输入新密码")
      hasError = true
    } else if (newPassword.length < 6) {
      setNewError("新密码长度不能少于 6 位")
      hasError = true
    } else {
      setNewError("")
    }

    if (!confirmPassword) {
      setConfirmError("请再次输入新密码")
      hasError = true
    } else if (confirmPassword !== newPassword) {
      setConfirmError("两次输入的新密码不一致")
      hasError = true
    } else {
      setConfirmError("")
    }

    if (hasError) return

    setSubmitting(true)
    try {
      const res = await changePassword({ oldPassword, newPassword })
      if (res.code === 0) {
        toast.success("密码修改成功")
        resetForm()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "系统异常，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      {/* 账户信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon data-icon="inline-start" />
            账户信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUser ? (
            <p className="text-sm text-muted-foreground">加载中…</p>
          ) : user ? (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">用户 ID</dt>
                <dd className="mt-1 font-mono text-sm">{user.id}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">用户名</dt>
                <dd className="mt-1 text-sm">{user.displayName}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">邮箱</dt>
                <dd className="mt-1 text-sm">{user.email}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">获取用户信息失败</p>
          )}
        </CardContent>
      </Card>

      {/* 修改密码 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRoundIcon data-icon="inline-start" />
            修改密码
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="py-2">
            <Field data-invalid={!!oldError || undefined}>
              <FieldLabel htmlFor="old-password">
                原密码
              </FieldLabel>
              <Input
                id="old-password"
                type="password"
                placeholder="请输入原密码"
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value)
                  if (oldError) setOldError("")
                }}
                aria-invalid={!!oldError || undefined}
              />
              {oldError && <FieldError>{oldError}</FieldError>}
            </Field>

            <Field data-invalid={!!newError || undefined}>
              <FieldLabel htmlFor="new-password">
                新密码
              </FieldLabel>
              <Input
                id="new-password"
                type="password"
                placeholder="请输入新密码（至少 6 位）"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (newError) setNewError("")
                }}
                aria-invalid={!!newError || undefined}
              />
              {newError && <FieldError>{newError}</FieldError>}
            </Field>

            <Field data-invalid={!!confirmError || undefined}>
              <FieldLabel htmlFor="confirm-password">
                确认新密码
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                placeholder="请再次输入新密码"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (confirmError) setConfirmError("")
                }}
                aria-invalid={!!confirmError || undefined}
              />
              {confirmError && <FieldError>{confirmError}</FieldError>}
            </Field>
          </FieldGroup>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "提交中..." : "保存修改"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
