<template>
  <div class="actors-container">
    <div class="header">
      <h2>演员库</h2>
      <div class="actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索演员..."
          prefix-icon="Search"
          clearable
          @clear="handleSearch"
          @input="handleSearch"
        />
        <el-select
          v-model="sortBy"
          placeholder="排序方式"
          @change="handleSortChange"
        >
          <el-option
            label="按姓名"
            value="name"
          />
          <el-option
            label="作品数量"
            value="movieCount"
          />
          <el-option
            label="主演数量"
            value="mainRoleCount"
          />
          <el-option
            label="导演数量"
            value="directorCount"
          />
        </el-select>
        <el-switch
          v-model="showUpdatedToday"
          active-text="今日更新"
          inactive-text=""
          @change="handleFilterChange"
        />
      </div>
    </div>

    <div
      v-if="showUpdatedToday || showUnrecorded"
      class="filter-tags"
    >
      <el-tag
        v-if="showUpdatedToday"
        closable
        @close="showUpdatedToday = false; handleFilterChange()"
      >
        今日更新
        <span class="count-badge">{{ todayUpdatedCount }}</span>
      </el-tag>
      <el-tag
        v-if="showUnrecorded"
        closable
        @close="showUnrecorded = false; handleFilterChange()"
      >
        未收录作品
        <span class="count-badge">{{ unrecordedCount }}</span>
      </el-tag>
    </div>

    <el-row :gutter="20">
      <el-col
        v-for="actor in actors"
        :key="actor.id"
        :xs="12"
        :sm="8"
        :md="6"
        :lg="4"
        :xl="4"
      >
        <el-card
          class="actor-card"
          @click="goToActor(actor.id)"
        >
          <div class="avatar-container">
            <el-image
              :src="formatImageUrl(actor.posterUrl) || 'https://via.placeholder.com/150'"
              fit="cover"
            />
            <div
              v-if="actor.updatedToday"
              class="update-badge"
            >
              <el-icon><Clock /></el-icon>
              今日更新
            </div>
            <div class="stats">
              <div class="stat-item">
                <el-icon><VideoCamera /></el-icon>
                <span>{{ actor.movieCount || 0 }} 部作品</span>
              </div>
              <div
                v-if="actor.mainRoleCount"
                class="stat-item"
              >
                <el-icon><View /></el-icon>
                <span>{{ actor.mainRoleCount }} 次主演</span>
              </div>
              <div
                v-if="actor.directorCount"
                class="stat-item"
              >
                <el-icon><Star /></el-icon>
                <span>{{ actor.directorCount }} 次导演</span>
              </div>
            </div>
          </div>
          <div class="info">
            <h3>{{ actor.primaryName }}</h3>
            <p
              v-if="actor.allNames && actor.allNames !== actor.primaryName"
              class="alias"
            >
              {{ actor.allNames.replace(actor.primaryName, '').trim() }}
            </p>
            <div class="tags">
              <el-tag
                v-if="actor.isDirector"
                size="small"
                effect="plain"
              >
                导演
              </el-tag>
              <el-tag 
                v-if="actor.unrecordedCount > 0" 
                type="danger" 
                size="small" 
                effect="plain"
                @click.stop="toggleUnrecorded"
              >
                未收录: {{ actor.unrecordedCount }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[24, 48, 96]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, VideoCamera, View, Star, Clock } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const searchQuery = ref('')
const sortBy = ref('name')
const currentPage = ref(0) // 后端从0开始计数
const pageSize = ref(24)
const total = ref(0)
const showUpdatedToday = ref(false)
const showUnrecorded = ref(false)
const todayUpdatedCount = ref(0)
const unrecordedCount = ref(0)

// 演员数据
const actors = ref([])

