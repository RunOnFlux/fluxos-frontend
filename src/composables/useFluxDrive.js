import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFluxStore } from '@/stores/flux'
import { useSnackbar } from '@/composables/useSnackbar'
import { useLoginSheet } from '@/composables/useLoginSheet'
import { useI18n } from 'vue-i18n'

// Rate limiting state
const lastApiCall = ref(0)
const API_RATE_LIMIT = 1000 // 1 second between API calls

// Helper function to sanitize auth data for logging
const sanitizeAuthData = (data) => {
  if (!data || typeof data !== 'object') return data

  const sanitized = { ...data }

  // Hide sensitive fields
  if (sanitized.zelid) {
    sanitized.zelid = sanitized.zelid.substring(0, 8) + '...'
  }
  if (sanitized.signature) {
    sanitized.signature = '***hidden***'
  }
  if (sanitized.loginPhrase) {
    sanitized.loginPhrase = '***hidden***'
  }

  return sanitized
}

// Shared state across all composable instances
const sharedState = {
  files: ref([]),
  loading: ref(false),
  loadingStorage: ref(false), // Track storage info loading state
  loadingFiles: ref(false), // Track files loading state
  hasActiveSubscription: ref(false),
  subscriptionChecked: ref(false), // Track if we've checked subscription status
  subscriptionPeriodEnd: ref(null), // Subscription expiration timestamp
  paymentGateway: ref(''), // Payment gateway used for subscription ('fluxpay' or 'cryptocom')
  storageInfoFetched: ref(false), // Track if storage info has been fetched
  filesLoaded: ref(false), // Track if files have been loaded
  usedStorage: ref(0),
  totalStorage: ref(10737418240), // 10 GB default
  currentFolder: ref('/'),
  currentFolderUuid: ref(''), // Store current folder UUID
  folderHierarchy: ref([]), // Store folder hierarchy: [{path: '/', uuid: ''}, {path: '/folder1', uuid: 'uuid1'}]
  breadcrumbs: ref([{ title: 'Home', path: '/' }]),

  // Error state management
  errorState: ref({
    hasError: false,
    message: '',
    type: 'error', // 'error', 'warning', 'info', 'success'
    timestamp: null,
    persistent: false, // If true, error won't auto-clear
  }),
}

