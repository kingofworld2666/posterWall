import axios from 'axios'

// Axios 实例，统一基础配置
const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: false
})

// 可按需添加请求拦截器
http.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// 统一响应处理（只抛错，不做 UI 处理，方便在页面自行提示）
http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export default http


