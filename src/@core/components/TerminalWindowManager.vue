<template>
  <Teleport to="body">
    <div v-if="isOpen" class="terminal-window-manager-overlay">
      <DraggableResizableVue
        v-model:x="windowX"
        v-model:y="windowY"
        v-model:w="windowW"
        v-model:h="windowH"
        v-model:active="windowActive"
        :minWidth="800"
        :minHeight="600"
        :maxWidth="viewportWidth"
        :maxHeight="viewportHeight"
        :draggable="!isMaximized"
        :resizable="!isMaximized"
        :parent="false"
        :z="99999"
        :className="isMaximized ? 'terminal-manager-window maximized' : 'terminal-manager-window'"
        classNameActive="terminal-manager-window-active"
      >
        <div class="window-container">
          <!-- Title Bar -->
          <div class="window-titlebar" @dblclick="toggleMaximize" @mousedown="isMaximized ? $event.stopPropagation() : null">
            <div class="titlebar-left">
              <VIcon size="18" class="mr-2">mdi-console-line</VIcon>
              <span class="window-title">{{ t('core.terminal.manager.title') }}</span>
              <VChip size="small" color="success" class="ml-1 terminal-count-chip">{{ terminals.length }}</VChip>
            </div>

            <div class="titlebar-center">
              <!-- Layout Mode Selector -->
              <div class="view-toggle-modern">
                <VBtn
                  :variant="layoutMode === 'grid' ? 'flat' : 'text'"
                  :color="layoutMode === 'grid' ? 'primary' : undefined"
                  size="x-small"
                  height="24"
                  width="24"
                  class="view-toggle-btn"
                  @click="layoutMode = 'grid'"
                >
                  <VIcon icon="mdi-view-grid" size="18" />
                  <VTooltip activator="parent" location="bottom">{{ t('core.terminal.manager.layoutGrid') }}</VTooltip>
                </VBtn>

                <VBtn
                  :variant="layoutMode === 'horizontal' ? 'flat' : 'text'"
                  :color="layoutMode === 'horizontal' ? 'primary' : undefined"
                  size="x-small"
                  height="24"
                  width="24"
                  class="view-toggle-btn"
                  @click="layoutMode = 'horizontal'"
                >
                  <VIcon icon="mdi-view-column" size="18" />
                  <VTooltip activator="parent" location="bottom">{{ t('core.terminal.manager.layoutHorizontal') }}</VTooltip>
                </VBtn>

                <VBtn
                  :variant="layoutMode === 'vertical' ? 'flat' : 'text'"
                  :color="layoutMode === 'vertical' ? 'primary' : undefined"
                  size="x-small"
                  height="24"
                  width="24"
                  class="view-toggle-btn"
                  @click="layoutMode = 'vertical'"
                >
                  <VIcon icon="mdi-view-stream" size="18" />
                  <VTooltip activator="parent" location="bottom">{{ t('core.terminal.manager.layoutVertical') }}</VTooltip>
                </VBtn>
              </div>
            </div>

            <div class="titlebar-right">
              <VBtn
                icon
                size="small"
                variant="text"
                color=""
                @click="toggleMaximize"
                class="control-btn"
              >
                <VIcon size="16">{{ isMaximized ? 'mdi-window-restore' : 'mdi-window-maximize' }}</VIcon>
              </VBtn>
              <VBtn
                icon
                size="small"
                variant="text"
                color=""
                @click="closeWindow"
                class="control-btn close-btn"
              >
                <VIcon size="16">mdi-close</VIcon>
              </VBtn>
            </div>
          </div>

          <!-- Content Area -->
          <div class="window-content">
            <!-- Grid Mode -->
            <div v-if="layoutMode === 'grid'" class="grid-layout">
              <div
                v-for="term in localTerminals"
                :key="`grid-terminal-${term.id}`"
                class="grid-item"
                :class="{ 'dragging': draggedTerminalId === term.id }"
                :style="getGridItemStyle()"
                @dragover="onDragOver($event)"
                @drop="onDrop($event, term.id)"
              >
                <div
                  class="pane-header"
                  draggable="true"
                  @dragstart="onDragStart($event, term.id)"
                  @dragend="onDragEnd"
                  @mousedown.stop
                  style="cursor: move;"
                >
                  <VIcon size="16" class="mr-1 drag-handle">mdi-drag</VIcon>
                  <span class="pane-title">{{ term.managerLabel || term.label }}</span>
                  <div class="pane-buttons">
                    <VBtn
                      icon
                      size="x-small"
                      variant="text"
                      color=""
                      class="control-btn unpin-btn-manager"
                      @click="unpinTerminal(term.id)"
                      @mousedown.stop
                    >
                      <VIcon size="14">mdi-pin-off</VIcon>
                      <VTooltip activator="parent" location="left">{{ t('core.terminal.manager.unpinToTabs') }}</VTooltip>
                    </VBtn>
                    <VBtn
                      icon
                      size="x-small"
                      variant="text"
                      color=""
                      class="control-btn close-btn"
                      @click="closeTerminal(term.id)"
                      @mousedown.stop
                    >
                      <VIcon size="14">mdi-close</VIcon>
                      <VTooltip activator="parent" location="left">{{ t('core.terminal.manager.closeTerminal') }}</VTooltip>
                    </VBtn>
                  </div>
                </div>
                <div
                  :id="`terminal-${term.id}`"
                  class="terminal-pane"
                  @mousedown.stop
                />
              </div>
            </div>

            <!-- Horizontal Split Mode -->
            <div v-else-if="layoutMode === 'horizontal'" class="horizontal-layout">
              <div
                v-for="term in localTerminals"
                :key="`horiz-terminal-${term.id}`"
                class="horizontal-item"
                :class="{ 'dragging': draggedTerminalId === term.id }"
                :style="{ width: `${100 / localTerminals.length}%` }"
                @dragover="onDragOver($event)"
                @drop="onDrop($event, term.id)"
              >
                <div
                  class="pane-header"
                  draggable="true"
                  @dragstart="onDragStart($event, term.id)"
                  @dragend="onDragEnd"
                  @mousedown.stop
                  style="cursor: move;"
                >
                  <VIcon size="16" class="mr-1 drag-handle">mdi-drag</VIcon>
                  <span class="pane-title">{{ term.managerLabel || term.label }}</span>
                  <div class="pane-buttons">
                    <VBtn
                      icon
                      size="x-small"
                      variant="text"
                      color=""
                      class="control-btn unpin-btn-manager"
                      @click="unpinTerminal(term.id)"
                      @mousedown.stop
                    >
                      <VIcon size="14">mdi-pin-off</VIcon>
                      <VTooltip activator="parent" location="left">{{ t('core.terminal.manager.unpinToTabs') }}</VTooltip>
                    </VBtn>
                    <VBtn
                      icon
                      size="x-small"
                      variant="text"
                      color=""
                      class="control-btn close-btn"
                      @click="closeTerminal(term.id)"
                      @mousedown.stop
                    >
                      <VIcon size="14">mdi-close</VIcon>
                      <VTooltip activator="parent" location="left">{{ t('core.terminal.manager.closeTerminal') }}</VTooltip>
                    </VBtn>
                  </div>
                </div>
                <div
                  :id="`terminal-${term.id}`"
                  class="terminal-pane"
                  @mousedown.stop
                />
              </div>
            </div>

            <!-- Vertical Split Mode -->
            <div v-else-if="layoutMode === 'vertical'" class="vertical-layout">
              <div
                v-for="term in localTerminals"
                :key="`vert-terminal-${term.id}`"
                class="vertical-item"
                :class="{ 'dragging': draggedTerminalId === term.id }"
                :style="{ height: `${100 / localTerminals.length}%` }"
                @dragover="onDragOver($event)"
                @drop="onDrop($event, term.id)"
              >
                <div
                  class="pane-header"
                  draggable="true"
                  @dragstart="onDragStart($event, term.id)"
                  @dragend="onDragEnd"
                  @mousedown.stop
                  style="cursor: move;"
                >
                  <VIcon size="16" class="mr-1 drag-handle">mdi-drag</VIcon>
                  <span class="pane-title">{{ term.managerLabel || term.label }}</span>
                  <div class="pane-buttons">
                    <VBtn
                      icon
                      size="x-small"
                      variant="text"
                      color=""
                      class="control-btn unpin-btn-manager"
                      @click="unpinTerminal(term.id)"
                      @mousedown.stop
                    >
                      <VIcon size="14">mdi-pin-off</VIcon>
                      <VTooltip activator="parent" location="left">{{ t('core.terminal.manager.unpinToTabs') }}</VTooltip>
                    </VBtn>
                    <VBtn
                      icon
                      size="x-small"
                      variant="text"
                      color=""
                      class="control-btn close-btn"
                      @click="closeTerminal(term.id)"
                      @mousedown.stop
                    >
                      <VIcon size="14">mdi-close</VIcon>
                      <VTooltip activator="parent" location="left">{{ t('core.terminal.manager.closeTerminal') }}</VTooltip>
                    </VBtn>
                  </div>
                </div>
                <div
                  :id="`terminal-${term.id}`"
                  class="terminal-pane"
                  @mousedown.stop
                />
              </div>
            </div>
          </div>
        </div>
      </DraggableResizableVue>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, computed, onMounted, onBeforeUnmount } from 'vue'
