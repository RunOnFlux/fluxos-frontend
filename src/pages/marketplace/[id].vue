<template>
  <div class="app-details-container">
    <!-- Modern Loading State -->
    <LoadingSpinner
      v-if="isLoading"
      icon="mdi-apps"
      :icon-size="56"
      title="Loading Application..."
    />

    <!-- Error State -->
    <VAlert
      v-else-if="error"
      type="error"
      variant="outlined"
      class="mb-4 modern-alert"
    >
      Failed to load application details: {{ error }}
    </VAlert>

    <!-- Back Button -->
    <VBtn
      v-if="app"
      icon="mdi-arrow-left"
      variant="text"
      class="back-btn-standalone"
      @click="router.back()"
    />

    <!-- App Details -->
    <div v-if="app" class="modern-app-view">
      <!-- Modern Header -->
      <div class="modern-header">
        <div class="header-grid">
          <!-- App Icon -->
          <div class="app-icon-section">
            <VAvatar size="64" class="app-avatar">
              <AppIcon :app="app" :size="64" />
            </VAvatar>
          </div>

          <!-- App Info -->
          <div class="app-info-section">
            <h1 class="app-title">{{ app.displayName || app.name }}</h1>
            <div class="app-stats">
              <div v-if="app.rating" class="stat-item">
                <VIcon icon="mdi-star" size="14" />
                <span>{{ app.rating }}</span>
              </div>
            </div>

            <!-- Developer Chips -->
            <div v-if="(app.developer && app.developer.trim() && app.developer.toLowerCase() !== 'n/a') || (app.company && app.company.trim() && app.company.toLowerCase() !== 'n/a')" class="header-developer">
              <VChip
                class="developer-chip"
                size="small"
                variant="tonal"
                color="success"
                prepend-icon="mdi-account-circle"
              >
                {{ app.developer && app.developer.trim() && app.developer.toLowerCase() !== 'n/a' ? app.developer : app.company }}
              </VChip>
            </div>

            <!-- Tags or Category -->
            <div v-if="app.tags?.length || app.category" class="header-tags">
              <template v-if="app.tags?.length">
                <VChip
                  v-for="tag in app.tags.slice(0, 3)"
                  :key="tag"
                  class="tag-chip"
                  size="small"
                  variant="tonal"
                  color="grey"
                >
                  {{ tag }}
                </VChip>
              </template>
              <VChip
                v-else-if="app.category"
                class="tag-chip"
                size="small"
                variant="tonal"
                color="grey"
              >
                {{ getCategoryName(app.category) }}
              </VChip>
            </div>
          </div>

          <!-- Action Section -->
          <div class="action-section">
            <div class="price-section">
              <span class="price-label">Price</span>
              <span class="price-value">{{ app.price ? `$${app.price.toFixed(2)}` : 'Free' }}</span>
            </div>
            <VBtn
              color="primary"
              size="large"
              class="install-button"
              @click="handleAction"
            >
              <VIcon start :icon="getActionIcon()" />
              {{ getActionText() }}
            </VBtn>
          </div>
        </div>
      </div>

      <!-- Requirements Section -->
      <div v-if="app.compose && app.compose[0]" class="requirements-visual">
        <div class="req-visual-title">
          <VAvatar size="32" class="req-title-avatar">
            <VIcon icon="mdi-rocket-launch" size="18" color="white" />
          </VAvatar>
          <span class="req-title-text">Minimum Requirements</span>
        </div>
        <div class="req-visual-grid">
          <div class="req-visual-item cpu-item">
            <div class="req-visual-icon-bg">
              <VIcon icon="mdi-cpu-64-bit" size="16" color="white" />
            </div>
            <div class="req-visual-content">
              <div class="req-visual-value">{{ app.compose[0].cpu || 1 }}<span class="req-unit"> Cores</span></div>
              <div class="req-visual-label">CPU Power</div>
            </div>
          </div>

          <div class="req-visual-item memory-item">
            <div class="req-visual-icon-bg">
              <VIcon icon="mdi-memory" size="16" color="white" />
            </div>
            <div class="req-visual-content">
              <div class="req-visual-value">{{ app.compose[0].ram || 512 }}<span class="req-unit"> MB</span></div>
              <div class="req-visual-label">Memory</div>
            </div>
          </div>

          <div class="req-visual-item storage-item">
            <div class="req-visual-icon-bg">
              <VIcon icon="mdi-harddisk" size="16" color="white" />
            </div>
            <div class="req-visual-content">
              <div class="req-visual-value">{{ app.compose[0].hdd || 1 }}<span class="req-unit"> GB</span></div>
              <div class="req-visual-label">Storage</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Compact Screenshots -->
      <div v-if="app.screenshots?.length && validScreenshots.length" class="screenshots-section">
        <div class="section-title-modern">
          <VAvatar size="32" class="section-title-avatar screenshots-avatar">
            <VIcon icon="mdi-image-multiple" size="18" color="white" />
          </VAvatar>
          <span class="section-title-text">Screenshots</span>
        </div>
        <div class="screenshot-grid">
          <div
            v-for="(image, index) in validScreenshots.slice(0, 4)"
            :key="index"
            class="screenshot-item"
            @click="openImageViewer(image)"
          >
            <VImg
              :src="image"
              :alt="`Screenshot ${index + 1}`"
              height="120"
              cover
              @error="handleImageError(image)"
            >
              <template #placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <VProgressCircular indeterminate size="40" />
                </div>
              </template>
            </VImg>
            <div class="screenshot-overlay">
              <VIcon icon="mdi-magnify" size="20" />
            </div>
          </div>
        </div>
      </div>


      <!-- Compact Info Grid -->
      <div class="info-grid" :class="{ 'single-column': !app.website && !app.sourceCode && !app.supportLink }">
        <div class="info-section">
          <div class="section-title-modern">
            <VAvatar size="32" class="section-title-avatar about-avatar">
              <VIcon icon="mdi-information" size="18" color="white" />
            </VAvatar>
            <span class="section-title-text">About</span>
          </div>
          <div v-if="app.description" class="description-scroll">
            <p class="app-description">{{ app.description }}</p>
          </div>

          <div class="modern-info-grid">
            <div v-if="(app.developer && app.developer.trim() && app.developer.toLowerCase() !== 'n/a') || (app.company && app.company.trim() && app.company.toLowerCase() !== 'n/a')" class="info-item">
              <div class="info-icon developer-icon">
                <VIcon icon="mdi-account-circle" size="14" color="info" />
              </div>
              <div class="info-content">
                <span class="info-label">Developer</span>
                <span class="info-value">{{ app.developer && app.developer.trim() && app.developer.toLowerCase() !== 'n/a' ? app.developer : app.company }}</span>
              </div>
            </div>

            <div v-if="app.updated_at || app.timestamp" class="info-item">
              <div class="info-icon update-icon">
                <VIcon icon="mdi-calendar-clock" size="14" color="warning" />
              </div>
              <div class="info-content">
                <span class="info-label">Last Update</span>
                <span class="info-value">{{ new Date(app.updated_at || app.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</span>
              </div>
            </div>

            <div v-if="app.version || app.appVersion" class="info-item">
              <div class="info-icon version-icon">
                <VIcon icon="mdi-tag" size="14" color="success" />
              </div>
              <div class="info-content">
                <span class="info-label">Version</span>
                <span class="info-value">{{ app.version || app.appVersion }}</span>
              </div>
            </div>

            <div v-if="app.installCount" class="info-item">
              <div class="info-icon download-icon">
                <VIcon icon="mdi-download-circle" size="14" color="error" />
              </div>
              <div class="info-content">
                <span class="info-label">Downloads</span>
                <span class="info-value">{{ formatNumber(app.installCount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="app.website || app.sourceCode || app.supportLink" class="info-section">
          <div class="section-title-modern">
            <VAvatar size="32" class="section-title-avatar links-avatar">
              <VIcon icon="mdi-link" size="18" color="white" />
            </VAvatar>
            <span class="section-title-text">Links</span>
          </div>
          <div class="links-list">
            <VBtn
              v-if="app.website"
              variant="text"
              color="grey"
              size="small"
              :href="app.website"
              target="_blank"
              rel="noopener noreferrer"
              class="modern-link"
              :ripple="false"
            >
              <VIcon start icon="mdi-web" size="16" />
              Website
            </VBtn>
            <VBtn
              v-if="app.sourceCode"
              variant="text"
              color="grey"
              size="small"
              :href="app.sourceCode"
              target="_blank"
              rel="noopener noreferrer"
              class="modern-link"
              :ripple="false"
            >
              <VIcon start icon="mdi-github" size="16" />
              Source Code
            </VBtn>
            <VBtn
              v-if="app.supportLink"
              variant="text"
              color="grey"
              size="small"
              :href="app.supportLink"
              target="_blank"
              rel="noopener noreferrer"
              class="modern-link"
              :ripple="false"
            >
              <VIcon start icon="mdi-help-circle" size="16" />
              Support
            </VBtn>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Viewer Dialog -->
    <VDialog
      v-model="showImageViewer"
      transition="scale-transition"
      class="image-viewer-dialog"
      max-width="none"
      max-height="none"
      content-class="image-viewer-content"
    >
      <VCard class="position-relative image-viewer-card" elevation="0" variant="flat">
        <!-- Close Button -->
        <VBtn
          icon="mdi-close"
          color="white"
          class="position-absolute"
          style="top: 8px; right: 8px; z-index: 20;"
          @click="showImageViewer = false"
        />

        <!-- Image -->
        <img
          :src="selectedImage"
          class="image-viewer-img"
          style="max-width: calc(100vw - 48px); max-height: calc(100vh - 48px); object-fit: contain; display: block;"
        />
      </VCard>
    </VDialog>

    <!-- Install Dialog -->
    <InstallDialog
      v-if="app"
      v-model="showInstallDialog"
      :app="app"
      @deployed="handleAppDeployed"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketplace } from '@/composables/useMarketplace'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import AppIcon from '@/components/Marketplace/AppIcon.vue'
import InstallDialog from '@/components/Marketplace/InstallDialog.vue'

const route = useRoute()
const router = useRouter()
const { fetchAppDetails, deployApp, loading, error, categoryMap, fetchApps, apps } = useMarketplace()
const localLoading = ref(false)

// Combined loading state for instant response
const isLoading = computed(() => localLoading.value || loading.value)

const app = ref(null)
const selectedImage = ref('')
const failedImages = ref(new Set())
const showInstallDialog = ref(false)
const showImageViewer = computed({
  get: () => !!selectedImage.value,
  set: value => {
    if (!value) selectedImage.value = ''
  },
})

const validScreenshots = computed(() => {
  if (!app.value?.screenshots) return []
  
  return app.value.screenshots.filter(image => !failedImages.value.has(image))
})

const handleImageError = image => {
  failedImages.value.add(image)
}


const imageViewerObserver = ref(null)

const openImageViewer = image => {
  selectedImage.value = image

  // Force centering on large screens with continuous monitoring
  if (window.innerWidth >= 960) {
    nextTick(() => {
      const overlay = document.querySelector('.image-viewer-dialog .v-overlay__content')
      if (overlay) {
        // Stop any existing observer
        if (imageViewerObserver.value) {
          imageViewerObserver.value.disconnect()
        }

        const applyCentering = () => {
          overlay.style.setProperty('position', 'fixed', 'important')
          overlay.style.setProperty('top', '50%', 'important')
          overlay.style.setProperty('left', '50%', 'important')
          overlay.style.setProperty('transform', 'translate(-50%, -50%)', 'important')
          overlay.style.setProperty('margin', '0', 'important')
          overlay.style.setProperty('right', 'auto', 'important')
          overlay.style.setProperty('bottom', 'auto', 'important')
          overlay.style.setProperty('width', 'auto', 'important')
          overlay.style.setProperty('height', 'auto', 'important')
        }

        // Apply centering immediately
        applyCentering()

        // Watch for any style changes and re-apply centering
        imageViewerObserver.value = new MutationObserver(() => {
          applyCentering()
        })

        imageViewerObserver.value.observe(overlay, {
          attributes: true,
          attributeFilter: ['style', 'class'],
        })
      }
    })
  }
}

// Clean up observer when image viewer closes
watch(showImageViewer, newValue => {
  if (!newValue && imageViewerObserver.value) {
    imageViewerObserver.value.disconnect()
    imageViewerObserver.value = null
  }
})

// For marketplace apps - there's no "installed" state
// Marketplace is for discovering and purchasing/deploying apps
// Once deployed, they appear in the local apps section
const isInstalled = computed(() => {
  return false // Marketplace apps are never "installed" - they're available to purchase/deploy
})

const getActionText = () => {
  if (!app.value) return ''

  // In marketplace, all apps show Install which includes configuration and payment
  return 'Install'
}

const getActionIcon = () => {
  if (!app.value) return 'mdi-rocket-launch'

  // Use rocket icon for install action
  return 'mdi-rocket-launch'
}

const handleAction = async () => {
  if (!app.value) return

  // Deploy or purchase the marketplace app
  await handleDeploy()
}

const formatNumber = num => {
  if (!num || num === 0) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  
  return num.toString()
}

const formatDate = dateString => {
  if (!dateString) return 'N/A'
  
  return new Date(dateString).toLocaleDateString()
}

const getCategoryName = categoryUuid => {
  return categoryMap.value.get(categoryUuid) || 'Other'
}

const getCategoryColor = categoryUuid => {
  const categoryName = getCategoryName(categoryUuid).toLowerCase()
  const colors = {
    blockchain: 'primary',
    'front-end': 'info',
    masternode: 'success',
    'rpc node': 'warning',
    hosting: 'secondary',
    games: 'error',
    blockbook: 'purple',
    productivity: 'orange',
    newgames: 'pink',
  }
  
  return colors[categoryName] || 'primary'
}

const handleDeploy = async () => {
  if (!app.value) return

  console.log('Opening install dialog for:', app.value.displayName || app.value.name)

  // Open the install dialog with proper authentication-aware flow
  showInstallDialog.value = true
}

const handleAppDeployed = deployedApp => {
  // Handle successful deployment
  console.log('App deployed successfully:', deployedApp.displayName || deployedApp.name)

  // Show success notification or redirect to apps management
  // Could also update the UI to show "Manage" instead of "Install"
}

const loadAppDetails = async () => {
  const appId = route.params.id
  console.log('Loading app details for ID:', appId)

  // Set loading immediately for instant spinner
  localLoading.value = true

  if (!appId) {
    localLoading.value = false
    router.push('/marketplace')
    
    return
  }

  try {
    // Fetch detailed app data (includes compose specifications for hardware requirements)
    const appData = await fetchAppDetails(appId)
    app.value = appData
  } catch (err) {
    console.error('💥 Failed to load app details:', err)

    // Don't redirect on error - show error message instead
    error.value = err.message || 'Failed to load application details'
  } finally {
    // Always turn off local loading
    localLoading.value = false
  }
}


// Watch for route changes (immediate: true handles initial load)
watch(() => route.params.id, loadAppDetails, { immediate: true })

onMounted(() => {
  // Check if user came here with install intent
  if (route.query.action === 'install') {
    // Could show install dialog or scroll to install button
    // In future, could automatically open deploy dialog
  }
})
</script>

<style scoped>
.app-details-container {
  padding: 0 20px 20px 20px;
  max-width: 1200px;
  margin: 0 auto !important;
  min-height: 100vh;
  perspective: 2000px;
  margin-top: 0 !important;
}


/* Modern Compact Header */
.modern-app-view {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.modern-header {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  padding: 16px 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08),
              0 2px 10px rgba(0, 0, 0, 0.04);
  position: relative;
  transition: all 0.3s ease;
}

.back-btn-standalone {
  margin: -8px 0 12px 0;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.back-btn-standalone:hover {
  opacity: 1;
}

.header-grid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
}

.app-icon-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-avatar {
  border: 2px solid rgba(var(--v-theme-primary), 0.1);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.15);
}

.app-info-section {
  flex: 1;
  min-width: 0;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.2;
}

.app-developer {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 0 0 8px 0;
}

.app-stats {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.header-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.tag-chip {
  font-size: 0.75rem !important;
  height: 22px !important;
}

.header-developer {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.developer-chip {
  font-size: 0.875rem !important;
  height: 28px !important;
}

.action-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  min-width: 140px;
}

.price-section {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-success), 0.08);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-success), 0.15);
}

.price-label {
  font-size: 0.65rem;
  opacity: 0.7;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  line-height: 1;
  color: rgba(var(--v-theme-success), 0.8);
}

.price-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgb(var(--v-theme-success));
  line-height: 1.1;
}

