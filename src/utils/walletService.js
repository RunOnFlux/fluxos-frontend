import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from '@reown/appkit/networks'
import { getAccount, watchAccount } from '@wagmi/core'
import { coinbaseWallet, injected } from '@wagmi/connectors'
import { MetaMaskSDK } from "@metamask/sdk"

// Suppress Lit inefficient update warnings from AppKit components
// This is a known issue in AppKit v1.8.9's router component
// Also suppress stale relay message errors that occur after page refresh
if (typeof window !== 'undefined') {
  const originalWarn = console.warn
  const originalError = console.error

  console.warn = (...args) => {
    const message = args[0] || ''
    const stringMessage = typeof message === 'string' ? message : ''

    // Suppress Lit update warnings
    if (stringMessage.includes('scheduled an update') || stringMessage.includes('change-in-update')) {
      return
    }

    // Suppress font preload warnings from AppKit
    if (stringMessage.includes('was preloaded') && stringMessage.includes('fonts.reown.com')) {
      return
    }

    originalWarn.apply(console, args)
  }

  console.error = (...args) => {
    // Check if first argument is an error context object {context: 'client'}
    const firstArg = args[0]
    const secondArg = args[1]

    // WalletConnect errors come as: {context: 'client'}, Error(...)
    if (firstArg && typeof firstArg === 'object' && firstArg.context) {
      const errorObj = secondArg
      const errorMsg = errorObj?.message || errorObj?.toString?.() || ''

      // Suppress stale WalletConnect relay errors that don't affect functionality
      // These occur when old session requests are processed after page refresh
      if (errorMsg.includes('No matching key. history:') ||
          errorMsg.includes('emitting session_request:') && errorMsg.includes('without any listeners')) {
        return // Suppress stale relay message errors
      }
    }

    // Suppress SVG attribute errors from AppKit icons
    const errorMsg = firstArg?.message || firstArg || ''
    const errorString = typeof errorMsg === 'string' ? errorMsg : errorMsg.toString?.() || ''
    if (errorString.includes('<svg> attribute width:') || errorString.includes('<svg> attribute height:')) {
      return
    }

    originalError.apply(console, args)
  }
}

// ===== WalletConnect / Reown AppKit Setup =====
const isLocalhost = window.location.hostname === "localhost"
const projectId = "df787edc6839c7de49d527bba9199eaa"

const metadata = {
  name: "Flux Cloud",
  description: "Flux, Your Gateway to a Decentralized World",
  url: isLocalhost ? window.location.origin : "https://home.runonflux.io",
  icons: ["https://home.runonflux.io/img/logo.png"],
}

// Singleton pattern to ensure AppKit and WagmiAdapter are only created once globally
let appKitInstance = null
let wagmiAdapterInstance = null
const APPKIT_INITIALIZED_KEY = '__appkit_initialized__'
const WAGMI_ADAPTER_KEY = '__wagmi_adapter__'

function getWagmiAdapter() {
  // Check if already initialized globally
  if (typeof window !== 'undefined' && window[WAGMI_ADAPTER_KEY]) {
    return window[WAGMI_ADAPTER_KEY]
  }

  if (!wagmiAdapterInstance) {
    // Configure connectors for WagmiAdapter
    // NOTE: Do NOT add walletConnect connector - AppKit provides it automatically
    // Adding it causes "WalletConnect Core initialized 2 times" error
    const connectors = [
      injected({ shimDisconnect: true }),
      coinbaseWallet({
        appName: metadata.name,
        appLogoUrl: metadata.icons[0],
      }),
    ]

    wagmiAdapterInstance = new WagmiAdapter({
      projectId,
      networks: [mainnet],
      connectors,
    })

    // Store globally to prevent re-initialization
    if (typeof window !== 'undefined') {
      window[WAGMI_ADAPTER_KEY] = wagmiAdapterInstance
    }
  }

  return wagmiAdapterInstance
}

export const wagmiAdapter = getWagmiAdapter()

