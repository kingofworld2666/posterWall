<template>
  <div class="favorite-actors-container">
    <div class="header">
      <h2>收藏的演员</h2>
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索收藏的演员..."
          @keyup.enter="loadFavoriteActors" 
          clearable
          @clear="loadFavoriteActors"
          class="search-input"
        >
          <template #append>
            <el-button :icon="Search" @click="loadFavoriteActors" />
          </template>
        </el-input>
      </div>
    </div>

    <!-- 演员列表 -->
    <div class="actors-grid" v-loading="loading" element-loading-text="加载中...">
      <el-card 
        v-for="actor in favoriteActors" 
        :key="actor.id" 
        class="actor-card" 
        :body-style="{ padding: '0px' }"
        shadow="hover"
        @click="selectActor(actor)"
      >
        <div class="actor-container">
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
              <span class="movie-count">
                <el-icon><VideoCamera /></el-icon>
                {{ actor.recordedCount || 0 }} 已收录
              </span>
              <span v-if="actor.unrecordedCount > 0" class="unrecorded-count">
                <el-icon><Download /></el-icon>
                {{ actor.unrecordedCount }} 未收录
                <el-tag type="danger" size="small" effect="plain">{{ actor.newToday || 0 }}今日</el-tag>
              </span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[12, 24, 48]"
        layout="total, sizes, prev, pager, next, jumper"
        :disabled="loading"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        background
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import {
  Search, VideoCamera, Avatar, Download
} from '@element-plus/icons-vue'

const router = useRouter()

// 基础数据
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(24)
const total = ref(0)

// 演员相关
const favoriteActors = ref([])

// 加载收藏的演员
const loadFavoriteActors = async () => {
  loading.value = true
  try {
    // 模拟数据，实际应该调用API
    const mockData = {
      content: [
        {
          id: '1',
          name: '演员A',
          profilePath: '',
          recordedCount: 15,
          unrecordedCount: 5,
          newToday: 2
        },
        {
          id: '2', 
          name: '演员B',
          profilePath: '',
          recordedCount: 8,
          unrecordedCount: 0,
          newToday: 0
        }
      ],
      totalElements: 2
    }
    
    favoriteActors.value = mockData.content || []
    total.value = mockData.totalElements || 0
  } catch (error) {
    console.error('加载收藏演员失败:', error)
    ElMessage.error('加载收藏演员失败')
  } finally {
    loading.value = false
  }
}

// 选择演员
const selectActor = (actor) => {
  // 跳转到演员详情页，会在那里显示影片列表
  router.push(`/actor/${actor.id}`)
}

// 工具函数
const getActorImageUrl = (path) => {
  if (!path) return ''
  return path.startsWith('http') ? path : `/api/images/actors/${path}`
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadFavoriteActors()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  loadFavoriteActors()
}

// 初始化
onMounted(() => {
  loadFavoriteActors()
})
</script>

<style lang="scss" scoped>
.favorite-actors-container {
  background-color: #000000;
  color: #e0e0e0;
  min-height: 100vh;
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      color: #e0e0e0;
      margin: 0;
    }

    .search-bar {
      width: 300px;

      :deep(.el-input__wrapper) {
        background-color: #1a1a1a !important;
        border-color: #333333 !important;
        color: #e0e0e0 !important;
      }

      :deep(.el-input__inner) {
        color: #e0e0e0 !important;
      }
    }
  }

  .actors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 20px;

    .actor-card {
      background-color: #1e1e1e;
      border-color: #333333;
      cursor: pointer;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-4px);
      }

      .actor-container {
        display: flex;
        padding: 15px;

        .el-image {
          width: 80px;
          height: 120px;
          border-radius: 8px;
          margin-right: 15px;
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

        .actor-info {
          flex: 1;

          h3 {
            color: #e0e0e0;
            margin: 0 0 10px 0;
            font-size: 16px;
          }

          .actor-stats {
            display: flex;
            flex-direction: column;
            gap: 5px;

            span {
              display: flex;
              align-items: center;
              font-size: 14px;
              color: #999;

              .el-icon {
                margin-right: 5px;
              }

              &.unrecorded-count {
                color: #f56c6c;
              }
            }
          }
        }
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    padding: 20px;

    :deep(.el-pagination) {
      background-color: rgba(0, 0, 0, 0.8) !important;
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
  }
}
</style> 