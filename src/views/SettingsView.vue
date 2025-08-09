<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <el-tabs
        v-model="activeTab"
        tab-position="left"
        class="settings-tabs"
      >
        <el-tab-pane
          label="媒体库"
          name="library"
        >
          <h3>媒体库管理</h3>
          
          <div class="library-list">
            <div
              v-for="lib in libraries"
              :key="lib.id"
              class="library-item"
            >
              <div class="info">
                <el-icon :size="24">
                  <Folder />
                </el-icon>
                <div class="details">
                  <h4>{{ lib.name }}</h4>
                  <p>{{ lib.path }}</p>
                  <div class="stats">
                    <span>{{ lib.itemCount }} 个项目</span>
                    <span>{{ lib.size }}</span>
                  </div>
                </div>
              </div>
              <div class="actions">
                <el-button-group>
                  <el-button
                    :icon="Edit"
                    @click="editLibrary(lib)"
                  />
                  <el-button
                    :icon="Delete"
                    type="danger"
                    @click="removeLibrary(lib)"
                  />
                  <el-button
                    :icon="RefreshRight"
                    @click="scanLibrary(lib)"
                  />
                </el-button-group>
              </div>
            </div>
          </div>

          <el-button
            type="primary"
            @click="showAddLibraryDialog"
          >
            添加媒体库
          </el-button>
        </el-tab-pane>

        <el-tab-pane
          label="扫描设置"
          name="scan"
        >
          <h3>扫描设置</h3>
          
          <el-form label-width="180px">
            <el-form-item label="自动扫描">
              <el-switch v-model="scanSettings.autoScan" />
            </el-form-item>

            <el-form-item label="扫描间隔">
              <el-select v-model="scanSettings.interval">
                <el-option
                  label="每12小时"
                  value="12h"
                />
                <el-option
                  label="每天"
                  value="24h"
                />
                <el-option
                  label="每周"
                  value="7d"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="监控文件变化">
              <el-switch v-model="scanSettings.watchChanges" />
            </el-form-item>

            <el-form-item label="扫描时提取元数据">
              <el-switch v-model="scanSettings.extractMetadata" />
            </el-form-item>

            <el-form-item label="忽略的文件类型">
              <el-select
                v-model="scanSettings.ignoredTypes"
                multiple
              >
                <el-option
                  label="样本视频"
                  value="sample"
                />
                <el-option
                  label="预告片"
                  value="trailer"
                />
                <el-option
                  label="额外内容"
                  value="extra"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane
          label="元数据"
          name="metadata"
        >
          <h3>元数据设置</h3>
          
          <el-form label-width="180px">
            <el-form-item label="元数据来源">
              <el-select
                v-model="metadataSettings.providers"
                multiple
              >
                <el-option
                  label="TMDb"
                  value="tmdb"
                />
                <el-option
                  label="豆瓣"
                  value="douban"
                />
                <el-option
                  label="IMDb"
                  value="imdb"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="首选语言">
              <el-select v-model="metadataSettings.language">
                <el-option
                  label="中文"
                  value="zh"
                />
                <el-option
                  label="英文"
                  value="en"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="下载图片">
              <el-checkbox-group v-model="metadataSettings.images">
                <el-checkbox label="poster">
                  海报
                </el-checkbox>
                <el-checkbox label="backdrop">
                  背景图
                </el-checkbox>
                <el-checkbox label="still">
                  剧照
                </el-checkbox>
                <el-checkbox label="logo">
                  标志
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="自动匹配">
              <el-switch v-model="metadataSettings.autoMatch" />
            </el-form-item>

            <el-form-item label="匹配准确度">
              <el-slider
                v-model="metadataSettings.matchAccuracy"
                :min="0"
                :max="100"
                :step="5"
                :marks="{
                  0: '低',
                  50: '中',
                  100: '高'
                }"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane
          label="播放器"
          name="player"
        >
          <h3>播放器设置</h3>
          
          <el-form label-width="180px">
            <el-form-item label="默认播放质量">
              <el-select v-model="playerSettings.defaultQuality">
                <el-option
                  label="自动"
                  value="auto"
                />
                <el-option
                  label="原始质量"
                  value="original"
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

            <el-form-item label="默认音频语言">
              <el-select v-model="playerSettings.defaultAudio">
                <el-option
                  label="原始音轨"
                  value="original"
                />
                <el-option
                  label="中文"
                  value="zh"
                />
                <el-option
                  label="英语"
                  value="en"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="默认字幕">
              <el-select v-model="playerSettings.defaultSubtitle">
                <el-option
                  label="无"
                  value="none"
                />
                <el-option
                  label="中文"
                  value="zh"
                />
                <el-option
                  label="英语"
                  value="en"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="自动播放下一集">
              <el-switch v-model="playerSettings.autoPlayNext" />
            </el-form-item>

            <el-form-item label="记住播放进度">
              <el-switch v-model="playerSettings.rememberProgress" />
            </el-form-item>

            <el-form-item label="硬件加速">
              <el-switch v-model="playerSettings.hardwareAcceleration" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane
          label="缓存"
          name="cache"
        >
          <h3>缓存设置</h3>
          
          <el-form label-width="180px">
            <el-form-item label="图片缓存">
              <div class="cache-info">
                <span>当前使用: {{ cacheInfo.images.used }}</span>
                <el-button @click="clearImageCache">
                  清除
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="元数据缓存">
              <div class="cache-info">
                <span>当前使用: {{ cacheInfo.metadata.used }}</span>
                <el-button @click="clearMetadataCache">
                  清除
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="视频缓存">
              <div class="cache-info">
                <span>当前使用: {{ cacheInfo.videos.used }}</span>
                <el-button @click="clearVideoCache">
                  清除
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 添加媒体库对话框 -->
    <el-dialog
      v-model="addLibraryDialog.visible"
      title="添加媒体库"
      width="500px"
    >
      <el-form
        :model="addLibraryDialog.form"
        label-width="100px"
      >
        <el-form-item label="名称">
          <el-input v-model="addLibraryDialog.form.name" />
        </el-form-item>
        
        <el-form-item label="类型">
          <el-select v-model="addLibraryDialog.form.type">
            <el-option
              label="电影"
              value="movie"
            />
            <el-option
              label="电视剧"
              value="tv"
            />
            <el-option
              label="动画"
              value="anime"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="路径">
          <div class="path-selector">
            <el-input
              v-model="addLibraryDialog.form.path"
              readonly
            >
              <template #append>
                <el-button @click="showDirectoryDialog">
                  <el-icon><Folder /></el-icon>
                  选择目录
                </el-button>
              </template>
            </el-input>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addLibraryDialog.visible = false">取消</el-button>
          <el-button
            type="primary"
            @click="addLibrary"
          >确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 选择目录对话框 -->
    <el-dialog
      v-model="directoryDialog.visible"
      title="选择目录"
      width="50%"
    >
      <div class="directory-tree">
        <el-tree
          ref="directoryTree"
          :data="directoryDialog.data"
          :props="directoryDialog.props"
          node-key="path"
          :load="loadDirectory"
          lazy
          @node-click="handleDirectorySelect"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="directoryDialog.visible = false">取消</el-button>
          <el-button
            type="primary"
            @click="confirmDirectory"
          >确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
  Folder,
  Edit,
  Delete,
  RefreshRight
} from '@element-plus/icons-vue'

