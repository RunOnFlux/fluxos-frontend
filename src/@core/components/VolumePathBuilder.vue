<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { v4 as uuid } from 'uuid'
import { useI18n } from 'vue-i18n'
import { ElTree } from 'element-plus'

const props = defineProps({
  modelValue: String,
  componentIndex: Number,
  newApp: Boolean,
  specVersion: Number, // App specification version
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const expandedPanels = ref([])

// Feature flag: Enable same-component remounting (temporarily disabled)
// When enabled, allows mounting directories/files from the same component
// Backend support requires validation changes in volumeConstructor.js
const ENABLE_SAME_COMPONENT_REMOUNT = false

// Base modes for advanced dropdown - NO LONGER includes sync modes (s/r/g)
// Sync modes are now configured in the dedicated sync section above
const baseSyncModes = computed(() => {
  return [
    { value: '', label: t('core.volumePathBuilder.modeNone') },
  ]
})

const normalize = p =>
  '/' + p.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\/+/g, '/')

// Helper function to check if entry needs mode dropdown (only for component types)
const needsModeDropdown = entry => {
  return entry.mountType === 'component_file' || entry.mountType === 'component_directory'
}

// Sync configuration state
const syncConfig = ref({
  enabled: false,
  mode: 'r', // default to Phased Master-Master (recommended)
})

// Available sync modes based on whether it's a new app
const availableSyncModes = computed(() => {
  const modes = [
    { value: 'r', label: t('core.volumePathBuilder.modePhasedMasterMaster'), description: t('core.volumePathBuilder.modePhasedMasterMasterDesc') },
    { value: 'g', label: t('core.volumePathBuilder.modePrimaryStandby'), description: t('core.volumePathBuilder.modePrimaryStandbyDesc') },
  ]

  // Only include 's' mode for existing apps that already use it
  if (!props.newApp && props.modelValue && props.modelValue.includes('s:')) {
    modes.unshift({ value: 's', label: t('core.volumePathBuilder.modeMasterMaster'), description: t('core.volumePathBuilder.modeMasterMasterDesc') + ' (Deprecated)' })
  }

  return modes
})

function getAllowedMountModes() {
  const modes = []
  for (let i = 0; i <= props.componentIndex; i++) {
    modes.push({
      value: String(i),
      label: i === props.componentIndex
        ? t('core.volumePathBuilder.remountFromSameComponent', { index: i })
        : t('core.volumePathBuilder.mountFromComponent', { index: i }),
    })
  }

  return modes
}

function getAllModes() {
  return [...baseSyncModes.value, ...getAllowedMountModes()]
}

const entries = ref([])
const baseRoot = ref(null)

function parseInitialValue(containerData) {
  if (!containerData) return []

  return containerData.split('|').map((entry, index) => {
    const allModes = getAllModes()

    // Check for component file mount: cf:number:filename:path
    const cfMatch = entry.match(/^cf:(\d+):([^:]+):(\/.*)$/)
    if (cfMatch) {
      const componentIndex = cfMatch[1]
      const filename = cfMatch[2]
      const path = cfMatch[3]
      const mode = allModes.find(m => m.value === componentIndex) || { value: componentIndex, label: `${componentIndex}:` }

      return {
        id: uuid(),
        mode,
        mountType: 'component_file',
        subdir: filename,
        path,
      }
    }

    // Check for component directory mount: c:number:subdir:path
    const cMatch = entry.match(/^c:(\d+):([^:]+):(\/.*)$/)
    if (cMatch) {
      const componentIndex = cMatch[1]
      const subdir = cMatch[2]
      const path = cMatch[3]
      const mode = allModes.find(m => m.value === componentIndex) || { value: componentIndex, label: `${componentIndex}:` }

      return {
        id: uuid(),
        mode,
        mountType: 'component_directory',
        subdir,
        path,
      }
    }

    // Check for file mount: f:filename:path (no sync flags on sibling mounts)
    const fileMatch = entry.match(/^f:([^:]+):(\/.*)$/)
    if (fileMatch) {
      const filename = fileMatch[1]
      const path = fileMatch[2]
      const mode = allModes.find(m => m.value === '') || { value: '', label: 'None' }
      if (index === 0) baseRoot.value = path

      return {
        id: uuid(),
        mode,
        mountType: 'file',
        subdir: filename,
        path,
      }
    }

    // Check for directory mount: m:subdir:path (no sync flags on sibling mounts)
    const dirMatch = entry.match(/^m:([^:]+):(\/.*)$/)
    if (dirMatch) {
      const subdir = dirMatch[1]
      const path = dirMatch[2]
      const mode = allModes.find(m => m.value === '') || { value: '', label: 'None' }

      return {
        id: uuid(),
        mode,
        mountType: 'directory',
        subdir,
        path,
      }
    }

    // Check for primary mount with sync flags: [srg]:/path
    const flagMatch = entry.match(/^([srg]):(\/.*)$/)
    if (flagMatch && index === 0) {
      const syncMode = flagMatch[1]
      const path = flagMatch[2]

      // Extract sync config - populate syncConfig state
      syncConfig.value.enabled = true
      syncConfig.value.mode = syncMode

      baseRoot.value = path

      // Return entry without mode (sync is now in syncConfig)
      return {
        id: uuid(),
        mode: { value: '', label: 'None' },
        mountType: 'primary',
        subdir: 'appdata',
        path,
      }
    }

    // Check for component primary mount: number:/path
    const compMatch = entry.match(/^(\d+):(\/.*)$/)
    if (compMatch) {
      const componentIndex = compMatch[1]
      const path = compMatch[2]
      const mode = allModes.find(m => m.value === componentIndex) || { value: componentIndex, label: `${componentIndex}:` }
      if (index === 0) baseRoot.value = path

      return {
        id: uuid(),
        mode,
        mountType: 'component_primary',
        subdir: 'appdata',
        path,
      }
    }

    // Plain path (primary mount without flags): /path
    const path = entry
    const mode = allModes.find(m => m.value === '') || { value: '', label: 'None' }
    if (index === 0) baseRoot.value = path

    return {
      id: uuid(),
      mode,
      mountType: 'primary',
      subdir: 'appdata',
      path,
    }
  })
}

onMounted(() => {
  entries.value = parseInitialValue(props.modelValue)
  if (entries.value.length === 0) {
    // Create default primary mount with /data path for new apps
    entries.value.push({
      id: uuid(),
      mode: baseSyncModes.value[0],
      mountType: 'primary',
      subdir: 'appdata',
      path: '/data',
    })
  } else {
    entries.value.forEach(e => {
      e.path = normalize(e.path || '')

      // Ensure subdir exists for all entries
      if (!e.subdir) {
        if (e.mountType === 'primary' || e.mountType === 'component_primary') {
          e.subdir = 'appdata'
        } else if (e.mountType === 'file' || e.mountType === 'component_file') {
          e.subdir = ''
        } else {
          e.subdir = ''
        }
      }
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
  const entry = entries.value[index]
  if (!entry) return baseSyncModes.value

  const mountModes = getAllowedMountModes()
  const mountType = entry.mountType

  // Component mount types: only show component references
  if (mountType === 'component_primary' || mountType === 'component_directory' || mountType === 'component_file') {
    // Filter out self-reference unless feature flag is enabled
    if (ENABLE_SAME_COMPONENT_REMOUNT) {
      // Allow self-reference when feature is enabled
      return mountModes
    } else {
      // Exclude self-reference (default behavior)
      return mountModes.filter(mode => mode.value !== String(props.componentIndex))
    }
  }

  // Primary mount: only None mode (sync is now configured in separate section)
  if (index === 0 && mountType === 'primary') {
    return baseSyncModes.value
  }

  // Additional mounts (directory, file): only None mode
  if (mountType === 'directory' || mountType === 'file') {
    return baseSyncModes.value.filter(mode => mode.value === '')
  }

  // Fallback: only None mode
  return baseSyncModes.value.filter(mode => mode.value === '')
}

function handleMountTypeChange(index) {
  const entry = entries.value[index]
  if (!entry) return

  const availableModes = getAvailableModes(index)
  const currentMode = typeof entry.mode === 'object' ? entry.mode.value : entry.mode

  // Check if current mode is still valid for the new mount type
  const isModeValid = availableModes.some(m => m.value === currentMode)

  if (!isModeValid) {
    // Reset to first available mode
    entry.mode = availableModes[0]
  }

  // When switching between file and directory types, provide appropriate defaults
  const mountType = entry.mountType
  if (mountType === 'directory' || mountType === 'component_directory') {
    // Switching to directory: if subdir looks like a filename, suggest a folder name
    if (entry.subdir && entry.subdir.includes('.')) {
      entry.subdir = 'data'
    } else if (!entry.subdir) {
      entry.subdir = 'data'
    }
  } else if (mountType === 'file' || mountType === 'component_file') {
    // Switching to file: if subdir doesn't look like a filename, suggest one
    if (entry.subdir && !entry.subdir.includes('.')) {
      entry.subdir = 'config.yaml'
    } else if (!entry.subdir) {
      entry.subdir = 'config.yaml'
    }
  }
}

const baseIsMount = computed(() => {
  const modeVal = typeof entries.value[0]?.mode === 'object'
    ? entries.value[0]?.mode?.value
    : entries.value[0]?.mode
  
  return /^\d+$/.test(modeVal)
})

function validateEntries(entries, componentIndex, syncCfg) {
  const logs = []
  const normalize = p => '/' + p.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\/+/g, '/')

  if (!entries || entries.length === 0 || !entries[0]) return logs

  const first = entries[0]
  const basePath = normalize(first?.path || '')
  const baseMode = typeof first?.mode === 'object' ? first.mode?.value : first.mode

  // Note: Sync modes are now in syncConfig, not in entry.mode
  const seenPaths = new Set()
  const seenSubdirs = new Set()

  entries.forEach((entry, index) => {
    if (!entry) return

    const originalPath = entry.path || ''
    const path = normalize(originalPath)
    const mode = typeof entry.mode === 'object' ? entry.mode?.value : entry.mode
    const isComponentRef = /^\d+$/.test(mode)

    // Check if original path is empty/whitespace BEFORE normalization
    if (!originalPath.trim()) {
      logs.push({ index, mode, path: '', reason: t('core.volumePathBuilder.validationPathEmpty') })
      
      return // Skip further validation for this entry
    }

    // Validate first entry must be Primary type
    if (index === 0 && entry.mountType !== 'primary') {
      logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationBaseCannotBeMount') })
    }

    // Subdir/filename validation for LOCAL mounts (not component references)
    if (!isComponentRef && index > 0) {
      // File mount validation
      if (entry.mountType === 'file') {
        if (!entry.subdir) {
          logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationFilenameRequired') })
        } else {
          if (entry.subdir.includes('/') || entry.subdir.includes('..')) {
            logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationInvalidFilename') })
          }
          if (entry.subdir.includes(':')) {
            logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationFilenameContainsColon') })
          }
          if (entry.subdir.includes('|')) {
            logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationFilenameContainsPipe') })
          }
          if (entry.subdir === 'appdata' || entry.subdir === 'backup' || entry.subdir === '.' || entry.subdir === '..') {
            logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationReservedSubdir') })
          }
          if (entry.subdir.length > 255) {
            logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationFilenameTooLong') })
          }
          if (seenSubdirs.has(entry.subdir)) {
            logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationDuplicateSubdir') })
          } else {
            seenSubdirs.add(entry.subdir)
          }
        }
      }

      // Directory mount validation
      if (entry.mountType === 'directory') {
        if (!entry.subdir) {
          logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationSubdirRequired') })
        } else {
          if (entry.subdir.includes('/') || entry.subdir.includes('..')) {
            logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationInvalidSubdir') })
          }
          if (entry.subdir.includes(':')) {
            logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationSubdirContainsColon') })
          }
          if (entry.subdir.includes('|')) {
            logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationSubdirContainsPipe') })
          }
          if (entry.subdir === 'appdata' || entry.subdir === 'backup' || entry.subdir === '.' || entry.subdir === '..') {
            logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationReservedSubdir') })
          }
          if (entry.subdir.length > 255) {
            logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationSubdirTooLong') })
          }
          if (seenSubdirs.has(entry.subdir)) {
            logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationDuplicateSubdir') })
          } else {
            seenSubdirs.add(entry.subdir)
          }
        }
      }
    }

    // Component mount validation
    if (entry.mountType === 'component_file') {
      if (!entry.subdir) {
        logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationFilenameRequired') })
      } else {
        if (entry.subdir.includes('/') || entry.subdir.includes('..')) {
          logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationInvalidFilename') })
        }
        if (entry.subdir.includes(':')) {
          logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationFilenameContainsColon') })
        }
        if (entry.subdir.includes('|')) {
          logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationFilenameContainsPipe') })
        }
        if (entry.subdir.length > 255) {
          logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationFilenameTooLong') })
        }
      }
      if (!isComponentRef) {
        logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationComponentMountRequiresNumber') })
      }
    }

    if (entry.mountType === 'component_directory') {
      if (!entry.subdir) {
        logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationSubdirRequired') })
      } else {
        if (entry.subdir.includes('/') || entry.subdir.includes('..')) {
          logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationInvalidSubdir') })
        }
        if (entry.subdir.includes(':')) {
          logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationSubdirContainsColon') })
        }
        if (entry.subdir.includes('|')) {
          logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationSubdirContainsPipe') })
        }
        if (entry.subdir.length > 255) {
          logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationSubdirTooLong') })
        }
      }
      if (!isComponentRef) {
        logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationComponentMountRequiresNumber') })
      }
    }

    if (entry.mountType === 'component_primary' && !isComponentRef) {
      logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationComponentMountRequiresNumber') })
    }

    // Validate non-primary entries cannot have 'primary' type
    if (index > 0 && entry.mountType === 'primary') {
      logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationOnlyFirstCanBePrimary') })
    }

    // Validate Mode doesn't conflict with mount type prefixes
    if (index === 0 && mode && ['m', 'f', 'c', 'cf'].includes(mode)) {
      logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationModeConflictsWithPrefix') })
    }

    // Check for duplicate paths
    if (seenPaths.has(path)) logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationDuplicatePath') })
    else seenPaths.add(path)
    if (!path.startsWith('/')) logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationPathMustStartWithSlash') })

    // Validate file mounts have a filename in the container path (not just a directory)
    if (entry.mountType === 'file' || entry.mountType === 'component_file') {
      // Check if path looks like a file (has a filename component, not ending with /)
      if (path.endsWith('/')) {
        logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationFilePathMustHaveFilename') })
      } else {
        // Check if last component looks like a filename (contains a dot for extension)
        const pathParts = path.split('/').filter(p => p !== '')
        const lastPart = pathParts[pathParts.length - 1]

        // If path is just "/" or last part doesn't look like a filename, warn
        if (pathParts.length === 0 || !lastPart || !lastPart.includes('.')) {
          logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationFilePathShouldHaveExtension') })
        }
      }
    }

    // Validate path doesn't contain colon (causes backend parsing conflicts)
    if (path.includes(':')) {
      logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationPathContainsColon') })
    }

    // Validate path doesn't contain pipe (reserved as mount separator)
    if (path.includes('|')) {
      logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationPathContainsPipe') })
    }

    const invalidChars = /[<>:"\\\|?*\x00-\x1F;]/

    const parts = path.split('/').filter(p => p !== '')

    if (parts.some(p => invalidChars.test(p))) {
      logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationInvalidCharacters') })
    }
    if (/^\d+$/.test(mode) && parseInt(mode) > componentIndex)
      logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationMountFutureComponent') })

    // Note: Sync mode validations removed - sync is now in syncConfig, not in entry.mode
    if (index !== 0 && path === basePath)
      logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationPathCannotEqualBase') })

    // Component mount overlap validation with synced base
    if (index !== 0 && /^\d+$/.test(mode) && syncCfg?.enabled) {
      if (path === basePath || path.startsWith(basePath + '/') || basePath.startsWith(path + '/'))
        logs.push({ index, mode, path, reason: t('core.volumePathBuilder.validationMountOverlapsSyncRoot') })
    }
  })

  // Validate total containerData string length (backend limit: 200 chars)
  // Build the containerData string as it would appear in the spec
  const containerDataParts = entries.map((entry, idx) => {
    if (!entry || !entry.path) return ''
    const mode = typeof entry.mode === 'object' ? entry.mode?.value : entry.mode

    // Format depends on mount type
    if (idx === 0) {
      // Primary mount: [mode]:/path or just /path
      const modePrefix = mode ? `${mode}:` : ''
      
      return `${modePrefix}${entry.path}`
    }

    // Non-primary mounts
    if (entry.mountType === 'file') {
      return `f:${entry.subdir || ''}:${entry.path}`
    } else if (entry.mountType === 'directory') {
      return `m:${entry.subdir || ''}:${entry.path}`
    } else if (entry.mountType === 'component_file') {
      return `cf:${mode || ''}:${entry.subdir || ''}:${entry.path}`
    } else if (entry.mountType === 'component_directory') {
      return `c:${mode || ''}:${entry.subdir || ''}:${entry.path}`
    } else if (entry.mountType === 'component_primary') {
      return `${mode || ''}:${entry.path}`
    }
    
    return ''
  }).filter(p => p !== '')

  const containerDataString = containerDataParts.join('|')
  if (containerDataString.length > 200) {
    logs.push({
      index: -1,
      mode: '',
      path: '',
      reason: t('core.volumePathBuilder.validationContainerDataTooLong', {
        current: containerDataString.length,
        max: 200,
      }),
    })
  }

  return logs
}

const validationLogs = computed(() => validateEntries(entries.value, props.componentIndex, syncConfig.value))

function getEntryError(index) {
  return validationLogs.value
    .filter(log => log.index === index)
    .map(e => e.reason)
    .join(', ')
}

function validateAndEmit() {
  const logs = validateEntries(entries.value, props.componentIndex, syncConfig.value)

  const baseMode = typeof entries.value[0]?.mode === 'object'
    ? entries.value[0]?.mode?.value
    : entries.value[0]?.mode

  if (/^\d+$/.test(baseMode) || logs.length > 0) return

  const value = entries.value
    .filter(e => e.path?.trim())
    .map((e, index) => {
      const modeVal = typeof e.mode === 'object' ? e.mode?.value : e.mode
      const path = normalize(e.path || '')
      const isComponentRef = /^\d+$/.test(modeVal)

      // Primary mount (index 0)
      if (index === 0) {
        if (e.mountType === 'primary') {
          // Primary mount uses syncConfig for sync modes
          return syncConfig.value.enabled ? `${syncConfig.value.mode}:${path}` : path
        }
      }

      // Component file mount: cf:number:filename:path
      if (e.mountType === 'component_file' && e.subdir && isComponentRef) {
        return `cf:${modeVal}:${e.subdir}:${path}`
      }

      // Component directory mount: c:number:subdir:path
      if (e.mountType === 'component_directory' && e.subdir && isComponentRef) {
        return `c:${modeVal}:${e.subdir}:${path}`
      }

      // File mount: f:filename:path
      if (e.mountType === 'file' && e.subdir) {
        return `f:${e.subdir}:${path}`
      }

      // Directory mount: m:subdir:path
      if (e.mountType === 'directory' && e.subdir) {
        return `m:${e.subdir}:${path}`
      }

      // Component primary mount: number:/path
      if (e.mountType === 'component_primary' && isComponentRef) {
        return `${modeVal}:${path}`
      }

      // Fallback for backward compatibility
      return modeVal ? `${modeVal}:${path}` : path
    })
    .join('|')

  emit('update:modelValue', value)
}

const showAddPath = computed(() => {
  // Always allow adding paths - the new mount system supports:
  // - Directory mounts (m:subdir:path)
  // - File mounts (f:filename:path)
  // - Component mounts (c:, cf:, component numbers)
  // Even when using sync modes on the primary mount
  return true
})

function addEntry() {
  const firstMode = typeof entries.value[0]?.mode === 'object'
    ? entries.value[0]?.mode?.value
    : entries.value[0]?.mode
  const isLocked = ['s', 'r', 'g'].includes(firstMode)
  const defaultMode = getAvailableModes(entries.value.length).find(m => m.value === (isLocked ? '0' : '')) || baseSyncModes.value[0]

  entries.value.push({
    id: uuid(),
    mode: defaultMode,
    mountType: 'directory',
    subdir: '',
    path: '',
  })
}

function removeEntry(id) {
  if (entries.value.length <= 1) return
  entries.value = entries.value.filter(e => e.id !== id)

  validateAndEmit()
}

// Quick templates for common mount patterns
function addLogsFolder() {
  entries.value.push({
    id: uuid(),
    mode: baseSyncModes.value[0], // None
    mountType: 'directory',
    subdir: 'logs',
    path: '/var/log',
  })
  validateAndEmit()
}

function addConfigFile() {
  entries.value.push({
    id: uuid(),
    mode: baseSyncModes.value[0], // None
    mountType: 'file',
    subdir: 'config.yaml',
    path: '/etc/config.yaml',
  })
  validateAndEmit()
}

function addDataFolder() {
  entries.value.push({
    id: uuid(),
    mode: baseSyncModes.value[0], // None
    mountType: 'directory',
    subdir: 'data',
    path: '/data',
  })
  validateAndEmit()
}

const isUsingSMode = computed(() => {
  return !props.newApp && props.modelValue && props.modelValue.includes('s:')
})

const mountTypeOptions = computed(() => [
  {
    value: 'primary',
    label: t('core.volumePathBuilder.typePrimary'),
    icon: 'mdi-database',
    description: t('core.volumePathBuilder.typePrimaryDesc'),
    example: '/data → /apps/flux[appid]/appdata',
  },
  {
    value: 'directory',
    label: t('core.volumePathBuilder.typeDirectory'),
    icon: 'mdi-folder',
    description: t('core.volumePathBuilder.typeDirectoryDesc'),
    example: 'logs → /apps/flux[appid]/logs',
  },
  {
    value: 'file',
    label: t('core.volumePathBuilder.typeFile'),
    icon: 'mdi-file',
    description: t('core.volumePathBuilder.typeFileDesc'),
    example: 'config.yaml → /apps/flux[appid]/config.yaml',
  },
  {
    value: 'component_primary',
    label: t('core.volumePathBuilder.typeComponentPrimary'),
    icon: 'mdi-vector-link',
    description: t('core.volumePathBuilder.typeComponentPrimaryDesc'),
    example: '0:/data → /apps/fluxCOMP0/appdata',
  },
  {
    value: 'component_directory',
    label: t('core.volumePathBuilder.typeComponentDirectory'),
    icon: 'mdi-folder-network',
    description: t('core.volumePathBuilder.typeComponentDirectoryDesc'),
    example: '0:data → /apps/fluxCOMP0/data',
  },
  {
    value: 'component_file',
    label: t('core.volumePathBuilder.typeComponentFile'),
    icon: 'mdi-file-link',
    description: t('core.volumePathBuilder.typeComponentFileDesc'),
    example: '0:config.yaml → /apps/fluxCOMP0/config.yaml',
  },
])

function getAvailableMountTypes(index) {
  const allOptions = mountTypeOptions.value
  const isComponent0 = props.componentIndex === 0

  // Index 0 (First mount - PRIMARY MOUNT):
  if (index === 0) {
    if (isComponent0) {
      // Component 0: Only 'primary' (can't use component_primary - no previous components to reference)
      return allOptions.filter(opt => opt.value === 'primary')
    } else {
      // Component 1+: 'primary' or 'component_primary'
      return allOptions.filter(opt =>
        opt.value === 'primary' || opt.value === 'component_primary',
      )
    }
  }

  // Index > 0 (Additional mounts):
  if (isComponent0) {
    // Component 0: Only 'directory' and 'file' (no component types - nothing to reference)
    return allOptions.filter(opt =>
      opt.value === 'directory' || opt.value === 'file',
    )
  } else {
    // Component 1+: All additional mount types
    return allOptions.filter(opt =>
      opt.value === 'directory' ||
      opt.value === 'file' ||
      opt.value === 'component_directory' ||
      opt.value === 'component_file',
    )
  }
}

function getMountTypeIcon(mountType) {
  const option = mountTypeOptions.value.find(opt => opt.value === mountType)
  
  return option?.icon || 'mdi-help-circle'
}

// Build a tree structure showing CONTAINER path hierarchy for Element Plus Tree
function buildContainerTree() {
  // Only show entries that have no validation errors
  const entriesWithErrors = new Set(validationLogs.value.map(log => log.index))
  const filteredEntries = entries.value.filter((e, index) => e.path?.trim() && !entriesWithErrors.has(index))
  const normalize = p => '/' + p.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\/+/g, '/')

  // Sort entries by container path depth (shallowest first)
  const sorted = [...filteredEntries].sort((a, b) => {
    const pathA = normalize(a.path || '/')
    const pathB = normalize(b.path || '/')
    const depthA = pathA.split('/').filter(p => p).length
    const depthB = pathB.split('/').filter(p => p).length
    
    return depthA - depthB
  })

  // Build flat list with parent references
  const flatNodes = sorted.map((entry, index) => {
    const entryPath = normalize(entry.path || '/')

    // Find parent in container hierarchy
    let parentPath = null
    let depth = 0

    for (let i = 0; i < index; i++) {
      const potentialParent = sorted[i]
      const potentialParentPath = normalize(potentialParent.path || '/')

      if (entryPath === potentialParentPath) continue
      if (entryPath.startsWith(potentialParentPath + '/')) {
        const currentDepth = potentialParentPath.split('/').filter(p => p).length
        if (currentDepth > depth) {
          parentPath = potentialParentPath
          depth = currentDepth
        }
      }
    }

    return {
      id: entryPath,
      label: entryPath,
      entry,
      parentPath,
      children: [],
    }
  })

  // Convert flat list to nested tree structure
  const nodeMap = new Map()
  const roots = []

  // First pass: create map of all nodes
  flatNodes.forEach(node => {
    nodeMap.set(node.id, node)
  })

  // Second pass: build parent-child relationships
  flatNodes.forEach(node => {
    if (node.parentPath) {
      const parent = nodeMap.get(node.parentPath)
      if (parent) {
        parent.children.push(node)
      } else {
        // Parent not found, treat as root
        roots.push(node)
      }
    } else {
      // No parent, this is a root node
      roots.push(node)
    }
  })

  return roots
}

const treeStructure = computed(() => buildContainerTree())

// Check if entry is affected by Syncthing
// CRITICAL: Syncthing syncs the ENTIRE /apps/flux[appid] directory when sync is enabled
// This includes appdata/ AND all sibling directories created by m: and f: mounts
function isEntryUnderSyncedPath(entry) {
  if (!entries.value || entries.value.length === 0) return false

  // Check if sync is enabled via syncConfig
  if (!syncConfig.value.enabled) return false

  // When primary has sync flags (r, g, s), Syncthing syncs the ENTIRE app directory:
  // /apps/flux[appid]/ (includes ALL subdirectories and files)
  //
  // This means ALL local mounts are synced:
  // ✅ Primary: appdata/ → /apps/flux[appid]/appdata (synced)
  // ✅ m:logs: → /apps/flux[appid]/logs (synced - sibling to appdata, still in app dir)
  // ✅ f:config.yaml: → /apps/flux[appid]/config.yaml (synced - in app dir)
  //
  // Only COMPONENT mounts are NOT synced (they reference OTHER components' directories):
  // ❌ c:0:data: → /apps/fluxOTHERCOMP/data (different app directory)

  // Skip component mounts - those reference other components' data, different app directory
  if (entry.mountType === 'component_primary' || entry.mountType === 'component_directory' || entry.mountType === 'component_file') {
    return false
  }

  // All other local mounts (primary, directory, file) are synced when primary has sync mode
  // because they all live under /apps/flux[appid]/ which is synced recursively
  return true
}

// Preview of output string
const outputPreview = computed(() => {
  const normalize = p => '/' + p.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\/+/g, '/')

  return entries.value
    .filter(e => e.path?.trim())
    .map((e, index) => {
      const modeVal = typeof e.mode === 'object' ? e.mode?.value : e.mode
      const path = normalize(e.path || '')
      const isComponentRef = /^\d+$/.test(modeVal)

      if (index === 0) {
        if (e.mountType === 'primary') {
          return modeVal ? `${modeVal}:${path}` : path
        }
      }

      if (e.mountType === 'component_file' && e.subdir && isComponentRef) {
        return `cf:${modeVal}:${e.subdir}:${path}`
      }

      if (e.mountType === 'component_directory' && e.subdir && isComponentRef) {
        return `c:${modeVal}:${e.subdir}:${path}`
      }

      if (e.mountType === 'file' && e.subdir) {
        // File mount: f:filename:path (no sync flags on sibling mounts)
        return `f:${e.subdir}:${path}`
      }

      if (e.mountType === 'directory' && e.subdir) {
        // Directory mount: m:subdir:path (no sync flags on sibling mounts)
        return `m:${e.subdir}:${path}`
      }

      if (e.mountType === 'component_primary' && isComponentRef) {
        return `${modeVal}:${path}`
      }

      return modeVal ? `${modeVal}:${path}` : path
    })
    .join('|') || t('core.volumePathBuilder.outputPreviewEmpty')
})

watch(validationLogs, logs => {
  expandedPanels.value = logs.length > 0 ? [0] : []
})

// Auto-detect mount type based on subdir input
let isUpdatingType = false
watch(entries, newEntries => {
  if (isUpdatingType) return // Prevent infinite loop

  newEntries.forEach((entry, index) => {
    if (index === 0) return // Skip primary mount
    if (!entry.subdir || !entry.subdir.trim()) return // Skip if no subdir

    const modeVal = typeof entry.mode === 'object' ? entry.mode?.value : entry.mode
    const isComponentRef = /^\d+$/.test(modeVal)
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(entry.subdir.trim())

    let newType = null

    if (isComponentRef) {
      // Component mounts
      if (hasExtension && entry.mountType !== 'component_file') {
        newType = 'component_file'
      } else if (!hasExtension && entry.mountType !== 'component_directory' && entry.mountType !== 'component_primary') {
        newType = 'component_directory'
      }
    } else {
      // Regular mounts
      if (hasExtension && entry.mountType !== 'file') {
        newType = 'file'
      } else if (!hasExtension && entry.mountType !== 'directory') {
        newType = 'directory'
      }
    }

    if (newType) {
      isUpdatingType = true
      entry.mountType = newType
      nextTick(() => {
        isUpdatingType = false
      })
    }
  })
}, { deep: true })
</script>

<style>
/* Global Element Plus overrides - NOT scoped to ensure they apply */
.el-tree {
  background: transparent !important;
  background-color: transparent !important;
  --el-bg-color: transparent !important;
  --el-fill-color-blank: transparent !important;
}

.el-tree,
.el-tree-node,
.el-tree-node__content,
.el-tree-node__children {
  background: transparent !important;
  background-color: transparent !important;
}

/* Don't make Vuetify chips transparent - force them to show */
.el-tree .v-chip,
.el-tree .v-chip *,
.el-tree-node__content .v-chip,
.mount-info .v-chip {
  background: unset !important;
  background-color: unset !important;
}

/* Restore chip backgrounds with specific colors */
.el-tree .v-chip.bg-success,
.mount-info .v-chip.bg-success {
  background-color: rgba(var(--v-theme-success), 0.16) !important;
  color: rgb(var(--v-theme-success)) !important;
}

.el-tree .v-chip.v-chip--variant-tonal:not(.bg-success),
.mount-info .v-chip.v-chip--variant-tonal:not(.bg-success) {
  background-color: rgba(var(--v-theme-surface-variant), 1) !important;
}

/* Gray flat chips - match bg-grey or text-grey classes */
.el-tree .v-chip.v-chip--variant-flat[class*="grey"],
.mount-info .v-chip.v-chip--variant-flat[class*="grey"],
.el-tree .v-chip.v-chip--variant-flat.v-chip--size-x-small,
.mount-info .v-chip.v-chip--variant-flat.v-chip--size-x-small {
  background-color: rgba(var(--v-theme-on-surface), 0.12) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.v-theme--dark .el-tree .v-chip.bg-success,
.v-theme--dark .mount-info .v-chip.bg-success {
  background-color: rgba(var(--v-theme-success), 0.24) !important;
}

.v-theme--dark .el-tree .v-chip.v-chip--variant-flat[class*="grey"],
.v-theme--dark .mount-info .v-chip.v-chip--variant-flat[class*="grey"],
.v-theme--dark .el-tree .v-chip.v-chip--variant-flat.v-chip--size-x-small,
.v-theme--dark .mount-info .v-chip.v-chip--variant-flat.v-chip--size-x-small {
  background-color: rgba(var(--v-theme-on-surface), 0.12) !important;
}

.v-theme--light .el-tree {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.v-theme--light .el-tree-node__content {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.v-theme--light .el-tree-node__expand-icon {
  color: rgba(var(--v-theme-on-surface), 0.8) !important;
}

.v-theme--dark .el-tree {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.v-theme--dark .el-tree-node__content {
  color: rgb(var(--v-theme-on-surface)) !important;
}
</style>

<style scoped>
.sync-config-card {
  background-color: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  position: relative;
  z-index: 1;
}

.mount-entry-card.v-card {
  background-color: rgb(var(--v-theme-surface));
}

.mount-entry-card.v-card > * {
  background-color: transparent;
}

.tree-view-container {
  background: transparent;
  border-radius: 8px;
  padding: 0;
}

.tree-header {
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.tree-content {
  font-family: 'Roboto Mono', monospace;
}

/* Override Element Plus Tree default styles - Light & Dark Theme Support */
.tree-content :deep(.el-tree) {
  background: transparent !important;
  background-color: transparent !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  --el-tree-node-hover-bg-color: rgba(var(--v-theme-on-surface), 0.05);
  --el-tree-text-color: rgb(var(--v-theme-on-surface));
  --el-tree-expand-icon-color: rgba(var(--v-theme-on-surface), 0.6);
  --el-bg-color: transparent;
  --el-fill-color-blank: transparent;
}

/* Force Element Plus tree elements to be transparent */
.tree-content :deep(.el-tree),
.tree-content :deep(.el-tree-node),
.tree-content :deep(.el-tree__empty-block) {
  background: transparent !important;
  background-color: transparent !important;
}

/* But don't force Vuetify chips inside to be transparent - let them use their colors */
.tree-content :deep(.v-chip) {
  background: revert !important;
  background-color: revert !important;
}

.mount-info :deep(.v-chip.bg-success) {
  background: rgb(var(--v-theme-success)) !important;
  background-color: rgba(var(--v-theme-success), 0.16) !important;
  color: rgb(var(--v-theme-success)) !important;
}

.v-theme--dark .mount-info :deep(.v-chip.bg-success) {
  background-color: rgba(var(--v-theme-success), 0.24) !important;
}

.tree-content :deep(.el-tree-node__content) {
  height: auto !important;
  min-height: 36px !important;
  padding: 4px 0 !important;
  background-color: transparent !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.tree-content :deep(.el-tree-node__content):hover {
  background-color: rgba(var(--v-theme-on-surface), 0.05) !important;
  border-radius: 4px;
}

/* Mobile: Add border and padding to tree node content */
@media (max-width: 959px) {
  .tree-content :deep(.el-tree-node__content) {
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
    border-radius: 8px !important;
    padding: 12px !important;
    margin-bottom: 8px !important;
    padding-left: 12px !important;
  }

  .tree-content :deep(.el-tree-node__expand-icon) {
    display: none !important;
  }

  .tree-content :deep(.el-tree-node__children) {
    padding-left: 0 !important;
    margin-left: 0 !important;
  }
}

.tree-content :deep(.el-tree-node__expand-icon) {
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
  font-size: 16px;
}

.tree-content :deep(.el-tree-node__expand-icon.is-leaf) {
  color: transparent !important;
}

.tree-content :deep(.el-tree-node__expand-icon.expanded) {
  transform: rotate(90deg);
}

.tree-content :deep(.el-tree-node__label) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

/* Custom tree connector lines */
.tree-content :deep(.el-tree-node) {
  position: relative;
}

.tree-content :deep(.el-tree-node__children) {
  padding-left: 24px;
  margin-left: 12px;
}

/* Use expansion panel background class to match exactly */

/* Balance left and right padding */
.tree-view-container {
  padding-left: 16px;
  padding-right: 16px;
}

.v-theme--light .tree-header {
  border-bottom-color: rgba(var(--v-theme-on-surface), 0.12);
}

.v-theme--light .tree-content :deep(.el-tree-node__content):hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}


/* Ensure chips display properly with their native Vuetify colors */

.v-theme--light .mount-info .v-chip--variant-outlined {
  border-color: rgba(var(--v-theme-on-surface), 0.3);
}

.v-theme--light .mount-info .v-icon {
  opacity: 1 !important;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

.v-theme--dark .mount-info .v-icon {
  color: rgba(var(--v-theme-on-surface), 0.7) !important;
}

/* Style expand/collapse icons */
.tree-content :deep(.el-tree-node__expand-icon) {
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

.v-theme--dark .tree-header {
  border-bottom-color: rgba(var(--v-theme-on-surface), 0.2);
}

.v-theme--dark .tree-content :deep(.el-tree-node__content):hover {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
}

.v-theme--dark .tree-content :deep(.el-tree-node__children) {
  border-left-color: rgba(var(--v-theme-on-surface), 0.2);
}

.tree-entry {
  margin: 8px 0;
  min-height: 36px;
  display: flex;
  align-items: center;
  transition: background-color 0.2s ease;
}

.tree-entry:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 4px;
}

.mount-info {
  padding: 4px 8px;
  border-radius: 4px;
  flex: 1;
  color: rgb(var(--v-theme-on-surface));
}

.v-theme--light .mount-info {
  color: rgb(var(--v-theme-on-surface));
}

.v-theme--dark .mount-info {
  color: rgb(var(--v-theme-on-surface));
}

.tree-arrow {
  color: rgba(var(--v-theme-on-surface), 0.6);
  user-select: none;
}

.tree-connector {
  font-family: 'Roboto Mono', monospace;
  margin-right: 8px;
  user-select: none;
  min-width: 36px;
  display: inline-block;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-weight: 400;
}

.tree-indent {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-left: 2px solid rgba(128, 128, 128, 0.3);
  margin-right: 4px;
}

.tree-indent-spacer {
  display: inline-block;
  width: 40px;
  min-width: 40px;
}

.tree-indent-line {
  display: inline-block;
  width: 40px;
  min-width: 40px;
  position: relative;
  height: 100%;
}

.tree-indent-line::before {
  content: '';
  position: absolute;
  left: 0;
  top: -50%;
  bottom: -50%;
  width: 2px;
  background-color: rgba(var(--v-theme-on-surface), 0.25);
}
</style>


<template>
  <VCard class="pa-4" variant="tonal">
    <!-- Sync Configuration Section -->
    <div class="mb-4 pa-4 sync-config-card v-card">
      <div class="d-flex align-center mb-3">
        <VIcon class="mr-2" size="24">mdi-sync</VIcon>
        <h4 class="text-h6">{{ t('core.volumePathBuilder.syncTitle') }}</h4>
      </div>

      <VAlert
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ t('core.volumePathBuilder.syncDescription') }}
      </VAlert>

      <VRow align="center">
        <VCol cols="12" md="6">
          <VSwitch
            v-model="syncConfig.enabled"
            :label="t('core.volumePathBuilder.syncEnableLabel')"
            color="primary"
            hide-details="auto"
            @update:model-value="validateAndEmit"
          />
          <div class="text-caption mt-1 font-weight-bold" :class="syncConfig.enabled ? 'text-success' : 'text-warning'">
            {{ syncConfig.enabled ? t('core.volumePathBuilder.syncEnabledHint') : t('core.volumePathBuilder.syncDisabledHint') }}
          </div>
        </VCol>

        <VCol v-if="syncConfig.enabled" cols="12" md="6">
          <VSelect
            v-model="syncConfig.mode"
            :items="availableSyncModes"
            item-title="label"
            item-value="value"
            :label="t('core.volumePathBuilder.syncModeLabel')"
            density="comfortable"
            variant="outlined"
            color="secondary"
            @update:model-value="validateAndEmit"
          >
            <template #item="{ props, item }">
              <VListItem v-bind="props">
                <template #title>
                  <div class="font-weight-medium">{{ item.raw.label }}</div>
                </template>
                <template #subtitle>
                  <div class="text-caption">{{ item.raw.description }}</div>
                </template>
              </VListItem>
            </template>
          </VSelect>
        </VCol>
      </VRow>
    </div>

    <div v-for="(entry, index) in entries" :key="entry.id">
      <!-- Primary Mount Badge -->
      <div v-if="index === 0" class="d-flex align-center mb-2">
        <VIcon class="mr-2">mdi-database</VIcon>
        <VChip
          size="small"
          variant="tonal"
        >
          {{ t('core.volumePathBuilder.primaryMountLabel') }}
        </VChip>
      </div>

      <!-- Entry Icon + Number -->
      <div v-else class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center">
          <VIcon class="mr-2">{{ getMountTypeIcon(entry.mountType) }}</VIcon>
          <span class="text-caption text-medium-emphasis">{{ t('core.volumePathBuilder.entryNumber', { number: index }) }}</span>
        </div>
        <!-- Delete button on mobile only -->
        <VBtn
          v-if="index !== 0"
          icon
          variant="text"
          @click="removeEntry(entry.id)"
          color="error"
          :disabled="entries.length === 1"
          class="d-md-none"
        >
          <VIcon size="22">mdi-delete</VIcon>
        </VBtn>
      </div>

      <VCard
        class="mb-3 pa-5 mount-entry-card"
        variant="outlined"
      >
        <VRow align="center">
          <VCol v-if="needsModeDropdown(entry)" cols="12" md="3">
            <div class="d-flex align-center">
              <VSelect
                v-model="entry.mode"
                :items="getAvailableModes(index)"
                item-title="label"
                item-value="value"
                dense
                hide-details
                :label="t('core.volumePathBuilder.labelMode')"
                color="secondary"
                @blur="validateAndEmit"
                style="flex: 1"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props">
                    <template #title>
                      <div>{{ item.raw.label }}</div>
                    </template>
                  </VListItem>
                </template>
              </VSelect>
              <VTooltip location="top">
                <template #activator="{ props }">
                  <VIcon v-bind="props" size="18" class="ml-1" color="grey">mdi-help-circle-outline</VIcon>
                </template>
                <span>{{ t('core.volumePathBuilder.modeTooltip') }}</span>
              </VTooltip>
            </div>
          </VCol>

          <VCol cols="12" :md="needsModeDropdown(entry) ? 2 : 3">
            <div class="d-flex align-center">
              <VSelect
                v-model="entry.mountType"
                :items="getAvailableMountTypes(index)"
                item-title="label"
                item-value="value"
                dense
                hide-details
                :label="t('core.volumePathBuilder.labelMountType')"
                color="secondary"
                :disabled="index === 0"
                :key="`mount-type-${entry.id}-${entry.mountType}`"
                @update:model-value="() => { handleMountTypeChange(index); validateAndEmit(); }"
                style="flex: 1"
              >
                <template #item="{ item, props }">
                  <VListItem v-bind="props" class="mount-type-item">
                    <template #prepend>
                      <VIcon :icon="item.raw.icon" class="mr-3" />
                    </template>
                    <VListItemTitle>{{ item.raw.description }}</VListItemTitle>
                    <div class="mount-type-example mt-2">
                      <code>{{ item.raw.example }}</code>
                    </div>
                  </VListItem>
                </template>
              </VSelect>
              <VTooltip location="top">
                <template #activator="{ props }">
                  <VIcon v-bind="props" size="18" class="ml-1" color="grey">mdi-help-circle-outline</VIcon>
                </template>
                <span>{{ t('core.volumePathBuilder.typeTooltip') }}</span>
              </VTooltip>
            </div>
          </VCol>

          <VCol v-if="entry.mountType === 'file' || entry.mountType === 'directory' || entry.mountType === 'component_file' || entry.mountType === 'component_directory'" cols="12" md="2">
            <div class="d-flex align-center">
              <VTextField
                v-model="entry.subdir"
                :label="entry.mountType === 'file' || entry.mountType === 'component_file' ? 'Host Filename' : 'Host Folder'"
                :placeholder="entry.mountType === 'file' || entry.mountType === 'component_file' ? t('core.volumePathBuilder.filenamePlaceholder') : t('core.volumePathBuilder.subdirPlaceholder')"
                dense
                hide-details
                :disabled="entry.mountType === 'primary' || entry.mountType === 'component_primary'"
                @blur="validateAndEmit"
                style="flex: 1"
              />
              <VTooltip location="top">
                <template #activator="{ props }">
                  <VIcon v-bind="props" size="18" class="ml-1" color="grey">mdi-help-circle-outline</VIcon>
                </template>
                <div style="max-width: 300px;">
                  <strong>{{ entry.mountType === 'file' || entry.mountType === 'component_file' ? 'Host Filename' : 'Host Folder Name' }}</strong><br/>
                  <span v-if="entry.mountType === 'file' || entry.mountType === 'component_file'">
                    This file will be created at <code>/apps/flux[appid]/{{ entry.subdir || 'filename' }}</code> on the host.<br/>
                    It does NOT need to match the container path.
                  </span>
                  <span v-else>
                    This folder will be created at <code>/apps/flux[appid]/{{ entry.subdir || 'foldername' }}</code> on the host.<br/>
                    It does NOT need to match the container path.
                  </span>
                </div>
              </VTooltip>
            </div>
          </VCol>

          <VCol cols="12" :md="(entry.mountType === 'file' || entry.mountType === 'directory' || entry.mountType === 'component_file' || entry.mountType === 'component_directory') ? (needsModeDropdown(entry) ? 4 : 6) : (needsModeDropdown(entry) ? 6 : 8)">
            <div class="d-flex align-center">
              <VTextField
                v-model="entry.path"
                :label="entry.mountType === 'file' || entry.mountType === 'component_file' ? 'Container File Path' : 'Container Path'"
                :placeholder="entry.mountType === 'file' || entry.mountType === 'component_file' ? '/etc/config.yaml' : t('core.volumePathBuilder.pathPlaceholder')"
                :error="!!getEntryError(index)"
                dense
                @blur="() => normalizePath(index)"
                style="flex: 1"
              />
              <VTooltip location="top">
                <template #activator="{ props }">
                  <VIcon v-bind="props" size="18" class="ml-1" color="grey">mdi-help-circle-outline</VIcon>
                </template>
                <div style="max-width: 350px;">
                  <strong>{{ entry.mountType === 'file' || entry.mountType === 'component_file' ? 'Container File Path' : 'Container Path' }}</strong><br/>
                  <span v-if="entry.mountType === 'file' || entry.mountType === 'component_file'">
                    The FULL file path where the file appears inside the container.<br/>
                    Example: <code>/etc/config.yaml</code>, <code>/app/settings.json</code><br/>
                    ⚠️ Must include the filename, not just the directory!
                  </span>
                  <span v-else>
                    The directory path where the folder appears inside the container.<br/>
                    Example: <code>/var/log</code>, <code>/data</code>
                  </span>
                </div>
              </VTooltip>
            </div>
          </VCol>

          <VCol v-if="index !== 0" cols="auto" class="ml-auto d-none d-md-flex align-center">
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
      </VCard>
    </div>

    <!-- Quick action buttons -->
    <div class="d-flex gap-2 flex-wrap">
      <VBtn
        v-if="showAddPath"
        @click="addEntry"
        prepend-icon="mdi-plus"
        variant="flat"
        size="small"
        color="primary"
      >
        {{ t('core.volumePathBuilder.addPath') }}
      </VBtn>

      <VBtn
        v-if="showAddPath"
        @click="addLogsFolder"
        prepend-icon="mdi-text-box"
        variant="outlined"
        size="small"
        color="grey"
      >
        {{ t('core.volumePathBuilder.quickAddLogs') }}
      </VBtn>

      <VBtn
        v-if="showAddPath"
        @click="addConfigFile"
        prepend-icon="mdi-file-cog"
        variant="outlined"
        size="small"
        color="grey"
      >
        {{ t('core.volumePathBuilder.quickAddConfig') }}
      </VBtn>
    </div>

    <!-- Visual Tree - Container View -->
    <VExpansionPanels v-if="entries.length > 0 && treeStructure.length > 0" variant="accordion" class="mt-4" :model-value="[0]">
      <VExpansionPanel>
        <VExpansionPanelTitle class="d-flex align-center">
          <VIcon size="28" class="mr-2" color="grey">mdi-docker</VIcon>
          <strong>Container Filesystem View</strong>
        </VExpansionPanelTitle>
        <VExpansionPanelText>
          <div class="tree-view-container">
            <!-- Element Plus Tree with Custom Nodes -->
            <ElTree
              v-if="treeStructure.length > 0"
              :data="treeStructure"
              :props="{ label: 'label', children: 'children' }"
              default-expand-all
              class="tree-content"
              style="background: transparent !important; background-color: transparent !important;"
            >
              <template #default="{ data }">
                <!-- Desktop: horizontal layout -->
                <div class="mount-info d-none d-md-flex flex-wrap align-center ga-2" style="width: 100%; align-items: center !important;">
                  <VIcon size="18" style="display: flex; align-items: center;">
                    {{ getMountTypeIcon(data.entry.mountType) }}
                  </VIcon>
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    class="font-weight-medium"
                    style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important; display: inline-flex !important; align-items: center !important;"
                  >
                    {{ data.entry.path }}
                  </VChip>
                  <VIcon size="20" class="text-medium-emphasis" style="display: flex; align-items: center;">mdi-arrow-left-bold</VIcon>
                  <VIcon size="18" style="display: flex; align-items: center;">mdi-harddisk</VIcon>
                  <VChip
                    size="small"
                    color="grey"
                    variant="tonal"
                    class="font-mono"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important; display: inline-flex !important; align-items: center !important;"
                  >
                    /apps/flux[appid]/{{ data.entry.subdir || 'appdata' }}
                  </VChip>
                  <div style="flex-grow: 1;"></div>
                  <template v-if="data.entry.mountType === 'primary' && syncConfig.enabled">
                    <VIcon size="20" color="warning" style="display: flex; align-items: center;">
                      {{ syncConfig.mode === 'r' ? 'mdi-alpha-r-circle' :
                        syncConfig.mode === 'g' ? 'mdi-alpha-g-circle' :
                        'mdi-alpha-s-circle' }}
                    </VIcon>
                    <VIcon size="20" color="warning" class="sync-icon-animated" style="display: flex; align-items: center;">mdi-sync</VIcon>
                  </template>
                  <template v-else-if="isEntryUnderSyncedPath(data.entry)">
                    <VIcon size="20" color="warning" class="sync-icon-animated" style="display: flex; align-items: center;">mdi-sync</VIcon>
                  </template>
                  <template v-else-if="syncConfig.enabled && syncConfig.mode === 'g' && data.entry.mountType !== 'primary' && isEntryUnderSyncedPath(data.entry)">
                    <VIcon size="20" color="info" style="display: flex; align-items: center;">mdi-eye</VIcon>
                  </template>
                  <VChip
                    size="x-small"
                    variant="flat"
                    color="grey"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important; display: inline-flex !important; align-items: center !important;"
                  >
                    {{ data.entry.mountType === 'primary' ? 'Primary' :
                      data.entry.mountType === 'directory' ? 'Directory' :
                      data.entry.mountType === 'file' ? 'File' :
                      data.entry.mountType === 'component_directory' ? 'Component Dir' :
                      data.entry.mountType === 'component_file' ? 'Component File' : 'Component' }}
                  </VChip>
                </div>

                <!-- Mobile: vertical layout -->
                <div class="mount-info d-flex d-md-none flex-column align-start ga-2" style="width: 100%;">
                  <div class="d-flex align-center ga-2">
                    <VIcon size="18">{{ getMountTypeIcon(data.entry.mountType) }}</VIcon>
                    <VChip
                      size="small"
                      color="success"
                      variant="tonal"
                      class="font-weight-medium"
                      style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                    >
                      {{ data.entry.path }}
                    </VChip>
                  </div>
                  <div class="d-flex align-center ga-2">
                    <VIcon size="18">mdi-harddisk</VIcon>
                    <VChip
                      size="small"
                      color="grey"
                      variant="tonal"
                      class="font-mono"
                      style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                    >
                      /apps/flux[appid]/{{ data.entry.subdir || 'appdata' }}
                    </VChip>
                  </div>
                  <div class="d-flex align-center justify-end ga-2 flex-wrap" style="width: 100%;">
                    <template v-if="data.entry.mountType === 'primary' && syncConfig.enabled">
                      <VIcon size="20" color="warning">
                        {{ syncConfig.mode === 'r' ? 'mdi-alpha-r-circle' :
                          syncConfig.mode === 'g' ? 'mdi-alpha-g-circle' :
                          'mdi-alpha-s-circle' }}
                      </VIcon>
                      <VIcon size="20" color="warning" class="sync-icon-animated">mdi-sync</VIcon>
                    </template>
                    <template v-else-if="isEntryUnderSyncedPath(data.entry)">
                      <VIcon size="20" color="warning" class="sync-icon-animated">mdi-sync</VIcon>
                    </template>
                    <template v-else-if="syncConfig.enabled && syncConfig.mode === 'g' && data.entry.mountType !== 'primary' && isEntryUnderSyncedPath(data.entry)">
                      <VIcon size="20" color="info">mdi-eye</VIcon>
                    </template>
                    <VChip
                      size="x-small"
                      variant="flat"
                      color="grey"
                      style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                    >
                      {{ data.entry.mountType === 'primary' ? 'Primary' :
                        data.entry.mountType === 'directory' ? 'Directory' :
                        data.entry.mountType === 'file' ? 'File' :
                        data.entry.mountType === 'component_directory' ? 'Component Dir' :
                        data.entry.mountType === 'component_file' ? 'Component File' : 'Component' }}
                    </VChip>
                  </div>
                </div>
              </template>
            </ElTree>
          </div>
        </VExpansionPanelText>
      </VExpansionPanel>
    </VExpansionPanels>

    <VExpansionPanels v-model="expandedPanels" variant="accordion" class="mt-4">
      <!-- Panel 1: Validation Logs -->
      <VExpansionPanel>
        <VExpansionPanelTitle class="d-flex align-center">
          <VIcon :color="validationLogs.length === 0 ? 'success' : 'error'" size="21" class="mr-2">{{ validationLogs.length === 0 ? 'mdi-file-document-check' : 'mdi-file-document-remove' }}</VIcon>
          {{ t('core.volumePathBuilder.validationLogs') }}
        </VExpansionPanelTitle>
        <VExpansionPanelText>
          <div v-if="validationLogs.length === 0">
            {{ t('core.volumePathBuilder.noValidationErrors') }}
          </div>
          <VList v-else dense>
            <VListItem
              v-for="(log, idx) in validationLogs"
              :key="idx"
            >
              <VListItemTitle>
                {{ t('core.volumePathBuilder.entryLabel', { index: log.index, mode: log.mode || 'none', path: log.path }) }}
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
          <VIcon size="21" class="mr-2">mdi-information</VIcon>
          {{ t('core.volumePathBuilder.generalInfoTitle') }}
        </VExpansionPanelTitle>
        <VExpansionPanelText>
          <!-- Mount Type Cards -->
          <h4 class="text-h6 mb-3 mt-2 d-flex align-center">
            <VIcon icon="mdi-file-tree" size="22" class="mr-2" />
            <strong>{{ t('core.volumePathBuilder.mountTypesTitle') }}</strong>
          </h4>
          <div class="mount-types-grid">
            <div v-for="mountType in mountTypeOptions" :key="mountType.value" class="mount-type-compact-card">
              <div class="d-flex align-center mb-2">
                <VIcon :icon="mountType.icon" size="20" class="mr-2" color="grey" />
                <span class="text-subtitle-2 font-weight-bold">{{ mountType.label }}</span>
              </div>
              <div class="mount-type-example-compact">
                <code>{{ mountType.example }}</code>
              </div>
            </div>
          </div>

          <!-- Sync Modes Section -->
          <h4 class="text-h6 mb-3 mt-6 d-flex align-center">
            <VIcon icon="mdi-sync-circle" size="22" class="mr-2" />
            <strong>{{ t('core.volumePathBuilder.syncModesTitle') }}</strong>
          </h4>
          <div class="info-section-card mb-4">
            <div class="info-section-content">
              <div v-if="isUsingSMode" class="info-item mb-3">
                <div class="d-flex align-start">
                  <VIcon icon="mdi-alpha-s-circle" size="18" color="error" class="mr-2 mt-1" />
                  <div>
                    <div class="font-weight-bold text-body-2">{{ t('core.volumePathBuilder.syncModesMasterMasterLabel') }}</div>
                    <div class="text-caption">{{ t('core.volumePathBuilder.syncModesMasterMasterDesc') }} (Deprecated)</div>
                  </div>
                </div>
              </div>
              <div class="info-item mb-3">
                <div class="d-flex align-start">
                  <VIcon icon="mdi-alpha-r-circle" size="18" color="success" class="mr-2 mt-1" />
                  <div>
                    <div class="font-weight-bold text-body-2">{{ t('core.volumePathBuilder.syncModesPhasedMasterMasterLabel') }}</div>
                    <div class="text-caption">{{ t('core.volumePathBuilder.syncModesPhasedMasterMasterDesc') }}</div>
                  </div>
                </div>
              </div>
              <div class="info-item">
                <div class="d-flex align-start">
                  <VIcon icon="mdi-alpha-g-circle" size="18" color="info" class="mr-2 mt-1" />
                  <div>
                    <div class="font-weight-bold text-body-2">{{ t('core.volumePathBuilder.syncModesPrimaryStandbyLabel') }}</div>
                    <div class="text-caption">{{ t('core.volumePathBuilder.syncModesPrimaryStandbyDesc') }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Examples Section -->
          <h4 class="text-h6 mb-3 mt-5 d-flex align-center">
            <VIcon icon="mdi-lightbulb-on" size="22" class="mr-2" />
            <strong>{{ t('core.volumePathBuilder.examplesTitle') }}</strong>
          </h4>

          <!-- Example 1: Basic app -->
          <div class="example-card mb-3">
            <div class="d-flex align-center mb-3">
              <VIcon icon="mdi-numeric-1-circle" size="20" class="mr-2" />
              <span class="text-subtitle-2 font-weight-bold">{{ t('core.volumePathBuilder.exampleBasicLabel') }}</span>
            </div>
            <div class="text-caption mb-3">{{ t('core.volumePathBuilder.exampleBasicDesc') }}</div>

            <!-- Container Data String -->
            <div class="example-string mb-3">
              <code class="d-block pa-2">/data</code>
            </div>

            <!-- Tree View -->
            <div class="example-tree">
              <!-- Desktop layout -->
              <div class="tree-item d-none d-md-flex align-center">
                <VIcon size="18" class="mr-2">mdi-database</VIcon>
                <VChip
                  size="small"
                  color="success"
                  variant="tonal"
                  class="mr-2 font-weight-medium"
                  style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                >/data</VChip>
                <VIcon size="20" class="mx-2 text-medium-emphasis">mdi-arrow-left-bold</VIcon>
                <VIcon size="18" class="mr-1">mdi-harddisk</VIcon>
                <VChip
                  size="small"
                  color="grey"
                  variant="tonal"
                  class="mr-2 font-mono"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >/apps/flux[appid]/appdata</VChip>
                <div style="flex-grow: 1;"></div>
                <VChip
                  size="x-small"
                  variant="flat"
                  color="grey"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >Primary</VChip>
              </div>

              <!-- Mobile layout -->
              <div class="tree-item-mobile d-flex d-md-none flex-column ga-2">
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-database</VIcon>
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    class="font-weight-medium"
                    style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                  >/data</VChip>
                </div>
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-harddisk</VIcon>
                  <VChip
                    size="small"
                    color="grey"
                    variant="tonal"
                    class="font-mono"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >/apps/flux[appid]/appdata</VChip>
                </div>
                <div class="d-flex justify-end" style="width: 100%;">
                  <VChip
                    size="x-small"
                    variant="flat"
                    color="grey"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >Primary</VChip>
                </div>
              </div>
            </div>
          </div>

          <!-- Example 2: With additional directory mount -->
          <div class="example-card mb-3">
            <div class="d-flex align-center mb-3">
              <VIcon icon="mdi-numeric-2-circle" size="20" class="mr-2" />
              <span class="text-subtitle-2 font-weight-bold">{{ t('core.volumePathBuilder.exampleDirectoryLabel') }}</span>
            </div>
            <div class="text-caption mb-3">{{ t('core.volumePathBuilder.exampleDirectoryDesc') }}</div>

            <!-- Container Data String -->
            <div class="example-string mb-3">
              <code class="d-block pa-2">/data|m:logs:/var/log</code>
            </div>

            <!-- Tree View -->
            <div class="example-tree">
              <!-- Desktop layout -->
              <div class="tree-item d-none d-md-flex align-center mb-2">
                <VIcon size="18" class="mr-2">mdi-database</VIcon>
                <VChip
                  size="small"
                  color="success"
                  variant="tonal"
                  class="mr-2 font-weight-medium"
                  style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                >/data</VChip>
                <VIcon size="20" class="mx-2 text-medium-emphasis">mdi-arrow-left-bold</VIcon>
                <VIcon size="18" class="mr-1">mdi-harddisk</VIcon>
                <VChip
                  size="small"
                  color="grey"
                  variant="tonal"
                  class="mr-2 font-mono"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >/apps/flux[appid]/appdata</VChip>
                <div style="flex-grow: 1;"></div>
                <VChip
                  size="x-small"
                  variant="flat"
                  color="grey"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >Primary</VChip>
              </div>
              <!-- Mobile layout -->
              <div class="tree-item-mobile d-flex d-md-none flex-column ga-2 mb-2">
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-database</VIcon>
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    class="font-weight-medium"
                    style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                  >/data</VChip>
                </div>
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-harddisk</VIcon>
                  <VChip
                    size="small"
                    color="grey"
                    variant="tonal"
                    class="font-mono"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >/apps/flux[appid]/appdata</VChip>
                </div>
                <div class="d-flex justify-end" style="width: 100%;">
                  <VChip
                    size="x-small"
                    variant="flat"
                    color="grey"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >Primary</VChip>
                </div>
              </div>

              <!-- Desktop layout -->
              <div class="tree-item d-none d-md-flex align-center">
                <VIcon size="18" class="mr-2">mdi-folder</VIcon>
                <VChip
                  size="small"
                  color="success"
                  variant="tonal"
                  class="mr-2 font-weight-medium"
                  style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                >/var/log</VChip>
                <VIcon size="20" class="mx-2 text-medium-emphasis">mdi-arrow-left-bold</VIcon>
                <VIcon size="18" class="mr-1">mdi-harddisk</VIcon>
                <VChip
                  size="small"
                  color="grey"
                  variant="tonal"
                  class="mr-2 font-mono"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >/apps/flux[appid]/logs</VChip>
                <div style="flex-grow: 1;"></div>
                <VChip
                  size="x-small"
                  variant="flat"
                  color="grey"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >Directory</VChip>
              </div>
              <!-- Mobile layout -->
              <div class="tree-item-mobile d-flex d-md-none flex-column ga-2">
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-folder</VIcon>
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    class="font-weight-medium"
                    style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                  >/var/log</VChip>
                </div>
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-harddisk</VIcon>
                  <VChip
                    size="small"
                    color="grey"
                    variant="tonal"
                    class="font-mono"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >/apps/flux[appid]/logs</VChip>
                </div>
                <div class="d-flex justify-end" style="width: 100%;">
                  <VChip
                    size="x-small"
                    variant="flat"
                    color="grey"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >Directory</VChip>
                </div>
              </div>
            </div>
          </div>

          <!-- Example 3: With file mount -->
          <div class="example-card mb-3">
            <div class="d-flex align-center mb-3">
              <VIcon icon="mdi-numeric-3-circle" size="20" class="mr-2" />
              <span class="text-subtitle-2 font-weight-bold">{{ t('core.volumePathBuilder.exampleFileLabel') }}</span>
            </div>
            <div class="text-caption mb-3">{{ t('core.volumePathBuilder.exampleFileDesc') }}</div>

            <!-- Container Data String -->
            <div class="example-string mb-3">
              <code class="d-block pa-2">/data|f:config.yaml:/etc/config.yaml</code>
            </div>

            <!-- Tree View -->
            <div class="example-tree">
              <!-- Desktop layout -->
              <div class="tree-item d-none d-md-flex align-center mb-2">
                <VIcon size="18" class="mr-2">mdi-database</VIcon>
                <VChip
                  size="small"
                  color="success"
                  variant="tonal"
                  class="mr-2 font-weight-medium"
                  style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                >/data</VChip>
                <VIcon size="20" class="mx-2 text-medium-emphasis">mdi-arrow-left-bold</VIcon>
                <VIcon size="18" class="mr-1">mdi-harddisk</VIcon>
                <VChip
                  size="small"
                  color="grey"
                  variant="tonal"
                  class="mr-2 font-mono"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >/apps/flux[appid]/appdata</VChip>
                <div style="flex-grow: 1;"></div>
                <VChip
                  size="x-small"
                  variant="flat"
                  color="grey"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >Primary</VChip>
              </div>
              <!-- Mobile layout -->
              <div class="tree-item-mobile d-flex d-md-none flex-column ga-2 mb-2">
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-database</VIcon>
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    class="font-weight-medium"
                    style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                  >/data</VChip>
                </div>
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-harddisk</VIcon>
                  <VChip
                    size="small"
                    color="grey"
                    variant="tonal"
                    class="font-mono"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >/apps/flux[appid]/appdata</VChip>
                </div>
                <div class="d-flex justify-end" style="width: 100%;">
                  <VChip
                    size="x-small"
                    variant="flat"
                    color="grey"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >Primary</VChip>
                </div>
              </div>

              <!-- Desktop layout -->
              <div class="tree-item d-none d-md-flex align-center">
                <VIcon size="18" class="mr-2">mdi-file</VIcon>
                <VChip
                  size="small"
                  color="success"
                  variant="tonal"
                  class="mr-2 font-weight-medium"
                  style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                >/etc/config.yaml</VChip>
                <VIcon size="20" class="mx-2 text-medium-emphasis">mdi-arrow-left-bold</VIcon>
                <VIcon size="18" class="mr-1">mdi-harddisk</VIcon>
                <VChip
                  size="small"
                  color="grey"
                  variant="tonal"
                  class="mr-2 font-mono"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >/apps/flux[appid]/config.yaml</VChip>
                <div style="flex-grow: 1;"></div>
                <VChip
                  size="x-small"
                  variant="flat"
                  color="grey"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >File</VChip>
              </div>
              <!-- Mobile layout -->
              <div class="tree-item-mobile d-flex d-md-none flex-column ga-2">
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-file</VIcon>
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    class="font-weight-medium"
                    style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                  >/etc/config.yaml</VChip>
                </div>
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-harddisk</VIcon>
                  <VChip
                    size="small"
                    color="grey"
                    variant="tonal"
                    class="font-mono"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >/apps/flux[appid]/config.yaml</VChip>
                </div>
                <div class="d-flex justify-end" style="width: 100%;">
                  <VChip
                    size="x-small"
                    variant="flat"
                    color="grey"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >File</VChip>
                </div>
              </div>
            </div>
          </div>

          <!-- Example 4: Mixed mounts -->
          <div class="example-card mb-3">
            <div class="d-flex align-center mb-3">
              <VIcon icon="mdi-numeric-4-circle" size="20" class="mr-2" />
              <span class="text-subtitle-2 font-weight-bold">{{ t('core.volumePathBuilder.exampleMixedLabel') }}</span>
            </div>
            <div class="text-caption mb-3">{{ t('core.volumePathBuilder.exampleMixedDesc') }}</div>

            <!-- Container Data String -->
            <div class="example-string mb-3">
              <code class="d-block pa-2">r:/data|m:logs:/var/log|f:config.yaml:/etc/config.yaml</code>
            </div>

            <!-- Tree View -->
            <div class="example-tree">
              <!-- Desktop layout -->
              <div class="tree-item d-none d-md-flex align-center mb-2">
                <VIcon size="18" class="mr-2">mdi-database</VIcon>
                <VChip
                  size="small"
                  color="success"
                  variant="tonal"
                  class="mr-2 font-weight-medium"
                  style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                >/data</VChip>
                <VIcon size="20" class="mx-2 text-medium-emphasis">mdi-arrow-left-bold</VIcon>
                <VIcon size="18" class="mr-1">mdi-harddisk</VIcon>
                <VChip
                  size="small"
                  color="grey"
                  variant="tonal"
                  class="mr-2 font-mono"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >/apps/flux[appid]/appdata</VChip>
                <div style="flex-grow: 1;"></div>
                <VIcon size="20" color="warning" class="mr-1">mdi-alpha-r-circle</VIcon>
                <VIcon size="20" color="warning" class="mr-2 sync-icon-animated">mdi-sync</VIcon>
                <VChip
                  size="x-small"
                  variant="flat"
                  color="grey"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >Primary</VChip>
              </div>
              <!-- Mobile layout -->
              <div class="tree-item-mobile d-flex d-md-none flex-column ga-2 mb-2">
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-database</VIcon>
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    class="font-weight-medium"
                    style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                  >/data</VChip>
                </div>
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-harddisk</VIcon>
                  <VChip
                    size="small"
                    color="grey"
                    variant="tonal"
                    class="font-mono"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >/apps/flux[appid]/appdata</VChip>
                </div>
                <div class="d-flex justify-end ga-2" style="width: 100%;">
                  <VIcon size="20" color="warning">mdi-alpha-r-circle</VIcon>
                  <VIcon size="20" color="warning" class="sync-icon-animated">mdi-sync</VIcon>
                  <VChip
                    size="x-small"
                    variant="flat"
                    color="grey"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >Primary</VChip>
                </div>
              </div>

              <!-- Desktop layout -->
              <div class="tree-item d-none d-md-flex align-center mb-2">
                <VIcon size="18" class="mr-2">mdi-folder</VIcon>
                <VChip
                  size="small"
                  color="success"
                  variant="tonal"
                  class="mr-2 font-weight-medium"
                  style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                >/var/log</VChip>
                <VIcon size="20" class="mx-2 text-medium-emphasis">mdi-arrow-left-bold</VIcon>
                <VIcon size="18" class="mr-1">mdi-harddisk</VIcon>
                <VChip
                  size="small"
                  color="grey"
                  variant="tonal"
                  class="mr-2 font-mono"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >/apps/flux[appid]/logs</VChip>
                <div style="flex-grow: 1;"></div>
                <VIcon size="20" color="warning" class="mr-2 sync-icon-animated">mdi-sync</VIcon>
                <VChip
                  size="x-small"
                  variant="flat"
                  color="grey"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >Directory</VChip>
              </div>
              <!-- Mobile layout -->
              <div class="tree-item-mobile d-flex d-md-none flex-column ga-2 mb-2">
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-folder</VIcon>
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    class="font-weight-medium"
                    style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                  >/var/log</VChip>
                </div>
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-harddisk</VIcon>
                  <VChip
                    size="small"
                    color="grey"
                    variant="tonal"
                    class="font-mono"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >/apps/flux[appid]/logs</VChip>
                </div>
                <div class="d-flex justify-end ga-2" style="width: 100%;">
                  <VIcon size="20" color="warning" class="sync-icon-animated">mdi-sync</VIcon>
                  <VChip
                    size="x-small"
                    variant="flat"
                    color="grey"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >Directory</VChip>
                </div>
              </div>

              <!-- Desktop layout -->
              <div class="tree-item d-none d-md-flex align-center">
                <VIcon size="18" class="mr-2">mdi-file</VIcon>
                <VChip
                  size="small"
                  color="success"
                  variant="tonal"
                  class="mr-2 font-weight-medium"
                  style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                >/etc/config.yaml</VChip>
                <VIcon size="20" class="mx-2 text-medium-emphasis">mdi-arrow-left-bold</VIcon>
                <VIcon size="18" class="mr-1">mdi-harddisk</VIcon>
                <VChip
                  size="small"
                  color="grey"
                  variant="tonal"
                  class="mr-2 font-mono"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >/apps/flux[appid]/config.yaml</VChip>
                <div style="flex-grow: 1;"></div>
                <VIcon size="20" color="warning" class="mr-2 sync-icon-animated">mdi-sync</VIcon>
                <VChip
                  size="x-small"
                  variant="flat"
                  color="grey"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >File</VChip>
              </div>
              <!-- Mobile layout -->
              <div class="tree-item-mobile d-flex d-md-none flex-column ga-2">
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-file</VIcon>
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    class="font-weight-medium"
                    style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                  >/etc/config.yaml</VChip>
                </div>
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-harddisk</VIcon>
                  <VChip
                    size="small"
                    color="grey"
                    variant="tonal"
                    class="font-mono"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >/apps/flux[appid]/config.yaml</VChip>
                </div>
                <div class="d-flex justify-end ga-2" style="width: 100%;">
                  <VIcon size="20" color="warning" class="sync-icon-animated">mdi-sync</VIcon>
                  <VChip
                    size="x-small"
                    variant="flat"
                    color="grey"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >File</VChip>
                </div>
              </div>
            </div>
          </div>

          <!-- Example 5: Component mount -->
          <div class="example-card mb-4">
            <div class="d-flex align-center mb-3">
              <VIcon icon="mdi-numeric-5-circle" size="20" class="mr-2" />
              <span class="text-subtitle-2 font-weight-bold">{{ t('core.volumePathBuilder.exampleComponentLabel') }}</span>
            </div>
            <div class="text-caption mb-3">{{ t('core.volumePathBuilder.exampleComponentDesc') }}</div>

            <!-- Container Data String -->
            <div class="example-string mb-3">
              <code class="d-block pa-2">/app|c:0:data:/db|c:0:backups:/restore</code>
            </div>

            <!-- Tree View -->
            <div class="example-tree">
              <!-- Desktop layout -->
              <div class="tree-item d-none d-md-flex align-center mb-2">
                <VIcon size="18" class="mr-2">mdi-database</VIcon>
                <VChip
                  size="small"
                  color="success"
                  variant="tonal"
                  class="mr-2 font-weight-medium"
                  style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                >/app</VChip>
                <VIcon size="20" class="mx-2 text-medium-emphasis">mdi-arrow-left-bold</VIcon>
                <VIcon size="18" class="mr-1">mdi-harddisk</VIcon>
                <VChip
                  size="small"
                  color="grey"
                  variant="tonal"
                  class="mr-2 font-mono"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >/apps/flux[appid]/appdata</VChip>
                <div style="flex-grow: 1;"></div>
                <VChip
                  size="x-small"
                  variant="flat"
                  color="grey"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >Primary</VChip>
              </div>
              <!-- Mobile layout -->
              <div class="tree-item-mobile d-flex d-md-none flex-column ga-2 mb-2">
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-database</VIcon>
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    class="font-weight-medium"
                    style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                  >/app</VChip>
                </div>
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-harddisk</VIcon>
                  <VChip
                    size="small"
                    color="grey"
                    variant="tonal"
                    class="font-mono"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >/apps/flux[appid]/appdata</VChip>
                </div>
                <div class="d-flex justify-end" style="width: 100%;">
                  <VChip
                    size="x-small"
                    variant="flat"
                    color="grey"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >Primary</VChip>
                </div>
              </div>

              <!-- Desktop layout -->
              <div class="tree-item d-none d-md-flex align-center mb-2">
                <VIcon size="18" class="mr-2">mdi-vector-link</VIcon>
                <VChip
                  size="small"
                  color="success"
                  variant="tonal"
                  class="mr-2 font-weight-medium"
                  style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                >/db</VChip>
                <VIcon size="20" class="mx-2 text-medium-emphasis">mdi-arrow-left-bold</VIcon>
                <VIcon size="18" class="mr-1">mdi-harddisk</VIcon>
                <VChip
                  size="small"
                  color="grey"
                  variant="tonal"
                  class="mr-2 font-mono"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >/apps/fluxCOMP0/data</VChip>
                <div style="flex-grow: 1;"></div>
                <VChip
                  size="x-small"
                  variant="flat"
                  color="grey"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >Component Dir</VChip>
              </div>
              <!-- Mobile layout -->
              <div class="tree-item-mobile d-flex d-md-none flex-column ga-2 mb-2">
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-vector-link</VIcon>
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    class="font-weight-medium"
                    style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                  >/db</VChip>
                </div>
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-harddisk</VIcon>
                  <VChip
                    size="small"
                    color="grey"
                    variant="tonal"
                    class="font-mono"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >/apps/fluxCOMP0/data</VChip>
                </div>
                <div class="d-flex justify-end" style="width: 100%;">
                  <VChip
                    size="x-small"
                    variant="flat"
                    color="grey"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >Component Dir</VChip>
                </div>
              </div>

              <!-- Desktop layout -->
              <div class="tree-item d-none d-md-flex align-center">
                <VIcon size="18" class="mr-2">mdi-folder-network</VIcon>
                <VChip
                  size="small"
                  color="success"
                  variant="tonal"
                  class="mr-2 font-weight-medium"
                  style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                >/restore</VChip>
                <VIcon size="20" class="mx-2 text-medium-emphasis">mdi-arrow-left-bold</VIcon>
                <VIcon size="18" class="mr-1">mdi-harddisk</VIcon>
                <VChip
                  size="small"
                  color="grey"
                  variant="tonal"
                  class="mr-2 font-mono"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >/apps/fluxCOMP0/backups</VChip>
                <div style="flex-grow: 1;"></div>
                <VChip
                  size="x-small"
                  variant="flat"
                  color="grey"
                  style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                >Component Dir</VChip>
              </div>
              <!-- Mobile layout -->
              <div class="tree-item-mobile d-flex d-md-none flex-column ga-2">
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-folder-network</VIcon>
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    class="font-weight-medium"
                    style="background-color: rgba(var(--v-theme-success), 0.16) !important; color: rgb(var(--v-theme-success)) !important;"
                  >/restore</VChip>
                </div>
                <div class="d-flex align-center ga-2">
                  <VIcon size="18">mdi-harddisk</VIcon>
                  <VChip
                    size="small"
                    color="grey"
                    variant="tonal"
                    class="font-mono"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >/apps/fluxCOMP0/backups</VChip>
                </div>
                <div class="d-flex justify-end" style="width: 100%;">
                  <VChip
                    size="x-small"
                    variant="flat"
                    color="grey"
                    style="background-color: rgba(var(--v-theme-on-surface), 0.12) !important; color: rgb(var(--v-theme-on-surface)) !important;"
                  >Component Dir</VChip>
                </div>
              </div>
            </div>
          </div>

          <!-- Validation Rules Section -->
          <h4 class="text-h6 mb-3 mt-5 d-flex align-center">
            <VIcon icon="mdi-shield-check" size="22" class="mr-2" />
            <strong>{{ t('core.volumePathBuilder.rulesTitle') }}</strong>
          </h4>
          <div class="info-section-card">
            <div class="info-section-content">
              <div class="info-item mb-2">
                <div class="d-flex align-center">
                  <VIcon icon="mdi-check-circle" size="16" color="success" class="mr-2" />
                  <div class="text-caption">First entry must be Primary type (cannot reference another component)</div>
                </div>
              </div>
              <div class="info-item mb-2">
                <div class="d-flex align-center">
                  <VIcon icon="mdi-check-circle" size="16" color="success" class="mr-2" />
                  <div class="text-caption">Container paths must be unique (no duplicates)</div>
                </div>
              </div>
              <div class="info-item mb-2">
                <div class="d-flex align-center">
                  <VIcon icon="mdi-check-circle" size="16" color="success" class="mr-2" />
                  <div class="text-caption">Host subdirectories/filenames must be unique within the component</div>
                </div>
              </div>
              <div class="info-item mb-2">
                <div class="d-flex align-center">
                  <VIcon icon="mdi-check-circle" size="16" color="success" class="mr-2" />
                  <div class="text-caption">All container paths must start with / and cannot contain special characters (: | &lt; &gt; " \ ? *)</div>
                </div>
              </div>
              <div class="info-item mb-2">
                <div class="d-flex align-center">
                  <VIcon icon="mdi-check-circle" size="16" color="success" class="mr-2" />
                  <div class="text-caption">Component references (Mode with numbers) can only point to earlier components</div>
                </div>
              </div>
              <div class="info-item mb-2">
                <div class="d-flex align-center">
                  <VIcon icon="mdi-check-circle" size="16" color="success" class="mr-2" />
                  <div class="text-caption">When sync is enabled on the primary mount, all mounts in that component are synchronized across instances</div>
                </div>
              </div>
              <div class="info-item mb-2">
                <div class="d-flex align-center">
                  <VIcon icon="mdi-check-circle" size="16" color="success" class="mr-2" />
                  <div class="text-caption">File mount container paths must include the filename with extension</div>
                </div>
              </div>
              <div class="info-item">
                <div class="d-flex align-center">
                  <VIcon icon="mdi-check-circle" size="16" color="success" class="mr-2" />
                  <div class="text-caption">Reserved host folder names: appdata, backup</div>
                </div>
              </div>
            </div>
          </div>
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

.font-mono {
  font-family: 'Roboto Mono', 'Courier New', monospace;
}

code {
  background: rgba(var(--v-theme-on-surface), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  font-size: 0.9em;
}

.mount-type-item {
  padding: 12px 16px !important;
  min-height: auto !important;
}

.mount-type-item.v-list-item--active,
.v-list-item--active,
.v-list-item.v-list-item--active {
  background-color: rgba(var(--v-theme-success), 0.12) !important;
}

.v-list-item--active .v-list-item__overlay {
  background-color: rgb(var(--v-theme-success)) !important;
  opacity: 0.12 !important;
}

.mount-type-item.v-list-item--active .v-list-item-title,
.v-list-item--active .v-list-item-title,
.v-list-item--active .v-list-item__title,
.v-list-item--active .font-weight-medium,
.v-list-item--active div {
  color: rgb(var(--v-theme-success)) !important;
}

.v-list-item--active .v-list-item__subtitle,
.v-list-item--active .text-caption {
  color: rgba(var(--v-theme-success), 0.7) !important;
}

.mount-type-example {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 6px;
}

.mount-type-example code {
  display: block;
  background: transparent;
  padding: 0;
  font-size: 0.85em;
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-weight: 500;
}

.mount-type-info-card {
  padding: 16px;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.6);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: all 0.2s ease;
}

.mount-type-info-card:hover {
  background: rgba(var(--v-theme-surface-variant), 0.75);
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.mount-type-example-info {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 6px;
  border-left: 3px solid rgba(var(--v-theme-primary), 0.5);
}

.mount-type-example-info code {
  display: block;
  background: transparent;
  padding: 0;
  font-size: 0.85em;
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-weight: 500;
  font-family: 'Roboto Mono', 'Courier New', monospace;
}

.sync-icon-animated {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.mount-types-card {
  padding: 14px 16px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.mount-types-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}

/* Mobile: Single column for mount types */
@media (max-width: 959px) {
  .mount-types-grid {
    grid-template-columns: 1fr;
  }
}

.mount-type-compact-card {
  padding: 14px 16px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.mount-type-example-compact {
  padding: 6px 10px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 4px;
  border-left: 2px solid rgba(var(--v-theme-primary), 0.8);
}

.mount-type-example-compact code {
  display: block;
  background: transparent;
  padding: 0;
  font-size: 0.8em;
  color: rgba(var(--v-theme-on-surface), 0.95);
  font-weight: 500;
  font-family: 'Roboto Mono', 'Courier New', monospace;
}

.info-section-card {
  padding: 14px 16px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.info-section-content {
  padding-left: 8px;
}

.info-item {
  line-height: 1.5;
}

.info-item .text-caption {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.example-card {
  padding: 14px 16px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.06) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}

.example-card .text-caption {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.mount-type-card .text-caption {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.sync-mode-card .text-caption {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.example-string {
  padding: 4px 8px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 4px;
  border-left: 2px solid rgba(var(--v-theme-primary), 0.6);
}

.example-string code {
  background: transparent;
  padding: 0;
  font-size: 0.85em;
  color: rgb(var(--v-theme-on-surface));
}

.example-tree {
  padding: 8px 0;
}

.tree-item {
  display: flex;
  align-items: center !important;
  width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.tree-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

/* Mobile tree item styling */
.tree-item-mobile {
  padding: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  margin-bottom: 8px;
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

.tree-item-mobile:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

/* Force all elements inside tree-item to align properly */
.tree-item .v-icon {
  display: inline-flex !important;
  align-items: center !important;
}

.tree-item .v-chip {
  display: inline-flex !important;
  align-items: center !important;
}

/* Ensure chips in example trees display with proper colors */
.example-tree .v-chip.v-chip--variant-tonal {
  background-color: unset !important;
}

.example-tree .v-chip[color="success"] {
  background-color: rgba(var(--v-theme-success), 0.16) !important;
  color: rgb(var(--v-theme-success)) !important;
}

.example-tree .v-chip[color="grey"] {
  background-color: rgba(var(--v-theme-on-surface), 0.12) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.example-tree .v-chip.v-chip--variant-flat {
  background-color: rgba(var(--v-theme-on-surface), 0.12) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.v-theme--dark .example-tree .v-chip[color="success"] {
  background-color: rgba(var(--v-theme-success), 0.24) !important;
}
</style>
