<template>
  <div
    v-if="movie"
    class="detail-container"
  >
    <h1 class="movie-title">
      {{ movie.titleZh }}
      <div class="title-actions">
        <el-button
          v-if="!isEditing"
          class="edit-btn"
          type="primary"
          plain
          size="small"
          @click="startEditing"
        >
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-button
          v-if="!isEditing"
          class="delete-btn"
          type="danger"
          plain
          size="small"
          @click="confirmDelete"
        >
          <el-icon><Delete /></el-icon>
          删除
        </el-button>
      </div>
    </h1>
    
    <div class="movie-header">
      <div class="poster">
        <div class="poster-container" @click="openPosterFullscreen">
          <el-image
            :src="getImageUrl(isEditing ? editForm.coverPath : movie.coverPath)"
            fit="contain"
            class="movie-poster"
          />
        </div>
        <div class="poster-actions">
          <el-upload
            v-if="isEditing"
            class="upload-poster"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handlePosterChange"
            accept="image/*"
          >
            <el-button
              type="primary"
              size="small"
            >
              <el-icon><Upload /></el-icon>
              更换海报
            </el-button>
          </el-upload>
        </div>
      </div>
      <div class="info">
        <div
          v-if="!isEditing"
          class="meta-info"
        >
          <div class="meta-item">
            <span class="meta-label">番号：</span>
            <span class="meta-value">
              {{ movie.movieCode }}
              <el-button
                class="copy-btn"
                size="small"
                @click="copyToClipboard(movie.movieCode)"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
