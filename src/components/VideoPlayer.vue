<template>
  <div class="video-player">
    <div
      ref="artRef"
      class="artplayer-app"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Artplayer from 'artplayer'
import Hls from 'hls.js'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'mp4'
  },
  title: {
    type: String,
    default: ''
  },
  poster: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  currentTime: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'timeupdate',
  'ended',
  'ready',
  'play',
  'pause'
])

const artRef = ref(null)
let art = null

onMounted(() => {
  const options = {
    container: artRef.value,
    url: props.src,
    title: props.title,
    poster: props.poster,
    volume: 0.7,
    isLive: false,
    muted: false,
    autoplay: false,
    pip: true,
    autoSize: true,
    autoMini: true,
    screenshot: true,
    setting: true,
    loop: false,
    flip: true,
    rotate: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    subtitleOffset: true,
    miniProgressBar: true,
    mutex: true,
    backdrop: true,
    playsInline: true,
    autoPlayback: true,
    airplay: true,
    theme: '#23ade5',
    lang: 'zh-cn',
    whitelist: ['*'],
    moreVideoAttr: {
      crossOrigin: 'anonymous',
    },
    settings: [
      {
        html: '字幕',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="9" y1="10" x2="15" y2="10"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>',
        selector: [
          {
            html: '显示',
            tooltip: '显示字幕',
            switch: true,
            onSwitch: function (item) {
              item.tooltip = item.switch ? '隐藏字幕' : '显示字幕'
              art.subtitle.show = item.switch
              return item
            },
          },
        ],
      }
    ],
    subtitle: {
      url: props.subtitle,
      type: 'srt',
      style: {
        color: '#fff',
        fontSize: '20px',
      },
      encoding: 'utf-8',
    },
    customType: {
      m3u8: function (video, url) {
        if (Hls.isSupported()) {
          const hls = new Hls()
          hls.loadSource(url)
          hls.attachMedia(video)
          art.hls = hls
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url
        } else {
          art.notice.show = '不支持播放 M3U8 格式视频'
        }
      },
    },
  }

  art = new Artplayer(options)

  // 设置初始播放时间
  if (props.currentTime > 0) {
    art.seek = props.currentTime
  }

  // 事件监听
  art.on('video:timeupdate', () => {
    emit('timeupdate', art.currentTime)
  })

  art.on('video:ended', () => {
    emit('ended')
  })

  art.on('ready', () => {
    emit('ready')
  })

  art.on('play', () => {
    emit('play')
  })

  art.on('pause', () => {
    emit('pause')
  })
})

onBeforeUnmount(() => {
  if (art) {
    art.destroy()
  }
})

// 暴露播放器方法
defineExpose({
  seek(time) {
    if (art) {
      art.seek = time
    }
  },
  play() {
    if (art) {
      art.play()
    }
  },
  pause() {
    if (art) {
      art.pause()
    }
  },
  toggle() {
    if (art) {
      art.toggle()
    }
  },
  getCurrentTime() {
    return art ? art.currentTime : 0
  }
})
</script>

<style lang="scss" scoped>
.video-player {
  width: 100%;
  height: 100%;
  background: #000;

  .artplayer-app {
    width: 100%;
    height: 100%;
  }
}
</style>
