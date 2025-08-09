<template>
  <div class="favorite-container">
    <div class="header">
      <div class="tabs-container">
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <el-tab-pane label="收藏的影片" name="movies">
            <template #label>
              <span><el-icon><VideoCamera /></el-icon> 收藏的影片</span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="收藏的演员" name="actors">
            <template #label>
              <span><el-icon><Avatar /></el-icon> 收藏的演员</span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="收藏的标签" name="tags">
            <template #label>
              <span><el-icon><Collection /></el-icon> 收藏的标签</span>
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          :placeholder="getSearchPlaceholder"
          @keyup.enter="loadFavorites" 
          clearable
          @clear="loadFavorites"
          class="search-input"
        >
          <template #append>
            <el-button :icon="Search" @click="loadFavorites" />
          </template>
        </el-input>
      </div>
    </div>
    
    <!-- 影片收藏内容 -->
    <div v-if="activeTab === 'movies'" class="content">
      <MovieGrid
        v-if="!loading && favoriteMovies.length > 0"
        :movies="favoriteMovies"
        :loading="loading"
        :get-image-url="getImageUrl"
        :play-count-inline="true"
        :show-remove-button="true" 
        remove-button-text="取消收藏"
        @movie-click="goToDetail"
        @remove-movie="confirmRemoveFromFavorites"
      />
      <el-empty
        v-if="!loading && favoriteMovies.length === 0"
        description="暂无收藏影片"
        :image-size="150"
      />
      <div v-if="loading" v-loading="loading" element-loading-text="加载中..." style="min-height: 200px;"></div>
    </div>
    
    <!-- 演员收藏内容 -->
    <div v-if="activeTab === 'actors'" class="content">
      <div class="actor-grid" v-if="favoriteActors.length > 0" v-loading="loading" element-loading-text="加载中...">
        <el-card 
          v-for="actor in favoriteActors" 
          :key="actor.id" 
          class="actor-card" 
          :body-style="{ padding: '0px' }"
          shadow="hover"
        >
          <div class="actor-container" @click="goToActorDetail(actor.id)">
            <el-image 
              :src="getActorImageUrl(actor.profilePath)" 
              fit="cover"
              loading="lazy"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Avatar /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="actor-info">
              <h3>{{ actor.name }}</h3>
              <div class="actor-stats">
                <span class="favorite-time">
                  <el-icon><Star /></el-icon>
                  收藏于 {{ formatFavoriteTime(actor.favoriteTime) }}
                </span>
              </div>
            </div>
          </div>
          <div class="card-actions">
            <el-button size="small" @click.stop="removeFromFavorites(actor, 'actor')">
              <el-icon><Delete /></el-icon> 取消收藏
            </el-button>
          </div>
        </el-card>
      </div>
      <el-empty v-else description="暂无收藏的演员" />
    </div>
    
    <!-- 标签收藏内容 -->
    <div v-if="activeTab === 'tags'" class="content">
      <div class="tag-grid" v-if="favoriteTags.length > 0" v-loading="loading" element-loading-text="加载中...">
        <el-card 
          v-for="tag in favoriteTags" 
          :key="tag.id" 
          class="tag-card" 
          :body-style="{ padding: '0px' }"
          shadow="hover"
        >
          <div class="tag-container" @click="searchByTag(tag.name)">
            <div class="tag-info">
              <h3>{{ tag.name }}</h3>
              <div class="tag-stats">
                <span class="movie-count">
                  <el-icon><VideoCamera /></el-icon>
                  {{ tag.movieCount || 0 }} 部影片
                </span>
                <span class="favorite-time">
                  <el-icon><Star /></el-icon>
                  收藏于 {{ formatFavoriteTime(tag.favoriteTime) }}
                </span>
              </div>
              
            </div>
          </div>
          <div class="card-actions">
            <el-button size="small" @click.stop="removeFromFavorites(tag, 'tag')">
              <el-icon><Delete /></el-icon> 取消收藏
            </el-button>
          </div>
        </el-card>
      </div>
      <el-empty v-else description="暂无收藏的标签" />
    </div>
    
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[40, 100, 500]"
        layout="total, sizes, prev, pager, next, jumper"
        :disabled="loading"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import {
  VideoCamera, Star, Picture, Delete, Avatar, Collection, Search,
  View // 添加 View 图标
} from '@element-plus/icons-vue';
import MovieGrid from '@/components/MovieGrid.vue'; // 重新导入 MovieGrid 组件

interface MovieItem {
  id: string;
  titleZh?: string;
  titleJa?: string;
  movieCode?: string;
  posterPath: string;
  favoriteTime: string; // 收藏时间
  playCount?: number; // 播放次数
}

interface ActorItem {
  id: string;
  name: string;
  profilePath: string;
  favoriteTime: string;
}

interface TagItem {
  id: string;
  name: string;
  movieCount?: number;
  favoriteTime: string;
}

const router = useRouter();

