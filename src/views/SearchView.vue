<template>
  <div class="search-container">
    <div class="search-header">
      <el-input
        v-model="searchQuery"
        placeholder="搜索电影、电视剧、演员..."
        class="search-input"
        clearable
        @input="handleSearch"
        @clear="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button @click="toggleAdvanced">
            高级搜索
            <el-icon><ArrowDown v-if="!showAdvanced" /><ArrowUp v-else /></el-icon>
          </el-button>
        </template>
      </el-input>

      <div
        v-if="showAdvanced"
        class="advanced-search"
      >
        <el-form
          :model="advancedFilters"
          label-width="100px"
        >
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="类型">
                <el-select
                  v-model="advancedFilters.type"
                  placeholder="选择类型"
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
                  <el-option
                    label="动漫"
                    value="anime"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="年份">
                <el-date-picker
                  v-model="advancedFilters.year"
                  type="year"
                  placeholder="选择年份"
                  format="YYYY"
                  value-format="YYYY"
                  clearable
                />
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="评分">
                <el-slider
                  v-model="advancedFilters.rating"
                  range
                  :min="0"
                  :max="10"
                  :step="0.5"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="类别">
                <el-select
                  v-model="advancedFilters.genres"
                  multiple
                  collapse-tags
                  placeholder="选择类别"
                >
                  <el-option
                    v-for="genre in genreOptions"
                    :key="genre"
                    :label="genre"
                    :value="genre"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="演员">
                <el-select
                  v-model="advancedFilters.actors"
                  multiple
                  filterable
                  remote
                  reserve-keyword
                  placeholder="搜索演员"
                  :remote-method="searchActors"
                  :loading="actorsLoading"
                >
                  <el-option
                    v-for="actor in actorOptions"
                    :key="actor.id"
                    :label="actor.name"
                    :value="actor.id"
                  >
                    <div class="actor-option">
                      <el-avatar
                        :size="30"
                        :src="actor.avatar"
                      />
                      <span>{{ actor.name }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="状态">
                <el-checkbox-group v-model="advancedFilters.status">
                  <el-checkbox label="unwatched">
                    未观看
                  </el-checkbox>
                  <el-checkbox label="favorite">
                    已收藏
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="媒体库">
                <el-select
                  v-model="advancedFilters.libraries"
                  multiple
                  collapse-tags
                  placeholder="选择媒体库"
                >
                  <el-option
                    v-for="lib in libraries"
                    :key="lib.id"
                    :label="lib.name"
                    :value="lib.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="视频质量">
                <el-select
                  v-model="advancedFilters.quality"
                  multiple
                  collapse-tags
                  placeholder="选择质量"
                >
                  <el-option
                    label="4K"
                    value="4k"
                  />
                  <el-option
                    label="1080p"
                    value="1080p"
                  />
                  <el-option
                    label="720p"
                    value="720p"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="音频">
                <el-select
                  v-model="advancedFilters.audio"
                  multiple
                  collapse-tags
                  placeholder="选择音频"
                >
                  <el-option
                    label="杜比全景声"
                    value="dolby_atmos"
                  />
                  <el-option
                    label="DTS-HD"
                    value="dts_hd"
                  />
                  <el-option
                    label="AAC"
                    value="aac"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <div class="filter-actions">
            <el-button @click="resetFilters">
              重置筛选
            </el-button>
            <el-button
              type="primary"
              @click="applyFilters"
            >
              应用筛选
            </el-button>
          </div>
        </el-form>
      </div>
    </div>

    <div class="search-content">
      <el-tabs
        v-model="activeTab"
        class="result-tabs"
      >
        <el-tab-pane
          label="全部"
          name="all"
        >
          <div class="result-stats">
            找到 {{ totalResults }} 个结果
            <div class="sort-options">
              <el-radio-group
                v-model="sortBy"
                size="small"
              >
                <el-radio-button label="relevance">
                  相关度
                </el-radio-button>
                <el-radio-button label="date">
                  日期
                </el-radio-button>
                <el-radio-button label="rating">
                  评分
                </el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <el-row :gutter="20">
            <el-col
              v-for="item in searchResults"
              :key="item.id"
              :xs="12"
              :sm="8"
              :md="6"
              :lg="4"
              :xl="4"
            >
              <movie-card :movie="item" />
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane
          label="演员"
          name="actors"
        >
          <div class="actors-grid">
            <div
              v-for="actor in actorResults"
              :key="actor.id"
              class="actor-card"
              @click="goToActor(actor.id)"
            >
              <el-avatar
                :size="100"
                :src="actor.avatar"
              />
              <h4>{{ actor.name }}</h4>
              <p class="works">
                {{ actor.workCount }} 部作品
              </p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalResults"
          :page-sizes="[24, 48, 96]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { Search, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import MovieCard from '@/components/MovieCard.vue'

const router = useRouter()
const route = useRoute()

const searchQuery = ref('')
const showAdvanced = ref(false)
const activeTab = ref('all')
const sortBy = ref('relevance')
const currentPage = ref(1)
const pageSize = ref(24)
const totalResults = ref(0)
const searchResults = ref([])

// 从路由参数中获取搜索结果
onMounted(() => {
  const { type, name, results } = route.query
  if (type && name && results) {
    searchQuery.value = name
    searchResults.value = JSON.parse(results).content
    totalResults.value = JSON.parse(results).totalElements
  }
})

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  try {
    const params = {
      name: searchQuery.value,
      page: currentPage.value - 1,
      size: pageSize.value,
      sort: sortBy.value
    }

    const response = await axios.get('/api/movies/search', { params, silent: true })
    searchResults.value = response.data.content
    totalResults.value = response.data.totalElements
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
  }
}

