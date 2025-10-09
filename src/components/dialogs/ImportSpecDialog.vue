<template>
  <VDialog
    v-model="isOpen"
    max-width="600"
    persistent
  >
    <VCard rounded="xl">
      <VCardTitle class="bg-primary text-white dialog-title">
        Import Application Specification
      </VCardTitle>

      <VCardText class="pa-6">
        <!-- File Upload Section (shown when no file loaded) -->
        <div v-if="!loadedSpec">
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
            <div class="text-h6 mb-2">Drop file here or click to browse</div>
            <div class="text-caption text-medium-emphasis">
              Application specification (JSON/YAML) or Docker Compose
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
            <div class="text-h6 mt-2">Drop file here</div>
          </div>
        </div>

        <!-- Editor Section (shown when file loaded) -->
        <div v-else>
          <VAlert
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            Review and edit the specification before importing
          </VAlert>
          <div class="monaco-editor-wrapper">
            <vue-monaco-editor
              v-model:value="specJson"
              language="json"
              :options="editorOptions"
              :theme="editorTheme"
              class="monaco-editor"
            />
          </div>
        </div>
      </VCardText>

      <VCardActions class="dialog-actions">
        <VSpacer />
        <VBtn
          color="error"
          variant="text"
          @click="closeDialog"
        >
          Cancel
        </VBtn>
        <VBtn
          v-if="loadedSpec"
          color="primary"
          variant="flat"
          @click="handleImport"
        >
          Import
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
import yaml from 'js-yaml'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'

const theme = useTheme()

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'import'])

const isOpen = ref(props.modelValue)
const isDragging = ref(false)
const fileInput = ref(null)
const loadedSpec = ref(null)
const specJson = ref('')
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
}

watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue
})

watch(isOpen, (newValue) => {
  if (!newValue) {
    emit('update:modelValue', false)
    // Reset state after dialog close animation completes (300ms delay)
    setTimeout(() => {
      loadedSpec.value = null
      specJson.value = ''
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

function handleImport() {
  try {
    const spec = JSON.parse(specJson.value)

    // Validate that the spec has required fields
    if (!spec.name || typeof spec.name !== 'string') {
      throw new Error('Invalid specification: "name" field is required and must be a string')
    }
    if (!spec.compose || !Array.isArray(spec.compose)) {
      throw new Error('Invalid specification: "compose" field is required and must be an array')
    }
    if (spec.compose.length === 0) {
      throw new Error('Invalid specification: "compose" array cannot be empty')
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
    }

    // Validate that the spec has required fields
    if (!spec.name || typeof spec.name !== 'string') {
      throw new Error('Invalid specification: "name" field is required and must be a string')
    }
    if (!spec.compose || !Array.isArray(spec.compose)) {
      throw new Error('Invalid specification: "compose" field is required and must be an array')
    }
    if (spec.compose.length === 0) {
      throw new Error('Invalid specification: "compose" array cannot be empty')
    }

    // Store the loaded spec and show it for editing
    loadedSpec.value = spec
    specJson.value = JSON.stringify(spec, null, 2)
  } catch (error) {
    console.error('Error parsing file:', error)
    snackbar.value.message = error.message
    snackbar.value.show = true
  }
}
</script>

<style scoped>
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
  height: 450px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  overflow: hidden;
}

.monaco-editor {
  height: 100%;
  width: 100%;
}

.dialog-title {
  border-radius: 16px 16px 0 0 !important;
  padding-left: 32px !important;
  padding-right: 32px !important;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

.dialog-actions {
  padding-left: 32px !important;
  padding-right: 32px !important;
}
</style>
