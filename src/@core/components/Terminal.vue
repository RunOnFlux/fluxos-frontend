<template>
  <VRow class="align-center justify-space-between mb-1">
    <VCol
      cols="12"
      class="d-flex align-center"
    >
      <div class="d-flex w-100 align-center justify-space-between border-frame">
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

        <!-- Pop out all button (inside border frame, far right) -->
        <VTooltip v-if="terminals.filter(t => !t.isPoppedOut).length > 1" location="bottom">
          <template #activator="{ props: tooltipProps }">
            <VBtn
              icon
              variant="tonal"
              density="comfortable"
              color="success"
              class="mr-4 import-glow-btn border-frame-btn"
              v-bind="tooltipProps"
              @click="unpinAllTerminals"
            >
              <VIcon size="22">mdi-window-restore</VIcon>
            </VBtn>
          </template>
          <span>{{ t('core.terminal.popOutAll') }}</span>
        </VTooltip>
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
          color="success"
          :disabled="!selectedCmd || (selectedCmd === 'Custom' && !customValue)"
          density="compact"
          size="large"
          class="text-subtitle-1 mr-2 mb-2"
          @click="addNewTerminal"
        >
          <VIcon class="mr-1">mdi-plus</VIcon>
          {{ t('core.terminal.newTerminal') }}
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

  <!-- Terminal Tabs -->
  <VRow v-if="terminals.length > 0" class="mt-2 mb-0">
    <VCol cols="12" class="pb-2 d-flex align-center">
      <VTabs
        v-model="activeTerminalId"
        color="primary"
        align-tabs="start"
        class="terminal-tabs"
        hide-slider
        style="flex: 1;"
      >
        <VTab
          v-for="term in terminals.filter(t => !t.isPoppedOut)"
          :key="term.id"
          :value="term.id"
          class="terminal-tab"
        >
          <span class="text-caption terminal-tab-text">{{ term.label }}</span>
          <VBtn
            icon
            size="x-small"
            variant="text"
            class="ml-2 unpin-btn"
            @click.stop="unpinTerminal(term.id)"
          >
            <VIcon size="14">mdi-open-in-new</VIcon>
          </VBtn>
          <VBtn
            icon
            size="x-small"
            variant="text"
            color=""
            class="ml-1 tab-close-btn"
            @click.stop="closeTerminal(term.id)"
          >
            <VIcon size="14">mdi-close</VIcon>
          </VBtn>
        </VTab>
      </VTabs>
    </VCol>
  </VRow>

  <!-- Terminal Containers -->
  <VRow v-if="terminals.length > 0" class="mt-0">
    <VCol cols="12">
      <!-- Loading spinner for connecting terminals -->
      <div
        v-for="term in terminals"
        :key="`loader-${term.id}`"
        v-show="activeTerminalId === term.id && term.isConnecting && !term.isVisible"
        class="terminal-loading-wrapper"
      >
        <LoadingSpinner
          icon="mdi-console"
          title="Connecting to terminal..."
          message=""
        />
      </div>

      <!-- Actual terminal containers -->
      <div
        v-for="term in terminals"
        :key="`terminal-${term.id}`"
        v-show="activeTerminalId === term.id && term.isVisible && !term.isPoppedOut"
        :ref="el => { if (el) term.element = el }"
        class="terminal-container"
      />
    </VCol>
  </VRow>


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

  <!-- Terminal Window Manager -->
  <TerminalWindowManager
    :terminals="floatingTerminalsData"
    :isOpen="isTerminalManagerOpen"
    @closeWindow="closeTerminalManager"
    @unpinTerminal="unpinTerminalFromManager"
    @closeTerminal="closeTerminalFromManager"
    @terminalReady="moveTerminalToManager"
    @reorderTerminals="handleTerminalReorder"
    @update:isOpen="isTerminalManagerOpen = $event"
  />
</template>
  
<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { SerializeAddon } from '@xterm/addon-serialize'
import { io } from 'socket.io-client'
import '@xterm/xterm/css/xterm.css'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'
import TerminalWindowManager from './TerminalWindowManager.vue'

const props = defineProps({
  appSpec: {
    type: Object,
    required: true,
  },
  selectedIp: {
    type: String,
    required: true,
  },
  logout: {
    type: Function,
    required: true,
  },
})

const { t } = useI18n()
const theme = useTheme()

// Terminal theme colors based on Vuetify theme
const terminalTheme = computed(() => {
  const isLight = theme.global.name.value === 'light'
  
  return {
    background: isLight ? '#000000' : '#000000',
    foreground: isLight ? '#ffffff' : '#ffffff',
    cursor: isLight ? '#ffffff' : '#ffffff',
    cursorAccent: isLight ? '#000000' : '#000000',
  }
})

const snackbarColor = ref("success")
const snackbar = ref(false)
const snackbarIcon = ref('')
const snackbarMessage = ref("")
const ipAccess = ref(false)

// Multiple terminals support
const terminals = ref([])
const activeTerminalId = ref(null)
let terminalIdCounter = 0

// Terminal Window Manager
const floatingTerminalsData = ref([])
const poppedOutTerminals = ref([])
const isTerminalManagerOpen = ref(false)

// Current form state for new terminals
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

