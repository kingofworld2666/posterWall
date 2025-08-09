<template>
  <div class="history-container">
    <div class="header">
      <div class="search-bar">
        <el-select
          v-model="timeRange"
          class="time-range-select"
          style="width: 120px"
        >
          <el-option
            label="全部"
            value="all"
          />
          <el-option
            label="最近一周"
            value="week"
          />
          <el-option
            label="最近一月"
            value="month"
          />
          <el-option
            label="最近三月"
            value="quarter"
          />
        </el-select>
        
        <el-input
          v-model="searchQuery"
          placeholder="搜索历史记录..."
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
          @clear="resetSearch"
        >
          <template #append>
            <el-button
              type="primary"
              @click="handleSearch"
            >
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>


        <el-button
          plain
          @click="resetSearch"
        >
          重置
        </el-button>
      </div>
    </div>

    
    <div class="content">
      <MovieGrid
        v-if="!loading && historyList.length > 0"
        :movies="historyList"
        :loading="loading"
        :get-image-url="getImageUrl"
        :play-count-inline="true"
        :show-history-time="true" 
        :show-remove-button="false" 
        @movie-click="goToDetail"
      />
      <el-empty
        v-if="!loading && historyList.length === 0"
        description="暂无播放历史"
        :image-size="150"
      />
      <div v-if="loading" v-loading="loading" element-loading-text="加载中..." style="min-height: 200px;"></div>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[40, 100, 500]"
        layout="total, sizes, prev, pager, next, jumper"
        :disabled="loading"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onActivated, onUnmounted, nextTick } from 'vue'

// 定义组件名称以便keep-alive识别
defineOptions({
  name: 'HistoryView'
})
import { useRouter, useRoute } from 'vue-router'
import { 
  Picture, View, VideoPlay, ArrowDown, ArrowUp, Search,
  Timer, Star, Calendar, Delete
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import axios from 'axios'
import MovieGrid from '@/components/MovieGrid.vue';

const router = useRouter()
const route = useRoute()
const timeRange = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(40)
const total = ref(100)
const loading = ref(false)

// 历史记录数据
const historyList = ref([])

/**
 * 处理搜索
 */
const handleSearch = () => {
  currentPage.value = 1
  loadHistoryData()
}

/**
 * 重置搜索
 */
const resetSearch = () => {
  searchQuery.value = ''
  timeRange.value = 'all'
  currentPage.value = 1
  
  // 清除保存的状态
  localStorage.removeItem('historyPageState')
  localStorage.removeItem('historyScrollPosition')
  
  loadHistoryData()
}

/**
 * 加载历史数据
 */
const loadHistoryData = async (shouldRestoreScroll = false) => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: currentPage.value - 1,
      size: pageSize.value,
      keyword: searchQuery.value || ''
    }

    // 根据时间范围添加过滤条件
    if (timeRange.value !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (timeRange.value) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
      }
      
      params.startDate = startDate.toISOString().split('T')[0]
    }
    
    // 调用API获取数据
    const response = await axios.get('/api/play-history/page/search', { params, silent: true })
    console.log('API返回数据:', response.data)
    
    if (response.data.code === 1) {
      const { content, totalElements } = response.data.data
      historyList.value = content || []
      total.value = totalElements || 0
      
      // 如果没有数据，显示提示
      if (historyList.value.length === 0 && searchQuery.value) {
        ElMessage.info('没有找到匹配的历史记录')
      }
    } else {
      historyList.value = []
      total.value = 0
      ElMessage.error(response.data.message || '获取历史记录失败')
    }
    
  } catch (error) {
    console.error('加载历史数据失败:', error)
    ElMessage.error('获取历史记录失败')
  } finally {
    loading.value = false
    
    // 如果需要恢复滚动位置，等待DOM更新后恢复
    if (shouldRestoreScroll) {
      const savedScrollPosition = localStorage.getItem('historyScrollPosition')
      if (savedScrollPosition) {
        nextTick(() => {
          // 使用 requestAnimationFrame 确保渲染完成
          requestAnimationFrame(() => {
            const mainElement = document.querySelector('.el-main')
            if (mainElement) {
              mainElement.scrollTop = parseInt(savedScrollPosition)
              console.log('恢复滚动位置:', savedScrollPosition)
            }
            localStorage.removeItem('historyScrollPosition')
          })
        })
      }
    }
  }
}

/**
 * 根据进度获取颜色
 * @param {number} percentage - 进度百分比
 * @returns {string} - 颜色值
 */
const getProgressColor = (percentage) => {
  if (percentage < 30) return 'rgba(245, 108, 108, 0.8)' // 红色
  if (percentage < 70) return 'rgba(230, 162, 60, 0.8)' // 黄色
  return 'rgba(103, 194, 58, 0.8)' // 绿色
}

