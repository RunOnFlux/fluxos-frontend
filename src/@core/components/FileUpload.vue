<template>
  <div
    class="flux-share-upload"
    @drop.prevent="addFile"
    @dragover.prevent
  >
    <input
      v-show="false"
      ref="fileselector"
      type="file"
      multiple
      @change="handleFiles"
    >
    <input
      v-show="false"
      ref="folderselector"
      type="file"
      webkitdirectory
      @change="handleFiles"
    >

    <VCard class="flux-share-upload-drop ma-3"
    >
      <VCardText class="text-center">
        <VIcon size="64">
          mdi-cloud-upload
        </VIcon>
        <p>{{ t('core.fileUpload.dropFilesOrFolders') }}</p>
        <div class="d-flex justify-center gap-2 mt-2">
          <VBtn size="small" @click="selectFiles">
            <VIcon start>mdi-file-multiple</VIcon>
            {{ t('core.fileUpload.selectFiles') }}
          </VBtn>
          <VBtn size="small" @click="selectFolder">
            <VIcon start>mdi-folder</VIcon>
            {{ t('core.fileUpload.selectFolder') }}
          </VBtn>
        </div>
        <p class="upload-footer mt-2">
          {{ t('core.fileUpload.fileSizeLimit') }}
        </p>
      </VCardText>
    </VCard>

    <VCard v-if="files.length > 0" class="ma-3 mt-2" variant="outlined">
      <VCardTitle class="d-flex align-center justify-space-between py-2 px-3">
        <div class="d-flex align-center flex-grow-1">
          <VIcon size="20" class="mr-2">
            mdi-file-upload-outline
          </VIcon>
          <span class="text-subtitle-2">
            {{ t('core.fileUpload.uploadQueue') }} ({{ files.length }})
            <span class="text-caption" style="opacity: 0.7;">
              • {{ t('core.fileUpload.total') }}: {{ addAndConvertFileSizes(totalUploadSize) }}
            </span>
          </span>
        </div>
        <VTooltip location="bottom">
          <template #activator="{ props }">
            <VIcon
              v-if="files.some(f => f.progress === 0)"
              v-bind="props"
              class="cursor-pointer mr-2 flex-shrink-0"
              color="error"
              size="20"
              @click="files.splice(0, files.length)"
            >
              mdi-delete
            </VIcon>
          </template>
          <span>{{ t('core.fileUpload.clearAll') }}</span>
        </VTooltip>
      </VCardTitle>
      <VDivider />
      <VCardText class="pa-0">
        <div class="upload-column">
          <template v-for="(item, index) in fileTree" :key="index">
            <!-- Folder Entry -->
            <div v-if="item.type === 'folder'" class="folder-group">
              <div class="folder-header" @click="toggleFolder(item.path)">
                <div class="d-flex align-center flex-grow-1">
                  <VIcon size="20" class="mr-2">
                    mdi-folder
                  </VIcon>
                  <span class="folder-name">{{ item.name }}</span>
                  <span class="file-count text-caption ml-2">
                    ({{ item.files.length }} {{ t('core.fileUpload.files', item.files.length) }}, {{ addAndConvertFileSizes(item.totalSize) }})
                  </span>
                </div>
                <VIcon size="16" class="ml-2 flex-shrink-0">
                  {{ folderExpanded.get(item.path) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                </VIcon>
              </div>

              <!-- Files in folder -->
              <div v-if="folderExpanded.get(item.path)" v-for="file in item.files" :key="file.file.name" class="upload-item file-in-folder">
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center flex-grow-1 mr-2">
                    <VIcon
                      icon="mdi-file-outline"
                      size="18"
                      class="mr-2 ml-4 flex-shrink-0"
                      :color="file.uploaded ? 'success' : 'default'"
                    />
                    <div class="file-info flex-grow-1">
                      <div class="file-name text-truncate">
                        {{ file.file.name }}
                      </div>
                      <div class="file-size text-caption">
                        {{ addAndConvertFileSizes(file.file.size) }}
                      </div>
                    </div>
                  </div>
                  <VTooltip v-if="file.progress === 0" location="bottom">
                    <template #activator="{ props }">
                      <VIcon
                        v-bind="props"
                        class="cursor-pointer flex-shrink-0"
                        color="error"
                        size="18"
                        @click.stop="removeFile(file)"
                      >
                        mdi-close-circle
                      </VIcon>
                    </template>
                    <span>{{ t('core.fileUpload.removeFile') }}</span>
                  </VTooltip>
                  <VIcon
                    v-else-if="file.uploaded"
                    color="success"
                    size="18"
                    class="flex-shrink-0"
                  >
                    mdi-check-circle
                  </VIcon>
                </div>
                <VProgressLinear
                  v-if="file.uploading || file.uploaded"
                  :model-value="file.progress"
                  height="3"
                  color="success"
                  class="mt-1"
                />
              </div>
            </div>

            <!-- Single File Entry -->
            <div v-else class="upload-item">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center flex-grow-1 mr-2">
                  <VIcon
                    icon="mdi-file-outline"
                    size="20"
                    class="mr-2 flex-shrink-0"
                    :color="item.uploaded ? 'success' : 'default'"
                  />
                  <div class="file-info flex-grow-1">
                    <div class="file-name text-truncate">
                      {{ item.file.name }}
                    </div>
                    <div class="file-size text-caption">
                      {{ addAndConvertFileSizes(item.file.size) }}
                    </div>
                  </div>
                </div>
                <VTooltip v-if="item.progress === 0" location="bottom">
                  <template #activator="{ props }">
                    <VIcon
                      v-bind="props"
                      class="cursor-pointer mr-2 flex-shrink-0"
                      color="error"
                      size="20"
                      @click.stop="removeFile(item)"
                    >
                      mdi-close-circle
                    </VIcon>
                  </template>
                  <span>{{ t('core.fileUpload.removeFile') }}</span>
                </VTooltip>
                <VIcon
                  v-else-if="item.uploaded"
                  color="success"
                  size="20"
                  class="mr-2 flex-shrink-0"
                >
                  mdi-check-circle
                </VIcon>
              </div>
              <VProgressLinear
                v-if="item.uploading || item.uploaded"
                :model-value="item.progress"
                height="4"
                color="success"
                class="mt-1"
              />
            </div>
          </template>
        </div>
      </VCardText>
    </VCard>

    <VCardActions class="justify-center py-2">
      <VBtn
        color="primary"
        variant="flat"
        :disabled="!filesToUpload"
        @click="startUpload"
      >
        <VIcon start size="20">mdi-upload</VIcon>
        {{ t('core.fileUpload.uploadFiles') }}
      </VBtn>
    </VCardActions>

    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="4000"
      location="top right"
    >
      {{ snackbarMessage }}
    </VSnackbar>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { findUploadFailure, readCompletedUploads } from '@/utils/uploadResponse'

const props = defineProps({
  uploadFolder: { type: String, required: true },
  headers: { type: Object, required: true },
})

const emit = defineEmits(['close'])

const { t } = useI18n()

// ✅ Make the array reactive
const files = reactive([])
const fileselector = ref(null)
const lastSelectionType = ref(null) // Track: 'files' or 'folder'
const folderExpanded = reactive(new Map()) // Track folder expansion state

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const showToast = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

const filesToUpload = computed(() => {
  return files.length > 0 && files.some(f => !f.uploading && !f.uploaded && f.progress === 0)
})

// Organize files into tree structure
const fileTree = computed(() => {
  const tree = []
  const folderMap = new Map()

  files.forEach(fileObj => {
    const file = fileObj.file

    // If file has relativePath, it's from a folder upload
    if (file.relativePath) {
      const parts = file.relativePath.split('/')
      const fileName = parts[parts.length - 1]
      const folderPath = parts.slice(0, -1).join('/')

      // Create or get folder entry
      if (!folderMap.has(folderPath)) {
        // Initialize expansion state if not set
        if (!folderExpanded.has(folderPath)) {
          folderExpanded.set(folderPath, true)
        }

        const folderEntry = {
          type: 'folder',
          path: folderPath,
          name: folderPath,
          files: [],
        }
        folderMap.set(folderPath, folderEntry)
        tree.push(folderEntry)
      }

      // Add file to folder
      folderMap.get(folderPath).files.push(fileObj)
    } else {
      // Single file upload
      tree.push({
        type: 'file',
        ...fileObj,
      })
    }
  })

  // Calculate folder sizes
  tree.forEach(item => {
    if (item.type === 'folder') {
      item.totalSize = item.files.reduce((sum, f) => sum + f.file.size, 0)
    }
  })

  return tree
})

// Calculate total upload size
const totalUploadSize = computed(() => {
  return files.reduce((sum, f) => sum + f.file.size, 0)
})

const toggleFolder = folderPath => {
  const current = folderExpanded.get(folderPath) ?? true
  folderExpanded.set(folderPath, !current)
}

const addAndConvertFileSizes = (size, unit = 'auto', decimal = 2) => {
  const map = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824 }
  let bestUnit = 'B'
  let result = size
  if (unit === 'auto') {
    for (const u of ['GB', 'MB', 'KB', 'B']) {
      const v = size / map[u]
      if (v >= 1) {
        bestUnit = u
        result = v
        break
      }
    }
  } else {
    bestUnit = unit
    result = size / map[unit]
  }
  
  return `${result.toFixed(decimal)} ${bestUnit}`
}

const selectFiles = () => {
  // Clear queue only if switching from folder to files
  if (lastSelectionType.value === 'folder') {
    files.splice(0, files.length)
  }
  lastSelectionType.value = 'files'

  // Clear folder selector
  if (folderselector.value) folderselector.value.value = ''
  fileselector.value.click()
}

const folderselector = ref(null)

const selectFolder = () => {
  // Clear queue only if switching from files to folder
  if (lastSelectionType.value === 'files') {
    files.splice(0, files.length)
  }
  lastSelectionType.value = 'folder'

  // Clear file selector
  if (fileselector.value) fileselector.value.value = ''
  folderselector.value.click()
}

const handleFiles = e => {
  const selected = Array.from(e.target.files).map(file => {
    // Preserve folder structure from webkitdirectory
    if (file.webkitRelativePath) {
      file.relativePath = file.webkitRelativePath
    }
    
    return file
  })

  addFiles(selected)
  e.target.value = ''
}

const addFile = async e => {
  const items = e.dataTransfer.items
  const fileList = []

  // Handle folder structure via DataTransferItem API - auto-detect folders
  if (items) {
    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        if (entry) {
          await traverseFileTree(entry, '', fileList)
        }
      }
    }
  } else {
    // Fallback for browsers without DataTransferItem support or folder upload disabled
    fileList.push(...Array.from(e.dataTransfer.files))
  }

  addFiles(fileList)
}