function getAppKit() {
  // Check if already initialized globally (prevents double initialization across modules)
  if (typeof window !== 'undefined' && window[APPKIT_INITIALIZED_KEY]) {
    return window[APPKIT_INITIALIZED_KEY]
  }

  if (!appKitInstance) {
    appKitInstance = createAppKit({
      adapters: [getWagmiAdapter()],
      networks: [mainnet],
      metadata,
      projectId,
      sdkVersion: '1.8.9',
      features: {
        analytics: true,
        email: false,
        socials: [],
        emailShowWallets: true,
      },
      enableWallets: true,
      enableCoinbase: true,
      enableInjected: true,
      enableEIP6963: true,
    })

    // Store globally to prevent re-initialization
    if (typeof window !== 'undefined') {
      window[APPKIT_INITIALIZED_KEY] = appKitInstance
    }
  }

  return appKitInstance
}

// Export getter function instead of direct instance to ensure lazy initialization
export const appKit = new Proxy({}, {
  get(target, prop) {
    const instance = getAppKit()
    const value = instance[prop]

    return typeof value === 'function' ? value.bind(instance) : value
  },
})

// ===== MetaMask SDK Setup =====
const MMSDK = new MetaMaskSDK({
  checkInstallationImmediately: false,
  enableAnalytics: true,
  preferDesktop: true, // Prefer extension over SDK modal
  useDeeplink: false, // Don't use deeplinks when extension is available
  dappMetadata: {
    name: 'Flux Cloud',
    url: isLocalhost ? window.location.origin : 'https://home.runonflux.io',
  },
})

// ===== WalletConnect Functions =====

/**
 * Open WalletConnect modal and wait for account connection
 * @returns {Promise<string>} Connected wallet address
 */
export async function openWalletConnect() {
  return new Promise(async (resolve, reject) => {
    let unsubscribe = null
    let isResolved = false

    try {
      // Check if already connected
      const currentAccount = appKit.getAccount?.()

      // Check if we have a valid session by trying to get provider
      let hasValidSession = false
      if (currentAccount?.address && currentAccount?.isConnected) {
        try {
          const provider = await appKit.getWalletProvider()
          hasValidSession = !!(provider?.namespaces)
        } catch (e) {
          // No valid session
        }
      }

      if (currentAccount?.address && currentAccount?.isConnected && hasValidSession) {
        // Already connected with valid session, just return the address
        console.log('[WalletConnect] Reusing existing session')
        resolve(currentAccount.address)

        return
      }

      // Check for stale session - AppKit shows account but there's WC storage
      // Only clear if there's actual storage to clear (avoid clearing after fresh disconnect)
      if (currentAccount?.address || currentAccount?.isConnected) {
        // Check if there's actually WalletConnect storage present
        const hasWCStorage = Object.keys(localStorage).some(key =>
          (key.startsWith('wc@2:') ||
          key.startsWith('@w3m/') ||
          key.startsWith('W3M_') ||
          key.startsWith('@walletconnect/') ||
          key.startsWith('@reown/') ||
          key.startsWith('@appkit/') ||
          key.startsWith('reown') ||
          key.startsWith('wagmi.') ||
          key.includes('walletconnect')) &&
          !key.includes('DEEPLINK_CHOICE'),
        )

        if (hasWCStorage) {
          console.log('[WalletConnect] Stale session detected, clearing cache')

          // Clear WalletConnect/Reown storage to force fresh session
          // Note: appKit.disconnect() doesn't always clear cached state properly
          // especially when wallet was already disconnected externally
          try {
            const keysToRemove = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && !key.includes('DEEPLINK_CHOICE') && (
                key.startsWith('wc@2:') ||
                key.startsWith('@w3m/') ||
                key.startsWith('W3M_') ||
                key.startsWith('@walletconnect/') ||
                key.startsWith('@reown/') ||
                key.startsWith('@appkit/') ||
                key.startsWith('reown') ||
                key.startsWith('wagmi.') ||
                key.includes('walletconnect')
              )) {
                keysToRemove.push(key)
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key))
            console.log('[WalletConnect] Cleared', keysToRemove.length, 'cached items')
          } catch (e) {
            console.warn('[WalletConnect] Failed to clear storage:', e)
          }

          // Wait for storage to clear and state to reset
          await new Promise(r => setTimeout(r, 500))
        } else {
          console.log('[WalletConnect] Account state present but no storage, forcing disconnect to clear stale state...')

          // Force disconnect to clear AppKit's stale in-memory state
          try {
            await appKit.disconnect()
            console.log('[WalletConnect] Stale state cleared via disconnect')
          } catch (e) {
            console.log('[WalletConnect] Disconnect failed (expected if already disconnected):', e.message)
          }

          // Wait for state to reset
          await new Promise(r => setTimeout(r, 500))
        }
      }

      // Subscribe before opening to catch the connection
      unsubscribe = appKit.subscribeAccount(account => {
        if (account?.address && account?.isConnected && !isResolved) {
          isResolved = true
          // Clean up subscription
          if (typeof unsubscribe === 'function') {
            unsubscribe()
          }
          resolve(account.address)
        }
      })

      // Open modal after subscription is set up
      appKit.open()
    } catch (error) {
      // Clean up on error
      console.error('[WalletConnect] Error opening wallet:', error)
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
      reject(error)
    }
  })
}

