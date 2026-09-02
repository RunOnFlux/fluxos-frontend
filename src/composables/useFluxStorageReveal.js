import { ref } from 'vue'
import AppsService from '@/services/AppsService'
import {
  isWebCryptoAvailable,
  importRsaPublicKey,
  encryptAesKeyWithRsaKey,
  decryptEnterpriseWithAes,
} from '@/utils/enterpriseCrypto'

// Flux Storage marker prefixes (mirror of the FluxOS backend fluxStorageResolver).
export const STORAGE_MARKERS = {
  environmentParameters: 'F_S_ENV=',
  commands: 'F_S_CMD=',
  contacts: 'F_S_CONTACTS=',
}

// True when an array field carries a Flux Storage link for the given marker.
export function hasStorageMarker(values, marker) {
  return Array.isArray(values) && values.some(v => typeof v === 'string' && v.startsWith(marker))
}

/**
 * On-demand resolution of F_S_ storage links. Keeps the default view showing the raw links;
 * only when the owner (or Flux support) clicks reveal do we ask the backend for the real
 * values. Enterprise apps go through the encrypted channel (values never travel in clear);
 * non-enterprise apps get an owner-authenticated cleartext response.
 */
export function useFluxStorageReveal() {
  const revealing = ref(false)

  async function fetchResolvedEnterprise(appName, { local = false, executeLocalCommand = null } = {}) {
    const ownerRes = await AppsService.getAppOriginalOwner(appName)
    const { status: ownerStatus, data: originalOwner } = ownerRes.data
    if (ownerStatus !== 'success') throw new Error('Unable to get app owner')

    const zelidauth = localStorage.getItem('zelidauth')
    const pubkeyRes = await AppsService.getAppPublicKey(zelidauth, { name: appName, owner: originalOwner })
    const { status: pubkeyStatus, data: pubkey } = pubkeyRes.data
    if (pubkeyStatus !== 'success') throw new Error('Unable to get encryption pubkey')

    if (!isWebCryptoAvailable()) {
      throw new Error('Enterprise features require HTTPS or localhost.')
    }

    const rsaPubKey = await importRsaPublicKey(pubkey)
    const aesKey = crypto.getRandomValues(new Uint8Array(32))
    const encryptedEnterpriseKey = await encryptAesKeyWithRsaKey(aesKey, rsaPubKey)

    const endpoint = `/apps/appspecifications/${appName}/true?resolvestorage=true`
    const axiosConfig = { headers: { zelidauth, 'enterprise-key': encryptedEnterpriseKey } }

    const encryptedRes = local && executeLocalCommand
      ? await executeLocalCommand(endpoint, null, axiosConfig)
      : await AppsService.getAppEncryptedSpecifics(appName, zelidauth, encryptedEnterpriseKey, true)

    const { status, data: specs } = encryptedRes.data
    if (status !== 'success') throw new Error('Unable to get encrypted app data')

    const decrypted = await decryptEnterpriseWithAes(specs.enterprise, aesKey)
    if (!decrypted) throw new Error('Unable to decrypt app specs')

    return JSON.parse(decrypted)
  }

  async function fetchResolvedPlain(appName) {
    const zelidauth = localStorage.getItem('zelidauth')
    const res = await AppsService.getAppResolvedSpecifics(appName, zelidauth)
    const { status, data } = res.data
    if (status !== 'success') {
      throw new Error(data?.message || 'Unable to resolve storage values')
    }

    return data
  }

  /**
   * Returns the full resolved spec object (raw fields untouched, plus `<field>Resolved`
   * status objects). Throws on auth/transport failure.
   */
  async function fetchResolvedSpec({ appName, isEnterprise, local = false, executeLocalCommand = null }) {
    revealing.value = true
    try {
      return isEnterprise
        ? await fetchResolvedEnterprise(appName, { local, executeLocalCommand })
        : await fetchResolvedPlain(appName)
    } finally {
      revealing.value = false
    }
  }

  /**
   * Pulls a single `<field>Resolved` object out of a resolved spec. Pass a componentName to
   * read from spec.compose[]; omit it for top-level fields (e.g. contacts).
   */
  function extractField(resolvedSpec, { componentName = null, resolvedKey }) {
    if (!resolvedSpec) return null
    if (componentName && Array.isArray(resolvedSpec.compose)) {
      const component = resolvedSpec.compose.find(c => c.name === componentName)

      return component ? component[resolvedKey] || null : null
    }

    return resolvedSpec[resolvedKey] || null
  }

  return { revealing, fetchResolvedSpec, extractField }
}
