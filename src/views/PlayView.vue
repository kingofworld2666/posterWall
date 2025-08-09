<template>
  <div class="play-container">
    <div class="main-content">
      <div class="player-wrapper">
        <video-player
          ref="playerRef"
          :src="currentVideo.url"
          :type="currentVideo.type"
          :title="currentVideo.title"
          :poster="currentVideo.poster"
          :subtitle="currentVideo.subtitle"
          :current-time="currentVideo.lastPlayTime"
          @timeupdate="handleTimeUpdate"
          @ended="handleEnded"
        />
      </div>

      <div
        v-if="isSeriesVideo"
        class="episode-list"
      >
        <div class="header">
          <h3>选集</h3>
          <el-radio-group
            v-model="currentSeason"
            size="small"
          >
            <el-radio-button 
              v-for="season in seasons" 
              :key="season"
              :label="season"
            >
              第{{ season }}季
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="episodes">
          <el-button
            v-for="episode in currentSeasonEpisodes"
            :key="episode.id"
            :type="episode.id === currentVideo.id ? 'primary' : ''"
            :class="{ 'watched': episode.watched }"
            @click="playEpisode(episode)"
          >
            {{ episode.episode }}
          </el-button>
        </div>
      </div>

      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <h2>{{ video.title }}</h2>
            <div class="actions">
              <el-button-group>
                <el-button
                  :type="video.isFavorite ? 'danger' : ''"
                  :icon="Star"
                  @click="toggleFavorite"
                >
                  收藏
                </el-button>
                <el-button
                  type="primary"
                  :icon="Download"
                  @click="downloadVideo"
                >
                  下载
                </el-button>
              </el-button-group>
            </div>
          </div>
        </template>

        <div class="video-info">
          <div class="meta">
            <span>{{ video.year }}</span>
            <span>{{ video.duration }}</span>
            <span>{{ video.quality }}</span>
            <span>{{ video.audio }}</span>
          </div>
          
          <div class="tags">
            <el-tag
              v-for="genre in video.genres"
              :key="genre"
              size="small"
              effect="plain"
            >
              {{ genre }}
            </el-tag>
          </div>

          <div class="rating">
            <el-rate
              v-model="video.rating"
              disabled
            />
            <span>{{ video.rating }}分</span>
          </div>

          <p class="description">
            {{ video.description }}
          </p>
        </div>
      </el-card>

      <el-card class="cast-card">
        <template #header>
          <div class="card-header">
            <h3>演职员表</h3>
          </div>
        </template>

        <div class="cast-list">
          <div
            v-for="person in video.cast"
            :key="person.id"
            class="cast-item"
            @click="goToActor(person.id)"
          >
            <el-avatar
              :size="60"
              :src="person.avatar"
            />
            <div class="info">
              <div class="name">
                {{ person.name }}
              </div>
              <div class="role">
                {{ person.role }}
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <div class="side-content">
      <el-card class="recommendation-card">
        <template #header>
          <div class="card-header">
            <h3>相关推荐</h3>
          </div>
        </template>

        <div class="recommendation-list">
          <div
            v-for="item in recommendations"
            :key="item.id"
            class="recommendation-item"
            @click="goToVideo(item.id)"
          >
            <el-image
              :src="item.poster"
              fit="cover"
            />
            <div class="info">
              <div class="title">
                {{ item.title }}
              </div>
              <div class="meta">
                <span>{{ item.year }}</span>
                <span v-if="item.rating">· {{ item.rating }}分</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Star, Download } from '@element-plus/icons-vue'
import VideoPlayer from '@/components/VideoPlayer.vue'

const route = useRoute()
const router = useRouter()
const playerRef = ref(null)

// 模拟数据
const video = ref({
  id: 1,
  title: '盗梦空间',
  year: '2010',
  duration: '148分钟',
  quality: '4K',
  audio: 'DTS-HD',
  poster: 'https://example.com/poster1.jpg',
  rating: 4.5,
  isFavorite: false,
  description: '道姆·柯布是一名经验丰富的盗梦者，他在这项危险的技术领域中是最好的...',
  genres: ['科幻', '动作', '冒险'],
  cast: [
    {
      id: 1,
      name: '莱昂纳多·迪卡普里奥',
      role: '柯布',
      avatar: 'https://example.com/avatar1.jpg'
    },
    // 更多演员...
  ]
})