.install-button {
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  box-shadow: 0 3px 12px rgba(var(--v-theme-primary), 0.3) !important;
}

.modern-header:hover {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12),
              0 6px 24px rgba(0, 0, 0, 0.08),
              0 3px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.app-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.app-avatar {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-surface), 1);
}

.app-info {
  flex: 1;
  min-width: 0;
}

.app-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.app-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.app-author {
  font-size: 0.8rem;
  opacity: 0.7;
  margin: 0;
}

.featured-badge {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: white;
  font-weight: 600;
  padding: 0 8px;
}

.app-author {
  font-size: 0.9rem;
  opacity: 0.7;
  margin: 0 0 12px 0;
}

.compact-stats {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  opacity: 0.8;
}

.version-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  border-radius: 6px;
  font-weight: 500;
}

.action-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 120px;
}

.price-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.price-label {
  font-size: 0.7rem;
  opacity: 0.6;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.price-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgb(var(--v-theme-success));
}

.install-btn {
  border-radius: 8px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3) !important;
}

.category-chip {
  font-size: 0.75rem !important;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  opacity: 0.8;
}

.stat .v-icon {
  opacity: 0.6;
}

/* Action Section */
.action-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  min-width: 180px;
}

.price-display {
  text-align: right;
}

.price-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price-label {
  font-size: 0.75rem;
  opacity: 0.6;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.price-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 2px;
  color: rgb(var(--v-theme-success));
}

