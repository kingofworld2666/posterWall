<template>
  <div class="home-container">
    <div class="header">
      <!-- 第一行：仅搜索区域 -->
      <div class="toolbar-top">
        <el-select
          v-model="searchType"
          class="search-type-select"
          style="width: 100px"
        >
          <el-option
            v-for="option in searchTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        
        <div class="search-input-container" style="position: relative; flex: 1; max-width: 500px;">
          <el-input
            v-model="searchQuery"
            :placeholder="getPlaceholder"
            class="search-input"
            clearable
            @clear="resetSearch"
            @keyup.enter="() => { handleSearch(); addSearchHistoryRecord(); }"
            @focus="() => { if (!showSearchHistory && !isProcessingHistoryToggle) toggleSearchHistory() }"
            @click="() => { if (!showSearchHistory && !isProcessingHistoryToggle) toggleSearchHistory() }"
          >
            <template #prefix>
              <el-icon 
                @click.stop="() => { if (!isProcessingHistoryToggle) toggleSearchHistory() }"
                style="cursor: pointer;"
              >
                <Clock />
              </el-icon>
            </template>
            <template #append>
              <el-button
                type="primary"
                @click="() => { handleSearch(); addSearchHistoryRecord(); }"
              >
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
          
          <!-- 搜索历史下拉菜单 -->
          <div 
            v-if="showSearchHistory && searchHistory.length > 0" 
            class="search-history-dropdown"
            style="position: absolute; top: 100%; left: 0; width: 100%; max-height: 300px; overflow-y: auto; background-color: #1a1a1a; border: 1px solid #409EFF; border-radius: 4px; z-index: 9999; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3); margin-top: 5px;"
          >
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #333;">
              <span style="font-weight: bold;">搜索历史</span>
              <el-button 
                link
                @click="clearSearchHistory"
                style="color: #ff4949; padding: 0;"
              >
                清空历史
              </el-button>
            </div>
            <ul style="list-style: none; margin: 0; padding: 0;">
              <li 
                v-for="(record, index) in searchHistory" 
                :key="index"
                @click="searchFromHistory(record)"
                style="padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
                class="search-history-item"
              >
                <div style="display: flex; align-items: center; flex: 1; overflow: hidden; margin-right: 8px;">
                  <el-tag size="small" style="margin-right: 8px; flex-shrink: 0;">
                    {{ searchTypeOptions.find(opt => opt.value === record.type)?.label || record.type }}
                  </el-tag>
                  <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ record.keyword }}</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #909399; font-size: 12px; margin-right: 8px;">
                    {{ new Date(record.timestamp).toLocaleDateString() }}
                  </span>
                  <el-button 
                    type="danger" 
                    size="small" 
                    circle
                    @click.stop="deleteSearchHistoryItem(index, $event)"
                    style="padding: 4px; height: 24px; width: 24px;"
                  >
                    <el-icon style="font-size: 12px;"><Delete /></el-icon>
                  </el-button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 第二行：观看状态与排序（均吸顶，平铺一行） -->
      <div class="toolbar-bottom">
        <el-button-group>
          <el-button :type="watchedFilter === null ? 'primary' : ''" @click="handleWatchedFilterChangeCommand(null)">全部</el-button>
          <el-button :type="watchedFilter === true ? 'primary' : ''" @click="handleWatchedFilterChangeCommand('true')">已观看</el-button>
          <el-button :type="watchedFilter === false ? 'primary' : ''" @click="handleWatchedFilterChangeCommand('false')">未观看</el-button>
        </el-button-group>

        <el-button-group style="margin-left: 10px;">
          <el-button
            v-for="option in sortOptions"
            :key="option.field"
            :type="sortField === option.field ? 'primary' : ''"
            @click="handleSortChange(option.field)"
          >
            {{ option.label }}
            <el-icon v-if="sortField === option.field && option.field !== 'random'" style="margin-left: 4px;">
              <component :is="sortDirections[option.field] === 'desc' ? 'ArrowDown' : 'ArrowUp'" />
            </el-icon>
          </el-button>
          <el-button :type="sortField === 'random' ? 'primary' : ''" icon="Refresh" @click="handleRandomSort">随机</el-button>
        </el-button-group>
      </div>
    </div>

    <div class="content">
      <MovieGrid
        :movies="movies"
        :loading="loading"
        :get-image-url="getImageUrl"
        :play-count-inline="true"
        :placeholder-count="placeholderCount"
        @movie-click="goToDetail"
      />
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
import { ref, computed, onMounted, onUnmounted, watch, onActivated, onDeactivated, nextTick } from 'vue'

