<template>
  <div class="actor-detail-container">
    <!-- 演员基本信息区域 -->
    <div class="actor-info-section">
      <div class="actor-info">
        <div class="actor-avatar">
          <el-image 
            :src="formatImageUrl(actor.posterUrl) || 'https://via.placeholder.com/150'" 
            fit="cover" 
            class="avatar-image"
          />
        </div>
        <div class="actor-details">
          <h1 class="actor-name">
            {{ actor.primaryName }}
          </h1>
          <p
            v-if="actor.allNames"
            class="actor-names"
          >
            {{ actor.allNames }}
          </p>
          <div class="actor-stats">
            <div class="stat-item">
              <el-icon><VideoCamera /></el-icon>
              <span>影片数量：{{ actor.movieCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <el-icon><Star /></el-icon>
              <span>主演数量：{{ actor.mainRoleCount || 0 }}</span>
            </div>
            <div
              v-if="actor.isDirector"
              class="stat-item"
            >
              <el-icon><Film /></el-icon>
              <span>导演数量：{{ actor.directorCount || 0 }}</span>
            </div>
          </div>
          <div
            v-if="actor.biography"
            class="actor-bio"
          >
            <h3>个人简介</h3>
            <p>{{ actor.biography }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 演员奖项区域 -->
    <div
      v-if="actor.awards && actor.awards.length > 0"
      class="actor-awards-section"
    >
      <h2>获奖情况</h2>
      <el-table
        :data="actor.awards"
        style="width: 100%"
      >
        <el-table-column
          prop="year"
          label="年份"
          width="100"
        />
        <el-table-column
          prop="name"
          label="奖项"
          width="180"
        />
        <el-table-column
          prop="category"
          label="类别"
          width="180"
        />
        <el-table-column
          prop="movie"
          label="影片"
        />
        <el-table-column
          label="结果"
          width="100"
        >
          <template #default="scope">
            <el-tag :type="scope.row.isWinner ? 'success' : 'info'">
              {{ scope.row.isWinner ? '获奖' : '提名' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 演员影片区域 -->
    <div class="actor-movies-section">
      <div class="section-header">
        <h2>影片列表</h2>
        <div class="filter-controls">
          <el-select
            v-model="sortBy"
            placeholder="排序方式"
            @change="loadActorMovies"
          >
            <el-option
              label="上映日期"
              value="releaseDate"
            />
            <el-option
              label="评分"
              value="rating"
            />
            <el-option
              label="评分人数"
              value="ratingCount"
            />
          </el-select>
          <el-switch
            v-model="sortDesc"
            active-text="降序"
            inactive-text="升序"
            @change="loadActorMovies"
          />
        </div>
      </div>

      <!-- Tab 切换：已收录和未收录影片 -->
      <el-tabs v-model="activeMovieTab" @tab-click="handleTabClick">
        <el-tab-pane label="已收录影片" name="recorded">
          <template #label>
            <span>
              <el-icon><VideoCamera /></el-icon> 
              已收录影片 
              <el-tag v-if="recordedMovies.length > 0" type="primary" size="small">{{ recordedMovies.length }}</el-tag>
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="未收录影片" name="unrecorded">
          <template #label>
            <span>
              <el-icon><Download /></el-icon> 
              未收录影片 
              <el-tag v-if="unrecordedMovies.length > 0" type="danger" size="small">{{ unrecordedMovies.length }}</el-tag>
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 已收录影片内容 -->
      <div v-if="activeMovieTab === 'recorded'" class="recorded-content">
        <MovieGrid
          v-if="recordedMovies.length > 0"
          :movies="recordedMovies"
          :loading="loading"
          :get-image-url="formatImageUrl"
          @movie-click="goToMovieDetail"
        />
        <el-empty v-else description="暂无已收录影片" />
      </div>

      <!-- 未收录影片内容 -->
      <div v-if="activeMovieTab === 'unrecorded'" class="unrecorded-content">
        <!-- 时间过滤子tab -->
        <el-tabs v-model="activeTimeFilter" @tab-click="handleTimeFilterClick">
          <el-tab-pane label="全部" name="all">
            <template #label>
              <span>
                全部 
                <el-tag v-if="getFilteredMovies('all').length > 0" type="info" size="small">
                  {{ getFilteredMovies('all').length }}
                </el-tag>
              </span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="今日新增" name="today">
            <template #label>
              <span>
                今日新增 
                <el-tag v-if="getFilteredMovies('today').length > 0" type="danger" size="small">
                  {{ getFilteredMovies('today').length }}
                </el-tag>
              </span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="最近一周" name="week">
            <template #label>
              <span>
                最近一周 
                <el-tag v-if="getFilteredMovies('week').length > 0" type="warning" size="small">
                  {{ getFilteredMovies('week').length }}
                </el-tag>
              </span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="最近一月" name="month">
            <template #label>
              <span>
                最近一月 
                <el-tag v-if="getFilteredMovies('month').length > 0" type="success" size="small">
                  {{ getFilteredMovies('month').length }}
                </el-tag>
              </span>
            </template>
          </el-tab-pane>
        </el-tabs>

        <!-- 未收录影片网格 -->
        <div class="unrecorded-movies-grid" v-loading="loading">
          <div
            v-for="movie in getFilteredMovies(activeTimeFilter)"
            :key="movie.id"
            class="unrecorded-movie-card"
          >
            <el-card :body-style="{ padding: '0px' }" shadow="hover">
              <div class="movie-poster">
                <el-image
                  :src="formatImageUrl(movie.posterPath)"
                  fit="cover"
                  loading="lazy"
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div class="movie-overlay">
                  <h4 class="movie-title">{{ movie.movieCode || movie.title }}</h4>
                  <div class="movie-info">
                    <span v-if="movie.addedDate" class="added-date">
                      <el-icon><Calendar /></el-icon>
                      {{ formatDate(movie.addedDate) }}
                    </span>
                    <span v-if="movie.releaseDate" class="release-date">
                      发布: {{ formatDate(movie.releaseDate) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="movie-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  :loading="downloadingMovies.includes(movie.id)"
                  @click="downloadMovie(movie)"
                >
                  <el-icon><Download /></el-icon>
                  {{ downloadingMovies.includes(movie.id) ? '下载中...' : '下载' }}
                </el-button>
                <el-button 
                  size="small" 
                  @click="previewMovie(movie)"
                >
                  <el-icon><View /></el-icon>
                  预览
                </el-button>
              </div>
            </el-card>
          </div>
        </div>

                 <el-empty 
           v-if="getFilteredMovies(activeTimeFilter).length === 0 && !loading" 
           :description="`暂无${getTimeFilterText(activeTimeFilter)}的未收录影片`" 
         />
       </div>

      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="movies.totalElements || 0"
          :page-size="pageSize"
          :current-page="currentPage + 1"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { VideoCamera, Star, Film, Clock, Warning, Picture, User, Calendar, Download, View } from '@element-plus/icons-vue'
import MovieGrid from '@/components/MovieGrid.vue'
  
  const route = useRoute()
const router = useRouter()
const actor = ref({})
const movies = ref({ content: [] })
const currentPage = ref(0)
const pageSize = ref(18)
const sortBy = ref('releaseDate')
const sortDesc = ref(true)
const todayUpdatedCount = ref(0)
const unrecordedCount = ref(0)
const loading = ref(false)

// 新增：tab 相关变量
const activeMovieTab = ref('recorded')
const activeTimeFilter = ref('all')
const recordedMovies = ref([])
const unrecordedMovies = ref([])
const downloadingMovies = ref([])

const placeholderCount = computed(() => {
  return pageSize.value - movies.value.content.length
})

// 计算过滤后的影片
const getFilteredMovies = (filter) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  return unrecordedMovies.value.filter(movie => {
    if (!movie.addedDate) return filter === 'all'
    const addedDate = new Date(movie.addedDate)
    
    switch (filter) {
      case 'today':
        return addedDate >= today
      case 'week':
        return addedDate >= weekAgo
      case 'month':
        return addedDate >= monthAgo
      default:
        return true
    }
  })
}

// 获取时间过滤器文本
const getTimeFilterText = (filter) => {
  const filterTexts = {
    'all': '全部',
    'today': '今日新增',
    'week': '最近一周',
    'month': '最近一月'
  }
  return filterTexts[filter] || '全部'
}

// Tab切换处理
const handleTabClick = (tab) => {
  activeMovieTab.value = tab.paneName
  if (tab.paneName === 'recorded') {
    loadRecordedMovies()
  } else if (tab.paneName === 'unrecorded') {
    loadUnrecordedMovies()
  }
}

const handleTimeFilterClick = (tab) => {
  activeTimeFilter.value = tab.paneName
}

// 下载影片
const downloadMovie = async (movie) => {
  try {
    downloadingMovies.value.push(movie.id)
    
    const response = await axios.post(`/api/movies/${movie.id}/download`)
    
    if (response.data.success) {
      ElMessage.success('下载任务已添加到队列')
    } else {
      ElMessage.error(response.data.message || '下载失败')
    }
  } catch (error) {
    console.error('下载影片失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  } finally {
    downloadingMovies.value = downloadingMovies.value.filter(id => id !== movie.id)
  }
}

// 预览影片
const previewMovie = (movie) => {
  if (movie.previewUrl) {
    window.open(movie.previewUrl, '_blank')
  } else {
    ElMessage.info('暂无预览信息')
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// 加载已收录影片
const loadRecordedMovies = async () => {
  try {
    const actorId = route.params.id
    const response = await axios.get(`/api/actors/${actorId}/movies/recorded`)
    recordedMovies.value = response.data || []
  } catch (error) {
    console.error('加载已收录影片失败:', error)
    // 使用模拟数据
    recordedMovies.value = movies.value.content || []
  }
}

// 加载未收录影片
const loadUnrecordedMovies = async () => {
  try {
    const actorId = route.params.id
    const response = await axios.get(`/api/actors/${actorId}/movies/unrecorded`)
    unrecordedMovies.value = response.data || []
  } catch (error) {
    console.error('加载未收录影片失败:', error)
    // 使用模拟数据
    unrecordedMovies.value = [
      {
        id: 'unrecorded1',
        title: '未收录影片1',
        movieCode: 'TEST-001',
        posterPath: '',
        addedDate: new Date().toISOString(),
        releaseDate: '2024-01-01'
      },
      {
        id: 'unrecorded2', 
        title: '未收录影片2',
        movieCode: 'TEST-002',
        posterPath: '',
        addedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        releaseDate: '2024-01-02'
      }
    ]
  }
}

  // 加载演员的影片
  const loadActorMovies = async () => {
    try {
      const actorId = route.params.id

      // 调用后端接口获取演员的影片
      const response = await axios.post(`/api/actors/${actorId}/movies`, null, {
        params: {
          page: currentPage.value,
          size: pageSize.value,
          sortBy: sortBy.value,
          sortDesc: sortDesc.value
        }
      })

      console.log('演员影片响应:', response.data)
      movies.value = response.data

      // 如果没有获取到数据，使用模拟数据
      if (!movies.value.content || movies.value.content.length === 0) {
        console.log('使用模拟影片数据')
        // 模拟影片数据
        const mockMovies = [
          {
            id: 1,
            title: '盗梦空间',
            originalTitle: 'Inception',
            posterPath: 'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p513344864.webp',
            releaseDate: '2010-09-01',
            rating: 9.3,
            ratingCount: 1500000,
            overview: '莱昂纳多·迪卡普里奥（Leonardo DiCaprio），1974年11月11日出生于美国加利福尼亚州洛杉矶。美国影视演员、制片人。因主演电影《泰坦尼克号》和《盗梦空间》等而获得国际知名度。他曾获得第88届奥斯卡金像奖最佳男主角奖。',
            role: '莱昂纳多·迪卡普里奥'
          },
          {
            id: 2,
            title: '泰坦尼克号',
            originalTitle: 'Titanic',
            posterPath: 'https://img9.doubanio.com/view/photo/s_ratio_poster/public/p457760035.webp',
            releaseDate: '1998-04-03',
            rating: 9.4,
            ratingCount: 1800000,
            overview: '莱昂纳多·迪卡普里奥（Leonardo DiCaprio），1974年11月11日出生于美国加利福尼亚州洛杉矶。美国影视演员、制片人。因主演电影《泰坦尼克号》和《盗梦空间》等而获得国际知名度。他曾获得第88届奥斯卡金像奖最佳男主角奖。',
            role: '杰克·道森'
          },
          {
            id: 3,
            title: '荒野猎人',
            originalTitle: 'The Revenant',
            posterPath: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2306652367.webp',
            releaseDate: '2016-03-18',
            rating: 8.0,
            ratingCount: 500000,
            overview: '莱昂纳多·迪卡普里奥（Leonardo DiCaprio），1974年11月11日出生于美国加利福尼亚州洛杉矶。美国影视演员、制片人。因主演电影《泰坦尼克号》和《盗梦空间》等而获得国际知名度。他曾获得第88届奥斯卡金像奖最佳男主角奖。',
            role: '休·格拉斯'
          },
          {
            id: 4,
            title: '华尔街之狼',
            originalTitle: 'The Wolf of Wall Street',
            posterPath: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2160805096.webp',
            releaseDate: '2014-01-03',
            rating: 8.2,
            ratingCount: 600000,
            overview: '莱昂纳多·迪卡普里奥（Leonardo DiCaprio），1974年11月11日出生于美国加利福尼亚州洛杉矶。美国影视演员、制片人。因主演电影《泰坦尼克号》和《盗梦空间》等而获得国际知名度。他曾获得第88届奥斯卡金像奖最佳男主角奖。',
            role: '乔丹·贝尔福特'
          }
        ]

        movies.value = {
          content: mockMovies,
          totalElements: mockMovies.length,
          totalPages: 1,
          size: pageSize.value,
          number: currentPage.value
        }
      }

      // 模拟今日更新和未收录数据（实际项目中应从API获取）
      todayUpdatedCount.value = 3 // 示例值
      unrecordedCount.value = 5 // 示例值

      // 为每个影片添加额外属性（实际项目中可能从API直接获取）
      movies.value.content.forEach(movie => {
        // 随机设置今日更新标志（示例）
        movie.updatedToday = Math.random() > 0.8
        // 随机设置未录制标志（示例）
        movie.isUnrecorded = Math.random() > 0.7
        // 随机设置角色名（示例）
        if (!movie.role) {
          movie.role = ['主角', '配角', '客串', '特邀演员'][Math.floor(Math.random() * 4)]
        }
        // 不在此处理影片海报路径，保留原始路径
        // movie.posterPath = formatImageUrl(movie.posterPath)
      })
    } catch (error) {
      console.error('加载演员影片失败:', error)
      // 出错时使用模拟数据
      const mockMovies = [
        {
          id: 1,
          title: '盗梦空间',
          originalTitle: 'Inception',
          posterPath: 'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p513344864.webp',
          releaseDate: '2010-09-01',
          rating: 9.3,
          ratingCount: 1500000,
          overview: '莱昂纳多·迪卡普里奥（Leonardo DiCaprio），1974年11月11日出生于美国加利福尼亚州洛杉矶。美国影视演员、制片人。因主演电影《泰坦尼克号》和《盗梦空间》等而获得国际知名度。他曾获得第88届奥斯卡金像奖最佳男主角奖。',
          role: '莱昂纳多·迪卡普里奥',
          updatedToday: true,
          isUnrecorded: false
        },
        {
          id: 2,
          title: '泰坦尼克号',
          originalTitle: 'Titanic',
          posterPath: 'https://img9.doubanio.com/view/photo/s_ratio_poster/public/p457760035.webp',
          releaseDate: '1998-04-03',
          rating: 9.4,
          ratingCount: 1800000,
          overview: '莱昂纳多·迪卡普里奥（Leonardo DiCaprio），1974年11月11日出生于美国加利福尼亚州洛杉矶。美国影视演员、制片人。因主演电影《泰坦尼克号》和《盗梦空间》等而获得国际知名度。他曾获得第88届奥斯卡金像奖最佳男主角奖。',
          role: '杰克·道森',
          updatedToday: false,
          isUnrecorded: false
        }
      ]

      movies.value = {
        content: mockMovies,
        totalElements: mockMovies.length,
        totalPages: 1,
        size: pageSize.value,
        number: currentPage.value
      }

      todayUpdatedCount.value = 1
      unrecordedCount.value = 0
    }
  }

  // 加载演员详细信息
  const loadActorDetail = async () => {
    try {
      const actorId = route.params.id
      
      // 调用后端接口获取演员详细信息
      console.log('正在加载演员详细信息，ID:', actorId)
      const response = await axios.get(`/api/actors/${actorId}`)
      
      console.log('演员详细信息响应:', response.data)
      actor.value = response.data
      
      // 如果没有获取到数据，使用模拟数据
      if (!actor.value || !actor.value.id) {
        console.log('使用模拟演员数据')
        // 模拟演员数据
        actor.value = {
          id: actorId,
          primaryName: '莱昂纳多·迪卡普里奥',
          allNames: '莱昂纳多·迪卡普里奥 Leonardo DiCaprio',
          gender: 'MALE',
          isDirector: true,
          posterUrl: 'https://img2.doubanio.com/view/celebrity/raw/public/p470.jpg',
          movieCount: 35,
          mainRoleCount: 28,
          directorCount: 3,
          biography: '莱昂纳多·迪卡普里奥（Leonardo DiCaprio），1974年11月11日出生于美国加利福尼亚州洛杉矶。美国影视演员、制片人。因主演电影《泰坦尼克号》和《盗梦空间》等而获得国际知名度。他曾获得第88届奥斯卡金像奖最佳男主角奖。',
          birthYear: 1974,
          deathYear: null,
          awards: [
            { name: '奥斯卡金像奖', year: 2016, category: '最佳男主角', movie: '荒野猎人', isWinner: true },
            { name: '奥斯卡金像奖', year: 2014, category: '最佳男主角', movie: '华尔街之狼', isWinner: false },
            { name: '奥斯卡金像奖', year: 2007, category: '最佳男主角', movie: '血钻', isWinner: false },
            { name: '金球奖', year: 2016, category: '最佳男主角', movie: '荒野猎人', isWinner: true }
          ]
        }
      }
      
      // 处理演员海报路径
      if (actor.value.posterUrl) {
        actor.value.posterUrl = formatImageUrl(actor.value.posterUrl)
      }
      
      // 加载演员的影片
      await loadActorMovies()
    } catch (error) {
      console.error('加载演员详细信息失败:', error)
      // 出错时使用模拟数据
      actor.value = {
        id: route.params.id,
        primaryName: '莱昂纳多·迪卡普里奥',
        allNames: '莱昂纳多·迪卡普里奥 Leonardo DiCaprio',
        gender: 'MALE',
        isDirector: true,
        posterUrl: 'https://img2.doubanio.com/view/celebrity/raw/public/p470.jpg',
        movieCount: 35,
        mainRoleCount: 28,
        directorCount: 3,
        biography: '莱昂纳多·迪卡普里奥（Leonardo DiCaprio），1974年11月11日出生于美国加利福尼亚州洛杉矶。美国影视演员、制片人。因主演电影《泰坦尼克号》和《盗梦空间》等而获得国际知名度。他曾获得第88届奥斯卡金像奖最佳男主角奖。',
        birthYear: 1974,
        deathYear: null,
        awards: [
          { name: '奥斯卡金像奖', year: 2016, category: '最佳男主角', movie: '荒野猎人', isWinner: true },
          { name: '金球奖', year: 2016, category: '最佳男主角', movie: '荒野猎人', isWinner: true }
        ]
      }
      
      // 加载演员的影片（如果加载演员详细信息失败，则直接加载影片）
      await loadActorMovies()
    }
  }

  const getImageUrl = (path) => {
  if (!path) return ''
  const relativePath = path.split('success\\')[1]?.replace(/\\/g, '/')
  return relativePath ? `/api/images/${relativePath}` : ''
}

  // 处理影片海报路径
  const formatImageUrl = (path) => {
    if (!path) return ''
    
    // 输出原始路径以便调试
    console.log('原始路径:', path)
    
    if (path.startsWith('http')) return path
    if (path.startsWith('/api/images/')) return path
    
    const relativePath = path.split('success\\')[1]?.replace(/\\/g, '/')
    const result = relativePath ? `/api/images/${relativePath}` : ''
    
    // 输出处理后的路径以便调试
    console.log('处理后的路径:', result)
    
    return result
  }

  // 处理分页切换
  const handleCurrentChange = (val) => {
    currentPage.value = val - 1
    loadActorMovies()
  }

  // 跳转到电影详情页面
  const goToMovieDetail = (movieId) => {
    router.push(`/detail/${movieId}`)
  }

  // 页面加载时调用 loadActorDetail 函数
  onMounted(() => {
    loadActorDetail()
    loadRecordedMovies() // 默认加载已收录影片
  })
</script>

<style scoped>
.actor-detail-container {
  padding: 20px;
}

.actor-info-section {
  margin-bottom: 30px;
}

.actor-info {
  display: flex;
  gap: 30px;
}

.actor-avatar {
  flex: 0 0 200px;
}

.avatar-image {
  width: 200px;
  height: 300px;
  border-radius: 8px;
  object-fit: cover;
}

.actor-details {
  flex: 1;
}

.actor-name {
  font-size: 24px;
  margin-bottom: 5px;
}

.actor-names {
  color: #666;
  margin-bottom: 15px;
}

.actor-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.actor-bio {
  margin-top: 20px;
}

.actor-awards-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.stats-summary {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

/* 复用 HomeView 的电影卡片样式 */
.content {
  margin-top: 20px;
}

.movie-card {
  margin-bottom: 16px;
  transition: all 0.3s;
  cursor: pointer;
}

.movie-card:hover {
  transform: translateY(-5px);
}

.poster-container {
  position: relative;
  aspect-ratio: 2/3;
}

.movie-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.6) 50%, transparent);
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

.movie-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.movie-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
}

.movie-stats span {
  display: flex;
  align-items: center;
  gap: 3px;
}

.release-date {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.rating, .role {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.update-badge {
  background-color: #409EFF;
  padding: 2px 6px;
  border-radius: 4px;
}

.unrecorded-badge {
  background-color: #E6A23C;
  padding: 2px 6px;
  border-radius: 4px;
}

.movie-card-placeholder {
  height: 0;
  padding-bottom: calc(150% + 32px); /* 保持与卡片相同的高宽比 */
  margin-bottom: 16px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 未收录影片样式 */
.unrecorded-movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.unrecorded-movie-card .el-card {
  background-color: #1e1e1e;
  border-color: #333333;
}

.movie-poster {
  position: relative;
}

.movie-poster .el-image {
  width: 100%;
  height: 240px;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #2a2a2a;
  color: #666;
}

.movie-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  padding: 15px 10px 10px;
}

.movie-title {
  color: #fff;
  font-size: 14px;
  margin: 0 0 5px 0;
  font-weight: bold;
}

.movie-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.movie-info span {
  font-size: 12px;
  color: #ccc;
  display: flex;
  align-items: center;
}

.movie-info .el-icon {
  margin-right: 3px;
}

.movie-actions {
  padding: 10px;
  display: flex;
  gap: 8px;
}

.movie-actions .el-button {
  flex: 1;
  font-size: 12px;
}
</style>