function addNewTerminal() {
  const terminalId = ++terminalIdCounter
  const containerName = props.appSpec.version > 3 ? `${selectedApp.value}_${props.appSpec.name}` : props.appSpec.name

  const newTerminal = {
    id: terminalId,
    terminal: null,
    socket: null,
    element: null,
    isConnecting: true,
    isVisible: false,
    isClosing: false,
    isPoppedOut: false,
    popoutWindow: null,
    selectedApp: selectedApp.value,
    selectedCmd: selectedCmd.value,
    customValue: customValue.value,
    userInputValue: userInputValue.value,
    envInputValue: envInputValue.value,
    enableUser: enableUser.value,
    enableEnvironment: enableEnvironment.value,
    fitAddon: null,
    label: `${selectedApp.value} - ${selectedCmd.value === 'Custom' ? customValue.value : selectedCmd.value}`,
    managerLabel: `${selectedApp.value} - ${selectedCmd.value === 'Custom' ? customValue.value : selectedCmd.value} (${new Date().toLocaleTimeString()})`,
  }

  terminals.value.push(newTerminal)
  activeTerminalId.value = terminalId

  // Wait for the DOM to update and the element ref to be set
  nextTick(() => {
    // Give the template ref callback time to execute
    setTimeout(() => {
      const termData = terminals.value.find(t => t.id === terminalId)
      if (termData && termData.element) {
        connectTerminal(terminalId, containerName)
      } else {
        console.error('Terminal element not ready for terminal ID:', terminalId)
        closeTerminal(terminalId)
      }
    }, 50)
  })
}

