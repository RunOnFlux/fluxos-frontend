<script setup>
import { ref, computed, onMounted } from 'vue'
import { v4 as uuid } from 'uuid'

const props = defineProps({
  modelValue: String,
  componentIndex: Number,
})

const emit = defineEmits(['update:modelValue'])

const expandedPanels = ref([])

const baseSyncModes = [
  { value: '', label: 'None' },
  { value: 's', label: 'Master-Master (s)' },
  { value: 'r', label: 'Phased Master-Master (r)' },
  { value: 'g', label: 'Master-Slave (g)' },
]

const normalize = p =>
  '/' + p.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\/+/g, '/')

function getAllowedMountModes() {
  const modes = []
  for (let i = 0; i <= props.componentIndex; i++) {
    modes.push({
      value: String(i),
      label: i === props.componentIndex
        ? `Remount from same component (${i}:)`
        : `Mount from component ${i} (${i}:)`,
    })
  }
  
  return modes
}

function getAllModes() {
  return [...baseSyncModes, ...getAllowedMountModes()]
}

const entries = ref([])
const baseRoot = ref(null)

function parseInitialValue(containerData) {
  if (!containerData) return []

  return containerData.split('|').map((entry, index) => {
    const match = entry.match(/^([srg]|\d*?):(\/.*)$/)
    const modeVal = match?.[1] || ''
    const path = match?.[2] || entry
    const allModes = getAllModes()
    const mode = allModes.find(m => m.value === modeVal) || { value: modeVal, label: `${modeVal}:` }
    if (index === 0) baseRoot.value = path
    
    return { id: uuid(), mode, path }
  })
}

onMounted(() => {
  entries.value = parseInitialValue(props.modelValue)
  if (entries.value.length === 0) {
    entries.value.push({ id: uuid(), mode: baseSyncModes[0], path: '' })
  } else {
    entries.value.forEach(e => {
      e.path = normalize(e.path || '')
    })
  }
})

function normalizePath(index) {
  const entry = entries.value[index]
  if (!entry) return
  const current = entry.path || ''
  const normalized = normalize(current)
  if (current !== normalized) {
    entry.path = normalized
  }
  validateAndEmit()
}

function getAvailableModes(index) {
  const mountModes = getAllowedMountModes()
  const firstModeVal = entries.value[0]?.mode?.value || entries.value[0]?.mode || ''
  if (index === 0) return [...baseSyncModes, ...mountModes]
  if (['s', 'r', 'g'].includes(firstModeVal)) return mountModes
  
  return [...baseSyncModes.filter(m => m.value !== ''), ...mountModes]
}

const baseIsMount = computed(() => {
  const modeVal = typeof entries.value[0]?.mode === 'object'
    ? entries.value[0]?.mode?.value
    : entries.value[0]?.mode
  
  return /^\d+$/.test(modeVal)
})