// Recursively traverse folder structure
async function traverseFileTree(item, path, fileList) {
  if (item.isFile) {
    return new Promise(resolve => {
      item.file(file => {
        // Preserve folder path in file object
        file.relativePath = path + file.name
        fileList.push(file)
        resolve()
      })
    })
  } else if (item.isDirectory) {
    const dirReader = item.createReader()
    
    return new Promise(resolve => {
      dirReader.readEntries(async entries => {
        for (const entry of entries) {
          await traverseFileTree(entry, path + item.name + '/', fileList)
        }
        resolve()
      })
    })
  }
}

const addFiles = list => {
  for (const f of list) {
    // Compare by full path (relativePath) for folder uploads, or by name for single files
    const fileIdentifier = f.relativePath || f.webkitRelativePath || f.name
    const isDuplicate = files.some(file => {
      const existingIdentifier = file.file.relativePath || file.file.webkitRelativePath || file.file.name
      
      return existingIdentifier === fileIdentifier
    })

    console.log('🔍 Checking file:', f.name, '| Path:', fileIdentifier, '| Duplicate:', isDuplicate)

    if (isDuplicate) {
      showToast(t('core.fileUpload.alreadyInQueue', { fileName: f.name }), 'warning')
    } else {
      files.push({
        file: f,
        uploading: false,
        uploaded: false,
        progress: 0,
      })
    }
  }
}

