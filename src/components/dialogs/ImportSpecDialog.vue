<template>
  <VDialog
    v-model="isOpen"
    max-width="600"
    persistent
  >
    <VCard rounded="xl" class="d-flex flex-column import-dialog-card">
      <VCardTitle class="bg-primary text-white dialog-title flex-shrink-0 d-flex align-center">
        <VIcon>mdi-file-import</VIcon>
        <span class="ml-2 flex-grow-1">{{ t('components.dialogs.importJsonDialog.title') }}</span>
        <VBtn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="closeDialog"
          class="close-title-btn"
        />
      </VCardTitle>

      <VCardText class="px-6 pt-4 pb-6 flex-grow-1 d-flex flex-column" style="overflow: hidden; min-height: 0;">
        <!-- Mode Toggle (shown when no file loaded) -->
        <div v-if="!loadedSpec" class="mb-3">
          <VBtnToggle
            v-model="importMode"
            color="primary"
            variant="outlined"
            mandatory
            density="compact"
            class="w-100 mode-toggle"
          >
            <VBtn value="file" class="flex-grow-1">
              <VIcon start>mdi-file-upload</VIcon>
              {{ t('components.dialogs.importJsonDialog.uploadFile') }}
            </VBtn>
            <VBtn value="paste" class="flex-grow-1">
              <VIcon start>mdi-content-paste</VIcon>
              {{ t('components.dialogs.importJsonDialog.pasteSpecification') }}
            </VBtn>
          </VBtnToggle>
        </div>

        <!-- File Upload Section (shown when no file loaded and mode is 'file') -->
        <div v-if="!loadedSpec && importMode === 'file'">
          <!-- Drop Zone (clickable) -->
          <div
            class="drop-zone"
            :class="{ 'drop-zone-active': isDragging }"
            @click="triggerFileInput"
            @drop.prevent="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
          >
            <VIcon size="48" color="grey" class="mb-4">mdi-file-import</VIcon>
            <div class="text-h6 mb-2">{{ t('components.dialogs.importJsonDialog.dropFileHere') }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ t('components.dialogs.importJsonDialog.fileTypeHint') }}
            </div>
          </div>

          <!-- Hidden File Input -->
          <input
            ref="fileInput"
            type="file"
            accept=".json,.yaml,.yml,application/json,text/yaml"
            style="display: none"
            @change="handleFileSelect"
          >

          <!-- Drop Overlay -->
          <div v-if="isDragging" class="drop-overlay">
            <VIcon size="48" color="primary">mdi-file-upload</VIcon>
            <div class="text-h6 mt-2">{{ t('components.dialogs.importJsonDialog.dropFileHere') }}</div>
          </div>
        </div>

        <!-- Paste Mode Section (shown when no file loaded and mode is 'paste') -->
        <div v-if="!loadedSpec && importMode === 'paste'" class="d-flex flex-column" style="min-height: 0;">
          <VAlert
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ t('components.dialogs.importJsonDialog.pasteHint') }}
          </VAlert>
          <div class="monaco-editor-wrapper paste-mode-editor">
            <VueMonacoEditor
              v-model:value="pastedJson"
              language="yaml"
              :options="editorOptions"
              :theme="editorTheme"
              class="monaco-editor"
              @mount="pasteEditorMounted = true"
            />
            <!-- Floating Paste Button  -->
            <VBtn
              icon
              variant="text"
              color="secondary"
              class="floating-paste-btn"
              size="small"
              @click="handleClipboardPaste"
            >
              <VIcon size="18">mdi-clipboard-arrow-down</VIcon>
              <VTooltip activator="parent" location="left">
                {{ t('components.dialogs.importJsonDialog.pasteFromClipboard') }}
              </VTooltip>
            </VBtn>
            <!-- Custom loader overlay -->
            <div v-show="!pasteEditorMounted" class="monaco-loader-overlay">
              <LoadingSpinner
                icon="mdi-content-paste"
                :icon-size="50"
                :title="t('components.dialogs.importJsonDialog.loadingEditor')"
                message=""
              />
            </div>
          </div>
          <VBtn
            color="primary"
            variant="flat"
            class="mt-3"
            :disabled="!pastedJson.trim()"
            @click="handlePasteLoad"
          >
            <VIcon start size="20">mdi-file-check</VIcon>
            {{ t('components.dialogs.importJsonDialog.loadSpecification') }}
          </VBtn>
        </div>

        <!-- Editor Section (shown when file loaded) -->
        <div v-if="loadedSpec" class="d-flex flex-column">
          <VAlert
            variant="tonal"
            density="compact"
            color="info"
            class="mb-3 review-alert"
          >
            <template #prepend>
              <VIcon color="info" class="align-self-center">mdi-information</VIcon>
            </template>
            <div class="d-flex align-center w-100 flex-grow-1">
              <span class="flex-grow-1">{{ t('components.dialogs.importJsonDialog.reviewAndEdit') }}</span>
              <VBtn
                icon
                variant="text"
                color="secondary"
                size="default"
                @click="handleBack"
              >
                <VIcon size="24">mdi-arrow-left-circle</VIcon>
              </VBtn>
            </div>
          </VAlert>
          <div class="monaco-editor-wrapper">
            <VueMonacoEditor
              v-model:value="specJson"
              language="json"
              :options="editorOptions"
              :theme="editorTheme"
              class="monaco-editor"
              @mount="editorMounted = true"
            />
            <!-- Custom loader overlay -->
            <div v-show="!editorMounted" class="monaco-loader-overlay">
              <LoadingSpinner
                icon="mdi-file-import"
                :icon-size="50"
                :title="t('components.dialogs.importJsonDialog.loadingEditor')"
                message=""
              />
            </div>
          </div>
        </div>
      </VCardText>

      <VCardActions v-if="loadedSpec" class="dialog-actions flex-shrink-0 pt-4 pb-4">
        <VSpacer />
        <VBtn
          color="primary"
          variant="flat"
          @click="handleImport"
        >
          {{ t('components.dialogs.importJsonDialog.import') }}
        </VBtn>
      </VCardActions>
    </VCard>

    <!-- Snackbar for errors -->
    <VSnackbar
      v-model="snackbar.show"
      :timeout="snackbar.timeout"
      :color="snackbar.color"
      location="top"
    >
      <div class="d-flex align-center">
        <VIcon
          v-if="snackbar.icon"
          :icon="snackbar.icon"
          class="me-2"
        />
        <span>{{ snackbar.message }}</span>
      </div>
    </VSnackbar>
  </VDialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'
