<template>
  <div class="movie-grid" v-loading="loading" element-loading-text="加载中...">
    <a
      v-for="movie in movies"
      :key="movie.id"
      :href="getMovieDetailHref(movie.id)"
      @click.prevent="onMovieClick(movie.id)"
      target="_blank"
      rel="noopener noreferrer"
      class="movie-card-link"
    >
      <el-card
        class="movie-card"
        :body-style="{ padding: '0px' }"
        shadow="hover"
      >
      <div class="poster-container">
        <el-image
          :src="props.getImageUrl(movie.posterPath)"
          fit="cover"
          loading="lazy"
        >
          <template #error>
            <div class="image-error">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
        <div class="movie-info-overlay">
          <h3 class="movie-title">
            {{ movie.movieCode || movie.titleZh || movie.titleJa || '未知标题' }}
            <span v-if="props.playCountInline !== false" class="play-badge">
              <el-icon><VideoPlay /></el-icon>
              {{ movie.playCount || 0 }}
            </span>
          </h3>
          <div class="movie-stats">
            <span v-if="props.showFavoriteTime && movie.favoriteTime" class="stat-item favorite-time">
              <el-icon><Star /></el-icon>
              收藏于 {{ formatTime(movie.favoriteTime) }}
            </span>
            <span v-if="props.showHistoryTime && movie.historyTime" class="stat-item history-time">
              <el-icon><Timer /></el-icon>
              观看于 {{ formatTime(movie.historyTime) }}
            </span>
          </div>
        </div>
      </div>
      <div v-if="props.showRemoveButton" class="card-actions" @click.stop>
        <el-button size="small" type="danger" plain @click.stop.prevent="onRemoveClick(movie)">
          <el-icon><Delete /></el-icon> {{ props.removeButtonText || '移除' }}
        </el-button>
      </div>
      </el-card>
    </a>
    <!-- 保持网格对齐的占位符 -->
    <div
      v-for="i in props.placeholderCount"
      :key="`placeholder-${i}`"
      class="movie-card-placeholder"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Picture, View, Star, Timer, VideoPlay, Delete } from '@element-plus/icons-vue';

interface Movie {
  id: string;
  movieCode?: string;
  posterPath?: string;
  playCount?: number;
  titleZh?: string;
  titleJa?: string;
  favoriteTime?: string | number | Date;
  historyTime?: string | number | Date;
}

const props = defineProps<{
  movies: Movie[];
  loading: boolean;
  getImageUrl: (path?: string) => string;
  placeholderCount?: number;
  showFavoriteTime?: boolean;
  showHistoryTime?: boolean;
  showRemoveButton?: boolean;
  removeButtonText?: string;
  playCountInline?: boolean; // 默认: 内联徽标（除非明确传 false）
}>();

const emit = defineEmits(['movie-click', 'remove-movie']);
const router = useRouter(); // 初始化路由器

// 生成电影详情页的链接
const getMovieDetailHref = (movieId: string): string => {
  try {
    const routeData = router.resolve({
      name: 'detail', // 电影详情页的路由名称是 'detail'
      params: { id: movieId },
    });
    return routeData.href;
  } catch (e) {
    console.error("解析电影ID的路由时出错:", movieId, e);
    return '#'; // 出错时的后备链接
  }
};

const onMovieClick = (movieId: string) => {
  emit('movie-click', movieId);
};

const onRemoveClick = (movie: Movie) => {
  emit('remove-movie', movie);
};

function formatTime(timeInput: string | number | Date | undefined): string {
  if (!timeInput) return '未知时间';
  const date = new Date(timeInput);
  if (isNaN(date.getTime())) return '无效日期';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}秒前`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}小时前`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}天前`;
  
  // 对于超过一周的，直接显示年月日
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
</script>

<style lang="scss" scoped>
.movie-card-link {
  text-decoration: none; /* 移除链接下划线 */
  color: inherit; /* 继承父元素的文本颜色 */
  display: block; /* 使链接占据整个卡片区域 */
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  padding: 10px;
  background-color: #000;
  border-radius: 8px;
}

.movie-card {
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e; /* Dark background for the card */
  border: 1px solid #333333; /* Dark border for the card */
  box-shadow: none; /* Remove default box-shadow */
}

.movie-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.4); /* Adjusted shadow for dark theme */
}

.poster-container {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  background-color: #1a1a1a;
  overflow: hidden;
}

.el-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #2a2a2a; /* Dark background for image error placeholder */
  color: #6c757d; /* Adjusted color for icon/text on dark error placeholder */
  font-size: 30px;
}

.movie-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 60%, transparent 100%);
  color: white;
  opacity: 1;
  transition: opacity 0.3s ease;
  box-sizing: border-box;
  width: 100%;
}

.movie-title {
  margin: 0 0 5px 0;
  font-size: 1em;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
}

.play-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  margin-left: 8px;
  height: 18px;
  line-height: 18px;
  font-size: 12px;
  border-radius: 10px;
  background: rgba(0,0,0,0.6);
  color: #ffd166; /* 更醒目的播放数据色 */
}

.movie-stats {
  font-size: 0.8em;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.6);
  width: 100%;
}

.stat-item {
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 2px 5px;
  border-radius: 3px;
}

.stat-item .el-icon {
  margin-right: 4px;
  font-size: 1.1em;
}

.play-count {
  color: #CCCCCC; /* Light gray for play count text */
}

.card-actions {
  padding: 10px;
  border-top: 1px solid #333;
  display: flex;
  justify-content: stretch;
}

/* 更醒目的“取消收藏”按钮样式（暗色主题） */
.card-actions :deep(.el-button) {
  width: 100%;
  height: 36px;
  font-weight: 600;
  border-radius: 8px;
  background-color: #409eff !important; /* 更柔和的主题蓝 */
  border-color: #409eff !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.25);
}

.card-actions :deep(.el-button:hover) {
  background-color: #337ecc !important;
  border-color: #337ecc !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.35);
}

.card-actions :deep(.el-button:active) {
  transform: translateY(1px) scale(0.99);
}

.movie-card-placeholder {
  width: 100%;
  aspect-ratio: 2 / 3;
  background-color: transparent;
  border: none;
  padding: 0;
  margin: 0;
  box-shadow: none;
}
</style>