/**
 * 获取图片URL
 * @param {string} path - 图片路径
 * @returns {string} - 处理后的URL
 */
 const getImageUrl = (path) => {
  // 处理远程图片路径
  if (!path) return ''
  if(path.startsWith('http')){
    return path
  } 
  // 处理本地图片路径
  if(path.includes('patu')){
    // 从patu文件夹提取文件名
    const fileName = path.split('\\').pop()
    return fileName ? `/api/images/${fileName}` : ''
  }
  // 原有逻辑保留
  const relativePath = path.split('success\\')[1]?.replace(/\\/g, '/')
  return relativePath ? `/api/images/${relativePath}` : ''
}

/**
 * 跳转到详情页
 * @param {number} id - 电影ID
 */
const goToDetail = (id) => {
  // 保存当前页面状态
  const pageState = {
    timeRange: timeRange.value,
    searchQuery: searchQuery.value,
    currentPage: currentPage.value,
    pageSize: pageSize.value
  }
  localStorage.setItem('historyPageState', JSON.stringify(pageState))
  
  // 保存滚动位置
  const mainElement = document.querySelector('.el-main')
  const scrollTop = mainElement ? mainElement.scrollTop : 0
  localStorage.setItem('historyScrollPosition', scrollTop.toString())
  
  router.push(`/detail/${id}`)
}

/**
 * 从历史记录中删除
 * @param {Object} item - 历史记录项
 */
const removeFromHistory = async (item) => {
  const title = item.titleZh || item.titleJa || item.movieCode || '未知标题'
  ElMessageBox.confirm(
    `确定要删除 "${title}" 的观看记录吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/play-history/${item.historyId}`, { silent: true })
      if (response.data.code === 1) {
        historyList.value = historyList.value.filter(i => i.id !== item.id)
        ElMessage.success('已删除记录')
      } else {
        ElMessage.error(response.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除历史记录失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}


/**
 * 处理每页显示数量变化
 * @param {number} val - 新的每页数量
 */
const handleSizeChange = (val) => {
  pageSize.value = val
  loadHistoryData()
}

/**
 * 处理页码变化
 * @param {number} val - 新的页码
 */
const handleCurrentChange = (val) => {
  currentPage.value = val
  loadHistoryData()
}

watch(
  () => route.path,
  (path) => {
    // 当路径是历史记录页面时，检查是否需要重新加载数据
    if (path === '/history') {
      // 如果没有保存的状态，才重新加载数据
      const savedPageState = localStorage.getItem('historyPageState')
      if (!savedPageState) {
        console.log('切换到历史记录页面，重新加载数据')
        loadHistoryData()
      }
    }
  }
)

// 页面加载时获取数据
onMounted(() => {
  loadHistoryData()
})

// 页面激活时恢复状态
onActivated(() => {
  const savedPageState = localStorage.getItem('historyPageState')
  const savedScrollPosition = localStorage.getItem('historyScrollPosition')
  
  if (savedPageState) {
    try {
      const pageState = JSON.parse(savedPageState)
      
      // 恢复页面状态
      timeRange.value = pageState.timeRange || 'all'
      searchQuery.value = pageState.searchQuery || ''
      currentPage.value = pageState.currentPage || 1
      pageSize.value = pageState.pageSize || 40
      
      // 清除保存的状态
      localStorage.removeItem('historyPageState')
      
      // 重新加载数据，并在加载完成后恢复滚动位置
      loadHistoryData(true)
      
    } catch (error) {
      console.error('恢复历史页面状态失败:', error)
      localStorage.removeItem('historyPageState')
      localStorage.removeItem('historyScrollPosition')
    }
  } else if (savedScrollPosition) {
    // 只有滚动位置的情况
    nextTick(() => {
      requestAnimationFrame(() => {
        const mainElement = document.querySelector('.el-main')
        if (mainElement) {
          mainElement.scrollTop = parseInt(savedScrollPosition)
          console.log('恢复滚动位置（仅滚动）:', savedScrollPosition)
        }
        localStorage.removeItem('historyScrollPosition')
      })
    })
  }
})

// 组件销毁时清理状态
onUnmounted(() => {
  localStorage.removeItem('historyPageState')
  localStorage.removeItem('historyScrollPosition')
})

</script>

<style lang="scss" scoped>
.history-container {
  .header {
    margin-bottom: 0;
    background-color: #000000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .search-bar {
    display: flex;
    gap: 8px;
    padding: 8px;
    align-items: center;
    
    .search-input {
      flex: 1;
      max-width: 500px;
    }
    
    .time-range-select {
      margin-right: 8px;
    }
  }

  .content {
    background-color: transparent; 
  }

  .pagination-container {
    margin-top: 5px;
    margin-bottom: 10px;
    display: flex;
    justify-content: center;
    padding: 0 20px;
    
    :deep(.el-pagination) {
      padding: 10px;
      border-radius: 8px;
      background-color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    }
  }
}
</style>
