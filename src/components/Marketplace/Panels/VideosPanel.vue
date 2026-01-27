<template>
  <div v-if="validVideos.length > 0" class="videos-panel">
    <div class="section-header">
      <div class="section-title-modern">
        <VAvatar size="32" class="section-title-avatar videos-avatar">
          <VIcon icon="mdi-youtube" size="18" color="white" />
        </VAvatar>
        <span class="section-title-text">{{ title }}</span>
      </div>
    </div>

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
  margin: 24px 0;
}

.section-header {
  margin-bottom: 16px;
}

.section-title-modern {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title-avatar {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(var(--v-theme-on-surface), 0.1);
}

.videos-avatar {
  background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%) !important;
}

.section-title-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.videos-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  padding-bottom: 8px;
}


.video-item {
  position: relative;
  flex-shrink: 0;
  width: 420px;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.video-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.video-thumbnail-container {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.video-title {
  padding: 10px 12px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 0 0 12px 12px;
}

.video-title-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.4;
  color: rgba(var(--v-theme-on-surface), 0.9);
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
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.video-item:hover .video-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.play-icon {
  transition: transform 0.3s ease;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
}

.video-item:hover .play-icon {
  transform: scale(1.15);
}

.youtube-external-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.3s ease;
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
    padding: 8px 10px;
  }

  .video-title-text {
    font-size: 0.75rem;
  }
}
</style>
