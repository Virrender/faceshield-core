import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Automatically attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const register = (email, password) =>
  api.post('/auth/register', { email, password })

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const getMe = () =>
  api.get('/auth/me')

export const submitJob = (formData) =>
  api.post('/jobs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const getJob = (jobId) =>
  api.get(`/jobs/${jobId}`)

export const getHistory = () =>
  api.get('/jobs')

export default api