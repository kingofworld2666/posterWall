<template>
  <div class="recommend-container">
    <el-tabs
      v-model="activeTab"
      class="recommend-tabs"
    >
      <el-tab-pane
        label="为你推荐"
        name="personal"
      >
        <div class="section-title">
          <h3>根据你的观看历史推荐</h3>
        </div>
        <MovieGrid
          :movies="personalMovies"
          :loading="loadingPersonal"
          :get-image-url="getImageUrl"
          :play-count-inline="true"
          :placeholder-count="0"
          @movie-click="goToDetail"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import MovieGrid from '@/components/MovieGrid.vue'
import { fetchPersonalRecommends } from '@/services/recommend'

const router = useRouter()
const activeTab = ref('personal')
const DEFAULT_LIMIT = 48

const personalRecommends = ref([])
const loadingPersonal = ref(false)

const debug = (label, payload) => {
  // 统一打点，便于过滤
  // eslint-disable-next-line no-console
  console.log(`[Recommend] ${label}:`, payload)
}

const mapToCard = (raw) => {
  const wrapper = raw || {}
  const base = wrapper.movie || wrapper
  const id = base.id || base.movieId || base.movie_id
  const title = base.titleZh || base.title || base.movieName || base.title_zh
  const posterSrc = base.poster || base.posterPath || base.poster_path || base.coverPath || base.cover_url || base.thumbnail_url
  const year = base.releaseDate || base.release_date || base.year
  const rating = base.rating || base.rating_score
  const matchScore = wrapper.score ?? wrapper.matchScore ?? base.matchScore ?? base.score ?? wrapper.match
  const similarity = wrapper.similarity ?? wrapper.similarityScore ?? base.similarity ?? base.similarityScore
  const movieCode = base.movieCode || base.code || base.movie_code || wrapper.movieCode
  const playCount = base.playCount || wrapper.playCount || 0

  return {
    id,
    title,
    poster: posterSrc ? getImageUrl(posterSrc) : '',
    year,
    rating,
    matchScore,
    similarity,
    movieCode,
    playCount
  }
}

// 映射为 HomeView/MovieGrid 需要的字段，仅保留番号与播放数
const toGridItem = (c) => ({
  id: String(c.id ?? ''),
  movieCode: c.movieCode || '',
  posterPath: c.poster || c.posterPath || c.coverPath || '',
  playCount: Number(c.playCount || 0),
  titleZh: '',
  titleJa: '',
  favoriteTime: undefined,
  historyTime: undefined
})

const personalMovies = computed(() => personalRecommends.value.map(toGridItem))

const getImageUrl = (path) => {
  if (!path) return ''
  const s = String(path)
  if (s.startsWith('http')) return s
  if (s.includes('patu')) {
    const fileName = s.split('\\').pop()
    return fileName ? `/api/images/${fileName}` : ''
  }
  const relativePath = s.split('success\\')[1]?.replace(/\\/g, '/')
  return relativePath ? `/api/images/${relativePath}` : s
}

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

const loadPersonal = async () => {
  try {
    loadingPersonal.value = true
    const { data } = await fetchPersonalRecommends({ limit: DEFAULT_LIMIT })
    const list = extractList(data)
    debug('personal raw', data)
    debug('personal list', list)
    personalRecommends.value = list.map(mapToCard)
    debug('personal mapped sample', personalRecommends.value[0])
  } catch (e) {
    console.error('加载个人推荐失败', e)
    personalRecommends.value = []
  } finally { loadingPersonal.value = false }
}

const goToDetail = (id) => {
  router.push(`/detail/${id}`)
}

onMounted(async () => {
  debug('mounted', true)
  await loadPersonal()
})
</script>

<style lang="scss" scoped>
.recommend-container {
  padding: 20px;

  .recommend-tabs {
    .section-title {
      margin-bottom: 20px;

      h3 {
        margin: 0;
        font-size: 20px;
        color: var(--el-text-color-primary);
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .el-select {
        width: 200px;
      }
    }
  }
}

:deep(.movie-card) {
  position: relative;
  margin-bottom: 20px;

  .match-score,
  .trending-rank,
  .similarity-score {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .trending-rank {
    background: linear-gradient(45deg, #ff4757, #ff6b81);
  }

  .match-score {
    background: linear-gradient(45deg, #2ed573, #7bed9f);
  }

  .similarity-score {
    background: linear-gradient(45deg, #1e90ff, #70a1ff);
  }
}
</style>
