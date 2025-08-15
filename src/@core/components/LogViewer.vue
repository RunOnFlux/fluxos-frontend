<template>
  <div>
    <VRow class="align-center justify-space-between mb-2">
      <VCol
        cols="12"
        class="d-flex align-center"
      >
        <div class="d-flex w-100 align-center border-frame">
          <div class="d-flex align-center">
            <VAvatar
              size="35"
              color="success"
              variant="tonal"
              rounded="sm"
              class="mr-2 ml-1"
            >
              <VIcon size="26">
                mdi-file-search-outline
              </VIcon>
            </VAvatar>
            <span class="text-h5">Logs Management</span>
          </div>
        </div>
      </VCol>
    </VRow>

    <VRow dense>
      <!-- Left column -->
      <VCol
        cols="12"
        md="8"
      >
        <div class="d-flex flex-column">
          <div
            class="d-flex align-center mb-4"
            style="gap: 8px;"
          >
            <VSelect
              v-if="props?.appSpecification"
              v-model="selectedApp"
              :items="componentOptions"
              :label="selectedApp ? 'Component' : 'Select component'"
              :disabled="isComposeSingle"
              dense
              density="comfortable"
              hide-details
              style="max-width: 350px; margin-bottom: 0;"
              @update:model-value="handleContainerChange"
            >
              <template #prepend-inner>
                <VIcon
                  icon="mdi-docker"
                  size="20"
                />
              </template>
            </VSelect>
            <VBtn
              :loading="manualInProgress || pollingEnabled"
              :disabled="requestInProgress || pollingEnabled"
              icon
              color="success"
              density="comfortable"
              variant="tonal"
              @click="manualFetchLogs"
            >
              <VIcon size="24">
                mdi-refresh
              </VIcon>
            </VBtn>
          </div>
          <VTextField
            v-model="lineCount"
            type="number"
            label="Line Count"
            dense
            density="comfortable"
            hide-details
            class="mb-4"
            style="max-width: 210px"
            @update:model-value="manualFetchLogs"
          >
            <template #prepend-inner>
              <VIcon
                icon="mdi-counter"
                size="20"
              />
            </template>
          </VTextField>
          <VTextField
            v-model="sinceTimestamp"
            label="Logs Since"
            type="datetime-local"
            dense
            density="comfortable"
            hide-details
            clearable
            class="mb-2"
            style="max-width: 210px"
            @click:clear="sinceTimestamp = ''"
            @update:model-value="manualFetchLogs"
          />
        </div>
      </VCol>

      <!-- Right column -->
      <VCol cols="12" md="4">
        <VTextField
          v-model="filterKeyword"
          label="Filter Logs"
          dense
          density="comfortable"
          hide-details
          placeholder="Enter keywords..."
          clearable
          @click:clear="filterKeyword = ''"
        >
          <template #append-inner>
            <VIcon size="20">tabler-search</VIcon>
          </template>
        </VTextField>
        <VExpansionPanels multiple elevation="0">
          <VExpansionPanel>
            <VExpansionPanelTitle>
              <VIcon
                icon="mdi-cog"
                size="20"
                class="mr-1"
              />
              Advance Options
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <div class="d-flex flex-column">
                <VSwitch
                  v-model="pollingEnabled"
                  hide-details
                  density="comfortable"
                  inset
                  @change="togglePolling"
                >
                  <template #label>
                    <span class="text-caption">Auto-refresh</span>
                  </template>
                </VSwitch>

                <VSwitch
                  v-model="allLogs"
                  hide-details
                  density="comfortable"
                  inset
                  @change="manualFetchLogs"
                >
                  <template #label>
                    <span class="text-caption">Display all logs</span>
                  </template>
                </VSwitch>

                <VSwitch
                  v-model="displayTimestamps"
                  hide-details
                  density="comfortable"
                  inset
                >
                  <template #label>
                    <span class="text-caption">Display timestamp</span>
                  </template>
                </VSwitch>

                <VSwitch
                  v-model="isLineByLineMode"
                  hide-details
                  density="comfortable"
                  inset
                >
                  <template #label>
                    <span class="text-caption">Line selection</span>
                  </template>
                </VSwitch>

                <VSwitch
                  v-model="autoScroll"
                  hide-details
                  density="comfortable"
                  inset
                >
                  <template #label>
                    <span class="text-caption">Auto-scroll</span>
                  </template>
                </VSwitch>
              </div>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </VCol>
    </VRow>
    <div
      ref="logsContainer"
      class="code-container mt-3"
      :class="{ 'line-by-line-mode': isLineByLineMode }"
    >
      <!-- Sticky top-right button container -->
      <VBtn
        v-if="filteredLogs.length > 0"
        ref="copyBtn"
        class="log-copy-button ml-2"
        size="small"
        color="default"
        :disabled="copied"
        @click="copyCode"
      >
        <VIcon>
          {{ copied ? 'mdi-check' : 'mdi-content-copy' }}
        </VIcon>
        {{ copied ? 'Copied!' : 'Copy' }}
      </VBtn>
      <VBtn
        v-if="isLineByLineMode && selectedLog.length"
        class="log-copy-button ml-2"
        size="small"
        color="default"
        @click="unselectText"
      >
        <VIcon start>
          mdi-arrange-send-backward
        </VIcon> Unselect
      </VBtn>
      <VBtn
        v-if="filteredLogs.length > 0"
        class="download-button ml-2"
        color="success"
        :loading="downloadingLog"
        :disabled="downloadingLog"
        size="small"
        @click="downloadApplicationLog(props.appSpecification.version < 4 ? props.appSpecification.name : `${selectedApp}_${props.appSpecification.name}`)"
      >
        <VIcon start>
          mdi-download
        </VIcon>
        Download
      </VBtn>
      <!-- Log entries -->
      <template v-if="filteredLogs.length > 0">
        <div
          v-for="log in filteredLogs"
          :key="extractTimestamp(log) + Math.random()"
          v-sanitize-html="formatLog(log)"
          class="log-entry"
          :class="{ selected: selectedLog.includes(extractTimestamp(log)) }"
          @click="isLineByLineMode && toggleLogSelection(log)"
        />
      </template>

      <template v-else>
        <div
          v-if="filterKeyword.trim() !== ''"
          class="log-entry"
        >
          No log lines matching “{{ filterKeyword }}”
        </div>
        <div
          v-else-if="noLogs"
          class="no-matches"
        >
          No log records found.
        </div>
      </template>
    </div>
  </div>
