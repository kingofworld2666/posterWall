import http from './http'

// 通用 REST 方法
export const get = (url, params) => http.get(url, { params })
export const post = (url, data) => http.post(url, data)
export const put = (url, data) => http.put(url, data)
export const del = (url) => http.delete(url)

// 在这里快速登记你的新接口
// 示例：export const fetchSomething = (params) => get('/something', params)

// 占位：请把下面两个函数替换成你的真实后端路径与参数
export const newApiOne = (params) => get('/your-new-api-one', params)
export const newApiTwo = (data) => post('/your-new-api-two', data)

// 现有项目中常用接口也可以逐步迁移进来，便于管理
export const fetchMovieDetail = (id) => get(`/movies/${id}`)
export const updateMovie = (payload) => post('/movies', payload)
export const uploadPoster = (id, formData) => http.post(`/movies/${id}/poster`, formData)
export const toggleWatchLaterApi = (id, data) => put(`/movies/${id}/watchlater`, data)
export const deleteMovieApi = (id) => del(`/movies/${id}`)


