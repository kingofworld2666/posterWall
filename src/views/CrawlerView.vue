<template>
  <div class="crawler-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>爬虫任务管理</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="115网盘同步" name="sync115">
          <div class="sync-section">
            <el-form :model="syncForm" label-width="120px" class="sync-form">
              <el-form-item label="文件大小限制">
                <el-input-number
                  v-model="syncForm.fileSizeLimitMB"
                  :min="1"
                  :max="10000"
                  :step="10"
                  controls-position="right"
                  class="file-size-input"
                >
                  <template #append>MB</template>
                </el-input-number>
                <div class="input-tip">设置同步文件的最小大小限制，默认100MB</div>
              </el-form-item>
              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="sync115Movies" 
                  :loading="syncLoading"
                  size="large"
                >
                  <el-icon><Refresh /></el-icon>
                  {{ syncLoading ? '同步中...' : '开始同步115网盘' }}
                </el-button>
              </el-form-item>
            </el-form>
            <p class="sync-description">
              同步115网盘中的电影文件，自动识别新增、删除和待处理的电影版本
            </p>
          </div>
        </el-tab-pane>
        <el-tab-pane label="影片爬取" name="movie">
          <el-form :model="movieForm" label-width="120px">
            <el-form-item label="影片ID或链接">
              <el-input v-model="movieForm.identifier" placeholder="请输入影片ID或链接"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="startMovieCrawl">开始爬取</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="演员爬取" name="actor">
          <el-form :model="actorForm" label-width="120px">
            <el-form-item label="演员ID或链接">
              <el-input v-model="actorForm.identifier" placeholder="请输入演员ID或链接"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="startActorCrawl">开始爬取</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 115网盘同步结果展示 - 只在115网盘同步tab显示 -->
    <el-card v-if="activeTab === 'sync115'" class="box-card sync-result">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>115网盘同步结果</span>
          </div>
          <div class="header-center">
            <div v-if="syncResult?.data?.syncTime" class="sync-time-inline">
               同步时间: {{ syncResult.data.syncTime }}
            </div>
          </div>
          <div class="header-right">
            <el-tag :type="getSyncStatusType(syncResult?.data)" class="sync-status-tag">
              {{ getSyncStatusText(syncResult?.data) }}
            </el-tag>
            <el-button 
              type="primary" 
              size="small" 
              :icon="Refresh" 
              @click="refreshSyncResult"
              :loading="refreshLoading"
              class="refresh-btn"
            >
              {{ refreshLoading ? '刷新中...' : '刷新' }}
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 同步加载状态 -->
      <div v-if="syncLoading" class="sync-loading">
        <el-skeleton :rows="3" animated>
          <template #template>
            <div class="stats-row">
              <div class="stat-item">
                <el-skeleton-item variant="text" style="width: 60px; height: 32px; margin-bottom: 8px;" />
                <el-skeleton-item variant="text" style="width: 80px; height: 14px;" />
              </div>
              <div class="stat-item">
                <el-skeleton-item variant="text" style="width: 60px; height: 32px; margin-bottom: 8px;" />
                <el-skeleton-item variant="text" style="width: 80px; height: 14px;" />
              </div>
              <div class="stat-item">
                <el-skeleton-item variant="text" style="width: 60px; height: 32px; margin-bottom: 8px;" />
                <el-skeleton-item variant="text" style="width: 80px; height: 14px;" />
              </div>
            </div>
          </template>
        </el-skeleton>
        <div class="loading-text">
          <el-icon class="is-loading"><Loading /></el-icon>
          正在同步115网盘数据，请稍候...
        </div>
      </div>
      
      <!-- 统计信息 - 一行显示 -->
      <div v-else-if="syncResult && syncResult.data" class="stats-container">
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-number">{{ syncResult.data.file115Count ?? '-' }}</div>
            <div class="stat-label">115网盘视频数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ syncResult.data.movieVersionCount ?? '-' }}</div>
            <div class="stat-label">海报墙的视频数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ syncResult.data.movieCount ?? '-' }}</div>
            <div class="stat-label">番号数量</div>
          </div>
        </div>
      </div>
      
      <!-- 无数据提示 -->
      <div v-else class="no-data-tip">
        <el-empty description="暂无同步数据" />
      </div>

      <!-- 数据量警告 -->
      <el-alert
        v-if="!syncLoading && syncResult && syncResult.data && isDataTruncated"
        title="数据量过大提示"
        type="warning"
        :description="`为了防止页面卡顿，每个分类最多显示1000条数据。如需查看完整数据，请联系管理员。`"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;"
      />

      <!-- 详细信息标签页 -->
      <el-tabs v-if="!syncLoading && syncResult && syncResult.data" v-model="resultTab" class="result-tabs">
        <el-tab-pane name="added">
          <template #label>
            <div class="tab-label">
              <span>已新增</span>
              <el-badge 
                v-if="badgeCounts.added > 0"
                :value="badgeCounts.added" 
                class="tab-badge"
                type="danger"
              />
            </div>
          </template>
          <movie-version-table 
            :data="limitedData?.addedMovieVersions || []" 
            type="success"
          />
        </el-tab-pane>
        
        <el-tab-pane name="deleted">
          <template #label>
            <div class="tab-label">
              <span>已删除</span>
              <el-badge 
                v-if="badgeCounts.deleted > 0"
                :value="badgeCounts.deleted" 
                class="tab-badge"
                type="danger"
              />
            </div>
          </template>
          <movie-version-table 
            :data="limitedData?.deletedMovieVersions || []" 
            type="danger"
          />
        </el-tab-pane>
        
        <el-tab-pane name="pending">
          <template #label>
            <div class="tab-label">
              <span>未收录影片</span>
              <el-badge 
                v-if="badgeCounts.pending > 0"
                :value="badgeCounts.pending" 
                class="tab-badge"
                type="danger"
              />
            </div>
          </template>
          <movie-version-table 
            :data="limitedData?.pendingMovieVersions || []" 
            type="warning"
          />
        </el-tab-pane>
        
        <el-tab-pane name="failed">
          <template #label>
            <div class="tab-label">
              <span>番号提取失败</span>
              <el-badge 
                v-if="badgeCounts.failed > 0"
                :value="badgeCounts.failed" 
                class="tab-badge"
                type="danger"
              />
            </div>
          </template>
          <movie-version-table 
            :data="limitedData?.codeExtractFailed || []" 
            type="info"
          />
        </el-tab-pane>
        
        <el-tab-pane name="codes">
          <template #label>
            <div class="tab-label">
              <span>未收录番号</span>
              <el-badge 
                v-if="badgeCounts.codes > 0"
                :value="badgeCounts.codes" 
                class="tab-badge"
                type="danger"
              />
            </div>
          </template>
          <div class="pending-codes">
            <div 
              v-for="code in limitedData?.pendingMovieCodes || []" 
              :key="code"
              class="code-item"
            >
              <el-tag 
                class="code-tag clickable-code"
                type="warning"
                @click="openJavdbSearch(code)"
              >
                {{ code }}
              </el-tag>
              <el-button 
                link 
                size="small" 
                class="copy-btn-code"
                @click="copyToClipboard(code, '电影代码')"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </div>
            <el-empty v-if="!limitedData?.pendingMovieCodes?.length" description="暂无待增电影代码" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>


  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Loading, CopyDocument } from '@element-plus/icons-vue';