import DraggableResizableVue from 'draggable-resizable-vue3'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  terminals: {
    type: Array,
    default: () => [],
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['closeWindow', 'closeTerminal', 'unpinTerminal', 'terminalReady', 'update:isOpen', 'reorderTerminals'])
const theme = useTheme()
const { t } = useI18n()

// Calculate initial size based on viewport (80% of viewport, max 1200x800)
// Use clientWidth/clientHeight to exclude scrollbars
const viewportWidth = document.documentElement.clientWidth
const viewportHeight = document.documentElement.clientHeight
const initialWidth = Math.min(Math.floor(viewportWidth * 0.8), 1200)
const initialHeight = Math.min(Math.floor(viewportHeight * 0.8), 800)
const initialX = Math.floor((viewportWidth - initialWidth) / 2)
const initialY = Math.floor((viewportHeight - initialHeight) / 2)

const windowX = ref(initialX)
const windowY = ref(initialY)
const windowW = ref(initialWidth)
const windowH = ref(initialHeight)
const windowActive = ref(true)
const isMaximized = ref(false)
const layoutMode = ref('grid')
const activeTerminalId = ref(null)

// Local copy of terminals for reordering
const localTerminals = ref([])
const draggedTerminalId = ref(null)

// Sync local terminals with props and validate they exist
watch(() => props.terminals, newTerminals => {
  // Only include terminals that have valid IDs and aren't duplicates
  const validTerminals = newTerminals.filter((term, index, self) => {
    // Check for valid ID
    if (!term.id) return false

    // Check not duplicate
    return index === self.findIndex(t => t.id === term.id)
  })

  localTerminals.value = [...validTerminals]

  // Log if we filtered anything out
  if (validTerminals.length !== newTerminals.length) {
    console.log(`🧹 Filtered out ${newTerminals.length - validTerminals.length} invalid terminal(s) from manager`)
  }
}, { immediate: true, deep: true })