.price {
  font-size: 2rem;
  font-weight: 700;
  display: block;
  background: linear-gradient(135deg,
    rgb(var(--v-theme-success)) 0%,
    rgb(var(--v-theme-primary)) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.version {
  font-size: 0.75rem;
  opacity: 0.6;
}

.modern-install-btn {
  background: linear-gradient(135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgba(var(--v-theme-primary), 0.8) 100%);
  color: white;
  border-radius: 12px !important;
  font-weight: 600;
  min-width: 140px;
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.3);
  transition: all 0.3s ease;
}

.modern-install-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(var(--v-theme-primary), 0.4);
}

/* Compact Requirements */
.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.6;
  margin: 0 0 12px 0;
}

/* Screenshots Section */
.screenshots-section {
  margin-bottom: 24px;
}

.section-header {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.screenshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.screenshot-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: all 0.3s ease;
}

.screenshot-item:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.screenshot-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.screenshot-item:hover .screenshot-overlay {
  opacity: 1;
}

.screenshot-overlay .v-icon {
  color: white;
}

/* Tags Section */
.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.modern-tag {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  font-size: 0.75rem;
  font-weight: 500;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
  align-items: stretch;
  grid-auto-rows: 1fr;
}

.info-grid.single-column {
  grid-template-columns: 1fr;
}