<!--              按钮点击跳转到网站https://javdb.com/search?q=${movie.movieCode}&f=all-->
              <el-tooltip content="在JavDB搜索" placement="top">
                              <el-link
                  :href="`https://javdb.com/search?q=${movie.movieCode}&f=all`"
                  target="_blank"
                  underline="never"
                  class="icon-link"
                  rel="noopener noreferrer"
              >
                  <el-icon :size="15">
                    <Search />
                  </el-icon>
                </el-link>
              </el-tooltip>

            </span>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">片商：</span>
            <span
              class="meta-value clickable"
              @click="handleTypeClick('studio', movie.studioName)"
            >{{ movie.studioName }}</span>
          </div>
          
          <div
            v-if="movie.series"
            class="meta-item"
          >
            <span class="meta-label">系列：</span>
            <span
              class="meta-value clickable"
              @click="handleTypeClick('series', movie.series)"
            >{{ movie.series }}</span>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">日期：</span>
            <span class="meta-value">{{ movie.releaseDate }}</span>
          </div>

          <div
            v-if="movie.directorName"
            class="meta-item"
          >
            <span class="meta-label">导演：</span>
            <span class="meta-value">{{ movie.directorName }}</span>
          </div>

          <div class="meta-item">
            <span class="meta-label">时长：</span>
            <span class="meta-value">{{ movie.duration }}分钟</span>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">评分：</span>
            <div class="meta-value">
              <el-rate
                v-model="movie.rating"
                :max="5"
                disabled
                show-score
                text-color="#ff9900"
              />
              <span class="rating-count">({{ movie.ratingCount }}人评分)</span>
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">字幕：</span>
            <div class="meta-value">
              <el-tag
                v-if="movie.hasSubtitle"
                type="success"
                size="default"
                effect="dark"
                style="font-size: 16px; padding: 0 12px; height: 32px; line-height: 32px;"
              >
                有字幕
              </el-tag>
              <el-tag
                v-else
                type="info"
                size="default"
                effect="dark"
                style="font-size: 16px; padding: 0 12px; height: 32px; line-height: 32px;"
              >
                无字幕
              </el-tag>
              <span
                v-if="movie.subtitleLanguages"
                class="subtitle-languages"
                style="color: #666; font-size: 16px; margin-left: 4px;"
              >{{ movie.subtitleLanguages }}</span>
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">码数：</span>
            <div class="meta-value">
              <el-tag
                v-if="movie.isUncensored"
                type="danger"
                size="default"
                effect="dark"
                style="font-size: 16px; padding: 0 12px; height: 32px; line-height: 32px;"
              >
                无码
              </el-tag>
              <el-tag
                v-else
                type="info"
                size="default"
                effect="dark"
                style="font-size: 16px; padding: 0 12px; height: 32px; line-height: 32px;"
              >
                有码
              </el-tag>
            </div>
          </div>
          <div class="meta-item">
            <span
              class="meta-label"
              style="cursor: pointer"
              @click="search115Files"
            >115：</span>
            <div class="meta-value">
              <div
                v-if="loading115"
                class="pan115-results"
              >
                <div class="tag-item loading">
                  <el-icon class="is-loading">
                    <Loading />
                  </el-icon>
                  加载中...
                </div>
              </div>
              <div
                v-else-if="needSetCookie"
                class="pan115-results"
              >
                <div
                  class="tag-item error"
                  @click="showCookieInput"
                >
                  <el-icon><Warning /></el-icon>
                  需要设置Cookie
                </div>
              </div>
              <div
                v-else-if="pan115Results.length > 0"
                class="pan115-results"
              >
                <div 
                  v-for="file in pan115Results" 
                  :key="file.pc"
                  class="tag-item"
                  @click="clickPlay(file.pc, movie)"
                >
                  {{ file.name }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 编辑表单 -->
        <div
          v-if="isEditing"
          class="meta-info"
        >
          <div class="meta-item">
            <span class="meta-label">片名：</span>
            <div class="meta-value">
              <el-input
                v-model="editForm.titleZh"
                placeholder="电影片名"
                size="large"
              />
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">番号：</span>
            <div class="meta-value">
              <el-input
                v-model="editForm.movieCode"
                placeholder="电影番号"
                size="large"
              />
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">片商：</span>
            <div class="meta-value">
              <el-input
                v-model="editForm.studioName"
                placeholder="片商名称"
                size="large"
              />
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">系列：</span>
            <div class="meta-value">
              <el-input
                v-model="editForm.series"
                placeholder="系列名称"
                size="large"
              />
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">导演：</span>
            <div class="meta-value">
              <el-input
                v-model="editForm.directorName"
                placeholder="导演名称"
                size="large"
              />
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">发行日期：</span>
            <div class="meta-value">
              <el-date-picker
                v-model="editForm.releaseDate"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                size="large"
              />
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">时长：</span>
            <div class="meta-value">
              <el-input-number
                v-model="editForm.duration"
                :min="1"
                :max="999"
                size="large"
              />
              <span style="margin-left: 5px; font-size: 16px;">分钟</span>
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">评分：</span>
            <div class="meta-value">
              <el-rate
                v-model="editForm.rating"
                :max="5"
                show-score
              />
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">字幕：</span>
            <div class="meta-value">
              <el-switch
                v-model="editForm.hasSubtitle"
                active-text="有字幕"
                inactive-text="无字幕"
                style="font-size: 16px;"
              />
              <el-input
                v-if="editForm.hasSubtitle"
                v-model="editForm.subtitleLanguages"
                placeholder="字幕语言"
                style="margin-left: 10px; width: 200px;"
                size="large"
              />
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">码数：</span>
            <div class="meta-value">
              <el-switch
                v-model="editForm.isUncensored"
                active-text="无码"
                inactive-text="有码"
                style="font-size: 16px;"
              />
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">演员：</span>
            <div class="meta-value">
              <div class="tag-input-container">
                <el-tag
                  v-for="(actor, index) in editForm.actressList"
                  :key="index"
                  class="edit-tag"
                  closable
                  type="danger"
                  effect="plain"
                  @close="removeActress(index)"
                >
                  {{ actor }}
                </el-tag>
                <el-input
                  v-if="inputActressVisible"
                  ref="actressInputRef"
                  v-model="inputActressValue"
                  class="tag-input"
                  size="small"
                  @keyup.enter="handleActressInputConfirm"
                  @blur="handleActressInputConfirm"
                />
                <el-button
                  v-else
                  class="button-new-tag"
                  size="small"
                  @click="showActressInput"
                >
                  + 添加演员
                </el-button>
              </div>
            </div>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">类别：</span>
            <div class="meta-value">
              <div class="tag-input-container">
                <el-tag
                  v-for="(category, index) in editForm.categoryList"
                  :key="index"
                  class="edit-tag"
                  closable
                  effect="plain"
                  @close="removeCategory(index)"
                >
                  {{ category }}
                </el-tag>
                <el-input
                  v-if="inputCategoryVisible"
                  ref="categoryInputRef"
                  v-model="inputCategoryValue"
                  class="tag-input"
                  size="small"
                  @keyup.enter="handleCategoryInputConfirm"
                  @blur="handleCategoryInputConfirm"
                />
                <el-button
                  v-else
                  class="button-new-tag"
                  size="small"
                  @click="showCategoryInput"
                >
                  + 添加类别
                </el-button>
              </div>
            </div>
          </div>
          
          <div
            class="action-buttons"
            style="margin-top: 20px;"
          >
            <el-button
              type="success"
              size="large"
              @click="saveChanges"
            >
              保存
            </el-button>
            <el-button
              size="large"
              @click="cancelEditing"
            >
              取消
            </el-button>
          </div>
        </div>

        <div
          v-if="!isEditing"
          class="tags-section"
        >
          <div class="meta-item">
            <span class="meta-label">演员：</span>
            <div class="meta-value">
              <el-tag
                v-for="actor in movie.actressNames.split(',')"
                :key="actor"
                class="clickable-tag"
                type="danger"
                effect="plain"
                size="default"
                @click="handleTypeClick('actress', actor)"
              >
                <strong>{{ actor }}</strong>
              </el-tag>
            </div>
          </div>

          <div class="meta-item categories-section">
            <span class="meta-label">类别：</span>
            <div class="meta-value">
              <el-tag
                v-for="category in movie.categoryNames.split(',')"
                :key="category"
                class="clickable-tag"
                size="default"
                effect="plain"
                @click="handleTypeClick('category', category)"
              >
                <strong>{{ category }}</strong>
              </el-tag>
            </div>
          </div>

          <div class="action-buttons">
            <el-button
              type="danger"
              :icon="movie.isFavorite ? 'StarFilled' : 'Star'"
              size="large"
              plain
              @click="toggleFavorite(movie)"
            >
              {{ movie.isFavorite ? '已收藏' : '收藏' }}
            </el-button>
            <el-button
              type="primary"
              :icon="movie.isWatchLater ? 'Clock' : 'Timer'"
              size="large"
              plain
              @click="toggleWatchLater"
            >
              {{ movie.isWatchLater ? '已加入稍后观看' : '稍后观看' }}
            </el-button>
          </div>
        </div>

        <div
          v-if="!isEditing"
          class="description"
        >
          <p>{{ movie.description }}</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>视频标签</h2>
      <div class="video-tags">
        <div v-if="loadingTags" class="no-tags">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>加载中...</p>
        </div>
        <div v-else-if="videoTags.length === 0" class="no-tags">
          <p>暂无视频标签</p>
        </div>
        <div v-else class="tags-grid">
          <div
            v-for="tag in videoTags"
            :key="tag.id"
            class="tag-item"
            @click="openFullscreen(tag)"
          >
            <div class="tag-image">
              <!-- 使用后端返回的 screenshotUrl，并通过 getImageUrl 转为可访问的静态资源 URL -->
              <img
                :src="getImageUrl(tag.screenshotUrl)"
                :alt="tag.text"
                class="screenshot"
                @error="handleTagImageError($event)"
              />
              <div class="tag-overlay">
                <div class="tag-text">{{ tag.text }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧相似推荐（类似B站右侧推荐） -->
    <div
      v-if="(loadingSimilar || similarMoviesGrid.length) && !isFullscreen && !isPosterFullscreen"
      class="recommend-sidebar"
    >
      <div class="sidebar-header">相关推荐</div>
      <MovieGrid
        :movies="similarMoviesGrid"
        :loading="loadingSimilar"
        :get-image-url="getImageUrl"
        :placeholder-count="0"
        @movie-click="goToDetail"
      />
    </div>

    <!-- 全屏显示模态框 -->
    <div 
      v-if="isFullscreen" 
      class="fullscreen-modal"
      @click="closeFullscreen"
    >
      <div class="fullscreen-content">
        <!-- 左切换按钮 -->
        <div 
          v-if="videoTags.length > 1"
          class="nav-button nav-prev"
          :class="{ 'disabled': isNavigating }"
          @click.stop="previousImage"
            >
          <el-icon><ArrowLeft /></el-icon>
        </div>
        
        <!-- 图片 -->
        <!-- 全屏预览同样使用 screenshotUrl 配合 getImageUrl 渲染 -->
        <img 
          :src="getImageUrl(fullscreenTag.screenshotUrl)"
          :alt="fullscreenTag.text"
          class="fullscreen-image"
          @click="closeFullscreen"
          @dragstart.prevent
          @error="handleTagImageError($event)"
        />
        
        <!-- 右切换按钮 -->
        <div 
          v-if="videoTags.length > 1"
          class="nav-button nav-next"
          :class="{ 'disabled': isNavigating }"
          @click.stop="nextImage"
        >
          <el-icon><ArrowRight /></el-icon>
              </div>
        
        <!-- 图片信息叠加层 -->
        <div class="fullscreen-overlay">
          <div class="fullscreen-text">{{ fullscreenTag.text }}</div>
          <div class="fullscreen-timestamp">{{ formatTimestamp(fullscreenTag.timestamp) }}</div>
        </div>
        
        <!-- 图片计数器 -->
        <div v-if="videoTags.length > 1" class="image-counter">
          {{ currentImageIndex + 1 }} / {{ videoTags.length }}
        </div>
      </div>
    </div>

    <!-- 封面全屏显示模态框 -->
    <div 
      v-if="isPosterFullscreen" 
      class="fullscreen-modal"
      @click="closePosterFullscreen"
    >
      <div class="fullscreen-content">
        <!-- 封面图片 -->
        <img 
          :src="getImageUrl(movie.coverPath)"
          :alt="movie.titleZh"
          class="fullscreen-image"
          @click="closePosterFullscreen"
          @dragstart.prevent
        />
        
        <!-- 图片信息叠加层 -->
        <div class="fullscreen-overlay">
          <div class="fullscreen-text">{{ movie.titleZh }}</div>
          <div class="fullscreen-timestamp">{{ movie.movieCode }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount, watch, computed } from 'vue'
// 确保 keep-alive include 能命中本组件
defineOptions({ name: 'DetailView' })
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Edit, CopyDocument, Star, StarFilled, Clock, Timer, VideoPlay, Loading, Warning, Delete, Search, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import axios from 'axios'
import App from "@/App.vue";
import MovieGrid from '@/components/MovieGrid.vue'

const route = useRoute()
const router = useRouter()
const movie = ref(null)
const recommendations = ref([])  
const videoTags = ref([])  // 添加视频标签数组
const loadingTags = ref(false)
const isEditing = ref(false)
const isFullscreen = ref(false)  // 全屏状态
const fullscreenTag = ref(null)  // 当前全屏显示的标签
const currentImageIndex = ref(0)  // 当前图片索引
const isNavigating = ref(false)  // 导航状态，防止快速连续操作
const isPosterFullscreen = ref(false)  // 封面全屏状态
const editForm = ref({
  actressList: [],
  categoryList: []
})
const inputActressVisible = ref(false)
const inputActressValue = ref('')
const actressInputRef = ref(null)
const inputCategoryVisible = ref(false)
const inputCategoryValue = ref('')
const categoryInputRef = ref(null)
const loading115 = ref(false)
const pan115Results = ref([])
const needSetCookie = ref(false)
const hostAdd = 'http://localhost:8080'

// 相似推荐加载状态
const loadingSimilar = ref(false)

const getImageUrl = (path) => {
  // 通用图片地址处理：支持 http、/api、Windows 本地绝对路径（含 tag/patu 目录）、以及 success\ 相对路径
  if (!path) return ''

  // 远程 URL 原样返回
  if (path.startsWith('http')) return path

  // 已是可访问静态资源路径
  if (path.startsWith('/api/images/')) return path

  // 优先处理历史的 success\ 相对路径逻辑（可能需要保留子目录结构）
  const successPart = path.split('success\\')[1]
  if (successPart) {
    return `/api/images/${successPart.replace(/\\/g, '/')}`
  }

  // 统一将反斜杠转为正斜杠，便于后续判断与切分
  const normalized = path.replace(/\\/g, '/')

  // 处理本地绝对路径：例如 E:/tag/xxx.jpg 或 E:/patu/xxx.jpg
  // 规则：取文件名并映射为 /api/images/{fileName}（文件名进行 URL 编码，避免中文/空格出错）
  const isWindowsAbs = /^[a-zA-Z]:\//.test(normalized)
  if (isWindowsAbs || normalized.includes('/tag/') || normalized.includes('/patu/')) {
    const fileName = normalized.split('/').pop()
    return fileName ? `/api/images/${encodeURIComponent(fileName)}` : ''
  }

  // 兜底：若传入的是相对文件名或其它可解析形式，尝试按文件名映射
  const fallbackName = normalized.split('/').pop()
  return fallbackName ? `/api/images/${encodeURIComponent(fallbackName)}` : ''
}

// 标签图片加载失败兜底处理：
// 1）若文件名被编码导致后端无法命中，尝试用未编码文件名重试一次
// 2）防止死循环，成功重试前先移除 onerror 绑定
const handleTagImageError = (event) => {
  try {
    const imgEl = event?.target
    if (!imgEl || !imgEl.src) return
    const currentUrl = new URL(imgEl.src, window.location.origin)
    const segments = currentUrl.pathname.split('/')
    const last = segments.pop() || ''
    const decoded = decodeURIComponent(last)
    if (decoded !== last) {
      segments.push(decoded)
      currentUrl.pathname = segments.join('/')
      // 避免重试仍失败导致的无限触发
      imgEl.onerror = null
      imgEl.src = currentUrl.toString()
    }
  } catch (e) {
    // 忽略兜底错误
  }
}

// （重复定义已移除）

// 将推荐项映射为 MovieGrid 需要的字段
const toGridItem = (rec) => {
  const m = rec?.movie || rec || {}
  return {
    id: String(m.id ?? ''),
    movieCode: m.movieCode || '',
    posterPath: m.posterPath || m.coverPath || '',
    playCount: m.playCount || 0,
    titleZh: m.titleZh || m.titleJa || m.movieCode || '',
    titleJa: m.titleJa || '',
    favoriteTime: undefined,
    historyTime: undefined
  }
}

// 兼容不同返回包装
const extractList = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.content)) return payload.content
  if (Array.isArray(payload.data)) return payload.data
  if (payload.data && Array.isArray(payload.data.content)) return payload.data.content
  if (payload.data && Array.isArray(payload.data.recommendations)) return payload.data.recommendations
  if (Array.isArray(payload.recommendations)) return payload.recommendations
  if (Array.isArray(payload.records)) return payload.records
  return []
}

