<template>
  <div v-if="validVideos.length > 0" class="videos-panel" :style="panelStyle">
    <VCard class="videos-card" elevation="0">
      <VCardTitle class="section-header">
        <div class="section-title-modern">
          <div class="youtube-icon-wrapper">
            <VAvatar size="40" class="section-title-avatar videos-avatar">
              <VIcon icon="mdi-youtube" size="24" color="white" />
            </VAvatar>
            <div class="icon-glow"></div>
          </div>
          <div class="title-content">
            <span class="section-title-text">{{ title }}</span>
          </div>
        </div>
      </VCardTitle>

      <VCardText>
        <div class="videos-grid">
          <div
            v-for="(video, index) in validVideos"
            :key="index"
            class="video-item"
            @click="openVideo(video)"
          >
            <div class="video-thumbnail-container">
              <VImg
                :src="getYouTubeThumbnail(video)"
                :alt="`Video ${index + 1}`"
                cover
                class="video-thumbnail"
              >
                <template #placeholder>
                  <div class="d-flex align-center justify-center fill-height bg-grey-darken-3">
                    <VProgressCircular indeterminate size="24" color="white" />
                  </div>
                </template>
              </VImg>
              <div class="video-overlay">
                <VIcon icon="mdi-play-circle" size="56" color="white" class="play-icon" />
              </div>
            </div>
            <div class="video-title">
              <span class="video-title-text">{{ getVideoTitle(video, index) }}</span>
            </div>
            <VBtn
              icon
              size="x-small"
              variant="text"
              color="white"
              class="youtube-external-btn"
              @click.stop="openOnYouTube(video)"
              :aria-label="t('components.marketplace.panels.videosPanel.openOnYouTube')"
            >
              <VIcon icon="mdi-open-in-new" size="16" />
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Video Player Dialog -->
    <VDialog
      v-model="showVideoDialog"
      max-width="900"
      content-class="video-dialog-content"
    >
      <VCard class="video-dialog-card">
        <div class="video-dialog-header">
          <VBtn
            icon
            variant="text"
            size="small"
            color="white"
            @click="showVideoDialog = false"
            class="close-btn"
          >
            <VIcon icon="mdi-close" />
          </VBtn>
          <VBtn
            variant="text"
            size="small"
            color="white"
            @click="openOnYouTube(selectedVideo)"
            class="youtube-btn"
          >
            <VIcon icon="mdi-youtube" start />
            {{ t('components.marketplace.panels.videosPanel.watchOnYouTube') }}
          </VBtn>
        </div>
        <div class="video-embed-container">
          <iframe
            v-if="selectedVideo && showVideoDialog"
            :src="getYouTubeEmbedUrl(selectedVideo)"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="video-iframe"
          />
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  videos: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: '',
  },
  panel: {
    type: Object,
    default: () => ({}),
  },
  app: {
    type: Object,
    default: () => ({}),
  },
})

const { t, te } = useI18n()

const showVideoDialog = ref(false)
const selectedVideo = ref(null)
const videoTitles = ref({})

// Panel style (padding, background, border radius)
const panelStyle = computed(() => ({
  padding: props.panel?.padding
    ? `${props.panel.padding.top}px ${props.panel.padding.right}px ${props.panel.padding.bottom}px ${props.panel.padding.left}px`
    : '0',
  background: props.panel?.background || 'transparent',
  borderRadius: props.panel?.cornerRadius ? `${props.panel.cornerRadius}px` : '0',
}))

// Resolve title from props or i18n
const title = computed(() => {
  if (props.title) {
    if (props.title.startsWith('i18n:')) {
      const key = props.title.replace('i18n:', '')
      
      return te(key) ? t(key) : t('components.marketplace.panels.videosPanel.title')
    }
    
    return props.title
  }
  if (props.panel?.title) {
    if (props.panel.title.startsWith('i18n:')) {
      const key = props.panel.title.replace('i18n:', '')
      
      return te(key) ? t(key) : t('components.marketplace.panels.videosPanel.title')
    }
    
    return props.panel.title
  }
  
  return t('components.marketplace.panels.videosPanel.title')
})

// Get videos from props or app object
const videosList = computed(() => {
  if (props.videos && props.videos.length > 0) {
    return props.videos
  }
  if (props.app?.videos && props.app.videos.length > 0) {
    return props.app.videos
  }
  
  return []
})

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = url => {
  if (!url) return null

  // Handle youtu.be short URLs
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]

  // Handle youtube.com URLs with various parameters
  const longMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (longMatch) return longMatch[1]

  // Handle just video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url

  return null
}

// Default videos to always show at the end (add more URLs here as needed)
const DEFAULT_VIDEOS = [
  'https://www.youtube.com/watch?v=BroiO5hPQng',
]

// Filter valid YouTube URLs and append default videos at the end
const validVideos = computed(() => {
  const videos = videosList.value.filter(url => getYouTubeVideoId(url) !== null)
  const existingIds = new Set(videos.map(url => getYouTubeVideoId(url)))

  // Filter out default videos that are already in the list (avoid duplicates)
  const newDefaultVideos = DEFAULT_VIDEOS.filter(url => !existingIds.has(getYouTubeVideoId(url)))

  return [...videos, ...newDefaultVideos]
})

