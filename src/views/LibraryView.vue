<template>
  <div class="library-container">
    <div class="header">
      <h2>媒体库</h2>
      <div class="actions">
        <el-button-group>
          <el-button
            :type="viewMode === 'grid' ? 'primary' : ''"
            @click="viewMode = 'grid'"
          >
            <el-icon><Grid /></el-icon>
          </el-button>
          <el-button
            :type="viewMode === 'list' ? 'primary' : ''"
            @click="viewMode = 'list'"
          >
            <el-icon><List /></el-icon>
          </el-button>
        </el-button-group>
        <el-select
          v-model="sortBy"
          placeholder="排序方式"
          size="default"
        >
          <el-option
            label="添加时间"
            value="dateAdded"
          />
          <el-option
            label="上映日期"
            value="releaseDate"
          />
          <el-option
            label="评分"
            value="rating"
          />
          <el-option
            label="观看次数"
            value="views"
          />
        </el-select>
        <el-button
          type="primary"
          @click="scanLibrary"
        >
          <el-icon><Refresh /></el-icon>
          扫描媒体库
        </el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <div class="filters">
        <el-select
          v-model="filters.type"
          placeholder="类型"
          clearable
        >
          <el-option
            label="电影"
            value="movie"
          />
          <el-option
            label="电视剧"
            value="tv"
          />
        </el-select>
        <el-select
          v-model="filters.genre"
          placeholder="流派"
          clearable
          multiple
        >
          <el-option
            v-for="genre in genres"
            :key="genre"
            :label="genre"
            :value="genre"
          />
        </el-select>
        <el-select
          v-model="filters.year"
          placeholder="年份"
          clearable
        >
          <el-option
            v-for="year in years"
            :key="year"
            :label="year"
            :value="year"
          />
        </el-select>
        <el-rate
          v-model="filters.rating"
          :max="5"
          clearable
        />
      </div>
    </el-card>

    <div
      class="content"
      :class="viewMode"
    >
      <template v-if="viewMode === 'grid'">
        <el-row :gutter="20">
          <el-col
            v-for="item in filteredItems"
            :key="item.id"
            :xs="12"
            :sm="8"
            :md="6"
            :lg="4"
            :xl="4"
          >
            <movie-card
              :movie="item"
              :show-progress="true"
              @click="goToDetail(item.id)"
            />
          </el-col>
        </el-row>
      </template>

      <template v-else>
        <el-table
          :data="filteredItems"
          style="width: 100%"
        >
          <el-table-column
            prop="title"
            label="标题"
            min-width="200"
          >
            <template #default="{ row }">
              <div class="title-cell">
                <el-image
                  :src="row.poster"
                  class="poster-thumbnail"
                />
                <div class="title-info">
                  <div class="title">
                    {{ row.title }}
                  </div>
                  <div class="year">
                    {{ row.year }}
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="type"
            label="类型"
            width="100"
          />
          <el-table-column
            prop="duration"
            label="时长"
            width="100"
          />
          <el-table-column
            prop="rating"
            label="评分"
            width="120"
          >
            <template #default="{ row }">
              <el-rate
                v-model="row.rating"
                disabled
              />
            </template>
          </el-table-column>
          <el-table-column
            prop="views"
            label="播放次数"
            width="100"
          />
          <el-table-column
            label="操作"
            width="150"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button-group>
                <el-button
                  type="primary"
                  text
                  @click="goToDetail(row.id)"
                >
                  <el-icon><InfoFilled /></el-icon>
                </el-button>
                <el-button
                  type="primary"
                  text
                  @click="playMovie(row.id)"
                >
                  <el-icon><VideoPlay /></el-icon>
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </div>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalItems"
        :page-sizes="[20, 40, 60, 80]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        @update:current-page="handleCurrentChange"
        @update:page-size="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Grid, List, Refresh, InfoFilled, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MovieCard from '@/components/MovieCard.vue'

const router = useRouter()
const viewMode = ref('grid')
const sortBy = ref('dateAdded')
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(100)

const filters = ref({
  type: '',
  genre: [],
  year: '',
  rating: 0
})

// 模拟数据
const genres = ['动作', '冒险', '喜剧', '剧情', '科幻', '恐怖', '爱情', '动画']
const years = Array.from({ length: 30 }, (_, i) => 2025 - i)
const items = ref(Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  title: `示例电影 ${i + 1}`,
  poster: `https://example.com/poster${i + 1}.jpg`,
  type: i % 2 === 0 ? '电影' : '电视剧',
  year: 2000 + Math.floor(Math.random() * 25),
  duration: '120分钟',
  rating: Math.ceil(Math.random() * 5),
  views: Math.floor(Math.random() * 1000),
  genre: genres[Math.floor(Math.random() * genres.length)]
})))

const filteredItems = computed(() => {
  let result = items.value

  // 应用过滤器
  if (filters.value.type) {
    result = result.filter(item => item.type === filters.value.type)
  }
  if (filters.value.genre.length > 0) {
    result = result.filter(item => filters.value.genre.includes(item.genre))
  }
  if (filters.value.year) {
    result = result.filter(item => item.year === filters.value.year)
  }
  if (filters.value.rating > 0) {
    result = result.filter(item => item.rating >= filters.value.rating)
  }

  // 应用排序
  result = [...result].sort((a, b) => {
    switch (sortBy.value) {
      case 'releaseDate':
        return b.year - a.year
      case 'rating':
        return b.rating - a.rating
      case 'views':
        return b.views - a.views
      default:
        return b.id - a.id
    }
  })

  // 应用分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

// 计算总条目数
const totalFilteredItems = computed(() => {
  let result = items.value

  if (filters.value.type) {
    result = result.filter(item => item.type === filters.value.type)
  }
  if (filters.value.genre.length > 0) {
    result = result.filter(item => filters.value.genre.includes(item.genre))
  }
  if (filters.value.year) {
    result = result.filter(item => item.year === filters.value.year)
  }
  if (filters.value.rating > 0) {
    result = result.filter(item => item.rating >= filters.value.rating)
  }

  return result.length
})

const goToDetail = (id) => {
  router.push(`/detail/${id}`)
}

const playMovie = (id) => {
  router.push(`/play/${id}`)
}

const scanLibrary = () => {
  // TODO: 实现媒体库扫描功能
  ElMessage.success('开始扫描媒体库')
}

// 处理分页事件
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 监听过滤器变化
watch([filters, sortBy], () => {
  currentPage.value = 1 // 重置到第一页
  totalItems.value = totalFilteredItems.value
}, { immediate: true })
</script>

<style lang="scss" scoped>
.library-container {
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
    }

    .actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .filter-card {
    margin-bottom: 20px;

    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;

      .el-select {
        min-width: 120px;
      }
    }
  }

  .content {
    margin-bottom: 20px;

    &.list {
      .title-cell {
        display: flex;
        align-items: center;
        gap: 12px;

        .poster-thumbnail {
          width: 40px;
          height: 60px;
          border-radius: 4px;
        }

        .title-info {
          .title {
            font-weight: bold;
            margin-bottom: 4px;
          }

          .year {
            color: #666;
            font-size: 12px;
          }
        }
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
