<template>
  <div class="flux-share-upload">
    <!-- Drop Zone -->
    <div
      class="drop-zone"
      :class="{ 'drop-zone--active': isDragging && !isStorageFull, 'drop-zone--disabled': isStorageFull }"
      @drop.prevent="handleDrop"
      @dragover.prevent="!isStorageFull && (isDragging = true)"
      @dragleave="isDragging = false"
      @click="openFileSelector"
    >
      <VIcon
        :icon="isStorageFull ? 'mdi-close-circle' : 'mdi-cloud-upload'"
        size="64"
        :color="isStorageFull ? 'error' : 'primary'"
      />
      <p v-if="isStorageFull" class="text-body-1 mt-2 text-error">
        {{ t('pages.administration.fluxShare.errors.storageFull') }}
      </p>
      <template v-else>
        <p class="text-body-1 mt-2">
          {{ t('pages.administration.fluxShare.dropFilesHere') }}
        </p>
        <p class="text-body-2 text-medium-emphasis">
          {{ t('pages.administration.fluxShare.clickToUpload') }}
        </p>
        <p class="text-caption text-medium-emphasis mt-2">
          {{ t('pages.administration.fluxShare.maxFileSize') }}
        </p>
      </template>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      class="d-none"
      @change="handleFileSelect"
    >

    <!-- File Queue -->
    <div v-if="uploadQueue.length > 0" class="file-queue mt-4">
      <div
        v-for="(file, index) in uploadQueue"
        :key="file.id"
        class="file-item pa-3 mb-2 rounded border"
      >
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center">
            <VIcon :icon="getFileIcon(file.name)" class="mr-2" />
            <div>
              <div class="text-body-2 font-weight-medium text-truncate" style="max-width: 300px;">
                {{ file.name }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ formatFileSize(file.size) }}
              </div>
            </div>
          </div>
          <div class="d-flex align-center">
            <!-- Status Icon -->
            <VIcon
              v-if="file.status === 'completed'"
              icon="mdi-check-circle"
              color="success"
              class="mr-2"
            />
            <VIcon
              v-else-if="file.status === 'error'"
              icon="mdi-alert-circle"
              color="error"
              class="mr-2"
            />
            <VProgressCircular
              v-else-if="file.status === 'uploading'"
              :model-value="file.progress"
              size="24"
              width="3"
              color="primary"
              class="mr-2"
            />

            <!-- Remove Button -->
            <VBtn
              v-if="file.status !== 'uploading'"
              icon
              size="small"
              variant="text"
              @click="removeFromQueue(index)"
            >
              <VIcon icon="mdi-close" size="18" />
            </VBtn>
          </div>
        </div>

        <!-- Progress Bar -->
        <VProgressLinear
          v-if="file.status === 'uploading' || file.status === 'completed'"
          :model-value="file.progress"
          :color="file.status === 'completed' ? 'success' : 'primary'"
          height="4"
          rounded
        />

        <!-- Error Message -->
        <div v-if="file.status === 'error'" class="text-caption text-error mt-1">
          {{ file.error }}
        </div>
      </div>
    </div>

    <!-- Upload Button -->
    <div v-if="hasFilesToUpload" class="d-flex justify-center mt-4">
      <VBtn
        color="primary"
        :loading="isUploading"
        :disabled="isUploading"
        @click="startUpload"
      >
        <VIcon icon="mdi-cloud-upload" class="mr-2" />
        {{ t('pages.administration.fluxShare.uploadFiles') }}
        ({{ pendingCount }})
      </VBtn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/composables/useSnackbar'

