<template>
  <VDialog
    v-model="dialog"
    :max-width="750"
    persistent
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex align-center px-3 py-1 bg-primary text-white">
        <VIcon icon="mdi-history" class="me-2" style="color: rgba(255,255,255,0.9);" />
        <h3 class="text-subtitle-1 text-white">{{ t('components.fluxDrive.versionsDialog.title') }}</h3>
        <VSpacer />
        <VBtn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="dialog = false"
        />
      </VCardTitle>

      <VCardText class="pa-6 pt-4" style="height: 500px; overflow-y: auto;">
        <div>
          <!-- Loading state -->
          <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
            <VProgressCircular
              indeterminate
              color="primary"
              :size="60"
              :width="4"
            />
          </div>

          <!-- Versions list -->
          <div v-else-if="file && file.name">
            <!-- Current version (original) -->
            <VCard
              variant="elevated"
              class="mb-4 bg-grey-lighten-5"
              elevation="6"
            >
              <VCardText>
                <div class="d-flex align-center" style="min-height: 80px;">
                  <!-- File icon/thumbnail -->
                  <div class="mr-4 d-flex align-center justify-center" style="width: 64px; height: 64px;">
                    <VImg
                      v-if="file.thumbnail"
                      :src="file.thumbnail"
                      :width="64"
                      :height="64"
                      class="rounded"
                    />
                    <VIcon
                      v-else
                      icon="mdi-file-check"
                      :size="64"
                      color="green"
                    />
                  </div>

                  <!-- File details -->
                  <div class="flex-grow-1">
                    <div class="d-flex align-center mb-1">
                      <div class="text-h6 me-2">{{ file.name }}</div>
                      <VChip
                        size="small"
                        color="green"
                        variant="tonal"
                        prepend-icon="mdi-check-circle"
                      >
                        {{ t('components.fluxDrive.versionsDialog.current') }}
                      </VChip>
                    </div>
                    <div class="text-body-2 text-medium-emphasis mb-1">
                      <VIcon icon="mdi-account" size="18" class="me-1" />
                      {{ t('components.fluxDrive.versionsDialog.currentVersion') }}
                    </div>
                    <div v-if="file.comment" class="text-body-2 text-medium-emphasis mb-1">
                      <VIcon icon="mdi-comment-text" size="18" class="me-1" />
                      {{ file.comment }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      <VIcon icon="mdi-calendar" size="18" class="me-1" />
                      {{ formatDate(file.timestamp) }}
                      <VIcon icon="mdi-database" size="18" class="ms-2 me-1" />
                      {{ bytesConversion(file.size) }}
                    </div>
                  </div>

                  <!-- Actions menu -->
                  <VMenu>
                    <template #activator="{ props }">
                      <VBtn
                        icon="mdi-dots-vertical"
                        variant="text"
                        color="grey"
                        v-bind="props"
                      />
                    </template>
                    <VList>
                      <VListItem
                        prepend-icon="mdi-eye"
                        :title="t('components.fluxDrive.versionsDialog.preview')"
                        @click="openFile(file)"
                      />
                      <VListItem
                        prepend-icon="mdi-download"
                        :title="t('components.fluxDrive.versionsDialog.download')"
                        @click="downloadFile(file)"
                      />
                      <VListItem
                        prepend-icon="mdi-link"
                        :title="t('components.fluxDrive.versionsDialog.copyLink')"
                        @click="copyFileLink(file.hash)"
                      />
                    </VList>
                  </VMenu>
                </div>
              </VCardText>
            </VCard>

            <!-- Previous versions -->
            <VCard
              v-for="(version, index) in file.versions || []"
              :key="version.hash"
              variant="elevated"
              class="mb-4 bg-grey-lighten-5"
              elevation="5"
            >
              <VCardText>
                <div class="d-flex align-center" style="min-height: 80px;">
                  <!-- File icon/thumbnail -->
                  <div class="mr-4 d-flex align-center justify-center" style="width: 64px; height: 64px;">
                    <VImg
                      v-if="version.thumbnail"
                      :src="version.thumbnail"
                      :width="64"
                      :height="64"
                      class="rounded"
                    />
                    <VIcon
                      v-else-if="index === 0"
                      icon="mdi-file-restore"
                      :size="64"
                      color="blue"
                    />
                    <VIcon
                      v-else-if="index === file.versions.length - 1"
                      icon="mdi-file-clock"
                      :size="64"
                      color="amber"
                    />
                    <VIcon
                      v-else
                      icon="mdi-file-document-multiple"
                      :size="64"
                      color="grey"
                    />
                  </div>

                  <!-- Version details -->
                  <div class="flex-grow-1">
                    <div class="d-flex align-center mb-1">
                      <div class="text-h6 me-2">{{ version.filename || file.name }}</div>
                      <VChip
                        size="small"
                        color="grey"
                        variant="tonal"
                        prepend-icon="mdi-history"
                      >
                        v{{ file.versions.length - index }}
                      </VChip>
                      <VChip
                        v-if="index === 0"
                        size="small"
                        color="grey"
                        variant="tonal"
                        class="ms-1"
                        prepend-icon="mdi-backup-restore"
                      >
                        {{ t('components.fluxDrive.versionsDialog.previous') }}
                      </VChip>
                      <VChip
                        v-else-if="index === file.versions.length - 1"
                        size="small"
                        color="amber"
                        variant="tonal"
                        class="ms-1"
                        prepend-icon="mdi-source-commit-start"
                      >
                        {{ t('components.fluxDrive.versionsDialog.original') }}
                      </VChip>
                    </div>
                    <div class="text-body-2 text-medium-emphasis mb-1">
                      <VIcon icon="mdi-comment-text" size="18" class="me-1" />
                      {{ version.comment || t('components.fluxDrive.versionsDialog.versionNumber', { number: file.versions.length - index }) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      <VIcon icon="mdi-calendar-clock" size="18" class="me-1" />
                      {{ formatDate(version.timestamp) }}
                      <VIcon icon="mdi-file-outline" size="18" class="ms-2 me-1" />
                      {{ bytesConversion(version.size) }}
                      <VIcon icon="mdi-identifier" size="18" class="ms-2 me-1" />
                      {{ version.hash.substring(0, 8) }}...
                    </div>
                  </div>

                  <!-- Actions menu -->
                  <VMenu>
                    <template #activator="{ props }">
                      <VBtn
                        icon="mdi-dots-vertical"
                        variant="text"
                        color="grey"
                        v-bind="props"
                      />
                    </template>
                    <VList>
                      <VListItem
                        prepend-icon="mdi-eye"
                        :title="t('components.fluxDrive.versionsDialog.preview')"
                        @click="openVersion(version)"
                      />
                      <VListItem
                        prepend-icon="mdi-download"
                        :title="t('components.fluxDrive.versionsDialog.download')"
                        @click="downloadVersion(version)"
                      />
                      <VListItem
                        prepend-icon="mdi-link"
                        :title="t('components.fluxDrive.versionsDialog.copyLink')"
                        @click="copyFileLink(version.hash)"
                      />
                    </VList>
                  </VMenu>
                </div>
              </VCardText>
            </VCard>

            <!-- No versions message -->
            <div
              v-if="(!file.versions || file.versions.length === 0)"
              class="text-center text-medium-emphasis py-8"
            >
              <VIcon icon="mdi-history" size="64" class="mb-4" />
              <div class="text-h6">{{ t('components.fluxDrive.versionsDialog.noPreviousVersions') }}</div>
              <div class="text-body-2">{{ t('components.fluxDrive.versionsDialog.noPreviousVersionsMessage') }}</div>
            </div>
          </div>

          <!-- No file selected -->
          <div
            v-else
            class="text-center text-medium-emphasis py-8"
          >
            <VIcon icon="mdi-file-question" size="64" class="mb-4" />
            <div class="text-h6">{{ t('components.fluxDrive.versionsDialog.noFileSelected') }}</div>
            <div class="text-body-2">{{ t('components.fluxDrive.versionsDialog.noFileSelectedMessage') }}</div>
          </div>
        </div>
      </VCardText>
    </VCard>

  </VDialog>

  <!-- Modern Download Progress Dialog -->
  <VDialog
    v-model="downloading"
    persistent
    :max-width="480"
  >
    <VCard class="download-dialog" elevation="12">
      <!-- Header -->
      <VCardTitle class="d-flex align-center px-3 py-1 bg-gradient-primary">
        <VIcon icon="mdi-download" class="me-2" color="white" style="color: rgba(255,255,255,0.9);" />
        <span class="text-subtitle-1 text-white">{{ t('components.fluxDrive.versionsDialog.downloadProgress') }}</span>
      </VCardTitle>

      <VCardText class="pa-6">
        <!-- File Info -->
        <div class="d-flex align-center mb-4">
          <VAvatar class="me-4" color="primary" variant="tonal" size="48">
            <VIcon icon="mdi-file-download" size="24" />
          </VAvatar>
          <div class="flex-grow-1">
            <div class="text-subtitle-1 font-weight-medium mb-1">{{ downloadingFile }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ formatFileSize(downloadingFileSize) }}</div>
          </div>
        </div>

        <!-- Progress Section -->
        <div class="progress-section">
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-body-2 text-medium-emphasis">{{ t('components.fluxDrive.versionsDialog.progress') }}</span>
            <span class="text-body-2 font-weight-medium">{{ downloadProgress }}%</span>
          </div>

          <VProgressLinear
            :model-value="downloadProgress"
            color="primary"
            height="6"
            rounded
          />
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFluxDrive } from '@/composables/useFluxDrive'
import { useSnackbar } from '@/composables/useSnackbar'
import ClipboardJS from 'clipboard'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  file: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'show-message', 'preview-file'])

