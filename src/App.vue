<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapsed ? '64px' : '200px'" class="sidebar">
      <div class="sidebar-header" :class="{ 'collapsed': isCollapsed }">
        <div class="site-title" :class="{ 'collapsed': isCollapsed }">
          <span>海报墙</span>
        </div>
        <el-button 
          :icon="isCollapsed ? 'Expand' : 'Fold'" 
          @click="toggleSidebar"
          class="collapse-btn"
          text
        />
      </div>
      <el-menu
        :router="true"
        class="sidebar-menu"
        :default-active="$route.path"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409EFF"
        :collapse="isCollapsed"
      >
        <el-menu-item index="/" @click="handleHomeClick">
          <el-icon><Monitor /></el-icon>
          <span>海报墙</span>
        </el-menu-item>
        <el-menu-item index="/history">
          <el-icon><Timer /></el-icon>
          <span>播放历史</span>
        </el-menu-item>
        <el-menu-item index="/favorite">
          <el-icon><Star /></el-icon>
          <span>收藏</span>
        </el-menu-item>
        <el-menu-item index="/recommend">
          <el-icon><Collection /></el-icon>
          <span>推荐</span>
        </el-menu-item>
        <el-menu-item index="/actors">
          <el-icon><Avatar /></el-icon>
          <span>演员</span>
        </el-menu-item>
        <el-menu-item index="/crawler">
          <el-icon><DataLine /></el-icon>
          <span>爬虫任务</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header />
      
      <el-main>
        <router-view v-slot="{ Component }">
          <keep-alive include="HomeView,HistoryView,DetailView,FavoriteView">
            <component
              :is="Component"
              :key="$route.name"
              :reset-trigger="resetTrigger"
            />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
  Search,
  Monitor,
  Collection,
  Timer,
  Star,
  DataLine,
  Avatar,
  Setting,
  Expand,
  Fold
} from '@element-plus/icons-vue'

const router = useRouter()
const resetTrigger = ref(0)
const isCollapsed = ref(false)

// 处理海报墙菜单点击，重置搜索状态
const handleHomeClick = () => {
  // 导航到首页
  router.push('/')
  
  // 触发重置信号
  resetTrigger.value++
}

// 切换侧边栏收起/展开状态
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  
  .sidebar {
    background-color: #001529;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    
    .sidebar-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #333;
      min-height: 56px;
      
      // 收起时调整布局
      &.collapsed {
        justify-content: center;
        padding: 16px 8px;
      }
      
      .site-title {
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        letter-spacing: 1px;
        opacity: 1;
        transform: translateX(0);
        transition: opacity 0.3s ease, transform 0.3s ease, width 0.3s ease;
        overflow: hidden;
        white-space: nowrap;
        
        &.collapsed {
          opacity: 0;
          transform: translateX(-20px);
          pointer-events: none;
          width: 0;
        }
        
        span {
          background: linear-gradient(45deg, #409EFF, #67C23A);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }
      
      .collapse-btn {
        color: #fff;
        padding: 8px;
        flex-shrink: 0;
        
        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
      }
    }
    
    .sidebar-search {
      padding: 16px;
      background-color: #001529;
      display: flex;
      flex-direction: column;
      gap: 8px;
      
      :deep(.el-input) {
        .el-input__wrapper {
          background-color: rgba(255, 255, 255, 0.1);
          box-shadow: none;
          border: none;
          
          &:hover, &:focus {
            background-color: rgba(255, 255, 255, 0.2);
          }
          
          .el-input__inner {
            color: #fff;
            
            &::placeholder {
              color: rgba(255, 255, 255, 0.5);
            }
          }
          
          .el-input__prefix {
            color: rgba(255, 255, 255, 0.5);
          }
        }

        .el-input-group__append {
          background-color: rgba(255, 255, 255, 0.1);
          border: none;
          box-shadow: none;
          padding: 0;

          .el-button {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            padding: 0 12px;

            &:hover {
              color: #fff;
            }
          }
        }
      }

      .upload-btn {
        background-color: #1890ff;
        border: none;
        width: 100%;

        &:hover {
          background-color: #40a9ff;
        }
      }
    }
    
    .sidebar-menu {
      height: 100%;
      border-right: none;
      flex: 1;
      
      // 优化菜单项文字的显示动画
      :deep(.el-menu-item) {
        transition: all 0.3s ease !important;
        
        span {
          opacity: 1;
          transition: opacity 0.15s ease 0.15s !important; // 延迟0.15秒显示
          transform: translateX(0);
        }
      }
      
      // 收起状态下的样式调整
      &.el-menu--collapse {
        :deep(.el-menu-item) {
          padding: 0 20px;
          
          .el-icon {
            margin-right: 0;
          }
          
          span {
            opacity: 0 !important;
            transition: opacity 0.1s ease !important; // 收起时快速隐藏
            transform: translateX(-10px);
          }
        }
      }
    }
  }
  
  .el-header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0;
    background-color: black;
    border-bottom: 1px solid black;
    height: 20px;
  }
  
  .el-main {
    background-color: #000;
    padding: 0;
    height: calc(100vh - 20px);
    overflow-y: auto;
  }
}
</style>
