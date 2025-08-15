<template>
  <div class="d-flex flex-nowrap align-end justify-end">
    <!-- Manage Button -->
    <VTooltip
      v-if="showManage"
      text="Manage"
    >
      <template #activator="{ props: manageBtnProps }">
        <VBtn
          v-bind="manageBtnProps"
          :id="`manage-installed-app-${row.item.name}`"
          size="small"
          icon
          variant="tonal"
          color="default"
          rounded="true"
          class="mr-2"
        >
          <VIcon size="24">
            mdi-cog-outline
          </VIcon>
        </VBtn>
      </template>
    </VTooltip>

    <!-- Install Button.. -->
    <VTooltip
      v-if="showInstall"
      text="Install"
    >
      <template #activator="{ props: installBtnProps }">
        <VBtn
          v-bind="installBtnProps"
          size="small"
          variant="tonal"
          color="success"
          rounded="true"
          class="mr-2"
          icon
          @click="installApp(row.item.name)"
        >
          <VIcon size="24">
            mdi-progress-download
          </VIcon>
        </VBtn>
      </template>
    </VTooltip>

    <!-- Remove App Button -->
    <VTooltip
      v-if="showControl"
      text="Remove"
    >
      <template #activator="{ props: removeBtnProps }">
        <VBtn
          v-bind="removeBtnProps"
          icon="mdi-delete"
          size="small"
          variant="tonal"
          color="error"
          rounded="true"
          class="mr-2"
          @click="removeApp(row.item.name)"
        />
      </template>
    </VTooltip>

    <!-- Visit Button -->
    <VTooltip text="Visit">
      <template #activator="{ props: visitBtnProps }">
        <VBtn
          v-bind="visitBtnProps"
          icon="mdi-open-in-new"
          size="small"
          variant="tonal"
          color="default"
          rounded="true"
          @click="openGlobalApp(row.item.name)"
        />
      </template>
    </VTooltip>

    <!-- Confirmation Dialog -->
    <ConfirmCustomDialog
      :target="`manage-installed-app-${row.item.name}`"
      confirm-button="Manage"
      @confirm="openAppManagement(row.item.name)"
    />

    <!-- Snackbar -->
    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="4000"
    >
      {{ snackbar.message }}
    </VSnackbar>

    <!-- Install Logs Dialog -->
    <VDialog
      v-model="installDialog.show"
      max-width="900"
      persistent
    >
      <VCard>
        <VCardTitle class="dialog-title d-flex justify-space-between align-center">
          {{ installDialog.title }}
        </VCardTitle>
        <VCardText>
          <div class="action-center">
            <!-- Current Task under title -->
            <div v-if="operationTask">
              <h3 class="mb-2 d-flex align-center">
                <VIcon
                  icon="mdi-progress-tag"
                  class="mr-1"
                />
                Current Task:
              </h3>
              <VChip
                class="current-task-chip"
                :color="taskColor"
                variant="tonal"
                rounded="pill"
              >
                <template #prepend>
                  <VIcon
                    size="24"
                    class="mr-1"
                  >
                    mdi-progress-wrench
                  </VIcon>
                </template>
                {{ operationTask }}
              </VChip>
            </div>
            <div v-else>
              <VProgressLinear
                indeterminate
                color="primary"
              />
            </div>
            <!-- Overall Progress Section -->
            <div
              v-if="aggregateProgress.total > 0"
              class="mt-4"
            >
              <h3 class="mb-2 d-flex align-center">
                <VIcon
                  icon="mdi-progress-download"
                  class="mr-1"
                />
                Overall Progress
              </h3>
              <VProgressLinear
                :model-value="(aggregateProgress.current / aggregateProgress.total) * 100"
                height="16"
                color="success"
                rounded
              />
            </div>

            <!-- Full Logs Section -->
            <div
              v-show="output.length > 1"
              class="mt-4"
            >
              <h3 class="mb-2 d-flex align-center">
                <VIcon
                  icon="mdi-text-box-outline"
                  class="mr-1"
                />
                Full Logs
              </h3>
              <VBtn
                size="small"
                variant="text"
                color="primary"
                @click="showLogs = !showLogs"
              >
                <VIcon
                  :icon="showLogs ? 'mdi-eye-off' : 'mdi-eye'"
                  start
                  class="mr-1"
                />
                {{ showLogs ? 'Hide Logs' : 'Show Logs' }}
              </VBtn>
              <VExpandTransition>
                <div
                  v-show="showLogs"
                  class="mt-2"
                >
                  <div
                    ref="logContainer"
                    class="log-output log-html"
                  >
                    <div v-sanitize-html="fullLogOutput()" />
                  </div>
                </div>
              </VExpandTransition>
            </div>
          </div>
        </VCardText>

        <VCardActions
          v-if="operationTask"
          class="justify-end px-7"
        >
          <VBtn
            color="error"
            size="small"
            variant="flat"
            @click="() => { installDialog.show = false; eventBus.emit('updateInstalledApp') }"
          >
            Close
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import AppsService from '@/services/AppsService'
import { eventBus } from '@/utils/eventBus'