.info-section {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  transform-style: preserve-3d;
  transform: rotateX(1deg) rotateY(-0.5deg);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow:
    0 15px 35px rgba(0, 0, 0, 0.12),
    0 8px 20px rgba(0, 0, 0, 0.08),
    0 4px 10px rgba(0, 0, 0, 0.04),
    0 2px 4px rgba(0, 0, 0, 0.02);
  position: relative;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.info-section:not(:last-child) {
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.1);
  margin-bottom: 24px;
  padding-bottom: 24px;
}

.info-section::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
  z-index: -1;
}

.info-section:hover {
  transform: rotateX(0deg) rotateY(0deg) translateY(-4px);
  box-shadow:
    0 20px 45px rgba(0, 0, 0, 0.15),
    0 12px 28px rgba(0, 0, 0, 0.12),
    0 6px 15px rgba(0, 0, 0, 0.08),
    0 3px 8px rgba(0, 0, 0, 0.04);
}

/* Visual Requirements Section */
.requirements-visual {
  background: linear-gradient(135deg,
    rgba(var(--v-theme-surface), 0.95) 0%,
    rgba(var(--v-theme-primary), 0.05) 100%);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.06),
    0 3px 9px rgba(0, 0, 0, 0.03);
}

.req-visual-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px 0;
}

