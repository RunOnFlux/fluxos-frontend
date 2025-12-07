// Lazy-loaded wallet service - SDKs are loaded on-demand to reduce initial bundle size
// This file exports functions that dynamically import wallet SDKs only when needed

// ===== Module-level state (lazy initialized) =====
let appKitModule = null
let wagmiModule = null
let metamaskModule = null
let appKitInstance = null
let wagmiAdapterInstance = null
let MMSDKInstance = null

const APPKIT_INITIALIZED_KEY = '__appkit_initialized__'
const WAGMI_ADAPTER_KEY = '__wagmi_adapter__'

// Suppress wallet library console.error messages (warnings handled in main.js)
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = (...args) => {
    const firstArg = args[0]
    const secondArg = args[1]

    // WalletConnect errors come as: {context: 'client'}, Error(...)
    if (firstArg && typeof firstArg === 'object' && firstArg.context) {
      const errorMsg = secondArg?.message || secondArg?.toString?.() || ''

      // Suppress stale WalletConnect relay errors that don't affect functionality
      if (errorMsg.includes('No matching key. history:') ||
          errorMsg.includes('emitting session_request:') && errorMsg.includes('without any listeners')) {
        return
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

// ===== Lazy Loading Functions =====

/**
 * Lazily load WalletConnect/Reown AppKit modules
 */
async function loadAppKitModules() {
  if (!appKitModule) {
    const [appkit, adapter, networks] = await Promise.all([
      import('@reown/appkit'),
      import('@reown/appkit-adapter-wagmi'),
      import('@reown/appkit/networks'),
    ])
    appKitModule = { createAppKit: appkit.createAppKit }
    wagmiModule = {
      WagmiAdapter: adapter.WagmiAdapter,
      mainnet: networks.mainnet,
    }
  }
  
  return { appKitModule, wagmiModule }
}

/**
 * Lazily load Wagmi core modules
 */
async function loadWagmiCore() {
  const [core, connectors] = await Promise.all([
    import('@wagmi/core'),
    import('@wagmi/connectors'),
  ])
  
  return {
    getAccount: core.getAccount,
    watchAccount: core.watchAccount,
    injected: connectors.injected,
    coinbaseWallet: connectors.coinbaseWallet,
  }
}

/**
 * Lazily load MetaMask SDK
 */
async function loadMetaMaskSDK() {
  if (!metamaskModule) {
    const mod = await import('@metamask/sdk')
    metamaskModule = mod
  }
  
  return metamaskModule
}

// ===== WalletConnect / Reown AppKit Setup =====
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === "localhost"
const projectId = "df787edc6839c7de49d527bba9199eaa"

const metadata = {
  name: "Flux Cloud",
  description: "Flux, Your Gateway to a Decentralized World",
  url: isLocalhost ? (typeof window !== 'undefined' ? window.location.origin : '') : "https://cloud.runonflux.com",
  icons: ["https://cloud.runonflux.com/images/logo.png"],
}

/**
 * Get or create WagmiAdapter (lazy)
 */
async function getWagmiAdapter() {
  // Check if already initialized globally
  if (typeof window !== 'undefined' && window[WAGMI_ADAPTER_KEY]) {
    return window[WAGMI_ADAPTER_KEY]
  }

  if (!wagmiAdapterInstance) {
    const { wagmiModule } = await loadAppKitModules()
    const wagmiCore = await loadWagmiCore()

    const connectors = [
      wagmiCore.injected({ shimDisconnect: true }),
      wagmiCore.coinbaseWallet({
        appName: metadata.name,
        appLogoUrl: metadata.icons[0],
      }),
    ]

    wagmiAdapterInstance = new wagmiModule.WagmiAdapter({
      projectId,
      networks: [wagmiModule.mainnet],
      connectors,
    })

    // Best practice: Reconnect to restore previous session from localStorage
    // This is critical for session persistence across tabs/refreshes
    console.log('[WagmiAdapter] Attempting to reconnect previous session...')
    try {
      await wagmiCore.reconnect(wagmiAdapterInstance.wagmiConfig)
      const account = wagmiCore.getAccount(wagmiAdapterInstance.wagmiConfig)
      if (account?.isConnected) {
        console.log('[WagmiAdapter] ✅ Session restored:', account.address)
      } else {
        console.log('[WagmiAdapter] No previous session to restore')
      }
    } catch (e) {
      console.log('[WagmiAdapter] Reconnect failed (expected if no previous session):', e.message)
    }

    if (typeof window !== 'undefined') {
      window[WAGMI_ADAPTER_KEY] = wagmiAdapterInstance
    }
  }

  return wagmiAdapterInstance
}

/**
 * Get or create AppKit instance (lazy)
 */
async function getAppKit() {
  // Check if already initialized globally
  if (typeof window !== 'undefined' && window[APPKIT_INITIALIZED_KEY]) {
    return window[APPKIT_INITIALIZED_KEY]
  }

  if (!appKitInstance) {
    const { appKitModule, wagmiModule } = await loadAppKitModules()
    const adapter = await getWagmiAdapter()

    appKitInstance = appKitModule.createAppKit({
      adapters: [adapter],
      networks: [wagmiModule.mainnet],
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

    if (typeof window !== 'undefined') {
      window[APPKIT_INITIALIZED_KEY] = appKitInstance
    }
  }

  return appKitInstance
}

// ===== Exported Proxy for appKit (lazy initialization) =====

/**
 * Proxy that lazily initializes AppKit on first access
 * This proxy handles both sync property access (after init) and async method calls
 */
export const appKit = new Proxy({}, {
  get(target, prop) {
    // If already initialized, return the property directly (sync access)
    if (appKitInstance) {
      const value = appKitInstance[prop]
      
      return typeof value === 'function' ? value.bind(appKitInstance) : value
    }

    // Check global window cache
    if (typeof window !== 'undefined' && window[APPKIT_INITIALIZED_KEY]) {
      const instance = window[APPKIT_INITIALIZED_KEY]
      const value = instance[prop]
      
      return typeof value === 'function' ? value.bind(instance) : value
    }

    // Not initialized yet - return an async function that initializes first
    // This ensures first-time callers get proper async behavior
    return async (...args) => {
      const instance = await getAppKit()
      const value = instance[prop]
      if (typeof value === 'function') {
        return value.apply(instance, args)
      }

      return value
    }
  },
})

/**
 * Initialize AppKit and WagmiAdapter proactively
 * Call this before opening wallet dialogs to ensure smooth UX
 * @returns {Promise<{appKit: object, wagmiAdapter: object}>}
 */
export async function initializeWalletSDKs() {
  const [kit, adapter] = await Promise.all([
    getAppKit(),
    getWagmiAdapter(),
  ])

  return { appKit: kit, wagmiAdapter: adapter }
}

/**
 * Get wagmiAdapter (lazy, for compatibility)
 * Note: This is async now, callers need to await
 */
export async function getWagmiAdapterAsync() {
  return getWagmiAdapter()
}

// For backward compatibility - create a lazy proxy
export const wagmiAdapter = new Proxy({}, {
  get(target, prop) {
    // If already initialized, return the property directly (sync access)
    if (wagmiAdapterInstance) {
      const value = wagmiAdapterInstance[prop]
      
      return typeof value === 'function' ? value.bind(wagmiAdapterInstance) : value
    }

    // Check global window cache
    if (typeof window !== 'undefined' && window[WAGMI_ADAPTER_KEY]) {
      const instance = window[WAGMI_ADAPTER_KEY]
      const value = instance[prop]
      
      return typeof value === 'function' ? value.bind(instance) : value
    }

    // Special handling for wagmiConfig - warn if accessed before init
    if (prop === 'wagmiConfig') {
      console.warn('[WalletService] wagmiAdapter.wagmiConfig accessed before initialization. Use getWagmiAdapterAsync() instead.')
      
      return undefined
    }

    // Not initialized yet - return an async function that initializes first
    return async (...args) => {
      const adapter = await getWagmiAdapter()
      const value = adapter[prop]
      if (typeof value === 'function') {
        return value.apply(adapter, args)
      }

      return value
    }
  },
})

// ===== WalletConnect Functions =====

/**
 * Open WalletConnect modal and wait for account connection
 * @returns {Promise<string>} Connected wallet address
 */
export async function openWalletConnect() {
  const kit = await getAppKit()

  return new Promise(async (resolve, reject) => {
    let unsubscribe = null
    let isResolved = false

    try {
      // Check if already connected
      const currentAccount = kit.getAccount?.()

      // Check if we have a valid session by trying to get provider
      let hasValidSession = false
      if (currentAccount?.address && currentAccount?.isConnected) {
        try {
          const provider = await kit.getWalletProvider()
          hasValidSession = !!(provider?.namespaces)
        } catch (e) {
          // No valid session
        }
      }

      if (currentAccount?.address && currentAccount?.isConnected && hasValidSession) {
        console.log('[WalletConnect] Reusing existing session')
        resolve(currentAccount.address)
        
        return
      }

      // Check for stale session
      if (currentAccount?.address || currentAccount?.isConnected) {
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
          await new Promise(r => setTimeout(r, 500))
        } else {
          console.log('[WalletConnect] Account state present but no storage, forcing disconnect...')
          try {
            await kit.disconnect()
          } catch (e) {
            console.log('[WalletConnect] Disconnect failed (expected):', e.message)
          }
          await new Promise(r => setTimeout(r, 500))
        }
      }

      // Subscribe before opening to catch the connection
      unsubscribe = kit.subscribeAccount(account => {
        if (account?.address && account?.isConnected && !isResolved) {
          isResolved = true
          if (typeof unsubscribe === 'function') {
            unsubscribe()
          }
          resolve(account.address)
        }
      })

      // Open modal
      kit.open()
    } catch (error) {
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
  const kit = await getAppKit()
  const adapter = await getWagmiAdapter()
  const wagmiCore = await loadWagmiCore()

  try {
    // Check BOTH AppKit and Wagmi account states
    // Wagmi is more reliable for session persistence
    let appKitAccount = kit.getAccount?.()
    let wagmiAccount = wagmiCore.getAccount(adapter.wagmiConfig)

    console.log('[WalletConnect] Account states:', {
      appKit: { address: appKitAccount?.address, isConnected: appKitAccount?.isConnected },
      wagmi: { address: wagmiAccount?.address, isConnected: wagmiAccount?.isConnected },
    })

    // Check if session exists in localStorage but account state not ready yet (new tab scenario)
    const hasLocalStorageSession = Object.keys(localStorage).some(key =>
      (key.startsWith('wc@2:client:') ||
       key.startsWith('wc@2:core:')) &&
      localStorage.getItem('loginType') === 'walletconnect',
    )

    const hasAccountState = wagmiAccount?.address || appKitAccount?.address
    const possiblyInitializing = hasLocalStorageSession && !hasAccountState

    // If localStorage has session but account state not ready, wait briefly for reconnect() to complete
    if (possiblyInitializing) {
      console.log('[WalletConnect] Session in localStorage, waiting for reconnect() to complete...')

      let initWaitAttempts = 0
      let sessionRestored = false

      while (initWaitAttempts < 6) {  // Max 3 seconds
        await new Promise(r => setTimeout(r, 500))

        const updatedWagmiAccount = wagmiCore.getAccount(adapter.wagmiConfig)
        const updatedAppKitAccount = kit.getAccount?.()

        // Check if session became active (isConnected changed from false -> true)
        if (updatedWagmiAccount?.isConnected || updatedAppKitAccount?.isConnected) {
          console.log('[WalletConnect] ✅ Session restored from localStorage (not expired)')
          wagmiAccount = updatedWagmiAccount
          appKitAccount = updatedAppKitAccount
          sessionRestored = true
          break
        }

        initWaitAttempts++
      }

      if (!sessionRestored) {
        console.log('[WalletConnect] ⚠️ Session did not restore - likely expired or invalid')

        // Will fall through to session validation below
      }
    }

    // Validate session - check if we have a working provider
    let hasValidSession = false
    const hasWagmiConnection = wagmiAccount?.isConnected && wagmiAccount?.address
    const hasAppKitConnection = appKitAccount?.isConnected && appKitAccount?.address

    if (hasWagmiConnection || hasAppKitConnection) {
      try {
        const provider = await kit.getWalletProvider()
        hasValidSession = !!(provider?.namespaces && Object.keys(provider.namespaces).length > 0)

        if (hasValidSession) {
          console.log('[WalletConnect] Valid session found via provider check')
        }
      } catch (e) {
        console.log('[WalletConnect] Session validation failed:', e.message)
      }
    }

    // If no valid session, establish fresh connection
    if (!hasValidSession) {
      console.log('[WalletConnect] No valid session, establishing fresh connection...')
      let connectionAttempts = 0

      while (connectionAttempts < 2) {
        connectionAttempts++
        await openWalletConnect()

        // Wait for provider to be ready
        let providerReady = false
        let attempts = 0
        while (!providerReady && attempts < 6) {
          try {
            const testProvider = await kit.getWalletProvider()
            if (testProvider?.namespaces && Object.keys(testProvider.namespaces).length > 0) {
              providerReady = true
              break
            }
          } catch (e) {
            // Continue waiting
          }
          attempts++
          await new Promise(r => setTimeout(r, 500))
        }

        if (providerReady) break

        if (connectionAttempts < 2) {
          try {
            await kit.disconnect()

            // Clear storage
            const keysToRemove = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && !key.includes('DEEPLINK_CHOICE') && (
                key.startsWith('wc@2:') || key.startsWith('@w3m/') ||
                key.startsWith('W3M_') || key.startsWith('@walletconnect/') ||
                key.startsWith('@reown/') || key.startsWith('@appkit/') ||
                key.startsWith('reown') || key.startsWith('wagmi.') ||
                key.includes('walletconnect')
              )) {
                keysToRemove.push(key)
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key))
            await new Promise(r => setTimeout(r, 1000))
          } catch (e) {
            // Continue
          }
        }
      }

      const finalProvider = await kit.getWalletProvider()
      if (!finalProvider?.namespaces || Object.keys(finalProvider.namespaces).length === 0) {
        throw new Error('WalletConnect session failed to initialize. Please refresh and try again.')
      }
    }

    // Get address from Wagmi first (more reliable), fallback to AppKit
    const finalWagmiAccount = wagmiCore.getAccount(adapter.wagmiConfig)
    const finalAppKitAccount = kit.getAccount?.()

    const address = finalWagmiAccount?.address || finalAppKitAccount?.address

    if (!address) {
      throw new Error('Wallet not connected - please reconnect via WalletConnect')
    }

    console.log('[WalletConnect] Using address for signing:', address)
    const provider = await kit.getWalletProvider()

    if (!provider || typeof provider.request !== 'function') {
      throw new Error('No signing provider available')
    }

    if (!provider.namespaces) {
      throw new Error('Session expired, please reconnect')
    }

    console.log('[WalletConnect] Requesting signature...')

    let timeoutId
    const signaturePromise = provider.request({
      method: 'personal_sign',
      params: [message, address],
    }).then(sig => {
      clearTimeout(timeoutId)
      
      return sig
    }).catch(err => {
      clearTimeout(timeoutId)
      throw err
    })

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Signature request timed out after 2 minutes'))
      }, 120000)
    })

    const signature = await Promise.race([signaturePromise, timeoutPromise])
    console.log('[WalletConnect] ✅ Signature received')
    
    return signature
  } catch (error) {
    console.error('[WalletConnect] ❌ Sign error:', error.message)
    throw error
  }
}

/**
 * Check if WalletConnect session exists in localStorage WITHOUT initializing AppKit
 */
export function hasWalletConnectSession() {
  try {
    const loginType = localStorage.getItem('loginType')
    if (loginType !== 'walletconnect') return false

    const storageKeys = Object.keys(localStorage)
    
    return storageKeys.some(key =>
      key.startsWith('wc@2:client:') ||
      key.startsWith('wc@2:core:') ||
      key.includes('WALLETCONNECT'),
    )
  } catch (error) {
    return false
  }
}

/**
 * Get current connected account from Wagmi
 */
export async function getConnectedAccount() {
  try {
    const adapter = await getWagmiAdapter()
    const wagmiCore = await loadWagmiCore()
    const kit = await getAppKit()

    const wagmiAccount = wagmiCore.getAccount(adapter.wagmiConfig)
    const appKitAccount = kit.getAccount?.()
    const loginType = localStorage.getItem('loginType')

    if (appKitAccount?.isConnected && appKitAccount?.address) {
      return {
        address: appKitAccount.address,
        isConnected: true,
        status: 'connected',
        connector: { name: 'walletConnect' },
      }
    }

    if (wagmiAccount?.isConnected) {
      return wagmiAccount
    }

    return null
  } catch (error) {
    console.warn('[WalletService] getConnectedAccount error:', error.message)
    
    return null
  }
}

/**
 * Watch for account changes
 */
export async function watchWalletAccount(callback) {
  const adapter = await getWagmiAdapter()
  const wagmiCore = await loadWagmiCore()

  return wagmiCore.watchAccount(adapter.wagmiConfig, {
    onChange: account => callback(account),
  })
}

/**
 * Disconnect from WalletConnect
 */
export async function disconnectWalletConnect() {
  try {
    console.log('[WalletConnect] Starting disconnect...')
    const kit = await getAppKit()

    try {
      await kit.disconnect()
      await new Promise(r => setTimeout(r, 500))
    } catch (disconnectError) {
      console.warn('[WalletConnect] AppKit disconnect failed:', disconnectError.message)
    }

    // Clear storage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith('wc@2:') || key.startsWith('@w3m/') ||
        key.startsWith('W3M_') || key.startsWith('@walletconnect/') ||
        key.startsWith('@reown/') || key.startsWith('@appkit/') ||
        key.startsWith('reown') || key.startsWith('wagmi.') ||
        key.includes('walletconnect')
      )) {
        if (!key.includes('DEEPLINK_CHOICE') && !key.includes('recent_wallet')) {
          keysToRemove.push(key)
        }
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log('[WalletConnect] Cleared', keysToRemove.length, 'storage items')

    await new Promise(r => setTimeout(r, 500))
    console.log('[WalletConnect] Disconnect complete')
  } catch (error) {
    console.error('[WalletConnect] Error disconnecting:', error)
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
export async function closeWalletConnect() {
  const kit = await getAppKit()
  kit.close()
}

// ===== MetaMask Functions =====

/**
 * Get MetaMask SDK instance (lazy)
 */
async function getMMSDK() {
  if (!MMSDKInstance) {
    const mod = await loadMetaMaskSDK()
    MMSDKInstance = new mod.MetaMaskSDK({
      checkInstallationImmediately: false,
      enableAnalytics: true,
      preferDesktop: true,
      useDeeplink: false,
      dappMetadata: {
        name: 'Flux Cloud',
        url: isLocalhost ? (typeof window !== 'undefined' ? window.location.origin : '') : 'https://cloud.runonflux.com',
      },
    })
  }
  
  return MMSDKInstance
}

/**
 * Initialize MetaMask provider
 */
async function getMetaMaskProvider() {
  const MMSDK = await getMMSDK()

  if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
    let provider = MMSDK.getProvider()
    if (!provider) {
      await MMSDK.init()
      provider = MMSDK.getProvider()
    }
    if (provider) return provider
  }

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
 * Connect to MetaMask and get account
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
 */
export async function signWithMetaMask(message, account) {
  const provider = await getMetaMaskProvider()

  if (!account) {
    account = await connectMetaMask()
  }

  const signaturePromise = provider.request({
    method: "personal_sign",
    params: [message, account],
  })

  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Please unlock MetaMask extension and try again.'))
    }, 20000)
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
 */
export async function getMetaMaskSDK() {
  return getMMSDK()
}

// ===== SSP Wallet Functions =====

export function isSSPAvailable() {
  return typeof window !== 'undefined' && !!window.ssp
}

export async function signWithSSP(message) {
  console.log('[SSP] 🔐 Starting sign request...')

  if (!isSSPAvailable()) {
    throw new Error('SSP Wallet not installed')
  }

  try {
    const response = await window.ssp.request('sspwid_sign_message', { message })

    if (response.status === 'ERROR') {
      throw new Error(response.data || response.result)
    }

    console.log('[SSP] ✅ Successfully signed message')
    
    return { signature: response.signature, address: response.address }
  } catch (error) {
    console.error('[SSP] ❌ Sign error:', error.message)
    throw error
  }
}

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

// ===== Browser MetaMask Functions =====

export function isBrowserMetaMaskAvailable() {
  return typeof window !== 'undefined' && !!window.ethereum
}

export async function connectBrowserMetaMask() {
  if (!isBrowserMetaMaskAvailable()) {
    throw new Error('MetaMask not found')
  }

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })

  if (!accounts || accounts.length === 0) {
    throw new Error('No MetaMask account selected')
  }

  return accounts[0]
}

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