/**
 * Sign a message using WalletConnect
 * @param {string} message - Message to sign
 * @returns {Promise<string>} Signature
 */
export async function signWithWalletConnect(message) {
  console.log('[WalletConnect] 🔐 Starting sign request...')
  console.log('[WalletConnect] Message to sign:', message)

  try {
    // Check if we have a valid session or need fresh connection
    const currentAccount = appKit.getAccount?.()
    console.log('[WalletConnect] Current account state:', {
      address: currentAccount?.address,
      isConnected: currentAccount?.isConnected,
      status: currentAccount?.status,
    })

    // Validate session by checking namespaces
    let hasValidSession = false
    if (currentAccount?.address && currentAccount?.isConnected) {
      try {
        const provider = await appKit.getWalletProvider()
        hasValidSession = !!(provider?.namespaces && Object.keys(provider.namespaces).length > 0)
        console.log('[WalletConnect] Session validation:', { hasValidSession, hasNamespaces: !!provider?.namespaces })
      } catch (e) {
        console.log('[WalletConnect] Session validation failed:', e.message)
      }
    }

    // If no valid session, establish fresh connection
    if (!hasValidSession) {
      console.log('[WalletConnect] No valid session detected, establishing fresh connection...')

      // Try connection up to 2 times - first attempt might fail after external disconnect
      let connectionAttempts = 0
      let address = null

      while (connectionAttempts < 2) {
        connectionAttempts++
        console.log(`[WalletConnect] Connection attempt ${connectionAttempts}/2`)

        address = await openWalletConnect() // This handles stale session cleanup
        console.log('[WalletConnect] ✅ Fresh connection established:', address)

        // Wait for provider to be fully initialized after fresh connection
        console.log('[WalletConnect] Waiting for provider to initialize...')
        let providerReady = false
        let attempts = 0
        const maxAttempts = 6 // 3 seconds per connection attempt

        while (!providerReady && attempts < maxAttempts) {
          try {
            const testProvider = await appKit.getWalletProvider()
            console.log(`[WalletConnect] Provider check attempt ${attempts + 1}/${maxAttempts}:`, {
              hasProvider: !!testProvider,
              hasNamespaces: !!testProvider?.namespaces,
              namespaceCount: testProvider?.namespaces ? Object.keys(testProvider.namespaces).length : 0,
            })

            if (testProvider?.namespaces && Object.keys(testProvider.namespaces).length > 0) {
              providerReady = true
              console.log('[WalletConnect] ✅ Provider ready for signing')
              break // Exit both loops on success
            } else {
              attempts++
              await new Promise(r => setTimeout(r, 500))
            }
          } catch (e) {
            console.log(`[WalletConnect] Provider check error attempt ${attempts + 1}:`, e.message)
            attempts++
            await new Promise(r => setTimeout(r, 500))
          }
        }

        if (providerReady) {
          break // Success, exit retry loop
        }

        // Attempt failed, try complete disconnect and retry
        if (connectionAttempts < 2) {
          console.log('[WalletConnect] Provider initialization failed, disconnecting and retrying...')

          try {
            await appKit.disconnect()

            // Clear all WalletConnect storage before retry
            const keysToRemove = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && !key.includes('DEEPLINK_CHOICE') && (
                key.startsWith('wc@2:') ||
                key.startsWith('@w3m/') ||
                key.startsWith('W3M_') ||
                key.startsWith('@walletconnect/') ||
                key.startsWith('@reown/') ||
                key.startsWith('@appkit/') ||
                key.startsWith('reown') ||
                key.startsWith('wagmi.') ||
                key.includes('walletconnect')
              )) {
                keysToRemove.push(key)
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key))
            console.log('[WalletConnect] Cleared storage, retrying connection...')
            await new Promise(r => setTimeout(r, 1000)) // Wait 1 second before retry
          } catch (e) {
            console.log('[WalletConnect] Disconnect error (expected):', e.message)
          }
        }
      }

      // Check if we succeeded after all attempts
      const finalProvider = await appKit.getWalletProvider()
      if (!finalProvider?.namespaces || Object.keys(finalProvider.namespaces).length === 0) {
        console.log('[WalletConnect] All connection attempts failed')
        throw new Error('WalletConnect session failed to initialize. Please refresh the page and try again.')
      }
    } else {
      console.log('[WalletConnect] ✅ Reusing existing valid session')
    }

    // Get current account (guaranteed to be valid now)
    const appKitAccount = appKit.getAccount?.()
    if (!appKitAccount?.address || !appKitAccount?.isConnected) {
      console.error('[WalletConnect] ❌ Wallet not connected after connection attempt')
      throw new Error('Wallet not connected - please reconnect via WalletConnect')
    }

    const address = appKitAccount.address
    console.log('[WalletConnect] Using address:', address)

    // Get the Wagmi provider directly from the adapter
    console.log('[WalletConnect] Getting wallet provider...')
    const provider = await appKit.getWalletProvider()
    console.log('[WalletConnect] Provider info:', {
      hasProvider: !!provider,
      hasRequest: typeof provider?.request === 'function',
      hasNamespaces: !!provider?.namespaces,
      namespaces: provider?.namespaces ? Object.keys(provider.namespaces) : [],
      session: provider?.session ? 'present' : 'missing',
    })

    if (!provider || typeof provider.request !== 'function') {
      console.error('[WalletConnect] ❌ No signing provider available')
      throw new Error('No signing provider available')
    }

    // Check if provider has active session (namespaces should be defined)
    if (!provider.namespaces) {
      console.error('[WalletConnect] ❌ Session expired - no namespaces')
      throw new Error('Session expired, please reconnect')
    }

    // Sign using personal_sign
    console.log('[WalletConnect] Requesting signature via personal_sign...')
    console.log('[WalletConnect] Waiting for user to sign in wallet...')

    // Add timeout for signing request
    let timeoutId
    const signaturePromise = provider.request({
      method: 'personal_sign',
      params: [message, address],
    }).then(sig => {
      console.log('[WalletConnect] 🎯 Provider.request resolved with signature')
      clearTimeout(timeoutId) // Clear timeout on success

      return sig
    }).catch(err => {
      console.log('[WalletConnect] ❌ Provider.request rejected:', err.message)
      clearTimeout(timeoutId) // Clear timeout on error
      throw err
    })

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        console.log('[WalletConnect] ⏰ Signature timeout reached (2 minutes)')
        reject(new Error('Signature request timed out after 2 minutes'))
      }, 120000) // 2 minutes
    })

    console.log('[WalletConnect] ⏳ Racing between signature and timeout...')
    const signature = await Promise.race([signaturePromise, timeoutPromise])

    console.log('[WalletConnect] ✅ Signature received:', signature.substring(0, 20) + '...')
    console.log('[WalletConnect] Full signature length:', signature.length)

    return signature
  } catch (error) {
    console.error('[WalletConnect] ❌ Sign error:', error.message)
    console.error('[WalletConnect] Error stack:', error.stack)
    throw error
  }
}

