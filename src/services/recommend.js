import { get } from './api'

// 个人推荐
// 后端默认路径示例：/api/recommend/personal
// 如你的真实路径不同，请告诉我或在这里直接修改
export const fetchPersonalRecommends = (params = {}) => get('/recommendations/for-user', params)

// 相似推荐
// 后端默认路径示例：/api/recommend/similar?movieId=xxx
export const fetchSimilarRecommends = (movieId, params = {}) => get(`/recommendations/similar/${movieId}`, params)