import axios from 'axios';
import MovieVersionTable from '../components/MovieVersionTable.vue';

const activeTab = ref('sync115');
const resultTab = ref('added');

const movieForm = reactive({
  identifier: '',
});

const actorForm = reactive({
  identifier: '',
});

// 115网盘同步相关状态
const syncLoading = ref(false);
const syncResult = ref(null);
const refreshLoading = ref(false);
const syncForm = reactive({
  fileSizeLimitMB: 100
});

// 任务数据
const tasks = ref([]);

// 使用computed缓存徽章数量计算，提高性能
const badgeCounts = computed(() => {
  if (!syncResult.value?.data) {
    return {
      added: 0,
      deleted: 0,
      pending: 0,
      failed: 0,
      codes: 0
    };
  }
  
  return {
    added: syncResult.value.data.addedMovieVersions?.length || 0,
    deleted: syncResult.value.data.deletedMovieVersions?.length || 0,
    pending: syncResult.value.data.pendingMovieVersions?.length || 0,
    failed: syncResult.value.data.codeExtractFailed?.length || 0,
    codes: syncResult.value.data.pendingMovieCodes?.length || 0
  };
});

// 限制数据量，防止内存溢出
const limitedData = computed(() => {
  if (!syncResult.value?.data) return null;
  
  const MAX_ITEMS = 1000; // 限制最大显示数量
  
  return {
    ...syncResult.value.data,
    addedMovieVersions: syncResult.value.data.addedMovieVersions?.slice(0, MAX_ITEMS) || [],
    deletedMovieVersions: syncResult.value.data.deletedMovieVersions?.slice(0, MAX_ITEMS) || [],
    pendingMovieVersions: syncResult.value.data.pendingMovieVersions?.slice(0, MAX_ITEMS) || [],
    codeExtractFailed: syncResult.value.data.codeExtractFailed?.slice(0, MAX_ITEMS) || [],
    pendingMovieCodes: syncResult.value.data.pendingMovieCodes?.slice(0, MAX_ITEMS) || []
  };
});