const activeTab = ref<'movies' | 'actors' | 'tags'>('movies');
const searchQuery = ref('');
const loading = ref(false);

const favoriteMovies = ref<MovieItem[]>([]);
const favoriteActors = ref<ActorItem[]>([]);
const favoriteTags = ref<TagItem[]>([]);

const currentPage = ref(1);
const pageSize = ref(40);
const total = ref(0);

const getSearchPlaceholder = computed(() => {
  switch (activeTab.value) {
    case 'movies':
      return '搜索收藏的影片';
    case 'actors':
      return '搜索收藏的演员';
    case 'tags':
      return '搜索收藏的标签';
    default:
      return '搜索';
  }
});

const loadFavorites = async () => {
  console.log('[收藏视图] loadFavorites 开始执行。');
  loading.value = true;
  try {
    let response;
    const params: { page: number, size: number, query?: string, sort?: string } = {
      page: currentPage.value - 1, // Spring Pageable 是从0开始索引的
      size: pageSize.value,
    };
    // 默认按收藏时间降序
    params.sort = 'favoriteTime,desc';
    if (searchQuery.value) {
      params.query = searchQuery.value;
    }

    if (activeTab.value === 'movies') {
      console.log('[收藏视图] 加载收藏影片，参数:', JSON.stringify(params));
      try {
        response = await axios.get('/api/favorites/movies', { params });
        console.log('[收藏视图] 收藏影片API响应:', response);
        if (response && response.data) {
          // 兼容两种返回：数组 或 分页对象 { content, totalElements }
          if (Array.isArray(response.data)) {
            favoriteMovies.value = response.data;
            total.value = response.data.length;
          } else {
            const content = Array.isArray(response.data.content) ? response.data.content : [];
            // 保障按收藏时间降序显示（如果后端未生效）
            favoriteMovies.value = content.sort((a: any, b: any) => new Date(b.favoriteTime || 0).getTime() - new Date(a.favoriteTime || 0).getTime());
            total.value = typeof response.data.totalElements === 'number' ? response.data.totalElements : favoriteMovies.value.length;
          }
        } else {
          console.error('[收藏视图] 收藏影片API响应结构异常:', response.data);
          favoriteMovies.value = [];
          total.value = 0;
          ElMessage.error('获取收藏影片数据格式错误');
        }
      } catch (apiError: any) {
        console.error('[收藏视图] API获取收藏影片出错:', apiError.response || apiError.request || apiError.message);
        ElMessage.error(`加载收藏影片失败: ${apiError.response?.data?.message || apiError.message}`);
        favoriteMovies.value = [];
        total.value = 0;
      }
    } else if (activeTab.value === 'actors') {
      console.log('[收藏视图] 加载收藏演员 (模拟数据)');
      const mockParams = {
        page: currentPage.value, // 模拟API可能期望页码从1开始
        size: pageSize.value,
        query: searchQuery.value || undefined,
      };
      favoriteActors.value = [];
      total.value = 0;
      ElMessage.info('演员收藏功能暂未连接后端');
    } else if (activeTab.value === 'tags') {
      console.log('[收藏视图] 加载收藏标签 (模拟数据)');
      const mockParams = {
        page: currentPage.value, // 模拟API可能期望页码从1开始
        size: pageSize.value,
        query: searchQuery.value || undefined,
      };
      favoriteTags.value = [];
      total.value = 0;
      ElMessage.info('标签收藏功能暂未连接后端');
    }
  } catch (error: any) {
    console.error('[收藏视图] 加载收藏失败:', error);
    ElMessage.error(error.response?.data?.message || error.message || '加载收藏失败');
    favoriteMovies.value = [];
    favoriteActors.value = [];
    favoriteTags.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
    console.log('[收藏视图] loadFavorites 执行完毕。加载状态:', loading.value);
  }
};

const handleTabClick = (tab: any) => {
  console.log('[收藏视图] 切换标签页:', tab.props.name);
  activeTab.value = tab.props.name as 'movies' | 'actors' | 'tags';
  currentPage.value = 1; // 切换标签页时重置到第一页
  searchQuery.value = ''; // 重置搜索关键字
  loadFavorites();
};

