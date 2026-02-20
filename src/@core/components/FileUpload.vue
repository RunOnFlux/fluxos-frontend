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

    <VCard
      class="flux-share-upload-drop"
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

    <VRow
      class="upload-column mt-4"
      no-gutters
    >
      <VCol
        v-for="file in files"
        :key="file.file.name"
        cols="12"
        class="upload-item"
      >
        <div class="d-flex align-center justify-space-between">
          <div class="file-name text-truncate">
            {{ file.file.relativePath || file.file.name }} ({{ addAndConvertFileSizes(file.file.size) }})
          </div>
          <VIcon
            v-if="file.progress === 0"
            class="cursor-pointer"
            color="error"
            @click.stop="removeFile(file)"
          >
            mdi-trash-can-outline
          </VIcon>
        </div>
        <VProgressLinear
          v-if="file.uploading || file.uploaded"
          :model-value="file.progress"
          height="6"
          color="success"
        />
      </VCol>
    </VRow>

    <VRow class="mt-3">
      <VCol class="text-center">
        <VBtn
          color="primary"
          :disabled="!filesToUpload"
          @click="startUpload"
        >
          {{ t('core.fileUpload.uploadFiles') }}
        </VBtn>
      </VCol>
    </VRow>

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

const props = defineProps({
  uploadFolder: { type: String, required: true },
  headers: { type: Object, required: true },
})

const { t } = useI18n()

// ✅ Make the array reactive
const files = reactive([])
const fileselector = ref(null)
const lastSelectionType = ref(null) // Track: 'files' or 'folder'

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
    if (files.some(file => file.file.name === f.name)) {
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

const startUpload = () => {
  files.forEach(f => {
    if (!f.uploaded && !f.uploading) upload(f)
  })
}

const upload = file => {
  const xhr = new XMLHttpRequest()

  // Build upload URL with path parameter - auto-detect if file has folder structure
  let uploadUrl = props.uploadFolder
  if (file.file.relativePath) {
    // Extract directory path from relativePath (remove filename)
    const pathParts = file.file.relativePath.split('/')
    pathParts.pop() // Remove filename
    const dirPath = pathParts.join('/')

    console.log('🔍 Folder upload debug:', {
      relativePath: file.file.relativePath,
      pathParts,
      dirPath,
      baseUrl: props.uploadFolder,
    })

    // Extract current folder from base URL and combine with new folder path
    // Base URL format: /ioutils/fileupload/volume/app/component/currentFolder
    // We need to strip the last path segment (currentFolder) and pass full path via query param
    if (dirPath) {
      const urlParts = props.uploadFolder.split('/')
      const lastSegment = urlParts[urlParts.length - 1]

      // Check if URL ends with current folder path (encoded)
      // If so, combine it with the new subfolder path
      let fullFolderPath = dirPath
      if (lastSegment && lastSegment !== 'volume') {
        // Current folder exists in URL, need to prepend it
        fullFolderPath = decodeURIComponent(lastSegment) + '/' + dirPath
        // Remove the last segment from base URL
        urlParts.pop()
        uploadUrl = urlParts.join('/')
      }

      // Add folder as query parameter (backend checks req.query.folder after req.params.folder)
      uploadUrl = `${uploadUrl}?folder=${encodeURIComponent(fullFolderPath)}`
    }
  }

  console.log('📤 Upload URL:', uploadUrl)

  xhr.open('POST', uploadUrl, true)

  for (const [key, value] of Object.entries(props.headers)) {
    xhr.setRequestHeader(key, value)
  }

  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      file.progress = (e.loaded / e.total) * 100
    }
  }

  xhr.onload = () => {
    file.uploading = false
    if (xhr.status >= 200 && xhr.status < 300) {
      file.uploaded = true
      file.progress = 100
      showToast(t('core.fileUpload.uploadSuccess', { fileName: file.file.name }), 'success')
      setTimeout(() => {
        removeFile(file)
      }, 1500)
    } else {
      showToast(t('core.fileUpload.uploadError', { fileName: file.file.name, status: xhr.status }), 'error')
    }
  }

  xhr.onerror = () => {
    file.uploading = false
    showToast(t('core.fileUpload.uploadFailed', { fileName: file.file.name }), 'error')
    removeFile(file)
  }

  const formData = new FormData()

  formData.append(file.file.name, file.file)

  file.uploading = true
  xhr.send(formData)
}
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
  max-height: 250px;
  overflow-y: auto;
}
.upload-item {
  padding: 8px;
}
.file-name {
  max-width: 90%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