// 检查数据是否被截断
const isDataTruncated = computed(() => {
  if (!syncResult.value?.data) return false;
  
  const MAX_ITEMS = 1000;
  const data = syncResult.value.data;
  
  return (
    (data.addedMovieVersions?.length || 0) > MAX_ITEMS ||
    (data.deletedMovieVersions?.length || 0) > MAX_ITEMS ||
    (data.pendingMovieVersions?.length || 0) > MAX_ITEMS ||
    (data.codeExtractFailed?.length || 0) > MAX_ITEMS ||
    (data.pendingMovieCodes?.length || 0) > MAX_ITEMS
  );
});

const startMovieCrawl = () => {
  if (!movieForm.identifier) {
    ElMessage.warning('请输入影片ID或链接');
    return;
  }
  ElMessage.success(`开始爬取影片: ${movieForm.identifier}`);
  // 这里可以添加调用API的逻辑
  tasks.value.unshift({
    id: `T${Date.now()}`,
    type: '影片',
    name: movieForm.identifier,
    progress: 0,
    status: '等待中'
  });
  movieForm.identifier = '';
};

const startActorCrawl = () => {
  if (!actorForm.identifier) {
    ElMessage.warning('请输入演员ID或链接');
    return;
  }
  ElMessage.success(`开始爬取演员: ${actorForm.identifier}`);
  // 这里可以添加调用API的逻辑
  tasks.value.unshift({
    id: `T${Date.now()}`,
    type: '演员',
    name: actorForm.identifier,
    progress: 0,
    status: '等待中'
  });
  actorForm.identifier = '';
};

// 获取最近一次同步结果
const getLastSyncResult = async () => {
  try {
    console.log('获取最近一次同步结果...');
    const response = await axios.get('/api/115/sync/result');
    
    if (response.status === 200 && response.data) {
      console.log('获取同步结果成功:', response.data);
      syncResult.value = response.data;
      
      // 设置默认的结果展示标签页
      resultTab.value = 'added';
    }
  } catch (error) {
    console.log('暂无同步结果或获取失败:', error.response?.status === 404 ? '无历史同步记录' : error.message);
    // 404错误表示没有历史同步记录，这是正常情况，不需要显示错误消息
  }
};

// 115网盘同步功能
const sync115Movies = async () => {
  try {
    syncLoading.value = true;
    console.log('开始115网盘同步...');
    
    // 使用 axios GET 方法调用115网盘同步API，传递文件大小限制参数
    const params = new URLSearchParams({
      fileSizeLimitMB: syncForm.fileSizeLimitMB.toString()
    });
    const response = await axios.get(`/api/115/sync?${params}`);
    
    if (response.status === 200) {
      ElMessage.success('115网盘同步完成！');
      console.log('115网盘同步成功:', response.data);
      
      // 设置同步结果数据
      syncResult.value = response.data;
      
      // 切换到结果展示标签页
      resultTab.value = 'added';
    } else {
      ElMessage.error('115网盘同步失败');
      console.error('115网盘同步失败:', response);
    }
  } catch (error) {
    console.error('115网盘同步出错:', error);
    ElMessage.error('115网盘同步出错: ' + (error.response?.data?.message || error.message));
  } finally {
    syncLoading.value = false;
  }
};

