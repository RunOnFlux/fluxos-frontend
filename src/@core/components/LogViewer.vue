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
            <span class="text-h5">{{ t('core.logViewer.title') }}</span>
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
              :label="selectedApp ? t('core.logViewer.component') : t('core.logViewer.selectComponent')"
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
            :label="t('core.logViewer.lineCount')"
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
            :label="t('core.logViewer.logsSince')"
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
          :label="t('core.logViewer.filterLogs')"
          dense
          density="comfortable"
          hide-details
          :placeholder="t('core.logViewer.enterKeywords')"
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
              {{ t('core.logViewer.advanceOptions') }}
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
                    <span class="text-caption">{{ t('core.logViewer.autoRefresh') }}</span>
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
                    <span class="text-caption">{{ t('core.logViewer.displayAllLogs') }}</span>
                  </template>
                </VSwitch>

                <VSwitch
                  v-model="displayTimestamps"
                  hide-details
                  density="comfortable"
                  inset
                >
                  <template #label>
                    <span class="text-caption">{{ t('core.logViewer.displayTimestamp') }}</span>
                  </template>
                </VSwitch>

                <VSwitch
                  v-model="isLineByLineMode"
                  hide-details
                  density="comfortable"
                  inset
                >
                  <template #label>
                    <span class="text-caption">{{ t('core.logViewer.lineSelection') }}</span>
                  </template>
                </VSwitch>

                <VSwitch
                  v-model="autoScroll"
                  hide-details
                  density="comfortable"
                  inset
                >
                  <template #label>
                    <span class="text-caption">{{ t('core.logViewer.autoScroll') }}</span>
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
        {{ copied ? t('core.logViewer.copied') : t('core.logViewer.copy') }}
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
        </VIcon> {{ t('core.logViewer.unselect') }}
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
        {{ t('core.logViewer.download') }}
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
          {{ t('core.logViewer.noMatchingLogs', { keyword: filterKeyword }) }}
        </div>
        <div
          v-else-if="noLogs"
          class="no-matches"
        >
          {{ t('core.logViewer.noLogsFound') }}
        </div>
      </template>
    </div>
  </div>
</template>
  