// 全量展示推荐（不分页、不滚动加载）
const similarMoviesGrid = computed(() => (recommendations.value || []).map(toGridItem))

const loadMovieDetail = async () => {
  try {
    if (!route.params.id) return
    
    const response = await fetch(`/api/movies/${route.params.id}`)
    if (!response.ok) {
      throw new Error('加载失败')
    }
    movie.value = await response.json()
    search115Files() // 在电影信息加载完成后搜索
  } catch (error) {
    console.error('加载电影详情失败:', error)
    ElMessage.error('加载电影详情失败')
  }
}

const startEditing = () => {
  editForm.value = {
    ...movie.value,
    coverPath: movie.value.coverPath,
    actressList: movie.value.actressNames.split(','),
    categoryList: movie.value.categoryNames.split(','),
    directorName: movie.value.directorName
  }
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editForm.value = {
    actressList: [],
    categoryList: []
  }
}

const saveChanges = async () => {
  try {
    // 将标签列表转换为逗号分隔的字符串
    const formData = {
      ...editForm.value,
      actressNames: editForm.value.actressList.join(','),
      categoryNames: editForm.value.categoryList.join(',')
    }
    
    const response = await fetch(`/api/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const updatedMovie = await response.json()
    movie.value = updatedMovie
    isEditing.value = false
    editForm.value = {
      actressList: [],
      categoryList: []
    }
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败');
  }
}

const handlePosterChange = async (file) => {
  if (!file) return
  
  const formData = new FormData()
  formData.append('file', file.raw)
  
  try {
    const response = await fetch(`/api/movies/${movie.value.id}/poster`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('上传失败')
    }
    
    const result = await response.json()
    editForm.value.coverPath = result.posterUrl
    ElMessage.success('海报上传成功')
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败')
  }
}

const handleTypeClick = async (type, keyword) => {
  router.push({
    name: 'home',
    query: { 
      type,
      keyword
    }
  })
}

// 复制到剪贴板通用实现（含降级方案）
const copyToClipboard = async (text) => {
  try {
    const content = String(text ?? '')
    if (!content) {
      ElMessage.warning('无可复制内容')
      return
    }

    if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(content)
      ElMessage.success('已复制到剪贴板')
      return
    }

    // 回退：textarea + execCommand
    const textarea = document.createElement('textarea')
    textarea.value = content
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-10000px'
    textarea.style.left = '-10000px'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)
    const ok = document.execCommand && document.execCommand('copy')
    document.body.removeChild(textarea)
    if (ok) {
      ElMessage.success('已复制到剪贴板')
      return
    }

    // 最后兜底：IE API
    if (window.clipboardData && typeof window.clipboardData.setData === 'function') {
      window.clipboardData.setData('Text', content)
      ElMessage.success('已复制到剪贴板')
      return
    }

    throw new Error('无法复制：未检测到可用的复制实现')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

const showActressInput = () => {
  inputActressVisible.value = true
  nextTick(() => {
    actressInputRef.value.input.focus()
  })
}

const handleActressInputConfirm = () => {
  if (inputActressValue.value) {
    editForm.value.actressList.push(inputActressValue.value)
  }
  inputActressVisible.value = false
  inputActressValue.value = ''
}

const removeActress = (index) => {
  editForm.value.actressList.splice(index, 1)
}

const showCategoryInput = () => {
  inputCategoryVisible.value = true
  nextTick(() => {
    categoryInputRef.value.input.focus()
  })
}

const handleCategoryInputConfirm = () => {
  if (inputCategoryValue.value) {
    editForm.value.categoryList.push(inputCategoryValue.value)
  }
  inputCategoryVisible.value = false
  inputCategoryValue.value = ''
}

const removeCategory = (index) => {
  editForm.value.categoryList.splice(index, 1)
}

const loadRecommendations = async () => {
  try {
    if (!route.params.id) return
    
    loadingSimilar.value = true
    const { data } = await axios.get(`/api/recommendations/similar/${route.params.id}`, { params: { limit: 20 } })
    const list = extractList(data)
    recommendations.value = list
    // eslint-disable-next-line no-console
    console.log('[Detail] similar raw/list:', data, list)
  } catch (error) {
    console.error('加载推荐失败:', error)
  } finally {
    loadingSimilar.value = false
  }
}

// 加载视频标签
const loadVideoTags = async () => {
  try {
    if (!route.params.id) return
    loadingTags.value = true
    const response = await fetch(`/tags/movie/${route.params.id}`)
    if (!response.ok) {
      throw new Error('加载失败')
    }
    const data = await response.json()
    videoTags.value = data
  } catch (error) {
    console.error('加载视频标签失败:', error)
  } finally {
    loadingTags.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/detail/${id}`)
}

// 格式化时间戳为时分秒格式
const formatTimestamp = (timestamp) => {
  const hours = Math.floor(timestamp / 3600)
  const minutes = Math.floor((timestamp % 3600) / 60)
  const seconds = Math.floor(timestamp % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

// 打开全屏显示
const openFullscreen = (tag) => {
  const index = videoTags.value.findIndex(t => t.id === tag.id)
  currentImageIndex.value = index >= 0 ? index : 0
  fullscreenTag.value = tag
  isFullscreen.value = true
  // 禁用页面滚动
  document.body.style.overflow = 'hidden'
}

// 关闭全屏显示
const closeFullscreen = () => {
  isFullscreen.value = false
  fullscreenTag.value = null
  currentImageIndex.value = 0
  isNavigating.value = false  // 重置导航状态
  // 恢复页面滚动
  document.body.style.overflow = 'auto'
}

// 上一张图片
const previousImage = () => {
  // 防止快速连续操作
  if (isNavigating.value || videoTags.value.length <= 1) return
  
  isNavigating.value = true
  currentImageIndex.value = currentImageIndex.value > 0 
    ? currentImageIndex.value - 1 
    : videoTags.value.length - 1
  fullscreenTag.value = videoTags.value[currentImageIndex.value]
  
  // 200ms后重置导航状态
  setTimeout(() => {
    isNavigating.value = false
  }, 200)
}

// 下一张图片
const nextImage = () => {
  // 防止快速连续操作
  if (isNavigating.value || videoTags.value.length <= 1) return
  
  isNavigating.value = true
  currentImageIndex.value = currentImageIndex.value < videoTags.value.length - 1 
    ? currentImageIndex.value + 1 
    : 0
  fullscreenTag.value = videoTags.value[currentImageIndex.value]
  
  // 200ms后重置导航状态
  setTimeout(() => {
    isNavigating.value = false
  }, 200)
}

// 打开封面全屏显示
const openPosterFullscreen = () => {
  isPosterFullscreen.value = true
  // 禁用页面滚动
  document.body.style.overflow = 'hidden'
}

// 关闭封面全屏显示
const closePosterFullscreen = () => {
  isPosterFullscreen.value = false
  // 恢复页面滚动
  document.body.style.overflow = 'auto'
}

// 监听键盘事件
const handleKeydown = (event) => {
  if (isFullscreen.value) {
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        closeFullscreen()
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (!isNavigating.value) {
          previousImage()
        }
        break
      case 'ArrowRight':
        event.preventDefault()
        if (!isNavigating.value) {
          nextImage()
        }
        break
    }
  } else if (isPosterFullscreen.value) {
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        closePosterFullscreen()
        break
    }
  }
}

const toggleFavorite = async (movie) => {

  try {
    if(movie.isFavorite){
      const response = await fetch(`/api/favorites/movies/${movie.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('操作失败')
      }
      movie.isFavorite = 0
    } else{
      const favorite = { "movieId":  movie.id, "movieCode": movie.movieCode}
      const response = await fetch(`/api/favorites/movies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(favorite)
      })

      if (!response.ok) {
        throw new Error('操作失败')
      }
      movie.isFavorite = 1
    }

  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error('操作失败')
  }
}