function connectTerminal(terminalId, name) {
  const termData = terminals.value.find(t => t.id === terminalId)
  if (!termData) return

  if (!termData.element) {
    console.error('Terminal element not available for terminal ID:', terminalId)
    showToast('danger', 'Terminal element not ready')
    closeTerminal(terminalId)
    
    return
  }

  if (props.appSpec.version >= 4) {
    const found = props.appSpec.compose?.some(c => c.name === termData.selectedApp)
    if (!found) {
      showToast('danger', t('core.terminal.errors.selectContainer'))
      closeTerminal(terminalId)
      
      return
    }
  }

  if (!termData.selectedCmd || (termData.selectedCmd === 'Custom' && !termData.customValue)) {
    showToast('danger', termData.selectedCmd === 'Custom' ? t('core.terminal.errors.enterCustomCommand') : t('core.terminal.errors.noCommandSelected'))
    closeTerminal(terminalId)
    
    return
  }

  async function copySelectedText(isManual = false) {
    if (!termData.terminal) return

    const pos = termData.terminal.getSelectionPosition()
    if (!pos || !pos.start || !pos.end) {
      
      return
    }

    const { start, end } = pos
    const buffer = termData.terminal.buffer.active
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
      termData.terminal.clearSelection()
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
        termData.terminal.clearSelection()
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

  termData.isConnecting = true

  const zelidauth = localStorage.getItem('zelidauth')
  const [host, port = 16127] = props.selectedIp.split(':')

  const url = ipAccess.value
    ? `http://${host}:${port}/terminal`
    : `https://${host.replace(/\./g, '-')}-${port}.node.api.runonflux.io/terminal`

  termData.socket = io.connect(url)

  termData.terminal = new Terminal({
    allowProposedApi: true,
    cursorBlink: true,
    theme: terminalTheme.value,
  })

  termData.fitAddon = new FitAddon()

  termData.terminal.loadAddon(termData.fitAddon)
  termData.terminal.loadAddon(new WebLinksAddon())
  termData.terminal.loadAddon(new Unicode11Addon())
  termData.terminal.loadAddon(new SerializeAddon())
  termData.terminal._initialized = true

  termData.terminal.open(termData.element)

  // Note: Initial fit happens later when isVisible is set to true (see 'show' event handler)

  termData.terminal.onResize(({ cols, rows }) => {
    if (termData.socket) termData.socket.emit('resize', { cols, rows })
  })
  termData.terminal.onData(data => {
    if (termData.socket) termData.socket.emit('cmd', data)
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
  termData.terminal.onSelectionChange(debounce(() => {
    if (isCopying) {
      return
    }
    isCopying = true
    termData.terminal.focus() // Ensure terminal retains focus
    try {
      copySelectedText()
    } finally {
    // Reset the lock after a delay to allow the clipboard operation to complete
      setTimeout(() => {
        isCopying = false
      }, 300)
    }
  }, 200))

  // Note: resize handler is managed globally, not per terminal

  const user = termData.enableUser ? termData.userInputValue : ''
  const cmd = termData.customValue || termData.selectedCmd

  let consoleInit = 0
  let skipToast = 0

  // console.log('📤 Emitting exec command:')
  // console.log('  - Container name (param):', name)
  // console.log('  - Container name (selectedApp):', termData.selectedApp)
  // console.log('  - Command:', cmd)
  // console.log('  - Environment:', termData.envInputValue)
  // console.log('  - User:', user)
  // console.log('  - zelidauth:', zelidauth ? '✅ Present' : '❌ Missing')
  termData.socket.emit('exec', zelidauth, name, cmd, termData.envInputValue, user)

  termData.socket.on('error', err => {
    console.error('❌ Socket error event:', err)

    // Check if error is authorization-related
    const errorStr = typeof err === 'string' ? err : (err?.message || String(err))

    if (errorStr.toLowerCase().includes('not authorized')) {
      console.warn('🔒 Authorization error detected, triggering logout')
      termData.isConnecting = false
      closeTerminal(terminalId)

      // Trigger logout silently (logout function will show its own message)
      if (props.logout && typeof props.logout === 'function') {
        props.logout()
      }

      return
    }

    showToast('danger', t('core.terminal.errors.connectionError', { error: err }))
    termData.isConnecting = false
    closeTerminal(terminalId)
  })

  termData.socket.on('connect_error', err => {
    console.error('❌ Socket connect_error event:', err.message, err)
    showToast('danger', t('core.terminal.errors.connectionErrorWithMessage', { message: err.message }))
    termData.isConnecting = false
    closeTerminal(terminalId)
  })

  termData.socket.on('connect_timeout', () => {
    console.error('⏱️ Socket connect_timeout event')
    showToast('danger', t('core.terminal.errors.connectionTimeout'))
    termData.isConnecting = false
    closeTerminal(terminalId)
  })

  termData.socket.on('show', data => {
    // console.log('📥 Socket show event, data length:', data?.length || 0)
    if (typeof data === 'string' && consoleInit === 0 && data.includes('OCI runtime exec')) {
      skipToast = 1
      console.warn('⚠️ OCI runtime exec error detected, disconnecting')
      showToast('danger', t('core.terminal.errors.commandNotSupported', { cmd }))
      closeTerminal(terminalId)

      return
    }
    if (consoleInit === 0) {
      // console.log('🎬 Console initialized, setting up terminal environment')
      consoleInit = 1

      if (!termData.customValue) {
        termData.socket.emit('cmd', 'export TERM=xterm\n')
        if (termData.selectedCmd === '/bin/bash') {
          termData.socket.emit('cmd', 'PS1="\\[\\033[01;31m\\]\\u\\[\\033[01;33m\\]@\\[\\033[01;36m\\]\\h \\[\\033[01;33m\\]\\w \\[\\033[01;35m\\]\\$ \\[\\033[00m\\]"\n')
        }
        termData.socket.emit('cmd', "alias ls='ls --color'\n")
        termData.socket.emit('cmd', "alias ll='ls -alF'\n")
      }
      setTimeout(() => {
        nextTick(() => {
          setTimeout(() => {
            termData.isConnecting = false
            termData.isVisible = true
            termData.terminal.clear()
            nextTick(() => {
              termData.terminal.focus()
              setTimeout(() => {
                termData.fitAddon.fit()
                termData.socket.emit('resize', { cols: termData.terminal.cols, rows: termData.terminal.rows })
              }, 100)
            })
          }, 500)
        })
      }, 1400)
    }
    termData.terminal.write(data)
  })

  termData.socket.on('disconnect', reason => {
    console.warn('🔌 Socket disconnect event, reason:', reason)
    if (!skipToast) showToast('warning', t('core.terminal.warnings.disconnected'))
    closeTerminal(terminalId)
  })

  termData.socket.on('end', () => {
    // console.log('🔚 Socket end event')
    closeTerminal(terminalId)
  })

  termData.socket.on('connect', () => {
    // console.log('✅ Socket connected successfully')
  })
}

function closeTerminal(terminalId) {
  console.log('closeTerminal called with ID:', terminalId)
  const termData = terminals.value.find(t => t.id === terminalId)
  if (!termData) {
    console.warn('Terminal not found with ID:', terminalId)
    
    return
  }

  // Prevent multiple close attempts
  if (termData.isClosing) {
    console.log('Terminal is already closing, ignoring duplicate call')
    
    return
  }

  termData.isClosing = true
  console.log('Closing terminal:', termData.label)

  // Clean up terminal resources
  if (termData.socket) {
    console.log('Disconnecting socket...')

    // Remove all listeners before disconnecting to prevent recursive calls
    termData.socket.removeAllListeners()
    termData.socket.disconnect()
    termData.socket = null
  }

  if (termData.terminal) {
    console.log('Disposing terminal...')
    try {
      // Dispose terminal (this also disposes all loaded addons automatically)
      termData.terminal.dispose()
      console.log('✅ Terminal disposed successfully')
    } catch (error) {
      // Suppress known addon disposal errors that occur after terminal moves
      // These are harmless - the terminal is still properly disposed
      if (error.message && error.message.includes('Could not dispose an addon')) {
        console.warn('⚠️ Harmless addon disposal warning (occurs after unpinning):', error.message)
      } else {
        console.error('❌ Error disposing terminal:', error)
      }
    }

    // Null out references AFTER disposal for garbage collection
    termData.terminal = null
    termData.fitAddon = null
  }

  // Clear element reference to help garbage collection
  if (termData.element) {
    termData.element = null
  }

  // Update active terminal first before removing
  if (activeTerminalId.value === terminalId) {
    const remainingTerminals = terminals.value.filter(t => t.id !== terminalId)
    if (remainingTerminals.length > 0) {
      activeTerminalId.value = remainingTerminals[0].id
      console.log('Switched to terminal ID:', activeTerminalId.value)
    } else {
      activeTerminalId.value = null
      console.log('No terminals remaining')
    }
  }

  // Remove from terminals array using filter (creates new array for better reactivity)
  nextTick(() => {
    const index = terminals.value.findIndex(t => t.id === terminalId)
    console.log('Terminal index in array:', index, 'Total terminals before removal:', terminals.value.length)

    if (index !== -1) {
      terminals.value = terminals.value.filter(t => t.id !== terminalId)
      console.log('Terminal removed. Remaining terminals:', terminals.value.length)
      console.log('Remaining terminal IDs:', terminals.value.map(t => t.id))
    }
  })
}

function unpinTerminal(terminalId) {
  console.log('unpinTerminal called with ID:', terminalId)
  const termData = terminals.value.find(t => t.id === terminalId)
  if (!termData) {
    console.warn('Terminal not found with ID:', terminalId)
    
    return
  }

  // Check if already popped out
  if (termData.isPoppedOut) {
    console.log('Terminal already popped out, skipping')
    
    return
  }

  // Mark terminal as popped out
  termData.isPoppedOut = true
  if (!poppedOutTerminals.value.includes(terminalId)) {
    poppedOutTerminals.value.push(terminalId)
  }

  // Add to floating terminals data
  floatingTerminalsData.value.push({
    id: terminalId,
    label: termData.label,
    managerLabel: termData.managerLabel,
  })

  // Open the terminal manager window
  isTerminalManagerOpen.value = true

  showToast('success', `Terminal "${termData.label}" moved to terminal manager`)
}

function unpinAllTerminals() {
  console.log('🪟 Unpinning all terminals to manager')

  const terminalsToUnpin = terminals.value.filter(t => !t.isPoppedOut)

  if (terminalsToUnpin.length === 0) {
    console.log('No terminals to unpin')
    
    return
  }

  terminalsToUnpin.forEach(termData => {
    // Mark terminal as popped out
    termData.isPoppedOut = true
    if (!poppedOutTerminals.value.includes(termData.id)) {
      poppedOutTerminals.value.push(termData.id)
    }

    // Add to floating terminals data
    if (!floatingTerminalsData.value.find(t => t.id === termData.id)) {
      floatingTerminalsData.value.push({
        id: termData.id,
        label: termData.label,
        managerLabel: termData.managerLabel,
      })
    }
  })

  // Open the terminal manager window
  isTerminalManagerOpen.value = true

  showToast('success', `${terminalsToUnpin.length} terminals moved to manager`)
}

function handleTerminalReorder(newTerminalIds) {
  console.log('🔄 Reordering terminals:', newTerminalIds)

  // Reorder the terminals array based on new IDs
  const reorderedTerminals = []
  newTerminalIds.forEach(id => {
    const term = terminals.value.find(t => t.id === id)
    if (term) {
      reorderedTerminals.push(term)
    }
  })

  // Add any terminals that weren't in the reorder list (shouldn't happen but safety)
  terminals.value.forEach(term => {
    if (!reorderedTerminals.find(t => t.id === term.id)) {
      reorderedTerminals.push(term)
    }
  })

  terminals.value = reorderedTerminals
  console.log('✅ Terminals reordered')
}

function moveTerminalToManager(terminalId) {
  console.log('=== moveTerminalToManager called for ID:', terminalId)
  const termData = terminals.value.find(t => t.id === terminalId)

  if (!termData) {
    console.error('❌ Terminal data not found for ID:', terminalId)
    console.log('Available terminals:', terminals.value.map(t => t.id))
    
    return
  }

  if (!termData.terminal) {
    console.error('❌ Terminal instance not ready for ID:', terminalId)
    
    return
  }

  console.log('✅ Terminal found, isPoppedOut:', termData.isPoppedOut)

  // Wait for the manager window DOM to be ready
  // Increased timeout to allow layout watcher to complete terminal moves
  setTimeout(() => {
    const container = document.getElementById(`terminal-${terminalId}`)
    console.log('📦 Looking for container with ID:', `terminal-${terminalId}`)
    console.log('📦 Container found:', !!container)

    if (container) {
      console.log('📦 Container dimensions:', container.clientWidth, 'x', container.clientHeight)
      console.log('📦 Container parent:', container.parentElement?.className)
    }

    if (!container) {
      console.error('❌ Container not found in manager')

      // List all terminal containers
      const allTerminalContainers = document.querySelectorAll('[id^="terminal-"]')
      console.log('🔍 All terminal containers in DOM:',
        Array.from(allTerminalContainers).map(c => ({
          id: c.id,
          parent: c.parentElement?.className,
        })),
      )
      
      return
    }

    // Check if container has dimensions
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn('⚠️ Container has zero dimensions, retrying in 200ms...')
      setTimeout(() => moveTerminalToManager(terminalId), 200)
      
      return
    }

    try {
      // Check if terminal is already in this container
      const existingXterm = container.querySelector('.xterm')

      if (existingXterm) {
        console.log('♻️ Terminal already in container, just resizing')

        // Verify it's the right terminal by checking if it belongs to this termData
        const xtermViewport = existingXterm.querySelector('.xterm-viewport')
        if (xtermViewport) {
          console.log('✅ Confirmed: correct terminal already in container')
          setTimeout(() => {
            try {
              termData.fitAddon.fit()
              termData.terminal.focus()
              console.log('✅ Terminal resized after layout change')
            } catch (fitError) {
              console.error('❌ Error fitting terminal:', fitError)
            }
          }, 100)
          
          return
        }
      }

      // Terminal not in container yet, need to move it
      console.log('🚚 Moving terminal to manager container')

      // Find xterm element wherever it currently is in the DOM
      // It could be in the main container OR in an old layout container in the manager
      let xtermElement = null
      let oldContainer = null

      // First, try to find it in the main container
      if (termData.element) {
        xtermElement = termData.element.querySelector('.xterm')
        if (xtermElement) {
          oldContainer = termData.element
          console.log('📍 Found xterm in main container')
        }
      }

      // If not in main container, search ALL containers with this terminal ID
      // This handles the case where layout changed and xterm is in old layout container
      if (!xtermElement) {
        console.log('🔍 Searching for xterm in old layout containers...')
        const allContainersWithId = document.querySelectorAll(`[id="terminal-${terminalId}"]`)
        console.log(`   Found ${allContainersWithId.length} containers with id terminal-${terminalId}`)

        allContainersWithId.forEach(possibleContainer => {
          // Skip the target container
          if (possibleContainer === container) {
            console.log('   Skipping target container')
            
            return
          }

          const xterm = possibleContainer.querySelector('.xterm')
          if (xterm) {
            xtermElement = xterm
            oldContainer = possibleContainer
            console.log('📍 Found xterm in old layout container')
            console.log('   Parent class:', possibleContainer.parentElement?.className)
          }
        })
      }

      console.log('🔍 Found xterm element:', !!xtermElement)
      console.log('📍 Old container:', oldContainer?.id || oldContainer?.className)

      if (xtermElement) {
        console.log('✅ Moving existing xterm DOM element')
        console.log('   From:', oldContainer.id || oldContainer.className)
        console.log('   To:', container.id)

        // Remove from old container
        oldContainer.removeChild(xtermElement)
        console.log('✅ Removed from old container')

        // Add to new container
        container.appendChild(xtermElement)
        console.log('✅ Added to new container')

        // Verify it's there
        const verify = container.querySelector('.xterm')
        console.log('✅ Verification - xterm in new container:', !!verify)
      } else {
        console.warn('⚠️ No xterm element found, calling terminal.open()')
        termData.terminal.open(container)
      }

      // Fit and focus after moving
      setTimeout(() => {
        try {
          termData.fitAddon.fit()
          termData.terminal.focus()
          console.log('✅ Terminal resized and focused in manager')
        } catch (fitError) {
          console.error('❌ Error fitting terminal:', fitError)
        }
      }, 150)

    } catch (error) {
      console.error('❌ Error moving terminal to manager:', error)
      console.error('Stack:', error.stack)
    }
  }, 300)
}

function closeTerminalManager() {
  console.log('Closing terminal manager, pinning all terminals back')

  // Pin all terminals back
  const poppedIds = [...poppedOutTerminals.value]
  poppedIds.forEach(terminalId => {
    pinBackTerminal(terminalId)
  })

  isTerminalManagerOpen.value = false
}

function unpinTerminalFromManager(terminalId) {
  console.log('Unpinning terminal from manager:', terminalId)

  // Unpin the terminal back to main tabs
  pinBackTerminal(terminalId)

  // Check if there are any remaining terminals in the manager after unpinning
  nextTick(() => {
    if (floatingTerminalsData.value.length === 0) {
      console.log('No more terminals in manager, closing window')
      isTerminalManagerOpen.value = false
    }
  })
}

function closeTerminalFromManager(terminalId) {
  console.log('Closing terminal from manager:', terminalId)

  // Find the terminal
  const termData = terminals.value.find(t => t.id === terminalId)

  // Remove from floating terminals data first
  const floatingIndex = floatingTerminalsData.value.findIndex(t => t.id === terminalId)
  if (floatingIndex > -1) {
    floatingTerminalsData.value.splice(floatingIndex, 1)
  }

  // Remove from popped out terminals
  const popIndex = poppedOutTerminals.value.indexOf(terminalId)
  if (popIndex > -1) {
    poppedOutTerminals.value.splice(popIndex, 1)
  }

  // Mark as not popped out
  if (termData) {
    termData.isPoppedOut = false
  }

  // Close the terminal completely
  closeTerminal(terminalId)

  // Check if there are any remaining terminals in the manager
  if (floatingTerminalsData.value.length === 0) {
    console.log('No more terminals in manager, closing window')
    isTerminalManagerOpen.value = false
  }
}

function disconnectTerminal(terminalId) {
  closeTerminal(terminalId)
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

// Watch for active terminal changes - fit terminal when it becomes visible
watch(activeTerminalId, (newId, oldId) => {
  if (!newId) return

  console.log('🔄 Active terminal changed from', oldId, 'to', newId)

  // Wait for v-show to take effect
  nextTick(() => {
    setTimeout(() => {
      const activeTerm = terminals.value.find(t => t.id === newId)
      if (!activeTerm || !activeTerm.fitAddon || !activeTerm.element) {
        console.log('   Terminal not ready for fitting')
        
        return
      }

      // Check if container is now visible
      const container = activeTerm.element
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        console.log('📏 Fitting newly active terminal', newId)
        console.log('   Container dimensions:', container.clientWidth, 'x', container.clientHeight)
        activeTerm.fitAddon.fit()
        console.log('   Terminal fitted to', activeTerm.terminal.cols, 'x', activeTerm.terminal.rows)
      } else {
        console.log('⚠️ Container still has zero dimensions for terminal', newId)
      }
    }, 100)
  })
})

// Watch theme changes and update all terminal themes
watch(() => theme.global.name.value, () => {
  console.log('🎨 Theme changed, updating all terminals')
  terminals.value.forEach(term => {
    if (term.terminal) {
      term.terminal.options.theme = terminalTheme.value
    }
  })
})

// Global resize handler - only resizes active terminal
let globalResizeHandler = null

onMounted(() => {
  const { hostname } = window.location
  const regex = /[A-Z]/gi
  if (hostname.match(regex)) {
    ipAccess.value = false
  } else {
    ipAccess.value = true
  }

  // Clean up any stale terminals that don't have active socket connections
  // This happens after page refresh where sockets are lost but UI state persists
  nextTick(() => {
    const staleTerminals = terminals.value.filter(t => {
      // Check if socket exists and is connected
      return !t.socket || !t.socket.connected
    })

    if (staleTerminals.length > 0) {
      console.log(`🧹 Cleaning up ${staleTerminals.length} stale terminal(s) after page refresh`)
      staleTerminals.forEach(t => {
        // Remove from all arrays
        terminals.value = terminals.value.filter(term => term.id !== t.id)
        poppedOutTerminals.value = poppedOutTerminals.value.filter(id => id !== t.id)
        floatingTerminalsData.value = floatingTerminalsData.value.filter(fd => fd.id !== t.id)
      })

      // Reset active terminal if it was stale
      if (terminals.value.length > 0) {
        activeTerminalId.value = terminals.value[0].id
      } else {
        activeTerminalId.value = null
      }
    }

    // Also clean up floatingTerminalsData - remove any that don't have corresponding terminals
    const validTerminalIds = terminals.value.map(t => t.id)
    const floatingBeforeCleanup = floatingTerminalsData.value.length
    floatingTerminalsData.value = floatingTerminalsData.value.filter(fd =>
      validTerminalIds.includes(fd.id),
    )

    if (floatingTerminalsData.value.length < floatingBeforeCleanup) {
      console.log(`🧹 Cleaned up ${floatingBeforeCleanup - floatingTerminalsData.value.length} orphaned floating terminal entries`)
    }
  })

  // Setup global resize handler with debounce to prevent rapid fit() calls
  let resizeTimeout = null
  globalResizeHandler = () => {
    // Clear any pending resize
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }

    // Debounce the fit() call by 150ms
    resizeTimeout = setTimeout(() => {
      const activeTerm = terminals.value.find(t => t.id === activeTerminalId.value)
      if (activeTerm && activeTerm.fitAddon && activeTerm.isVisible) {
        activeTerm.fitAddon.fit()
      }
    }, 150)
  }
  window.addEventListener('resize', globalResizeHandler)

  // Setup message listener for popup windows
  window.addEventListener('message', handlePopupMessage)
})

function handlePopupMessage(event) {
  // This function is no longer needed for floating windows
  // Keeping for backwards compatibility but it does nothing
}

function pinBackTerminal(terminalId) {
  console.log('=== 📌 pinBackTerminal called for ID:', terminalId)
  const termData = terminals.value.find(t => t.id === terminalId)

  if (!termData) {
    console.error('❌ Terminal not found with ID:', terminalId)
    console.log('Available terminals:', terminals.value.map(t => ({ id: t.id, label: t.label })))
    
    return
  }

  console.log('✅ Terminal found:', termData.label, 'isPoppedOut:', termData.isPoppedOut)

  // Check if already pinned back
  if (!termData.isPoppedOut) {
    console.log('⚠️ Terminal already pinned back, skipping')
    
    return
  }

  console.log('🚚 Starting DOM element move back to main view - FIRST before removing from arrays')

  // IMPORTANT: Extract xterm element SYNCHRONOUSLY before removing from arrays
  // Otherwise Vue might destroy the manager window and we lose the element

  const mainContainer = termData.element
  console.log('📦 Main container:', mainContainer)

  if (!mainContainer) {
    console.error('❌ Main container (termData.element) not found')
    
    return
  }

  // Find and extract xterm element NOW before any state changes
  let managerContainer = null
  let xtermElement = null

  // Try to find the specific container
  const specificContainer = document.getElementById(`terminal-${terminalId}`)
  if (specificContainer && specificContainer !== mainContainer) {
    xtermElement = specificContainer.querySelector('.xterm')
    if (xtermElement) {
      managerContainer = specificContainer
      console.log('✅ Found xterm in specific manager container:', specificContainer.id)
    }
  }

  // If not found, search all terminal containers
  if (!xtermElement) {
    console.log('🔍 Searching all terminal containers for xterm element...')
    const allContainers = document.querySelectorAll('[id^="terminal-"]')
    console.log('📋 All terminal containers found:', allContainers.length)

    for (const container of allContainers) {
      if (container === mainContainer) continue // Skip main container

      const possibleXterm = container.querySelector('.xterm')
      if (possibleXterm && container.id === `terminal-${terminalId}`) {
        xtermElement = possibleXterm
        managerContainer = container
        console.log('✅ Found xterm in container:', container.id)
        break
      }
    }
  }

  if (!xtermElement) {
    console.error('❌ XTerm element not found in manager')
    console.log('🔍 Debug: Listing all containers with class or id containing "terminal":')
    document.querySelectorAll('[id*="terminal"], [class*="terminal"]').forEach(el => {
      console.log('  -', el.id || el.className, 'has .xterm:', !!el.querySelector('.xterm'))
    })
    
    return
  }

  console.log('✅ Found xterm element, extracting NOW')

  // Extract the element immediately before any Vue updates
  managerContainer.removeChild(xtermElement)
  console.log('✅ Removed xterm from manager container')

  // NOW update state - Vue can destroy the manager window safely
  const popIndex = poppedOutTerminals.value.indexOf(terminalId)
  if (popIndex > -1) {
    poppedOutTerminals.value.splice(popIndex, 1)
    console.log('✅ Removed from poppedOutTerminals array')
  }

  const floatingIndex = floatingTerminalsData.value.findIndex(t => t.id === terminalId)
  if (floatingIndex > -1) {
    floatingTerminalsData.value.splice(floatingIndex, 1)
    console.log('✅ Removed from floatingTerminalsData array')
  }

  termData.isPoppedOut = false
  console.log('✅ Set isPoppedOut=false')

  // Set this terminal as active when unpinning
  activeTerminalId.value = terminalId
  console.log('✅ Set as active terminal:', terminalId)

  // Wait for Vue to update DOM
  nextTick(() => {
    setTimeout(() => {
      console.log('📦 Main container display after Vue update:', window.getComputedStyle(mainContainer).display)
      console.log('📦 Main container dimensions after Vue update:', mainContainer.clientWidth, 'x', mainContainer.clientHeight)

      // The container might have zero dimensions if this terminal is not active
      // That's OK - we'll add the xterm and it will resize when user switches to this tab
      appendAndFitTerminal()

      function appendAndFitTerminal() {
        try {
          console.log('✅ Adding xterm to main container')
          console.log('📦 Main container display:', window.getComputedStyle(mainContainer).display)
          console.log('📦 Main container dimensions:', mainContainer.clientWidth, 'x', mainContainer.clientHeight)

          mainContainer.appendChild(xtermElement)
          console.log('✅ Added xterm to main container')

          // Force reset inline styles that might have been set by the manager window
          const xtermDiv = mainContainer.querySelector('.xterm')
          if (xtermDiv) {
          // Remove any fixed width/height that might have been set
            xtermDiv.style.width = ''
            xtermDiv.style.height = ''

            // Also reset viewport and screen styles
            const viewport = xtermDiv.querySelector('.xterm-viewport')
            const screen = xtermDiv.querySelector('.xterm-screen')
            if (viewport) {
              viewport.style.width = ''
              viewport.style.height = ''
            }
            if (screen) {
              screen.style.width = ''
              screen.style.height = ''
            }

            // Reset all canvas elements (this is critical!)
            const canvases = xtermDiv.querySelectorAll('canvas')
            canvases.forEach(canvas => {
              canvas.style.width = ''
              canvas.style.height = ''
            })

            console.log('✅ Reset xterm inline styles (including', canvases.length, 'canvas elements)')
          }

          // Verify
          const verify = mainContainer.querySelector('.xterm')
          console.log('✅ Verification - xterm now in main container:', !!verify)

          // Wait a bit before trying to fit
          setTimeout(() => {
            try {
              console.log('📦 Container dimensions before fit:', mainContainer.clientWidth, 'x', mainContainer.clientHeight)
              console.log('📺 Terminal cols x rows before fit:', termData.terminal.cols, 'x', termData.terminal.rows)

              console.log('🔧 Fitting terminal to main container...')

              // Reset inline styles first to remove any size constraints from manager window
              const xtermDiv = mainContainer.querySelector('.xterm')
              if (xtermDiv) {
                xtermDiv.style.width = ''
                xtermDiv.style.height = ''
                const canvases = xtermDiv.querySelectorAll('canvas')
                canvases.forEach(canvas => {
                  canvas.style.width = ''
                  canvas.style.height = ''
                })
                console.log('✅ Reset xterm inline styles')
              }

              // Only focus if container is visible (has dimensions)
              if (mainContainer.clientWidth > 0 && mainContainer.clientHeight > 0) {
              // Fit once immediately
                termData.fitAddon.fit()
                console.log('📺 Terminal fitted:', termData.terminal.cols, 'x', termData.terminal.rows)
                termData.terminal.focus()
                console.log('✅ Terminal fitted and focused in main view')

                // Do one final fit after layout stabilizes
                setTimeout(() => {
                  termData.fitAddon.fit()
                  console.log('📺 Final fit:', termData.terminal.cols, 'x', termData.terminal.rows)
                }, 300)
              } else {
              // Container not visible yet (inactive tab), fit when it becomes active
                console.log('⚠️ Container not visible, will fit when tab becomes active')
              }
            } catch (fitError) {
              console.error('❌ Error fitting terminal:', fitError)
            }
          }, 150)
        } catch (error) {
          console.error('❌ Error adding terminal to main view:', error)
          console.error('Stack:', error.stack)
        }
      }
    }, 100)
  })

  console.log('📣 Showing success toast')
  showToast('success', `Terminal "${termData.label}" pinned back`)
}

onBeforeUnmount(() => {
  // Remove global resize handler
  if (globalResizeHandler) {
    window.removeEventListener('resize', globalResizeHandler)
  }

  // Remove message listener
  window.removeEventListener('message', handlePopupMessage)

  // Close all terminals
  terminals.value.forEach(term => {
    closeTerminal(term.id)
  })
})
</script>
  
  <style scoped>
  .terminal-container {
    width: 100%;
    height: 400px;
    border: 1px solid #ccc;
    border-radius: 6px;
    overflow: hidden;
  }

  .terminal-loading-wrapper {
    width: 100%;
    min-height: 400px;
    border: 1px solid #ccc;
    border-radius: 6px;
  }

  .terminal-loading-wrapper :deep(.loading-container) {
    min-height: 400px;
    margin-top: 0;
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

/* Terminal tabs styling - active tab as button, inactive as text only */
.terminal-tabs :deep(.v-tab) {
  margin-right: 8px;
  border-radius: 24px;
  text-transform: none;
  min-height: 28px;
  padding: 4px 12px;
  transition: all 0.2s ease;
  background-color: transparent !important;
  font-size: 0.875rem;
}

.terminal-tabs :deep(.v-tab--selected) {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
}

.terminal-tabs :deep(.v-tab) {
  display: flex !important;
  align-items: center !important;
}

.terminal-tabs :deep(.terminal-tab-icon) {
  display: inline-flex !important;
  align-items: center !important;
}

.terminal-tabs :deep(.v-tab--selected) .terminal-tab-icon,
.terminal-tabs :deep(.v-tab--selected) .terminal-tab-text {
  color: white !important;
}

.terminal-tabs :deep(.v-tab:not(.v-tab--selected)) {
  background-color: transparent !important;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

.terminal-tabs :deep(.v-tab:not(.v-tab--selected)) .terminal-tab-icon,
.terminal-tabs :deep(.v-tab:not(.v-tab--selected)) .terminal-tab-text {
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

.terminal-tabs :deep(.v-tab:not(.v-tab--selected):hover) {
  background-color: rgba(var(--v-theme-on-surface), 0.08) !important;
  color: rgba(var(--v-theme-on-surface), 0.87) !important;
}

.terminal-tabs :deep(.v-tab:not(.v-tab--selected):hover) .terminal-tab-icon,
.terminal-tabs :deep(.v-tab:not(.v-tab--selected):hover) .terminal-tab-text {
  color: rgba(var(--v-theme-on-surface), 0.87) !important;
}

/* Hide the slider indicator and bottom border */
.terminal-tabs :deep(.v-tabs-slider) {
  display: none !important;
}

.terminal-tabs :deep(.v-slide-group__content) {
  border-bottom: none !important;
}

.terminal-tabs {
  box-shadow: none !important;
  border-bottom: none !important;
}

.terminal-tabs :deep(.v-tabs-bar) {
  border-bottom: none !important;
}

.terminal-tabs :deep(.v-slide-group) {
  border-bottom: none !important;
}

.terminal-tabs :deep(.v-slide-group__container) {
  border-bottom: none !important;
}

/* Remove any divider lines */
.terminal-tabs::after,
.terminal-tabs :deep(*)::after {
  border-bottom: none !important;
}

/* Unpin button styling - icon only with hover effect */
.terminal-tabs :deep(.unpin-btn),
.terminal-tabs :deep(.tab-close-btn) {
  border-radius: 50% !important;
  width: 25px !important;
  height: 25px !important;
  min-width: 25px !important;
}

.v-theme--dark .terminal-tabs :deep(.unpin-btn),
.v-theme--dark .terminal-tabs :deep(.unpin-btn .v-icon),
.v-theme--dark .terminal-tabs :deep(.unpin-btn svg) {
  color: white !important;
  fill: currentColor !important;
}

.v-theme--dark .terminal-tabs :deep(.unpin-btn:hover) {
  background-color: rgba(255, 255, 255, 0.3) !important;
}

.v-theme--light .terminal-tabs :deep(.unpin-btn),
.v-theme--light .terminal-tabs :deep(.unpin-btn .v-icon),
.v-theme--light .terminal-tabs :deep(.unpin-btn svg) {
  color: rgba(0, 0, 0, 0.7) !important;
  fill: currentColor !important;
}

.v-theme--light .terminal-tabs :deep(.unpin-btn:hover) {
  background-color: rgba(0, 0, 0, 0.15) !important;
}

.v-theme--light .terminal-tabs :deep(.v-tab--selected .unpin-btn),
.v-theme--light .terminal-tabs :deep(.v-tab--selected .unpin-btn .v-icon),
.v-theme--light .terminal-tabs :deep(.v-tab--selected .unpin-btn svg) {
  color: white !important;
  fill: currentColor !important;
}

.v-theme--light .terminal-tabs :deep(.v-tab--selected .unpin-btn:hover) {
  background-color: rgba(255, 255, 255, 0.4) !important;
}

/* Tab close button styling - match terminal manager */
/* Light theme - dark on inactive tabs */
.v-theme--light .terminal-tabs :deep(.tab-close-btn),
.v-theme--light .terminal-tabs :deep(.tab-close-btn .v-icon),
.v-theme--light .terminal-tabs :deep(.tab-close-btn svg) {
  color: rgba(0, 0, 0, 0.7) !important;
  fill: currentColor !important;
}

/* Light theme - white on active tab */
.v-theme--light .terminal-tabs :deep(.v-tab--selected .tab-close-btn),
.v-theme--light .terminal-tabs :deep(.v-tab--selected .tab-close-btn .v-icon),
.v-theme--light .terminal-tabs :deep(.v-tab--selected .tab-close-btn svg) {
  color: white !important;
  fill: currentColor !important;
}

/* Dark theme - white */
.v-theme--dark .terminal-tabs :deep(.tab-close-btn),
.v-theme--dark .terminal-tabs :deep(.tab-close-btn .v-icon),
.v-theme--dark .terminal-tabs :deep(.tab-close-btn svg) {
  color: white !important;
  fill: currentColor !important;
}

/* Red hover for all close buttons */
.terminal-tabs :deep(.tab-close-btn:hover) {
  background: rgb(var(--v-theme-error)) !important;
  color: #ffffff !important;
}

.terminal-tabs :deep(.tab-close-btn:hover .v-btn__overlay) {
  opacity: 0 !important;
}

.terminal-tabs :deep(.tab-close-btn:hover .v-icon),
.terminal-tabs :deep(.tab-close-btn:hover svg) {
  color: #ffffff !important;
  fill: currentColor !important;
}

/* Pop out all button styling - match import spec button */
.border-frame-btn {
  height: 38px !important;
  min-height: 38px !important;
}

.border-frame-btn.v-btn--icon {
  width: 38px !important;
}

.import-glow-btn {
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.6) !important;
  transition: all 0.3s ease !important;
}

.import-glow-btn:hover {
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.9) !important;
  transform: scale(1.05);
}
</style>
