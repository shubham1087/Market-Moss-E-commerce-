import axios from 'axios'

let bearerToken = null

const api = axios.create({
  baseURL: '/api',
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