</template>
  
<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import ClipboardJS from 'clipboard'
import AnsiToHtml from 'ansi-to-html'
  
const props = defineProps({
  appSpecification: { type: Object, required: true },
  executeLocalCommand: { type: Function, required: true },
})
  
const logs = ref([])
const selectedApp = ref(null)
const selectedLog = ref([])
const copied = ref(false)
const clipboardText = ref('')
const downloadingLog = ref(false)
const lineCount = ref(100)
const sinceTimestamp = ref('')
const pollingEnabled = ref(false)
const isLineByLineMode = ref(false)
const displayTimestamps = ref(true)
const autoScroll = ref(true)
const manualInProgress = ref(false)
const requestInProgress = ref(false)
const pollingInterval = ref(null)
const logsContainer = ref(null)
const copyBtn = ref(null)
const filterKeyword = ref('')
const noLogs = ref(false)
const downloaded = ref(0)
const total = ref(0)
const hasRun = ref(false)
const allLogs = ref(false)

const isComposeSingle = computed(() => {
  if (props.appSpecification?.version <= 3) {
    return true
  }

  return props.appSpecification.compose?.length === 1
})

watchEffect(() => {
  if (hasRun.value) return

  if (props.appSpecification && props.appSpecification?.version <= 3) {
    selectedApp.value = props.appSpecification.name
    manualFetchLogs()
    hasRun.value = true

  } else if (props.appSpecification && props.appSpecification?.compose && props.appSpecification?.compose.length < 2) {
    selectedApp.value = props.appSpecification?.compose[0].name
    manualFetchLogs()
    hasRun.value = true
  }
})