// 定义组件名称以便keep-alive识别
defineOptions({
  name: 'HomeView'
})
import { useRouter, useRoute } from 'vue-router'
import { 
  Picture, View, VideoPlay, ArrowDown, ArrowUp, Search,
  Timer, Star, Calendar, Refresh, Select, Clock, Delete
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import MovieGrid from '@/components/MovieGrid.vue'

// 接收来自App.vue的重置触发器
const props = defineProps({
  resetTrigger: {
    type: Number,
    default: 0
  }
})

const router = useRouter()
const route = useRoute()
const currentPage = ref(1)
const pageSize = ref(40)
const total = ref(0)
const movies = ref([])
const loading = ref(false)
const sortField = ref('created_at') // Default sort field
const sortDirections = ref({
  release_date: 'desc',
  created_at: 'desc', 
  play_count: 'desc',
  rating: 'desc',
  random: 'desc' // Though 'random' doesn't sort by direction, having an entry is consistent
})
const searchQuery = ref('')
const searchType = ref('all')
const watchedFilter = ref(null) // 添加已观看/未观看过滤选项，null表示全部

// 搜索历史记录
const searchHistory = ref([])
const showSearchHistory = ref(false)

// 同步115已移除

// 从localStorage加载搜索历史记录
const loadSearchHistory = () => {
  try {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      searchHistory.value = JSON.parse(savedHistory)
      console.log('加载搜索历史成功:', searchHistory.value)
    } else {
      console.log('没有找到搜索历史记录')
    }
  } catch (error) {
    console.error('加载搜索历史失败:', error)
    // 如果解析失败，重置历史记录
    searchHistory.value = []
  }
}

// 保存搜索历史到localStorage
const saveSearchHistory = () => {
  try {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
  } catch (error) {
    console.error('保存搜索历史失败:', error)
  }
}

// 添加搜索记录到历史
const addToSearchHistory = (type, keyword) => {
  // 只有在有关键词的情况下才添加到历史记录
  if (!keyword) return
  
  // 创建新的搜索记录对象
  const newRecord = {
    type,
    keyword,
    timestamp: new Date().getTime()
  }
  
  // 检查是否已存在相同的搜索记录
  const existingIndex = searchHistory.value.findIndex(
    record => record.type === type && record.keyword === keyword
  )
  
  // 如果存在，先移除旧记录
  if (existingIndex !== -1) {
    searchHistory.value.splice(existingIndex, 1)
  }
  
  // 添加到历史记录开头
  searchHistory.value.unshift(newRecord)
  
  // 限制历史记录最多50条
  if (searchHistory.value.length > 50) {
    searchHistory.value = searchHistory.value.slice(0, 50)
  }
  
  // 保存到localStorage
  saveSearchHistory()
}

// 从历史记录中执行搜索
const searchFromHistory = (record) => {
  searchType.value = record.type
  searchQuery.value = record.keyword
  showSearchHistory.value = false
  
  // 只执行搜索，不添加到历史记录
  handleSearch()
  
  // 更新该记录的时间戳，并将其移到历史记录的最前面
  const existingIndex = searchHistory.value.findIndex(
    item => item.type === record.type && item.keyword === record.keyword
  )
  
  if (existingIndex !== -1) {
    // 更新时间戳
    const updatedRecord = {
      ...record,
      timestamp: new Date().getTime()
    }
    
    // 从数组中移除
    searchHistory.value.splice(existingIndex, 1)
    
    // 添加到开头
    searchHistory.value.unshift(updatedRecord)
    
    // 保存到localStorage
    saveSearchHistory()
  }
}

// 清空搜索历史
const clearSearchHistory = () => {
  searchHistory.value = []
  saveSearchHistory()
  showSearchHistory.value = false
}