export function isZelcoreAvailable() {
  return typeof window !== 'undefined' && !!window.zelcore
}

export async function signWithZelcore(message, zelid, callbackUrl = null, icon = 'https%3A%2F%2Fraw.githubusercontent.com%2Frunonflux%2Fflux%2Fmaster%2FzelID.svg', skipWebSocket = false) {
  console.log('[ZelCore] 🔐 Starting sign request...')

  return new Promise(async (resolve, reject) => {
    try {
      let messageToSign = message

      // Handle long messages
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
          } else {
            throw new Error('Storage upload failed')
          }
        } catch (error) {
          reject(new Error('Message too long for ZelCore and Flux Storage is unavailable'))
          
          return
        }
      }

      const hasExtension = window.zelcore && typeof window.zelcore.sign === 'function'
      const hasProtocol = window.zelcore && typeof window.zelcore.protocol === 'function'
      const isExternalApp = !window.zelcore

      // Method 1: Extension
      if (hasExtension) {
        try {
          const signature = await window.zelcore.sign(messageToSign)
          console.log('[ZelCore] ✅ Successfully signed with Extension')
          resolve({ signature, address: zelid })
        } catch (error) {
          reject(new Error('ZelCore Extension signing failed: ' + error.message))
        }
        
        return
      }

      // Method 2: External App
      if (hasProtocol || isExternalApp) {
        if (callbackUrl && !skipWebSocket) {
          try {
            const ws = new WebSocket(callbackUrl)
            ws.onmessage = event => {
              try {
                const data = JSON.parse(event.data)
                if (data.signature && data.zelid) {
                  ws.close()
                  resolve({ signature: data.signature, address: data.zelid })
                }
              } catch (error) {
                console.error('[ZelCore] WebSocket message parse error:', error)
              }
            }
            ws.onerror = error => {
              ws.close()
              reject(new Error('WebSocket connection failed'))
            }
          } catch (error) {
            reject(new Error('Failed to establish WebSocket connection'))
            
            return
          }
        }

        const callback = callbackUrl ? `&callback=${encodeURIComponent(callbackUrl)}` : ''
        const protocol = `zel:?action=sign&message=${encodeURIComponent(messageToSign)}&icon=${icon}${callback}`

        if (window.zelcore && window.zelcore.protocol) {
          window.zelcore.protocol(protocol)
        } else {
          const hiddenLink = document.createElement('a')
          hiddenLink.href = protocol
          hiddenLink.style.display = 'none'
          document.body.appendChild(hiddenLink)
          hiddenLink.click()
          document.body.removeChild(hiddenLink)
        }

        if (!callbackUrl) {
          resolve()
        }
        
        return
      }

      reject(new Error('ZelCore wallet not found'))
    } catch (error) {
      reject(error)
    }
  })
}