const removeFromFavorites = async (item: MovieItem | ActorItem | TagItem, type: 'movie' | 'actor' | 'tag') => {
  let operationCompletedSuccessfully = false;
  try {
    await ElMessageBox.confirm(
      `确定要取消收藏 “${type === 'movie' ? (item as MovieItem).titleZh || (item as MovieItem).movieCode : (item as ActorItem | TagItem).name}” 吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );

    loading.value = true;
    console.log(`[收藏视图] 尝试移除收藏 ${type}: ID ${item.id}`);

    if (type === 'movie') {
      try {
        // 后端按“电影ID”删除；兼容响应中既有 id 也有 movieId 的情况
        const movieId = (item as any).movieId || (item as any).id;
        const response = await axios.delete(`/api/favorites/movies/${movieId}`);
        console.log(`[收藏视图] 移除收藏影片API响应:`, response);
        if ((response.status === 200 || response.status === 204) || (response.data && response.data.success === true)) {
          ElMessage.success('取消收藏影片成功');
          operationCompletedSuccessfully = true;
        } else {
          ElMessage.error(response.data?.message || '取消收藏影片失败');
        }
      } catch (apiError: any) {
        console.error(`[收藏视图] API移除收藏影片 ${item.id} 出错:`, apiError.response || apiError.request || apiError.message);
        ElMessage.error(`取消收藏影片失败: ${apiError.response?.data?.message || apiError.message}`);
      }
    } else {
      console.warn(`[收藏视图] 尝试移除模拟收藏 ${type}: ID ${item.id} (后端未连接)`);
      ElMessage.info(`“取消收藏${type === 'actor' ? '演员' : '标签'}”功能暂未连接后端`);
    }

    if (operationCompletedSuccessfully) {
      await loadFavorites(); // 刷新列表
    }

  } catch (e) {
    if (e !== 'cancel') { // 用户在 ElMessageBox 点击了取消按钮
      console.error('[收藏视图] removeFromFavorites 函数出错 (非API错误或用户取消):', e);
    }
  } finally {
    if (!operationCompletedSuccessfully) {
      loading.value = false;
    }
    console.log('[收藏视图] removeFromFavorites 执行完毕。加载状态:', loading.value);
  }
};

const confirmRemoveFromFavorites = (movie: MovieItem) => {
  removeFromFavorites(movie, 'movie');
};

const handleSizeChange = (val: number) => {
  console.log(`[收藏视图] 每页显示条数变更: ${val}`);
  pageSize.value = val;
  loadFavorites();
};

const handleCurrentChange = (val: number) => {
  console.log(`[收藏视图] 当前页码变更: ${val}`);
  currentPage.value = val;
  loadFavorites();
};

const getImageUrl = (path: string | undefined) => {
  if (!path) return '';
  if(path.startsWith('http')){
    return path;
  }
  if(path.includes('patu')){
    const fileName = path.split('\\').pop();
    return fileName ? `/api/images/${fileName}` : '';
  }
  const relativePath = path.split('success\\')[1]?.replace(/\\/g, '/');
  return relativePath ? `/api/images/${relativePath}` : '';
};

const getActorImageUrl = (profilePath: string | undefined) => {
  return profilePath || ''; // 返回空字符串或默认图片URL
};

const formatFavoriteTime = (timeStr: string | undefined) => {
  if (!timeStr) return '未知时间';
  try {
    const date = new Date(timeStr);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  } catch (e) {
    console.warn('[收藏视图] 解析收藏时间字符串失败:', timeStr, e);
    return '时间格式错误';
  }
};

const goToDetail = (movieId: string) => {
  console.log('[收藏视图] 跳转到电影详情页, ID:', movieId);
  router.push(`/detail/${movieId}`); // 用户更新了路由
};

const goToActorDetail = (actorId: string) => {
  console.log('[收藏视图] 跳转到演员详情页, ID:', actorId);
  router.push(`/actor/${actorId}`);
};

const searchByTag = (tagName: string) => {
  router.push(`/search?tag=${encodeURIComponent(tagName)}`);
};

onMounted(() => {
  console.log('[收藏视图] 组件已挂载, 开始加载初始收藏数据。');
  loadFavorites();
});

</script>

<style scoped>
.favorite-container {
  padding: 20px;
  background-color: #000; /* 全黑背景 */
  color: #e0e0e0;
  min-height: calc(100vh - 60px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  padding: 3px;
  background-color: transparent; /* 适配黑色主题 */
  border-radius: 8px;
  box-shadow: none;
}

.tabs-container { flex-grow: 1; }

/* 改tab字体与深色主题适配 */
:deep(.el-tabs__item) {
  font-size: 16px; /* 字体稍大 */
  font-weight: 600; /* 半粗 */
  color: #e0e0e0;
}
:deep(.el-tabs__item.is-active) {
  color: #409eff; /* 激活色 */
}
:deep(.el-tabs__nav-wrap::after) { background-color: #333 !important; }

.search-bar {
  display: flex;
  align-items: center;
  width: 400px; /* Adjust as needed */
}

.content {
  padding: 3px;
  background-color: transparent;
  border-radius: 3px;
  box-shadow: none;
}

.card-actions {
  padding: 10px;
  border-top: 1px solid #ebeef5;
  text-align: right;
}

.card-actions .el-button {
  width: 100%;
}

.pagination-container { display: none !important; }

/* 输入与按钮深色适配 */
:deep(.el-input__wrapper) {
  background-color: #1a1a1a !important;
  border: 1px solid #333 !important;
  box-shadow: none !important;
}
:deep(.el-input__inner) { color: #e0e0e0 !important; }
:deep(.el-button) {
  background-color: #1a1a1a !important;
  border-color: #333 !important;
  color: #e0e0e0 !important;
}
</style>