const removeFile = target => {
  const index = files.findIndex(f => f.file.name === target.file.name)
  if (index !== -1) files.splice(index, 1)
}

// The folder a file lands in, relative to the folder the browser is showing.
const destinationFolder = file => {
  if (!file.relativePath) return ''

  const pathParts = file.relativePath.split('/')
  pathParts.pop()

  return pathParts.join('/')
}

// Base URL format: /ioutils/fileupload/volume/app/component/currentFolder.
// A subfolder replaces that last segment and travels as a query parameter,
// which the backend reads when the route parameter is absent.
const uploadUrlFor = folder => {
  if (!folder) return props.uploadFolder

  const urlParts = props.uploadFolder.split('/')
  const lastSegment = urlParts[urlParts.length - 1]
  let uploadUrl = props.uploadFolder
  let fullFolderPath = folder

  if (lastSegment && lastSegment !== 'volume') {
    fullFolderPath = `${decodeURIComponent(lastSegment)}/${folder}`
    urlParts.pop()
    uploadUrl = urlParts.join('/')
  }

  return `${uploadUrl}?folder=${encodeURIComponent(fullFolderPath)}`
}

const startUpload = async () => {
  const pending = files.filter(f => !f.uploaded && !f.uploading)
  const groups = new Map()

  pending.forEach(f => {
    const folder = destinationFolder(f.file)
    const group = groups.get(folder)

    if (group) group.push(f)
    else groups.set(folder, [f])
  })

  // The endpoint runs one upload operation per app at a time, so each
  // destination folder goes as its own request, one after the other.
  for (const [folder, group] of groups) {
    await uploadGroup(uploadUrlFor(folder), group)
  }
}