const currentVideo = ref({
  id: 1,
  url: 'https://example.com/video1.mp4',
  type: 'mp4',
  title: '盗梦空间',
  poster: 'https://example.com/poster1.jpg',
  subtitle: 'https://example.com/subtitle1.srt',
  lastPlayTime: 0
})

// 剧集相关
const isSeriesVideo = ref(false)
const currentSeason = ref(1)
const seasons = ref([1, 2, 3])
const episodes = ref([
  {
    id: 1,
    season: 1,
    episode: 1,
    title: '第1集',
    watched: true
  },
  // 更多剧集...
])

const currentSeasonEpisodes = computed(() => {
  return episodes.value.filter(ep => ep.season === currentSeason.value)
})

// 推荐列表
const recommendations = ref([
  {
    id: 2,
    title: '星际穿越',
    year: '2014',
    poster: 'https://example.com/poster2.jpg',
    rating: 4.8
  },
  // 更多推荐...
])

// 方法
const handleTimeUpdate = (time) => {
  // 保存播放进度
  currentVideo.value.lastPlayTime = time
}

const handleEnded = () => {
  if (isSeriesVideo.value) {
    // 自动播放下一集
    const currentIndex = currentSeasonEpisodes.value.findIndex(
      ep => ep.id === currentVideo.value.id
    )
    if (currentIndex < currentSeasonEpisodes.value.length - 1) {
      playEpisode(currentSeasonEpisodes.value[currentIndex + 1])
    }
  }
}

const playEpisode = (episode) => {
  currentVideo.value = {
    ...currentVideo.value,
    id: episode.id,
    title: `${video.value.title} 第${episode.episode}集`,
    url: `https://example.com/video${episode.id}.mp4`
  }
}

const toggleFavorite = () => {
  video.value.isFavorite = !video.value.isFavorite
  // TODO: 同步到后端
}

const downloadVideo = () => {
  // TODO: 实现下载功能
}

const goToActor = (actorId) => {
  router.push(`/actor/${actorId}`)
}

const goToVideo = (videoId) => {
  router.push(`/play/${videoId}`)
}
</script>

<style lang="scss" scoped>
.play-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 60px); // 减去顶部导航高度
  overflow: hidden;

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 10px;

    .player-wrapper {
      width: 100%;
      padding-top: 56.25%; // 16:9 比例
      position: relative;
      background: #000;
      margin-bottom: 20px;

      :deep(.video-player) {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }

    .episode-list {
      margin-bottom: 20px;

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;

        h3 {
          margin: 0;
        }
      }

      .episodes {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;

        .el-button {
          &.watched::after {
            content: '✓';
            margin-left: 5px;
          }
        }
      }
    }

    .info-card {
      margin-bottom: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h2 {
          margin: 0;
        }
      }

      .video-info {
        .meta {
          margin-bottom: 15px;
          
          span {
            margin-right: 15px;
            color: #666;

            &:last-child {
              margin-right: 0;
            }
          }
        }

        .tags {
          margin-bottom: 15px;

          .el-tag {
            margin-right: 10px;
            margin-bottom: 5px;
          }
        }

        .rating {
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .description {
          color: #666;
          line-height: 1.6;
        }
      }
    }

    .cast-card {
      .cast-list {
        display: flex;
        gap: 20px;
        overflow-x: auto;
        padding-bottom: 10px;

        .cast-item {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 10px;
          border-radius: 4px;
          transition: background-color 0.3s;

          &:hover {
            background-color: #f5f7fa;
          }

          .info {
            .name {
              font-weight: bold;
              margin-bottom: 5px;
            }

            .role {
              color: #666;
              font-size: 12px;
            }
          }
        }
      }
    }
  }

  .side-content {
    width: 300px;
    overflow-y: auto;
    padding-right: 10px;

    .recommendation-card {
      .recommendation-list {
        .recommendation-item {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          cursor: pointer;

          &:last-child {
            margin-bottom: 0;
          }

          .el-image {
            width: 100px;
            height: 150px;
            border-radius: 4px;
          }

          .info {
            flex: 1;

            .title {
              font-weight: bold;
              margin-bottom: 5px;
            }

            .meta {
              color: #666;
              font-size: 12px;
            }
          }

          &:hover {
            .title {
              color: #409EFF;
            }
          }
        }
      }
    }
  }
}
</style>
