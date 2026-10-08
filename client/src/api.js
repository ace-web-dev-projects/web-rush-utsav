import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({ baseURL, timeout: 10000 })

export const AUTH_TOKEN_KEY = 'web-rush-team-token'
export const ADMIN_TOKEN_KEY = 'web-rush-admin-token'

function attachToken(tokenKey) {
  return (config) => {
    const token = localStorage.getItem(tokenKey)

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  }
}

api.interceptors.request.use(attachToken(AUTH_TOKEN_KEY))

export const adminApi = axios.create({ baseURL, timeout: 10000 })
adminApi.interceptors.request.use(attachToken(ADMIN_TOKEN_KEY))
