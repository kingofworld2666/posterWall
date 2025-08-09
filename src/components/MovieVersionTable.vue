<template>
  <div class="movie-version-table">
    <!-- 有数据时显示表格 -->
    <el-table 
      v-if="data && data.length > 0"
      :data="data" 
      style="width: 100%" 
      border
      stripe
      :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      :empty-text="getEmptyText()"
      table-layout="auto"
      max-height="600"
    >
      <el-table-column 
        prop="code" 
        label="电影代码" 
        width="160" 
        min-width="140"
        resizable
        show-overflow-tooltip
      >
        <template #default="scope">
          <div class="code-cell" v-memo="[scope.row.code]">
            <div class="code-content">
              <el-tag 
                v-if="scope.row.code" 
                :type="getTagType()" 
                size="small"
                class="clickable-code-tag"
                @click="openJavdbSearch(scope.row.code)"
              >
                {{ scope.row.code }}
              </el-tag>
              <span v-else class="no-code">未识别</span>
            </div>
            <el-button 
              v-if="scope.row.code"
              link 
              size="small" 
              class="copy-btn"
              @click="copyToClipboard(scope.row.code, '电影代码')"
            >
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="name" 
        label="文件名" 
        width="440"
        min-width="180"
        resizable
        show-overflow-tooltip
      >
        <template #default="scope">
          <div class="file-name" v-memo="[scope.row.name]">
            <el-icon class="file-icon">
              <VideoPlay v-if="isVideoFile(scope.row.name)" />
              <Document v-else />
            </el-icon>
            <span class="name-text" :title="scope.row.name">{{ scope.row.name }}</span>
            <el-button 
              link 
              size="small" 
              class="copy-btn"
              @click="copyToClipboard(scope.row.name, '文件名')"
            >
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="fid" 
        label="文件ID" 
        width="440" 
        min-width="130"
        resizable
        show-overflow-tooltip
      >
        <template #default="scope">
          <div class="fid-cell" v-memo="[scope.row.fid]">
            <el-text class="fid-text" size="small">{{ scope.row.fid }}</el-text>
            <el-button 
              link 
              size="small" 
              class="copy-btn"
              @click="copyToClipboard(scope.row.fid, '文件ID')"
            >
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="size" 
        label="文件大小" 
        width="110" 
        min-width="90"
        resizable
        align="right"
      >
        <template #default="scope">
          <span class="file-size">{{ formatFileSize(scope.row.size) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="playLong" 
        label="播放时长" 
        width="110" 
        min-width="90"
        resizable
        align="center"
      >
        <template #default="scope">
          <span class="play-duration">{{ formatDuration(scope.row.playLong) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column 
        label="操作" 
        width="120" 
        min-width="100"
        fixed="right"
        align="center"
      >
        <template #default="scope">
          <el-button 
            type="primary" 
            size="small" 
            text
            @click="viewDetails(scope.row)"
          >
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 没有数据时显示空状态 -->
    <div v-else class="empty-state">
      <el-empty :description="getEmptyText()" />
    </div>
  </div>
</template>

<script setup>
import { VideoPlay, Document, CopyDocument } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  type: {
    type: String,
    default: 'info' // success, danger, warning, info
  }
});

// 获取标签类型
const getTagType = () => {
  const typeMap = {
    success: 'success',
    danger: 'danger', 
    warning: 'warning',
    info: 'info'
  };
  return typeMap[props.type] || 'info';
};

// 获取空数据提示文本
const getEmptyText = () => {

  return  '暂无数据';
};

// 判断是否为视频文件
const isVideoFile = (filename) => {
  const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化播放时长
const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '未知';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

// 查看详情
const viewDetails = (row) => {
  ElMessage.info(`查看文件详情: ${row.name}`);
  // 这里可以添加查看详情的逻辑，比如打开详情弹窗
};

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

// 打开javdb搜索
const openJavdbSearch = (code) => {
  const searchUrl = `https://javdb.com/search?q=${encodeURIComponent(code)}`;
  window.open(searchUrl, '_blank');
  ElMessage.info(`正在跳转到javdb搜索: ${code}`);
};
</script>

<style scoped>
.movie-version-table {
  margin-top: 16px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  background-color: #2d2d2d;
  border-radius: 8px;
  border: 1px solid #404040;
}

:deep(.empty-state .el-empty) {
  background-color: transparent;
}

:deep(.empty-state .el-empty__description p) {
  color: #cccccc !important;
  font-size: 14px;
}

.code-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.code-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.clickable-code-tag {
  cursor: pointer !important;
  transition: all 0.2s ease;
}

.clickable-code-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(103, 194, 58, 0.3);
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: #409eff;
  flex-shrink: 0;
}

.name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.fid-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
}

.no-code {
  color: #67c23a;
  font-style: italic;
}

.fid-text {
  font-family: 'Courier New', monospace;
  color: #67c23a;
  flex: 1;
}

.copy-btn {
  opacity: 0.6;
  transition: all 0.2s ease;
  color: #67c23a !important;
  padding: 4px !important;
  min-width: auto !important;
}

.copy-btn:hover {
  opacity: 1;
  background-color: rgba(103, 194, 58, 0.1) !important;
  color: #67c23a !important;
}

.file-size {
  font-weight: 500;
  color: #ffffff;
}

.play-duration {
  font-family: 'Courier New', monospace;
  color: #cccccc;
}

/* 黑色主题表格样式 */
:deep(.el-table) {
  background-color: #2d2d2d !important;
  color: #ffffff;
}

:deep(.el-table th) {
  background-color: #333333 !important;
  color: #ffffff !important;
  border-bottom: 1px solid #555555;
}

:deep(.el-table td) {
  background-color: #2d2d2d !important;
  border-bottom: 1px solid #404040;
  color: #ffffff !important;
}

:deep(.el-table tr) {
  background-color: #2d2d2d !important;
}

/* 覆盖斑马纹样式 */
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #2d2d2d !important;
}

