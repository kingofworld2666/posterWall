# PosterWall 海报墙前端

一个基于 Vue 3 + Vite + Element Plus 的海报墙应用，用于浏览、检索与管理影片信息，并集成了个性化推荐与相似推荐功能。

## 功能特性
- 影片列表：分页、排序（发布日期/添加时间/播放次数/评分/随机）、观看状态筛选（全部/已观看/未观看）
- 影片详情：封面大图、基础信息、评分、标签、收藏/稍后观看、115 网盘匹配与播放链接
- 推荐系统：
  - 为你推荐（个性化） `/api/recommendations/for-user`
  - 相似推荐（基于影片） `/api/recommendations/similar/{movieId}`（已在详情页右侧 sidebar 展示）
- 收藏/历史：支持分页、默认按收藏时间倒序，支持取消收藏
- 搜索历史：输入框支持快速展开/选择历史记录
- 组件缓存：对 `DetailView` 启用 `keep-alive`，返回时不重复请求
- 深色主题 + 响应式布局

## 技术栈
- Vue 3、Vue Router 4、Element Plus
- Axios（统一 `/api` 代理）
- Vite（开发/构建）、ESLint（代码质量）

## 本地运行
1. 安装依赖
```bash
npm ci
```
2. 启动开发环境
```bash
npm run dev
```
默认端口 `3000`，已在 `vite.config.js` 中配置了代理：
- `/api`、`/tags`、`/support115`  `http://localhost:8080`

后端 Swagger 文档：`http://localhost:8080/v2/api-docs`

## 构建与预览
```bash
npm run build
npm run preview
```

## 目录结构
```
src/
  components/        可复用组件（MovieGrid 等）
  router/            前端路由
  services/          API 封装（http.js/api.js/recommend.js）
  views/             页面（Home/Detail/Favorite/Recommend 等）
```

## Docker 部署
- 单体容器（Nginx 静态托管）
```bash
docker build -t posterwall:latest .
docker run -p 80:80 --name posterwall posterwall:latest
```
- docker-compose（可与后端编排）
```bash
docker compose up -d
```

## 环境说明
- Node.js  16（建议 18+）
- 后端服务默认 `http://localhost:8080`，可修改 `vite.config.js` 代理或 Nginx 反向代理

## Git 仓库
- SSH：`git@github.com:kingofworld2666/posterWall.git`
- HTTP：`https://github.com/kingofworld2666/posterWall`

## License
MIT