const filteredLogs = computed(() => {
  if (!filterKeyword.value.trim()) return logs.value
  const keyword = filterKeyword.value.toLowerCase()

  return logs.value.filter(log => log.toLowerCase().includes(keyword))
})
  
const componentOptions = computed(() => props.appSpecification.compose?.map(c => c.name) || [])
  
function extractTimestamp(log) {
  return log.split(' ')[0]
}
  
function toggleLogSelection(log) {
  const timestamp = extractTimestamp(log)
  const idx = selectedLog.value.indexOf(timestamp)
  if (idx !== -1) selectedLog.value.splice(idx, 1)
  else selectedLog.value.push(timestamp)
}
  
function unselectText() {
  selectedLog.value = []
}
  
function formatLog(log) {
  const ansiToHtml = new AnsiToHtml()
  if (!log) return ''

  if (displayTimestamps.value) {
    const [timestamp, ...rest] = log.split(' ')
    const cleanedLog = rest.join(' ')

    return `<span style="
      background-color: rgba(25, 135, 84, 0.1);
      color: rgb(var(--v-theme-success)) !important;
      border-radius: 3px; 
      padding: 1px 4px 1px 4px; 
      width: 179px; 
      text-align: 
      center; font-family: monospace;
    ">${timestamp}</span> - ${ansiToHtml.toHtml(cleanedLog)}`
  } else {
    const timestampRegex = /^[^\s]+\s*/
    
    return ansiToHtml.toHtml(log.replace(timestampRegex, ''))
  }
}
  
