import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const api = axios.create({ baseURL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const register = (email, password) => api.post('/auth/register', { email, password })
export const login = (email, password) => api.post('/auth/login', { email, password })
export const getMe = () => api.get('/auth/me')
export const submitJob = (formData) => api.post('/jobs', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getJob = (id) => api.get(`/jobs/${id}`)
export const getHistory = () => api.get('/jobs')

export default api