const uploadGroup = (uploadUrl, group) => new Promise(resolve => {
  const xhr = new XMLHttpRequest()
  const names = group.map(f => f.file.name)
  let landed = { cursor: 0, completed: 0, readable: true }

  const markLandedFiles = () => {
    if (!landed.readable) return

    landed = readCompletedUploads(xhr.responseText, names, landed)
    group.slice(0, landed.completed).forEach(f => {
      f.uploaded = true
      f.progress = 100
    })
  }

  const finish = (message, color) => {
    group.forEach(f => {
      f.uploading = false
    })
    showToast(message, color)
    resolve()
  }

  xhr.open('POST', uploadUrl, true)

  for (const [key, value] of Object.entries(props.headers)) {
    xhr.setRequestHeader(key, value)
  }

  xhr.upload.onprogress = e => {
    if (!e.lengthComputable) return

    const progress = (e.loaded / e.total) * 100

    group.forEach(f => {
      if (!f.uploaded) f.progress = progress
    })
  }

  xhr.onprogress = markLandedFiles

  xhr.onload = () => {
    markLandedFiles()

    // A refused upload answers 200 and reports the reason in the body.
    const failure = xhr.status >= 200 && xhr.status < 300
      ? findUploadFailure(xhr.responseText)
      : { message: `HTTP ${xhr.status}` }

    if (failure) {
      finish(t('core.fileUpload.uploadFailedWithReason', {
        message: failure.message || t('common.messages.errorOccurred'),
      }), 'error')

      return
    }

    group.forEach(f => {
      f.uploaded = true
      f.progress = 100
    })

    finish(group.length === 1
      ? t('core.fileUpload.uploadSuccess', { fileName: group[0].file.name })
      : t('core.fileUpload.uploadSuccessMultiple', { count: group.length }), 'success')

    setTimeout(() => {
      group.forEach(f => removeFile(f))
    }, 1500)
  }

  xhr.onerror = () => {
    finish(t('core.fileUpload.uploadFailedWithReason', {
      message: t('common.messages.connectionError'),
    }), 'error')
    group.forEach(f => removeFile(f))
  }

  const formData = new FormData()

  // The backend names each file after the field it arrives under.
  group.forEach(f => {
    formData.append(f.file.name, f.file)
  })

  group.forEach(f => {
    f.uploading = true
  })
  xhr.send(formData)
})
</script>

<style scoped>
.flux-share-upload-drop {
  height: 250px;
  border: 2px dashed var(--v-theme-primary);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.upload-footer {
  font-size: 0.75rem;
  color: #888;
}
.upload-column {
  max-height: 200px;
  overflow-y: auto;
}

/* Thin, theme-aware scrollbar */
.upload-column::-webkit-scrollbar {
  width: 6px;
}

.upload-column::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 3px;
}

.upload-column::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 3px;
  transition: background 0.2s;
}

.upload-column::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.3);
}

/* Firefox scrollbar */
.upload-column {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-on-surface), 0.2) rgba(var(--v-theme-on-surface), 0.05);
}

.folder-group {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.folder-group:last-child {
  border-bottom: none;
}

.folder-header {
  padding: 6px 12px;
  background: rgba(var(--v-theme-primary), 0.05);
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 0.8125rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.folder-header:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

.folder-name {
  font-weight: 500;
}

.file-count {
  opacity: 0.6;
  font-size: 0.75rem;
}

.upload-item {
  padding: 6px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.upload-item:last-child {
  border-bottom: none;
}

.file-in-folder {
  background: rgba(var(--v-theme-on-surface), 0.02);
  padding: 4px 12px;
}

.file-info {
  min-width: 0;
}

.file-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.8125rem;
  line-height: 1.3;
}

.file-size {
  opacity: 0.7;
  margin-top: 1px;
  font-size: 0.7rem;
}
</style>