import yaml from 'js-yaml'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import { convertToLatestVersion } from '@/utils/specConverter'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'import'])

const { t } = useI18n()

const theme = useTheme()

const isOpen = ref(props.modelValue)
const isDragging = ref(false)
const fileInput = ref(null)
const loadedSpec = ref(null)
const specJson = ref('')
const editorMounted = ref(false)
const importMode = ref('file') // 'file' or 'paste'
const pastedJson = ref('')
const pasteEditorMounted = ref(false)
const snackbar = ref({
  show: false,
  message: '',
  color: 'error',
  icon: 'mdi-alert-circle',
  timeout: 5000,
})

const editorTheme = computed(() => {
  return theme.global.name.value === 'dark' ? 'vs-dark' : 'vs'
})

const editorOptions = {
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  fontSize: 13,
  lineNumbers: 'on',
  glyphMargin: false,
  folding: true,
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 3,
  contextmenu: true,
  readOnly: false,
  domReadOnly: false,
  disableMonospaceOptimizations: true,
  fontLigatures: false,
}

watch(() => props.modelValue, newValue => {
  isOpen.value = newValue
})

watch(isOpen, newValue => {
  if (!newValue) {
    emit('update:modelValue', false)

    // Reset state after dialog close animation completes (300ms delay)
    setTimeout(() => {
      loadedSpec.value = null
      specJson.value = ''
      editorMounted.value = false
      importMode.value = 'file'
      pastedJson.value = ''
      pasteEditorMounted.value = false
    }, 300)
  }
})