const props = defineProps({
  uploadUrl: {
    type: String,
    required: true,
  },
  headers: {
    type: Object,
    default: () => ({}),
  },
  availableStorage: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['complete', 'error'])

const { t } = useI18n()
const { showSnackbar } = useSnackbar()

// Local state
const fileInputRef = ref(null)
const isDragging = ref(false)
const uploadQueue = ref([])
const isUploading = ref(false)

// Computed
const hasFilesToUpload = computed(() => {
  return uploadQueue.value.some(f => f.status === 'pending')
})

const pendingCount = computed(() => {
  return uploadQueue.value.filter(f => f.status === 'pending').length
})

const isStorageFull = computed(() => {
  return props.availableStorage <= 0
})

// Open file selector
const openFileSelector = () => {
  if (isStorageFull.value) {
    showSnackbar(t('pages.administration.fluxShare.errors.storageFull'), 'error')
    return
  }
  fileInputRef.value?.click()
}

// Handle file selection
const handleFileSelect = event => {
  const files = event.target.files
  if (files) {
    addFilesToQueue([...files])
  }

  // Reset input
  event.target.value = ''
}

// Handle drop
const handleDrop = event => {
  isDragging.value = false

  if (isStorageFull.value) {
    showSnackbar(t('pages.administration.fluxShare.errors.storageFull'), 'error')
    return
  }

  const files = event.dataTransfer?.files
  if (files) {
    addFilesToQueue([...files])
  }
}

// Add files to queue
const addFilesToQueue = files => {
  for (const file of files) {
    // Check for duplicates
    const exists = uploadQueue.value.some(f => f.name === file.name && f.size === file.size)
    if (exists) {
      showSnackbar(t('pages.administration.fluxShare.errors.duplicateFile', { name: file.name }), 'warning')
      continue
    }

    // Check file size (5GB max)
    const maxSize = 5 * 1024 * 1024 * 1024
    if (file.size > maxSize) {
      showSnackbar(t('pages.administration.fluxShare.errors.fileTooLarge', { name: file.name }), 'error')
      continue
    }

    // Check available storage (convert available GB to bytes)
    const availableBytes = props.availableStorage * 1024 * 1024 * 1024
    if (file.size > availableBytes) {
      const availableMB = (availableBytes / 1024 / 1024).toFixed(2)
      const fileMB = (file.size / 1024 / 1024).toFixed(2)
      showSnackbar(
        t('pages.administration.fluxShare.errors.insufficientStorage', {
          name: file.name,
          fileSize: fileMB,
          available: availableMB,
        }),
        'error'
      )
      continue
    }

    uploadQueue.value.push({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      file: file,
      progress: 0,
      status: 'pending', // pending, uploading, completed, error
      error: null,
    })
  }
}

// Remove from queue
const removeFromQueue = index => {
  uploadQueue.value.splice(index, 1)
}

// Start upload
const startUpload = () => {
  isUploading.value = true

  const pendingFiles = uploadQueue.value.filter(f => f.status === 'pending')
  pendingFiles.forEach(file => {
    uploadFile(file)
  })
}

// Upload single file
const uploadFile = fileItem => {
  const xhr = new XMLHttpRequest()

  fileItem.status = 'uploading'

  // Progress handler
  xhr.upload.onprogress = event => {
    if (event.lengthComputable) {
      fileItem.progress = Math.round((event.loaded / event.total) * 100)
    }
  }

  // Error handler
  xhr.onerror = () => {
    fileItem.status = 'error'
    fileItem.error = t('pages.administration.fluxShare.errors.uploadFailed')
    checkUploadComplete()
    emit('error', { file: fileItem, error: 'Network error' })
  }

  // Load handler
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      fileItem.status = 'completed'
      fileItem.progress = 100
      showSnackbar(t('pages.administration.fluxShare.messages.fileUploaded', { name: fileItem.name }), 'success')
      emit('complete', fileItem)
    } else {
      fileItem.status = 'error'
      fileItem.error = `${t('pages.administration.fluxShare.errors.uploadFailed')} (${xhr.status})`
      emit('error', { file: fileItem, error: xhr.statusText })
    }
    checkUploadComplete()
  }

  // Open connection
  xhr.open('POST', props.uploadUrl, true)

  // Set headers
  Object.keys(props.headers).forEach(key => {
    if (props.headers[key]) {
      xhr.setRequestHeader(key, props.headers[key])
    }
  })

  // Create form data
  const formData = new FormData()
  formData.append(fileItem.name, fileItem.file)

  // Send
  xhr.send(formData)
}

// Check if all uploads are complete
const checkUploadComplete = () => {
  const pending = uploadQueue.value.some(f => f.status === 'uploading')
  if (!pending) {
    isUploading.value = false

    // Remove completed files after a delay
    setTimeout(() => {
      uploadQueue.value = uploadQueue.value.filter(f => f.status !== 'completed')
    }, 2000)
  }
}

// Get file icon based on extension
const getFileIcon = fileName => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const iconMap = {
    pdf: 'mdi-file-pdf-box',
    doc: 'mdi-file-word',
    docx: 'mdi-file-word',
    xls: 'mdi-file-excel',
    xlsx: 'mdi-file-excel',
    jpg: 'mdi-file-image',
    jpeg: 'mdi-file-image',
    png: 'mdi-file-image',
    gif: 'mdi-file-image',
    zip: 'mdi-folder-zip',
    rar: 'mdi-folder-zip',
    mp3: 'mdi-file-music',
    mp4: 'mdi-file-video',
    txt: 'mdi-file-document',
    json: 'mdi-code-json',
    js: 'mdi-language-javascript',
  }

  return iconMap[ext] || 'mdi-file'
}

// Format file size
const formatFileSize = bytes => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.drop-zone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.5);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drop-zone:hover,
.drop-zone--active {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.drop-zone--disabled {
  border-color: rgba(var(--v-theme-error), 0.5);
  background-color: rgba(var(--v-theme-error), 0.05);
  cursor: not-allowed;
  opacity: 0.7;
}

.drop-zone--disabled:hover {
  border-color: rgba(var(--v-theme-error), 0.5);
  background-color: rgba(var(--v-theme-error), 0.05);
}

.file-queue {
  max-height: 300px;
  overflow-y: auto;
}

.file-item {
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}
</style>