/**
 * Check if WalletConnect session exists in localStorage WITHOUT initializing AppKit
 * This is a lightweight check used during polling to avoid triggering AppKit initialization
 * @returns {boolean} True if WalletConnect session appears to exist
 */
export function hasWalletConnectSession() {
  try {
    const loginType = localStorage.getItem('loginType')
    if (loginType !== 'walletconnect') {
      return false
    }

    // Check for WalletConnect session in localStorage without initializing AppKit
    // WalletConnect stores sessions with keys like: wc@2:client:...
    const storageKeys = Object.keys(localStorage)
    const hasWCSession = storageKeys.some(key =>
      key.startsWith('wc@2:client:') ||
      key.startsWith('wc@2:core:') ||
      key.includes('WALLETCONNECT'),
    )

    console.log('[WalletService] hasWalletConnectSession (lightweight):', hasWCSession)

    return hasWCSession
  } catch (error) {
    console.warn('[WalletService] hasWalletConnectSession error:', error.message)

    return false
  }
}

/**
 * Get current connected account from Wagmi
 * This WILL initialize AppKit if not already initialized
 * Use hasWalletConnectSession() for lightweight checks during polling
 * @returns {object|null} Account object or null if not connected
 */
export function getConnectedAccount() {
  try {
    const wagmiAccount = getAccount(wagmiAdapter.wagmiConfig)
    const appKitAccount = appKit.getAccount?.()
    const loginType = localStorage.getItem('loginType')

    console.log('[WalletService] getConnectedAccount called:', {
      loginType,
      wagmi: {
        hasAccount: !!wagmiAccount,
        address: wagmiAccount?.address,
        isConnected: wagmiAccount?.isConnected,
        status: wagmiAccount?.status,
        connector: wagmiAccount?.connector?.name,
      },
      appKit: {
        hasAccount: !!appKitAccount,
        address: appKitAccount?.address,
        isConnected: appKitAccount?.isConnected,
        status: appKitAccount?.status,
      },
    })

    // Check both Wagmi and AppKit for connection state
    // AppKit is the source of truth for WalletConnect connections
    if (appKitAccount?.isConnected && appKitAccount?.address) {
      console.log('[WalletService] ✅ Using AppKit account')
      return {
        address: appKitAccount.address,
        isConnected: true,
        status: 'connected',
        connector: { name: 'walletConnect' },
      }
    }

    // If Wagmi shows connected, use that
    if (wagmiAccount?.isConnected) {
      console.log('[WalletService] ✅ Using Wagmi account')

      return wagmiAccount
    }

    // If loginType is walletconnect but neither shows connected,
    // the session might still be reconnecting after page load
    if (loginType === 'walletconnect') {
      console.log('[WalletService] ⏳ WalletConnect session reconnecting...')
    }

    return null
  } catch (error) {
    console.warn('[WalletService] getConnectedAccount error:', error.message)

    // Silently fail if Wagmi is not ready
    return null
  }
}