function triggerFileInput() {
  fileInput.value?.click()
}

function closeDialog() {
  // Close immediately without resetting state first to prevent glitch
  isOpen.value = false

  // State will be reset by the watcher after dialog is closed
}

function handleBack() {
  // Reset loaded spec to go back to upload/paste mode
  loadedSpec.value = null
  specJson.value = ''
  editorMounted.value = false
}

async function handleClipboardPaste() {
  try {
    const text = await navigator.clipboard.readText()
    pastedJson.value = text
    snackbar.value.message = t('components.dialogs.importJsonDialog.contentPasted')
    snackbar.value.color = 'success'
    snackbar.value.icon = 'mdi-check-circle'
    snackbar.value.show = true
  } catch (error) {
    console.error('Failed to read clipboard:', error)
    snackbar.value.message = t('components.dialogs.importJsonDialog.clipboardFailed')
    snackbar.value.color = 'error'
    snackbar.value.icon = 'mdi-alert-circle'
    snackbar.value.show = true
  }
}

function handlePasteLoad() {
  try {
    let spec

    // Try to parse as JSON first, then YAML
    try {
      spec = JSON.parse(pastedJson.value)
    } catch {
      spec = yaml.load(pastedJson.value)
    }

    // Check if it's a Docker Compose file and convert to FluxOS format
    const fluxOSSpec = convertDockerComposeToFluxOS(spec)
    if (fluxOSSpec) {
      spec = fluxOSSpec
    } else if (spec.version && spec.version < 8) {
      // Convert older FluxOS versions (v1-v7) to v8 using the converter utility
      spec = convertToLatestVersion(spec)
    }

    // Validate that the spec has required fields
    if (!spec.name || typeof spec.name !== 'string') {
      throw new Error(t('components.dialogs.importJsonDialog.invalidName'))
    }
    if (!spec.compose || !Array.isArray(spec.compose)) {
      throw new Error(t('components.dialogs.importJsonDialog.invalidCompose'))
    }
    if (spec.compose.length === 0) {
      throw new Error(t('components.dialogs.importJsonDialog.emptyCompose'))
    }

    // Store the loaded spec and show it for editing
    loadedSpec.value = spec
    specJson.value = JSON.stringify(spec, null, 2)
    editorMounted.value = false
  } catch (error) {
    console.error('Error parsing pasted content:', error)
    snackbar.value.message = error.message
    snackbar.value.show = true
  }
}

function handleImport() {
  try {
    const spec = JSON.parse(specJson.value)

    // Validate that the spec has required fields
    if (!spec.name || typeof spec.name !== 'string') {
      throw new Error(t('components.dialogs.importJsonDialog.invalidName'))
    }
    if (!spec.compose || !Array.isArray(spec.compose)) {
      throw new Error(t('components.dialogs.importJsonDialog.invalidCompose'))
    }
    if (spec.compose.length === 0) {
      throw new Error(t('components.dialogs.importJsonDialog.emptyCompose'))
    }

    // Always force version to 8
    spec.version = 8
    emit('import', spec)
    closeDialog()
  } catch (error) {
    console.error('Error parsing edited JSON:', error)
    snackbar.value.message = error.message
    snackbar.value.show = true
  }
}

async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    await processFile(file)
  }

  // Reset input
  event.target.value = ''
}

async function handleDrop(event) {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    await processFile(file)
  }
}

