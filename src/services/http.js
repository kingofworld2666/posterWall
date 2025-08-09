import axios from 'axios'
import { ElMessage } from 'element-plus'

// 说明：
// - 后端统一返回结构：{ code: number, message: string, data: any }
// - code === 1 表示成功，其余均为失败；失败时需要提示 message

// 为全局 axios 设置基础配置（不设置 baseURL，避免与代码中 '/api/xxx' 重复拼接）
axios.defaults.timeout = 15000

// 创建自定义实例（供需要时按需导入）
const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: false
})

// 请求拦截：可在此注入通用 Header（如 Token），当前保持透传
const onRequestFulfilled = (config) => config
const onRequestRejected = (error) => Promise.reject(error)

http.interceptors.request.use(onRequestFulfilled, onRequestRejected)
axios.interceptors.request.use(onRequestFulfilled, onRequestRejected)

// 响应拦截：统一处理后端业务错误与网络错误
const onResponseFulfilled = (response) => {
  try {
    const payload = response?.data
    const isSilent = response?.config?.silent === true
    const skipBusinessCheck = response?.config?.skipBusinessCheck === true
    if (skipBusinessCheck) {
      // 调用方需要自行处理业务 code，直接透传
      return response
    }
    // 仅当后端采用统一包装时才处理；否则保持透传，兼容分页等非包装返回
    if (payload && Object.prototype.hasOwnProperty.call(payload, 'code')) {
      if (payload.code !== 1) {
        // 业务失败：提示后端 message，并中断流程
        const message = payload.message || '请求失败'
        if (!isSilent) {
          ElMessage.error(message)
        }
        return Promise.reject(new Error(message))
      }
    }
  } catch (_) {
    // 忽略解析异常，保持透传
  }
  return response
}

const onResponseRejected = (error) => {
  // 处理 HTTP 错误或网络异常
  const isSilent = error?.config?.silent === true
  const status = error?.response?.status
  const backendMessage = error?.response?.data?.message
  const message = backendMessage
    || (status ? `请求失败（HTTP ${status}）` : (error?.message || '网络异常，请稍后重试'))
  if (!isSilent) {
    ElMessage.error(message)
  }
  return Promise.reject(error)
}

http.interceptors.response.use(onResponseFulfilled, onResponseRejected)
axios.interceptors.response.use(onResponseFulfilled, onResponseRejected)

export default http