/**
 * Watch for account changes (connect/disconnect)
 * @param {Function} callback - Called when account changes with account object
 * @returns {Function} Unwatch function
 */
export function watchWalletAccount(callback) {
  return watchAccount(wagmiAdapter.wagmiConfig, {
    onChange: account => {
      callback(account)
    },
  })
}

/**
 * Disconnect from WalletConnect and clear cached session
 * Note: AppKit.disconnect() doesn't always clear localStorage properly,
 * especially after external wallet disconnect. We force clear cache.
 * See: https://github.com/reown-com/appkit/issues/293
 */
export async function disconnectWalletConnect() {
  try {
    console.log('[WalletConnect] Starting disconnect...')

    // Try to disconnect via AppKit
    try {
      await appKit.disconnect()
      console.log('[WalletConnect] AppKit disconnect called')
      await new Promise(r => setTimeout(r, 500))
    } catch (disconnectError) {
      console.warn('[WalletConnect] AppKit disconnect failed:', disconnectError.message)
      // Continue to clear cache anyway
    }

    // Force clear ALL WalletConnect/Reown storage (except UI preferences like deeplink choice)
    // This is necessary because AppKit doesn't properly clear state on disconnect
    const keysToRemove = []
    const keysToKeep = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith('wc@2:') ||
        key.startsWith('@w3m/') ||
        key.startsWith('W3M_') ||
        key.startsWith('@walletconnect/') ||
        key.startsWith('@reown/') ||
        key.startsWith('@appkit/') ||
        key.startsWith('reown') ||
        key.startsWith('wagmi.') ||
        key.includes('walletconnect')
      )) {
        if (key.includes('DEEPLINK_CHOICE') || key.includes('recent_wallet')) {
          keysToKeep.push(key)
        } else {
          keysToRemove.push(key)
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log('[WalletConnect] Cleared', keysToRemove.length, 'storage items')

    // Wait for AppKit state to update
    await new Promise(r => setTimeout(r, 500))

    console.log('[WalletConnect] Disconnect complete')
  } catch (error) {
    console.error('[WalletConnect] Error disconnecting:', error)

    // Even on error, try to clear critical keys
    try {
      localStorage.removeItem('wc@2:client:0.3//session')
      localStorage.removeItem('wagmi.store')
    } catch (e) {
      // Silent fail
    }
  }
}