import { useRouter } from 'vue-router'

const props = defineProps({
  row: { type: Object, required: true },
  showManage: { type: Boolean, default: false },
  showInstall: {  type: [Boolean, Function], default: false },
  showControl: {  type: [Boolean, Function], default: false },
})

const router = useRouter()

const snackbar = ref({ show: false, message: '', color: 'error' })
const installDialog = ref({ show: false, title: 'Installing App...' })
const output = ref([])
const downloadOutput = ref({})
const logContainer = ref(null)
const operationTask = ref('')
const showLogs = ref(false)
const operationTaskStatus = ref('')

const aggregateProgress = computed(() => {
  const entries = Object.values(downloadOutput.value).filter(d => d.detail.total > 0 || d.detail.current > 0)
  if (!entries.length) return { current: 0, total: 0 }
  const total = entries.reduce((sum, d) => sum + d.detail.total, 0)
  const current = entries.reduce((sum, d) => sum + d.detail.current, 0)
  
  return { current, total }
})

function showSnackbar(message, color = 'error') {
  snackbar.value.message = message
  snackbar.value.color = color
  snackbar.value.show = true
}

function openAppManagement(appName) {
  router.push(`/apps/manage/${encodeURIComponent(appName)}`)
}

async function openGlobalApp(appName) {
  try {
    const response = await AppsService.getAppLocation(appName)
    if (response.data.status === 'success') {
      const location = response.data.data[0]
      if (!location) {
        showSnackbar('Application is awaiting launching...', 'error')
        
        return
      }
      const url = `https://${appName}.app.runonflux.io`

      window.open(url, '_blank')?.focus()
    } else {
      showSnackbar(response.data.data.message || response.data.data, 'error')
    }
  } catch (error) {
    showSnackbar(error.message || error, 'error')
  }
}

async function installApp(appName) {
  output.value = []
  downloadOutput.value = {}
  operationTask.value = ''
  installDialog.value.title = `Installing ${appName}...`
  installDialog.value.show = true
  showLogs.value = false

  const zelidauth = localStorage.getItem('zelidauth')

  try {
    const axiosConfig = {
      headers: { zelidauth },
      onDownloadProgress(progressEvent) {
        try {
          const raw = progressEvent.event?.target?.response
          const parsed = JSON.parse(`[${raw.replace(/\}\{/g, '},{')}]`)

          output.value = parsed

          const latest = parsed.at(-1)

          operationTask.value = latest?.data?.message || latest?.data || latest?.status
        } catch (_) {}
      },
    }

    await delay(2000)

    const response = await AppsService.justAPI().get(
      `/apps/installapplocally/${appName}`,
      axiosConfig,
    )

    const rawData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const finalParsed = JSON.parse(`[${rawData.replace(/\}\{/g, '},{')}]`)

    output.value = finalParsed

    const last = finalParsed.at(-1)

    operationTask.value = last?.data?.message || last?.data || last?.status
    operationTaskStatus.value = last?.status

    // const lastMsg = last?.data?.message || last?.data
    // if (last?.status === 'error') {
    //   showSnackbar(lastMsg, 'error')
    // } else if (last?.status === 'warning') {
    //   showSnackbar(lastMsg, 'warning')
    // } else {
    //   showSnackbar(lastMsg, 'success')
    // }

    eventBus.emit('updateInstalledApp')
  } catch (error) {
    showSnackbar(error.message || error, 'error')
  }
}