function validateEntries(entries, componentIndex) {
  const logs = []
  const normalize = p => '/' + p.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\/+/g, '/')

  if (!entries || entries.length === 0 || !entries[0]) return logs

  const first = entries[0]
  const basePath = normalize(first?.path || '')
  const baseMode = typeof first?.mode === 'object' ? first.mode?.value : first.mode
  const usedSyncModes = new Set(
    entries.map(e => {
      const m = typeof e?.mode === 'object' ? e?.mode?.value : e?.mode
      
      return ['s', 'r', 'g'].includes(m) ? m : null
    }).filter(Boolean),
  )
  const seenPaths = new Set()

  entries.forEach((entry, index) => {
    if (!entry) return
    const path = normalize(entry.path || '')
    const mode = typeof entry.mode === 'object' ? entry.mode?.value : entry.mode

    if (!path) logs.push({ index, mode, path, reason: 'Path is empty' })
    if (index === 0 && /^\d+$/.test(mode)) logs.push({ index, mode, path, reason: 'Base entry cannot be a mount' })
    if (seenPaths.has(path)) logs.push({ index, mode, path, reason: 'Duplicate path' })
    else seenPaths.add(path)
    if (!path.startsWith('/')) logs.push({ index, mode, path, reason: 'Path must start with /' })
    const invalidChars = /[<>:"\\|?*\x00-\x1F;]/

    const parts = path.split('/').filter(p => p !== '')

    if (parts.some(p => invalidChars.test(p))) {
      logs.push({ index, mode, path, reason: 'Path contains invalid characters' })
    }
    if (/^\d+$/.test(mode) && parseInt(mode) > componentIndex)
      logs.push({ index, mode, path, reason: `Mount refers to future component` })
    if (usedSyncModes.size > 1 && ['s', 'r', 'g'].includes(mode))
      logs.push({ index, mode, path, reason: 'Mixed sync modes detected' })
    if (index !== 0 && ['s', 'r', 'g'].includes(mode) && !path.startsWith(basePath + '/'))
      logs.push({ index, mode, path, reason: `Sync path must be subpath of base (${basePath})` })
    if (index !== 0 && path === basePath)
      logs.push({ index, mode, path, reason: 'Path cannot equal base path' })
    if (['s', 'r', 'g'].includes(mode)) {
      const conflicts = entries.filter((e, i2) => {
        if (i2 === index || !e) return false
        const m = typeof e.mode === 'object' ? e.mode?.value : e.mode
        const p = normalize(e.path || '')
        
        return ['s', 'r', 'g'].includes(m) && (path.startsWith(p + '/') || p.startsWith(path + '/'))
      })
      if (conflicts.length) logs.push({ index, mode, path, reason: 'Conflicts with other sync path' })
    }
    if (index !== 0 && /^\d+$/.test(mode) && ['s', 'r', 'g'].includes(baseMode)) {
      if (path === basePath || path.startsWith(basePath + '/') || basePath.startsWith(path + '/'))
        logs.push({ index, mode, path, reason: 'Mount overlaps with sync root' })
    }
  })

  return logs
}

const validationLogs = computed(() => validateEntries(entries.value, props.componentIndex))

function getEntryError(index) {
  return validationLogs.value
    .filter(log => log.index === index)
    .map(e => e.reason)
    .join(', ')
}

function validateAndEmit() {
  const logs = validateEntries(entries.value, props.componentIndex)

  const baseMode = typeof entries.value[0]?.mode === 'object'
    ? entries.value[0]?.mode?.value
    : entries.value[0]?.mode

  if (/^\d+$/.test(baseMode) || logs.length > 0) return

  const value = entries.value
    .filter(e => e.path?.trim())
    .map(e => {
      const modeVal = typeof e.mode === 'object' ? e.mode?.value : e.mode
      const path = normalize(e.path || '')
      
      return modeVal ? `${modeVal}:${path}` : path
    })
    .join('|')

  emit('update:modelValue', value)
}

const showAddPath = computed(() => {
  if (props.componentIndex === 0) {
    const first = entries.value[0]
    const mode = first?.mode?.value || first?.mode || ''
    
    return !['s', 'r', 'g'].includes(mode)
  }
  
  return true
})

function addEntry() {
  const firstMode = typeof entries.value[0]?.mode === 'object'
    ? entries.value[0]?.mode?.value
    : entries.value[0]?.mode
  const isLocked = ['s', 'r', 'g'].includes(firstMode)
  const defaultMode = getAvailableModes(entries.value.length).find(m => m.value === (isLocked ? '0' : '')) || baseSyncModes[1]
  entries.value.push({ id: uuid(), mode: defaultMode, path: '' })
}

function removeEntry(id) {
  if (entries.value.length <= 1) return
  entries.value = entries.value.filter(e => e.id !== id)

  validateAndEmit()
}

watch(validationLogs, logs => {
  expandedPanels.value = logs.length > 0 ? [0] : []
})
</script>