const handlePageChange = async (page) => {
  currentPage.value = page
  if (route.query.type) {
    // 如果是从详情页跳转来的搜索，使用对应的搜索API
    const params = {
      name: route.query.name,
      page: page - 1,
      size: pageSize.value
    }
    
    try {
      let response
      switch (route.query.type) {
        case 'actress':
          response = await axios.get('/api/movies/search/actress', { params, silent: true })
          break
        case 'director':
          response = await axios.get('/api/movies/search/director', { params, silent: true })
          break
        case 'studio':
          response = await axios.get('/api/movies/search/studio', { params, silent: true })
          break
        case 'category':
          response = await axios.get('/api/movies/search/category', { 
            params: { ...params, categoryName: params.name },
            silent: true
          })
          break
      }
      searchResults.value = response.data.content
      totalResults.value = response.data.totalElements
    } catch (error) {
      console.error('搜索失败:', error)
      ElMessage.error('搜索失败，请稍后重试')
    }
  } else {
    handleSearch()
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  handleSearch()
}

const toggleAdvanced = () => {
  showAdvanced.value = !showAdvanced.value
}

const searchActors = (query) => {
  if (query) {
    actorsLoading.value = true
    // TODO: 实现演员搜索逻辑
    setTimeout(() => {
      actorsLoading.value = false
    }, 300)
  }
}

const resetFilters = () => {
  advancedFilters.value = {
    type: '',
    year: '',
    rating: [0, 10],
    genres: [],
    actors: [],
    status: [],
    libraries: [],
    quality: [],
    audio: []
  }
}

const applyFilters = () => {
  // TODO: 应用筛选条件
  handleSearch()
}

const goToActor = (actorId) => {
  router.push(`/actor/${actorId}`)
}
</script>

<style lang="scss" scoped>
.search-container {
  .search-header {
    margin-bottom: 30px;

    .search-input {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }

    .advanced-search {
      margin-top: 20px;
      padding: 20px;
      background: #f5f7fa;
      border-radius: 4px;

      .filter-actions {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 20px;
      }
    }
  }

  .search-content {
    .result-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      color: #666;
    }

    .actors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 20px;

      .actor-card {
        text-align: center;
        cursor: pointer;
        padding: 15px;
        border-radius: 4px;
        transition: transform 0.3s;

        &:hover {
          transform: translateY(-5px);
          background: #f5f7fa;
        }

        h4 {
          margin: 10px 0 5px 0;
        }

        .works {
          margin: 0;
          color: #666;
          font-size: 12px;
        }
      }
    }

    .pagination {
      margin-top: 30px;
      display: flex;
      justify-content: center;
    }
  }
}

.actor-option {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