/**
 * Close WalletConnect modal
 */
export function closeWalletConnect() {
  appKit.close()
}

// ===== MetaMask Functions =====

/**
 * Initialize MetaMask provider
 * @returns {Promise<object>} MetaMask provider
 */
async function getMetaMaskProvider() {
  // Check if extension is installed first
  if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
    // SDK should detect and use the extension
    let provider = MMSDK.getProvider()

    if (!provider) {
      await MMSDK.init()
      provider = MMSDK.getProvider()
    }

    if (provider) {
      return provider
    }
  }

  // No extension found, SDK will handle mobile or show install prompt
  let provider = MMSDK.getProvider()

  if (!provider) {
    await MMSDK.init()
    provider = MMSDK.getProvider()
  }

  if (!provider) {
    throw new Error("MetaMask not installed. Please install MetaMask extension or mobile app.")
  }

  return provider
}

/**
 * Check if MetaMask is locked
 * @returns {Promise<boolean>} True if locked, false if unlocked, null if cannot determine
 */
export async function isMetaMaskLocked() {
  try {
    const provider = await getMetaMaskProvider()

    // Check if extension is available
    if (!window.ethereum?.isMetaMask) {
      return null
    }

    // Try to check accounts first
    const accounts = await provider.request({ method: "eth_accounts" })

    // If no accounts, definitely need to connect (might be locked or just not connected)
    if (accounts.length === 0) {
      return true // Treat as locked to show the info message
    }

    // Has accounts - try a simple read operation to verify wallet is truly accessible
    // eth_chainId should work even when locked if already connected
    try {
      await provider.request({ method: "eth_chainId" })

      return false // Can access, so unlocked
    } catch (e) {
      return true // Cannot access despite having accounts, likely locked
    }
  } catch (e) {
    return null // Cannot determine
  }
}

/**
 * Connect to MetaMask and get account
 * Simple implementation matching original behavior
 * @returns {Promise<string>} Connected account address
 */
export async function connectMetaMask() {
  const provider = await getMetaMaskProvider()

  const accounts = await provider.request({ method: "eth_requestAccounts" })
  const account = accounts[0]

  if (!account) {
    throw new Error("No MetaMask account found")
  }

  return account
}

/**
 * Sign a message using MetaMask
 * @param {string} message - Message to sign
 * @param {string} [account] - Account address (optional, will request if not provided)
 * @returns {Promise<{address: string, signature: string}>} Account and signature
 */