// Get YouTube thumbnail URL
const getYouTubeThumbnail = url => {
  const videoId = getYouTubeVideoId(url)
  if (!videoId) return ''

  // mqdefault = 320x180, hqdefault = 480x360
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

// Get YouTube embed URL
const getYouTubeEmbedUrl = url => {
  const videoId = getYouTubeVideoId(url)
  if (!videoId) return ''
  
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
}

// Open video in dialog
const openVideo = url => {
  selectedVideo.value = url
  showVideoDialog.value = true
}

// Open video on YouTube in new tab
const openOnYouTube = url => {
  const videoId = getYouTubeVideoId(url)
  if (videoId) {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer')
  }
}

// Get video title (from cache or fallback)
const getVideoTitle = (url, index) => {
  const videoId = getYouTubeVideoId(url)
  if (videoId && videoTitles.value[videoId]) {
    return videoTitles.value[videoId]
  }

  return t('components.marketplace.panels.videosPanel.videoLabel', { number: index + 1 })
}

// Fetch video title from YouTube oEmbed API
const fetchVideoTitle = async url => {
  const videoId = getYouTubeVideoId(url)
  if (!videoId || videoTitles.value[videoId]) return

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    )
    if (response.ok) {
      const data = await response.json()
      videoTitles.value[videoId] = data.title
    }
  } catch {
    // Silently fail - will use fallback title
  }
}

// Fetch all video titles
const fetchAllVideoTitles = () => {
  validVideos.value.forEach(url => fetchVideoTitle(url))
}

// Fetch titles on mount and when videos change
onMounted(fetchAllVideoTitles)
watch(validVideos, fetchAllVideoTitles, { deep: true })
</script>

<style scoped>
.videos-panel {
  margin-top: 24px;
}

.videos-card {
  border-radius: 16px;
  overflow: visible;
  background: transparent;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.section-header {
  background: transparent;
  position: relative;
  margin-bottom: 16px !important;
  padding: 8px 16px !important;
  overflow: visible;
}

.section-title-modern {
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  z-index: 1;
  overflow: visible;
}

.youtube-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.section-title-avatar {
  box-shadow:
    0 6px 16px rgba(255, 0, 0, 0.35),
    0 2px 8px rgba(255, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease;
}

.videos-avatar {
  background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
}

.section-title-avatar:hover {
  transform: scale(1.05) rotate(-5deg);
  box-shadow:
    0 8px 20px rgba(255, 0, 0, 0.45),
    0 3px 10px rgba(255, 0, 0, 0.3);
}

.icon-glow {
  position: absolute;
  inset: -8px;
  background: radial-gradient(circle, rgba(255, 0, 0, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.title-content {
  display: flex;
  align-items: center;
}

.section-title-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.95);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.videos-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
}


.video-item {
  position: relative;
  flex-shrink: 0;
  width: 420px;
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.03) 0%,
    rgba(var(--v-theme-primary), 0.08) 100%
  );
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(var(--v-theme-primary), 0.05) inset;
}

.video-item:hover {
  transform: translateY(-6px);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.15),
    0 0 0 2px rgba(var(--v-theme-primary), 0.15) inset;
  border-color: rgba(var(--v-theme-primary), 0.35);
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.05) 0%,
    rgba(var(--v-theme-primary), 0.12) 100%
  );
}

.video-thumbnail-container {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 16px 16px 0 0;
}

.video-title {
  padding: 14px 16px;
  background: linear-gradient(
    to bottom,
    rgba(var(--v-theme-primary), 0.04) 0%,
    rgba(var(--v-theme-primary), 0.08) 100%
  );
  border-radius: 0 0 16px 16px;
  min-height: 68px;
  display: flex;
  align-items: flex-start;
  border-top: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.video-title-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.45;
  color: rgba(var(--v-theme-on-surface), 0.92);
  letter-spacing: -0.01em;
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.1) 0%,
    rgba(0, 0, 0, 0.3) 100%
  );
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.video-item:hover .video-overlay {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.6) 100%
  );
}

.play-icon {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6));
  opacity: 0.95;
  color: white;
}

.video-item:hover .play-icon {
  transform: scale(1.2);
  opacity: 1;
  color: rgb(var(--v-theme-primary));
  filter: drop-shadow(0 4px 16px rgba(var(--v-theme-primary-rgb), 0.6));
}

.youtube-external-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7) !important;
  backdrop-filter: blur(8px);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.youtube-external-btn:hover {
  background: rgba(0, 0, 0, 0.85) !important;
  border-color: rgba(255, 255, 255, 0.2);
}

.video-item:hover .youtube-external-btn {
  opacity: 1;
}

/* Video Dialog */
.video-dialog-card {
  background: #000 !important;
  border-radius: 16px !important;
  overflow: hidden;
}

.video-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
}

.close-btn {
  opacity: 0.8;
}

.close-btn:hover {
  opacity: 1;
}

.youtube-btn {
  opacity: 0.8;
  text-transform: none !important;
  font-weight: 500;
}

.youtube-btn:hover {
  opacity: 1;
  color: #FF0000 !important;
}

.video-embed-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Responsive */
@media (max-width: 600px) {
  .video-item {
    width: 320px;
  }

  .play-icon {
    font-size: 40px !important;
  }

  .video-title {
    padding: 10px 12px;
    min-height: 56px;
  }

  .video-title-text {
    font-size: 0.8125rem;
  }
}
</style>
