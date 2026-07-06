import { ref } from 'vue'
import { cloneDeep } from 'lodash-es'
import AppsService from '@/services/AppsService'
import {
  isWebCryptoAvailable,
  importRsaPublicKey,
  encryptAesKeyWithRsaKey,
  encryptEnterpriseWithAes,
} from '@/utils/enterpriseCrypto'

// Placeholder used only for the estimate when the user hasn't set a value yet.
// Matches the address the public cost-calculator uses for its price calls.
const PLACEHOLDER_OWNER = '176iuPFBqD4yg3Fd7oPVhB3d4NXWxvQyxx'

// The pricing public key is stable for the session; cache it so an enterprise
// estimate doesn't refetch it on every keystroke.
let cachedPubKey = null

// Debounced live price estimate for the app registration flow.
// This is intentionally independent from the authoritative priceForAppSpec()
// that runs at the Register step (which uses the backend-canonicalized spec).
// Here we give the user an instant, best-effort estimate while they edit
// resources / instances, clearly labelled as an estimate in the UI.
export function usePriceEstimate(options = {}) {
  const debounceMs = options.debounceMs ?? 600

  const estimate = ref(null) // { usd, flux, fluxDiscount } | null
  const estimating = ref(false)
  const estimateError = ref(false)

  let timer = null
  let requestId = 0

  function requestEstimate(specGetter, opts = {}) {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      const raw = specGetter()

      // Skip while the spec is obviously incomplete (avoids noisy 4xx from
      // the price endpoint before the user has entered an image/resources).
      if (!isSpecPriceable(raw)) {
        estimate.value = null
        estimateError.value = false
        estimating.value = false

        return
      }

      const currentRequest = ++requestId
      estimating.value = true
      estimateError.value = false

      try {
        let payload = normalizeForPricing(raw)

        // Enterprise apps are priced from the encrypted spec (the backend holds
        // the private key and decrypts it), so mirror what the cost calculator
        // does. If encryption isn't possible, fall back to the public estimate.
        if (opts.enterprise && isWebCryptoAvailable()) {
          try {
            payload = await encryptForEnterprisePricing(payload)
          } catch (encryptError) {
            // Keep the public-price fallback rather than failing the estimate.
          }
        }

        const res = await AppsService.appPriceUSDandFlux(payload)

        // Ignore stale responses if a newer request started meanwhile
        if (currentRequest !== requestId) return

        if (res.data?.status !== 'error' && res.data?.data) {
          estimate.value = res.data.data
          estimateError.value = false
        } else {
          estimate.value = null
          estimateError.value = true
        }
      } catch (error) {
        if (currentRequest !== requestId) return
        estimate.value = null
        estimateError.value = true
      } finally {
        if (currentRequest === requestId) estimating.value = false
      }
    }, debounceMs)
  }

  function cancelEstimate() {
    clearTimeout(timer)

    // Invalidate any in-flight response
    requestId++
    estimating.value = false
  }

  return { estimate, estimating, estimateError, requestEstimate, cancelEstimate }
}

// A spec is "priceable" once every component has an image and positive resources.
function isSpecPriceable(spec) {
  if (!spec) return false

  const components = spec.compose || (spec.repotag ? [spec] : [])
  if (!components.length) return false

  return components.every(c =>
    c
    && typeof c.repotag === 'string'
    && c.repotag.trim().length > 0
    && Number(c.cpu) > 0
    && Number(c.ram) > 0
    && Number(c.hdd) > 0)
}

// Build a complete, backend-acceptable pricing payload from a possibly-partial
// working spec — mirroring the shape the public cost-calculator posts. Fields
// the user hasn't filled in yet get harmless placeholders; the resource values
// that actually drive the price (cpu/ram/hdd/instances/expire) are theirs.
function normalizeForPricing(spec) {
  const s = cloneDeep(spec)
  const components = s.compose || []

  return {
    version: s.version || 8,
    name: s.name || 'app',
    description: s.description || 'app',
    owner: s.owner || PLACEHOLDER_OWNER,
    compose: components.map((c, i) => ({
      name: c.name || `component${i + 1}`,
      description: c.description || 'component',
      repotag: c.repotag,
      ports: c.ports?.length ? c.ports : [3000],
      domains: c.domains?.length ? c.domains : [''],
      environmentParameters: c.environmentParameters?.length ? c.environmentParameters : [''],
      commands: c.commands?.length ? c.commands : [''],
      containerPorts: c.containerPorts?.length ? c.containerPorts : [3000],
      containerData: c.containerData || '/tmp',
      cpu: String(c.cpu ?? 0.1),
      ram: String(c.ram ?? 1000),
      hdd: String(c.hdd ?? 1),
      tiered: false,
    })),
    instances: s.instances ?? 3,
    nodes: s.nodes || [],
    contacts: s.contacts?.length ? s.contacts : [''],
    geolocation: s.geolocation?.length ? s.geolocation : [''],
    expire: s.expire || 88000,
    enterprise: s.enterprise || '',
    staticip: s.staticip || false,
  }
}

// Encrypt compose + contacts into the `enterprise` field, exactly like the
// cost calculator and the real registration flow, so the backend prices the
// app as Enterprise. The backend decrypts the blob with the private key that
// matches the (name, owner) it issued the public key for — so the payload's
// name/owner MUST equal the ones used to fetch the key, otherwise it fails with
// "Error decrypting AES key". These are placeholders; only the resources inside
// the encrypted blob affect the price.
const PRICING_NAME = 'costcalc'

async function encryptForEnterprisePricing(payload) {
  if (!cachedPubKey) {
    const zelidauth = localStorage.getItem('zelidauth')
    const res = await AppsService.getAppPublicKey(zelidauth, { name: PRICING_NAME, owner: PLACEHOLDER_OWNER })
    if (res.data?.status !== 'success' || !res.data?.data) {
      throw new Error('Failed to get pricing public key')
    }
    cachedPubKey = String(res.data.data).trim().replace(/\s+/g, '')
  }

  const rsaPubKey = await importRsaPublicKey(cachedPubKey)
  const aesKey = crypto.getRandomValues(new Uint8Array(32))
  const encryptedAesKey = await encryptAesKeyWithRsaKey(aesKey, rsaPubKey)
  const enterpriseSpecs = { contacts: payload.contacts, compose: payload.compose }
  const enterpriseValue = await encryptEnterpriseWithAes(
    JSON.stringify(enterpriseSpecs),
    aesKey,
    encryptedAesKey,
  )

  return {
    ...payload,
    name: PRICING_NAME,
    owner: PLACEHOLDER_OWNER,
    compose: [],
    contacts: [''],
    enterprise: enterpriseValue,
  }
}