// 刷新同步结果
const refreshSyncResult = async () => {
  try {
    refreshLoading.value = true;
    await getLastSyncResult();
    ElMessage.success('同步结果已刷新');
  } catch (error) {
    ElMessage.error('刷新失败');
  } finally {
    refreshLoading.value = false;
  }
};

// 获取同步状态类型
const getSyncStatusType = (result) => {
  // 只要result不为null就是成功
  return result ? 'success' : 'info';
};

// 获取同步状态文本
const getSyncStatusText = (result) => {
  // 只要result不为null就是成功
  return result ? '同步成功' : '未知状态';
};



const openJavdbSearch = (code) => {
  const url = `https://javdb.com/search?q=${code}&f=all`
  window.open(url, '_blank')
}

// 复制到剪贴板
const copyToClipboard = async (text, type) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(`${type}已复制到剪贴板`);
  } catch (err) {
    // 降级方案：使用传统的复制方法
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      ElMessage.success(`${type}已复制到剪贴板`);
    } catch (fallbackErr) {
      ElMessage.error('复制失败，请手动复制');
    }
    document.body.removeChild(textArea);
  }
};

// 页面初始化时获取最近的同步结果
onMounted(() => {
  getLastSyncResult();
});

// 监听 activeTab 变化，当切换到 sync115 时自动加载数据
watch(activeTab, (newTab) => {
  if (newTab === 'sync115' && !syncResult.value && !syncLoading.value) {
    // 只有在没有同步结果且没有正在加载时才自动获取数据
    getLastSyncResult();
  }
});
</script>

<style scoped>
/* 黑色主题样式 */
.crawler-container {
  padding: 20px;
  background-color: #1a1a1a;
  min-height: 100vh;
  color: #ffffff;
}

.box-card {
  margin-bottom: 20px;
  background-color: #2d2d2d;
  border: 1px solid #404040;
}

.box-card :deep(.el-card__header) {
  background-color: #333333;
  border-bottom: 1px solid #404040;
  color: #ffffff;
}

.box-card :deep(.el-card__body) {
  background-color: #2d2d2d;
  color: #ffffff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.header-left span {
  color: #ffffff;
  font-weight: 600;
}

.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 同步时间样式 - 绿色 */
.sync-time-inline {
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
}

/* 同步状态标签 - 绿色 */
.sync-status-tag {
  background-color: #67c23a !important;
  border-color: #67c23a !important;
  color: #ffffff !important;
}

/* 刷新按钮样式 */
.refresh-btn {
  background-color: #409eff;
  border-color: #409eff;
  color: #ffffff;
}

.refresh-btn:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.sync-time {
  font-size: 12px;
  color: #67c23a;
  margin-top: 4px;
  font-weight: normal;
}

.no-data-tip {
  padding: 40px 20px;
  text-align: center;
  color: #ffffff;
}

.task-list {
  margin-top: 20px;
}

/* 115网盘同步样式 */
.sync-section {
  padding: 40px 20px;
  background-color: #2d2d2d;
  border-radius: 8px;
}

.sync-form {
  max-width: 400px;
  margin: 0 auto 20px;
}

.file-size-input {
  width: 200px;
}

.input-tip {
  font-size: 12px;
  color: #cccccc;
  margin-top: 4px;
  line-height: 1.4;
}

.sync-section .el-button {
  margin-bottom: 16px;
  background-color: #409eff;
  border-color: #409eff;
  color: #ffffff;
}

.sync-section .el-button:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.sync-description {
  color: #cccccc;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
  text-align: center;
}

/* 同步结果样式 */
.sync-result {
  margin-top: 20px;
}