export async function payWithZelcore({ address, amount, message, coin = 'zelcash' }) {
  try {
    const protocol = `zel:?action=pay&coin=${coin}&address=${address}&amount=${amount}&message=${message}`

    if (window.zelcore && typeof window.zelcore.protocol === 'function') {
      window.zelcore.protocol(protocol)
    } else {
      const a = document.createElement('a')
      a.href = protocol
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  } catch (error) {
    throw new Error(`Failed to open Zelcore: ${error.message}`)
  }
}

// ===== Text Sanitization for Signing =====

/**
 * Sanitize Unicode punctuation to ASCII equivalents for consistent signature verification.
 *
 * Problem: Backend's toHex() uses charCodeAt() which returns UTF-16 code units,
 * but Ethereum wallets sign messages as UTF-8 bytes. This causes signature mismatches
 * for Unicode characters like smart quotes.
 *
 * Example: Smart quote " (U+201C) becomes 0x201C in UTF-16 but 0xE2 0x80 0x9C in UTF-8
 *
 * This function replaces common Unicode punctuation with ASCII equivalents to ensure
 * consistent byte representation across frontend and backend.
 *
 * @param {string} text - Text that may contain Unicode punctuation
 * @returns {string} Text with Unicode punctuation replaced by ASCII equivalents
 */
export function sanitizeUnicodeForSigning(text) {
  if (!text || typeof text !== 'string') {
    return text
  }

  return text

    // Smart quotes (double)
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')

    // Smart quotes (single) and apostrophes
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")

    // Dashes (em-dash, en-dash, figure dash, horizontal bar)
    .replace(/[\u2013\u2014\u2015\u2212]/g, '-')

    // Ellipsis
    .replace(/\u2026/g, '...')

    // Non-breaking space
    .replace(/\u00A0/g, ' ')

    // Bullet point
    .replace(/\u2022/g, '*')

    // Trademark, copyright, registered
    .replace(/\u2122/g, '(TM)')
    .replace(/\u00A9/g, '(C)')
    .replace(/\u00AE/g, '(R)')

    // Fraction characters
    .replace(/\u00BC/g, '1/4')
    .replace(/\u00BD/g, '1/2')
    .replace(/\u00BE/g, '3/4')

    // Degree symbol
    .replace(/\u00B0/g, ' deg')

    // Plus-minus
    .replace(/\u00B1/g, '+/-')

    // Multiplication sign
    .replace(/\u00D7/g, 'x')

    // Division sign
    .replace(/\u00F7/g, '/')
}