.req-title-avatar {
  background: rgb(var(--v-theme-primary)) !important;
  box-shadow:
    0 4px 12px rgba(var(--v-theme-primary), 0.3),
    0 2px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
}

.req-title-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Consistent section titles with avatars */
.section-title-modern {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px 0;
}

.section-title-avatar {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(var(--v-theme-on-surface), 0.1);
}

.about-avatar,
.links-avatar,
.screenshots-avatar {
  background: rgb(var(--v-theme-primary)) !important;
  box-shadow:
    0 4px 12px rgba(var(--v-theme-primary), 0.3),
    0 2px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
}

.section-title-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.req-visual-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
}

.req-visual-item {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  transform-style: preserve-3d;
  transform: perspective(500px) rotateX(1deg);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 3px 8px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.02);
}

.req-visual-item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    transparent 60%);
  pointer-events: none;
}


.req-visual-item:hover {
  transform: perspective(500px) rotateX(0deg) translateY(-2px) translateZ(10px);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.12),
    0 5px 12px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.04);
}

.req-visual-icon-bg {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  transform: translateZ(5px);
  transition: all 0.2s ease;
}

.req-visual-item:hover .req-visual-icon-bg {
  transform: translateZ(8px) scale(1.05);
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.2),
    0 3px 9px rgba(0, 0, 0, 0.15);
}