function copyCode() {
  let text = isLineByLineMode.value && selectedLog.value.length
    ? filteredLogs.value.filter(l => selectedLog.value.includes(extractTimestamp(l))).join('\n')
    : logs.value.join('\n')

  text = text.replace(/\x1B\[[0-9;]*[a-z]/gi, '')

  if (!displayTimestamps.value) {
    const regex = /^\S+\s*/

    text = text.split(/\r?\n/).map(line => line.replace(regex, '')).join('\n')
  }

  clipboardText.value = text

  nextTick(() => {
    const el = copyBtn.value?.$el
    if (!el) {
      console.error('copyBtn $el not found')
      
      return
    }

    // Set clipboard text manually
    el.setAttribute('data-clipboard-text', clipboardText.value)

    // Init ClipboardJS with real HTML button
    const clipboard = new ClipboardJS(el)

    clipboard.on('success', () => {
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
      clipboard.destroy()
    })

    clipboard.on('error', e => {
      console.error('ClipboardJS failed:', e)
      clipboard.destroy()
    })

    el.click()
  })
}
  
async function manualFetchLogs() {
  manualInProgress.value = true
  await fetchLogs()
  manualInProgress.value = false
}
  
async function fetchLogs() {
  if (!selectedApp.value) return

  const appname = props.appSpecification?.compose
    ? `${selectedApp.value}_${props.appSpecification.name}`
    : props.appSpecification.name

  if (requestInProgress.value) return

  requestInProgress.value = true
  noLogs.value = false

  try {
    const lines = allLogs.value ? 'all' : lineCount.value || 100
    const response = await props.executeLocalCommand(`/apps/applogpolling/${appname}/${lines}/${sinceTimestamp.value}`)
    const data = response?.data ?? {}

    logs.value = Array.isArray(data?.logs) ? data.logs : []
    if (data?.status === 'success' && logs.value.length === 0) {
      noLogs.value = true
    }
    nextTick(() => {
      if (autoScroll.value && logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight
      }
    })
  } catch (err) {
    console.error('Failed to fetch logs:', err)
    stopPolling()
  } finally {
    requestInProgress.value = false
  }
}
  
function startPolling() {
  stopPolling()
  pollingInterval.value = setInterval(() => fetchLogs(), 3000)
}
  
function stopPolling() {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}
  
function togglePolling() {
  pollingEnabled.value ? startPolling() : stopPolling()
}
  
function handleContainerChange() {
  if (selectedApp.value) {
    manualFetchLogs()
  }
}


async function downloadApplicationLog(appName) {
  downloaded.value = 0
  total.value = 0

  const zelidauth = localStorage.getItem('zelidauth')

  const axiosConfig = {
    headers: { zelidauth },
    responseType: 'blob',
    onDownloadProgress: progressEvent => {
      downloaded.value = progressEvent.loaded
      total.value = progressEvent.total
      if (downloaded.value === total.value) {
        setTimeout(() => {
          downloaded.value = 0
          total.value = 0
        }, 5000)
      }
    },
  }

  try {
    downloadingLog.value = true

    const response = await props.executeLocalCommand(`/apps/applogpolling/${appName}/all`, null, axiosConfig)

    let logText
    if (response.data instanceof Blob) {
      const text = await response.data.text()
      const json = JSON.parse(text)

      logText = json.logs
    } else {
      logText = response.data.logs
    }

    if (!Array.isArray(logText) || logText.length === 0) {
      throw new Error('No logs available to download.')
    }

    const ansiRegex = /\u001b\[[0-9;]*[a-z]/gi

    logText = logText.map(line => line.replace(ansiRegex, ''))

    // Strip timestamps if disabled
    if (!displayTimestamps.value) {
      const timestampRegex = /^\S+\s*/

      logText = logText.map(line => line.replace(timestampRegex, ''))
    }

    const blob = new Blob([logText.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const fileName = `app-${appName}-${new Date().toISOString().replace(/[:.]/g, '-')}.log`

    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => URL.revokeObjectURL(url), 1000)
    downloadingLog.value = false
  } catch (err) {
    downloadingLog.value = false
    console.error('Download error:', err)
    showToast('danger', err.message || err)
  }
}
  
onBeforeUnmount(() => {
  stopPolling()
})
</script>
  
<style scoped>
  .code-container {
    position: relative;
    margin: 5px;
    height: 330px;
    max-width: 100vw;
    position: relative;
    background-color: #000;
    user-select: text;
    color: #fff;
    border-radius: 6px;
    border: 1px solid #e1e4e8;
    overflow: auto;
    padding: 16px;
    font-size: 12px;
    font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
    box-sizing: border-box;
    clip-path: inset(0 round 6px);
    word-wrap: break-word;
    word-break: break-all;
  }
  .log-entry {
    user-select: text;
    white-space: pre-wrap;
  }
  .line-by-line-mode .log-entry {
    cursor: pointer;
    user-select: none;
  }
  .line-by-line-mode .log-entry:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  .line-by-line-mode .log-entry.selected {
    background-color: rgba(255, 255, 255, 0.3);
    border-left: 5px solid #007bff;
  }
  .line-by-line-mode .log-entry.selected:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }
  .log-copy-button {
      position: sticky;
      top: 2px;
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      background-color: #0366d6;
      color: white;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s ease;
      z-index: 1000;
  }
  .log-copy-button:hover {
      background-color: #024b8e;
  }
  .log-copy-button:disabled {
      background-color: #6c757d;
      color: white;
  }
  .download-button:disabled {
      background-color: #6c757d;
      color: white;
  }
  .download-button {
    position: sticky;
    float: right;
    top: 2px;
    right: 8px;
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    background-color: #28a745;
    color: white;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.2s ease;
    margin-left: 15px;
  }
  .border-frame {
    border: 1px solid #ccc;
    border-radius: 8px;
    margin-bottom: 5px;
    padding: 6px;
    height: 54px;
  }
</style>
  