async function removeApp(appName) {
  output.value = []
  downloadOutput.value = {}
  operationTask.value = ''
  installDialog.value.title = `Removing ${appName}...`
  installDialog.value.show = true
  showLogs.value = false

  const zelidauth = localStorage.getItem('zelidauth')
  try {
    const axiosConfig = {
      headers: { zelidauth },
      onDownloadProgress(progressEvent) {
        const raw = progressEvent.event?.target?.response
        const parsed = JSON.parse(`[${raw.replace(/\}\{/g, '},{')}]`)

        output.value = parsed

        const latest = parsed.at(-1)

        operationTask.value = latest?.data?.message || latest?.data || latest?.status
      },
    }

    const response = await AppsService.justAPI().get(`/apps/appremove/${appName}`, axiosConfig)

    const rawData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const finalParsed = JSON.parse(`[${rawData.replace(/\}\{/g, '},{')}]`)

    output.value = finalParsed

    const last = finalParsed.at(-1)

    operationTask.value = last?.data?.message || last?.data || last?.status
    operationTaskStatus.value = last?.status

    
  } catch (error) {
    showSnackbar(error.message || error, 'error')
  }
}

watch(output, () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })

  output.value.forEach(entry => {
    if (!entry?.id && !entry?.status) return

    const id = entry.id || entry.status + Math.random().toString(36).substring(2, 8)
    const progress = entry.progressDetail

    if (entry.status === 'Downloading' || entry.status === 'Extracting') {
      if (!downloadOutput.value[id]) {
        downloadOutput.value[id] = {
          id,
          detail: { current: 0, total: 1 },
          variant: entry.status === 'Downloading' ? 'error' : 'primary',
        }
      }
      if (progress && progress.total > 0) {
        downloadOutput.value[id].detail = {
          current: progress.current,
          total: progress.total,
        }
      }
    }

    if ((entry.status === 'Download complete' || entry.status === 'Pull complete') && downloadOutput.value[id]) {
      downloadOutput.value[id].detail = { current: 1, total: 1 }
      downloadOutput.value[id].variant = 'success'
    }

    if (!downloadOutput.value[id] && entry.progressDetail) {
      downloadOutput.value[id] = {
        id,
        detail: { current: 1, total: 1 },
        variant: 'primary',
      }
    }
  })
})

function fullLogOutput() {
  const componentColors = {}

  const hashColor = name => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    
    return `hsl(${hue}, 60%, 40%)`
  }

  const logs = []
  let buffer = []
  let currentComponent = 'General'
  let appNameFallback = null

  const flushBufferTo = comp => {
    if (!comp) comp = appNameFallback || 'General'
    buffer.forEach(({ text, phase }) => {
      logs.push({ component: comp, phase, text })
    })
    buffer = []
  }

  output.value.forEach(entry => {
    const raw = entry?.data?.message || entry?.data || entry?.status
    const text = typeof raw === 'string' ? raw : JSON.stringify(raw)
    const lcText = text.toLowerCase()

    const appMatch = /Flux App (\w[\w-]*)/.exec(text)
    if (appMatch && !text.includes('component')) {
      appNameFallback = appMatch[1]
    }

    const isNewPull = /^Pulling from /i.test(text)
    const pullingComponent = /Pulling component (\w[\w-]*) of Flux App/.exec(text)
    const pullingGlobalApp = /Pulling global Flux App (\w[\w-]*) was successful/i.exec(text)
    const creatingComponent = /Creating component (\w[\w-]*) of Flux App/.exec(text)
    const startingComponent = /Starting component (\w[\w-]*) of Flux App/.exec(text)
    const creatingApp = /Creating Flux App (\w[\w-]*)/.exec(text)
    const startingApp = /Starting Flux App (\w[\w-]*)/.exec(text)
    const stoppingApp = /Stopping Flux App (\w[\w-]*)/.exec(text)

    // ✅ NEW: Generic component detection fallback
    const genericComponentAction = /(?:Stopping|Removing|Cleaning|Flux App component)\s+(?:Flux App\s+)?component\s+(\w[\w-]*)/i.exec(text)
    if (genericComponentAction) {
      flushBufferTo(genericComponentAction[1])
      currentComponent = genericComponentAction[1]
      
      return
    }

    let phase = 'Finalizing'
    if (/error|fail|aborting/.test(lcText)) {
      phase = 'Error'
    } else if (/warning/.test(lcText)) {
      phase = 'Warning'
    } else if (/initial|connecting|checking|allocating|creating|adjusting|searching|mounting|making|ports...|removing|stopping|starting|initiating|denying|unmounting|clearing|cleaning/.test(lcText)) {
      phase = 'Setup'
    } else if (/pull|download|digest|waiting|extract|verify|already exists/.test(lcText)) {
      phase = 'Pulling'
    } else {
      phase = 'Finalizing'
    }

    if (isNewPull) {
      flushBufferTo(currentComponent)
      buffer.push({ text, phase })
      
      return
    }

    if (pullingComponent) {
      flushBufferTo(pullingComponent[1])
      currentComponent = pullingComponent[1]
      
      return
    }

    if (pullingGlobalApp) {
      flushBufferTo(pullingGlobalApp[1])
      currentComponent = pullingGlobalApp[1]
      
      return
    }

    if (creatingComponent || startingComponent) {
      const comp = (creatingComponent || startingComponent)[1]

      flushBufferTo(comp)
      currentComponent = comp
      
      return
    }

    if (creatingApp || startingApp || stoppingApp) {
      const fallbackComp = (creatingApp || startingApp || stoppingApp)[1]

      appNameFallback = fallbackComp
      currentComponent = fallbackComp
    }

    if (buffer.length > 0) {
      buffer.push({ text, phase })
    } else {
      logs.push({ component: currentComponent, phase, text })
    }
  })

  flushBufferTo(currentComponent)

  return logs.map(({ component, phase, text }) => {
    if (!componentColors[component]) {
      componentColors[component] = hashColor(component)
    }
    const compTag = `<span class="tag tag-component" style="background-color:${componentColors[component]};color:#fff;">${component}</span>`
    const phaseTag = `<span class="tag tag-${phase.toLowerCase()}">${phase}</span>`

    return `${compTag}${phaseTag}&nbsp;${text}`
  }).join('<br>')
}