.cpu-item .req-visual-icon-bg {
  background: linear-gradient(135deg,
    rgb(var(--v-theme-primary)),
    rgba(var(--v-theme-primary), 0.8));
}

.memory-item .req-visual-icon-bg {
  background: linear-gradient(135deg,
    rgb(var(--v-theme-secondary)),
    rgba(var(--v-theme-secondary), 0.8));
}

.storage-item .req-visual-icon-bg {
  background: linear-gradient(135deg,
    rgb(var(--v-theme-warning)),
    rgba(var(--v-theme-warning), 0.8));
}

.req-visual-content {
  flex: 1;
}

.req-visual-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.95);
  line-height: 1;
  margin-bottom: 1px;
}

.req-unit {
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.6;
}

.req-visual-label {
  font-size: 0.65rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  line-height: 1;
}


.description-scroll {
  overflow-y: auto;
  margin-bottom: 16px;
  padding-right: 4px;
  flex-shrink: 0;
}

.description-scroll::-webkit-scrollbar {
  width: 4px;
}

.description-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.description-scroll::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 2px;
}

.app-description {
  font-size: 0.95rem;
  line-height: 1.5;
  opacity: 0.8;
  margin: 0;
}

.modern-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

/* 3D effect for info items */
.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  transform-style: preserve-3d;
  transform: perspective(500px) rotateX(1deg);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(0, 0, 0, 0.02);
  position: relative;
}