export async function signWithMetaMask(message, account) {
  const provider = await getMetaMaskProvider()

  if (!account) {
    account = await connectMetaMask()
  }

  // Sign with plain text message (not hex)
  const signaturePromise = provider.request({
    method: "personal_sign",
    params: [message, account],
  })

  // Add timeout with helpful message about unlocking
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Please unlock MetaMask extension and try again.'))
    }, 20000) // 20 seconds timeout
  })

  try {
    const signature = await Promise.race([signaturePromise, timeoutPromise])
    clearTimeout(timeoutId)

    return { address: account, signature }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Get MetaMask SDK instance
 * @returns {MetaMaskSDK}
 */
export function getMetaMaskSDK() {
  return MMSDK
}

// ===== SSP Wallet Functions =====

/**
 * Check if SSP wallet is available
 * @returns {boolean}
 */
export function isSSPAvailable() {
  return typeof window !== 'undefined' && !!window.ssp
}

/**
 * Sign a message using SSP wallet
 * @param {string} message - Message to sign
 * @returns {Promise<{signature: string, address: string}>} Signature and address
 */
export async function signWithSSP(message) {
  console.log('[SSP] 🔐 Starting sign request...')

  if (!isSSPAvailable()) {
    throw new Error('SSP Wallet not installed')
  }

  try {
    const response = await window.ssp.request('sspwid_sign_message', {
      message,
    })

    if (response.status === 'ERROR') {
      throw new Error(response.data || response.result)
    }

    console.log('[SSP] ✅ Successfully signed message')

    return {
      signature: response.signature,
      address: response.address,
    }
  } catch (error) {
    console.error('[SSP] ❌ Sign error:', error.message)
    throw error
  }
}

/**
 * Make a payment using SSP wallet
 * @param {object} data - Payment data
 * @param {string} data.message - Message/hash to sign
 * @param {string} data.amount - Amount to pay
 * @param {string} data.address - Destination address
 * @param {string} data.chain - Blockchain chain
 * @returns {Promise<object>} Payment response with txid
 */
export async function payWithSSP(data) {
  if (!isSSPAvailable()) {
    throw new Error('SSP Wallet not found')
  }

  const response = await window.ssp.request('pay', data)

  if (response.status === 'ERROR') {
    throw new Error(response.data || response.result)
  }

  return response
}

// ===== Browser MetaMask (window.ethereum) Functions =====

/**
 * Check if browser MetaMask is available
 * @returns {boolean}
 */
export function isBrowserMetaMaskAvailable() {
  return typeof window !== 'undefined' && !!window.ethereum
}

/**
 * Connect to browser MetaMask
 * @returns {Promise<string>} Connected account address
 */
export async function connectBrowserMetaMask() {
  if (!isBrowserMetaMaskAvailable()) {
    throw new Error('MetaMask not found')
  }

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  })

  if (!accounts || accounts.length === 0) {
    throw new Error('No MetaMask account selected')
  }

  return accounts[0]
}

/**
 * Sign a message using browser MetaMask
 * @param {string} message - Message to sign
 * @param {string} [account] - Account address (optional, will use selected or request)
 * @returns {Promise<{address: string, signature: string}>} Account and signature
 */
export async function signWithBrowserMetaMask(message, account) {
  if (!isBrowserMetaMaskAvailable()) {
    throw new Error('MetaMask not found')
  }

  if (!account) {
    account = window.ethereum.selectedAddress || (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0]
  }

  const msg = `0x${Buffer.from(message, 'utf8').toString('hex')}`

  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [msg, account],
  })

  return { address: account, signature }
}

// ===== Zelcore Wallet Functions =====

/**
 * Check if Zelcore is available (desktop app)
 * @returns {boolean}
 */
export function isZelcoreAvailable() {
  return typeof window !== 'undefined' && !!window.zelcore
}

/**
 * Sign a message using Zelcore
 * @param {string} message - Message to sign
 * @param {string} zelid - User's ZelID address
 * @param {string} [callbackUrl] - Optional callback URL for WebSocket signature response
 * @param {string} [icon] - Optional icon URL
 * @param {boolean} [skipWebSocket] - If true, only trigger protocol without setting up WebSocket (caller handles it)
 * @returns {Promise<{signature: string, address: string} | void>} Signature and address if extension, or void for protocol
 */