:deep(.el-table--striped .el-table__body tr:nth-child(2n) td) {
  background-color: #2d2d2d !important;
}

:deep(.el-table tr:hover > td) {
  background-color: #404040 !important;
}

/* 确保所有行都是统一背景色 */
:deep(.el-table tbody tr) {
  background-color: #2d2d2d !important;
}

:deep(.el-table tbody tr td) {
  background-color: #2d2d2d !important;
}

:deep(.el-table__empty-text) {
  color: #cccccc;
}

:deep(.el-table__empty-block) {
  background-color: #2d2d2d;
}

/* 表格边框样式 */
:deep(.el-table--border) {
  border: 1px solid #555555;
}

:deep(.el-table--border::after) {
  background-color: #555555;
}

:deep(.el-table--border th) {
  border-right: 1px solid #555555;
}

:deep(.el-table--border td) {
  border-right: 1px solid #404040;
}

/* 表格列宽调整优化 */
:deep(.el-table th.gutter) {
  display: table-cell !important;
}

:deep(.el-table .el-table__header-wrapper) {
  overflow: visible;
}

:deep(.el-table .el-table__body-wrapper) {
  overflow-x: auto;
}

/* 列调整手柄样式 */
:deep(.el-table th .cell) {
  position: relative;
}

:deep(.el-table .el-table__border-left-patch) {
  border-left: 1px solid #ebeef5;
}

/* 电影代码标签样式优化 */
:deep(.el-tag) {
  font-weight: bold !important;
  font-size: 13px !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
}

/* 统一电影代码标签为绿色 */
:deep(.el-tag--success) {
  background-color: #67c23a !important;
  border-color: #67c23a !important;
  color: #ffffff !important;
}

:deep(.el-tag--danger) {
  background-color: #67c23a !important;
  border-color: #67c23a !important;
  color: #ffffff !important;
}

:deep(.el-tag--warning) {
  background-color: #67c23a !important;
  border-color: #67c23a !important;
  color: #ffffff !important;
}

:deep(.el-tag--info) {
  background-color: #67c23a !important;
  border-color: #67c23a !important;
  color: #ffffff !important;
}

/* 表格响应式优化 */
@media (max-width: 768px) {
  .movie-version-table {
    overflow-x: auto;
  }
  
  :deep(.el-table) {
    min-width: 800px;
  }
}
</style>