<script setup>
import { ref, computed, nextTick, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ClipboardJS from 'clipboard'
import AnsiToHtml from 'ansi-to-html'

import { io } from 'socket.io-client'

const props = defineProps({
  appSpecification: { type: Object, required: true },
  executeLocalCommand: { type: Function, required: true },

  // [{ name, masterSlave }]. Where a component list comes from is the caller's
  // decision - the specification, or the names endpoint for a viewer who may not
  // read it - so this never reaches into compose itself.
  components: { type: Array, default: () => [] },

  // Which instance executeLocalCommand talks to. A log position belongs to ONE
  // node's container: the same app on another node has its own timestamps, so a
  // position carried across would ask that node for a moment in its log that
  // means nothing here and skip lines to match a count from somewhere else.
  target: { type: String, default: '' },

  // Whether this browser reaches the node by IP rather than through the node
  // DNS name. The log stream is a socket.io connection to the node itself, so
  // it has to make the same choice the terminal does; the poll does not,
  // because executeLocalCommand already made it.
  ipAccess: { type: Boolean, default: false },
})
  
const { t } = useI18n()
  
const logs = ref([])
const selectedApp = ref(null)
const selectedLog = ref([])
const copied = ref(false)
const clipboardText = ref('')
const downloadingLog = ref(false)
const lineCount = ref(100)
const sinceTimestamp = ref('')

// Where this viewer has read up to, as the node described it. Opaque on purpose -
// nodes and this app upgrade independently, so reading it here would make its
// shape a contract. Null means "start from the most recent lines", which is also
// what a node that predates positions always answers.
const logPosition = ref(null)
const pollingEnabled = ref(false)
const isLineByLineMode = ref(false)
const displayTimestamps = ref(true)
const autoScroll = ref(true)
const manualInProgress = ref(false)
const requestInProgress = ref(false)
const pollingInterval = ref(null)

// The live stream, when this node offers one. A node that does not is not a
// version check anywhere: the connection simply fails and the poll below is
// what this viewer has always done.
const logSocket = ref(null)
const streaming = ref(false)
const logsContainer = ref(null)
const copyBtn = ref(null)
const filterKeyword = ref('')
const noLogs = ref(false)
const downloaded = ref(0)
const total = ref(0)
const hasRun = ref(false)
const allLogs = ref(false)

const componentOptions = computed(() => props.components.map(component => component.name))

const isComposeSingle = computed(() => {
  if (props.appSpecification?.version <= 3) {
    return true
  }

  return componentOptions.value.length === 1
})

watchEffect(() => {
  if (hasRun.value) return

  if (props.appSpecification && props.appSpecification?.version <= 3) {
    selectedApp.value = props.appSpecification.name
    manualFetchLogs()
    hasRun.value = true

  // Exactly one, not "fewer than two": an empty list satisfies "fewer than two"
  // and has no [0] to select.
  } else if (componentOptions.value.length === 1) {
    [selectedApp.value] = componentOptions.value
    manualFetchLogs()
    hasRun.value = true
  }
})

const filteredLogs = computed(() => {
  if (!filterKeyword.value.trim()) return logs.value
  const keyword = filterKeyword.value.toLowerCase()

  return logs.value.filter(log => log.toLowerCase().includes(keyword))
})
  
  
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
  
// Every manual refresh restates the question - a new line count, a new starting
// point, all-logs on or off - so it starts from a fresh position rather than
// continuing one taken under the previous answer.
async function manualFetchLogs() {
  manualInProgress.value = true
  resetLogPosition()
  await fetchLogs()
  manualInProgress.value = false
}
  
// Anything that changes WHICH log is being read invalidates the position: a
// different component, a different node, or a different starting point. Carrying
// one across would skip lines to match a count taken from another log.
function resetLogPosition() {
  logPosition.value = null
  logs.value = []
}

async function fetchLogs() {
  if (!selectedApp.value) return

  // On the version, not on the presence of compose: an enterprise app this
  // viewer cannot decrypt still has a compose, it is just empty.
  const appname = props.appSpecification?.version >= 4
    ? `${selectedApp.value}_${props.appSpecification.name}`
    : props.appSpecification.name

  if (requestInProgress.value) return

  // The stream is carrying this pane now, and a poll alongside it would append
  // the same lines a second time.
  if (streaming.value && !manualInProgress.value) return

  requestInProgress.value = true
  noLogs.value = false

  try {
    const lines = allLogs.value ? 'all' : lineCount.value || 100

    // One request. A node answers a position with everything waiting for it, so
    // there is never a second page to come straight back for - a reader further
    // behind than one answer holds is moved to the end of the log and told, and
    // no number of extra passes would reach the lines it went past.
    const query = logPosition.value ? `?cursor=${encodeURIComponent(logPosition.value)}` : ''

    const response = await props.executeLocalCommand(`/apps/applogpolling/${appname}/${lines}/${sinceTimestamp.value}${query}`)
    const data = response?.data ?? {}
    const received = Array.isArray(data?.logs) ? data.logs : []

    // A node that answers positions returns one. A node that predates them
    // returns the most recent lines and nothing else, which is what this viewer
    // has always done - so it keeps doing exactly that, per node, with no
    // version check anywhere.
    if (typeof data?.cursor !== 'string') {
      logs.value = received
    } else {
      // The line this viewer had read up to no longer exists on the node: docker
      // discarded the file holding it. What sat between it and the oldest line
      // below is gone for everyone, so it is said rather than skipped over.
      if (data.rolledOver && logs.value.length)
        logs.value.push(t('core.logViewer.rolledOver'))

      // The node declined to read back as far as this viewer had got. Those
      // lines still exist, unlike rolledOver's, but reaching them costs a read
      // of the whole retained log on every poll.
      if (data.skipped && logs.value.length)
        logs.value.push(t('core.logViewer.skippedPoll'))

      logs.value = logPosition.value ? [...logs.value, ...received] : received
      logPosition.value = data.cursor
    }

    if (logs.value.length === 0) noLogs.value = true

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
  
// The node pushes lines as the container writes them, so there is no interval
// and no position arithmetic: a stream has no gap between polls to lose lines
// in. A node that predates it refuses the namespace and the poll takes over,
// which is permanent rather than a migration step - the network runs several
// FluxOS versions at once and always will.
function startStreaming() {
  const appname = props.appSpecification?.version >= 4
    ? `${selectedApp.value}_${props.appSpecification.name}`
    : props.appSpecification?.name

  if (!appname || !props.target) return false

  const [host, port = 16127] = props.target.split(':')
  const base = props.ipAccess
    ? `http://${host}:${port}`
    : `https://${host.replace(/\./g, '-')}-${port}.node.api.runonflux.io`

  const socket = io(`${base}/applogs`, { transports: ['websocket'], reconnection: false })

  logSocket.value = socket

  socket.on('logs', payload => {
    const received = Array.isArray(payload?.lines) ? payload.lines : []
    if (!received.length) return
    logs.value = [...logs.value, ...received]
    noLogs.value = false
    nextTick(() => {
      if (autoScroll.value && logsContainer.value)
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    })
  })

  // The container wrote faster than this connection drained. The node dropped
  // the excess rather than buffering it, and says how much - a silent gap is
  // the failure this whole design exists to prevent.
  socket.on('skipped', payload => {
    logs.value.push(t('core.logViewer.skipped', { count: payload?.count ?? 0 }))
  })

  // The container stopped, this node has no stream, the connection failed, or
  // the stream broke after it had started. All four end the same way: the poll
  // takes the pane back.
  //
  // And the socket is closed rather than left open. The node closes the feed
  // when the container stops but it cannot close the connection, so one held
  // here is a connection per stopped container for as long as this pane is on
  // screen - and it stays in that container's room, where a feed someone else
  // opens after a restart is delivered into a pane that is already polling.
  const fallBack = () => {
    closeStream()
    if (pollingEnabled.value) startInterval()
  }

  socket.on('ended', fallBack)
  socket.on('connect_error', fallBack)
  socket.on('error', fallBack)
  socket.on('subscribed', () => { streaming.value = true })
  socket.on('connect', () => {
    socket.emit('subscribe', localStorage.getItem('zelidauth'), appname)
  })

  return true
}

function closeStream() {
  if (logSocket.value) {
    logSocket.value.close()
    logSocket.value = null
  }
  streaming.value = false
}

function startInterval() {
  if (pollingInterval.value) return
  pollingInterval.value = setInterval(() => fetchLogs(), 3000)
}

function startPolling() {
  stopPolling()

  // One immediate poll whatever happens: it fills the pane now, and against a
  // node with no stream it is the only thing that will.
  fetchLogs()
  if (!startStreaming()) startInterval()
}
  
function stopPolling() {
  closeStream()
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}
  
function togglePolling() {
  pollingEnabled.value ? startPolling() : stopPolling()
}
  
// The instance selector lives in the page above this, and this component is not
// remounted when it changes - so without this a position taken on one node would
// be sent to another.
watch(() => props.target, () => {
  resetLogPosition()
  if (selectedApp.value) manualFetchLogs()
})

function handleContainerChange() {
  resetLogPosition()
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
      throw new Error(t('core.logViewer.errors.noLogsToDownload'))
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
  