// 加载演员数据
const loadActors = async () => {
  try {
    // 调用后端接口获取演员数据
    const response = await axios.post('/api/actors/search', null, {
      params: {
        keyword: searchQuery.value,
        page: currentPage.value,
        size: pageSize.value
      }
    })
    
    // 输出响应数据用于调试
    console.log('演员数据响应:', response.data)
    
    // 更新数据
    actors.value = response.data.content || []
    total.value = response.data.totalElements || 0
    
    // 如果没有获取到数据，使用模拟数据进行展示
    if (actors.value.length === 0) {
      console.log('使用模拟数据')
      // 模拟演员数据
      actors.value = [
        {
          id: 1,
          primaryName: '莱昂纳多·迪卡普里奥',
          allNames: '莱昂纳多·迪卡普里奥 Leonardo DiCaprio',
          gender: 'MALE',
          isDirector: true,
          posterUrl: 'https://img2.doubanio.com/view/celebrity/raw/public/p470.jpg',
          movieCount: 35,
          mainRoleCount: 28,
          directorCount: 3
        },
        {
          id: 2,
          primaryName: '汤姆·汉克斯',
          allNames: '汤姆·汉克斯 Tom Hanks',
          gender: 'MALE',
          isDirector: false,
          posterUrl: 'https://img1.doubanio.com/view/celebrity/raw/public/p551.jpg',
          movieCount: 42,
          mainRoleCount: 36,
          directorCount: 0
        },
        {
          id: 3,
          primaryName: '娜塔莉·波特曼',
          allNames: '娜塔莉·波特曼 Natalie Portman',
          gender: 'FEMALE',
          isDirector: true,
          posterUrl: 'https://img2.doubanio.com/view/celebrity/raw/public/p1002.jpg',
          movieCount: 28,
          mainRoleCount: 22,
          directorCount: 2
        },
        {
          id: 4,
          primaryName: '梅丽尔·斯特里普',
          allNames: '梅丽尔·斯特里普 Meryl Streep',
          gender: 'FEMALE',
          isDirector: false,
          posterUrl: 'https://img9.doubanio.com/view/celebrity/raw/public/p538.jpg',
          movieCount: 45,
          mainRoleCount: 40,
          directorCount: 0
        }
      ]
      total.value = actors.value.length
    }
    
    // 模拟今日更新和未收录数据
    todayUpdatedCount.value = 5 // 示例值
    unrecordedCount.value = 10 // 示例值
    
    // 为每个演员添加额外属性
    actors.value.forEach(actor => {
      // 随机设置今日更新标志
      actor.updatedToday = Math.random() > 0.7
      // 随机设置未收录数量
      actor.unrecordedCount = Math.floor(Math.random() * 5)
    })
  } catch (error) {
    console.error('加载演员数据失败:', error)
    // 出错时使用模拟数据
    actors.value = [
      {
        id: 1,
        primaryName: '莱昂纳多·迪卡普里奥',
        allNames: '莱昂纳多·迪卡普里奥 Leonardo DiCaprio',
        gender: 'MALE',
        isDirector: true,
        posterUrl: 'https://img2.doubanio.com/view/celebrity/raw/public/p470.jpg',
        movieCount: 35,
        mainRoleCount: 28,
        directorCount: 3,
        updatedToday: true,
        unrecordedCount: 3
      },
      {
        id: 2,
        primaryName: '汤姆·汉克斯',
        allNames: '汤姆·汉克斯 Tom Hanks',
        gender: 'MALE',
        isDirector: false,
        posterUrl: 'https://img1.doubanio.com/view/celebrity/raw/public/p551.jpg',
        movieCount: 42,
        mainRoleCount: 36,
        directorCount: 0,
        updatedToday: false,
        unrecordedCount: 2
      }
    ]
    total.value = actors.value.length
    todayUpdatedCount.value = 1
    unrecordedCount.value = 5
  }
}

// 处理图片路径，将文件路径转换为 API 路径
const formatImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  
  // 提取 success\ 后的相对路径
  const relativePath = path.split('success\\')[1]?.replace(/\\/g, '/')
  return relativePath ? `/api/images/${relativePath}` : ''
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 0 // 重置为第一页
  loadActors()
}

// 处理排序变化
const handleSortChange = () => {
  loadActors()
}

// 处理筛选变化
const handleFilterChange = () => {
  loadActors()
}

// 处理每页显示数量变化
const handleSizeChange = (val) => {
  pageSize.value = val
  loadActors()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val - 1 // 前端从1开始，后端从0开始
  loadActors()
}

// 跳转到演员详情页
const goToActor = (actorId) => {
  router.push(`/actor/${actorId}`)
}

// 切换未收录筛选
const toggleUnrecorded = (event) => {
  event.stopPropagation()
  showUnrecorded.value = !showUnrecorded.value
  handleFilterChange()
}

onMounted(() => {
  loadActors()
})
</script>

<style lang="scss" scoped>
.actors-container {
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
      gap: 15px;

      .el-input {
        width: 200px;
      }
    }
  }

  .filter-tags {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    
    .count-badge {
      margin-left: 5px;
      background-color: rgba(0, 0, 0, 0.1);
      padding: 0 5px;
      border-radius: 10px;
      font-size: 12px;
    }
  }

  .actor-card {
    margin-bottom: 20px;
    cursor: pointer;
    transition: transform 0.3s;

    &:hover {
      transform: translateY(-5px);
    }

    .avatar-container {
      position: relative;
      padding-top: 150%;

      .el-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 4px;
      }

      .update-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: #f56c6c;
        color: white;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .stats {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
        padding: 10px;
        color: #fff;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 5px;

          &:last-child {
            margin-bottom: 0;
          }

          .el-icon {
            font-size: 16px;
          }
        }
      }
    }

    .info {
      padding: 12px;

      h3 {
        margin: 0 0 5px;
        font-size: 16px;
      }

      .alias {
        margin: 0 0 8px;
        font-size: 14px;
        color: #666;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
    }
  }

  .pagination {
    margin-top: 30px;
    display: flex;
    justify-content: center;
  }
}
</style>