// i18n
const { t } = useI18n()

// Composables
const {
  bytesConversion,
  copyLink,
  previewFile,
} = useFluxDrive()

const { showSnackbar } = useSnackbar()

// Helper to show messages via parent FileManager's toast system
const showMessage = (message, type = 'success') => {
  emit('showMessage', { message, type })
}

// Get bridgeURL and ipfsHost from localStorage or defaults
const bridgeURL = localStorage.getItem('bridgeURL') || 'https://api.fluxdrive.runonflux.io'
const ipfsHost = localStorage.getItem('ipfsHost') || 'https://fluxdrive.runonflux.io'

// State
const loading = ref(false)
const downloading = ref(false)
const downloadProgress = ref(0)
const downloadingFile = ref('')
const downloadingFileSize = ref(0)

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Methods
const formatDate = timestamp => {
  const date = new Date(typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime())
  
  return date.toLocaleString()
}

const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = filename => {
  if (!filename) return 'mdi-file'

  const ext = filename.split('.').pop()?.toLowerCase()

  const iconMap = {
    // Images
    jpg: 'mdi-file-image',
    jpeg: 'mdi-file-image',
    png: 'mdi-file-image',
    gif: 'mdi-file-image',
    svg: 'mdi-file-image',
    webp: 'mdi-file-image',

    // Documents
    pdf: 'mdi-file-pdf-box',
    doc: 'mdi-file-word',
    docx: 'mdi-file-word',
    xls: 'mdi-file-excel',
    xlsx: 'mdi-file-excel',
    ppt: 'mdi-file-powerpoint',
    pptx: 'mdi-file-powerpoint',
    txt: 'mdi-file-document',

    // Code
    js: 'mdi-language-javascript',
    ts: 'mdi-language-typescript',
    html: 'mdi-language-html5',
    css: 'mdi-language-css3',
    json: 'mdi-code-json',
    xml: 'mdi-file-xml',
    py: 'mdi-language-python',

    // Archives
    zip: 'mdi-folder-zip',
    rar: 'mdi-folder-zip',
    '7z': 'mdi-folder-zip',
    tar: 'mdi-folder-zip',
    gz: 'mdi-folder-zip',

    // Video
    mp4: 'mdi-file-video',
    avi: 'mdi-file-video',
    mkv: 'mdi-file-video',
    mov: 'mdi-file-video',
    wmv: 'mdi-file-video',

    // Audio
    mp3: 'mdi-file-music',
    wav: 'mdi-file-music',
    flac: 'mdi-file-music',
    aac: 'mdi-file-music',

    // Executables
    exe: 'mdi-application',
    msi: 'mdi-application',
    dmg: 'mdi-application',
    deb: 'mdi-package-variant',
    rpm: 'mdi-package-variant',
  }

  return iconMap[ext] || 'mdi-file'
}

