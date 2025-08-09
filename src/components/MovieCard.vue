<template>
  <el-card 
    class="movie-card" 
    :body-style="{ padding: '0px' }"
    @click="$emit('click')"
  >
    <div class="poster-container">
      <el-image 
        :src="movie.poster" 
        class="poster"
        fit="cover"
      />
      <div class="overlay">
        <div class="info">
          <h3>{{ movie.title }}</h3>
          <p class="year">
            {{ movie.year }}
          </p>
          <div class="tags">
            <el-tag
              size="small"
              type="info"
            >
              {{ movie.type }}
            </el-tag>
            <el-tag
              size="small"
              type="warning"
            >
              {{ movie.genre }}
            </el-tag>
          </div>
          <div
            v-if="movie.rating"
            class="rating"
          >
            <el-rate 
              v-model="movie.rating" 
              disabled 
              :max="5"
              :colors="['#F7BA2A', '#F7BA2A', '#F7BA2A']"
            />
          </div>
        </div>
      </div>
      <div
        v-if="showProgress && movie.watchProgress"
        class="progress-bar"
      >
        <el-progress 
          :percentage="movie.watchProgress" 
          :format="() => ''" 
          :stroke-width="4"
        />
      </div>
    </div>
    <slot name="extra" />
  </el-card>
</template>

<script setup>
defineProps({
  movie: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      title: '',
      poster: '',
      year: '',
      type: '',
      genre: '',
      rating: 0,
      watchProgress: 0
    })
  },
  showProgress: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<style lang="scss" scoped>
.movie-card {
  cursor: pointer;
  transition: transform 0.3s ease;
  margin-bottom: 20px;

  &:hover {
    transform: translateY(-5px);

    .overlay {
      opacity: 1;
    }
  }

  .poster-container {
    position: relative;
    width: 100%;
    padding-top: 150%; // 2:3 宽高比

    .poster {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3));
      opacity: 0;
      transition: opacity 0.3s ease;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      color: white;

      .info {
        h3 {
          margin: 0 0 8px;
          font-size: 16px;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .year {
          margin: 0 0 8px;
          font-size: 14px;
          opacity: 0.8;
        }

        .tags {
          margin-bottom: 8px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .rating {
          margin-top: 8px;
        }
      }
    }

    .progress-bar {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);

      :deep(.el-progress-bar__outer) {
        background-color: rgba(255, 255, 255, 0.3);
      }

      :deep(.el-progress-bar__inner) {
        background-color: var(--el-color-primary);
      }
    }
  }
}
</style>