.info-item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 60%);
  pointer-events: none;
}

.info-item:hover {
  transform: perspective(500px) rotateX(0deg) translateY(-2px) translateZ(10px);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.12),
    0 4px 10px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04);
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  flex-shrink: 0;
}

.developer-icon {
  background: rgba(var(--v-theme-info), 0.1);
}

.update-icon {
  background: rgba(var(--v-theme-warning), 0.1);
}

.version-icon {
  background: rgba(var(--v-theme-success), 0.1);
}

.download-icon {
  background: rgba(var(--v-theme-error), 0.1);
}

.cpu-icon {
  background: rgba(var(--v-theme-primary), 0.1);
}

.memory-icon {
  background: rgba(var(--v-theme-secondary), 0.1);
}

.storage-icon {
  background: rgba(var(--v-theme-warning), 0.1);
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  min-width: 0;
}

.info-label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  opacity: 0.5;
  font-weight: 600;
  line-height: 1.1;
}

.info-value {
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.9;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  flex: 1;
}

.info-items {
  margin-top: 12px;
}

.description-spacer {
  height: 22px;
  margin-bottom: 16px;
}

.modern-link {
  justify-content: flex-start;
  opacity: 0.8;
  min-height: 32px !important;
  height: 32px !important;
  font-size: 0.875rem !important;
  padding: 6px 12px !important;
  transition: all 0.2s ease;
}

.modern-link:hover {
  opacity: 1;
  transform: perspective(500px) rotateX(0deg) translateY(-2px) translateZ(10px) !important;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.12),
    0 4px 10px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04) !important;
  background: rgb(var(--v-theme-surface)) !important;
}

/* 3D effect for link buttons */
.modern-link {
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important;
  transform-style: preserve-3d;
  transform: perspective(500px) rotateX(1deg);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(0, 0, 0, 0.02) !important;
  position: relative;
  margin: 0;
  border-radius: 16px !important;
  width: 100%;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
}

.modern-link::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 60%);
  pointer-events: none;
}

.modern-link::after {
  display: none !important;
}

.modern-link:focus::before {
  opacity: 0 !important;
}

.modern-link .v-btn__overlay {
  opacity: 0 !important;
  background: transparent !important;
}

.modern-link .v-ripple__container {
  display: none !important;
}

.modern-link .v-btn__content {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  height: 100% !important;
}

.modern-link .v-icon {
  opacity: 0.7 !important;
}

.cursor-pointer {
  cursor: pointer;
  transition: all 0.3s ease;
}

.cursor-pointer:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Screenshot Carousel Styling */
.screenshot-carousel {
  padding: 8px 0;
}

.screenshot-card {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  border-radius: 12px;
}

.screenshot-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}

.screenshot-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.screenshot-card:hover .screenshot-overlay {
  opacity: 1;
}

/* Modern Card Styling */
.v-card {
  border-radius: 24px !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(0, 0, 0, 0.02) !important;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  position: relative;
  z-index: 1;
}

.v-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.02) 100%);
  border-radius: inherit;
  z-index: -1;
  pointer-events: none;
}

.v-card:hover {
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.15),
    0 6px 24px rgba(0, 0, 0, 0.08),
    0 3px 12px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(var(--v-theme-primary), 0.1) !important;
  transform: translateY(-4px) scale(1.01);
}