// Store original dimensions for restore
const originalX = ref(initialX)
const originalY = ref(initialY)
const originalW = ref(initialWidth)
const originalH = ref(initialHeight)

// Maximize window when it opens
watch(() => props.isOpen, isOpen => {
  if (isOpen) {
    // Always maximize on open
    windowX.value = 0
    windowY.value = 0
    windowW.value = document.documentElement.clientWidth
    windowH.value = document.documentElement.clientHeight
    isMaximized.value = true
  }
})

// Watch for terminals being added
watch(() => props.terminals, newTerminals => {
  if (newTerminals.length > 0 && !activeTerminalId.value) {
    activeTerminalId.value = newTerminals[0].id
  }

  // Notify parent that containers are ready
  nextTick(() => {
    newTerminals.forEach(term => {
      const container = document.getElementById(`terminal-${term.id}`)
      if (container) {
        emit('terminalReady', term.id)
      }
    })
  })
}, { deep: true, immediate: true })

// Store xterm elements temporarily during layout changes
const savedXtermElements = new Map()

// Watch for layout mode changes - MUST use flush: 'sync' to run before Vue updates DOM
watch(layoutMode, (newMode, oldMode) => {
  console.log('🔄 Layout mode changing from', oldMode, 'to', newMode)

  // Extract all xterm elements NOW before Vue destroys the old layout
  savedXtermElements.clear()
  props.terminals.forEach(term => {
    const container = document.getElementById(`terminal-${term.id}`)
    if (container) {
      const xtermElement = container.querySelector('.xterm')
      if (xtermElement) {
        console.log(`💾 Saving xterm element for terminal ${term.id}`)

        // Remove from DOM to prevent Vue from destroying it
        container.removeChild(xtermElement)
        savedXtermElements.set(term.id, xtermElement)
      }
    }
  })
}, { flush: 'sync' })

