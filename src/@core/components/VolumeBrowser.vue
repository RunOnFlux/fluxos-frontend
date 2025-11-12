<template>
  <div>
    <VRow class="align-center justify-space-between mb-1 mt-1">
      <VCol cols="12">
        <div class="d-flex  align-center justify-space-between">
          <div class="d-flex align-center border-frame w-100">
            <!-- Left: Icon + Title -->
            <div class="d-flex align-center mr-4">
              <VAvatar
                size="35"
                color="success"
                variant="tonal"
                rounded="sm"
                class="mr-2 ml-1"
              >
                <VIcon size="26">
                  mdi-server
                </VIcon>
              </VAvatar>
              <span class="text-h5">{{ t('core.volumeBrowser.title') }}</span>
            </div>
          </div>
          <!-- Right: Progress Bar with max width -->
          <div v-if="selectedAppVolume || !appSpecification?.compose">
            <div class="progress-wrapper">
              <VProgressCircular
                :model-value="usagePercentage"
                :color="getUsageColor(usagePercentage)"
                :size="60"
                :width="7"
                class="progress-glow"
              >
                <span class="progress-text">
                  {{ usagePercentage.toFixed(1) }}%
                </span>
              </VProgressCircular>
            </div>
          </div>
        </div>
      </VCol>
    </VRow>

  
    <VSelect
      v-if="appSpecification?.compose"
      v-model="selectedAppVolume"
      :items="appSpecification.compose.map(c => c.name)"
      :disabled="isComposeSingle"
      :label="t('core.volumeBrowser.selectComponent')"
      class="mb-4"
      style="max-width: 280px;"
      @update:model-value="refreshFolderSwitch"
    />
  
    <div
      v-if="fileProgressVolume.length > 0"
      class="my-4 px-4 py-3"
      style="border: 1px solid #eaeaea; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); text-align: center;"
    >
      <h5 class="mb-3 text-subtitle-1">
        <span v-if="!allDownloadsCompletedVolume()">
          <VProgressCircular
            indeterminate
            size="20"
            class="mr-2"
            color="success"
          /> {{ t('core.volumeBrowser.downloading') }}
        </span>
        <span v-else>
          {{ t('core.volumeBrowser.downloadCompleted') }}
        </span>
      </h5>
  
      <VProgressLinear
        v-for="(item, index) in computedFileProgressVolume"
        :key="index"
        :model-value="typeof item.progress === 'number' ? item.progress : 0"
        height="16"
        class="mb-2"
        color="success"
      >
        <strong class="text-white text-caption">
          {{ item.fileName }} -
          {{ typeof item.progress === 'number' ? item.progress.toFixed(2) + '%' : item.progress }}
        </strong>
      </VProgressLinear>
    </div>
  
    <VRow
      v-if="selectedAppVolume || !appSpecification?.compose"
      class="mb-4"
    >
      <VCol
        cols="12"
        class="d-flex align-center"
      >
        <VTextField
          v-model="inputPathValue"
          :label="t('core.volumeBrowser.path')"
          prepend-inner-icon="mdi-home"
          dense
          class="flex-grow-1 mr-2"
          disabled
        />
        <VBtn
          icon
          class="mr-1"
          @click="refreshFolder"
        >
          <VIcon>mdi-redo</VIcon>
        </VBtn>
        <VBtn
          icon
          class="mr-1"
          @click="uploadFilesDialog = true"
        >
          <VIcon>mdi-cloud-upload</VIcon>
        </VBtn>
        <VBtn
          icon
          @click="createDirectoryDialogVisible = true"
        >
          <VIcon>mdi-folder-plus</VIcon>
        </VBtn>
      </VCol>
    </VRow>
  

    <VSheet
      v-if="selectedAppVolume || props.isComposeSingle"
      border
      rounded
      class="mt-4"
      style="max-height: 400px;"
    >
      <VDataTable
        v-if="selectedAppVolume || props.isComposeSingle"
        :items="folderContentFilter"
        :headers="fields"
        fixed-header
        :loading="loadingFolder"
        :no-data-text="t('core.volumeBrowser.files.emptyDirectory')"
        item-value="name"
        class="elevation-1 no-wrap-table"
        density="compact"
        :sort-by="[{ key: 'name', order: 'asc' }]"
        :items-per-page="-1"
        hide-default-footer
        style="min-height: 80px; max-height: 380px"
      >
        <!-- name column -->
        <template #item.name="{ item }">
          <span class="no-wrap">
            <VIcon
              v-if="item.isUpButton"
              class="mr-1"
            >
              mdi-folder-arrow-up
            </VIcon>
            <VIcon
              v-if="item.symLink"
              class="mr-1"
            >
              mdi-folder-symlink
            </VIcon>
            <VIcon
              v-if="item.isDirectory"
              class="mr-1"
            >
              mdi-folder
            </VIcon>
            <VIcon
              v-if="item.isFile"
              class="mr-1"
            >
              mdi-file
            </VIcon>
            <span
              v-if="item.isDirectory || item.isUpButton"
              class="cursor-pointer text-primary"
              @click="changeFolder(item.name)"
            >
              {{ item.name }}
            </span>
            <span v-else>{{ item.name }}</span>
          </span>
        </template>

        <!-- modifiedAt column -->
        <template #item.modifiedAt="{ item }">
          <span
            v-if="!item.isUpButton"
            class="hide-on-sm"
            style="font-size: 14px; white-space: nowrap;"
          >
            {{ new Date(item.modifiedAt).toLocaleString('en-GB', timeoptions) }}
          </span>
        </template>

        <!-- type column -->

        <!--
          <template #item.type="{ item }">
          <span v-if="!item.isUpButton">
          {{ item.isDirectory ? 'Folder' : item.isFile ? 'File' : item.isSymbolicLink ? 'File (Symbolic Link)' : 'Other' }}
          </span>
          </template> 
        -->

        <!-- size column -->
        <template #item.size="{ item }">
          <span
            v-if="item.size > 0"
            style="font-size: 14px; white-space: nowrap;"
          >{{ addAndConvertFileSizes(item.size) }}</span>
        </template>

        <!-- actions column -->
        <template #item.actions="{ item }">
          <div 
            v-if="!item.isUpButton" 
            class="d-flex justify-end"
          >
            <VBtnGroup density="compact" variant="flat" rounded="0">
              <!-- Download -->
              <VTooltip :text="item.isDirectory ? t('core.volumeBrowser.downloadFolderAsArchive') : t('core.volumeBrowser.downloadFile')" location="top">
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon
                    size="small"
                    rounded="0"
                    density="comfortable"
                    class="mr-1"
                    @click="download(item.name, item.isDirectory)"
                  >
                    <VIcon>{{ item.isDirectory ? 'mdi-archive-arrow-down' : 'mdi-download' }}</VIcon>
                  </VBtn>
                </template>
              </VTooltip>

              <!-- Rename -->
              <VTooltip :text="t('core.volumeBrowser.rename')" location="top">
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon
                    size="small"
                    rounded="0"
                    density="comfortable"
                    class="mr-1"
                    @click="rename(item.name)"
                  >
                    <VIcon>mdi-pencil</VIcon>
                  </VBtn>
                </template>
              </VTooltip>

              <!-- Edit -->
              <VTooltip :text="t('core.volumeBrowser.edit')" location="top" v-if="item.isFile">
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon
                    size="small"
                    rounded="0"
                    density="comfortable"
                    class="mr-1"
                    @click="openEditDialog(item.name, item.size)"
                  >
                    <VIcon>mdi-file-edit</VIcon>
                  </VBtn>
                </template>
              </VTooltip>

              <!-- Delete -->
              <VTooltip :text="t('core.volumeBrowser.delete')" location="top">
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon
                    size="small"
                    rounded="0"
                    density="comfortable"
                    class="mr-1"
                    @click="deleteFile(item.name)"
                  >
                    <VIcon>mdi-trash-can-outline</VIcon>
                  </VBtn>
                </template>
              </VTooltip>
            </VBtnGroup>
          </div>
        </template>
      </VDataTable>
    </VSheet>

    <VDialog
      v-model="progressVisable"
      persistent
      width="500"
    >
      <VCard>
        <VCardTitle class="bg-primary text-h6 justify-center">
          {{ operationTitle }}
        </VCardTitle>

        <VCardText
          class="d-flex flex-column align-center justify-center"
          style="min-height: 100px;"
        >
          <div class="align-center">
            {{ optionalInfoMessage }}
        
            <VProgressLinear
              indeterminate
              class="mt-2"
            />
          </div>
        </VCardText>
      </VCard>
    </VDialog>

  
    <VDialog
      v-model="createDirectoryDialogVisible"
      max-width="500px"
    >
      <VCard>
        <VCardTitle>{{ t('core.volumeBrowser.createFolder') }}</VCardTitle>
        <VCardText>
          <VTextField
            v-model="newDirName"
            :label="t('core.volumeBrowser.folderName')"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="primary"
            @click="createFolder(newDirName)"
          >
            {{ t('core.volumeBrowser.create') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  
    <VDialog
      v-model="uploadFilesDialog"
      max-width="700px"
    >
      <VCard>
        <VCardTitle class="bg-primary text-white">
          {{ t('core.volumeBrowser.uploadFiles') }}
        </VCardTitle>
        <VCardText>
          <FileUpload
            :upload-folder="getUploadFolder()"
            :headers="zelidHeader()"
          />
        </VCardText>
        <VCardActions>
          <VBtn
            color="error"
            size="small"
            variant="flat"
            text
            @click="refreshFolder(); uploadFilesDialog = false"
          >
            {{ t('core.volumeBrowser.close') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  
    <VDialog
      v-model="renameDialogVisible"
      max-width="500px"
    >
      <VCard>
        <VCardTitle>{{ t('core.volumeBrowser.rename') }}</VCardTitle>
        <VCardText>
          <VTextField
            v-model="newName"
            :label="t('core.volumeBrowser.newName')"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="primary"
            @click="confirmRename"
          >
            {{ t('core.volumeBrowser.rename') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  
    <VDialog
      v-if="editDialogVisible"
      v-model="editDialogVisible"
      max-width="80vw"
    >
      <VCard>
        <VCardTitle class="bg-primary text-white d-flex align-center justify-space-between">
          <span class="text-truncate">{{ t('core.volumeBrowser.editing', { file: currentEditFile }) }}</span>
          <VSelect
            v-model="editorLanguage"
            :items="supportedLanguages"
            dense
            hide-details
            style="max-width: 150px;"
            @update:model-value="updateEditorLanguage"
          />
        </VCardTitle>
        <VCardText class="pa-4">
          <div class="editor-container">
            <div
              v-if="!editorMountReady"
              class="d-flex align-center justify-center"
              style="height: 100%;"
            >
              <VProgressCircular
                indeterminate
                color="primary"
                size="48"
              />
            </div>
            <VueMonacoEditor
              v-if="editorMountReady"
              ref="monacoEditor"
              :value="editContent"
              :theme="theme === 'dark' ? 'vs-dark' : 'vs'"
              :language="editorLanguage"
              :options="editorOptions"
              @mount="handleMount"
            />
          </div>
        </VCardText>
        <VCardActions>
          <VBtn
            color="error"
            variant="flat"
            @click="closeEditor"
          >
            {{ t('core.volumeBrowser.close') }}
          </VBtn>
          <VBtn
            class="mr-2"
            color="primary"
            variant="flat"
            :disabled="!hasChanged || saving"
            @click="saveContent"
          >
            <template v-if="saving">
              <VProgressCircular
                indeterminate
                size="18"
                class="mr-2"
              />
              {{ t('core.volumeBrowser.saving') }}
            </template>
            <template v-else>
              {{ t('core.volumeBrowser.save') }}
            </template>
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>

  <VSnackbar
    v-model="snackbar"
    :color="snackbarColor"
    timeout="4000"
    location="top"
    elevation="4"
  >
    <template #default>
      <div class="d-flex align-center">
        <VIcon class="mr-1">
          {{ snackbarIcon }}
        </VIcon>
        <span>{{ snackbarMessage }}</span>
      </div>
    </template>
  </VSnackbar>
</template>

<script setup>
import hljs from 'highlight.js'
import { loader, VueMonacoEditor } from '@guolao/vue-monaco-editor'
import { storeToRefs } from "pinia"
import { useConfigStore } from "@core/stores/config"
import { useI18n } from "vue-i18n"
import { useDisplay } from 'vuetify'

const props = defineProps({
  appSpec: {
    type: Object,
    required: true,
  },
  isComposeSingle: {
    type: Boolean,
    required: true,
  },
  executeLocalCommand: {
    type: Function,
    required: true,
  },
  ipAccess: {
    type: Boolean,
    required: true,
  },
  selectedIp: {
    type: String,
    required: true,
  },

})

const { smAndDown } = useDisplay()
const configStore = useConfigStore()
const { theme } = storeToRefs(configStore)
const snackbarColor = ref("success")
const snackbar = ref(false)
const snackbarIcon = ref('')
const snackbarMessage = ref("")
const monacoReady = ref(false)
const loadingFolder = ref(false)
const folderView = ref([])
const currentFolder = ref('')
const uploadFilesDialog = ref(false)
const filterFolder = ref('')
const createDirectoryDialogVisible = ref(false)
const renameDialogVisible = ref(false)
const newName = ref('')
const fileRenaming = ref('')
const newDirName = ref('')
const editContent = ref('')
const selectedAppVolume = ref(null)
const inputPathValue = ref('')
const fileProgressVolume = ref([])
const volumeInfo = ref(null)
const volumePath = ref('')
const storage = reactive({ used: 0, total: 1 }) // avoid divide-by-zero
const currentEditFile = ref('')
const operationTitle = ref('')
const optionalInfoMessage = ref('')
const progressVisable = ref(false)
const saving = ref(false)
const hasChanged = ref(false)
const contentLoaded = ref(false)
const restoreRemoteFile = ref('')
const monacoEditor = ref(null)
const editDialogVisible = ref(false)
const editorMountReady = ref(false)
const editorInstance = shallowRef(null)
const editorModel = shallowRef(null)
const { t } = useI18n()

const fields = computed(() => {
  const base = [
    { title: t('core.volumeBrowser.name'), key: 'name', sortable: false },
    { title: t('core.volumeBrowser.size'), key: 'size', sortable: false },
    { title: '', key: 'actions', sortable: false },
  ]

  if (!smAndDown.value) {
    base.splice(2, 0, {
      title: t('core.volumeBrowser.modifiedAt'),
      key: 'modifiedAt',
      sortable: false,
    })
  }

  return base
})

const folderContentFilter = computed(() => {
  const filteredFolder = folderView.value.filter(item =>
    item.name.toLowerCase().includes(filterFolder.value.toLowerCase()),
  )

  const upButton = currentFolder.value
    ? {
      name: '..',
      symLink: false,
      isDirectory: false,
      isUpButton: true,
    }
    : null

  return [
    upButton,
    ...filteredFolder.filter(item => item.name !== '.gitkeep'),
  ].filter(Boolean)
})

const appSpecification = computed(() => props.appSpec)

const usagePercentage = computed(() => {
  return (storage.used / storage.total) * 100
})

watch(
  () => props.appSpec?.compose,
  newCompose => {
    if (newCompose && newCompose.length === 1) {
      selectedAppVolume.value = newCompose[0].name
    }
  },
  { immediate: true },
)

const updateEditorLanguage = () => {
  if (monacoEditor.value?.editor) {
    monacoEditor.value.editor.updateOptions({ language: editorLanguage.value })
  }
}

const supportedLanguages = ref([
  'abap',
  'apex',
  'azcli',
  'bat',
  'c',
  'cameligo',
  'clojure',
  'coffeescript',
  'cpp',
  'csharp',
  'csp',
  'css',
  'dart',
  'dockerfile',
  'ecl',
  'fsharp',
  'flow',
  'git-commit',
  'git-rebase',
  'go',
  'graphql',
  'handlebars',
  'hcl',
  'html',
  'ini',
  'java',
  'javascript',
  'javascriptreact',
  'json',
  'jsonc',
  'less',
  'lexon',
  'lua',
  'markdown',
  'mips',
  'mysql',
  'objective-c',
  'pascal',
  'perl',
  'pgsql',
  'php',
  'plaintext',
  'pom',
  'powershell',
  'pug',
  'python',
  'r',
  'razor',
  'ruby',
  'rust',
  'sb',
  'scss',
  'shell',
  'sol',
  'sql',
  'swift',
  'typescript',
  'typescriptreact',
  'vb',
  'xml',
  'yaml',
])

const timeoptions = ref({
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const extensionMapping = ref({
  abap: 'abap',
  cls: 'apex',
  azcli: 'azcli',
  bat: 'bat',
  c: 'c',
  mligo: 'cameligo',
  clj: 'clojure',
  coffee: 'coffeescript',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  cs: 'csharp',
  csp: 'csp',
  css: 'css',
  dart: 'dart',
  dockerfile: 'dockerfile',
  ecl: 'ecl',
  fs: 'fsharp',
  fsi: 'fsharp',
  flow: 'flow',
  go: 'go',
  graphql: 'graphql',
  gql: 'graphql',
  hbs: 'handlebars',
  hcl: 'hcl',
  html: 'html',
  htm: 'html',
  ini: 'ini',
  conf: 'ini',
  java: 'java',
  js: 'javascript',
  jsx: 'javascriptreact',
  json: 'json',
  jsonc: 'jsonc',
  less: 'less',
  lexon: 'lexon',
  lua: 'lua',
  md: 'markdown',
  markdown: 'markdown',
  mips: 'mips',
  mysql: 'mysql',
  m: 'objective-c',
  mm: 'objective-c',
  pas: 'pascal',
  pp: 'pascal',
  pl: 'perl',
  pm: 'perl',
  pgsql: 'pgsql',
  php: 'php',
  txt: 'plaintext',
  'pom.xml': 'pom',
  ps1: 'powershell',
  pug: 'pug',
  py: 'python',
  r: 'r',
  cshtml: 'razor',
  razor: 'razor',
  rb: 'ruby',
  rs: 'rust',
  sb: 'sb',
  scss: 'scss',
  sh: 'shell',
  bash: 'shell',
  sol: 'sol',
  sql: 'sql',
  swift: 'swift',
  ts: 'typescript',
  tsx: 'typescriptreact',
  vb: 'vb',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
})

const editorLanguage = ref('plaintext')

const editorOptions = ref({
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 14,
  fontWeight: 'normal',
  letterSpacing: 0,
  lineHeight: 19,
  wordWrap: 'off',
  wordWrapColumn: 0,
  wrappingStrategy: 'simple',
  stopRenderingLineAfter: -1,
  scrollBeyondLastColumn: 50,
  scrollBeyondLastLine: true,
  smoothScrolling: false,
  disableMonospaceOptimizations: true, // Critical: disable optimizations that can cause measurement issues
  scrollbar: {
    horizontal: 'visible',
    vertical: 'visible',
    horizontalScrollbarSize: 10,
    verticalScrollbarSize: 10,
    useShadows: false,
    handleMouseWheel: true,
  },
  minimap: {
    enabled: false,
  },
  renderWhitespace: 'none',
  renderControlCharacters: false,
  fontLigatures: false,
})

function showToast(type, message, icon = null) {
  snackbarMessage.value = message
  snackbarColor.value = type === 'danger' ? 'error' : type

  // Use custom icon if provided, else fallback to defaults
  snackbarIcon.value = icon || {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
    danger: 'mdi-alert-circle',
  }[type] || 'mdi-information'

  snackbar.value = true
}

function getHddByName(applications, appName) {
  if (applications?.compose) {
    const app = applications.compose.find(application => application.name === appName)
      
    return app.hdd
  } else {
    return applications.hdd
  }
}

async function loadFolder(path, soft = false) {
  try {
    filterFolder.value = ''
    if (!soft) {
      folderView.value = []
    }
    loadingFolder.value = true


    const response = await props.executeLocalCommand(
      `/apps/getfolderinfo/${props.appSpec.name}/${selectedAppVolume.value}/${encodeURIComponent(path)}`,
    )

    loadingFolder.value = false

    if (response.data.status === 'success') {
      folderView.value = response.data.data
      console.log(folderView.value)
    } else {
      showToast('danger', response.data.data.message || response.data.data)
    }
  } catch (error) {
    loadingFolder.value = false
    console.log(error.message)
    showToast('danger', error.message || error)
  }
}

async function storageStats() {
  try {
    volumeInfo.value = await props.executeLocalCommand(
      `/backup/getvolumedataofcomponent/${props.appSpec.name}/${selectedAppVolume.value}/B/2/used,size`,
    )
    volumePath.value = volumeInfo.value?.data?.data

    if (volumeInfo.value?.data?.status === 'success') {
      storage.total = getHddByName(appSpecification.value, selectedAppVolume.value) * 1024 * 1024 * 1024
      storage.used = volumeInfo.value.data.data.used
    } else {
      showToast('danger', volumeInfo.value.data.data.message || volumeInfo.value.data.data)
    }
  } catch (error) {
    showToast('danger', error.message || error)
  }
}

function refreshFolderSwitch() {
  currentFolder.value = ''

  const segments = currentFolder.value.split('/').filter(segment => segment !== '')
  const transformedPath = segments.map(segment => `${segment}`).join('/')

  inputPathValue.value = `/${transformedPath}`
  loadFolder(currentFolder.value, true)
  storageStats()
}

function blobToText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(blob, 'utf-8')
  })
}

function refreshFolder() {
  const segments = currentFolder.value.split('/').filter(segment => segment !== '')
  const transformedPath = segments.map(segment => `${segment}`).join('/')

  inputPathValue.value = `/${transformedPath}`
  loadFolder(currentFolder.value, true)
  storageStats()
}

function changeFolder(name) {
  if (name === '..') {
    const folderArray = currentFolder.value.split('/')

    folderArray.pop()
    currentFolder.value = folderArray.join('/')
  } else if (currentFolder.value === '') {
    currentFolder.value = name
  } else {
    currentFolder.value = `${currentFolder.value}/${name}`
  }
  const segments = currentFolder.value.split('/').filter(segment => segment !== '')
  const transformedPath = segments.map(segment => `${segment}`).join('/')

  inputPathValue.value = `/${transformedPath}`
  loadFolder(currentFolder.value)
}

function getUsageColor(percentage) {
  if (percentage < 50) return 'success'
  if (percentage < 75) return 'warning'
  
  return 'error'
}

async function createFolder(path) {
  createDirectoryDialogVisible.value = false
  try {
    let folderPath = path
    if (currentFolder.value !== '') {
      folderPath = `${currentFolder.value}/${path}`
    }

    const response = await props.executeLocalCommand(
      `/apps/createfolder/${props.appSpec.name}/${selectedAppVolume.value}/${encodeURIComponent(folderPath)}`,
    )

    if (response.data.status === 'error') {
      if (response.data.data.code === 'EEXIST') {
        showToast('danger', t('core.volumeBrowser.folderAlreadyExists', { folder: path }))
      } else {
        showToast('danger', response.data.data.message || response.data.data)
      }
    } else {
      showToast('success', t('core.volumeBrowser.folderCreated', { folder: path }))
      await loadFolder(currentFolder.value, true)
    }
  } catch (error) {
    loadingFolder.value = false
    console.error(error.message)
    showToast('danger', error.message || error)
  }

  newDirName.value = ''
}

watchEffect(() => {
  if (props.isComposeSingle) {
    refreshFolder()
  }
})

const computedFileProgressVolume = computed(() => fileProgressVolume.value)

function allDownloadsCompletedVolume() {
  const allComplete = computedFileProgressVolume.value.every(item => item.progress === 100)
  if (allComplete) {
    setTimeout(() => {
      fileProgressVolume.value = fileProgressVolume.value.filter(item => item.progress !== 100.00)
    }, 5000)
  }

  return allComplete
}

function addAndConvertFileSizes(sizes, targetUnit = 'auto', decimal = 2) {
  const multiplierMap = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  }

  const getSizeWithMultiplier = (size, multiplier) => size / multiplierMap[multiplier.toUpperCase()]

  const formatResult = (result, unit) => {
    const formattedResult = unit === 'B' ? result.toFixed(0) : result.toFixed(decimal)
    
    return `${formattedResult} ${unit}`
  }

  let totalSizeInBytes
  if (Array.isArray(sizes) && sizes.length > 0) {
    totalSizeInBytes = +sizes.reduce((total, fileInfo) => total + (fileInfo.file_size || 0), 0)
  } else if (typeof +sizes === 'number') {
    totalSizeInBytes = +sizes
  } else {
    console.error('Invalid sizes parameter')
    
    return 'N/A'
  }

  if (isNaN(totalSizeInBytes)) {
    console.error('Total size is not a valid number')
    
    return 'N/A'
  }

  if (targetUnit === 'auto') {
    let bestMatchUnit
    let bestMatchResult = totalSizeInBytes
    Object.keys(multiplierMap).forEach(unit => {
      const result = getSizeWithMultiplier(totalSizeInBytes, unit)
      if (result >= 1 && (bestMatchResult === undefined || result < bestMatchResult)) {
        bestMatchResult = result
        bestMatchUnit = unit
      }
    })
    bestMatchUnit = bestMatchUnit || 'B'
    
    return formatResult(bestMatchResult, bestMatchUnit)
  } else {
    const result = getSizeWithMultiplier(totalSizeInBytes, targetUnit)
    
    return formatResult(result, targetUnit)
  }
}

function rename(name) {
  renameDialogVisible.value = true
  let folderPath = name
  if (currentFolder.value !== '') {
    folderPath = `${currentFolder.value}/${name}`
  }
  fileRenaming.value = folderPath
  newName.value = name
}

async function confirmRename() {
  renameDialogVisible.value = false
  try {
    const oldpath = fileRenaming.value
    const newname = newName.value

    const response = await props.executeLocalCommand(
      `/apps/renameobject/${props.appSpec.name}/${selectedAppVolume.value}/${encodeURIComponent(oldpath)}/${newname}`,
    )

    console.log(response)
    if (response.data.status === 'error') {
      showToast('danger', response.data.data.message || response.data.data)
    } else {
      if (oldpath.includes('/')) {
        showToast('success', t('core.volumeBrowser.renamedSuccess', { oldName: oldpath.split('/').pop(), newName: newname }))
      } else {
        showToast('success', t('core.volumeBrowser.renamedSuccess', { oldName: oldpath, newName: newname }))
      }
      loadFolder(currentFolder.value, true)
    }
  } catch (error) {
    showToast('danger', error.message || error)
  }
}

async function deleteFile(name) {
  try {
    const folder = currentFolder.value
    const fileName = folder ? `${folder}/${name}` : name

    const response = await props.executeLocalCommand(
      `/apps/removeobject/${props.appSpec.name}/${selectedAppVolume.value}/${encodeURIComponent(fileName)}`,
    )

    if (response.data.status === 'error') {
      showToast('danger', response.data.data.message || response.data.data)
    } else {
      loadFolder(currentFolder.value, true)
      showToast('success', t('core.volumeBrowser.deleted', { name }))
    }
  } catch (error) {
    showToast('danger', error.message || error)
  }
}

function updateFileProgressVolume(currentFileName, currentFileProgress) {
  const currentIndex = fileProgressVolume.value.findIndex(entry => entry.fileName === currentFileName)

  if (currentIndex !== -1) {
    // Replace the object while preserving reactivity
    fileProgressVolume.value[currentIndex] = {
      fileName: currentFileName,
      progress: currentFileProgress,
    }
  } else {
    fileProgressVolume.value.push({
      fileName: currentFileName,
      progress: currentFileProgress,
    })
  }
}

async function download(name, isFolder = false, silent = false) {
  try {
    const folder = currentFolder.value
    const fileName = folder ? `${folder}/${name}` : name

    const axiosConfig = {
      headers: zelidHeader(),
      responseType: 'blob',
      onDownloadProgress(progressEvent) {
        if (silent) return
        const { loaded, total, lengthComputable } = progressEvent

        const displayName = isFolder ? `${name}.zip` : name
        if (lengthComputable) {
          const progress = (loaded / total) * 100

          updateFileProgressVolume(displayName, progress)
        } else {
          console.log('Total file size is unknown. Cannot compute progress percentage.')
          updateFileProgressVolume(displayName, 'Downloading...')
        }
      },
    }

    if (!silent && isFolder) {
      showToast('info', t('core.volumeBrowser.directoryDownloadInitiated'))
    }

    const route = isFolder ? 'downloadfolder' : 'downloadfile'

    const response = await props.executeLocalCommand(
      `/apps/${route}/${props.appSpec.name}/${selectedAppVolume.value}/${encodeURIComponent(fileName)}`,
      null,
      axiosConfig,
    )

    console.log(response)
    if (!silent && !isFolder && response.data && response.status === 200) {
      updateFileProgressVolume(name, 100)
    }

    console.log('Downloading Test...')
    if (response.data?.status === 'error') {
      showToast('danger', response.data.data.message || response.data.data)
    } else if (silent) {
      return await blobToText(response.data)
    } else {
      console.log('Downloading...')

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')

      link.href = url
      link.setAttribute('download', isFolder ? `${name}.zip` : name)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    }
  } catch (error) {
    console.error(error.message)
    showToast('danger', error.message || error)
  }
}

function zelidHeader() {
  const zelidauth = localStorage.getItem('zelidauth')

  return {
    zelidauth,
  }
}

function detectLanguage(content) {
  const result = hljs.highlightAuto(content)

  console.log('Detected language:', result.language)
  
  return result.language || 'plaintext'
}

function getLanguageFromFileName(fileName) {
  const lowerFileName = fileName.toLowerCase()
  if (lowerFileName === 'dockerfile') {
    return supportedLanguages.value.includes('dockerfile') ? 'dockerfile' : 'plaintext'
  }
  if (lowerFileName === 'pom.xml') {
    return supportedLanguages.value.includes('pom') ? 'pom' : 'plaintext'
  }
  const parts = lowerFileName.split('.')
  if (parts.length <= 1) return 'plaintext'
  const ext = parts.pop()
  const language = extensionMapping.value[ext] || 'plaintext'
  
  return supportedLanguages.value.includes(language) ? language : 'plaintext'
}

function mapDetectedLanguage(detected, fileName) {
  const aliasMapping = {
    'php-template': 'php',
    bash: 'shell',
    smalltalk: 'json',
  }

  const fileType = getLanguageFromFileName(fileName)
  if (fileType !== detected && fileType !== 'plaintext') {
    console.log('Selected by fileType')
    
    return fileType
  }
  if (supportedLanguages.value.includes(detected)) {
    console.log('Selected by supportedLanguages')
    
    return detected
  }
  if (aliasMapping[detected]) {
    const alias = aliasMapping[detected]

    console.log('Selected by aliasMapping')
    
    return alias
  }
  
  return 'plaintext'
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function openEditDialog(fileName, size) {
  const maxEditSize = 1024 * 1024 * 4 // 4MB default

  if (maxEditSize < size) {
    showToast('warning', t('core.volumeBrowser.fileTooLarge'))

    return
  }
  operationTitle.value = t('core.volumeBrowser.initializing')
  optionalInfoMessage.value = t('core.volumeBrowser.loadingFile', { file: fileName })
  progressVisable.value = true
  currentEditFile.value = fileName

  await delay(3000)

  download(fileName, false, true)
    .then(content => {
      setTimeout(() => {
        optionalInfoMessage.value = ''
        operationTitle.value = ''
      }, 2000)
      progressVisable.value = false
      editContent.value = content

      const shortSample = content.slice(0, 500)
      const detectedLang = detectLanguage(shortSample)
      const monacoLang = mapDetectedLanguage(detectedLang, fileName)

      editorLanguage.value = monacoLang
      editDialogVisible.value = true
      contentLoaded.value = true

      // Delay Monaco mount until dialog has fully animated
      setTimeout(() => {
        editorMountReady.value = true
      }, 300)
    })
    .catch(err => {
      progressVisable.value = false
      setTimeout(() => {
        optionalInfoMessage.value = ''
        operationTitle.value = ''
      }, 2000)
      console.error('Error loading file for editing:', err)
      showToast('danger', t('core.volumeBrowser.errorLoadingFile'))
    })
}

function closeEditor() {
  // Immediately hide the dialog to avoid render freeze
  editDialogVisible.value = false
  editorMountReady.value = false

  // Use $nextTick to allow the dialog to unmount before disposing Monaco
  nextTick(() => {
    try {

      // Dispose the Monaco editor instance safely
      if (editorInstance.value && typeof editorInstance.value.dispose === 'function') {
        editorInstance.value.dispose()
      }

      // Reset all states after disposal
      editorInstance.value = null
      editContent.value = ''
      currentEditFile.value = ''
      hasChanged.value = false
      contentLoaded.value = false
    } catch (err) {
      console.error('Error during closeEditor:', err)
      showToast('danger', t('core.volumeBrowser.errorClosingEditor'))
    }
  })
}

async function saveContent() {
  console.log('[SAVE] Starting saveContent()')

  saving.value = true
  await nextTick()
  console.log('[SAVE] Spinner enabled')

  let currentValue = ''
  try {
    const model = editorModel.value || editorInstance.value?.getModel()
    if (!model || typeof model.getValue !== 'function') {
      throw new Error('No valid Monaco model found')
    }

    currentValue = model.getValue()
    console.log('[SAVE] Got model value')
  } catch (err) {
    console.error('[SAVE] Error getting editor content:', err)
    showToast('danger', t('core.volumeBrowser.editorNotReady'))
    saving.value = false

    return
  }

  const fileToUpload = {
     
    file_name: currentEditFile.value,
    content: currentValue,
  }

  try {
    console.log('[SAVE] Uploading...')
    await upload(fileToUpload, true)
    showToast('success', t('core.volumeBrowser.fileUpdated'))
    // Refresh the folder list to show updated file
    await refreshFolder()
  } catch (error) {
    console.error('[SAVE] Upload failed:', error)
    showToast('danger', t('core.volumeBrowser.errorSavingFile', { error: error.message }))
  } finally {
    hasChanged.value = false
    saving.value = false
  }
}



function onEditorInput() {
  if (!hasChanged.value && contentLoaded.value) {
    hasChanged.value = true
  }
}

function handleMount(editor) {
  editorInstance.value = editor
  editorModel.value = editor.getModel()

  const container = editor.getDomNode()?.parentElement

  // Ensure proper layout
  setTimeout(() => {
    if (container) {
      editor.layout({ width: container.offsetWidth, height: container.offsetHeight })
    }

    if (window.monaco?.editor) {
      window.monaco.editor.remeasureFonts()
    }
  }, 100)

  editor.onDidChangeModelContent(onEditorInput)
}


function getUploadFolder() {
  if (props.selectedIp) {
    const [ip, port = 16127] = props.selectedIp.split(':')

    const basePath = currentFolder.value
      ? `/ioutils/fileupload/volume/${props.appSpec.name}/${selectedAppVolume.value}/${encodeURIComponent(currentFolder.value)}`
      : `/ioutils/fileupload/volume/${props.appSpec.name}/${selectedAppVolume.value}`

    if (props.ipAccess) {
      return `http://${ip}:${port}${basePath}`
    }
    
    return `https://${ip.replace(/\./g, '-')}-${port}.node.api.runonflux.io${basePath}`
  }
}

async function upload(file, isContentUpload = false) {
  return new Promise((resolve, reject) => {
    if (typeof XMLHttpRequest === 'undefined') {
      reject('XMLHttpRequest is not supported.')
      
      return
    }

    const xhr = new XMLHttpRequest()
    const action = isContentUpload ? getUploadFolder() : getUploadFolderBackup(file.file_name)

    if (xhr.upload) {
      xhr.upload.onprogress = function progress(e) {
        if (e.total > 0) {
          e.percent = (e.loaded / e.total) * 100
        }
        file.progress = e.percent
      }
    }

    const formData = new FormData()
    if (isContentUpload) {
      const blob = new Blob([file.content], { type: 'text/plain' })

      formData.append(file.file_name, blob)
    } else {
      formData.append(file.selected_file.name, file.selected_file)
    }

    file.uploading = true

    xhr.onerror = function error(e) {
      file.uploading = false
      file.uploaded = false
      file.progress = 0
      showToast('danger', `An error occurred while uploading ${file.selected_file?.name || file.file_name}`)
      reject(e)
    }

    xhr.onload = function onload() {
      if (xhr.status < 200 || xhr.status >= 300) {
        console.error(xhr.status)
        file.uploading = false
        file.uploaded = false
        file.progress = 0
        showToast('danger', `Upload failed with status ${xhr.status}`)
        reject(xhr.status)
        
        return
      }
      file.uploaded = true
      file.uploading = false
      resolve()
    }

    xhr.open('post', action, true)

    const headers = zelidHeader() || {}

    Object.keys(headers).forEach(key => {
      if (headers[key] != null) {
        xhr.setRequestHeader(key, headers[key])
      }
    })
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*')
    xhr.send(formData)
  })
}

function getUploadFolderBackup(saveAs) {
  const ip = props.selectedIp.split(':')[0]
  const port = props.selectedIp.split(':')[1] || 16127
  const filename = encodeURIComponent(saveAs)
  if (props.ipAccess) {
    return `http://${ip}:${port}/ioutils/fileupload/backup/${props.appSpec.name}/${restoreRemoteFile.value}/null/${filename}`
  }
  
  return `https://${ip.replace(/\./g, '-')}-${port}.node.api.runonflux.io/ioutils/fileupload/backup/${props.appSpec.name}/${restoreRemoteFile.value}/null/${filename}`
}

loader.init().then(() => {
  monacoReady.value = true
})
</script>

<style scoped>
.editor-container {
  height: 70vh;
  width: 100%;
  position: relative;
  -webkit-font-smoothing: antialiased;
  border-radius: 6px;
  border: 1px solid #e1e4e8;
}
.border-frame {
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 5px;
  padding: 6px;
  height: 54px;
}
.no-wrap {
  white-space: nowrap;
}
@media (max-width: 600px) {
  .hide-on-sm {
    display: none !important;
  }
}

.progress-wrapper {
  position: relative;
  padding: 12px; /* space for glow to show */
  overflow: visible;
  display: inline-block;
}

.progress-glow {
  border-radius: 50% !important;
  overflow: visible !important;
}

:deep(.progress-glow .v-progress-circular__overlay) {
  filter: drop-shadow(0 0 2px currentColor) !important;
}

:deep(.progress-glow svg) {
  overflow: visible !important;
  border-radius: 50%;
}

.progress-text {
  font-size: 12px;
   font-family: 'Fira Code', monospace; /* or any preferred font */
   letter-spacing: 0.3px;
}

:deep(.v-data-table thead) {
  background-color: rgb(var(--v-theme-background)) !important;
}

:deep(.v-data-table thead th) {
  background-color: rgb(var(--v-theme-background)) !important;
  color: #b6b4b4 !important;
  font-weight: 600;
}
</style>