export async function signWithZelcore(message, zelid, callbackUrl = null, icon = 'https%3A%2F%2Fraw.githubusercontent.com%2Frunonflux%2Fflux%2Fmaster%2FzelID.svg', skipWebSocket = false) {
  console.log('[ZelCore] 🔐 Starting sign request...')

  return new Promise(async (resolve, reject) => {
    try {
      let messageToSign = message

      // Handle long messages - upload to Flux Storage if > 1800 chars
      if (message.length > 1800) {
        console.log('[ZelCore] Message too long, uploading to Flux Storage...')

        try {
          const publicid = Math.floor(Math.random() * 999999999999999).toString()
          const response = await fetch('https://storage.runonflux.io/v1/public', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicid, public: message }),
          })

          if (response.ok) {
            messageToSign = `FLUX_URL=https://storage.runonflux.io/v1/public/${publicid}`
            console.log('[ZelCore] Message uploaded to Flux Storage')
          } else {
            throw new Error('Storage upload failed')
          }
        } catch (error) {
          console.error('[ZelCore] Flux Storage upload failed:', error)
          reject(new Error('Message too long for ZelCore and Flux Storage is unavailable'))

          return
        }
      }

      // Detect ZelCore version - browser extension vs external app
      const hasExtension = window.zelcore && typeof window.zelcore.sign === 'function'
      const hasProtocol = window.zelcore && typeof window.zelcore.protocol === 'function'
      const isExternalApp = !window.zelcore

      // Method 1: ZelCore Extension - direct signing
      if (hasExtension) {
        console.log('[ZelCore] Using Extension direct signing')
        try {
          const signature = await window.zelcore.sign(messageToSign)
          console.log('[ZelCore] ✅ Successfully signed with Extension')
          resolve({
            signature: signature,
            address: zelid,
          })
        } catch (error) {
          console.error('[ZelCore] ❌ Extension signing failed:', error)
          reject(new Error('ZelCore Extension signing failed: ' + error.message))
        }

        return
      }

      // Method 2: ZelCore External App - protocol with optional WebSocket callback
      if (hasProtocol || isExternalApp) {
        console.log('[ZelCore] Using External App protocol signing')

        // If callback URL provided and WebSocket not skipped, set up WebSocket listener
        if (callbackUrl && !skipWebSocket) {
          try {
            const ws = new WebSocket(callbackUrl)

            ws.onmessage = event => {
              try {
                const data = JSON.parse(event.data)
                if (data.signature && data.zelid) {
                  console.log('[ZelCore] ✅ Received signature via WebSocket')
                  ws.close()
                  resolve({
                    signature: data.signature,
                    address: data.zelid,
                  })
                }
              } catch (error) {
                console.error('[ZelCore] WebSocket message parse error:', error)
              }
            }

            ws.onerror = error => {
              console.error('[ZelCore] WebSocket error:', error)
              ws.close()
              reject(new Error('WebSocket connection failed'))
            }

            ws.onclose = () => {
              console.log('[ZelCore] WebSocket closed')
            }
          } catch (error) {
            console.error('[ZelCore] Failed to establish WebSocket:', error)
            reject(new Error('Failed to establish WebSocket connection'))

            return
          }
        }

        // Launch ZelCore protocol
        const callback = callbackUrl ? `&callback=${encodeURIComponent(callbackUrl)}` : ''
        const protocol = `zel:?action=sign&message=${encodeURIComponent(messageToSign)}&icon=${icon}${callback}`

        if (window.zelcore && window.zelcore.protocol) {
          window.zelcore.protocol(protocol)
        } else {
          // Fallback: use hidden link to trigger protocol
          const hiddenLink = document.createElement('a')
          hiddenLink.href = protocol
          hiddenLink.style.display = 'none'
          document.body.appendChild(hiddenLink)
          hiddenLink.click()
          document.body.removeChild(hiddenLink)
        }

        console.log('[ZelCore] Protocol signing initiated')

        // If no callback, resolve immediately (caller handles response manually)
        if (!callbackUrl) {
          resolve()
        }

        return
      }

      // No ZelCore detected
      reject(new Error('ZelCore wallet not found'))
    } catch (error) {
      console.error('[ZelCore] ❌ Sign error:', error)
      reject(error)
    }
  })
}

/**
 * Make a payment using Zelcore
 * @param {object} params - Payment parameters
 * @param {string} params.address - Destination address
 * @param {number} params.amount - Amount to pay
 * @param {string} params.message - Payment message/memo
 * @param {string} [params.coin='zelcash'] - Coin type
 * @returns {Promise<void>} Opens Zelcore payment protocol
 */
export async function payWithZelcore({ address, amount, message, coin = 'zelcash' }) {
  try {
    const protocol = `zel:?action=pay&coin=${coin}&address=${address}&amount=${amount}&message=${message}`

    const a = document.createElement('a')
    a.href = protocol
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (error) {
    throw new Error(`Failed to open Zelcore: ${error.message}`)
  }
}