/* 同步加载状态样式 */
.sync-loading {
  padding: 20px;
  text-align: center;
}

.loading-text {
  margin-top: 20px;
  font-size: 16px;
  color: #67c23a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-text .el-icon {
  font-size: 18px;
}

/* 骨架屏样式优化 */
.sync-loading :deep(.el-skeleton__item) {
  background: linear-gradient(90deg, #404040 25%, #4a4a4a 50%, #404040 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.stats-container {
  margin-bottom: 20px;
}

.stats-group {
  margin-bottom: 24px;
}

.group-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  border-bottom: 2px solid #67c23a;
  padding-bottom: 8px;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  padding: 16px 24px;
  background: #404040;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
  flex: 1;
  min-width: 150px;
  border: 1px solid #555555;
}

.stat-item:hover {
  transform: translateY(-2px);
  background: #4a4a4a;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #67c23a;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #cccccc;
  font-weight: 500;
}

/* 主要标签页样式 */
:deep(.el-tabs__header) {
  background-color: #333333;
  border-radius: 4px;
  margin-bottom: 16px;
}

:deep(.el-tabs__item) {
  font-weight: 500;
  color: #cccccc !important;
}

:deep(.el-tabs__item.is-active) {
  color: #67c23a !important;
}

:deep(.el-tabs__active-bar) {
  background-color: #67c23a;
}

:deep(.el-tabs__nav-wrap::after) {
  background-color: #555555;
}

/* 结果标签页样式 */
.result-tabs {
  margin-top: 16px;
}

.result-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
  background-color: #333333;
  border-radius: 4px;
}

.result-tabs :deep(.el-tabs__item) {
  font-weight: 500;
  color: #cccccc;
}

.result-tabs :deep(.el-tabs__item.is-active) {
  color: #67c23a;
}

.result-tabs :deep(.el-tabs__active-bar) {
  background-color: #67c23a;
}

.result-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: #555555;
}

/* 待增代码样式 */
.pending-codes {
  padding: 16px;
  background-color: #2d2d2d;
  border-radius: 8px;
}

.code-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 4px 8px 4px 0;
}

.code-tag {
  font-family: 'Courier New', monospace;
  background-color: #67c23a;
  border-color: #67c23a;
  color: #ffffff;
  font-weight: bold;
}

.clickable-code {
  cursor: pointer;
  transition: all 0.3s ease;
}

.clickable-code:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  background-color: #85ce61 !important;
  border-color: #85ce61 !important;
}

.copy-btn-code {
  opacity: 0.6;
  transition: all 0.2s ease;
  color: #67c23a !important;
  padding: 4px !important;
  min-width: auto !important;
}

.copy-btn-code:hover {
  opacity: 1;
  background-color: rgba(103, 194, 58, 0.1) !important;
  color: #67c23a !important;
}

/* Tab标签样式 */
.tab-label {
  display: flex;
  align-items: center;
  position: relative;
}

.tab-badge {
  margin-left: 8px;
}

.tab-badge :deep(.el-badge__content) {
  background-color: #ff6b35 !important;
  border: none !important;
  font-size: 11px !important;
  font-weight: bold !important;
  height: 18px !important;
  line-height: 14px !important;
  padding: 0 6px !important;
  min-width: 18px !important;
  border-radius: 10px !important;
  color: #000000 !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4) !important;
  transform: scale(1) !important;
  text-shadow: none !important;
}

/* 表单元素样式优化 */
:deep(.el-input__wrapper) {
  background-color: #404040;
  border: 1px solid #555555;
}

:deep(.el-input__inner) {
  color: #ffffff;
  background-color: transparent;
}

:deep(.el-input__inner::placeholder) {
  color: #999999;
}

:deep(.el-textarea__inner) {
  background-color: #404040;
  border: 1px solid #555555;
  color: #ffffff;
}

:deep(.el-textarea__inner::placeholder) {
  color: #999999;
}

/* 空状态样式 */
:deep(.el-empty__description p) {
  color: #cccccc;
}

:deep(.el-empty__image svg) {
  fill: #666666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .sync-section {
    padding: 24px 16px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>