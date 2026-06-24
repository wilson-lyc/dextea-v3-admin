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

// Response interceptor — handle auth failures
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status
      if ((status === 401) || (status === 403 && error.response.data?.code === 1103)) {
        toast.error('登录已过期，请重新登录')
        redirectToLogin()
      } else if (status === 403) {
        redirectToForbidden()
      }
    }
    return Promise.reject(error)
  },
)