const toggleWatchLater = async () => {
  try {
    const newState = !movie.value.isWatchLater
    const response = await fetch(`/api/movies/${movie.value.id}/watchlater`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isWatchLater: newState })
    })
    
    if (!response.ok) {
      throw new Error('操作失败')
    }
    
    movie.value.isWatchLater = newState
    ElMessage.success(newState ? '已添加到稍后观看' : '已从稍后观看移除')
  } catch (error) {
    console.error('稍后观看操作失败:', error)
    ElMessage.error('操作失败')
  }
}

const handlePlay = () => {
  // TODO: 调用播放功能
  ElMessage.success('开始播放')
}

const showCookieInput = async () => {
  const result = await ElMessageBox.prompt(
    '请先登录115网盘，然后复制cookie到这里',
    '设置115网盘Cookie',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '在115网盘网站登录后，按F12打开开发者工具，在Console中输入 document.cookie 获取'
    }
  ).catch(() => null)

  if (!result) return

  try {
    const cookieResp = await axios.post(`/api/115/cookie`, {
      cookie: result.value.trim()
    }, { silent: true })
    
    if (cookieResp.data.code === 0) {
      throw new Error(cookieResp.data.message || 'Cookie设置失败')
    }

    needSetCookie.value = false
    search115Files()
  } catch (error) {
    console.error('设置cookie错误:', error)
    ElMessage.error(error.message || 'Cookie设置失败')
  }
}