function convertDockerComposeToFluxOS(dockerCompose) {
  // Check if this is a Docker Compose file
  const hasServices = dockerCompose.services && typeof dockerCompose.services === 'object'
  const hasVersion = dockerCompose.version && (dockerCompose.version.toString().startsWith('2') || dockerCompose.version.toString().startsWith('3'))

  if (!hasServices) {
    return null // Not a Docker Compose file
  }

  const services = dockerCompose.services
  const compose = []

  Object.entries(services).forEach(([serviceName, service]) => {
    const component = {
      name: serviceName,
      description: service.labels?.description || service.container_name || `${serviceName} component`,
      repotag: service.image || '',
      ports: [],
      domains: [],
      environmentParameters: [],
      commands: [],
      containerPorts: [],
      containerData: '',
      cpu: 0.5,
      ram: 512,
      hdd: 5,
      repoauth: '',
    }

    // Parse ports (e.g., "8080:80" or "8080:80/tcp")
    if (service.ports && Array.isArray(service.ports)) {
      service.ports.forEach(portMapping => {
        const portStr = String(portMapping).split('/')[0] // Remove protocol if present
        const parts = portStr.split(':')
        if (parts.length === 2) {
          const [hostPort, containerPort] = parts
          component.ports.push(Number(hostPort))
          component.containerPorts.push(Number(containerPort))
        } else if (parts.length === 1) {
          // Single port means same for host and container
          component.ports.push(Number(parts[0]))
          component.containerPorts.push(Number(parts[0]))
        }
      })
    }

    // Parse environment variables
    if (service.environment) {
      if (Array.isArray(service.environment)) {
        // Already in "KEY=value" format
        component.environmentParameters = service.environment
      } else if (typeof service.environment === 'object') {
        // Convert object to "KEY=value" strings
        component.environmentParameters = Object.entries(service.environment)
          .map(([key, value]) => `${key}=${value}`)
      }
    }

    // Parse commands/entrypoint
    if (service.command) {
      component.commands = Array.isArray(service.command)
        ? service.command
        : [String(service.command)]
    } else if (service.entrypoint) {
      component.commands = Array.isArray(service.entrypoint)
        ? service.entrypoint
        : [String(service.entrypoint)]
    }

    // Parse volumes (use first volume as containerData)
    if (service.volumes && Array.isArray(service.volumes) && service.volumes.length > 0) {
      const firstVolume = String(service.volumes[0])

      // Extract container path from volume mapping (e.g., "./data:/app/data" -> "/app/data")
      const volumeParts = firstVolume.split(':')
      component.containerData = volumeParts.length > 1 ? volumeParts[1] : volumeParts[0]
    }

    // Try to parse resource limits if present
    if (service.deploy?.resources?.limits) {
      const limits = service.deploy.resources.limits

      // Parse CPU (e.g., "0.5" or "500m")
      if (limits.cpus) {
        const cpuStr = String(limits.cpus)
        component.cpu = cpuStr.endsWith('m')
          ? parseFloat(cpuStr) / 1000
          : parseFloat(cpuStr)
      }

      // Parse memory (e.g., "512M" or "1G")
      if (limits.memory) {
        const memStr = String(limits.memory).toUpperCase()
        if (memStr.endsWith('G')) {
          component.ram = parseFloat(memStr) * 1024
        } else if (memStr.endsWith('M')) {
          component.ram = parseFloat(memStr)
        } else {
          // Assume bytes, convert to MB
          component.ram = parseFloat(memStr) / (1024 * 1024)
        }
      }
    }

    compose.push(component)
  })

  // Use docker-compose project name if available, otherwise use filename
  const appName = dockerCompose.name || 'importeddockerapp'

  return {
    version: 8,
    name: appName,
    description: dockerCompose.description || `Imported from Docker Compose`,
    owner: '', // Must be filled by user
    compose,
    contacts: [],
    geolocation: [],
    instances: 3,
    staticip: false,
    enterprise: '',
    nodes: [],
  }
}