export function useFluxDrive() {
  const { t } = useI18n()
  const { showSnackbar } = useSnackbar()
  const fluxStore = useFluxStore()
  const router = useRouter()

  // Config - FluxDrive uses jetpack bridge, not FluxOS backend
  const ipfsHost = 'https://jetpack2_38080.app.runonflux.io'
  const bridgeURL = 'https://jetpackbridge.runonflux.io'

  // Recovery mode state
  const isRecoveryMode = ref(false)

  // Use shared state
  const currentFolder = sharedState.currentFolder
  const breadcrumbs = sharedState.breadcrumbs

  // Helper function to extract zelid from zelidauth
  const getZelid = () => {
    const zelidauthRaw = localStorage.getItem('zelidauth')
    if (zelidauthRaw) {
      try {
        const authData = zelidauthRaw.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauthRaw)) :
          JSON.parse(zelidauthRaw)
        
        return authData.zelid || fluxStore.zelid
      } catch {
        return fluxStore.zelid
      }
    }
    
    return fluxStore.zelid
  }

  // Authentication
  const isLoggedIn = computed(() => {
    const zelidauth = localStorage.getItem('zelidauth')
    const zelid = getZelid()
    
    return !!(zelidauth && zelid)
  })

  // Use shared subscription status
  const hasActiveSubscription = sharedState.hasActiveSubscription
  const subscriptionPeriodEnd = sharedState.subscriptionPeriodEnd

  // Current plan detection based on storage capacity
  const currentPlan = computed(() => {
    if (!hasActiveSubscription.value) return null

    const storageGB = Math.round(totalStorage.value / (1024 ** 3))

    // Match storage capacity to plan
    if (storageGB <= 10) return 'starter'
    if (storageGB <= 50) return 'standard'
    if (storageGB <= 100) return 'pro'
    
    return 'enterprise' // For custom/larger plans
  })

  // Plan comparison helpers
  const getPlanStorageGB = planId => {
    const plan = fluxDrivePlans.value.find(p => p.id === planId)
    if (!plan) return 0
    
    return parseInt(plan.storage.replace(/[^\d]/g, ''))
  }

  const getPlanStatus = planId => {
    // Enterprise plan is always available for contact
    if (planId === 'enterprise') {
      return 'upgrade' // Always show as upgrade option
    }

    // Check if user is truly new (never had subscription)
    const isNewUser = !hasActiveSubscription.value &&
                      subscriptionPeriodEnd.value === null &&
                      usedStorage.value === 0

    // For new users, all plans are signup options
    if (isNewUser) {
      return 'signup'
    }

    // Determine user's plan based on storage capacity (works for both active and expired)
    const currentStorageGB = Math.round(totalStorage.value / (1024 ** 3))
    const planStorageGB = getPlanStorageGB(planId)

    // Detect current plan from storage, even if subscription is expired
    const detectedPlan = currentStorageGB <= 10 ? 'starter' :
                         currentStorageGB <= 50 ? 'standard' :
                         currentStorageGB <= 100 ? 'pro' : 'enterprise'

    const userPlan = currentPlan.value || detectedPlan

    if (planId === userPlan) {
      // Same plan - but check if subscription is active or expired
      if (hasActiveSubscription.value) {
        return 'current' // Active subscription - show Current (no action needed)
      } else {
        return 'renew' // Expired subscription - show Renew button
      }
    } else if (planStorageGB > currentStorageGB) {
      return 'upgrade' // Higher tier - show Upgrade
    } else {
      // Lower tier - check if user's files fit in the smaller plan
      const usedStorageGB = usedStorage.value / (1024 ** 3)

      // If user has more files than the downgrade plan allows, it's blocked
      if (usedStorageGB > planStorageGB) {
        return 'downgrade-blocked' // Files exceed plan capacity
      }

      return 'downgrade' // Lower tier - can downgrade
    }
  }

  // Check subscription status - based on IPFS READ response
  const fetchStorageInfo = async () => {
    // Prevent duplicate calls if storage info is already being fetched or already fetched
    if (sharedState.loadingStorage.value || sharedState.storageInfoFetched.value) {
      console.log('⏭️ Storage info already loading or fetched, skipping duplicate call')
      
      return
    }

    try {
      sharedState.loadingStorage.value = true
      const zelidauth = localStorage.getItem('zelidauth')
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      const response = await fetch(`${bridgeURL}/api/v1/ipfs/storage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          zelid: authData.zelid || getZelid(),
          signature: authData.signature || '',
          loginPhrase: authData.loginPhrase,
        }),
      })

      const result = await response.json()

      if (!result.error && !result.warning) {
        // Update storage info
        if (result.capacity !== undefined) {
          totalStorage.value = result.capacity
        } else if (result.capacityGB !== undefined) {
          totalStorage.value = result.capacityGB * (1024 ** 3)
        } else if (result.storage !== undefined) {
          totalStorage.value = result.storage * (1024 ** 3)
        }

        if (result.storageUsed !== undefined) {
          usedStorage.value = result.storageUsed
        } else if (result.storage_used !== undefined) {
          usedStorage.value = result.storage_used
        }

        sharedState.storageInfoFetched.value = true

        console.log('📊 Storage info fetched:', {
          used: usedStorage.value,
          usedMB: (usedStorage.value / (1024 * 1024)).toFixed(2) + ' MB',
          usedGB: (usedStorage.value / (1024 ** 3)).toFixed(2) + ' GB',
          totalGB: (totalStorage.value / (1024 ** 3)).toFixed(2) + ' GB',
          percentage: Math.round((usedStorage.value / totalStorage.value) * 100) + '%',
        })
      }
    } catch (error) {
      console.error('Failed to fetch storage info:', error)
    } finally {
      sharedState.loadingStorage.value = false
    }
  }

  const checkSubscriptionStatus = async () => {
    if (!isLoggedIn.value) {
      hasActiveSubscription.value = false
      subscriptionChecked.value = true
      
      return false
    }

    // Track start time to ensure minimum loading animation display
    const startTime = Date.now()

    try {
      sharedState.loadingStorage.value = true
      const zelidauth = localStorage.getItem('zelidauth')
      const zelid = getZelid()

      if (!zelid) {
        console.error('No zelid found')
        hasActiveSubscription.value = false
        
        return false
      }

      // Get proper authentication
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      // Use IPFS storage to check subscription (like FluxCloud does)
      const response = await fetch(`${bridgeURL}/api/v1/ipfs/storage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          zelid: authData.zelid || zelid,
          signature: authData.signature || '',
          loginPhrase: authData.loginPhrase,
        }),
      })

      const result = await response.json()
      console.log('🔍 IPFS storage response:', result)

      // Check if user has active subscription based on storage response
      if (result.active === true) {
        console.log('✅ Active subscription detected (from /storage: active: true)')

        // Declare readResult outside try block so it's accessible later
        let readResult = null

        // Even if storage says active, we need to check /read for cancellation errors
        // because /storage still returns active: true after cancellation
        // Use size: '0' to minimize data transfer and avoid rate limiting
        try {
          const readResponse = await fetch(`${bridgeURL}/api/v1/ipfs/read`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              zelid: authData.zelid || zelid,
              signature: authData.signature || '',
              loginPhrase: authData.loginPhrase,
              page: '1',
              size: '0', // Request 0 files to just check subscription status
            }),
          })

          readResult = await readResponse.json()
          console.log('🔍 IPFS read response for subscription verification:', readResult)

          // Check if subscription is actually canceled/expired
          const isSubscriptionInactive = readResult.error && (
            readResult.error.indexOf("Subscription Expired") > -1 ||
            readResult.error.indexOf("Subscription Canceled") > -1
          )

          if (isSubscriptionInactive) {
            console.log('⚠️ Subscription canceled/expired detected in /read - overriding /storage result')
            hasActiveSubscription.value = false

            // Capture period_end from the response
            if (readResult.period_end) {
              subscriptionPeriodEnd.value = readResult.period_end
              console.log('📅 Subscription period end captured:', readResult.period_end)
            }

            // IMPORTANT: Update storage capacity even when expired
            // This ensures the UI shows the correct plan capacity for renewal
            if (result.capacity !== undefined) {
              totalStorage.value = result.capacity
              console.log('📊 Storage capacity updated from expired subscription:', result.capacity)
            } else if (result.capacityGB !== undefined) {
              totalStorage.value = result.capacityGB * (1024 ** 3)
              console.log('📊 Storage capacity updated from expired subscription:', result.capacityGB, 'GB')
            }

            // Try to get payment gateway from subscription API
            try {
              const subResponse = await fetch('https://jetpackbridge.runonflux.io/api/v1/subscriptions.php', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  action: 'READ',
                  action_type: 'current',
                  zelid: authData.zelid || zelid,
                  signature: authData.signature || '',
                  loginPhrase: authData.loginPhrase,
                }),
              })
              const subResult = await subResponse.json()
              if (subResult && subResult.gateway) {
                sharedState.paymentGateway.value = subResult.gateway
                console.log('💳 Payment gateway captured from subscription API:', subResult.gateway)
                // Also store in localStorage for persistence
                localStorage.setItem('fluxdrive_gateway', subResult.gateway)
              }
            } catch (subError) {
              console.warn('⚠️ Could not fetch subscription gateway:', subError)
            }

            subscriptionChecked.value = true

            // Ensure minimum 1.5s delay for loader animation visibility
            const elapsed = Date.now() - startTime
            const minDelay = 1500
            if (elapsed < minDelay) {
              await new Promise(resolve => setTimeout(resolve, minDelay - elapsed))
            }

            return false
          }
        } catch (readError) {
          console.warn('⚠️ Could not verify subscription with /read endpoint:', readError)
          // Continue with storage result if read check fails
        }

        // If we get here, subscription is truly active
        hasActiveSubscription.value = true

        // Capture payment gateway from API or localStorage
        if (result.gateway) {
          sharedState.paymentGateway.value = result.gateway
          console.log('💳 Payment gateway captured from API:', result.gateway)
        } else if (readResult && readResult.gateway) {
          sharedState.paymentGateway.value = readResult.gateway
          console.log('💳 Payment gateway captured from read API:', readResult.gateway)
        } else {
          // Fallback to localStorage (set by CheckoutContent after successful payment)
          const storedGateway = localStorage.getItem('fluxdrive_gateway')
          if (storedGateway) {
            sharedState.paymentGateway.value = storedGateway
            console.log('💳 Payment gateway retrieved from localStorage:', storedGateway)
          }
        }

        // Capture subscription period end if available
        if (result.period_end) {
          subscriptionPeriodEnd.value = result.period_end
          console.log('📅 Subscription period end:', result.period_end)
        } else if (result.periodEnd) {
          subscriptionPeriodEnd.value = result.periodEnd
          console.log('📅 Subscription period end:', result.periodEnd)
        }

        // Update storage info if available (from storage endpoint)
        if (result.capacity !== undefined) {
          // capacity is already in bytes
          totalStorage.value = result.capacity
        } else if (result.capacityGB !== undefined) {
          // capacity in GB, convert to bytes
          totalStorage.value = result.capacityGB * (1024 ** 3)
        }

        if (result.storageUsed !== undefined) {
          // storageUsed is already in bytes
          usedStorage.value = result.storageUsed
        } else if (result.storage_used !== undefined) {
          usedStorage.value = result.storage_used
        }

        sharedState.storageInfoFetched.value = true

        console.log('📊 Storage updated from /storage endpoint:', {
          used: usedStorage.value,
          total: totalStorage.value,
          percentage: Math.round((usedStorage.value / totalStorage.value) * 100) + '%',
        })

        // Ensure minimum 1.5s delay for loader animation visibility
        const elapsed = Date.now() - startTime
        const minDelay = 1500
        if (elapsed < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - elapsed))
        }

        subscriptionChecked.value = true

        return true
      } else if (result.error || result.warning) {
        const errorMsg = result.error || result.warning
        console.log('❌ No active subscription:', errorMsg)
        hasActiveSubscription.value = false

        // Ensure minimum 1.5s delay for loader animation visibility
        const elapsed = Date.now() - startTime
        const minDelay = 1500
        if (elapsed < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - elapsed))
        }

        subscriptionChecked.value = true
        
        return false
      } else {
        console.log('❌ No active subscription found')
        hasActiveSubscription.value = false

        // Ensure minimum 1.5s delay for loader animation visibility
        const elapsed = Date.now() - startTime
        const minDelay = 1500
        if (elapsed < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - elapsed))
        }

        subscriptionChecked.value = true
        
        return false
      }
    } catch (error) {
      console.error('Subscription check error:', error)
      hasActiveSubscription.value = false

      // Ensure minimum 1.5s delay for loader animation visibility
      const elapsed = Date.now() - startTime
      const minDelay = 1500
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed))
      }

      subscriptionChecked.value = true
      
      return false
    } finally {
      sharedState.loadingStorage.value = false
    }
  }

  // Use shared state
  const loading = sharedState.loading
  const files = sharedState.files
  const usedStorage = sharedState.usedStorage
  const totalStorage = sharedState.totalStorage
  const subscriptionChecked = sharedState.subscriptionChecked
  const loadingStorage = sharedState.loadingStorage

  // Local state (not shared between instances)
  const searching = ref(false)
  const subscribing = ref(false)
  const selectedPlan = ref('')
  const pendingPlanSelection = ref(null) // Track plan selected before login
  const searchQuery = ref('')
  const currentPage = ref(1)
  const filesPerPage = ref(5)
  const totalFiles = ref(0)
  const isDragOver = ref(false)
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const showFileModal = ref(false)
  const previewingFile = ref(null)
  const resultMessage = ref('')
  const uploadMessage = ref('Drag and drop files here or click to upload')
  const { openLoginBottomSheet, closeLoginBottomSheet } = useLoginSheet()

  // Storage is already handled by shared state, don't redefine

  // FluxDrive plans (matching FluxCloud source code exactly)
  const fluxDrivePlans = computed(() => [
    {
      id: 'starter',
      name: t('components.fluxDrive.pricingPlans.plans.starter'),
      storage: '10 GB',
      price: '$0.50',
      pricePerMonth: '$0.50 / Month',
      originalPrice: null,
      popular: false,
      badge: null,
      features: [
        t('components.fluxDrive.pricingPlans.features.web3Infrastructure'),
        t('components.fluxDrive.pricingPlans.features.decentralizedStorage'),
        t('components.fluxDrive.pricingPlans.features.globalDistribution'),
        t('components.fluxDrive.pricingPlans.features.unlimitedBandwidth'),
      ],
    },
    {
      id: 'standard',
      name: t('components.fluxDrive.pricingPlans.plans.standard'),
      storage: '50 GB',
      price: '$2.50',
      pricePerMonth: '$2.50 / Month',
      originalPrice: null,
      popular: true,
      badge: t('components.fluxDrive.pricingPlans.badges.mostPopular'),
      features: [
        t('components.fluxDrive.pricingPlans.features.web3Infrastructure'),
        t('components.fluxDrive.pricingPlans.features.decentralizedStorage'),
        t('components.fluxDrive.pricingPlans.features.globalDistribution'),
        t('components.fluxDrive.pricingPlans.features.unlimitedBandwidth'),
      ],
    },
    {
      id: 'pro',
      name: t('components.fluxDrive.pricingPlans.plans.elite'),
      storage: '100 GB',
      price: '$5.00',
      pricePerMonth: '$5.00 / Month',
      originalPrice: null,
      popular: false,
      badge: t('components.fluxDrive.pricingPlans.badges.bestValue'),
      features: [
        t('components.fluxDrive.pricingPlans.features.web3Infrastructure'),
        t('components.fluxDrive.pricingPlans.features.decentralizedStorage'),
        t('components.fluxDrive.pricingPlans.features.globalDistribution'),
        t('components.fluxDrive.pricingPlans.features.unlimitedBandwidth'),
      ],
    },
    {
      id: 'enterprise',
      name: t('components.fluxDrive.pricingPlans.plans.fluxDrivePro'),
      storage: t('components.fluxDrive.pricingPlans.customizable'),
      price: '',
      pricePerMonth: '',
      originalPrice: null,
      popular: false,
      badge: t('components.fluxDrive.pricingPlans.badges.enterprise'),
      features: [
        t('components.fluxDrive.pricingPlans.features.web3Infrastructure'),
        t('components.fluxDrive.pricingPlans.features.decentralizedStorage'),
        t('components.fluxDrive.pricingPlans.features.globalDistribution'),
        t('components.fluxDrive.pricingPlans.features.unlimitedBandwidth'),
      ],
    },
  ])

  // File table headers
  const fileHeaders = ref([
    { title: '', key: 'preview', sortable: false, width: 60 },
    { title: 'Name', key: 'name', sortable: true },
    { title: 'Updated', key: 'timestamp', sortable: true, width: 160 },
    { title: 'Size', key: 'size', sortable: true, width: 90 },
    { title: '', key: 'actions', sortable: false, width: 40 },
  ])

  // Computed
  const storagePercentage = computed(() => {
    if (totalStorage.value === 0) return 0
    
    return Math.round((usedStorage.value / totalStorage.value) * 100)
  })

  // Rate limiting helper
  const checkRateLimit = () => {
    const now = Date.now()
    if (now - lastApiCall.value < API_RATE_LIMIT) {
      const waitTime = Math.ceil((API_RATE_LIMIT - (now - lastApiCall.value)) / 1000)
      throw new Error(`Please wait ${waitTime} second${waitTime > 1 ? 's' : ''} before making another request.`)
    }
    lastApiCall.value = now
  }

  // Error state management
  const setError = (message, type = 'error', persistent = false) => {
    const timestamp = Date.now()
    sharedState.errorState.value = {
      hasError: true,
      message,
      type,
      timestamp,
      persistent,
    }

    // Auto-clear non-persistent errors after 4 seconds
    if (!persistent) {
      setTimeout(() => {
        if (sharedState.errorState.value.timestamp === timestamp) {
          clearError()
        }
      }, 4000)
    }
  }

  const clearError = () => {
    sharedState.errorState.value = {
      hasError: false,
      message: '',
      type: 'error',
      timestamp: null,
      persistent: false,
    }

    // Also clear the legacy resultMessage
    resultMessage.value = ''
    console.log('✅ All errors cleared')
  }

  const hasError = computed(() => sharedState.errorState.value.hasError)
  const errorMessage = computed(() => sharedState.errorState.value.message)
  const errorType = computed(() => sharedState.errorState.value.type)

  // Utility function to get alert type from result message
  const getAlertType = message => {
    if (message.includes('alert-success')) return 'success'
    if (message.includes('alert-danger')) return 'error'
    if (message.includes('alert-warning')) return 'warning'
    if (message.includes('alert-info')) return 'info'
    
    return 'info'
  }

  // API Methods
  const selectPlan = async planId => {
    // Handle Enterprise/Flux Drive Pro plan differently - contact us
    if (planId === 'enterprise') {
      const supportUrl = 'https://support.runonflux.io'
      window.open(supportUrl, '_blank', 'noopener,noreferrer')
      
      return
    }

    if (!isLoggedIn.value) {
      // Store the plan selection for after login
      pendingPlanSelection.value = planId
      openLoginBottomSheet()

      return
    }

    // Navigate to the FluxDrive checkout page with the selected plan
    // Default gateway is 'fluxpay' - can be changed to 'cryptocom' or other gateways
    router.push({
      path: '/fluxdrive-checkout',
      query: {
        plan: planId,
        gateway: 'fluxpay',
      },
    })
  }

  const findAllFiles = async () => {
    console.log('🔧 COMPREHENSIVE FILE SEARCH: Searching all folders recursively')

    if (!hasActiveSubscription.value) {
      console.log('❌ No active subscription')
      
      return []
    }

    const authData = localStorage.getItem('zelidauth')
    const parsedAuth = authData ?
      (authData.includes('zelid=') ?
        Object.fromEntries(new URLSearchParams(authData)) :
        JSON.parse(authData)) : {}

    console.log('🔐 Auth data:', {
      hasZelid: !!parsedAuth.zelid,
      hasSignature: !!parsedAuth.signature,
      hasLoginPhrase: !!parsedAuth.loginPhrase,
      bridgeURL,
    })

    let allFiles = []
    const foldersToCheck = ['/'] // Start with root

    // Recursive function to get files from a folder
    const getFilesFromFolder = async (folderPath, folderUuid = '') => {
      try {
        console.log(`🔍 Checking folder: ${folderPath}`)

        const requestParams = {
          zelid: parsedAuth.zelid || getZelid(),
          signature: parsedAuth.signature || '',
          loginPhrase: parsedAuth.loginPhrase,
          page: '1',
          size: '100',
        }

        // Use appropriate folder parameter
        if (folderPath === '/') {
          requestParams.currentFolder = '/'
        } else if (folderUuid) {
          requestParams.currentFolder = folderUuid
        } else {
          requestParams.currentFolder = folderPath
        }

        console.log(`🔗 API Request to: ${bridgeURL}/api/v1/ipfs/read`)
        console.log(`📋 Request params:`, sanitizeAuthData(requestParams))

        const response = await fetch(`${bridgeURL}/api/v1/ipfs/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(requestParams),
        })

        const result = await response.json()
        console.log(`📁 ${folderPath} API Response:`, result)
        console.log(`📁 ${folderPath}: ${result?.files?.length || 0} items`)

        if (result.files && result.files.length > 0) {
          for (const file of result.files) {
            // Add folder path to each file for tracking
            file.foundInFolder = folderPath

            if (file.type === 'folder') {
              // Add folder to list to check later
              const subFolderPath = `${folderPath}${folderPath.endsWith('/') ? '' : '/'}${file.name}`
              foldersToCheck.push({ path: subFolderPath, uuid: file.uuid })
              console.log(`📂 Found subfolder: ${subFolderPath}`)
            } else {
              // Add file to results
              allFiles.push(file)
              console.log(`📄 Found file: ${file.name} (${file.size} bytes) in ${folderPath}`)
            }
          }
        }
      } catch (error) {
        console.log(`❌ Error checking ${folderPath}:`, error)
      }
    }

    // Check root folder first
    await getFilesFromFolder('/')

    // Check all discovered subfolders
    for (let i = 1; i < foldersToCheck.length; i++) {
      const folder = foldersToCheck[i]
      if (typeof folder === 'string') {
        await getFilesFromFolder(folder)
      } else {
        await getFilesFromFolder(folder.path, folder.uuid)
      }
    }

    console.log(`🎉 COMPREHENSIVE SEARCH COMPLETE: Found ${allFiles.length} files total`)

    if (allFiles.length > 0) {
      console.log('📊 File breakdown:')
      allFiles.forEach(file => {
        console.log(`  📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) in ${file.foundInFolder}`)
      })

      const totalSizeMB = allFiles.reduce((sum, file) => sum + (file.size || 0), 0) / 1024 / 1024
      console.log(`📊 Total file size found: ${totalSizeMB.toFixed(2)} MB`)
    } else {
      console.log('❌ No files found despite storage usage. Trying alternative approaches...')

      // Try alternative API approach - without folder parameter to get ALL files
      try {
        console.log('🔄 Trying alternative API call without folder filter...')
        const requestParams = {
          zelid: parsedAuth.zelid || getZelid(),
          signature: parsedAuth.signature || '',
          loginPhrase: parsedAuth.loginPhrase,
          page: '1',
          size: '1000',  // Large size to get all files
          // No currentFolder parameter - might return all files
        }

        const response = await fetch(`${bridgeURL}/api/v1/ipfs/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(requestParams),
        })

        const result = await response.json()
        console.log('🔄 Alternative API response:', result)

        if (result.files && result.files.length > 0) {
          console.log(`🎉 Alternative method found ${result.files.length} files!`)
          allFiles = result.files
        }
      } catch (error) {
        console.log('❌ Alternative API call failed:', error)
      }


      // Try folders endpoint from FluxCloud source
      try {
        console.log('🔄 Trying folders endpoint from FluxCloud...')
        const response = await fetch(`${bridgeURL}/api/v1/ipfs/folders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            zelid: parsedAuth.zelid || getZelid(),
            signature: parsedAuth.signature || '',
            loginPhrase: parsedAuth.loginPhrase,
          }),
        })

        const result = await response.json()
        console.log('🔄 Folders API response:', result)

        if (result.folders && result.folders.length > 0) {
          console.log(`📁 Found ${result.folders.length} folders, checking each for files...`)

          // Check each folder for files
          for (const folder of result.folders) {
            try {
              console.log(`🔍 Checking folder: ${folder.name} (UUID: ${folder.uuid})`)

              const folderResponse = await fetch(`${bridgeURL}/api/v1/ipfs/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  zelid: parsedAuth.zelid || getZelid(),
                  signature: parsedAuth.signature || '',
                  loginPhrase: parsedAuth.loginPhrase,
                  currentFolder: folder.uuid || folder.name,
                  page: '1',
                  size: '1000',
                  includeFolders: true,
                }),
              })

              const folderResult = await folderResponse.json()
              console.log(`📁 Folder ${folder.name} contains:`, folderResult)

              if (folderResult.files && folderResult.files.length > 0) {
                console.log(`🎉 Found ${folderResult.files.length} files in folder ${folder.name}!`)
                folderResult.files.forEach(file => {
                  console.log(`📄 Examining file in ${folder.name}:`, file)
                  file.foundInFolder = folder.name
                  if (file.type !== 'folder') {
                    console.log(`✅ Adding file to results: ${file.name}`)
                    allFiles.push(file)
                  } else {
                    console.log(`📁 Skipping folder: ${file.name}`)
                  }
                })
              }
            } catch (folderError) {
              console.log(`❌ Error checking folder ${folder.name}:`, folderError)
            }
          }
        }
      } catch (error) {
        console.log('❌ Folders API call failed:', error)
      }

      // Try search endpoint with different terms to find orphaned files
      const searchTerms = ['', '.', 'a', 'e', 'i', 'o', 'u', '1', '2', '3', '7', 'z', 'exe']
      for (const term of searchTerms) {
        try {
          console.log(`🔄 Trying search with term: "${term}"`)
          const response = await fetch(`${bridgeURL}/api/v1/ipfs/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              zelid: parsedAuth.zelid || getZelid(),
              signature: parsedAuth.signature || '',
              loginPhrase: parsedAuth.loginPhrase,
              q: term,
            }),
          })

          const result = await response.json()
          if (Array.isArray(result) && result.length > 0) {
            console.log(`🎉 Search "${term}" found ${result.length} files!`)
            result.forEach(file => {
              // Check if we already have this file
              const exists = allFiles.some(existing => existing.hash === file.hash)
              if (!exists) {
                file.foundInFolder = `Search: "${term}"`
                allFiles.push(file)
                console.log(`✅ Added new file from search: ${file.name}`)
              }
            })
          }
        } catch (error) {
          console.log(`❌ Search "${term}" failed:`, error)
        }
      }

    }

    return allFiles
  }

  // Subscription management functions
  const renewSubscription = async (planName, gateway = 'fluxpay') => {
    try {
      const authData = localStorage.getItem('zelidauth')
      const parsedAuth = authData ?
        (authData.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(authData)) :
          JSON.parse(authData)) : {}

      const requestBody = {
        action: 'READ',
        zelid: parsedAuth.zelid || getZelid(),
        signature: parsedAuth.signature || '',
        loginPhrase: parsedAuth.loginPhrase,
        gateway: gateway,
        plan_name: planName,
      }

      console.log('🔄 Renewing subscription:', sanitizeAuthData(requestBody))

      const response = await fetch(`${bridgeURL}/api/v1/subscriptions.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(requestBody),
      })

      const result = await response.json()
      console.log('📋 Subscription renewal response:', result)
      console.log('📋 Response keys:', Object.keys(result))
      console.log('📋 Response type:', typeof result)

      if (result.error) {
        console.error('❌ API returned error:', result.error)
        throw new Error(result.error)
      }

      // Check what we got back
      if (result.checkout_url) {
        console.log('🛒 Checkout URL found:', result.checkout_url)
      }
      if (result.new_plan) {
        console.log('📋 New plan found:', result.new_plan)
      }
      if (result.subscription) {
        console.log('📋 Subscription found:', result.subscription)
      }

      return result
    } catch (error) {
      console.error('❌ Subscription renewal failed:', error)
      throw error
    }
  }

  const upgradeSubscription = async (planName, gateway = 'fluxpay') => {
    try {
      const authData = localStorage.getItem('zelidauth')
      const parsedAuth = authData ?
        (authData.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(authData)) :
          JSON.parse(authData)) : {}

      const requestBody = {
        action: 'READ',
        zelid: parsedAuth.zelid || getZelid(),
        signature: parsedAuth.signature || '',
        loginPhrase: parsedAuth.loginPhrase,
        gateway: gateway,
        plan_name: planName,
      }

      console.log('🔄 Upgrading subscription:', sanitizeAuthData(requestBody))

      const response = await fetch(`${bridgeURL}/api/v1/subscriptions.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(requestBody),
      })

      const result = await response.json()
      console.log('📋 Subscription upgrade response:', result)
      console.log('📋 Response keys:', Object.keys(result))
      console.log('📋 Response type:', typeof result)

      if (result.error) {
        console.error('❌ API returned error:', result.error)
        throw new Error(result.error)
      }

      // Check what we got back
      if (result.checkout_url) {
        console.log('🛒 Checkout URL found:', result.checkout_url)
      }
      if (result.new_plan) {
        console.log('📋 New plan found:', result.new_plan)
      }
      if (result.subscription) {
        console.log('📋 Subscription found:', result.subscription)
      }

      return result
    } catch (error) {
      console.error('❌ Subscription upgrade failed:', error)
      throw error
    }
  }

  const cancelSubscription = async () => {
    try {
      const authData = localStorage.getItem('zelidauth')
      const parsedAuth = authData ?
        (authData.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(authData)) :
          JSON.parse(authData)) : {}

      const requestBody = {
        action: 'CANCEL',
        zelid: parsedAuth.zelid || getZelid(),
        signature: parsedAuth.signature || '',
        loginPhrase: parsedAuth.loginPhrase,
      }

      console.log('🚫 Canceling subscription:', sanitizeAuthData(requestBody))

      const response = await fetch(`${bridgeURL}/api/v1/subscriptions.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(requestBody),
      })

      const result = await response.json()
      console.log('📋 Subscription cancel response:', result)

      if (result.error) {
        console.error('❌ API returned error:', result.error)
        throw new Error(result.error)
      }

      // Clear payment gateway from state and localStorage
      sharedState.paymentGateway.value = ''
      localStorage.removeItem('fluxdrive_gateway')

      return result
    } catch (error) {
      console.error('❌ Subscription cancellation failed:', error)
      throw error
    }
  }

  const loadFiles = async (clearMessages = false, showAllFiles = false) => {
    if (!hasActiveSubscription.value) return

    // Clear recovery mode for normal loading
    if (!showAllFiles) {
      isRecoveryMode.value = false
    }

    // Prevent duplicate calls if files are already being loaded
    if (sharedState.loadingFiles.value) {
      console.log('⏭️ Files already being loaded, skipping duplicate call')
      
      return
    }

    sharedState.loadingFiles.value = true
    loading.value = true

    // Clear any previous errors only when explicitly requested (during navigation)
    if (clearMessages) {
      clearError()
      resultMessage.value = ''
    }

    console.log('📂 Loading files for folder:', currentFolder.value)
    if (showAllFiles) {
      console.log('🔧 RECOVERY MODE: Loading ALL files to find orphaned items')

      // Try the comprehensive file search
      const allFoundFiles = await findAllFiles()
      if (allFoundFiles.length > 0) {
        console.log('🎉 Found', allFoundFiles.length, 'files via comprehensive search!')
        console.log('📄 Files to process:', allFoundFiles)

        // Process all found files
        const processedFiles = allFoundFiles.map(item => {
          console.log('🔧 Processing file:', item)
          
          return {
            id: item.hash || item.uuid || Date.now(),
            name: item.name || 'Orphaned File',
            name_abbr: item.name_abbr || item.name,
            size: item.size || 0,
            hash: item.hash || '',
            hash_abbr: item.hash_abbr || (item.hash ? (item.hash.substring(0, 8) + '...') : ''),
            added_date: item.timestamp ? new Date(item.timestamp).toLocaleString() : new Date().toLocaleString(),
            timestamp: item.timestamp || 0,
            mimetype: item.mimetype || '',
            type: item.type || 'file',
            icon: getFileIcon(item.type || 'file'),
            thumbnail: item.thumbnail,
            width: item.width || 0,
            deleting: false,
            isFolder: item.type === 'folder',
            owner: item.owner,
            parent: 'ORPHANED',
          }
        })


        // Set recovery mode flag
        isRecoveryMode.value = true

        console.log('🔧 Setting files.value to:', processedFiles)
        files.value = processedFiles
        sharedState.loadingFiles.value = false
        loading.value = false
        console.log('✅ Recovery mode completed with', processedFiles.length, 'files')
        console.log('🔧 Final files.value:', files.value)
        
        return
      }
    }

    // Initialize folder hierarchy if empty (first load)
    if (sharedState.folderHierarchy.value.length === 0) {
      sharedState.folderHierarchy.value = [{ path: '/', uuid: '' }]
    }

    // Update breadcrumbs based on current folder
    updateBreadcrumbs(currentFolder.value)

    try {
      // Fetch storage info first
      await fetchStorageInfo()
      checkRateLimit()

      const zelidauth = localStorage.getItem('zelidauth')

      // Get proper authentication
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      // Use same pattern as create folder - UUID for subfolders, '/' for root
      let folderParam
      if (currentFolder.value === '/') {
        folderParam = '/'  // Root folder
      } else if (sharedState.currentFolderUuid.value) {
        folderParam = sharedState.currentFolderUuid.value  // Parent UUID for subfolders
      } else {
        folderParam = currentFolder.value.replace(/^\//, '')  // Fallback to path
      }

      console.log('📂 API Request details:', {
        currentFolder: currentFolder.value,
        folderParam: folderParam,
        page: currentPage.value,
        size: filesPerPage.value,
        url: `${bridgeURL}/api/v1/ipfs/read`,
      })

      const requestParams = {
        zelid: authData.zelid || getZelid(),
        signature: authData.signature || '',
        loginPhrase: authData.loginPhrase,
        page: '1',  // Always fetch from page 1 since we handle pagination on frontend
        size: '100',  // Increase size to see more files
        includeVersions: true,  // Request versions data
        includeFolders: true,    // FluxCloud compatibility
      }

      // Only add folder filter if not in recovery mode
      if (!showAllFiles) {
        requestParams.currentFolder = folderParam
        requestParams.includeFolders = true
      } else {
        console.log('🔧 RECOVERY MODE: Attempting to show ALL files using different approaches')

        // Try different approaches to get all files
        requestParams.showAllFiles = 'true'
        requestParams.includeOrphaned = 'true'
        requestParams.currentFolder = '' // Empty folder param
        // Don't include includeFolders to see if that helps
      }

      const requestBody = new URLSearchParams(requestParams)

      console.log('📂 Request body:', sanitizeAuthData(Object.fromEntries(requestBody)))

      let apiUrl = `${bridgeURL}/api/v1/ipfs/read`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
      })

      const result = await response.json()

      console.log('🔧 API Response from', apiUrl, ':', result)

      // Check for subscription expiration/cancellation error
      console.log('🔍 Checking subscription status - result.error:', result.error)
      const isSubscriptionInactive = result.error && (
        result.error.indexOf("Subscription Expired") > -1 ||
        result.error.indexOf("Subscription Canceled") > -1
      )
      console.log('🔍 isSubscriptionInactive:', isSubscriptionInactive)

      if (isSubscriptionInactive) {
        console.log('⚠️ Subscription expired/canceled detected in API response - updating subscription status')
        hasActiveSubscription.value = false
        subscriptionChecked.value = true

        // Capture period_end from the response
        if (result.period_end) {
          subscriptionPeriodEnd.value = result.period_end
          console.log('📅 Subscription period end captured:', result.period_end)
        } else if (result.periodEnd) {
          subscriptionPeriodEnd.value = result.periodEnd
          console.log('📅 Subscription period end captured:', result.periodEnd)
        }

        console.log('📊 Updated values - hasActiveSubscription:', hasActiveSubscription.value, 'subscriptionChecked:', subscriptionChecked.value, 'periodEnd:', subscriptionPeriodEnd.value)
        // Don't return - continue to show files if they exist
      } else if (result.error) {
        if (result.error.indexOf("No active subscription.") > -1) {
          resultMessage.value = `<div class="alert alert-danger">${result.error}</div>`
          hasActiveSubscription.value = false

          return
        } else if (result.error.indexOf("Session expired") > -1) {
          resultMessage.value = `<div class="alert alert-danger">${result.error}</div>`

          return
        } else {
          resultMessage.value = `<div class="alert alert-danger">${result.error}</div>`

          return
        }
      }

      console.log('🔍 Complete API response:', result)
      console.log('📂 Response for folder:', currentFolder.value, 'got', result.files?.length || 0, 'files')

      if (result.files && Array.isArray(result.files)) {
        console.log('📂 Raw API response files:', result.files)
        console.log('📊 Files array length:', result.files.length)
        console.log('📂 Current folder for filtering:', currentFolder.value)

        // If we're not in root but got files, the API might not support folder filtering
        // In that case, we need to filter client-side
        let filteredFiles = result.files
        if (currentFolder.value !== '/' && result.files.length > 0) {
          console.log('🔍 Checking if API supports folder filtering...')

          // When using UUID (FluxCloud approach), API properly filters files
          // Only check for filtering issues if we're using path-based approach (fallback)
          if (sharedState.currentFolderUuid.value) {
            console.log('✅ Using UUID-based loading - API filtering should work correctly')

            // Trust the API response when using UUID
          } else {
            // Only do filtering check for path-based fallback
            const hasProperFolderSupport = result.files.some(file =>
              file.folder === folderParam || file.path?.includes(currentFolder.value),
            )

            if (!hasProperFolderSupport) {
              console.log('⚠️ Path-based API does not support folder filtering, simulating empty folder')
              filteredFiles = [] // Show empty folder since API doesn't filter
            }
          }
        }

        // Group files by name to create versions (server doesn't properly handle existingFile param)
        const fileGroups = {}
        filteredFiles.forEach(item => {
          if (item.type !== 'folder') {
            const fileName = item.name || item.fileName || 'Unnamed File'
            if (!fileGroups[fileName]) {
              fileGroups[fileName] = []
            }
            fileGroups[fileName].push(item)
          }
        })

        // Create main files with versions from grouped files
        const groupedFiles = []
        Object.entries(fileGroups).forEach(([fileName, fileList]) => {
          if (fileList.length === 1) {
            // Single file - add as is
            groupedFiles.push(fileList[0])
          } else {
            // Multiple files with same name - create versions
            const sortedFiles = fileList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            const mainFile = sortedFiles[0] // Newest file becomes main

            // Create versions array from older files
            mainFile.versions = sortedFiles.slice(1).map((file, index) => ({
              comment: `Version ${sortedFiles.length - index - 1}`,
              timestamp: file.timestamp || 0,
              hash: file.hash || '',
              size: file.size || 0,
              filename: fileName,
              type: file.type || 'file',
              icon: file.icon,
              thumbnail: file.thumbnail,
              mimetype: file.mimetype || '',
            }))

            groupedFiles.push(mainFile)
          }
        })

        // Add folders back
        const folders = filteredFiles.filter(item => item.type === 'folder')
        const allGroupedFiles = [...groupedFiles, ...folders]

        // Parse files from actual API format
        let parsedFiles = allGroupedFiles.map(item => {
          console.log('Processing item:', item, 'item.folder:', item.folder, 'item.path:', item.path)

          // Handle folders - they have uuid and type === 'folder'
          if (item.type === 'folder') {
            return {
              id: item.uuid || Date.now(),
              name: item.name || 'Unnamed Folder',
              name_abbr: item.name_abbr || item.name,
              size: 0,
              hash: '', // Folders don't have hash
              hash_abbr: 'Folder',
              added_date: item.timestamp ? new Date(item.timestamp).toLocaleString() : new Date().toLocaleString(),
              timestamp: item.timestamp || 0,
              mimetype: 'folder',
              type: 'folder',
              icon: item.icon || 'mdi-folder',
              thumbnail: null,
              width: 0,
              deleting: false,
              isFolder: true,
              uuid: item.uuid,
              owner: item.owner,
              parent: currentFolder.value, // Always use current folder as parent
            }
          }

          // Handle files - they should have hash instead of uuid
          return {
            id: item.hash || item.uuid || Date.now(),
            name: item.name || item.fileName || 'Unnamed File',
            name_abbr: item.name_abbr || item.name,
            size: item.size || 0,
            hash: item.hash || '',
            hash_abbr: item.hash_abbr || (item.hash ? (item.hash.substring(0, 8) + '...') : ''),
            added_date: item.timestamp ? new Date(item.timestamp).toLocaleString() : new Date().toLocaleString(),
            timestamp: item.timestamp || 0,
            added_date_raw: item.added_date,
            mimetype: item.mimetype || '',
            type: item.type || 'file',
            icon: item.icon || getFileIcon(item.type || 'file'),
            thumbnail: item.thumbnail,
            width: item.width || 0,
            deleting: false,
            isFolder: false,
            owner: item.owner,
            parent: item.parent || currentFolder.value,

            // Add versions support
            versions: item.versions || [],
          }
        })

        // Add "Go Back" entry if not in root folder
        if (currentFolder.value !== '/') {
          const goBackEntry = {
            id: 'go-back',
            name: '..',
            name_abbr: '..',
            size: 0,
            hash: '',
            hash_abbr: '',
            added_date: '-',
            timestamp: 0, // Use 0 so it sorts to the top
            mimetype: 'go-back',
            type: 'go-back',
            icon: 'mdi-arrow-left',
            thumbnail: null,
            width: 0,
            deleting: false,
            isFolder: true,
            isGoBack: true,
            parent: currentFolder.value,
          }
          parsedFiles.unshift(goBackEntry)
        }

        files.value = parsedFiles
        console.log('Parsed files:', files.value)

        totalFiles.value = result.total_files || result.totalFiles || files.value.length

        // Update storage info from file list response
        if (result.storage_used !== undefined) {
          usedStorage.value = result.storage_used
          console.log('📊 Storage used updated from file list:', result.storage_used)
        } else if (result.storageUsed !== undefined) {
          usedStorage.value = result.storageUsed
          console.log('📊 Storage used updated from file list:', result.storageUsed)
        }

        if (result.storage !== undefined) {
          // storage field is in GB, convert to bytes
          totalStorage.value = result.storage * (1024 ** 3)
          console.log('📊 Total storage updated from file list:', result.storage, 'GB')
        }

        resultMessage.value = ''
        console.log(`📁 Loaded ${files.value.length} files`)
      } else {
        console.log('⚠️ No files array in response or not an array:', {
          hasFiles: 'files' in result,
          filesType: typeof result.files,
          isArray: Array.isArray(result.files),
          fullResponse: result,
        })
        files.value = []

        // Show appropriate message
        if (result.error) {
          resultMessage.value = `<div class="alert alert-danger">${result.error}</div>`
        } else if (result.warning) {
          resultMessage.value = `<div class="alert alert-warning">${result.warning}</div>`
        } else {
          resultMessage.value = ''
        }
      }

    } catch (error) {
      console.error('Load files error:', error)

      if (error.message.includes('wait') && error.message.includes('second')) {
        // Rate limit error - make it persistent and clear after the wait time
        console.log('🚫 Setting rate limit error:', error.message)
        setError(error.message, 'warning', false)
        resultMessage.value = `<div class="alert alert-warning">${error.message}</div>`
      } else {
        // Other errors
        console.log('❌ Setting general error:', error.message)
        setError('Failed to load files. Please try again.', 'error', false)
        resultMessage.value = `<div class="alert alert-danger">Failed to load files</div>`
      }
    } finally {
      loading.value = false
      sharedState.loadingFiles.value = false
      if (files.value.length > 0) {
        sharedState.filesLoaded.value = true
      }
      console.log('✅ loadFiles completed - Final state:', {
        loading: loading.value,
        hasActiveSubscription: hasActiveSubscription.value,
        subscriptionChecked: subscriptionChecked.value,
        filesCount: files.value.length,
      })
    }
  }

  const searchFile = async () => {
    if (!searchQuery.value?.trim()) {
      resultMessage.value = `<div class="alert alert-warning">Please enter a search term</div>`
      
      return
    }

    searching.value = true
    loading.value = true
    files.value = []

    try {
      checkRateLimit()

      const zelidauth = localStorage.getItem('zelidauth')

      // Get proper authentication
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      const response = await fetch(`${bridgeURL}/api/v1/ipfs/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          zelid: authData.zelid || getZelid(),
          signature: authData.signature || '',
          loginPhrase: authData.loginPhrase,
          q: searchQuery.value,
        }),
      })

      const result = await response.json()

      if (result.info) {
        files.value = []
        resultMessage.value = `<div class="alert alert-info">${result.info}</div>`
      } else if (result.error) {
        resultMessage.value = `<div class="alert alert-danger">${result.error}</div>`
      } else if (Array.isArray(result)) {
        // Parse search results from FluxCloud API format
        files.value = result.map(file => {
          if (file.type === 'folder') {
            // Skip folders for now in file list
            return null
          }

          return {
            id: file.hash,
            name: file.name || file.fileName || file.filename,
            size: file.size || 0,
            hash: file.hash,
            hash_abbr: file.hash ? file.hash.substring(0, 8) + '...' : '',
            added_date: file.timestamp ? new Date(file.timestamp * 1000).toLocaleString() : new Date().toLocaleString(),
            mimetype: file.mimetype || '',
            type: file.type || 'file',
            thumbnail: file.thumbnail,
            width: 0,
            deleting: false,

            // Add versions support to search results
            versions: file.versions || [],
          }
        }).filter(f => f !== null)

        resultMessage.value = `<div class="alert alert-success">Found ${files.value.length} files</div>`
      } else {
        files.value = []
        resultMessage.value = `<div class="alert alert-warning">No files found</div>`
      }
    } catch (error) {
      if (error.message.includes('Rate limit')) {
        resultMessage.value = `<div class="alert alert-warning">${error.message}</div>`
      } else {
        resultMessage.value = `<div class="alert alert-danger">Search failed</div>`
      }
      console.error('Search error:', error)
    } finally {
      searching.value = false
      loading.value = false
    }
  }

  const handleDrop = async e => {
    isDragOver.value = false
    const files = Array.from(e.dataTransfer.files)
    console.log(`📤 Dropped ${files.length} file(s) for upload`)

    for (const file of files) {
      if (file.size > 100000000) {
        showSnackbar(`File "${file.name}" too large! Upload limit is 100MB`, 'error')
        continue
      }
      await uploadData(file)
    }
  }

  const handleFileSelect = async e => {
    const files = Array.from(e.target.files)
    console.log(`📤 Selected ${files.length} file(s) for upload`)

    for (const file of files) {
      if (file.size > 100000000) {
        showSnackbar(`File "${file.name}" too large! Upload limit is 100MB`, 'error')
        continue
      }
      await uploadData(file)
    }

    // Clear the file input so the same file can be selected again
    e.target.value = ''
  }

  const handleFolderSelect = async e => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🚀 handleFolderSelect STARTED - no alerts should appear yet')

    // Override alert temporarily to track where it comes from
    const originalAlert = window.alert
    window.alert = message => {
      console.error('🚨 ALERT BLOCKED:', message)
      console.trace('Alert called from:')

      // Don't show the alert, just log it
    }

    const files = Array.from(e.target.files)
    console.log(`📁 Selected folder with ${files.length} file(s) for upload`)
    console.log('🚀 Files array created - checking for alert...')

    if (files.length === 0) {
      showSnackbar('No files found in the selected folder', 'warning')
      
      return
    }

    // Group files by their directory structure
    const folderStructure = {}

    for (const file of files) {
      const pathParts = file.webkitRelativePath.split('/')
      const folderName = pathParts[0] // Root folder name

      if (!folderStructure[folderName]) {
        folderStructure[folderName] = []
      }
      folderStructure[folderName].push(file)
    }

    // Store original folder to return to after upload
    const originalFolder = currentFolder.value

    try {
      // Set uploading state once for the entire folder upload
      uploading.value = true
      uploadProgress.value = 0

      // Process each folder
      for (const [folderName, folderFiles] of Object.entries(folderStructure)) {
        console.log(`📂 Processing folder: ${folderName} with ${folderFiles.length} files`)

        try {
        // Check if folder already exists like FluxCloud does (line 26-32)
          const folderExists = files.value?.some(f => f.isFolder && f.name === folderName) || false
          if (folderExists) {
            showSnackbar(`A folder named '${folderName}' already exists`, 'error')
            continue
          }

          // Create main folder exactly like FluxCloud (lines 33-36)
          console.log(`📁 Creating main folder: ${folderName}`)
          const mainFolder = await createFluxCloudFolder(currentFolder.value === '/' ? '/' : currentFolder.value, folderName)
          console.log('📁 Created main folder:', mainFolder)

          // Analyze files to build subfolder structure like FluxCloud does
          const subFolders = new Map()
          const folderMap = new Map()

          // Pass 1: Create subfolder hierarchy like FluxCloud
          for (let i = 0; i < folderFiles.length; i++) {
            const file = folderFiles[i]
            const pathParts = file.webkitRelativePath.split('/')
            pathParts.shift() // Remove root folder name
            const fileName = pathParts.pop() // Remove file name

            if (pathParts.length > 0) {
            // File is in a subfolder - create the subfolder hierarchy
              let parentUuid = mainFolder.uuid || mainFolder.id
              let currentPath = ''

              for (const pathSegment of pathParts) {
                if (currentPath) currentPath += '/'
                currentPath += pathSegment

                if (!subFolders.has(currentPath)) {
                  console.log(`📁 Creating subfolder: ${pathSegment}`)
                  resultMessage.value = `<div class="alert alert-info">Creating folder '${pathSegment}'...</div>`

                  // Create subfolder using FluxCloud approach (lines 89-93)
                  const subFolder = await createFluxCloudFolder(parentUuid, pathSegment)
                  subFolders.set(currentPath, subFolder)
                  parentUuid = subFolder.uuid || subFolder.id
                } else {
                  parentUuid = subFolders.get(currentPath).uuid || subFolders.get(currentPath).id
                }
              }
              folderMap.set(file, subFolders.get(currentPath))
            } else {
            // File goes directly in main folder
              folderMap.set(file, mainFolder)
            }
          }

          // Pass 2: Upload all files to their respective folders like FluxCloud
          for (let i = 0; i < folderFiles.length; i++) {
            const file = folderFiles[i]
            if (file.size > 100000000) {
              showSnackbar(`File "${file.name}" too large! Upload limit is 100MB`, 'error')
              continue
            }

            const targetFolder = folderMap.get(file) || mainFolder
            console.log(`📤 Uploading file ${i + 1}/${folderFiles.length} to folder UUID: ${targetFolder.uuid || targetFolder.id}`)
            resultMessage.value = `<div class="alert alert-info">Uploading "${file.name}" (${i + 1}/${folderFiles.length})...</div>`

            // Reset progress for this file
            uploadProgress.value = 0

            // Extract just the filename (not the full path) like FluxCloud does
            const pathParts = file.webkitRelativePath.split('/')
            const justFileName = pathParts[pathParts.length - 1] // Get the last part (actual filename)

            // Debug file info
            console.log(`📋 File ${i + 1} details:`)
            console.log(`   - Original path: ${file.webkitRelativePath}`)
            console.log(`   - Clean filename: ${justFileName}`)
            console.log(`   - File size: ${file.size} bytes`)
            console.log(`   - File type: ${file.type}`)
            console.log(`   - Target folder UUID: ${targetFolder.uuid || targetFolder.id}`)

            // Use FluxCloud's exact approach: pass folder UUID and clean filename
            try {
              const uploadResult = await uploadFileToFluxCloudFolder(targetFolder.uuid || targetFolder.id, justFileName, file)
              console.log(`✅ Upload complete for: ${justFileName}`)
              console.log(`📄 Full server response for "${justFileName}":`, JSON.stringify(uploadResult, null, 2))

              // Check if we got a unique identifier back
              if (uploadResult.hash) {
                console.log(`🔗 File hash: ${uploadResult.hash}`)
              }
              if (uploadResult.id || uploadResult.uuid) {
                console.log(`🆔 File ID/UUID: ${uploadResult.id || uploadResult.uuid}`)
              }

              // Check if there are any indicators of file collision/overwriting
              if (uploadResult.message) {
                console.log(`📝 Server message: ${uploadResult.message}`)
              }
            } catch (uploadError) {
              console.error(`❌ Upload failed for: ${justFileName}`, uploadError)
            }
          }

          resultMessage.value = `<div class="alert alert-success">Folder "${folderName}" uploaded successfully with ${folderFiles.length} files</div>`
        } catch (error) {
          console.error(`❌ Error uploading folder ${folderName}:`, error)
          showSnackbar(`Failed to upload folder "${folderName}": ${error.message}`, 'error')
        }
      }

      // Navigate back to original folder
      if (currentFolder.value !== originalFolder) {
        console.log(`🔄 Returning to original folder: ${originalFolder}`)
        await navigateToFolder({ path: originalFolder })
      }

      // Refresh files once at the end
      console.log('🔄 Refreshing files after folder upload')
      await loadFiles()

    } catch (error) {
      console.error('❌ Folder upload failed:', error)
      showSnackbar('Folder upload failed: ' + error.message, 'error')
    } finally {
      // Reset upload state
      uploading.value = false
      uploadProgress.value = 0

      // Clear the folder input
      e.target.value = ''

      // Restore original alert
      window.alert = originalAlert
    }
  }

  // FluxCloud's exact createFolder implementation
  const createFluxCloudFolder = async (currentFolder, name) => {
    try {
      const zelidauth = localStorage.getItem('zelidauth')
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      const response = await fetch(`${bridgeURL}/api/v1/ipfs/createfolder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'zelid': authData.zelid,
          'signature': authData.signature,
          'loginPhrase': authData.loginPhrase,
          'currentFolder': currentFolder.isEmpty || currentFolder === '' ? '/' : currentFolder,
          'name': name,
        }),
      })

      const result = await response.json()
      console.log('FluxCloud createFolder response:', result)

      if (result.warning || result.error) {
        throw new Error(result.error || result.warning)
      }

      return result // Return the folder object directly like FluxCloud
    } catch (error) {
      console.error('❌ FluxCloud createFolder error:', error)
      throw error
    }
  }

  // Helper function to create folder in specific parent (like FluxCloud)
  const createFolderInParent = async (folderName, parentUuid) => {
    try {
      const zelidauth = localStorage.getItem('zelidauth')
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      const apiParams = {
        zelid: authData.zelid,
        signature: authData.signature,
        loginPhrase: authData.loginPhrase,
        name: folderName,
        currentFolder: parentUuid, // Use parent UUID directly like FluxCloud
      }

      const response = await fetch(`${bridgeURL}/api/v1/ipfs/createfolder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(apiParams),
      })

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      return result.folder || result // Return the created folder object
    } catch (error) {
      console.error('❌ Error creating subfolder:', error)
      throw error
    }
  }

  // FluxCloud's exact uploadFile implementation (FluxDriveService.uploadFile)
  const uploadFileToFluxCloudFolder = async (folderUuid, fileName, file) => {
    try {
      const zelidauth = localStorage.getItem('zelidauth')
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      // Create a new File object with just the filename (not the full path)
      const cleanFile = new File([file], fileName, { type: file.type })

      const formData = new FormData()
      formData.append('file', cleanFile)
      formData.append('zelid', authData.zelid)
      formData.append('signature', authData.signature)
      formData.append('loginPhrase', authData.loginPhrase)
      formData.append('currentFolder', folderUuid) // Use folder UUID directly like FluxCloud

      const uploadPromise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            uploadProgress.value = Math.round((e.loaded / e.total) * 100)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText)
              resolve(result)
            } catch (e) {
              resolve(xhr.responseText)
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('POST', `${bridgeURL}/api/v1/ipfs/write`) // Use bridgeURL like FluxCloud
        xhr.send(formData)
      })

      return await uploadPromise
    } catch (error) {
      console.error('❌ FluxCloud uploadFile error:', error)
      throw error
    }
  }

  // Helper function to upload file to specific folder UUID (like FluxCloud)
  const uploadDataToFolder = async (file, folderUuid) => {
    try {
      const zelidauth = localStorage.getItem('zelidauth')
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      const formData = new FormData()
      formData.append('file', file)
      formData.append('zelid', authData.zelid)
      formData.append('signature', authData.signature)
      formData.append('loginPhrase', authData.loginPhrase)
      formData.append('currentFolder', folderUuid) // Use folder UUID directly

      const uploadPromise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            uploadProgress.value = Math.round((e.loaded / e.total) * 100)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText)
              resolve(result)
            } catch (e) {
              resolve(xhr.responseText)
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('POST', `${bridgeURL}/api/v1/ipfs/write`)
        xhr.send(formData)
      })

      return await uploadPromise
    } catch (error) {
      console.error('❌ Upload to folder error:', error)
      throw error
    }
  }

  // Helper function to upload without managing global upload state
  const uploadDataWithoutStateManagement = async file => {
    try {
      // Get authentication details
      const zelidauth = localStorage.getItem('zelidauth')
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      if (!authData.zelid || !authData.loginPhrase || !authData.signature) {
        throw new Error('Authentication required. Please log in again.')
      }

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('zelid', authData.zelid)
      formData.append('signature', authData.signature)
      formData.append('loginPhrase', authData.loginPhrase)

      // Add folder parameter
      const folderPath = currentFolder.value === '/' ? '' : currentFolder.value.replace(/^\//, '')

      if (currentFolder.value === '/') {
        formData.append('currentFolder', '/')
      } else if (sharedState.currentFolderUuid.value) {
        formData.append('currentFolder', sharedState.currentFolderUuid.value)
      } else if (folderPath) {
        formData.append('currentFolder', folderPath)
      }

      // Upload file using XMLHttpRequest for progress tracking
      const uploadPromise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            uploadProgress.value = Math.round((e.loaded / e.total) * 100)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText)
              resolve(result)
            } catch (e) {
              resolve(xhr.responseText)
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('POST', `${bridgeURL}/api/v1/ipfs/write`)
        xhr.send(formData)
      })

      return await uploadPromise
    } catch (error) {
      console.error('❌ Upload error:', error)
      throw error
    }
  }

  // Server-side version upload using existingFile parameter (like FluxCloud)
  const uploadVersionToFluxCloud = async (existingFileHash, fileName, file, comment = '') => {
    try {
      const zelidauth = localStorage.getItem('zelidauth')
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      if (!authData.zelid || !authData.loginPhrase || !authData.signature) {
        throw new Error('Authentication required. Please log in again.')
      }

      console.log('📤 Uploading version using FluxCloud API (existingFile parameter):')
      console.log('   - Existing file hash:', existingFileHash)
      console.log('   - New file name:', fileName)
      console.log('   - Actual file:', file.name)
      console.log('   - Comment:', comment)

      // Create new file with the original file's name for proper grouping
      const versionFile = new File([file], fileName, { type: file.type })

      const formData = new FormData()
      formData.append('file', versionFile) // Upload with original filename for grouping
      formData.append('zelid', authData.zelid)
      formData.append('signature', authData.signature)
      formData.append('loginPhrase', authData.loginPhrase)
      formData.append('currentFolder', sharedState.currentFolderUuid.value || currentFolder.value)
      formData.append('existingFile', existingFileHash) // Required for proper version linking and comment storage
      formData.append('comment', comment)

      console.log('🔍 FormData contents:')
      for (let [key, value] of formData.entries()) {
        // Hide sensitive auth fields
        if (key === 'zelid' || key === 'signature' || key === 'loginPhrase') {
          console.log(`   ${key}:`, '***hidden***')
        } else {
          console.log(`   ${key}:`, typeof value === 'string' ? value : value.constructor.name)
        }
      }

      const uploadPromise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            uploadProgress.value = Math.round((e.loaded / e.total) * 100)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText)
              console.log('📤 Version uploaded successfully, will be grouped by filename:', result)
              resolve(result)
            } catch (e) {
              resolve(xhr.responseText)
            }
          } else {
            reject(new Error(`Version upload failed with status ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Version upload failed'))
        xhr.open('POST', `${bridgeURL}/api/v1/ipfs/write`)
        xhr.send(formData)
      })

      return await uploadPromise
    } catch (error) {
      console.error('❌ Version upload error:', error)
      throw error
    }
  }

  const uploadData = async (file, fileName = null, disableAutoRefresh = false) => {
    uploading.value = true
    uploadProgress.value = 0

    try {
      // Get authentication details
      const zelidauth = localStorage.getItem('zelidauth')
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      if (!authData.zelid || !authData.loginPhrase || !authData.signature) {
        throw new Error('Authentication required. Please log in again.')
      }

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('zelid', authData.zelid)
      formData.append('signature', authData.signature)
      formData.append('loginPhrase', authData.loginPhrase)

      // Add folder parameter - try multiple approaches like create folder
      const folderPath = currentFolder.value === '/' ? '' : currentFolder.value.replace(/^\//, '')

      if (currentFolder.value === '/') {
        // Root folder - FluxCloud uses '/' for currentFolder in uploads
        formData.append('currentFolder', '/')
        console.log('📤 Uploading to root folder (FluxCloud format)')
      } else if (sharedState.currentFolderUuid.value) {
        // Use parent UUID as currentFolder like FluxCloud create folder
        formData.append('currentFolder', sharedState.currentFolderUuid.value)
        console.log('📤 Uploading to subfolder using parent UUID as currentFolder:', sharedState.currentFolderUuid.value)
      } else if (folderPath) {
        formData.append('currentFolder', folderPath)
        console.log('📤 Uploading to subfolder using folder path:', folderPath)
      }

      console.log('📤 Uploading file:', {
        fileName: file.name,
        fileSize: file.size,
        folder: folderPath || 'root',
        currentFolder: currentFolder.value,
        currentFolderUuid: sharedState.currentFolderUuid.value,
        zelid: authData.zelid ? authData.zelid.substring(0, 8) + '...' : 'none',
      })

      // Upload file using XMLHttpRequest for progress tracking
      const uploadPromise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            uploadProgress.value = Math.round((e.loaded / e.total) * 100)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText)
              resolve(result)
            } catch (e) {
              resolve(xhr.responseText)
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }

        xhr.onerror = () => {
          reject(new Error('Upload failed due to network error'))
        }

        xhr.open('POST', `${bridgeURL}/api/v1/ipfs/write`)
        xhr.send(formData)
      })

      const result = await uploadPromise
      console.log('📤 Upload API response:', result)

      // Handle successful upload response (FluxCloud format)
      if (result && !result.error && !result.warning) {
        const newFile = {
          id: result.hash || Date.now(),
          name: result.name || result.fileName || file.name,
          size: result.size || file.size,
          hash: result.hash,
          hash_abbr: result.hash ? result.hash.substring(0, 8) + '...' : '',
          added_date: result.timestamp ? new Date(result.timestamp * 1000).toLocaleString() : new Date().toLocaleString(),
          mimetype: result.mimetype || file.type,
          type: result.type || 'file',
          thumbnail: result.thumbnail || null,
          width: 0,
          deleting: false,
        }

        // Add to files list if on first page
        if (currentPage.value === 1) {
          files.value.unshift(newFile)
        }

        resultMessage.value = `<div class="alert alert-success">File "${file.name}" uploaded successfully!</div>`

        // Reload files from backend to ensure consistency after showing success message
        if (!disableAutoRefresh) {
          console.log('📤 Upload successful, reloading files after delay...')
          setTimeout(async () => {
            await loadFiles()
          }, 5000) // Wait 5 seconds before reloading files (which clears the message)
        }

        // Fetch updated storage info from API
        await fetchStorageInfo()
      } else {
        const errorMsg = result.error || result.warning || 'Upload failed - invalid response'
        console.error('📤 Upload API error:', errorMsg)

        // Check if it's a folder-related error (similar to create folder)
        if (currentFolder.value !== '/' && (
          errorMsg.includes('Invalid parent folder') ||
          errorMsg.includes('folder') ||
          errorMsg.includes('login') ||
          errorMsg.includes('choose a plan')
        )) {
          throw new Error('FluxDrive may not support uploading files to subfolders. Try uploading to the root directory.')
        } else {
          throw new Error(errorMsg)
        }
      }

    } catch (error) {
      console.error('Upload error:', error)
      const errorMsg = error.message || 'Upload failed. Please try again.'
      resultMessage.value = `<div class="alert alert-danger">Upload failed: ${errorMsg}</div>`
      showSnackbar(`Upload failed: ${errorMsg}`, 'error')
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }

  const copyLink = file => {
    const link = `${ipfsHost}/ipfs/${file.hash}`
    navigator.clipboard.writeText(link)
    showSnackbar('Link copied to clipboard', 'success')
  }

  const previewFile = file => {
    previewingFile.value = file
    showFileModal.value = true
  }

  const closeModal = () => {
    showFileModal.value = false
    previewingFile.value = null
  }

  const openFolder = async folder => {
    console.log('Opening folder:', folder)
    if (folder.isFolder) {
      let newPath
      let newFolderUuid = ''

      // Handle "Go Back" functionality
      if (folder.isGoBack) {
        // Go back to parent folder by removing the last entry from hierarchy
        if (sharedState.folderHierarchy.value.length > 1) {
          // Remove current folder from hierarchy
          sharedState.folderHierarchy.value.pop()

          // Get parent folder info
          const parentFolder = sharedState.folderHierarchy.value[sharedState.folderHierarchy.value.length - 1]
          newPath = parentFolder.path
          newFolderUuid = parentFolder.uuid
        } else {
          // Go to root
          newPath = '/'
          newFolderUuid = ''
          sharedState.folderHierarchy.value = [{ path: '/', uuid: '' }]
        }
      } else {
        // Navigate to subfolder
        newPath = currentFolder.value === '/' ?
          `/${folder.name}` :
          `${currentFolder.value}/${folder.name}`

        newFolderUuid = folder.uuid || ''

        // Add to hierarchy stack
        sharedState.folderHierarchy.value.push({
          path: newPath,
          uuid: newFolderUuid,
          name: folder.name,
        })
      }

      console.log('📁 Navigating from', currentFolder.value, 'to', newPath)
      console.log('📁 Folder hierarchy:', sharedState.folderHierarchy.value)
      console.log('📁 New folder UUID:', newFolderUuid)

      currentFolder.value = newPath
      sharedState.currentFolderUuid.value = newFolderUuid

      // Update breadcrumbs
      updateBreadcrumbs(newPath)

      // Clear previous folder's state
      files.value = []

      // Reload files for new folder (with message clearing)
      await loadFiles(true)

      // If no files returned for subfolder, show empty state
      if (files.value.length === 0 && newPath !== '/') {
        console.log('📁 No files in folder:', newPath)

        // Folder is empty, which is expected for new folders
      }
    }
  }

  const updateBreadcrumbs = path => {
    if (path === '/') {
      sharedState.breadcrumbs.value = [{ title: 'Home', path: '/', disabled: false }]
    } else {
      const parts = path.split('/').filter(p => p)
      const crumbs = [{ title: 'Home', path: '/', disabled: false }]

      let currentPath = ''
      parts.forEach((part, index) => {
        currentPath += '/' + part
        crumbs.push({
          title: part,
          path: currentPath,
          disabled: false,
        })
      })

      sharedState.breadcrumbs.value = crumbs
    }
  }

  const navigateToFolder = async breadcrumb => {
    console.log('📁 Navigating to breadcrumb:', breadcrumb)
    currentFolder.value = breadcrumb.path

    // Clear previous folder's state
    files.value = []

    // Properly rebuild folder hierarchy by truncating to the clicked breadcrumb level
    if (breadcrumb.path === '/') {
      // Root navigation
      sharedState.folderHierarchy.value = [{ path: '/', uuid: '' }]
      sharedState.currentFolderUuid.value = ''
    } else {
      // Find the breadcrumb index in current hierarchy and truncate
      const currentHierarchy = sharedState.folderHierarchy.value
      let targetIndex = -1

      // Look for matching path in current hierarchy
      for (let i = 0; i < currentHierarchy.length; i++) {
        if (currentHierarchy[i].path === breadcrumb.path) {
          targetIndex = i
          break
        }
      }

      if (targetIndex !== -1) {
        // Truncate hierarchy to the selected level
        sharedState.folderHierarchy.value = currentHierarchy.slice(0, targetIndex + 1)
        const targetFolder = currentHierarchy[targetIndex]
        sharedState.currentFolderUuid.value = targetFolder.uuid || ''
        console.log('📁 Restored hierarchy to:', sharedState.folderHierarchy.value)
        console.log('📁 Restored UUID to:', sharedState.currentFolderUuid.value)
      } else {
        // Fallback: rebuild from path (without UUID context)
        console.log('⚠️ Could not find path in hierarchy, rebuilding without UUID context')
        const pathParts = breadcrumb.path.split('/').filter(p => p)
        sharedState.folderHierarchy.value = [{ path: '/', uuid: '' }]
        sharedState.currentFolderUuid.value = ''
      }
    }

    updateBreadcrumbs(breadcrumb.path)
    await loadFiles(true)
  }

  const createFolder = async (folderName = null) => {
    // If no folder name provided, this is being called from the old way
    if (!folderName) {
      const promptedName = prompt('Enter folder name:')
      if (!promptedName) return
      folderName = promptedName
    }

    try {
      const zelidauth = localStorage.getItem('zelidauth')
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      // Find the current folder in our file list to get its full data
      const parentFolderData = sharedState.files.value.find(f =>
        f.isFolder && f.name === currentFolder.value.split('/').pop(),
      )

      console.log('🔍 Create folder debug:', {
        folderName: folderName,
        currentFolder: currentFolder.value,
        currentFolderUuid: sharedState.currentFolderUuid.value,
        parentFolderData: parentFolderData,
        breadcrumbs: breadcrumbs.value,
        currentFiles: sharedState.files.value.map(f => ({
          name: f.name,
          isFolder: f.isFolder,
          uuid: f.uuid,
          hash: f.hash,
          id: f.id,
          type: f.type,
        })),
        authData: {
          zelid: authData.zelid ? authData.zelid.substring(0, 8) + '...' : 'none',
          signature: '[HIDDEN]',
          loginPhrase: '[HIDDEN]',
        },
      })

      if (!authData.zelid || !authData.loginPhrase || !authData.signature) {
        showSnackbar('Authentication required. Please log in again.', 'error')
        
        return
      }

      // Try different folder path formats
      const folderPathOptions = {
        withSlash: currentFolder.value,
        withoutSlash: currentFolder.value === '/' ? '' : currentFolder.value.replace(/^\//, ''),
        withoutLeadingSlash: currentFolder.value === '/' ? '/' : currentFolder.value.replace(/^\//, ''),
        empty: currentFolder.value === '/' ? '' : currentFolder.value,
      }

      console.log('🚀 Creating folder - trying different path formats:', folderPathOptions)

      // Prepare API parameters - use UUID if available, otherwise use path
      let apiParams = {
        zelid: authData.zelid,
        signature: authData.signature,
        loginPhrase: authData.loginPhrase,
        name: folderName,
      }

      if (currentFolder.value === '/') {
        // For root folder, use '/' as FluxCloud does
        apiParams.currentFolder = '/'
        console.log('🚀 Using root folder (FluxCloud format): /')
      } else if (sharedState.currentFolderUuid.value) {
        // FluxCloud passes parent UUID directly as currentFolder parameter!
        apiParams.currentFolder = sharedState.currentFolderUuid.value
        console.log('🚀 Using parent UUID as currentFolder (FluxCloud format):', sharedState.currentFolderUuid.value)
      } else {
        // Fallback to path-based approach
        apiParams.currentFolder = folderPathOptions.withoutSlash
        console.log('🚀 Using folder path (no UUID available):', folderPathOptions.withoutSlash)
      }

      const response = await fetch(`${bridgeURL}/api/v1/ipfs/createfolder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(apiParams),
      })

      console.log('📡 Create folder API call params:', sanitizeAuthData(apiParams))

      console.log('📡 Create folder response status:', response.status)
      const responseText = await response.text()
      console.log('📡 Create folder response text:', responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        console.error('❌ Failed to parse JSON response:', e)
        showSnackbar('Invalid response from server', 'error')
        
        return
      }

      console.log('📡 Create folder result:', result)

      if (!result.error && !result.warning && response.ok) {
        resultMessage.value = `<div class="alert alert-success">Folder "${folderName}" created successfully</div>`
        console.log('✅ Folder created successfully, refreshing file list...')
        console.log('📂 Current folder before refresh:', currentFolder.value)
        console.log('📂 Current UUID before refresh:', sharedState.currentFolderUuid.value)

        // Don't auto-refresh here - let the component handle it
        console.log('✅ Folder created successfully - component will handle refresh')
        console.log('📂 Files after refresh:', sharedState.files.value.length)
        console.log('📂 File names after refresh:', sharedState.files.value.map(f => f.name))

        // Return the created folder object with UUID
        return result.folder || result
      } else if (result.error === 'Invalid parent folder') {
        // Try alternative approaches
        console.log('🔄 Trying alternative folder creation methods...')

        // Method 2: Try with empty currentFolder for root, or try with UUID if available
        let alternativeParams = {
          zelid: authData.zelid,
          signature: authData.signature,
          loginPhrase: authData.loginPhrase,
          name: folderName,
        }

        if (currentFolder.value === '/') {
          // For root folder, try with empty string as alternative
          alternativeParams.currentFolder = ''
        } else if (sharedState.currentFolderUuid.value) {
          // Alternative: try path instead of UUID
          alternativeParams.currentFolder = folderPathOptions.withSlash
          console.log('🔄 Alternative: using path instead of UUID:', folderPathOptions.withSlash)
        } else {
          // Try with different path format
          alternativeParams.currentFolder = currentFolder.value
          console.log('🔄 No UUID available, using path:', currentFolder.value)
        }

        console.log('🔄 Alternative params:', sanitizeAuthData(alternativeParams))

        const altResponse = await fetch(`${bridgeURL}/api/v1/ipfs/createfolder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(alternativeParams),
        })

        const altResult = await altResponse.json()
        console.log('📡 Alternative result:', altResult)

        if (!altResult.error && !altResult.warning && altResponse.ok) {
          resultMessage.value = `<div class="alert alert-success">Folder "${folderName}" created successfully</div>`

          // Refresh files after showing success message
          setTimeout(async () => {
            await loadFiles()
          }, 4000)

          return altResult.folder || altResult
        } else {
          const errorMessage = altResult.error || altResult.warning || altResult.message || 'Failed to create folder'
          console.error('❌ Alternative create folder also failed:', errorMessage)

          // Third attempt: Try creating folder with just path-based approach (no UUID)
          console.log('🔄 Trying third approach - path only...')
          const thirdParams = {
            zelid: authData.zelid,
            signature: authData.signature,
            loginPhrase: authData.loginPhrase,
            name: folderName,
            currentFolder: folderPathOptions.withSlash,  // Try with slash this time
          }

          console.log('🔄 Third attempt params:', sanitizeAuthData(thirdParams))

          try {
            const thirdResponse = await fetch(`${bridgeURL}/api/v1/ipfs/createfolder`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams(thirdParams),
            })

            const thirdResult = await thirdResponse.json()
            console.log('📡 Third attempt result:', thirdResult)

            if (!thirdResult.error && !thirdResult.warning && thirdResponse.ok) {
              resultMessage.value = `<div class="alert alert-success">Folder "${folderName}" created successfully</div>`

              // Refresh files after showing success message
              setTimeout(async () => {
                await loadFiles()
              }, 4000)
            } else {
              console.error('❌ All create folder attempts failed')
              showSnackbar('Unable to create folder inside this folder. Please check if you have the correct permissions or try creating in the root directory.', 'warning')
            }
          } catch (err) {
            console.error('❌ Third attempt error:', err)
            showSnackbar(errorMessage, 'error')
          }
        }
      } else {
        const errorMessage = result.error || result.warning || result.message || 'Failed to create folder'
        console.error('❌ Create folder failed:', errorMessage)
        showSnackbar(errorMessage, 'error')
      }
    } catch (error) {
      console.error('❌ Create folder error:', error)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showSnackbar('Network error - could not connect to server', 'error')
      } else {
        showSnackbar('Failed to create folder: ' + error.message, 'error')
      }
    }
  }

  const deleteFile = async (file, skipConfirm = false) => {
    const itemType = file.isFolder ? 'folder' : 'file'

    // Skip confirmation is used for programmatic calls or when confirmation is handled elsewhere
    if (!skipConfirm && !confirm(`Are you sure you want to delete this ${itemType}: ${file.name}?`)) return

    file.deleting = true

    try {
      // Get authentication details
      const zelidauth = localStorage.getItem('zelidauth')
      const authData = zelidauth ?
        (zelidauth.includes('zelid=') ?
          Object.fromEntries(new URLSearchParams(zelidauth)) :
          JSON.parse(zelidauth)) : {}

      if (!authData.zelid || !authData.loginPhrase || !authData.signature) {
        throw new Error('Authentication required. Please log in again.')
      }

      // Choose correct endpoint for file vs folder
      const endpoint = file.isFolder ? '/api/v1/ipfs/removefolder' : '/api/v1/ipfs/remove'
      const params = file.isFolder ?
        { zelid: authData.zelid, signature: authData.signature, loginPhrase: authData.loginPhrase, uuid: file.uuid } :
        { zelid: authData.zelid, signature: authData.signature, loginPhrase: authData.loginPhrase, hash: file.hash }

      // Delete via API
      const response = await fetch(`${bridgeURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      })

      const result = await response.json()

      if (!result.error && !result.warning) {
        // Remove from local list
        const index = files.value.findIndex(f => f.id === file.id)
        if (index > -1) {
          files.value.splice(index, 1)
          resultMessage.value = `<div class="alert alert-success">File "${file.name}" deleted successfully</div>`

          // Fetch updated storage info from API
          await fetchStorageInfo()

          // Clear success message after delay
          setTimeout(() => {
            resultMessage.value = ''
          }, 4000) // Show for 4 seconds
        }
      } else {
        throw new Error(result.error || result.warning || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Delete error:', error)
      const errorMsg = error.message || 'Failed to delete file'
      resultMessage.value = `<div class="alert alert-danger">Delete failed: ${errorMsg}</div>`
      showSnackbar(`Delete failed: ${errorMsg}`, 'error')
      file.deleting = false
    }
  }

  // Utility functions
  const getFileIcon = type => {
    const icons = {
      pdf: 'mdi-file-pdf-box',
      png: 'mdi-file-image',
      jpg: 'mdi-file-image',
      jpeg: 'mdi-file-image',
      gif: 'mdi-file-image',
      bmp: 'mdi-file-image',
      webp: 'mdi-file-image',
      doc: 'mdi-file-document',
      docx: 'mdi-file-document',
      xls: 'mdi-file-excel',
      xlsx: 'mdi-file-excel',
      ppt: 'mdi-file-powerpoint',
      pptx: 'mdi-file-powerpoint',
      zip: 'mdi-folder-zip',
      mp4: 'mdi-file-video',
      webm: 'mdi-file-video',
      ogg: 'mdi-file-video',
      mov: 'mdi-file-video',
      avi: 'mdi-file-video',
      mkv: 'mdi-file-video',
      m4v: 'mdi-file-video',
      flv: 'mdi-file-video',
      wmv: 'mdi-file-video',
      mp3: 'mdi-music',
      txt: 'mdi-file-document-outline',
    }

    return icons[type?.toLowerCase()] || 'mdi-file'
  }

  const isImageFile = mimetype => {
    return ['image/jpeg', 'image/jpg', 'image/bmp', 'image/png', 'image/webp', 'image/gif'].includes(mimetype)
  }

  const isTextFile = (mimetype, filename) => {
    // Check by mimetype first
    const textMimeTypes = [
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'text/markdown',
      'text/xml',
      'application/json',
      'application/javascript',
      'application/xml',
      'application/x-yaml',
      'application/yaml',
    ]

    if (mimetype && textMimeTypes.includes(mimetype)) {
      return true
    }

    // Check by file extension
    if (filename) {
      const extension = filename.split('.').pop().toLowerCase()
      const textExtensions = [
        'txt',
        'md',
        'json',
        'js',
        'jsx',
        'ts',
        'tsx',
        'html',
        'htm',
        'css',
        'scss',
        'sass',
        'less',
        'xml',
        'yaml',
        'yml',
        'toml',
        'ini',
        'conf',
        'sh',
        'bash',
        'bat',
        'cmd',
        'ps1',
        'py',
        'rb',
        'php',
        'java',
        'c',
        'cpp',
        'h',
        'hpp',
        'go',
        'rs',
        'swift',
        'kt',
        'scala',
        'sql',
        'graphql',
        'vue',
        'svelte',
        'log',
        'env',
        'gitignore',
        'dockerignore',
      ]

      return textExtensions.includes(extension)
    }

    return false
  }

  const convertSize = size => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    if (size == 0) return "0"
    const i = parseInt(Math.floor(Math.log(size) / Math.log(1024)))
    
    return (size / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
  }

  const bytesConversion = bytes => {
    if (bytes <= 0) return "0"
    if (bytes <= 99999999) return (bytes / (1024 ** 2)).toFixed(1) + " MB"
    
    return (bytes / (1024 ** 3)).toFixed(1) + " GB"
  }

  const formatDate = date => {
    if (!date || date === null || date === undefined || date === 0 || isNaN(date)) {
      return '-'
    }

    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        return '-'
      }
      
      return dateObj.toLocaleString()
    } catch (error) {
      console.warn('Error formatting date:', date, error)
      
      return '-'
    }
  }

  // Initialize subscription check on composable mount
  const initializeFluxDrive = async () => {
    console.log('🔄 initializeFluxDrive called')
    console.log('🔍 isLoggedIn.value:', isLoggedIn.value)

    // Reset state at start of initialization
    subscriptionChecked.value = false
    currentFolder.value = '/'
    sharedState.breadcrumbs.value = [{ title: 'Home', path: '/', disabled: false }]

    // Clear any stale pending plan selections to prevent unwanted checkout opening
    pendingPlanSelection.value = null
    console.log('🧹 Cleared stale pendingPlanSelection')

    if (isLoggedIn.value) {
      console.log('✅ User is logged in, checking subscription status...')
      const result = await checkSubscriptionStatus()
      console.log('📊 Subscription check result:', result)
    } else {
      console.log('❌ User not logged in, setting subscription to false')
      hasActiveSubscription.value = false
      subscriptionChecked.value = true
    }

    console.log('🔍 Final hasActiveSubscription.value:', hasActiveSubscription.value)
  }

  // Handle actions after successful login
  const handlePostLogin = async () => {
    console.log('🚀 handlePostLogin started')

    // Close the login dialog
    closeLoginBottomSheet()

    // Check subscription status
    console.log('🔍 Checking subscription status...')
    const hasSubscription = await checkSubscriptionStatus()
    console.log('📊 Subscription check result:', hasSubscription)
    console.log('📊 hasActiveSubscription.value:', hasActiveSubscription.value)

    // If there was a pending plan selection, proceed with it
    if (pendingPlanSelection.value && !hasActiveSubscription.value) {
      console.log('📝 Processing pending plan selection:', pendingPlanSelection.value)
      const planId = pendingPlanSelection.value
      pendingPlanSelection.value = null
      await selectPlan(planId)
    } else if (hasActiveSubscription.value) {
      // If user has subscription, load files
      console.log('✅ User has active subscription, loading files...')
      await loadFiles()
    } else {
      console.log('📋 User sees pricing plans')
    }

    // Otherwise, user sees pricing plans to select from
  }

  // Computed property for formatted subscription end date
  const formattedSubscriptionEndDate = computed(() => {
    if (!subscriptionPeriodEnd.value) return null

    const date = new Date(subscriptionPeriodEnd.value * 1000) // Convert Unix timestamp to milliseconds
    const options = { year: 'numeric', month: 'long', day: 'numeric' }

    return date.toLocaleDateString(undefined, options)
  })

  // Computed property for formatted subscription end date with time (24h format)
  const formattedSubscriptionEndDateTime = computed(() => {
    if (!subscriptionPeriodEnd.value) return null

    const date = new Date(subscriptionPeriodEnd.value * 1000) // Convert Unix timestamp to milliseconds
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false }

    return date.toLocaleDateString(undefined, dateOptions) + ', ' + date.toLocaleTimeString(undefined, timeOptions)
  })

  // Reset function to clear all FluxDrive state (called on logout)
  const resetFluxDriveState = () => {
    console.log('🧹 Resetting FluxDrive state...')

    // Reset all shared state to initial values
    sharedState.files.value = []
    sharedState.loading.value = false
    sharedState.loadingStorage.value = false
    sharedState.loadingFiles.value = false
    sharedState.hasActiveSubscription.value = false
    sharedState.subscriptionChecked.value = false
    sharedState.subscriptionPeriodEnd.value = null
    sharedState.paymentGateway.value = ''
    sharedState.storageInfoFetched.value = false
    sharedState.filesLoaded.value = false
    sharedState.usedStorage.value = 0
    sharedState.totalStorage.value = 10737418240 // 10 GB default
    sharedState.currentFolder.value = '/'
    sharedState.currentFolderUuid.value = ''
    sharedState.folderHierarchy.value = []
    sharedState.breadcrumbs.value = [{ title: 'Home', path: '/' }]
    sharedState.errorState.value = {
      hasError: false,
      message: '',
      type: 'error',
      timestamp: null,
      persistent: false,
    }

    console.log('✅ FluxDrive state reset complete')
  }

  return {
    // State
    isLoggedIn,
    hasActiveSubscription,
    subscriptionChecked,
    subscriptionPeriodEnd,
    paymentGateway: sharedState.paymentGateway,
    loading,
    currentFolder,
    breadcrumbs,
    loadingStorage,
    searching,
    subscribing,
    selectedPlan,
    files,
    searchQuery,
    currentPage,
    filesPerPage,
    totalFiles,
    isDragOver,
    uploading,
    uploadProgress,
    showFileModal,
    previewingFile,
    resultMessage,
    uploadMessage,
    openLoginBottomSheet,
    pendingPlanSelection,
    usedStorage,
    totalStorage,
    fluxDrivePlans,
    fileHeaders,

    // Computed
    storagePercentage,
    formattedSubscriptionEndDate,
    formattedSubscriptionEndDateTime,

    // Methods
    getAlertType,
    selectPlan,
    fetchStorageInfo,
    loadFiles,
    checkSubscriptionStatus,
    initializeFluxDrive,
    handlePostLogin,
    searchFile,
    handleDrop,
    handleFileSelect,
    handleFolderSelect,
    uploadData,
    uploadDataWithoutStateManagement,
    uploadVersionToFluxCloud,
    copyLink,
    previewFile,
    closeModal,
    openFolder,
    navigateToFolder,
    createFolder,
    deleteFile,
    getFileIcon,
    isImageFile,
    isTextFile,
    convertSize,
    bytesConversion,
    formatDate,

    // Plan management
    currentPlan,
    getPlanStatus,
    getPlanStorageGB,

    // Error management
    hasError,
    errorMessage,
    errorType,
    setError,
    clearError,

    // Recovery mode
    isRecoveryMode,

    // Subscription management
    renewSubscription,
    upgradeSubscription,
    cancelSubscription,

    // State management
    resetFluxDriveState,

    // Config
    ipfsHost,
    bridgeURL,
  }
}