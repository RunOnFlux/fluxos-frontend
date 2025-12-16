<template>
  <div>
    <!-- Loading State -->
    <LoadingSpinner
      v-if="initialLoading"
      icon="mdi-share-variant"
      :title="t('pages.administration.fluxShare.loadingTitle')"
    />

    <!-- Content -->
    <div v-else>
      <!-- Page Header -->
      <div class="mb-3">
        <div class="d-flex align-center mb-2">
          <VAvatar color="primary" variant="flat" size="48" class="mr-3">
            <VIcon icon="mdi-share-variant" size="32" color="white" />
          </VAvatar>
          <div>
            <h2 class="text-h5 font-weight-bold">{{ t('pages.administration.fluxShare.title') }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              {{ t('pages.administration.fluxShare.subtitle') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Storage Info Card -->
      <VCard class="mb-3" elevation="1">
        <VCardTitle class="d-flex align-center pa-3 bg-surface">
          <VIcon icon="mdi-harddisk" size="24" class="mr-2" />
          <span class="text-body-1 font-weight-medium">{{ t('pages.administration.fluxShare.storageUsage') }}</span>
          <VSpacer />
          <VBtn
            icon
            variant="text"
            size="small"
            :loading="loadingStorage"
            @click="fetchStorageStats"
          >
            <VIcon icon="mdi-refresh" />
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          <div class="position-relative mb-2">
            <VProgressLinear
              :model-value="storagePercentage"
              height="20"
              rounded
              :color="storagePercentage > 90 ? 'error' : storagePercentage > 75 ? 'warning' : 'primary'"
            />
            <div class="progress-label">
              {{ storagePercentage.toFixed(1) }}%
            </div>
          </div>
          <div class="d-flex align-center justify-start ga-2">
            <VChip
              size="small"
              color="grey"
              variant="tonal"
            >
              <VIcon icon="mdi-database" size="16" class="mr-1" />
              {{ t('pages.administration.fluxShare.available') }}: {{ storage.available.toFixed(2) }} GB
            </VChip>
            <VChip
              size="small"
              color="grey"
              variant="tonal"
            >
              <VIcon icon="mdi-harddisk" size="16" class="mr-1" />
              {{ storage.used.toFixed(2) }} GB / {{ storage.total.toFixed(2) }} GB
            </VChip>
          </div>
        </VCardText>
      </VCard>

      <!-- File Manager -->
      <FluxShareFileManager
        ref="fileManagerRef"
        :available-storage="storage.available"
        @upload-requested="showUploadDialog = true"
      />

      <!-- Upload Dialog -->
      <VDialog
        v-model="showUploadDialog"
        max-width="600"
        persistent
      >
        <VCard>
          <VCardTitle class="d-flex align-center px-4 py-2 bg-primary">
            <VIcon icon="mdi-cloud-upload" class="mr-2" color="white" />
            <span class="text-white">{{ t('pages.administration.fluxShare.uploadFiles') }}</span>
            <VSpacer />
            <VBtn
              icon
              variant="text"
              size="small"
              color="white"
              @click="closeUploadDialog"
            >
              <VIcon icon="mdi-close" />
            </VBtn>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-4">
            <FluxShareFileUpload
              :upload-url="getUploadUrl()"
              :headers="{ zelidauth: getZelidAuth() }"
              :available-storage="storage.available"
              @complete="onUploadComplete"
              @error="onUploadError"
            />
          </VCardText>
        </VCard>
      </VDialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSEONoIndex } from '@/composables/useSEO'
import { useFluxShare } from '@/composables/useFluxShare'
import { useFluxStore } from '@/stores/flux'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import FluxShareFileManager from '@/components/FluxShare/FluxShareFileManager.vue'
import FluxShareFileUpload from '@/components/FluxShare/FluxShareFileUpload.vue'

// Prevent indexing of admin page
useSEONoIndex()

const { t } = useI18n()
const fluxStore = useFluxStore()

const {
  loading,
  loadingStorage,
  storage,
  storagePercentage,
  isLoggedIn,
  isAdmin,
  getZelidAuth,
  getUploadUrl,
  fetchStorageStats,
  loadFolder,
  refresh,
  resetState,
} = useFluxShare()

// Local state
const initialLoading = ref(true)
const showUploadDialog = ref(false)
const fileManagerRef = ref(null)

// Initialize data
const initializeData = async () => {
  initialLoading.value = true

  // Ensure minimum loading time for smooth UX
  const startTime = Date.now()

  await Promise.all([
    fetchStorageStats(),
    loadFolder(''),
  ])

  const elapsed = Date.now() - startTime
  const minDelay = 1000

  if (elapsed < minDelay) {
    await new Promise(resolve => setTimeout(resolve, minDelay - elapsed))
  }

  initialLoading.value = false
}

// Close upload dialog
const closeUploadDialog = () => {
  showUploadDialog.value = false
}

// Handle upload complete
const onUploadComplete = () => {
  refresh()
}

// Handle upload error
const onUploadError = error => {
  console.error('Upload error:', error)
}

// Watch for login state changes
watch(() => fluxStore.privilege, newPrivilege => {
  if (newPrivilege === 'admin' || newPrivilege === 'fluxteam') {
    initializeData()
  } else {
    resetState()
  }
})

onMounted(() => {
  if (isAdmin.value) {
    initializeData()
  } else {
    initialLoading.value = false
  }
})

onUnmounted(() => {
  // Clean up state and cancel pending requests when leaving the page
  resetState()
})
</script>

<style scoped>
.progress-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  text-shadow:
    -1px -1px 0 rgba(var(--v-theme-surface), 0.8),
    1px -1px 0 rgba(var(--v-theme-surface), 0.8),
    -1px 1px 0 rgba(var(--v-theme-surface), 0.8),
    1px 1px 0 rgba(var(--v-theme-surface), 0.8),
    0 0 3px rgba(var(--v-theme-surface), 0.9);
  pointer-events: none;
  z-index: 1;
}
</style>

<route lang="yaml">
meta:
  privilege:
    - admin
    - fluxteam
</route>
