
import axios from 'axios'

let bearerToken = null
const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
})

api.interceptors.request.use((config) => {
  if (bearerToken) {
    config.headers.Authorization = `Bearer ${bearerToken}`
  }

  return config
})

export function setBearerToken(token) {
  bearerToken = token
}

export default api