async function processFile(file) {
  try {
    const text = await file.text()
    let spec

    // Determine file type and parse accordingly
    if (file.name.endsWith('.json')) {
      spec = JSON.parse(text)
    } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
      spec = yaml.load(text)
    } else {
      // Try to parse as JSON first, then YAML
      try {
        spec = JSON.parse(text)
      } catch {
        spec = yaml.load(text)
      }
    }

    // Check if it's a Docker Compose file and convert to FluxOS format
    const fluxOSSpec = convertDockerComposeToFluxOS(spec)
    if (fluxOSSpec) {
      spec = fluxOSSpec
    } else if (spec.version && spec.version < 8) {
      // Convert older FluxOS versions (v1-v7) to v8 using the converter utility
      spec = convertToLatestVersion(spec)
    }

    // Validate that the spec has required fields
    if (!spec.name || typeof spec.name !== 'string') {
      throw new Error(t('components.dialogs.importJsonDialog.invalidName'))
    }
    if (!spec.compose || !Array.isArray(spec.compose)) {
      throw new Error(t('components.dialogs.importJsonDialog.invalidCompose'))
    }
    if (spec.compose.length === 0) {
      throw new Error(t('components.dialogs.importJsonDialog.emptyCompose'))
    }

    // Store the loaded spec and show it for editing
    loadedSpec.value = spec
    specJson.value = JSON.stringify(spec, null, 2)

    // Reset editor mounted state to show loader
    editorMounted.value = false
  } catch (error) {
    console.error('Error parsing file:', error)
    snackbar.value.message = error.message
    snackbar.value.show = true
  }
}
</script>

<style scoped>
.import-dialog-card {
  max-height: 90vh;
}

.drop-zone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  border-radius: 8px;
  padding: 48px 24px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  background: rgba(var(--v-theme-surface), 0.5);
  cursor: pointer;
}

.drop-zone:hover {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.05);
  cursor: pointer;
}

.drop-zone-active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  transform: scale(1.02);
}

.drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--v-theme-primary), 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  z-index: 10;
  color: white;
}

.monaco-editor-wrapper {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  height: 450px;
  flex-shrink: 0;
}

.monaco-editor {
  height: 100%;
  width: 100%;
}

@media (max-width: 959px) {
  .monaco-editor-wrapper {
    height: 350px;
  }
}

.dialog-title {
  border-radius: 16px 16px 0 0 !important;
  padding-left: 32px !important;
  padding-right: 32px !important;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

.dialog-actions {
  padding: 13px 32px 13px 32px !important;
}

.monaco-loader-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--v-theme-surface), 0.95);
  z-index: 10;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.monaco-loader-overlay :deep(.loading-container) {
  min-height: auto !important;
  margin-top: 0 !important;
  padding: 0 !important;
}

.paste-mode-editor {
  height: 280px;
}

@media (max-width: 959px) {
  .paste-mode-editor {
    height: 220px;
  }
}

.floating-paste-btn {
  position: absolute !important;
  top: 21px !important;
  right: 21px !important;
  z-index: 100 !important;
  background-color: transparent !important;
  color: rgba(var(--v-theme-secondary), 0.8) !important;
}

.floating-paste-btn:hover {
  background-color: transparent !important;
  color: rgb(var(--v-theme-secondary)) !important;
  transform: scale(1.1);
}

.mode-toggle {
  gap: 4px !important;
  display: flex !important;
}

.mode-toggle :deep(.v-btn) {
  height: 36px !important;
  min-height: 36px !important;
  font-size: 0.875rem;
  padding: 0 12px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  border-radius: 4px !important;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}

.mode-toggle :deep(.v-btn:not(:first-child)) {
  margin-left: 4px !important;
}

.mode-toggle :deep(.v-btn--active) {
  border-color: rgb(var(--v-theme-primary)) !important;
}

.mode-toggle :deep(.v-icon) {
  font-size: 18px;
  margin-right: 4px !important;
}

.review-alert {
  display: flex;
  align-items: center !important;
}

.review-alert :deep(.v-alert__content) {
  width: 100%;
  padding: 0 !important;
  margin: 0 !important;
}

.review-alert :deep(.v-alert__prepend) {
  margin-inline-end: 12px !important;
  align-self: center !important;
}

.review-alert :deep(.v-alert__close) {
  margin: 0 !important;
}

.close-title-btn {
  color: white !important;
}

.close-title-btn:hover {
  background-color: rgba(244, 67, 54, 0.2) !important;
}

.close-title-btn:hover :deep(.v-icon) {
  color: #f44336 !important;
}
</style>
