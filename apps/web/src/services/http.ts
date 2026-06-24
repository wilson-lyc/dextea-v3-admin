import axios from 'axios'
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

// Response interceptor — handle auth failures
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        // Token 无效/过期 → 跳转登录页
        redirectToLogin()
      } else if (status === 403) {
        // 权限不足 → 跳转禁止访问页
        redirectToForbidden()
      }
    }
    return Promise.reject(error)
  },
)