/* Avatar Styling */
.v-avatar {
  border: 4px solid rgba(var(--v-theme-primary), 0.15);
  box-shadow:
    0 8px 32px rgba(var(--v-theme-primary), 0.25),
    0 4px 16px rgba(var(--v-theme-primary), 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.v-avatar:hover {
  transform: scale(1.05);
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow:
    0 12px 48px rgba(var(--v-theme-primary), 0.35),
    0 6px 24px rgba(var(--v-theme-primary), 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.2);
}

/* Button Styling */
.v-btn {
  border-radius: 20px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1) !important;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.04) !important;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  position: relative;
  overflow: hidden;
}

.v-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.v-btn:hover::before {
  left: 100%;
}

.v-btn:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: rgba(var(--v-theme-on-surface), 0.2) !important;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

/* Keep Install button with primary color */
.modern-install-btn {
  border: 1px solid rgba(var(--v-theme-primary), 0.2) !important;
  box-shadow:
    0 8px 32px rgba(var(--v-theme-primary), 0.25),
    0 4px 16px rgba(var(--v-theme-primary), 0.15),
    0 2px 8px rgba(var(--v-theme-primary), 0.1) !important;
}

.modern-install-btn:hover {
  border-color: rgba(var(--v-theme-primary), 0.4) !important;
  box-shadow:
    0 16px 64px rgba(var(--v-theme-primary), 0.35),
    0 8px 32px rgba(var(--v-theme-primary), 0.25),
    0 4px 16px rgba(var(--v-theme-primary), 0.15) !important;
}

/* Chip Styling */
.v-chip {
  border-radius: 24px !important;
  font-weight: 600 !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1) !important;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 2px rgba(255, 255, 255, 0.1) !important;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  position: relative;
  overflow: hidden;
}

.v-chip::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 100%);
  pointer-events: none;
}

.v-chip:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 2px rgba(255, 255, 255, 0.15) !important;
}

/* Responsive Design */
@media (max-width: 960px) {
  .app-details-container {
    padding: 16px;
  }

  .screenshot-card:hover {
    transform: none;
  }

  .v-card:hover {
    transform: none;
  }
}

/* Modern Loading State */

/* Loading and Error States */
.v-progress-circular {
  margin: 20px auto;
}

/* Image Viewer Styling - Scoped to prevent conflicts */
.image-viewer-content {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: auto !important;
  height: auto !important;
  margin: 0 !important;
  max-width: calc(100vw - 48px) !important;
  max-height: calc(100vh - 48px) !important;
}

.v-dialog.image-viewer-dialog .v-overlay__content {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Force centering on large screens */
@media (min-width: 960px) {
  .v-overlay.v-overlay--active .v-dialog.image-viewer-dialog .v-overlay__content {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    right: auto !important;
    bottom: auto !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
    width: auto !important;
    height: auto !important;
    max-width: calc(100vw - 48px) !important;
    max-height: calc(100vh - 48px) !important;
  }
}

.v-dialog.image-viewer-dialog .image-viewer-card {
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  padding: 0;
  width: fit-content;
  height: fit-content;
  overflow: hidden;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.v-dialog.image-viewer-dialog .image-viewer-img {
  display: block;
  border-radius: 8px;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  margin: 0;
  padding: 0;
}

/* Modern Image Loader */
.image-loader-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15 !important;
  border-radius: 8px;
  min-height: 300px;
  min-width: 300px;
}

.modern-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loader-ring {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: rgb(var(--v-theme-primary));
  animation: spin 1s ease-in-out infinite;
}

.loader-ring:nth-child(2) {
  width: 50px;
  height: 50px;
  animation-delay: -0.1s;
  animation-duration: 1.2s;
}

.loader-ring:nth-child(3) {
  width: 60px;
  height: 60px;
  animation-delay: -0.2s;
  animation-duration: 1.4s;
}


@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Smooth Transitions */
* {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>