// 删除单条搜索历史
const deleteSearchHistoryItem = (index, event) => {
  // 阻止事件冒泡，避免触发点击整个历史记录项的事件
  event.stopPropagation()
  
  // 从数组中删除指定索引的记录
  searchHistory.value.splice(index, 1)
  
  // 保存到localStorage
  saveSearchHistory()
  
  // 如果删除后没有记录了，关闭下拉菜单
  if (searchHistory.value.length === 0) {
    showSearchHistory.value = false
  }
}

// 防抖函数
const debounce = (fn, delay) => {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

// 标记是否正在处理搜索历史显示状态的变更
const isProcessingHistoryToggle = ref(false);

// 切换搜索历史显示状态
const _toggleSearchHistory = () => {
  // 如果正在处理中，则忽略此次调用
  if (isProcessingHistoryToggle.value) return;
  
  // 标记为正在处理
  isProcessingHistoryToggle.value = true;
  
  
  // 使用setTimeout确保DOM更新完成后再切换状态
  setTimeout(() => {
    showSearchHistory.value = !showSearchHistory.value;

    // 处理完成后重置标记
    setTimeout(() => {
      isProcessingHistoryToggle.value = false;
    }, 200);
  }, 10);
};

// 使用防抖处理，避免短时间内多次调用
const toggleSearchHistory = debounce(_toggleSearchHistory, 100);

// 搜索类型选项
const searchTypeOptions = [
  { label: '全部', value: 'all' },
  { label: '标题', value: 'title' },
  { label: '演员', value: 'actress' },
  { label: '导演', value: 'director' },
  { label: '片商', value: 'studio' },
  { label: '类别', value: 'category' },
  { label: '系列', value: 'series' }
]

// 排序选项 (User's original fields and labels - random removed)
const sortOptions = ref([
  { field: 'release_date', label: '发布日期', icon: Calendar },
  { field: 'created_at', label: '添加时间', icon: Timer },
  { field: 'play_count', label: '播放次数', icon: VideoPlay },
  { field: 'rating', label: '评分', icon: Star },
])

const getPlaceholder = computed(() => {
  switch (searchType.value) {
    case 'all':
      return '搜索标题、演员、导演、类别...'
    case 'actress':
      return '搜索演员'
    case 'director':
      return '搜索导演'
    case 'studio':
      return '搜索片商'
    case 'category':
      return '搜索类别'
    case 'series':
      return '搜索系列'
    default:
      return '搜索电影标题...'
  }
})

const getCurrentSortDescription = () => {
  const currentOption = sortOptions.value.find(opt => opt.field === sortField.value);
  if (!currentOption) return '排序';
  let description = currentOption.label;
  if (currentOption.field !== 'random' && sortDirections.value[currentOption.field]) {
    description += ` ${sortDirections.value[currentOption.field] === 'desc' ? '↓' : '↑'}`;
  }
  return description;
};

// 指定排序
const handleSortChange = (field) => {
  if (sortField.value === field && field !== 'random') { 
    // 切换排序方向
    sortDirections.value[field] = sortDirections.value[field] === 'desc' ? 'asc' : 'desc';
  } else {
    // 切换排序字段
    sortField.value = field;
  }
  
  // 直接获取数据，不更新路由
  loading.value = true;
  
  // 构建请求参数
  const params = {
    page: currentPage.value - 1,
    size: pageSize.value
  };
  
  // 处理排序方式
  if (sortField.value === 'random') {
    params.random = true;
  } else {
    // 添加防御性代码，确保排序方向存在
    const direction = sortDirections.value && sortField.value ? (sortDirections.value[sortField.value] || 'desc') : 'desc';
    params.sort = `${sortField.value},${direction}`;
  }
  
  // 添加观看状态过滤
  if (watchedFilter.value !== null) {
    params.watched = watchedFilter.value;
  }
  
  // 添加搜索关键词
  if (searchQuery.value) {
    params.keyword = searchQuery.value;
  }
  
  // 直接调用 API
  getMovies(params);
}

/**
 * 直接调用API获取电影数据
 * @param {Object} params - 请求参数
 */
const getMovies = async (params) => {
  loading.value = true;
  
  // 添加调试日志
  console.log('getMovies调用 - searchType:', searchType.value, 'searchQuery:', searchQuery.value, 'params:', params);

  try {
    let response;
    
    switch (searchType.value) {
      case 'all':
      case 'title':
        // 全部和标题搜索都使用通用搜索接口
        response = await axios.get('/api/movies', { params, silent: true });
        break;
      case 'actress':
        response = await axios.get('/api/movies/search/actress', { 
          params: { ...params, name: searchQuery.value || params.keyword },
          silent: true
        });
        break;
      case 'director':
        response = await axios.get('/api/movies/search/director', { 
          params: { ...params, name: searchQuery.value || params.keyword },
          silent: true
        });
        break;
      case 'studio':
        response = await axios.get('/api/movies/search/studio', { 
          params: { ...params, name: searchQuery.value || params.keyword },
          silent: true
        });
        break;
      case 'category':
        response = await axios.get('/api/movies/search/category', { 
          params: { ...params, categoryName: searchQuery.value || params.keyword },
          silent: true
        });
        break;
      case 'series':
        response = await axios.get('/api/movies/search/series', { 
          params: { ...params, series: searchQuery.value || params.keyword },
          silent: true
        });
        break;
    }
    
    movies.value = response.data.content;
    total.value = response.data.totalElements;
    
    // 恢复滚动位置（如果有保存的位置）
    const savedScrollPosition = localStorage.getItem('homeScrollPosition')
    if (savedScrollPosition) {
      nextTick(() => {
        // 恢复 el-main 元素的滚动位置
        const mainElement = document.querySelector('.el-main')
        if (mainElement) {
          mainElement.scrollTop = parseInt(savedScrollPosition)
        }
        localStorage.removeItem('homeScrollPosition') // 使用后清除
      })
    }
    
  } catch (error) {
    console.error('搜索失败:', error);
    ElMessage.error('搜索失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 随机排序
const handleRandomSort = () => {
  sortField.value = 'random';
  if (!sortDirections.value.random) {
      sortDirections.value.random = 'desc';
  }
  
  // 直接调用API
  const params = {
    page: currentPage.value - 1,
    size: pageSize.value,
    random: true
  };
  
  // 添加观看状态过滤
  if (watchedFilter.value !== null) {
    params.watched = watchedFilter.value;
  }
  
  getMovies(params);
};

// 观看过滤
const handleWatchedFilterChangeCommand = (command) => {
  // 根据接收到的 command 字符串更新 watchedFilter
  if (command === 'true') {
    watchedFilter.value = true;
  } else if (command === 'false') {
    watchedFilter.value = false;
  } else {
    watchedFilter.value = null; // command 为 null 时
  }

  currentPage.value = 1;
  
  // 直接调用API
  const params = {
    page: 0,
    size: pageSize.value
  };
  
  // 处理排序方式
  if (sortField.value === 'random') {
    params.random = true;
  } else {
    // 添加防御性代码，确保排序方向存在
    const direction = sortDirections.value && sortField.value ? (sortDirections.value[sortField.value] || 'desc') : 'desc';
    params.sort = `${sortField.value},${direction}`; 
  }
  
  // 添加观看状态过滤
  if (watchedFilter.value !== null) {
    params.watched = watchedFilter.value;
  }
  
  getMovies(params);
};


// 点击外部关闭搜索历史下拉菜单
const handleClickOutside = (event) => {
  // 检查点击的元素是否是搜索框或其子元素
  const container = document.querySelector('.search-input-container')
  
  // 只有当搜索历史显示时才处理点击事件
  if (showSearchHistory.value) {
    // 如果点击的是容器外部
    if (container && !container.contains(event.target)) {
      // 使用setTimeout避免与其他点击事件冲突
      setTimeout(() => {
        showSearchHistory.value = false
      }, 50)
    }
  }
}

onMounted(() => {
  // 加载搜索历史记录
  loadSearchHistory();
  
  // 添加点击外部关闭搜索历史下拉菜单的事件监听
  document.addEventListener('click', handleClickOutside)
  
  const query = route.query;
  if (query.page && !isNaN(parseInt(query.page))) {
    currentPage.value = parseInt(query.page);
  }
  if (query.pageSize && !isNaN(parseInt(query.pageSize))) {
    pageSize.value = parseInt(query.pageSize);
  }
  if (query.watched === 'true') {
    watchedFilter.value = true;
  } else if (query.watched === 'false') {
    watchedFilter.value = false;
  } else {
    watchedFilter.value = null;
  }
  if (query.sortField) {
    if (sortOptions.value.some(opt => opt.field === query.sortField) || query.sortField === 'random') {
        sortField.value = query.sortField;
    }
  }
   if (query.sortOrder && (query.sortOrder === 'asc' || query.sortOrder === 'desc') && sortField.value !== 'random') {
     if (sortDirections.value.hasOwnProperty(sortField.value)) {
        sortDirections.value[sortField.value] = query.sortOrder;
     }
  }

  if (query.type && query.keyword) {
    searchType.value = query.type;
    searchQuery.value = query.keyword;
  } else {
    searchType.value = 'all';
    searchQuery.value = '';
  }

  // 初始化搜索
  handleSearch();

  window.addEventListener('resize', () => {
    movies.value = [...movies.value];
  });
});

// 添加搜索历史记录的函数，只在用户主动搜索时调用
const addSearchHistoryRecord = () => {
  if (searchQuery.value && searchQuery.value.trim() !== '') {
    addToSearchHistory(searchType.value, searchQuery.value);
  }
};

// 主搜索函数
// 现在直接调用API，不经过路由更新来避免重复请求
const handleSearch = () => {
  const params = {
    page: currentPage.value - 1,
    size: pageSize.value
  };
  
  // 处理排序方式
  if (sortField.value === 'random') {
    params.random = true;
  } else {
    // 添加防御性代码，确保排序方向存在
    const direction = sortDirections.value && sortField.value ? (sortDirections.value[sortField.value] || 'desc') : 'desc';
    params.sort = `${sortField.value},${direction}`;
  }
  
  // 添加观看状态过滤
  if (watchedFilter.value !== null) {
    params.watched = watchedFilter.value;
  }
  
  // 添加搜索关键词
  if (searchQuery.value) {
    params.keyword = searchQuery.value;
  }
  
  // 更新路由查询参数，但不触发路由变化（使用replace而不是push）
  // 这样在页面刷新或分享链接时能保持当前状态
  const query = {};
  
  // 只有在有搜索条件时才添加到URL
  if (searchType.value !== 'all' && searchQuery.value) {
    query.type = searchType.value;
    query.keyword = searchQuery.value;
  }
  
  // 添加页码和页面大小
  if (currentPage.value > 1) {
    query.page = currentPage.value.toString();
  }
  
  if (pageSize.value !== 20) { // 假设20是默认页面大小
    query.pageSize = pageSize.value.toString();
  }
  
  // 添加排序信息（如果不是默认排序）
  if (sortField.value !== 'created_at') {
    query.sortField = sortField.value;
  }
  
  const defaultDirection = 'desc';
  if (sortField.value !== 'random' && sortDirections.value[sortField.value] !== defaultDirection) {
    query.sortOrder = sortDirections.value[sortField.value];
  }
  
  // 添加观看状态过滤（如果不是默认值）
  if (watchedFilter.value !== null) {
    query.watched = watchedFilter.value.toString();
  }
  
  // 使用replace而不是push，避免创建新的历史记录
  router.replace({ query });
  
  // 调用通用API获取数据函数
  getMovies(params);
}


const resetSearch = () => {
  // 重置所有搜索和过滤条件
  searchQuery.value = ''
  searchType.value = 'all'
  watchedFilter.value = null
  currentPage.value = 1  // 重置到第一页
  total.value = 0
  
  // 重置排序为默认状态
  sortField.value = 'created_at'
  sortDirections.value = {
    release_date: 'desc',
    created_at: 'desc', 
    play_count: 'desc',
    rating: 'desc',
    random: 'desc'
  }
  
  // 回到顶部
  const mainElement = document.querySelector('.el-main')
  if (mainElement) {
    mainElement.scrollTop = 0
  }
  
  // 刷新数据
  handleSearch();
}

// 同步115功能已移除

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

const goToDetail = (id) => {
  // 保存 el-main 元素的滚动位置
  const mainElement = document.querySelector('.el-main')
  const scrollTop = mainElement ? mainElement.scrollTop : 0
  localStorage.setItem('homeScrollPosition', scrollTop.toString())
  
  router.push(`/detail/${id}`);  // 使用router.push支持页面缓存
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  handleSearch();
}

const handleSizeChange = (val) => {
  pageSize.value = val
  // 当改变每页显示数量时，通常需要重置到第一页，以避免页码超出范围
  currentPage.value = 1
  handleSearch();
}

const placeholderCount = computed(() => {
  if (movies.value.length === 0) return 0
  const columnsPerRow = 8;
  const remainder = movies.value.length % columnsPerRow;
  return remainder === 0 ? 0 : columnsPerRow - remainder;
})

// 检查 keep-alive 是否正常工作
onActivated(() => {
  // 尝试恢复滚动位置
  const savedScrollPosition = localStorage.getItem('homeScrollPosition')
  if (savedScrollPosition) {
    const mainElement = document.querySelector('.el-main')
    if (mainElement) {
      mainElement.scrollTop = parseInt(savedScrollPosition)
      localStorage.removeItem('homeScrollPosition')
    }
  } else {
    // 如果没有保存的滚动位置，检查是否有新的搜索参数
    const query = route.query
    if (query.type && query.keyword) {
      // 从详情页跳转过来的搜索
      searchType.value = query.type
      searchQuery.value = query.keyword
      
      // 如果有页码参数，使用它，否则默认为第一页
      if (query.page && !isNaN(parseInt(query.page))) {
        currentPage.value = parseInt(query.page);
      }
      
      // 如果有页面大小参数，使用它
      if (query.pageSize && !isNaN(parseInt(query.pageSize))) {
        pageSize.value = parseInt(query.pageSize);
      }
      
      // 处理观看状态过滤
      if (query.watched === 'true') {
        watchedFilter.value = true;
      } else if (query.watched === 'false') {
        watchedFilter.value = false;
      }
      
      // 处理排序字段和方向
      if (query.sortField) {
        if (sortOptions.value.some(opt => opt.field === query.sortField) || query.sortField === 'random') {
          sortField.value = query.sortField;
        }
      }
      
      if (query.sortOrder && (query.sortOrder === 'asc' || query.sortOrder === 'desc') && sortField.value !== 'random') {
        if (sortDirections.value.hasOwnProperty(sortField.value)) {
          sortDirections.value[sortField.value] = query.sortOrder;
        }
      }
      
      console.log('onActivated - searchType:', searchType.value, 'searchQuery:', searchQuery.value, 'page:', currentPage.value);
      // 设置标志，防止watch重复处理
      isFromActivated = true;
      handleSearch()
    }
  }
})

onDeactivated(() => {
})

onUnmounted(() => {
  // 移除点击外部关闭搜索历史下拉菜单的事件监听
  document.removeEventListener('click', handleClickOutside)
})

// 监听来自App.vue的重置触发器
watch(
  () => props.resetTrigger,
  (newValue) => {
    if (newValue > 0) {
      // 检查是否有搜索条件或不在顶部，如果有则重置
      const mainElement = document.querySelector('.el-main')
      const hasSearchConditions = searchQuery.value || searchType.value !== 'all' || watchedFilter.value !== null
      const notAtTop = mainElement && mainElement.scrollTop > 0
      
      if (hasSearchConditions || notAtTop) {
        resetSearch()
      }
    }
  },
  { immediate: false }
)

// 监听路由查询参数变化，处理从详情页跳转回来的搜索
// 注意：由于onActivated已经处理了从详情页跳转回来的搜索，这里不需要重复处理
// 只有在组件保持活跃状态下，路由参数变化时才需要处理
let isFromActivated = false;

watch(
  () => route.query,
  (newQuery, oldQuery) => {
    // 如果是从onActivated触发的参数变化，跳过处理
    if (isFromActivated) {
      isFromActivated = false;
      return;
    }
    
    // 检查是否是从详情页跳转过来的搜索（有type和keyword参数）
    if (newQuery.type && newQuery.keyword) {
      // 检查参数是否真的变化了
      if (newQuery.type !== oldQuery?.type || newQuery.keyword !== oldQuery?.keyword) {
        searchType.value = newQuery.type
        searchQuery.value = newQuery.keyword
        
        // 如果有页码参数，使用它，否则保持当前页码
        if (newQuery.page && !isNaN(parseInt(newQuery.page))) {
          currentPage.value = parseInt(newQuery.page);
        }
        
        // 如果有页面大小参数，使用它
        if (newQuery.pageSize && !isNaN(parseInt(newQuery.pageSize))) {
          pageSize.value = parseInt(newQuery.pageSize);
        }
        
        // 处理观看状态过滤
        if (newQuery.watched === 'true') {
          watchedFilter.value = true;
        } else if (newQuery.watched === 'false') {
          watchedFilter.value = false;
        }
        
        // 处理排序字段和方向
        if (newQuery.sortField) {
          if (sortOptions.value.some(opt => opt.field === newQuery.sortField) || newQuery.sortField === 'random') {
            sortField.value = newQuery.sortField;
          }
        }
        
        if (newQuery.sortOrder && (newQuery.sortOrder === 'asc' || newQuery.sortOrder === 'desc') && sortField.value !== 'random') {
          if (sortDirections.value.hasOwnProperty(sortField.value)) {
            sortDirections.value[sortField.value] = newQuery.sortOrder;
          }
        }
        
        console.log('watch - searchType:', searchType.value, 'searchQuery:', searchQuery.value, 'page:', currentPage.value);
        handleSearch()
      }
    }
  },
  { immediate: false } // 不在组件初始化时立即执行
)
</script>

<style lang="scss" scoped>
.home-container {
  background-color: #000000; 
  color: #e0e0e0;           
  min-height: 100vh;

  .header {
    background-color: #000000; 
    border-bottom: 1px solid #333333; 
    box-shadow: none !important; // Explicitly remove box-shadow
    position: sticky;
    top: 0;
    z-index: 100; // 保证悬浮在内容之上
    backdrop-filter: saturate(180%) blur(6px);
    background-color: rgba(0, 0, 0, 0.9);
  }
  
  .toolbar-top {
    display: flex; 
    gap: 8px; 
    padding: 8px; 
    align-items: center; 
    --search-height: 36px;

    /* 还原老样式：去除 search-box 定制 */
    .divider { display: none; }

    .search-input { 
      flex: 1;
      max-width: 100%;
    }
    
    // 搜索历史下拉菜单样式
    .search-input-container {
      position: relative;
      
      .search-history-dropdown {
        background-color: #1a1a1a;
        border: 1px solid #333;
        border-radius: 4px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
        z-index: 100;
        
        .search-history-item {
          transition: background-color 0.2s;
          
          &:hover {
            background-color: #2c2c2c;
          }
        }
      }
    }
    
    :deep(.el-input.search-input),
    :deep(.el-select.watched-filter) {
        border: none !important;
        outline: none !important;
        box-shadow: none !important; 
    }

    :deep(.el-select .el-input__wrapper) { 
      background-color: #1a1a1a !important;
      color: #e0e0e0 !important;
      border: 1px solid #333333 !important;
      box-shadow: none !important;
      padding: 0 12px !important;
      height: var(--search-height) !important;
      border-radius: 6px !important;
    }
    :deep(.search-input .el-input__wrapper) { 
      background-color: #1a1a1a !important;
      color: #e0e0e0 !important;
      border: 1px solid #333333 !important;
      box-shadow: none !important;
      padding: 0 12px !important;
      height: var(--search-height) !important;
      border-radius: 6px !important;
    }
    :deep(.search-input .el-input-group__append),
    :deep(.search-input .el-input-group__prepend) {
      background-color: transparent !important;
      border: none !important; /* 去除白色边框 */
      padding: 0 !important;
    }
    :deep(.search-input .el-input-group__append .el-button) {
      height: var(--search-height) !important;
      padding: 0 14px !important;
      border-radius: 6px !important;
      margin-left: 0 !important; /* 去掉按钮与输入的缝隙，消除白线 */
      box-shadow: none !important;
    }
    :deep(.watched-filter .el-input__wrapper) { 
      background-color: transparent !important;
      color: #e0e0e0 !important;
      border: none !important;
      box-shadow: none !important;
    }
    :deep(.el-input__inner::placeholder) { 
        color: #757575 !important;
    }
     :deep(.el-select .el-input__inner) { 
        color: #e0e0e0 !important;
    }

    :deep(.el-select .el-input .el-select__caret) { 
        color: #a8abb2; // A slightly lighter grey for caret, or #e0e0e0
    }

    .search-type-select {
      :deep(.el-input__wrapper) {
        background-color: #2c2c2c !important;
        border: 1px solid #444444 !important;
        box-shadow: none !important;
      }
      :deep(.el-input__inner) {
        color: #e0e0e0 !important;
      }
      :deep(.el-input .el-select__caret) {
        color: #e0e0e0 !important;
      }
    }

    .append-wrap {
      display: none;
    }
    .append-divider {
      display: none;
    }

    /* 去除内置搜索按钮样式（恢复右侧主色按钮） */
    .search-append-btn { display: none; }

    :deep(.el-button) {
      &.el-button--primary { 
        background-color: #007bff !important; 
        border-color: #007bff !important;
        color: #ffffff !important;
        &:hover {
            background-color: #0056b3 !important;
            border-color: #0056b3 !important;
        }
      }
      &:not(.el-button--primary):not([type='text']) { 
        background-color: #2c2c2c !important; 
        border-color: #444444 !important;
        color: #e0e0e0 !important;
        &:hover {
            background-color: #383838 !important;
            border-color: #555555 !important;
        }
      }
      &.el-button--text {
        color: #e0e0e0 !important;
      }
      .el-icon {
        color: inherit !important; 
      }
    }

    :deep(.el-dropdown > .el-button.el-button--primary) {
        background-color: #2c2c2c !important; 
        border-color: #444444 !important;
        color: #e0e0e0 !important;
        &:hover {
            background-color: #383838 !important;
            border-color: #555555 !important;
        }
        .el-icon {
            color: #e0e0e0 !important; // Ensure icon color is consistent
        }
    }
  }

  .toolbar-bottom {
    display: flex;
    gap: 10px;
    padding: 8px;
    align-items: center;
    border-top: 1px solid #222;
    background: transparent; // 继承header的模糊背景
  }

  .content {
    background-color: transparent; 
  }

  .pagination-container {
    background-color: transparent; 
    position: sticky;
    bottom: 0;
    z-index: 90; // 吸底显示在内容之上
    padding: 6px 0;
    background: rgba(0, 0, 0, 0.85);
    border-top: 1px solid #333;
    
    :deep(.el-pagination) {
      background-color: rgba(0, 0, 0, 0.8) !important; 
      box-shadow: 0 2px 12px 0 rgba(255, 255, 255, 0.05) !important;
    }
    :deep(.el-pagination__total),
    :deep(.el-pagination__jump),
    :deep(.el-pagination__sizes .el-input__inner) {
      color: #e0e0e0 !important;
    }
    :deep(.el-pager li),
    :deep(.el-pagination button:not([disabled])) {
      background-color: #2c2c2c !important;
      color: #e0e0e0 !important;
      &:hover {
        color: #007bff !important; 
      }
    }
    :deep(.el-pager li.is-active) {
      background-color: #007bff !important;
      color: #ffffff !important;
    }
     :deep(.el-pagination .el-select .el-input__wrapper) { 
        background-color: #1a1a1a !important;
        color: #e0e0e0 !important;
        border: 1px solid #333333 !important;
    }
    :deep(.el-pagination .btn-prev .el-icon),
    :deep(.el-pagination .btn-next .el-icon) {
        color: #e0e0e0 !important; 
    }
  }
}

.el-dropdown-menu__item.is-active {
  color: var(--el-color-primary);
}
</style>