const search115Files = async () => {
  if (!movie.value?.movieCode || !movie.value?.id) {
    ElMessage.warning('没有找到影片信息')
    return
  }
  
  loading115.value = true
  needSetCookie.value = false
  try {
    const videoCode = movie.value.movieCode
    const resp = await axios.get(`/api/115/search`, {
      params: {
        videoCode: videoCode,
        movieId: movie.value.id
      },
      // 静默并跳过统一业务码拦截，手动判断 code 以处理 201 场景
      silent: true,
      skipBusinessCheck: true
    })

    const code = resp?.data?.code
    if (code === 201) {
      // 201 表示 Cookie 失效：显示“需要设置Cookie”的按钮
      needSetCookie.value = true
      pan115Results.value = []
      return
    }
    if (code !== 1) {
      // 其他业务失败：给出后端 message 提示
      ElMessage.error(resp?.data?.message || '搜索失败')
      pan115Results.value = []
      return
    }

    const searchResults = resp.data.data || []
    const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.m2ts', '.wmv']
    
    pan115Results.value = searchResults.filter(result => 
      result.fid && 
      result.n && 
      result.n.toLowerCase().includes(videoCode.toLowerCase()) && 
      videoExtensions.some(ext => result.n.toLowerCase().endsWith(ext))
    ).map(item => ({
      name: item.n,
      size: formatFileSize(item.s),
      pc: item.pc
    }))


  } catch (error) {
    console.error('115搜索出错：', error)
    ElMessage.error(error.message || '搜索失败')
  } finally {
    loading115.value = false
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

const copy115Link = async (pickCode) => {
  const link = `https://115.com/?ct=pick&ac=link&k=${pickCode}`
  try {
    await navigator.clipboard.writeText(link)
    ElMessage.success('链接已复制到剪贴板')
  } catch (err) {
    console.error('复制失败：', err)
    ElMessage.error('复制失败')
  }
}

const clickPlay = (pc, movie) => {
  axios.get(`/api/play-history/save/${movie.id}`, { silent: true })
  // 打开播放页面
  window.open(`https://115vod.com/?pickcode=${pc}&share_id=0`);
}

const confirmDelete = () => {
  ElMessageBox.confirm(
    '确定要删除这部电影吗？此操作不可恢复。',
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      deleteMovie()
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const deleteMovie = async () => {
  try {
    const response = await fetch(`/api/movies/${movie.value.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('删除失败')
    }
    
    ElMessage.success('删除成功')
    // 删除成功后返回首页，并通知首页刷新列表
    // 使用 localStorage 标记仅在本次返回时刷新（不影响其他返回场景）
    try { localStorage.setItem('homeNeedsRefresh', '1') } catch (_) {}
    router.push('/')
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// watch(() => route.params.id, (newId, oldId) => {
//   if (newId !== oldId) {
//     isEditing.value = false
//     editForm.value = {
//       actressList: [],
//       categoryList: []
//     }
//     loadMovieDetail()
//     loadRecommendations()
//     loadVideoTags()  // 重新加载视频标签
//   }
// })

onBeforeUnmount(() => {
  isEditing.value = false
  editForm.value = {
    actressList: [],
    categoryList: []
  }
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeydown)
  // 如果组件卸载时还在全屏状态，恢复页面滚动
  if (isFullscreen.value) {
    document.body.style.overflow = 'auto'
  }
})

onMounted(() => {
  // 仅第一次挂载加载数据，保留 keep-alive 缓存返回时不重复请求
  if (!movie.value) {
    // 并行触发，避免推荐接口延迟
    loadRecommendations()
    Promise.allSettled([
      loadMovieDetail(),
      loadVideoTags()
    ])
  }
  isEditing.value = false
  editForm.value = {
    actressList: [],
    categoryList: []
  }
  document.addEventListener('keydown', handleKeydown)
})

// 监听路由变更，刷新详情与相似推荐
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      isEditing.value = false
      editForm.value = { actressList: [], categoryList: [] }
      // 清空推荐并进入加载状态，避免显示上一次的推荐
      recommendations.value = []
      loadingSimilar.value = true
      // 立即触发推荐接口，不等待详情/标签
      const recommendPromise = loadRecommendations()
      // 详情与标签并行加载
      const detailAndTags = Promise.allSettled([
        loadMovieDetail(),
        loadVideoTags()
      ])
      await Promise.allSettled([recommendPromise, detailAndTags])
      // 回到顶部
      const mainElement = document.querySelector('.el-main')
      if (mainElement) mainElement.scrollTop = 0
    }
  }
)
</script>

<style lang="scss" scoped>



// Element Plus 组件在黑色背景下的适配
:deep(.el-input__wrapper) {
  background-color: #1a1a1a;
  border: 1px solid #444;
  color: #fff;
}

:deep(.el-input__inner) {
  color: #fff;
  background-color: transparent;
}

:deep(.el-textarea__inner) {
  background-color: #1a1a1a;
  border: 1px solid #444;
  color: #fff;
}

:deep(.el-button) {
  border-color: #444;
  background-color: #1a1a1a;
  color: #fff;
}

:deep(.el-button:hover) {
  background-color: #333;
  border-color: #666;
  color: #fff;
}

:deep(.el-button--primary) {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

:deep(.el-button--primary:hover) {
  background-color: #337ecc;
  border-color: #337ecc;
  color: #fff;
}

:deep(.el-button--danger) {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: #fff;
}

:deep(.el-button--danger:hover) {
  background-color: #f78989;
  border-color: #f78989;
  color: #fff;
}

:deep(.el-button.is-plain) {
  background-color: transparent;
  color: #fff;
  border-color: #444;
}

:deep(.el-button--primary.is-plain) {
  background-color: transparent;
  color: #409eff;
  border-color: #409eff;
}

:deep(.el-button--primary.is-plain:hover) {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

:deep(.el-button--danger.is-plain) {
  background-color: transparent;
  color: #f56c6c;
  border-color: #f56c6c;
}

:deep(.el-button--danger.is-plain:hover) {
  background-color: #f56c6c;
  color: #fff;
  border-color: #f56c6c;
}

:deep(.el-date-picker) {
  background-color: #1a1a1a;
}

:deep(.el-popper) {
  background-color: #1a1a1a !important;
  border: 1px solid #444 !important;
}

:deep(.el-picker-panel) {
  background-color: #1a1a1a !important;
  border: 1px solid #444 !important;
  color: #fff !important;
}

:deep(.el-date-table td) {
  color: #fff !important;
}

:deep(.el-date-table td.available:hover) {
  background-color: #333 !important;
  color: #fff !important;
}

:deep(.el-picker__popper) {
  background-color: #1a1a1a !important;
  border: 1px solid #444 !important;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background-color: #1a1a1a;
  border-color: #444;
  color: #fff;
}

:deep(.el-input-number__decrease:hover),
:deep(.el-input-number__increase:hover) {
  background-color: #333;
  color: #fff;
}

:deep(.el-input-number .el-input__wrapper) {
  background-color: #1a1a1a;
}

:deep(.el-switch__label) {
  color: #fff;
}

:deep(.el-tag) {
  background-color: #2a2a2a;
  border-color: #444;
  color: #fff;
}

:deep(.el-tag.el-tag--primary) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-tag.el-tag--success) {
  background-color: #67c23a;
  border-color: #67c23a;
}

:deep(.el-tag.el-tag--danger) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

:deep(.el-tag.el-tag--info) {
  background-color: #909399;
  border-color: #909399;
}

:deep(.el-rate) {
  color: #ff9900;
}

:deep(.el-rate__text) {
  color: #fff;
}

:deep(.el-upload) {
  background-color: transparent;
}



:deep(.el-message-box) {
  background-color: #1a1a1a;
  border: 1px solid #444;
}

:deep(.el-message-box__title) {
  color: #fff;
}

:deep(.el-message-box__content) {
  color: #fff;
}

:deep(.el-overlay) {
  background-color: rgba(0, 0, 0, 0.8);
}

:deep(.el-image__preview) {
  background-color: rgba(0, 0, 0, 0.95);
}

// 确保所有可能的白色背景都被覆盖
:deep(.el-scrollbar__view) {
  background-color: #000;
}

:deep(.el-select-dropdown) {
  background-color: #1a1a1a !important;
  border: 1px solid #444 !important;
}

:deep(.el-select-dropdown__item) {
  color: #fff !important;
  background-color: #1a1a1a !important;
}

:deep(.el-select-dropdown__item:hover) {
  background-color: #333 !important;
}

:deep(.el-tooltip__popper) {
  background-color: #1a1a1a !important;
  border: 1px solid #444 !important;
  color: #fff !important;
}

:deep(.el-loading-mask) {
  background-color: rgba(0, 0, 0, 0.8) !important;
}

:deep(.el-loading-spinner) {
  color: #fff !important;
}

// DetailView 专用样式

.detail-container {
  /* 响应式右侧栏宽度变量（略放大） */
  --sidebar-width: min(340px, 23vw);
  padding: clamp(12px, 2.5vw, 28px);
  max-width: 1800px;
  margin: 0 auto 0 0; /* 左对齐，右侧自适应 */
  background-color: #000;
  min-height: 100vh;
  color: #fff;
  position: relative;
}



.movie-title {
  font-size: 28px;
  color: #fff;
  margin-bottom: 24px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;

  .title-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
    
    .el-button {
      background-color: #1a1a1a;
      border-color: #444;
      color: #fff;
    }
    
    .el-button:hover {
      background-color: #333;
      border-color: #666;
      color: #fff;
    }
    
    .el-button--primary.is-plain {
      background-color: transparent;
      color: #409eff;
      border-color: #409eff;
    }
    
    .el-button--primary.is-plain:hover {
      background-color: #409eff;
      color: #fff;
      border-color: #409eff;
    }
    
    .el-button--danger.is-plain {
      background-color: transparent;
      color: #f56c6c;
      border-color: #f56c6c;
    }
    
    .el-button--danger.is-plain:hover {
      background-color: #f56c6c;
      color: #fff;
      border-color: #f56c6c;
    }
  }
}

.movie-header {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
  flex-wrap: wrap; /* 宽度不足时换行，避免遮挡 */

  .poster {
    flex: 0 0 auto;
    position: relative;
    cursor: pointer;
    
    /* 海报列允许收缩，最小360px，中位55vw，最大1200px（自适应放大） */
    flex: 0 1 clamp(300px, 55vw, 1200px);

    .poster-container {
      width: 100%;
      max-width: 1200px;
      /* 使用图片原始比例自适应高度，避免与右侧信息视觉不匹配 */
      /* 在大屏下限制最大高度，防止溢出 */
      max-height: calc(100vh - 220px);
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #000; /* 避免出现白边 */
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #333;
      transition: all 0.3s ease;
      cursor: pointer;
      
      &:hover {
        border-color: #409eff;
        box-shadow: 0 4px 20px rgba(64, 158, 255, 0.3);
        transform: scale(1.02);
      }
    }

    .movie-poster {
      width: 100%;
      height: auto; /* 以图片原始比例决定高度，避免拉伸 */
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    }

    .el-image {
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .play-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
      border-radius: 8px;

      .play-icon {
        font-size: 64px;
        color: #fff;
      }
    }

    &:hover {
      .play-overlay {
        opacity: 1;
      }
    }
    
    .poster-actions {
      .el-button {
        background-color: #1a1a1a;
        border-color: #444;
        color: #fff;
      }
      
      .el-button:hover {
        background-color: #333;
        border-color: #666;
        color: #fff;
      }
    }
  }

  .info {
    flex: 1 1 360px; /* 可收缩生长，至少360px */

    .meta-info {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .meta-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;

        .meta-label {
          font-size: 16px;
          color: #fff;
          min-width: 56px;
          font-weight: bold;
        }

        .meta-value {
          font-size: 16px;
          color: #fff;
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;

          :deep(.el-tag) {
            font-size: 16px;
            padding: 0 12px;
            height: 32px;
            line-height: 32px;
          }

          .copy-btn {
            padding: 4px;
            height: 28px;
            
            :deep(.el-icon) {
              font-size: 16px;
            }
          }

          &.clickable {
            cursor: pointer;
            font-weight: bold;
            color: #409eff;
            
            &:hover {
              text-decoration: underline;
            }
          }

          .rating-count {
            color: #ccc;
            font-size: 16px;
          }

          .subtitle-languages {
            color: #ccc;
            font-size: 16px;
            margin-left: 4px;
          }
        }
      }
    }
  }
}

/* 宽屏下强制并排：左侧封面，右侧信息 */
@media (min-width: 1280px) {
  .movie-header {
    flex-wrap: nowrap;
    align-items: stretch; /* 让左右两列同高 */
  }
  .movie-header .poster {
    flex: 0 0 calc(100% - 392px); /* 预留信息区360 + 间距32 */
    max-width: calc(100% - 392px);
    min-width: 520px; /* 宽屏下给海报一个更舒适的下限 */
  }
  .movie-header .poster .poster-container {
    max-width: 100%;
    height: 100%; /* 随信息区高度自适应 */
    max-height: none; /* 取消上面的高度上限，跟随信息区 */
  }
  .movie-header .info {
    flex: 0 0 360px;
    max-width: 360px;
  }
  .movie-header .poster .movie-poster {
    width: auto;   /* 以高度为主，保持比例 */
    height: 100%;  /* 与信息区等高 */
    object-fit: contain;
  }
}

// 右侧推荐栏样式
.recommend-sidebar {
  position: absolute; /* 跟随页面整体滚动 */
  top: 80px;
  right: clamp(16px, 2vw, 32px); /* 预留一定右侧间隔 */
  width: var(--sidebar-width);
  /* 固定高度，取消内部滚动 */
  max-height: none;
  overflow: hidden;
  background: rgba(0,0,0,0.6);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px 8px;
  z-index: 20;
}

.recommend-sidebar .sidebar-header {
  font-weight: bold;
  font-size: 16px;
  padding: 4px 8px 8px;
}

// 收窄 MovieGrid 卡片以适配侧栏宽度
:deep(.recommend-sidebar .movie-grid) {
  /* 侧栏使用两列小缩略图，稍微再大一些 */
  grid-template-columns: repeat(2, minmax(160px, 1fr)) !important;
  gap: 10px !important;
  padding: 8px !important;
}

:deep(.recommend-sidebar .movie-card) {
  margin: 0 !important;
}

/* 当侧栏展示时，为主容器预留空间，避免遮挡 */
@media (min-width: 1024px) {
  .detail-container {
    padding-right: calc(var(--sidebar-width) + 40px);
  }
}

/* 统一去掉 el-image 默认浅色背景，避免白边 */
:deep(.el-image),
:deep(.el-image__inner) {
  background: transparent !important;
}

@media (max-width: 1280px) {
  .recommend-sidebar { display: none; }
  .detail-container { padding-right: 20px; }
}

.description {
  margin-top: 20px;
  padding: 16px;
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;

  p {
    color: #fff;
    line-height: 1.6;
    margin: 0;
    font-size: 16px;
  }
}

.edit-form {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  
  .el-form-item {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
  }
  
  .el-form-item__label {
    width: 100px;
    font-weight: bold !important;
    font-size: 16px !important;
    color: #fff;
  }
  
  .el-form-item__content {
    flex: 1;
  }
  
  .el-input__inner,
  .el-textarea__inner,
  .el-input-number__decrease,
  .el-input-number__increase,
  .el-input-number__input,
  .el-switch__core,
  .el-date-editor .el-input__inner {
    font-size: 16px !important;
  }
  
  .el-button {
    font-size: 16px;
    padding: 10px 20px;
    background-color: #1a1a1a;
    border-color: #444;
    color: #fff;
  }
  
  .el-button:hover {
    background-color: #333;
    border-color: #666;
    color: #fff;
  }
  
  .el-button--success {
    background-color: #67c23a;
    border-color: #67c23a;
    color: #fff;
  }
  
  .el-button--success:hover {
    background-color: #85ce61;
    border-color: #85ce61;
    color: #fff;
  }
}

.tags-section {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .meta-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;

    .meta-label {
      font-size: 16px;
      color: #fff;
      min-width: 56px;
      font-weight: bold;
    }

    .meta-value {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
    }
  }
}

.clickable-tag {
  cursor: pointer;
  transition: all 0.2s;
  margin: 0;
  font-size: 16px;

  &:hover {
    transform: translateY(-1px);
  }

  :deep(.el-tag__content) {
    line-height: 24px;
  }
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  padding: 0 56px;

  .el-button {
    flex: 1;
    justify-content: center;
    gap: 8px;
    height: 44px;
    font-size: 16px;
    
    :deep(.el-icon) {
      font-size: 20px;
    }
  }
}

.section {
  margin-bottom: 40px;

  h2 {
    color: #fff;
    margin-bottom: 20px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      color: #fff;
    }
  }

  .recommendations {
    .el-card {
      margin-bottom: 20px;
      cursor: pointer;
      transition: transform 0.3s;

      &:hover {
        transform: translateY(-5px);
      }

      .el-image {
        width: 100%;
        height: 200px;
      }

      .movie-info {
        padding: 10px;
        text-align: center;
      }
    }
  }

  .video-tags {
    .no-tags {
      text-align: center;
      padding: 40px;
      color: #ccc;
      font-size: 16px;
    }

    .tags-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, 142px);
      gap: 5px;
      margin-top: 20px;
      justify-content: start;
    }
    .tag-item {
      width: 142px;
      height: 74px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #444;
      padding: 0;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(255, 255, 255, 0.15);
        border-color: #409eff;
      }
    }
          .tag-image {
        position: relative;
        width: 142px;
        height: 74px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #1a1a1a;
      }
    .screenshot {
      width: 120px;
      height: 68px;
      object-fit: contain;
      display: block;
      border-radius: 2px;
      background: #1a1a1a;
    }
    .tag-overlay {
      position: absolute;
      left: 0;
      bottom: 0;
      background: rgba(0,0,0,0.6);
      color: #fff;
      font-size: 12px;
      padding: 2px 8px 2px 6px;
      border-bottom-left-radius: 4px;
      border-top-right-radius: 6px;
      max-width: 90%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
    }
    .tag-text {
      font-weight: 400;
      line-height: 1.3;
    }

    // 响应式设计
    @media (max-width: 768px) {
      .tags-grid {
        grid-template-columns: repeat(auto-fill, 100px);
        gap: 6px;
      }
      
      .tag-item .tag-image {
        width: 100px;
      }
    }

    @media (max-width: 480px) {
      .tags-grid {
        grid-template-columns: repeat(auto-fill, 80px);
        gap: 4px;
      }
      
      .tag-item .tag-image {
        width: 80px;
      }
    }
  }
}

// 全屏模态框样式
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: pointer;
  user-select: none; /* 禁用文本选择 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.fullscreen-content {
  position: relative;
  /* 改为贴边显示，避免缩放过小 */
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-image {
  /* 让全屏图片在可视区域内最大化显示 */
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
  user-select: none; /* 禁用图片选择 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-user-drag: none; /* 禁用图片拖拽 */
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 80px;
  height: 80px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  font-size: 28px;
  transition: all 0.3s ease;
  z-index: 10;
  user-select: none; /* 禁用文本选择 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  border: 2px solid rgba(255, 255, 255, 0.3);
  outline: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: rgba(255, 255, 255, 0.6);
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
  }
  
  &.disabled {
    opacity: 0.3;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  &.nav-prev {
    left: 30px;
  }
  
  &.nav-next {
    right: 30px;
  }
  
  @media (max-width: 1024px) {
    width: 70px;
    height: 70px;
    font-size: 24px;
    
    &.nav-prev {
      left: 20px;
    }
    
    &.nav-next {
      right: 20px;
    }
  }
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 20px;
    
    &.nav-prev {
      left: 15px;
    }
    
    &.nav-next {
      right: 15px;
    }
  }
}

.image-counter {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  user-select: none; /* 禁用文本选择 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.fullscreen-overlay {
  position: absolute;
  left: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 8px 16px;
  border-bottom-left-radius: 4px;
  border-top-right-radius: 8px;
  max-width: 90%;
  user-select: none; /* 禁用文本选择 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.fullscreen-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.fullscreen-timestamp {
  font-size: 14px;
  color: #ccc;
}

.pan115-results {
  margin-top: 2px;
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tag-item {
  cursor: pointer;
  color: #409eff;
  background-color: #1a2332;
  border: 1px solid #2d5aa0;
  border-radius: 4px;
  padding: 0 8px;
  height: 22px;
  line-height: 20px;
  font-size: 13px;
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-item:hover {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

.tag-item.loading {
  cursor: default;
  color: #ccc;
  background-color: #2a2a2a;
  border-color: #555;
}

.tag-item.loading:hover {
  background-color: #2a2a2a;
  border-color: #555;
  color: #ccc;
}

.tag-item.error {
  color: #f56c6c;
  background-color: #2a1a1a;
  border-color: #5a2d2d;
}

.tag-item.error:hover {
  color: white;
  background-color: #f56c6c;
  border-color: #f56c6c;
}

.meta-label:hover {
  color: #409eff;
}

.tag-input-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.tag-input {
  width: 100px;
  margin-left: 10px;
  vertical-align: bottom;
}

.tag-input :deep(.el-input__wrapper) {
  background-color: #1a1a1a;
  border: 1px solid #444;
}

.button-new-tag {
  margin-left: 10px;
  height: 32px;
  padding-top: 0;
  padding-bottom: 0;
  background-color: #1a1a1a;
  border-color: #444;
  color: #fff;
}

.button-new-tag:hover {
  background-color: #333;
  border-color: #666;
}

.edit-tag {
  margin-right: 10px;
}
    
    .action-buttons {
      .el-button {
        background-color: #1a1a1a;
        border-color: #444;
        color: #fff;
      }
      
      .el-button:hover {
        background-color: #333;
        border-color: #666;
        color: #fff;
      }
      
      .el-button--primary {
        background-color: #409eff;
        border-color: #409eff;
        color: #fff;
      }
      
      .el-button--danger {
        background-color: #f56c6c;
        border-color: #f56c6c;
        color: #fff;
      }
    }

.icon-link {
  margin-left: 8px;
  transition: all 0.3s;
  color: #ccc;
}

.icon-link:hover {
  color: #409eff;
  transform: scale(1.1);
}
</style>