const openFile = file => {
  console.log('🔍 Opening file for preview:', file.name, file.hash)
  console.log('🔍 File object:', JSON.stringify(file, null, 2))

  // Emit to parent FileManager to handle preview
  emit('previewFile', file)
  console.log('🔍 Emitted previewFile event, closing versions dialog')

  // Close the versions dialog to allow the file preview modal to show
  dialog.value = false
}

const openVersion = version => {
  // Create a file-like object for the version
  const versionFile = {
    ...props.file,
    hash: version.hash,
    name: version.filename || props.file.name,
    size: version.size,
    thumbnail: version.thumbnail,
    timestamp: version.timestamp,
  }
  console.log('🔍 Opening version for preview:', versionFile.name, versionFile.hash)
  console.log('🔍 Version file object:', JSON.stringify(versionFile, null, 2))

  // Emit to parent FileManager to handle preview
  emit('previewFile', versionFile)
  console.log('🔍 Emitted previewFile event for version, closing versions dialog')

  // Close the versions dialog to allow the file preview modal to show
  dialog.value = false
}

const downloadFile = async file => {
  console.log('📥 Starting download:', file.name, 'from hash:', file.hash)

  try {
    // Show download progress dialog
    const originalName = file.name || file.name_abbr || `file_${file.hash}`
    downloading.value = true
    downloadProgress.value = 0
    downloadingFile.value = originalName
    downloadingFileSize.value = file.size || 0

    // Fetch the file with progress tracking
    const response = await fetch(`${ipfsHost}/ipfs/${file.hash}`, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Get content length for progress calculation
    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0

    // Read the response as stream for progress tracking
    const reader = response.body.getReader()
    const chunks = []
    let receivedLength = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      chunks.push(value)
      receivedLength += value.length

      // Update progress
      if (total > 0) {
        downloadProgress.value = Math.round((receivedLength / total) * 100)
      }
    }

    // Combine chunks into blob
    const chunksAll = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      chunksAll.set(chunk, position)
      position += chunk.length
    }

    const blob = new Blob([chunksAll])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Hide progress dialog
    downloading.value = false
    showMessage(t('components.fluxDrive.versionsDialog.downloadSuccess', { name: originalName }), 'success')

  } catch (error) {
    console.error('📥 Download error:', error)
    downloading.value = false
    showMessage(t('components.fluxDrive.versionsDialog.downloadFailed', { name: file.name, error: error.message }), 'error')
  }
}

