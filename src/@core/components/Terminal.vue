<template>
  <VRow class="align-center justify-space-between mb-1">
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
              mdi-console
            </VIcon>
          </VAvatar>
          <span class="text-h5">{{ t('core.terminal.title') }}</span>
        </div>
      </div>
    </VCol>
  </VRow>
  <VRow
    class="mb-3"
    align="center"
    dense
  >
    <!-- Top Row: Selects + Buttons -->
    <VCol
      v-if="appSpec?.name"
      cols="12"
      class="d-flex flex-wrap align-center justify-space-between"
    >
      <!-- Left side: Select dropdowns and Connect/Disconnect -->
      <div class="d-flex flex-wrap align-center">
        <VSelect
          v-model="selectedApp"
          :items="appSpec?.compose ? appSpec.compose.map(c => c.name) : [appSpec.name]"
          :label="t('core.terminal.selectComponent')"
          dense
          density="comfortable"
          :disabled="isComposeSingle"
          class="mr-3 mb-2"
          style="min-width: 250px"
        />
        <VSelect
          v-model="selectedCmd"
          :items="['/bin/bash', '/bin/sh', 'Custom']"
          :label="t('core.terminal.selectCommand')"
          dense
          density="comfortable"
          class="mr-3 mb-2"
          style="min-width: 200px"
        />
        <VBtn
          v-if="!isVisible"
          color="success"
          :disabled="isConnecting"
          :loading="isConnecting"
          density="compact"
          size="large"
          class="text-subtitle-1 mr-2 mb-2"
          @click="connectTerminal(appSpec.version > 3 ? `${selectedApp}_${appSpec.name}` : appSpec.name)"
        >
          {{ t('core.terminal.connect') }}
        </VBtn>
        <VBtn
          v-if="isVisible"
          color="error"
          size="large"
          density="compact"
          class="text-subtitle-1 mb-2"
          @click="disconnectTerminal"
        >
          {{ t('core.terminal.disconnect') }}
        </VBtn>
      </div>

      <!-- Right side: Switches -->
      <div class="d-flex flex-wrap align-center ml-auto">
        <VSwitch
          v-model="enableUser"
          :label="t('core.terminal.user')"
          dense
          class="ml-2 mr-4"
        />
        <VSwitch
          v-model="enableEnvironment"
          :label="t('core.terminal.environment')"
          dense
          class="mr-2"
        />
      </div>
    </VCol>

    <!-- Conditional Fields -->
    <VCol
      v-if="selectedCmd === 'Custom'"
      cols="12"
      md="6"
    >
      <VTextField
        v-model="customValue"
        :label="t('core.terminal.customCommand')"
        dense
        density="comfortable"
      />
    </VCol>

    <VCol
      v-if="enableUser"
      cols="12"
    >
      <VTextField
        v-model="userInputValue"
        :label="t('core.terminal.userUid')"
        dense
        density="comfortable"
      />
    </VCol>

    <VCol
      v-if="enableEnvironment"
      cols="12"
    >
      <VTextField
        v-model="envInputValue"
        :label="t('core.terminal.environmentVariables')"
        dense
        density="comfortable"
        persistent-hint
      />
    </VCol>
  </VRow>
  
  <div
    v-show="isVisible"
    ref="terminalElement"
    class="terminal-container mt-4"
  />


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
import { onMounted, onBeforeUnmount, ref, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { SerializeAddon } from '@xterm/addon-serialize'
import { io } from 'socket.io-client'
import '@xterm/xterm/css/xterm.css'

const props = defineProps({
  appSpec: {
    type: Object,
    required: true,
  },
  selectedIp: {
    type: String,
    required: true,
  },
})

const { t } = useI18n()

const snackbarColor = ref("success")
const snackbar = ref(false)
const snackbarIcon = ref('')
const snackbarMessage = ref("")
const terminalElement = ref(null)
let socket = null
let terminal = null
let resizeHandler = null
const fitAddon = new FitAddon()
const ipAccess = ref(false)
const isVisible = ref(false)
const isConnecting = ref(false)

const selectedApp = ref(null)
const selectedCmd = ref(null)
const customValue = ref('')
const userInputValue = ref('')
const envInputValue = ref('')
const enableUser = ref(false)
const enableEnvironment = ref(false)

const isComposeSingle = computed(() => {
  if (props.appSpec?.version <= 3) {
    return true
  }

  return props.appSpec.compose?.length === 1
})

watchEffect(() => {
  if (props.appSpec && props.appSpec?.version <= 3) {
    selectedApp.value = props.appSpec.name
  } else if (props.appSpec && props.appSpec?.compose && props.appSpec?.compose.length < 2) {
    selectedApp.value = props.appSpec?.compose[0].name
  }
})

function connectTerminal(name) {
  // console.log('🚀 connectTerminal called with name:', name)
  // console.log('📦 App Spec version:', props.appSpec.version)
  // console.log('📦 Selected App:', selectedApp.value)

  if (props.appSpec.version >= 4) {
    const found = props.appSpec.compose?.some(c => c.name === selectedApp.value)

    // console.log('🔍 V4+ spec - Container found in compose:', found)
    if (!found) {
      showToast('danger', t('core.terminal.errors.selectContainer'))

      return
    }
  }

  if (!selectedCmd.value || (selectedCmd.value === 'Custom' && !customValue.value)) {
    showToast('danger', selectedCmd.value === 'Custom' ? t('core.terminal.errors.enterCustomCommand') : t('core.terminal.errors.noCommandSelected'))

    return
  }

  async function copySelectedText(isManual = false) {
    if (!terminal) return

    const pos = terminal.getSelectionPosition()
    if (!pos || !pos.start || !pos.end) {
      
      return
    }

    const { start, end } = pos
    const buffer = terminal.buffer.active
    const lines = []

    const startRow = Math.max(0, start.y)
    const endRow = Math.min(buffer.length - 1, end.y)

    for (let row = startRow; row <= endRow; row++) {
      const line = buffer.getLine(row)
      if (!line) continue

      const text = line.translateToString(false)
      if (row === startRow && row === endRow) {
        lines.push(text.slice(start.x, end.x))
      } else if (row === startRow) {
        lines.push(text.slice(start.x))
      } else if (row === endRow) {
        lines.push(text.slice(0, end.x))
      } else {
        lines.push(text)
      }
    }

    const selectedText = lines.join('\n')

    if (!selectedText) {
      return
    }

    // Try modern async clipboard API

    try {
      await navigator.clipboard.writeText(selectedText)
      showToast('success', t('core.terminal.copiedToClipboard'), 'mdi-content-copy')
      terminal.clearSelection()
    } catch (err) {
      // Fallback to execCommand
      fallbackExecCommandCopy(selectedText, isManual)
    }
  }

  function fallbackExecCommandCopy(text, isManual) {
    try {
      const tempInput = document.createElement('textarea')

      tempInput.style.position = 'absolute'
      tempInput.style.left = '-9999px'
      tempInput.style.opacity = '0'
      tempInput.value = text
      document.body.appendChild(tempInput)

      tempInput.focus()
      tempInput.select()

      const success = document.execCommand('copy')

      document.body.removeChild(tempInput)

      if (success) {
        showToast('success', t('core.terminal.copiedToClipboard'), 'mdi-content-copy')
        terminal.clearSelection()
      } else {
        if (!isManual) {
          showToast('warning', t('core.terminal.warnings.clipboardHttps'), 'mdi-alert')
        } else {
          showToast('error', t('core.terminal.errors.clipboardInaccessible'), 'mdi-alert')
        }
      }
    } catch (err) {
      console.error('Fallback execCommand exception:', err)
      if (!isManual) {
        showToast('warning', t('core.terminal.warnings.clipboardHttps'), 'mdi-alert')
      } else {
        showToast('error', t('core.terminal.errors.clipboardError'), 'mdi-alert')
      }
    }
  }

  isConnecting.value = true

  const zelidauth = localStorage.getItem('zelidauth')
  const [host, port = 16127] = props.selectedIp.split(':')

  const url = ipAccess.value
    ? `http://${host}:${port}/terminal`
    : `https://${host.replace(/\./g, '-')}-${port}.node.api.runonflux.io/terminal`

  // console.log('🔌 Terminal connecting to:', url)
  // console.log('📋 Connection details:', {
  //   host,
  //   port,
  //   ipAccess: ipAccess.value,
  //   selectedIp: props.selectedIp,
  //   appName: props.name
  // })

  socket = io.connect(url)

  // console.log('✅ Socket created, waiting for connection...')

  terminal = new Terminal({
    allowProposedApi: true,
    cursorBlink: true,
    theme: { foreground: 'white', background: 'black' },
  })

  const fitAddon = new FitAddon()
  
  terminal.loadAddon(fitAddon)
  terminal.loadAddon(new WebLinksAddon())
  terminal.loadAddon(new Unicode11Addon())
  terminal.loadAddon(new SerializeAddon())
  terminal._initialized = true

  terminal.open(terminalElement.value)

  // Ensure layout is settled before fitting
  nextTick(() => {
    requestAnimationFrame(() => {
      fitAddon.fit()
      terminal.focus()
    })
  })

  terminal.onResize(({ cols, rows }) => {
    if (socket) socket.emit('resize', { cols, rows })
  })
  terminal.onData(data => {
    if (socket) socket.emit('cmd', data)
  })

  // Debounce function to stabilize selection changes
  function debounce(func, wait) {
    let timeout
    
    return function (...args) {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  // Lock to prevent multiple simultaneous clipboard operations
  let isCopying = false

  // Replace the onSelectionChange listener
  terminal.onSelectionChange(debounce(() => {
    if (isCopying) {
      return
    }
    isCopying = true
    terminal.focus() // Ensure terminal retains focus
    try {
      copySelectedText()
    } finally {
    // Reset the lock after a delay to allow the clipboard operation to complete
      setTimeout(() => {
        isCopying = false
      }, 300)
    }
  }, 200))

  resizeHandler = () => fitAddon.fit()
  window.addEventListener('resize', resizeHandler)

  const user = enableUser.value ? userInputValue.value : ''
  const cmd = customValue.value || selectedCmd.value

  let consoleInit = 0
  let skipToast = 0

  // console.log('📤 Emitting exec command:')
  // console.log('  - Container name (param):', name)
  // console.log('  - Container name (selectedApp):', selectedApp.value)
  // console.log('  - Command:', cmd)
  // console.log('  - Environment:', envInputValue.value)
  // console.log('  - User:', user)
  // console.log('  - zelidauth:', zelidauth ? '✅ Present' : '❌ Missing')
  socket.emit('exec', zelidauth, name, cmd, envInputValue.value, user)

  socket.on('error', err => {
    console.error('❌ Socket error event:', err)
    showToast('danger', t('core.terminal.errors.connectionError', { error: err }))
    isConnecting.value = false
    disconnectTerminal()
  })

  socket.on('connect_error', err => {
    console.error('❌ Socket connect_error event:', err.message, err)
    showToast('danger', t('core.terminal.errors.connectionErrorWithMessage', { message: err.message }))
    isConnecting.value = false
    disconnectTerminal()
  })

  socket.on('connect_timeout', () => {
    console.error('⏱️ Socket connect_timeout event')
    showToast('danger', t('core.terminal.errors.connectionTimeout'))
    isConnecting.value = false
    disconnectTerminal()
  })

  socket.on('show', data => {
    // console.log('📥 Socket show event, data length:', data?.length || 0)
    if (typeof data === 'string' && consoleInit === 0 && data.includes('OCI runtime exec')) {
      skipToast = 1
      console.warn('⚠️ OCI runtime exec error detected, disconnecting')
      showToast('danger', t('core.terminal.errors.commandNotSupported', { cmd }))
      disconnectTerminal()

      return
    }
    if (consoleInit === 0) {
      // console.log('🎬 Console initialized, setting up terminal environment')
      consoleInit = 1
      if (!customValue.value) {
        socket.emit('cmd', 'export TERM=xterm\n')
        if (selectedCmd.value === '/bin/bash') {
          socket.emit('cmd', 'PS1="\\[\\033[01;31m\\]\\u\\[\\033[01;33m\\]@\\[\\033[01;36m\\]\\h \\[\\033[01;33m\\]\\w \\[\\033[01;35m\\]\\$ \\[\\033[00m\\]"\n')
        }
        socket.emit('cmd', "alias ls='ls --color'\n")
        socket.emit('cmd', "alias ll='ls -alF'\n")
      }
      setTimeout(() => {
        nextTick(() => {
          setTimeout(() => {
            isConnecting.value = false
            isVisible.value = true
            terminal.clear()
            nextTick(() => {
              terminal.focus()
              setTimeout(() => fitAddon.fit(), 100)
            })
          }, 500)
        })
      }, 1400)
    }
    terminal.write(data)
  })

  socket.on('disconnect', reason => {
    console.warn('🔌 Socket disconnect event, reason:', reason)
    if (!skipToast) showToast('warning', t('core.terminal.warnings.disconnected'))
    disconnectTerminal()
  })

  socket.on('end', () => {
    // console.log('🔚 Socket end event')
    disconnectTerminal()
  })

  socket.on('connect', () => {
    // console.log('✅ Socket connected successfully')
  })
}

function disconnectTerminal() {
  // console.log('🔌 Disconnecting terminal...')
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (socket) {
    // console.log('🔌 Closing socket connection')
    socket.disconnect()
  }
  if (terminal) {
    // console.log('🖥️ Disposing terminal')
    terminal.dispose()
  }
  socket = null
  terminal = null
  resizeHandler = null
  isVisible.value = false
  isConnecting.value = false

  // console.log('✅ Terminal disconnected and cleaned up')
}

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

onMounted(() => {
  const { hostname } = window.location
  const regex = /[A-Z]/gi
  if (hostname.match(regex)) {
    ipAccess.value = false
  } else {
    ipAccess.value = true
  }
})

onBeforeUnmount(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
  disconnectTerminal()
})
</script>
  
  <style scoped>
  .terminal-container {
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 6px;
    overflow: hidden;
  }
  .border-frame {
    border: 1px solid #ccc;
    border-radius: 8px;
    margin-bottom: 5px;
    padding: 6px;
    height: 54px;
  }
.no-wrap.v-switch .v-label {
  white-space: nowrap !important; /* Target VSwitch label specifically */
  flex-shrink: 0; /* Prevent label from shrinking */
}
.no-wrap.v-switch {
  flex-shrink: 0; /* Prevent VSwitch from shrinking */
  min-width: 0; /* Override any min-width constraints */
}
</style>
