<template>
  <VCard elevation="1">
    <!-- Toolbar -->
    <VCardTitle class="d-flex align-center pa-3 bg-surface">
      <VIcon icon="mdi-folder-open" size="24" class="mr-2" />
      <span class="text-body-1 font-weight-medium">{{ t('pages.administration.fluxShare.fileManager') }}</span>
      <VSpacer />

      <!-- Action Buttons -->
      <VBtn
        variant="flat"
        color="primary"
        size="small"
        class="mr-2"
        @click="emit('uploadRequested')"
      >
        <VIcon icon="mdi-cloud-upload" class="mr-1" />
        {{ t('pages.administration.fluxShare.upload') }}
      </VBtn>

      <VBtn
        variant="flat"
        color="secondary"
        size="small"
        class="mr-2"
        @click="showCreateFolderDialog = true"
      >
        <VIcon icon="mdi-folder-plus" class="mr-1" />
        {{ t('pages.administration.fluxShare.newFolder') }}
      </VBtn>

      <VBtn
        icon
        variant="text"
        size="small"
        :loading="loading"
        @click="refresh"
      >
        <VIcon icon="mdi-refresh" />
      </VBtn>
    </VCardTitle>

    <!-- Breadcrumbs -->
    <div class="px-3 py-1">
      <VBreadcrumbs :items="breadcrumbItems" density="compact">
        <template #divider>
          <VIcon icon="mdi-chevron-right" size="small" />
        </template>
        <template #item="{ item }">
          <VBreadcrumbsItem
            :disabled="item.disabled"
            @click="!item.disabled && navigateToBreadcrumb(item.path)"
          >
            <span v-if="item.isHome" :class="{ 'text-primary cursor-pointer': !item.disabled }">
              <VIcon icon="mdi-home" size="20" />
            </span>
            <span v-else :class="{ 'text-primary cursor-pointer': !item.disabled }">
              {{ item.title }}
            </span>
          </VBreadcrumbsItem>
        </template>
      </VBreadcrumbs>
    </div>

    <VDivider />

    <!-- File List -->
    <VCardText class="pa-0">
      <!-- Loading State -->
      <div v-if="loading" class="d-flex justify-center align-center py-8">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredFiles.length === 0" class="text-center py-8">
        <VIcon icon="mdi-folder-open-outline" size="64" color="grey" />
        <p class="text-body-1 text-medium-emphasis mt-2">
          {{ t('pages.administration.fluxShare.emptyFolder') }}
        </p>
      </div>

      <!-- File Table -->
      <VTable v-else hover density="comfortable">
        <thead>
          <tr>
            <th class="text-left">
              {{ t('pages.administration.fluxShare.columns.name') }}
            </th>
            <th class="text-left">{{ t('pages.administration.fluxShare.columns.modified') }}</th>
            <th class="text-left">{{ t('pages.administration.fluxShare.columns.type') }}</th>
            <th class="text-left">{{ t('pages.administration.fluxShare.columns.size') }}</th>
            <th class="text-right" style="width: 200px;">{{ t('pages.administration.fluxShare.columns.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedFiles" :key="item.name">
            <!-- Name -->
            <td>
              <div class="d-flex align-center">
                <VIcon
                  :icon="item.isParent ? 'mdi-folder-upload' : item.isDirectory ? 'mdi-folder' : getFileIcon(item.name)"
                  color="grey"
                  class="mr-2"
                />
                <span
                  v-if="item.isParent"
                  class="text-primary cursor-pointer"
                  @click="navigateUp"
                >
                  {{ item.name }}
                </span>
                <span
                  v-else-if="item.isDirectory"
                  class="text-primary cursor-pointer"
                  @click="navigateToFolder(item.name)"
                >
                  {{ item.name }}
                </span>
                <span v-else>{{ item.name }}</span>
              </div>
            </td>

            <!-- Modified -->
            <td>
              <span v-if="!item.isParent" class="text-caption">
                {{ formatDate(item.modifiedAt) }}
              </span>
            </td>

            <!-- Type -->
            <td>
              <VChip
                v-if="!item.isParent"
                size="small"
                :color="item.isDirectory ? 'warning' : 'info'"
                variant="tonal"
              >
                {{ item.isDirectory ? t('pages.administration.fluxShare.folder') : t('pages.administration.fluxShare.file') }}
              </VChip>
            </td>

            <!-- Size -->
            <td>
              <span v-if="!item.isParent && item.size > 0" class="text-caption">
                {{ formatFileSize(item.size) }}
              </span>
              <span v-else-if="!item.isParent" class="text-caption text-medium-emphasis">-</span>
            </td>

            <!-- Actions -->
            <td class="text-right">
              <div v-if="!item.isParent" class="d-flex justify-end align-center ga-1">
                <!-- Download -->
                <VBtn
                  icon
                  variant="flat"
                  size="small"
                  color="grey"
                  :title="item.isDirectory ? t('pages.administration.fluxShare.downloadZip') : t('pages.administration.fluxShare.download')"
                  @click="confirmDownload(item)"
                >
                  <VIcon :icon="item.isDirectory ? 'mdi-folder-download' : 'mdi-download'" size="18" />
                </VBtn>

                <!-- Rename -->
                <VBtn
                  icon
                  variant="flat"
                  size="small"
                  color="grey"
                  :title="t('pages.administration.fluxShare.rename')"
                  @click="openRenameDialog(item)"
                >
                  <VIcon icon="mdi-pencil" size="18" />
                </VBtn>

                <!-- Share (files only) -->
                <VBtn
                  v-if="item.isFile"
                  icon
                  variant="flat"
                  size="small"
                  :color="item.shareToken ? 'primary' : 'grey'"
                  :title="item.shareToken ? t('pages.administration.fluxShare.unshare') : t('pages.administration.fluxShare.share')"
                  @click="toggleShare(item)"
                >
                  <VIcon icon="mdi-share-variant" size="18" />
                </VBtn>

                <!-- Share Link (if shared) -->
                <VBtn
                  v-if="item.shareToken"
                  icon
                  variant="flat"
                  size="small"
                  color="grey"
                  :title="t('pages.administration.fluxShare.copyLink')"
                  @click="copyShareLink(item)"
                >
                  <VIcon icon="mdi-link" size="18" />
                </VBtn>

                <!-- Delete -->
                <VBtn
                  icon
                  variant="flat"
                  size="small"
                  color="grey"
                  :title="t('pages.administration.fluxShare.delete')"
                  @click="confirmDelete(item)"
                >
                  <VIcon icon="mdi-delete" size="18" />
                </VBtn>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>

      <!-- Pagination Controls -->
      <div v-if="filteredFiles.length > itemsPerPage" class="d-flex align-center justify-space-between pa-3 border-t">
        <div class="d-flex align-center">
          <span class="text-body-2 text-medium-emphasis mr-2">{{ t('common.itemsPerPage') }}:</span>
          <VSelect
            v-model="itemsPerPage"
            :items="itemsPerPageOptions"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 80px;"
            @update:model-value="currentPage = 1"
          />
        </div>
        <div class="d-flex align-center">
          <span class="text-body-2 text-medium-emphasis mr-3">
            {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredFiles.length) }}
            {{ t('common.of') }} {{ filteredFiles.length }}
          </span>
          <VPagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="5"
            density="compact"
            size="small"
          />
        </div>
      </div>
    </VCardText>

    <!-- Create Folder Dialog -->
    <VDialog v-model="showCreateFolderDialog" max-width="400">
      <VCard>
        <VCardTitle class="px-4 py-2 bg-primary">
          <VIcon icon="mdi-folder-plus" class="mr-2" color="white" />
          <span class="text-white">{{ t('pages.administration.fluxShare.createFolder') }}</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <VTextField
            v-model="newFolderName"
            :label="t('pages.administration.fluxShare.folderName')"
            variant="outlined"
            density="comfortable"
            autofocus
            @keyup.enter="doCreateFolder"
          />
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="flat" color="grey" size="small" @click="showCreateFolderDialog = false">
            {{ t('common.buttons.cancel') }}
          </VBtn>
          <VBtn
            variant="flat"
            color="primary"
            size="small"
            :loading="loading"
            :disabled="!newFolderName.trim()"
            @click="doCreateFolder"
          >
            {{ t('common.buttons.confirm') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Rename Dialog -->
    <VDialog v-model="showRenameDialog" max-width="400">
      <VCard>
        <VCardTitle class="px-4 py-2 bg-primary">
          <VIcon icon="mdi-pencil" class="mr-2" color="white" />
          <span class="text-white">{{ t('pages.administration.fluxShare.renameItem') }}</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <VTextField
            v-model="renameNewName"
            :label="t('pages.administration.fluxShare.newName')"
            variant="outlined"
            density="comfortable"
            autofocus
            @keyup.enter="doRename"
          />
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="flat" color="grey" size="small" @click="showRenameDialog = false">
            {{ t('common.buttons.cancel') }}
          </VBtn>
          <VBtn
            variant="flat"
            color="primary"
            size="small"
            :loading="loading"
            :disabled="!renameNewName.trim()"
            @click="doRename"
          >
            {{ t('common.buttons.confirm') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog v-model="showDeleteDialog" max-width="400">
      <VCard>
        <VCardTitle class="px-4 py-2 bg-primary">
          <VIcon icon="mdi-delete" color="white" class="mr-2" />
          <span class="text-white">{{ t('pages.administration.fluxShare.confirmDelete') }}</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <p>
            {{ t('pages.administration.fluxShare.deleteConfirmMessage', { name: itemToDelete?.name || '' }) }}
          </p>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="flat" color="grey" size="small" @click="showDeleteDialog = false">
            {{ t('common.buttons.cancel') }}
          </VBtn>
          <VBtn
            variant="flat"
            color="error"
            size="small"
            :loading="loading"
            @click="doDelete"
          >
            {{ t('common.buttons.delete') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Download Confirmation Dialog -->
    <VDialog v-model="showDownloadDialog" max-width="400">
      <VCard>
        <VCardTitle class="px-4 py-2 bg-primary">
          <VIcon icon="mdi-download" class="mr-2" color="white" />
          <span class="text-white">{{ t('pages.administration.fluxShare.confirmDownload') }}</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <p>
            {{ itemToDownload?.isDirectory
              ? t('pages.administration.fluxShare.downloadFolderConfirm', { name: itemToDownload?.name || '' })
              : t('pages.administration.fluxShare.downloadFileConfirm', { name: itemToDownload?.name || '' })
            }}
          </p>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="flat" color="grey" size="small" @click="showDownloadDialog = false">
            {{ t('common.buttons.cancel') }}
          </VBtn>
          <VBtn
            variant="flat"
            color="primary"
            size="small"
            :loading="downloading"
            @click="doDownload"
          >
            {{ t('common.buttons.download') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFluxShare } from '@/composables/useFluxShare'

const props = defineProps({
  availableStorage: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['uploadRequested'])

// File icon map - defined at module level to avoid recreation on each call
const FILE_ICON_MAP = {
  pdf: 'mdi-file-pdf-box',
  doc: 'mdi-file-word',
  docx: 'mdi-file-word',
  xls: 'mdi-file-excel',
  xlsx: 'mdi-file-excel',
  ppt: 'mdi-file-powerpoint',
  pptx: 'mdi-file-powerpoint',
  txt: 'mdi-file-document',
  md: 'mdi-language-markdown',
  json: 'mdi-code-json',
  xml: 'mdi-file-xml-box',
  html: 'mdi-language-html5',
  css: 'mdi-language-css3',
  js: 'mdi-language-javascript',
  ts: 'mdi-language-typescript',
  py: 'mdi-language-python',
  java: 'mdi-language-java',
  c: 'mdi-language-c',
  cpp: 'mdi-language-cpp',
  go: 'mdi-language-go',
  rs: 'mdi-language-rust',
  php: 'mdi-language-php',
  rb: 'mdi-language-ruby',
  zip: 'mdi-folder-zip',
  rar: 'mdi-folder-zip',
  '7z': 'mdi-folder-zip',
  tar: 'mdi-folder-zip',
  gz: 'mdi-folder-zip',
  jpg: 'mdi-file-image',
  jpeg: 'mdi-file-image',
  png: 'mdi-file-image',
  gif: 'mdi-file-image',
  svg: 'mdi-file-image',
  webp: 'mdi-file-image',
  ico: 'mdi-file-image',
  mp3: 'mdi-file-music',
  wav: 'mdi-file-music',
  flac: 'mdi-file-music',
  ogg: 'mdi-file-music',
  mp4: 'mdi-file-video',
  mkv: 'mdi-file-video',
  avi: 'mdi-file-video',
  mov: 'mdi-file-video',
  webm: 'mdi-file-video',
}

const { t } = useI18n()

const {
  files,
  loading,
  currentFolder,
  breadcrumbs,
  loadFolder,
  navigateToFolder,
  navigateUp,
  createFolder,
  deleteFile,
  deleteFolder,
  rename,
  shareFile,
  unshareFile,
  downloadFile,
  copyToClipboard,
  createShareLink,
  formatFileSize,
  refresh,
} = useFluxShare()

// Local state
const showCreateFolderDialog = ref(false)
const newFolderName = ref('')
const showRenameDialog = ref(false)
const renameOldName = ref('')
const renameNewName = ref('')
const showDeleteDialog = ref(false)
const itemToDelete = ref(null)
const showDownloadDialog = ref(false)
const itemToDownload = ref(null)
const downloading = ref(false)

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(50)
const itemsPerPageOptions = [25, 50, 100]

// Filter out .gitkeep files
const filteredFiles = computed(() => {
  return files.value.filter(file => file.name !== '.gitkeep')
})

// Paginated files for rendering
const paginatedFiles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value

  // Add ".." entry at the beginning if in a subfolder
  const filesList = filteredFiles.value.slice(start, end)

  if (currentFolder.value && start === 0) {
    return [
      {
        name: '..',
        isDirectory: true,
        isParent: true,
        size: 0,
        modified: '',
      },
      ...filesList,
    ]
  }

  return filesList
})

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredFiles.value.length / itemsPerPage.value)
})

// Reset page when folder changes
watch(currentFolder, () => {
  currentPage.value = 1
})

// Convert breadcrumbs for VBreadcrumbs component
const breadcrumbItems = computed(() => {
  return breadcrumbs.value.map((crumb, index) => ({
    title: crumb.title,
    path: crumb.path,
    isHome: crumb.isHome || false,
    disabled: index === breadcrumbs.value.length - 1,
  }))
})

// Check if storage is full
const isStorageFull = computed(() => {
  return props.availableStorage <= 0
})

// Navigate to breadcrumb path
const navigateToBreadcrumb = path => {
  loadFolder(path)
}

// Get file icon based on extension
const getFileIcon = fileName => {
  const ext = fileName.split('.').pop()?.toLowerCase()

  return FILE_ICON_MAP[ext] || 'mdi-file'
}

// Format date
const formatDate = dateString => {
  if (!dateString) return '-'
  const date = new Date(dateString)

  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Create folder
const doCreateFolder = async () => {
  if (!newFolderName.value.trim()) return

  const success = await createFolder(newFolderName.value.trim())
  if (success) {
    showCreateFolderDialog.value = false
    newFolderName.value = ''
  }
}

// Open rename dialog
const openRenameDialog = item => {
  renameOldName.value = item.name
  renameNewName.value = item.name
  showRenameDialog.value = true
}

// Do rename
const doRename = async () => {
  if (!renameNewName.value.trim()) return

  const success = await rename(renameOldName.value, renameNewName.value.trim())
  if (success) {
    showRenameDialog.value = false
    renameOldName.value = ''
    renameNewName.value = ''
  }
}

// Toggle share status
const toggleShare = async item => {
  if (item.shareToken) {
    await unshareFile(item.name)
  } else {
    await shareFile(item.name)
  }
}

// Copy share link
const copyShareLink = item => {
  const link = createShareLink(item.shareFile || item.name, item.shareToken)
  copyToClipboard(link)
}

// Confirm delete
const confirmDelete = item => {
  itemToDelete.value = item
  showDeleteDialog.value = true
}

// Do delete
const doDelete = async () => {
  if (!itemToDelete.value) return

  let success
  if (itemToDelete.value.isDirectory) {
    success = await deleteFolder(itemToDelete.value.name)
  } else {
    success = await deleteFile(itemToDelete.value.name)
  }

  if (success) {
    showDeleteDialog.value = false
    itemToDelete.value = null
  }
}

// Confirm download
const confirmDownload = item => {
  itemToDownload.value = item
  showDownloadDialog.value = true
}

// Do download
const doDownload = async () => {
  if (!itemToDownload.value) return

  downloading.value = true
  await downloadFile(
    itemToDownload.value.name,
    itemToDownload.value.isDirectory,
    itemToDownload.value.size,
  )
  downloading.value = false
  showDownloadDialog.value = false
  itemToDownload.value = null
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  text-decoration: underline;
}
</style>