const downloadVersion = async version => {
  const fileName = version.filename || props.file.name
  console.log('📥 Starting version download:', fileName, 'from hash:', version.hash)

  try {
    // Show download progress dialog
    downloading.value = true
    downloadProgress.value = 0
    downloadingFile.value = fileName
    downloadingFileSize.value = version.size || 0

    // Fetch the file with progress tracking
    const response = await fetch(`${ipfsHost}/ipfs/${version.hash}`, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Get content length for progress calculation
    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0

    // Read the response as stream for progress tracking
    const reader = response.body.getReader()
    const chunks = []
    let receivedLength = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      chunks.push(value)
      receivedLength += value.length

      // Update progress
      if (total > 0) {
        downloadProgress.value = Math.round((receivedLength / total) * 100)
      }
    }

    // Combine chunks into blob
    const chunksAll = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      chunksAll.set(chunk, position)
      position += chunk.length
    }

    const blob = new Blob([chunksAll])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Hide progress dialog
    downloading.value = false
    showMessage(t('components.fluxDrive.versionsDialog.downloadSuccess', { name: fileName }), 'success')

  } catch (error) {
    console.error('📥 Version download error:', error)
    downloading.value = false
    showMessage(t('components.fluxDrive.versionsDialog.downloadFailed', { name: fileName, error: error.message }), 'error')
  }
}

const copyFileLink = hash => {
  const link = `https://ipfs.runonflux.io/ipfs/${hash}`
  console.log('📋 Copying link to clipboard:', link)

  try {
    // Create temporary button for ClipboardJS
    const button = document.createElement('button')
    button.setAttribute('data-clipboard-text', link)
    document.body.appendChild(button)

    // Initialize ClipboardJS
    const clipboard = new ClipboardJS(button)

    clipboard.on('success', () => {
      console.log('✅ Link copied successfully')
      showMessage(t('components.fluxDrive.versionsDialog.linkCopied'), 'success')
      clipboard.destroy()
      document.body.removeChild(button)
    })

    clipboard.on('error', err => {
      console.error('❌ ClipboardJS error:', err)
      showMessage(t('components.fluxDrive.versionsDialog.linkCopyFailed'), 'error')
      clipboard.destroy()
      document.body.removeChild(button)
    })

    // Trigger the click programmatically
    button.click()
  } catch (error) {
    console.error('❌ Copy link error:', error)
    showMessage(t('components.fluxDrive.versionsDialog.linkCopyFailed'), 'error')
  }
}
</script>

<style scoped>
/* Only apply 3D effects to version cards, not the dialog card */
.bg-grey-lighten-5 {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  border-radius: 12px !important;
  background: linear-gradient(135deg, rgb(var(--v-theme-grey-lighten-4)) 0%, rgb(var(--v-theme-grey-lighten-3)) 100%) !important;
  box-shadow:
    0 16px 40px rgba(0,0,0,0.25),
    0 8px 16px rgba(0,0,0,0.15),
    inset 0 1px 0 rgba(255,255,255,0.2) !important;
}

.bg-grey-lighten-5:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, rgb(var(--v-theme-grey-lighten-2)) 0%, rgb(var(--v-theme-grey-lighten-1)) 100%) !important;
  box-shadow:
    0 20px 40px rgba(0,0,0,0.28),
    0 10px 18px rgba(0,0,0,0.18),
    0 0 18px rgba(255,255,255,0.25),
    0 0 8px rgba(255,255,255,0.2),
    inset 0 1px 0 rgba(255,255,255,0.4) !important;
}

/* Modern Download Dialog Styles */
.download-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-primary-darken-1)) 100%) !important;
}

.progress-section {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}
</style>