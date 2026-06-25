import axios from 'axios'
import { toast } from 'sonner'
import { redirectToLogin, redirectToForbidden } from './navigation'

export const API_BASE = 'http://localhost:3001/api/v1'

export const http = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — auto-attach auth token
http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    // 后端在 HTTP 200 上返回业务错误，我们用 reject 让页面 catch 块统一处理
    if (response.data && typeof response.data.code === 'number' && response.data.code !== 0) {
      return Promise.reject(new Error(response.data.message))
    }
    return response
  },

  (error) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401 || (status === 403 && error.response.data?.code === 10103)) {
        toast.error('登录已过期，请重新登录')
        redirectToLogin()
        return Promise.reject(error)
      }
      if (status === 403) {
        redirectToForbidden()
        return Promise.reject(error)
      }
    }

    // 兜底：系统错误或网络异常，不暴露原始错误信息给用户
    toast.error('系统繁忙，请稍后重试')
    return Promise.reject({ code: -1, message: '系统繁忙，请稍后重试', data: null })
  },
)