// Second watcher to restore elements AFTER Vue creates new layout
watch(layoutMode, (newMode, oldMode) => {
  // This runs AFTER Vue updates the DOM
  nextTick(() => {
    setTimeout(() => {
      console.log('📦 New layout DOM ready, restoring xterm elements')

      props.terminals.forEach(term => {
        const xtermElement = savedXtermElements.get(term.id)
        if (!xtermElement) {
          console.warn(`  ⚠️ No saved xterm element for terminal ${term.id}`)
          emit('terminalReady', term.id)

          return
        }

        const newContainer = document.getElementById(`terminal-${term.id}`)
        if (!newContainer) {
          console.error(`  ❌ New container not found for terminal ${term.id}`)
          emit('terminalReady', term.id)

          return
        }

        console.log(`  ♻️ Restoring xterm element to terminal ${term.id}`)
        newContainer.appendChild(xtermElement)
        console.log(`  ✅ Restore complete`)

        // Wait a bit before emitting ready
        setTimeout(() => {
          emit('terminalReady', term.id)
        }, 50)
      })

      // Clear saved elements
      savedXtermElements.clear()
    }, 100)
  })
})

function toggleMaximize() {
  if (isMaximized.value) {
    // Restore
    windowX.value = originalX.value
    windowY.value = originalY.value
    windowW.value = originalW.value
    windowH.value = originalH.value
    isMaximized.value = false
  } else {
    // Save current position
    originalX.value = windowX.value
    originalY.value = windowY.value
    originalW.value = windowW.value
    originalH.value = windowH.value

    // Maximize
    windowX.value = 0
    windowY.value = 0
    windowW.value = document.documentElement.clientWidth
    windowH.value = document.documentElement.clientHeight
    isMaximized.value = true
  }

  // Refit terminals after resize
  setTimeout(() => {
    props.terminals.forEach(term => {
      emit('terminalReady', term.id)
    })
  }, 150)
}

function closeWindow() {
  emit('closeWindow')
  emit('update:isOpen', false)
}

function unpinTerminal(terminalId) {
  emit('unpinTerminal', terminalId)
}

function closeTerminal(terminalId) {
  emit('closeTerminal', terminalId)
}

function getGridItemStyle() {
  const count = localTerminals.value.length
  if (count === 1) return { width: '100%', height: '100%' }
  if (count === 2) return { width: '50%', height: '100%' }
  if (count === 3) return { width: '33.33%', height: '100%' }
  if (count === 4) return { width: '50%', height: '50%' }

  // For more than 4, create a dynamic grid
  const cols = Math.ceil(Math.sqrt(count))
  
  return { width: `${100 / cols}%`, height: `${100 / Math.ceil(count / cols)}%` }
}

// Drag and drop handlers for reordering
function onDragStart(event, terminalId) {
  // Stop propagation to prevent dragging the window
  event.stopPropagation()

  draggedTerminalId.value = terminalId
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', terminalId)
  console.log('🎯 Drag started:', terminalId)
}

function onDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

function onDrop(event, targetTerminalId) {
  event.preventDefault()

  const draggedId = draggedTerminalId.value
  if (!draggedId || draggedId === targetTerminalId) return

  console.log('🔄 Reordering:', draggedId, '→', targetTerminalId)

  // Find indices
  const draggedIndex = localTerminals.value.findIndex(t => t.id === draggedId)
  const targetIndex = localTerminals.value.findIndex(t => t.id === targetTerminalId)

  if (draggedIndex === -1 || targetIndex === -1) return

  // Reorder array
  const newTerminals = [...localTerminals.value]
  const [draggedItem] = newTerminals.splice(draggedIndex, 1)
  newTerminals.splice(targetIndex, 0, draggedItem)

  localTerminals.value = newTerminals
  draggedTerminalId.value = null

  // Emit to parent
  emit('reorderTerminals', newTerminals.map(t => t.id))

  console.log('✅ Reorder complete')
}

function onDragEnd() {
  draggedTerminalId.value = null
}

// Handle window resize - update maximized window dimensions
let resizeHandler = null

onMounted(() => {
  resizeHandler = () => {
    if (isMaximized.value) {
      windowW.value = document.documentElement.clientWidth
      windowH.value = document.documentElement.clientHeight
    }
  }
  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
})
</script>

