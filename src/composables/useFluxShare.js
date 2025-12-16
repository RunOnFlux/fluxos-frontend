import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFluxStore } from '@/stores/flux'
import { useSnackbar } from '@/composables/useSnackbar'
import AppsService from '@/services/AppsService'
import { getDetectedBackendURL } from '@/utils/backend'

// Shared state across all composable instances
const sharedState = {
  files: ref([]),
  loading: ref(false),
  loadingStorage: ref(false),
  currentFolder: ref(''),
  breadcrumbs: ref([{ title: 'home', path: '', isHome: true }]),
  storage: ref({
    used: 0,
    total: 20,
    available: 20,
  }),
  storageChecked: ref(false),

  // Error state management
  errorState: ref({
    hasError: false,
    message: '',
    type: 'error',
    timestamp: null,
  }),

  // AbortController for cancelling pending requests
  folderAbortController: null,
}

export function useFluxShare() {
  const { t } = useI18n()
  const { showSnackbar } = useSnackbar()
  const fluxStore = useFluxStore()

  // Use shared state
  const files = sharedState.files
  const loading = sharedState.loading
  const loadingStorage = sharedState.loadingStorage
  const currentFolder = sharedState.currentFolder
  const breadcrumbs = sharedState.breadcrumbs
  const storage = sharedState.storage
  const storageChecked = sharedState.storageChecked
  const errorState = sharedState.errorState

  // Get zelidauth header
  const getZelidAuth = () => {
    return localStorage.getItem('zelidauth') || ''
  }

  // Get backend URL
  const getBackendURL = () => {
    const backendURL = localStorage.getItem('backendURL')
    if (backendURL) {
      return backendURL
    }

    return getDetectedBackendURL()
  }

  // Get API port from flux store config
  const getApiPort = () => {
    return fluxStore.config?.apiPort || 16127
  }

  // Parse backend URL and return protocol, hostname, and port - helper to avoid duplication
  const parseBackendUrl = () => {
    const baseUrl = getBackendURL()
    const port = getApiPort()
    const urlParts = baseUrl.split(':')
    const protocol = urlParts[0]
    const hostname = urlParts[1]?.replace('//', '') || window.location.hostname

    return { protocol, hostname, port }
  }

  // Authentication check
  const isLoggedIn = computed(() => {
    const zelidauth = getZelidAuth()

    return !!(zelidauth && fluxStore.privilege && fluxStore.privilege !== 'none')
  })

  // Check if user is admin
  const isAdmin = computed(() => {
    return fluxStore.privilege === 'admin' || fluxStore.privilege === 'fluxteam'
  })

  // Storage percentage
  const storagePercentage = computed(() => {
    if (storage.value.total === 0) return 0

    return Math.min(100, (storage.value.used / storage.value.total) * 100)
  })

  // Get upload URL
  const getUploadUrl = () => {
    const { protocol, hostname, port } = parseBackendUrl()

    if (currentFolder.value) {
      const folder = encodeURIComponent(currentFolder.value)

      return `${protocol}://${hostname}:${port}/apps/fluxshare/uploadfile/${folder}`
    }

    return `${protocol}://${hostname}:${port}/apps/fluxshare/uploadfile`
  }

  // Get download URL for a file
  const getDownloadUrl = (fileName, isFolder = false) => {
    const { protocol, hostname, port } = parseBackendUrl()

    const fullPath = currentFolder.value ? `${currentFolder.value}/${fileName}` : fileName
    const encodedPath = encodeURIComponent(fullPath)

    if (isFolder) {
      return `${protocol}://${hostname}:${port}/apps/fluxshare/downloadfolder/${encodedPath}`
    }

    return `${protocol}://${hostname}:${port}/apps/fluxshare/getfile/${encodedPath}`
  }

  // Create share link
  const createShareLink = (fileName, shareToken) => {
    const { protocol, hostname, port } = parseBackendUrl()

    return `${protocol}://${hostname}:${port}/apps/fluxshare/getfile/${fileName}?token=${shareToken}`
  }

  // Set error state
  const setError = (message, type = 'error') => {
    errorState.value = {
      hasError: true,
      message,
      type,
      timestamp: Date.now(),
    }

    showSnackbar(message, type)

    // Auto-clear after 5 seconds
    setTimeout(() => {
      if (errorState.value.timestamp === Date.now()) {
        clearError()
      }
    }, 5000)
  }

  // Clear error state
  const clearError = () => {
    errorState.value = {
      hasError: false,
      message: '',
      type: 'error',
      timestamp: null,
    }
  }

  // Fetch storage stats
  const fetchStorageStats = async () => {
    if (!isLoggedIn.value || !isAdmin.value) return

    try {
      loadingStorage.value = true
      const zelidauth = getZelidAuth()
      const response = await AppsService.storageStats(zelidauth)

      if (response?.data?.status === 'success') {
        const MAX_STORAGE = 20 // 20 GB limit
        const apiTotal = response.data.data.total || 20
        const apiUsed = response.data.data.used || 0
        const apiAvailable = response.data.data.available || 20

        // Cap storage at 20 GB
        const total = Math.min(apiTotal, MAX_STORAGE)
        const used = Math.min(apiUsed, MAX_STORAGE)
        const available = Math.min(apiAvailable, MAX_STORAGE - used)

        storage.value = {
          total,
          used,
          available,
        }
        storageChecked.value = true
      } else {
        const errorMsg = response?.data?.data?.message || response?.data?.data || t('pages.administration.fluxShare.errors.storageStatsFailed')
        setError(errorMsg, 'error')
      }
    } catch (error) {
      console.error('Failed to fetch storage stats:', error)
      setError(error.message || t('pages.administration.fluxShare.errors.storageStatsFailed'), 'error')
    } finally {
      loadingStorage.value = false
    }
  }

  // Load folder contents
  const loadFolder = async (path = '', soft = false) => {
    if (!isLoggedIn.value || !isAdmin.value) return

    // Cancel any pending request before starting a new one
    if (sharedState.folderAbortController) {
      sharedState.folderAbortController.abort()
    }

    // Create new AbortController for this request
    sharedState.folderAbortController = new AbortController()

    try {
      if (!soft) {
        files.value = []
      }
      loading.value = true
      clearError()

      const zelidauth = getZelidAuth()
      const encodedPath = encodeURIComponent(path)
      const response = await AppsService.getFolder(zelidauth, encodedPath, {
        signal: sharedState.folderAbortController.signal,
      })

      if (response?.data?.status === 'success') {
        files.value = response.data.data || []
        currentFolder.value = path
        updateBreadcrumbs(path)
      } else {
        const errorMsg = response?.data?.data?.message || response?.data?.data || t('pages.administration.fluxShare.errors.loadFolderFailed')
        setError(errorMsg, 'error')
      }
    } catch (error) {
      // Ignore abort errors - they are expected when navigating quickly
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return
      }
      console.error('Failed to load folder:', error)
      setError(error.message || t('pages.administration.fluxShare.errors.loadFolderFailed'), 'error')
    } finally {
      loading.value = false
    }
  }

  // Update breadcrumbs based on current path
  const updateBreadcrumbs = path => {
    const crumbs = [{ title: 'home', path: '', isHome: true }]

    if (path) {
      const parts = path.split('/')
      let currentPath = ''

      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        crumbs.push({ title: part, path: currentPath, isHome: false })
      }
    }

    breadcrumbs.value = crumbs
  }

  // Navigate to folder
  const navigateToFolder = folderName => {
    if (folderName === '..') {
      // Go up one level
      const parts = currentFolder.value.split('/')
      parts.pop()
      loadFolder(parts.join('/'))
    } else {
      // Navigate to subfolder
      const newPath = currentFolder.value ? `${currentFolder.value}/${folderName}` : folderName
      loadFolder(newPath)
    }
  }

  // Navigate up one level
  const navigateUp = () => {
    if (!currentFolder.value) return

    const parts = currentFolder.value.split('/')
    parts.pop()
    loadFolder(parts.join('/'))
  }

  // Create folder
  const createFolder = async folderName => {
    if (!isLoggedIn.value || !isAdmin.value) return false

    try {
      loading.value = true
      const zelidauth = getZelidAuth()
      const folderPath = currentFolder.value ? `${currentFolder.value}/${folderName}` : folderName
      const response = await AppsService.createFolder(zelidauth, encodeURIComponent(folderPath))

      if (response?.data?.status === 'success') {
        showSnackbar(t('pages.administration.fluxShare.messages.folderCreated'), 'success')
        await loadFolder(currentFolder.value, true)

        return true
      } else {
        const errorData = response?.data?.data
        if (errorData?.code === 'EEXIST') {
          setError(t('pages.administration.fluxShare.errors.folderExists', { name: folderName }), 'warning')
        } else {
          setError(errorData?.message || errorData || t('pages.administration.fluxShare.errors.createFolderFailed'), 'error')
        }

        return false
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
      setError(error.message || t('pages.administration.fluxShare.errors.createFolderFailed'), 'error')

      return false
    } finally {
      loading.value = false
    }
  }

  // Delete file
  const deleteFile = async fileName => {
    if (!isLoggedIn.value || !isAdmin.value) return false

    try {
      loading.value = true
      const zelidauth = getZelidAuth()
      const filePath = currentFolder.value ? `${currentFolder.value}/${fileName}` : fileName
      const response = await AppsService.removeFile(zelidauth, encodeURIComponent(filePath))

      if (response?.data?.status === 'success') {
        showSnackbar(t('pages.administration.fluxShare.messages.fileDeleted', { name: fileName }), 'success')
        await loadFolder(currentFolder.value, true)
        await fetchStorageStats()

        return true
      } else {
        const errorMsg = response?.data?.data?.message || response?.data?.data || t('pages.administration.fluxShare.errors.deleteFileFailed')
        setError(errorMsg, 'error')

        return false
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
      setError(error.message || t('pages.administration.fluxShare.errors.deleteFileFailed'), 'error')

      return false
    } finally {
      loading.value = false
    }
  }

  // Delete folder
  const deleteFolder = async folderName => {
    if (!isLoggedIn.value || !isAdmin.value) return false

    try {
      loading.value = true
      const zelidauth = getZelidAuth()
      const folderPath = currentFolder.value ? `${currentFolder.value}/${folderName}` : folderName
      const response = await AppsService.removeFolder(zelidauth, encodeURIComponent(folderPath))

      if (response?.data?.status === 'success') {
        showSnackbar(t('pages.administration.fluxShare.messages.folderDeleted', { name: folderName }), 'success')
        await loadFolder(currentFolder.value, true)

        return true
      } else {
        const errorData = response?.data?.data
        if (errorData?.code === 'ENOTEMPTY') {
          setError(t('pages.administration.fluxShare.errors.folderNotEmpty', { name: folderName }), 'warning')
        } else {
          setError(errorData?.message || errorData || t('pages.administration.fluxShare.errors.deleteFolderFailed'), 'error')
        }

        return false
      }
    } catch (error) {
      console.error('Failed to delete folder:', error)
      setError(error.message || t('pages.administration.fluxShare.errors.deleteFolderFailed'), 'error')

      return false
    } finally {
      loading.value = false
    }
  }

  // Rename file or folder
  const rename = async (oldName, newName) => {
    if (!isLoggedIn.value || !isAdmin.value) return false

    if (newName.includes('/')) {
      setError(t('pages.administration.fluxShare.errors.invalidName'), 'warning')

      return false
    }

    try {
      loading.value = true
      const zelidauth = getZelidAuth()
      const oldPath = currentFolder.value ? `${currentFolder.value}/${oldName}` : oldName
      const response = await AppsService.renameFileFolder(zelidauth, encodeURIComponent(oldPath), newName)

      if (response?.data?.status === 'success') {
        showSnackbar(t('pages.administration.fluxShare.messages.renamed', { old: oldName, new: newName }), 'success')
        await loadFolder(currentFolder.value, true)

        return true
      } else {
        const errorMsg = response?.data?.data?.message || response?.data?.data || t('pages.administration.fluxShare.errors.renameFailed')
        setError(errorMsg, 'error')

        return false
      }
    } catch (error) {
      console.error('Failed to rename:', error)
      setError(error.message || t('pages.administration.fluxShare.errors.renameFailed'), 'error')

      return false
    } finally {
      loading.value = false
    }
  }

  // Share file
  const shareFile = async fileName => {
    if (!isLoggedIn.value || !isAdmin.value) return false

    try {
      loading.value = true
      const zelidauth = getZelidAuth()
      const filePath = currentFolder.value ? `${currentFolder.value}/${fileName}` : fileName
      const response = await AppsService.shareFile(zelidauth, encodeURIComponent(filePath))

      if (response?.data?.status === 'success') {
        showSnackbar(t('pages.administration.fluxShare.messages.fileShared', { name: fileName }), 'success')
        await loadFolder(currentFolder.value, true)

        return true
      } else {
        const errorMsg = response?.data?.data?.message || response?.data?.data || t('pages.administration.fluxShare.errors.shareFailed')
        setError(errorMsg, 'error')

        return false
      }
    } catch (error) {
      console.error('Failed to share file:', error)
      setError(error.message || t('pages.administration.fluxShare.errors.shareFailed'), 'error')

      return false
    } finally {
      loading.value = false
    }
  }

  // Unshare file
  const unshareFile = async fileName => {
    if (!isLoggedIn.value || !isAdmin.value) return false

    try {
      loading.value = true
      const zelidauth = getZelidAuth()
      const filePath = currentFolder.value ? `${currentFolder.value}/${fileName}` : fileName
      const response = await AppsService.unshareFile(zelidauth, encodeURIComponent(filePath))

      if (response?.data?.status === 'success') {
        showSnackbar(t('pages.administration.fluxShare.messages.fileUnshared', { name: fileName }), 'success')
        await loadFolder(currentFolder.value, true)

        return true
      } else {
        const errorMsg = response?.data?.data?.message || response?.data?.data || t('pages.administration.fluxShare.errors.unshareFailed')
        setError(errorMsg, 'error')

        return false
      }
    } catch (error) {
      console.error('Failed to unshare file:', error)
      setError(error.message || t('pages.administration.fluxShare.errors.unshareFailed'), 'error')

      return false
    } finally {
      loading.value = false
    }
  }

  // Download file
  const downloadFile = async (fileName, isFolder = false, maxTotalSize = 0) => {
    try {
      const zelidauth = getZelidAuth()
      const downloadUrl = getDownloadUrl(fileName, isFolder)

      const response = await AppsService.justAPI().get(
        isFolder
          ? `/apps/fluxshare/downloadfolder/${encodeURIComponent(currentFolder.value ? `${currentFolder.value}/${fileName}` : fileName)}`
          : `/apps/fluxshare/getfile/${encodeURIComponent(currentFolder.value ? `${currentFolder.value}/${fileName}` : fileName)}`,
        {
          headers: { zelidauth },
          responseType: 'blob',
        },
      )

      if (response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', isFolder ? `${fileName}.zip` : fileName)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        return true
      }

      return false
    } catch (error) {
      console.error('Failed to download:', error)
      setError(error.message || t('pages.administration.fluxShare.errors.downloadFailed'), 'error')

      return false
    }
  }

  // Copy link to clipboard
  const copyToClipboard = async text => {
    try {
      await navigator.clipboard.writeText(text)
      showSnackbar(t('common.messages.copiedToClipboard'), 'success')

      return true
    } catch (error) {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = text
      el.setAttribute('readonly', '')
      el.style.position = 'absolute'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      showSnackbar(t('common.messages.copiedToClipboard'), 'success')

      return true
    }
  }

  // Format file size
  const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  // Refresh current folder and storage
  const refresh = async () => {
    await Promise.all([
      loadFolder(currentFolder.value, true),
      fetchStorageStats(),
    ])
  }

  // Cancel any pending requests
  const cancelPendingRequests = () => {
    if (sharedState.folderAbortController) {
      sharedState.folderAbortController.abort()
      sharedState.folderAbortController = null
    }
  }

  // Reset state
  const resetState = () => {
    // Cancel any pending requests first
    cancelPendingRequests()

    files.value = []
    currentFolder.value = ''
    breadcrumbs.value = [{ title: 'home', path: '', isHome: true }]
    storage.value = { used: 0, total: 20, available: 20 }
    storageChecked.value = false
    loading.value = false
    loadingStorage.value = false
    clearError()
  }

  return {
    // State
    files,
    loading,
    loadingStorage,
    currentFolder,
    breadcrumbs,
    storage,
    storageChecked,
    errorState,

    // Computed
    isLoggedIn,
    isAdmin,
    storagePercentage,

    // Methods
    getZelidAuth,
    getBackendURL,
    getUploadUrl,
    getDownloadUrl,
    createShareLink,
    fetchStorageStats,
    loadFolder,
    navigateToFolder,
    navigateUp,
    createFolder,
    deleteFile,
    deleteFolder,
    rename,
    shareFile,
    unshareFile,
    downloadFile,
    copyToClipboard,
    formatFileSize,
    refresh,
    resetState,
    cancelPendingRequests,
    setError,
    clearError,
  }
}