<template>
  <VCard class="pa-4" variant="tonal">
    <VRow
      v-for="(entry, index) in entries"
      :key="entry.id"
      class="mb-2"
      align="center"
    >
      <VCol cols="3">
        <VSelect
          v-model="entry.mode"
          :items="getAvailableModes(index)"
          item-title="label"
          item-value="value"
          dense
          hide-details
          label="Mode"
          @blur="validateAndEmit"
        />
      </VCol>

      <VCol cols="8">
        <VTextField
          v-model="entry.path"
          label="Path"
          placeholder="e.g. /data/config"
          :error="!!getEntryError(index)"
          dense
          @blur="() => normalizePath(index)"
        />
      </VCol>

      <VCol cols="1" class="text-right">
        <VBtn
          icon
          variant="text"
          @click="removeEntry(entry.id)"
          color="error"
          :disabled="entries.length === 1"
        >
          <VIcon size="22">mdi-delete</VIcon>
        </VBtn>
      </VCol>
    </VRow>

    <VBtn
      v-if="showAddPath"
      @click="addEntry"
      prepend-icon="mdi-plus"
      variant="tonal"
      size="small"
      color="primary"
    >
      Add Path
    </VBtn>


    <VDivider class="my-4" />

    <VExpansionPanels v-model="expandedPanels"  variant="accordion" class="mt-4">
      <!-- Panel 1: Validation Logs -->
      <VExpansionPanel>
        <VExpansionPanelTitle class="d-flex align-center">
          <VIcon :color="validationLogs.length === 0 ? 'success' : 'error'" size="21" class="mr-2">{{ validationLogs.length === 0 ? 'mdi-file-document-check' : 'mdi-file-document-remove' }}</VIcon>
          Validation Logs
        </VExpansionPanelTitle>
        <VExpansionPanelText>
          <div v-if="validationLogs.length === 0">
            No validation errors 🎉
          </div>
          <VList v-else dense>
            <VListItem
              v-for="(log, idx) in validationLogs"
              :key="idx"
            >
              <VListItemTitle>
                Entry #{{ log.index }} (mode: <code>{{ log.mode ?  log.mode : 'none' }}</code>, path: <code>{{ log.path }}</code>)
              </VListItemTitle>
              <VListItemSubtitle style="color: #FF4C51">
                {{ log.reason }}
              </VListItemSubtitle>
            </VListItem>
          </VList>
        </VExpansionPanelText>
      </VExpansionPanel>

      <VExpansionPanel>
        <VExpansionPanelTitle class="d-flex align-center">
          <VIcon size="21" class="mr-2">mdi-cog-sync</VIcon>
          Detailed Information & Sync Behavior
        </VExpansionPanelTitle>
        <VExpansionPanelText>
          <h4><strong>Sync Mode Differences:</strong></h4>
          <ul class="mb-4 ml-4" style="font-size: 13px">
            <li><strong>Master-Master [<code>s</code>]:</strong> Full real-time two-way sync between all participants. Changes on any side are propagated to all others immediately.</li>
            <li><strong>Phased Master-Master [<code>r</code>]:</strong> Similar to <code>s</code>, but syncing occurs in controlled phases during startup. The <code>r</code> mode prevents overwriting of existing data when a new instance is started.</li>
            <li><strong>Master-Slave [<code>g</code>]:</strong> One-way sync from master to others. The base component is the source of truth, and others receive updates but do not modify the data.</li>
          </ul>

          <h4><strong>Allowed Combinations & Rules:</strong></h4>
          <ul class="ml-4" style="font-size: 13px">
            <li><strong>Base entry</strong> cannot be a mount (e.g. <code>0:/data</code> is invalid)</li>
            <li><strong>Only one sync mode</strong> allowed per component</li>
            <li><strong>All sync paths</strong> must be within the base path but not equal to it</li>
            <li>To sync folders under a shared parent, use a <code>None</code> base like <code>/data</code> with sync paths like <code>r:/data/sync1</code> and <code>r:/data/sync2</code></li>
            <li><strong>Same-component remounts</strong> are allowed using <code>N:/path</code> when <code>N == current componentIndex</code></li>
            <li><strong>Other mounts</strong> must refer to components &lt; current one (e.g. <code>0:/data</code> only valid if current index &ge; 1)</li>
            <li><strong>No duplicate paths</strong> allowed (even with different modes)</li>
            <li><strong>Mount paths</strong> must not overlap with the base sync root or any sync subdir</li>
            <li><strong>Sync subpaths</strong> must not overlap with other sync subpaths (e.g. <code>s:/data/a</code> and <code>s:/data/a/b</code> are invalid)</li>
            <li><strong>All paths</strong> must start with <code>/</code> and avoid invalid characters</li>
          </ul>
        </VExpansionPanelText>
      </VExpansionPanel>
    </VExpansionPanels>
  </VCard>
</template>

<style scoped>
.v-col {
  padding-top: 4px;
  padding-bottom: 4px;
}
</style>
