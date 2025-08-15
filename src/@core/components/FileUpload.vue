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

    <VCard
      class="flux-share-upload-drop"
      @click="selectFiles"
    >
      <VCardText class="text-center">
        <VIcon size="64">
          mdi-cloud-upload
        </VIcon>
        <p>Drop files here or <em>click to upload</em></p>
        <p class="upload-footer">
          (File size is limited to 5GB)
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
            {{ file.file.name }} ({{ addAndConvertFileSizes(file.file.size) }})
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
          Upload Files
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

const props = defineProps({
  uploadFolder: { type: String, required: true },
  headers: { type: Object, required: true },
})

// ✅ Make the array reactive
const files = reactive([])
const fileselector = ref(null)

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
  fileselector.value.click()
}

const handleFiles = e => {
  const selected = Array.from(e.target.files)

  addFiles(selected)
  e.target.value = ''
}

const addFile = e => {
  const dropped = Array.from(e.dataTransfer.files)

  addFiles(dropped)
}

const addFiles = list => {
  for (const f of list) {
    if (files.some(file => file.file.name === f.name)) {
      showToast(`'${f.name}' is already in the upload queue`, 'warning')
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

  xhr.open('POST', props.uploadFolder, true)

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
      showToast(`'${file.file.name}' has been uploaded`, 'success')
      setTimeout(() => {
        removeFile(file)
      }, 1500)
    } else {
      showToast(`Error uploading '${file.file.name}': status ${xhr.status}`, 'error')
    }
  }

  xhr.onerror = () => {
    file.uploading = false
    showToast(`Upload failed for '${file.file.name}'`, 'error')
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
  cursor: pointer;
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
