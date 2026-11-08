import { boot } from 'quasar/wrappers'
import axios from 'axios'

// backend
const api = axios.create({
  baseURL: 'http://localhost:3333/api/v1',
  headers: { Accept: 'application/json' },
})

// k poziadavke prida token prihlaseneho pouzivatela
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default boot(({ app }) => {
  app.config.globalProperties.$api = api
})

export { api }