const taskColor = computed(() => {

  const hasErrorInOutput = output.value.some(entry => {
    const msg = entry?.data?.message || entry?.data || entry?.status || ''
    
    return /error/i.test(msg)
  })

  if (hasErrorInOutput) {
    return 'error'
  }

  if (/error|aborting/i.test(operationTask.value) || (/error/i.test(operationTaskStatus.value))) {
    return 'error'
  }

  if ((/success/i.test(operationTaskStatus.value))) {
    return 'success'
  }

  if ((/warning/i.test(operationTaskStatus.value))) {
    return 'warning'
  }
  
  return 'primary'
})

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
</script>

<style>
.tag {
  font-weight: bold;
  margin: 2px 2px 2px 0;
  border-radius: 999px;
  padding: 3px 5px;
  font-size: 0.75rem;
  display: inline-block;
  color: white;
  backdrop-filter: brightness(1.1);
  opacity: 0.9;
  white-space: nowrap;
  line-height: 1.1;
}

.tag-setup {
  background-color: rgba(30, 136, 229, 0.2);
  color: #1e88e5;
}
.tag-pulling {
  background-color: rgba(245, 124, 0, 0.2);
  color: #f57c00;
}
.tag-deploying {
  background-color: rgba(67, 160, 71, 0.2);
  color: #43a047;
}
.tag-finalizing {
  background-color: rgba(142, 36, 170, 0.2);
  color: #8e24aa;
}
.tag-cleaning {
  color: #fbc02d;
  background-color: rgba(255, 235, 59, 0.2);
}
.tag-error {
  background-color: rgba(244, 67, 54, 0.2);
  color: #f44336;
}
.tag-warning {
  background-color: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.tag-component {
  font-weight: 600;
  border-radius: 999px;
  padding: 3px 10px;
  margin-right: 6px;
  display: inline-block;
}

.log-output {
  height: 300px;
  overflow-y: auto;
  background-color: #201f1f;
  color: #0f0;
  padding: 1rem;
  font-family: monospace;
  font-size: 0.85rem;
  border-radius: 4px;
  border: 1px solid #444;
}

.dialog-title {
  background-color: #1963d2;
  padding: 10px 10px;
  color: aliceblue;
  font-size: 16px;
}


.current-task-chip.v-chip.v-chip--size-default {
  max-width: 100% !important;
  height: auto !important;
  min-height: 32px !important;
  white-space: pre-wrap !important;
  padding: 5px 10px !important; 
}
</style>