<style scoped>
.terminal-window-manager-overlay {
  position: fixed;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  pointer-events: none;
  z-index: 99998 !important;
  overflow: visible !important;
}

:deep(.terminal-manager-window) {
  pointer-events: auto;
  background: rgb(var(--v-theme-surface));
  border: 3px solid rgba(var(--v-theme-outline), 0.5);
  border-radius: 8px;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
  overflow: visible !important;
}

.v-theme--light :deep(.terminal-manager-window) {
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.15);
  border-color: rgba(var(--v-theme-outline), 0.6);
}

.v-theme--dark :deep(.terminal-manager-window) {
  border-color: rgba(var(--v-theme-outline), 0.6);
}

:deep(.terminal-manager-window.maximized) {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

:deep(.terminal-manager-window-active) {
  border-color: rgb(var(--v-theme-primary));
}

.v-theme--dark :deep(.terminal-manager-window-active) {
  box-shadow: 0 10px 60px rgba(var(--v-theme-primary), 0.5);
}

.v-theme--light :deep(.terminal-manager-window-active) {
  box-shadow: 0 10px 50px rgba(var(--v-theme-primary), 0.25);
}

.window-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
  overflow: visible;
}

/* Title Bar */
.window-titlebar {
  background: rgb(var(--v-theme-surface));
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
  flex-shrink: 0;
  user-select: none;
  min-height: 48px;
}

.v-theme--light .window-titlebar {
  background: rgba(var(--v-theme-surface-variant), 0.6);
}

/* Remove drag cursor when maximized */
:deep(.terminal-manager-window.maximized) .window-titlebar {
  cursor: default !important;
}

.titlebar-left,
.titlebar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.titlebar-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0;
}

.titlebar-right {
  justify-content: flex-end;
}

.window-title {
  color: rgb(var(--v-theme-on-surface));
  font-size: 16px;
  font-weight: 600;
}

.terminal-count-chip {
  font-weight: 600;
  height: 22px !important;
}