const activeTab = ref('library')

// 媒体库列表
const libraries = ref([
  {
    id: 1,
    name: '电影库',
    path: 'D:/Movies',
    type: 'movie',
    itemCount: 256,
    size: '1.2 TB'
  },
  {
    id: 2,
    name: '电视剧',
    path: 'D:/TV Shows',
    type: 'tv',
    itemCount: 128,
    size: '856 GB'
  }
])

// 扫描设置
const scanSettings = ref({
  autoScan: true,
  interval: '24h',
  watchChanges: true,
  extractMetadata: true,
  ignoredTypes: ['sample']
})

// 元数据设置
const metadataSettings = ref({
  providers: ['tmdb', 'douban'],
  language: 'zh',
  images: ['poster', 'backdrop'],
  autoMatch: true,
  matchAccuracy: 75
})

// 播放器设置
const playerSettings = ref({
  defaultQuality: 'auto',
  defaultAudio: 'original',
  defaultSubtitle: 'zh',
  autoPlayNext: true,
  rememberProgress: true,
  hardwareAcceleration: true
})

// 缓存信息
const cacheInfo = ref({
  images: { used: '128 MB' },
  metadata: { used: '45 MB' },
  videos: { used: '2.5 GB' }
})

// 添加媒体库对话框
const addLibraryDialog = ref({
  visible: false,
  form: {
    name: '',
    type: 'movie',
    path: ''
  }
})

