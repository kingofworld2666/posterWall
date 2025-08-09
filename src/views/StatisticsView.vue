<template>
  <div class="statistics-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总影片数</span>
            </div>
          </template>
          <div class="stat-value">
            <span class="number">{{ stats.totalMovies }}</span>
            <span class="unit">部</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>已观看</span>
            </div>
          </template>
          <div class="stat-value">
            <span class="number">{{ stats.watchedMovies }}</span>
            <span class="unit">部</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总时长</span>
            </div>
          </template>
          <div class="stat-value">
            <span class="number">{{ stats.totalHours }}</span>
            <span class="unit">小时</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>收藏数</span>
            </div>
          </template>
          <div class="stat-value">
            <span class="number">{{ stats.favorites }}</span>
            <span class="unit">部</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>观看趋势</span>
              </div>
            </template>
            <div
              ref="watchTrendChart"
              class="chart"
            />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>类型分布</span>
              </div>
            </template>
            <div
              ref="genreChart"
              class="chart"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>最近观看</span>
        </div>
      </template>
      <el-table
        :data="recentWatched"
        style="width: 100%"
      >
        <el-table-column
          prop="title"
          label="影片"
          width="300"
        >
          <template #default="{ row }">
            <div class="movie-info">
              <el-image 
                :src="row.poster" 
                :preview-src-list="[row.poster]"
                class="movie-poster"
              />
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="watchTime"
          label="观看时间"
          width="180"
        />
        <el-table-column
          prop="duration"
          label="时长"
          width="100"
        />
        <el-table-column
          prop="progress"
          label="进度"
        >
          <template #default="{ row }">
            <el-progress 
              :percentage="row.progressPercentage"
              :format="(val) => `${val}%`"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const stats = ref({
  totalMovies: 1250,
  watchedMovies: 368,
  totalHours: 725,
  favorites: 86
})

const recentWatched = ref([
  {
    title: '肖申克的救赎',
    poster: 'https://example.com/poster1.jpg',
    watchTime: '2024-03-14 20:30',
    duration: '142分钟',
    progressPercentage: 100
  },
  // 更多数据...
])

const watchTrendChart = ref(null)
const genreChart = ref(null)

onMounted(() => {
  // 初始化观看趋势图表
  const trendChart = echarts.init(watchTrendChart.value)
  trendChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [15, 22, 18, 30, 25, 35],
      type: 'line',
      smooth: true
    }]
  })

  // 初始化类型分布图表
  const pieChart = echarts.init(genreChart.value)
  pieChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: '70%',
      data: [
        { value: 35, name: '剧情' },
        { value: 20, name: '动作' },
        { value: 15, name: '科幻' },
        { value: 10, name: '喜剧' },
        { value: 20, name: '其他' }
      ]
    }]
  })

  // 响应式处理
  window.addEventListener('resize', () => {
    trendChart.resize()
    pieChart.resize()
  })
})
</script>

<style lang="scss" scoped>
.statistics-container {
  .stat-card {
    margin-bottom: 20px;

    .stat-value {
      text-align: center;
      
      .number {
        font-size: 36px;
        font-weight: bold;
        color: #409EFF;
      }
      
      .unit {
        margin-left: 5px;
        font-size: 16px;
        color: #666;
      }
    }
  }

  .charts-section {
    margin: 20px 0;
    
    .chart {
      height: 300px;
    }
  }

  .table-card {
    .movie-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .movie-poster {
        width: 40px;
        height: 60px;
        border-radius: 4px;
      }
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