/* Modern View Toggle - FluxDrive Style */
.view-toggle-modern {
  display: inline-flex !important;
  gap: 8px !important;
  padding: 4px 8px !important;
  border-radius: 8px !important;
  align-items: center !important;
  height: 32px !important;
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.v-theme--dark .view-toggle-modern {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(var(--v-theme-outline), 0.3);
}

.v-theme--light .view-toggle-modern {
  background: rgba(0, 0, 0, 0.06) !important;
  border-color: rgba(var(--v-theme-outline), 0.15);
}

.view-toggle-btn {
  min-height: 24px !important;
  height: 24px !important;
  min-width: unset !important;
  width: 24px !important;
  padding: 0 !important;
  margin: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 6px !important;
  flex-shrink: 0 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.view-toggle-btn:not(.v-btn--variant-flat) {
  background: transparent !important;
}

.view-toggle-btn:not(.v-btn--variant-flat):hover {
  background: rgba(var(--v-theme-on-surface), 0.08) !important;
}

.view-toggle-btn.v-btn--variant-flat {
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  transform: translateY(-1px);
}

.v-theme--dark .view-toggle-btn.v-btn--variant-flat {
  box-shadow:
    0 2px 8px rgba(var(--v-theme-primary), 0.4),
    0 1px 3px rgba(0,0,0,0.3);
}

.v-theme--light .view-toggle-btn.v-btn--variant-flat {
  box-shadow:
    0 2px 4px rgba(var(--v-theme-primary), 0.25),
    0 1px 2px rgba(0,0,0,0.1);
}

.view-toggle-btn.v-btn--variant-flat,
.view-toggle-btn.v-btn--variant-text {
  min-height: 24px !important;
  height: 24px !important;
  min-width: unset !important;
  width: 24px !important;
  padding: 0 !important;
  align-self: center !important;
}

.view-toggle-btn :deep(.v-btn__overlay),
.view-toggle-btn :deep(.v-btn__underlay) {
  border-radius: 6px !important;
  top: 0 !important;
  left: 0 !important;
}

.view-toggle-btn :deep(.v-btn__content) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 24px !important;
  width: 24px !important;
  line-height: 24px !important;
  position: relative !important;
  top: 0 !important;
}

.view-toggle-btn :deep(.v-icon) {
  margin: 0 !important;
  line-height: 1 !important;
  position: relative !important;
  top: 0 !important;
}

.view-toggle-btn.v-btn--variant-text {
  color: rgba(var(--v-theme-on-surface), 0.87) !important;
}

.v-theme--light .view-toggle-btn.v-btn--variant-text {
  color: rgba(0, 0, 0, 0.6) !important;
}

.v-theme--light .view-toggle-btn.v-btn--variant-text :deep(.v-icon) {
  color: rgba(0, 0, 0, 0.6) !important;
}

.v-theme--dark .view-toggle-btn.v-btn--variant-text {
  color: rgba(255, 255, 255, 0.7) !important;
}

.v-theme--dark .view-toggle-btn.v-btn--variant-text :deep(.v-icon) {
  color: rgba(255, 255, 255, 0.7) !important;
}

.view-toggle-btn.v-btn--variant-text:hover {
  background: rgba(var(--v-theme-on-surface), 0.08) !important;
}

.v-theme--light .control-btn.text-primary,
.v-theme--light .control-btn {
  color: #404040 !important;
}

.v-theme--light .control-btn :deep(.v-icon),
.v-theme--light .control-btn :deep(svg) {
  color: #404040 !important;
  fill: currentColor !important;
}

.v-theme--dark .control-btn.text-primary,
.v-theme--dark .control-btn {
  color: #808080 !important;
}

.v-theme--dark .control-btn :deep(.v-icon),
.v-theme--dark .control-btn :deep(svg) {
  color: #808080 !important;
  fill: currentColor !important;
}

.control-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.close-btn:hover,
.close-btn:hover :deep(.v-icon),
.close-btn:hover :deep(svg) {
  background: rgb(var(--v-theme-error)) !important;
  color: #ffffff !important;
  fill: currentColor !important;
}

/* Content Area */
.window-content {
  flex: 1;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Grid Mode */
.grid-layout {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: 100%;
  overflow: hidden;
  align-content: flex-start;
  border-top: 1px solid rgba(var(--v-theme-outline), 0.2);
  border-left: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.grid-item {
  border-right: 1px solid rgba(var(--v-theme-outline), 0.2);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
  display: flex;
  flex-direction: column;
  transition: opacity 0.2s;
  box-sizing: border-box;
}

.grid-item.dragging {
  opacity: 0.5;
  cursor: grabbing !important;
}

.grid-item:not(.dragging):hover {
  border-color: rgba(var(--v-theme-outline), 0.4);
}

/* Horizontal/Vertical Layouts */
.horizontal-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.horizontal-item {
  border-right: 1px solid rgba(var(--v-theme-outline), 0.2);
  display: flex;
  flex-direction: column;
  transition: opacity 0.2s;
}

.horizontal-item.dragging {
  opacity: 0.5;
  cursor: grabbing !important;
}

.horizontal-item:not(.dragging):hover {
  border-color: rgba(var(--v-theme-outline), 0.4);
}

.horizontal-item:last-child {
  border-right: none;
}

.vertical-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.vertical-item {
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
  display: flex;
  flex-direction: column;
  transition: opacity 0.2s;
}

.vertical-item.dragging {
  opacity: 0.5;
  cursor: grabbing !important;
}

.vertical-item:not(.dragging):hover {
  border-color: rgba(var(--v-theme-outline), 0.4);
}

.vertical-item:last-child {
  border-bottom: none;
}

/* Pane Header */
.pane-header {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
  flex-shrink: 0;
  min-height: 28px;
  overflow: visible;
}

.pane-title {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.pane-buttons {
  display: flex;
  gap: 4px;
  margin-left: 8px;
  overflow: visible;
}

.btn-with-custom-tooltip {
  position: relative;
  display: inline-flex;
  overflow: visible;
}

.custom-tooltip {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  right: calc(100% + 8px);
  bottom: 0;
  padding: 5px 16px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  pointer-events: none;
  transition: opacity 0.2s, visibility 0.2s;
  box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);
  z-index: 100001;
}

.custom-tooltip {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
}

.btn-with-custom-tooltip:hover .custom-tooltip {
  visibility: visible;
  opacity: 1;
}

/* Terminal Pane */
.terminal-pane {
  flex: 1;
  background: #000000;
  overflow: hidden;
  position: relative;
}

/* Ensure XTerm fills the pane */
.terminal-pane :deep(.xterm) {
  width: 100% !important;
  height: 100% !important;
}
</style>

<style>
/* Global styles for tooltips - must be above terminal manager z-index */
.v-overlay.v-tooltip {
  z-index: 100000 !important;
}
</style>