// 目录选择对话框
const directoryDialog = ref({
  visible: false,
  selectedPath: '',
  data: [
    {
      name: 'C:',
      path: 'C:',
      children: []
    },
    {
      name: 'D:',
      path: 'D:',
      children: []
    }
  ],
  props: {
    label: 'name',
    children: 'children',
    isLeaf: 'isLeaf'
  }
})

// 方法
const showAddLibraryDialog = () => {
  addLibraryDialog.value.visible = true
  addLibraryDialog.value.form = {
    name: '',
    type: 'movie',
    path: ''
  }
}

const showDirectoryDialog = () => {
  directoryDialog.value.visible = true
  directoryDialog.value.selectedPath = addLibraryDialog.value.form.path
}

const loadDirectory = (node, resolve) => {
  // 模拟异步加载目录
  setTimeout(() => {
    const data = [
      {
        name: 'Movies',
        path: `${node.data.path}/Movies`,
        isLeaf: true
      },
      {
        name: 'TV Shows',
        path: `${node.data.path}/TV Shows`,
        isLeaf: true
      }
    ]
    resolve(data)
  }, 500)
}

const handleDirectorySelect = (data) => {
  directoryDialog.value.selectedPath = data.path
}

const confirmDirectory = () => {
  if (directoryDialog.value.selectedPath) {
    addLibraryDialog.value.form.path = directoryDialog.value.selectedPath
    directoryDialog.value.visible = false
  }
}

const addLibrary = () => {
  // TODO: 添加媒体库
  libraries.value.push({
    id: libraries.value.length + 1,
    ...addLibraryDialog.value.form,
    itemCount: 0,
    size: '0 B'
  })
  addLibraryDialog.value.visible = false
}

const editLibrary = (lib) => {
  // TODO: 编辑媒体库
}

const removeLibrary = (lib) => {
  ElMessageBox.confirm(
    '确定要删除这个媒体库吗？这不会删除实际的文件。',
    '删除确认',
    {
      type: 'warning'
    }
  ).then(() => {
    const index = libraries.value.findIndex(item => item.id === lib.id)
    if (index > -1) {
      libraries.value.splice(index, 1)
    }
  })
}

const scanLibrary = (lib) => {
  // TODO: 扫描媒体库
}

const clearImageCache = () => {
  // TODO: 清除图片缓存
}

const clearMetadataCache = () => {
  // TODO: 清除元数据缓存
}

const clearVideoCache = () => {
  // TODO: 清除视频缓存
}
</script>

<style lang="scss" scoped>
.settings-container {
  padding: 20px;

  .settings-card {
    min-height: 600px;

    :deep(.el-tabs) {
      height: 100%;
    }

    h3 {
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 18px;
      font-weight: 500;
    }
  }

  .library-list {
    margin-bottom: 20px;

    .library-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      margin-bottom: 10px;

      .info {
        display: flex;
        align-items: center;
        gap: 15px;

        .details {
          h4 {
            margin: 0 0 5px;
            font-size: 16px;
          }

          p {
            margin: 0 0 5px;
            color: #666;
          }

          .stats {
            font-size: 14px;
            color: #999;

            span {
              margin-right: 15px;

              &:last-child {
                margin-right: 0;
              }
            }
          }
        }
      }
    }
  }

  .path-selector {
    display: flex;
    gap: 10px;
  }

  .directory-tree {
    height: 300px;
    overflow-y: auto;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 10px;
  }

  .cache-info {
    display: flex;
    align-items: center;
    gap: 15px;

    span {
      flex: 1;
      color: #666;
    }
  }
}
</style>
