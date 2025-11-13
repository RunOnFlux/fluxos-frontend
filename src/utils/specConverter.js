/**
 * Convert old app specifications to the latest version
 * Based on backend's updateToLatestAppSpecifications function
 *
 * USAGE:
 *   import { convertToLatestVersion, getAndConvertSpec } from '@/utils/specConverter'
 *
 *   // Client-side conversion (no API call):
 *   const convertedSpec = convertToLatestVersion(v3Spec)
 *
 *   // Fetch and convert from backend (auto-detects backend URL):
 *   const spec = await getAndConvertSpec('myapp')
 *
 *   // Or specify custom backend:
 *   const spec = await getAndConvertSpec('myapp', 'https://custom-backend.com')
 *
 * VERSION FIELD MAPPING (handling typos and type differences):
 *
 * V1-V3 → V8:
 *   - enviromentParameters (typo) → environmentParameters (correct)
 *   - V1: port (single) → ports (array), containerPort (single) → containerPorts (array)
 *   - V2-V3: ports/containerPorts (array of strings) → (array of numbers) - MUST convert to numbers for V8
 *   - V3: instances (number) → instances (number) [same]
 *
 * V4-V7 → V8:
 *   - environmentParameters (correct) → environmentParameters (correct)
 *   - compose array exists → compose array exists
 *   - V7: nodes, staticip, secrets, repoauth → V8: nodes[], staticip, repoauth (no secrets)
 *
 * V8 Latest Fields:
 *   Root: version, name, description, owner, contacts, geolocation, expire, nodes, staticip, enterprise, instances, compose
 *   Component: name, description, repotag, ports, containerPorts, environmentParameters, commands, containerData, domains, repoauth, cpu, ram, hdd
 *
 * FORK-AWARE DEFAULTS:
 *   - Fork block height: 2,020,000 (chain became 4x faster after this block)
 *   - Pre-fork default expire: 22,000 blocks (~1 month at 2 min/block)
 *   - Post-fork default expire: 88,000 blocks (~1 month at 0.5 min/block)
 *   - All conversions use fork-aware defaults based on app registration height
 *
 * NOTE: When a new version is released (V9, V10, etc.), update:
 * 1. LATEST_SPEC_VERSION constant below
 * 2. Add new convertVxToLatest function for the new version
 * 3. Update convertToLatestVersion switch statement
 * 4. Update VERSION FIELD MAPPING above
 */

// Import backend detection
import { getDetectedBackendURL } from '@/utils/backend'

// Fallback API URL when backend detection fails
const FALLBACK_API_URL = 'https://api.runonflux.io'

// Current latest version - UPDATE THIS when new versions are released
export const LATEST_SPEC_VERSION = 8

// Fork block height - chain became 4x faster after this block
const FORK_BLOCK_HEIGHT = 2020000

/**
 * Get fork-aware default expire value based on registration height
 * @param {number} height - Block height when app was registered
 * @returns {number} Default expire value (22000 pre-fork, 88000 post-fork)
 */
function getDefaultExpire(height) {
  return height >= FORK_BLOCK_HEIGHT ? 88000 : 22000
}

/**
 * Convert V1 spec to latest version
 */
function convertV1ToLatest(appSpec) {
  const component = {
    name: appSpec.name,
    description: appSpec.description,
    repotag: appSpec.repotag,
    ports: [appSpec.port],
    containerPorts: [appSpec.containerPort],
    environmentParameters: appSpec.enviromentParameters || [],
    commands: appSpec.commands || [],
    containerData: appSpec.containerData,
    cpu: appSpec.cpu || 0,
    ram: appSpec.ram || 0,
    hdd: appSpec.hdd || 0,
    repoauth: '',
  }

  return {
    version: LATEST_SPEC_VERSION,
    name: appSpec.name,
    description: appSpec.description,
    contacts: [],
    expire: getDefaultExpire(appSpec.height),
    geolocation: [],
    instances: 3,
    nodes: [],
    owner: appSpec.owner,
    staticip: false,
    compose: [component],
    enterprise: '',
    hash: appSpec.hash,
    height: appSpec.height,
  }
}

/**
 * Convert V2 spec to latest version
 */
function convertV2ToLatest(appSpec) {
  const component = {
    name: appSpec.name,
    description: appSpec.description,
    repotag: appSpec.repotag,
    ports: (appSpec.ports || []).map(p => typeof p === 'string' ? parseInt(p, 10) : p),
    containerPorts: (appSpec.containerPorts || []).map(p => typeof p === 'string' ? parseInt(p, 10) : p),
    environmentParameters: appSpec.enviromentParameters,
    commands: appSpec.commands,
    domains: appSpec.domains,
    containerData: appSpec.containerData,
    cpu: appSpec.cpu || 0,
    ram: appSpec.ram || 0,
    hdd: appSpec.hdd || 0,
    repoauth: '',
  }

  return {
    version: LATEST_SPEC_VERSION,
    name: appSpec.name,
    description: appSpec.description,
    contacts: [],
    expire: getDefaultExpire(appSpec.height),
    geolocation: [],
    instances: 3,
    nodes: [],
    owner: appSpec.owner,
    staticip: false,
    compose: [component],
    enterprise: '',
    hash: appSpec.hash,
    height: appSpec.height,
  }
}

/**
 * Convert V3 spec to latest version
 */
function convertV3ToLatest(appSpec) {
  const component = {
    name: appSpec.name,
    description: appSpec.description,
    repotag: appSpec.repotag,
    ports: (appSpec.ports || []).map(p => typeof p === 'string' ? parseInt(p, 10) : p),
    containerPorts: (appSpec.containerPorts || []).map(p => typeof p === 'string' ? parseInt(p, 10) : p),
    environmentParameters: appSpec.enviromentParameters,
    commands: appSpec.commands,
    domains: appSpec.domains,
    containerData: appSpec.containerData,
    cpu: appSpec.cpu || 0,
    ram: appSpec.ram || 0,
    hdd: appSpec.hdd || 0,
    repoauth: '',
  }

  return {
    version: LATEST_SPEC_VERSION,
    name: appSpec.name,
    description: appSpec.description,
    contacts: [],
    expire: getDefaultExpire(appSpec.height),
    geolocation: [],
    instances: appSpec.instances || 3,
    nodes: [],
    owner: appSpec.owner,
    staticip: false,
    compose: [component],
    enterprise: '',
    hash: appSpec.hash,
    height: appSpec.height,
  }
}

/**
 * Convert V4 spec to latest version
 */
function convertV4ToLatest(appSpec) {
  const components = appSpec.compose.map(component => ({
    name: component.name,
    description: component.description,
    repotag: component.repotag,
    ports: component.ports,
    containerPorts: component.containerPorts,
    environmentParameters: component.environmentParameters,
    commands: component.commands,
    domains: component.domains,
    containerData: component.containerData,
    cpu: component.cpu || 0,
    ram: component.ram || 0,
    hdd: component.hdd || 0,
    repoauth: '',
  }))

  return {
    version: LATEST_SPEC_VERSION,
    name: appSpec.name,
    description: appSpec.description,
    contacts: [],
    expire: getDefaultExpire(appSpec.height),
    geolocation: [],
    instances: appSpec.instances || 3,
    nodes: [],
    staticip: false,
    enterprise: '',
    compose: components,
    hash: appSpec.hash,
    height: appSpec.height,
  }
}

/**
 * Convert V5 spec to latest version
 */
function convertV5ToLatest(appSpec) {
  const components = appSpec.compose.map(component => ({
    name: component.name,
    description: component.description,
    repotag: component.repotag,
    ports: component.ports,
    containerPorts: component.containerPorts,
    environmentParameters: component.environmentParameters,
    commands: component.commands,
    domains: component.domains,
    containerData: component.containerData,
    cpu: component.cpu || 0,
    ram: component.ram || 0,
    hdd: component.hdd || 0,
    repoauth: '',
  }))

  return {
    version: LATEST_SPEC_VERSION,
    name: appSpec.name,
    description: appSpec.description,
    contacts: appSpec.contacts || [],
    expire: getDefaultExpire(appSpec.height),
    geolocation: appSpec.geolocation || [],
    instances: appSpec.instances || 3,
    nodes: [],
    staticip: false,
    enterprise: '',
    compose: components,
    hash: appSpec.hash,
    height: appSpec.height,
  }
}

/**
 * Convert V6 spec to latest version
 */
function convertV6ToLatest(appSpec) {
  const components = appSpec.compose.map(component => ({
    name: component.name,
    description: component.description,
    repotag: component.repotag,
    ports: component.ports,
    containerPorts: component.containerPorts,
    environmentParameters: component.environmentParameters,
    commands: component.commands,
    domains: component.domains,
    containerData: component.containerData,
    cpu: component.cpu || 0,
    ram: component.ram || 0,
    hdd: component.hdd || 0,
    repoauth: '',
  }))

  return {
    version: LATEST_SPEC_VERSION,
    name: appSpec.name,
    description: appSpec.description,
    contacts: appSpec.contacts || [],
    expire: appSpec.expire || getDefaultExpire(appSpec.height),
    geolocation: appSpec.geolocation || [],
    instances: appSpec.instances || 3,
    nodes: [],
    staticip: false,
    enterprise: '',
    compose: components,
    hash: appSpec.hash,
    height: appSpec.height,
  }
}

/**
 * Convert V7 spec to latest version
 */
function convertV7ToLatest(appSpec) {
  const components = appSpec.compose.map(component => ({
    name: component.name,
    description: component.description,
    repotag: component.repotag,
    ports: component.ports,
    containerPorts: component.containerPorts,
    environmentParameters: component.environmentParameters,
    commands: component.commands,
    domains: component.domains,
    containerData: component.containerData,
    cpu: component.cpu || 0,
    ram: component.ram || 0,
    hdd: component.hdd || 0,
    repoauth: component.repoauth || '',
  }))

  return {
    version: LATEST_SPEC_VERSION,
    name: appSpec.name,
    description: appSpec.description,
    contacts: appSpec.contacts || [],
    expire: appSpec.expire || getDefaultExpire(appSpec.height),
    geolocation: appSpec.geolocation || [],
    instances: appSpec.instances || 3,
    nodes: [], // V7 nodes are not migrated (used for different purpose)
    staticip: appSpec.staticip || false,
    enterprise: '',
    compose: components,
    hash: appSpec.hash,
    height: appSpec.height,
  }
}

/**
 * Main conversion function - converts any version to latest version
 * @param {object} appSpec - App specification (any version)
 * @returns {object} Latest version app specification
 */
export function convertToLatestVersion(appSpec) {
  if (!appSpec || !appSpec.version) {
    throw new Error('Invalid app specification')
  }

  switch (appSpec.version) {
  case 1:
    return convertV1ToLatest(appSpec)
  case 2:
    return convertV2ToLatest(appSpec)
  case 3:
    return convertV3ToLatest(appSpec)
  case 4:
    return convertV4ToLatest(appSpec)
  case 5:
    return convertV5ToLatest(appSpec)
  case 6:
    return convertV6ToLatest(appSpec)
  case 7:
    return convertV7ToLatest(appSpec)
  case 8:
    // Already latest version, return as-is
    return { ...appSpec }
  default:
    // For versions > LATEST_SPEC_VERSION, return as-is (future-proofing)
    if (appSpec.version > LATEST_SPEC_VERSION) {
      console.warn(`App version ${appSpec.version} is newer than supported version ${LATEST_SPEC_VERSION}. Returning as-is.`)
      
      return { ...appSpec }
    }
    throw new Error(`Unsupported app specification version: ${appSpec.version}`)
  }
}

/**
 * Fetch app spec from permanent messages (for expired apps)
 * @param {string} appName - Application name
 * @param {string} apiUrl - Optional API base URL (auto-detects if not provided, falls back to hardcoded URL)
 * @returns {Promise<object|null>} Latest app specification or null if not found
 */
export async function getSpecFromPermanentMessages(appName, apiUrl = null) {
  try {
    // Auto-detect backend if not provided, with fallback to hardcoded URL
    let backendURL = apiUrl
    if (!backendURL) {
      try {
        backendURL = await getDetectedBackendURL()
        if (!backendURL) {
          console.warn('Backend detection returned empty, using fallback URL')
          backendURL = FALLBACK_API_URL
        }
      } catch (error) {
        console.warn('Failed to detect backend, using fallback URL:', error)
        backendURL = FALLBACK_API_URL
      }
    }

    const response = await fetch(`${backendURL}/apps/permanentmessages?appname=${appName}`)
    const result = await response.json()

    if (result.status !== 'success' || !result.data || result.data.length === 0) {
      return null
    }

    // Get all messages for this app
    const messages = result.data

    // Sort by height (newest first)
    messages.sort((a, b) => b.height - a.height)

    // Return the latest message's appSpecifications
    return messages[0].appSpecifications
  } catch (error) {
    console.error('Error fetching from permanent messages:', error)

    return null
  }
}

/**
 * Get app spec and convert to latest version (checks active apps first, then permanent messages)
 * @param {string} appName - Application name
 * @param {string} apiUrl - Optional API base URL (auto-detects if not provided, falls back to hardcoded URL)
 * @returns {Promise<object|null>} Latest version app specification or null if not found
 */
export async function getAndConvertSpec(appName, apiUrl = null) {
  try {
    // Auto-detect backend if not provided, with fallback to hardcoded URL
    let backendURL = apiUrl
    if (!backendURL) {
      try {
        backendURL = await getDetectedBackendURL()
        if (!backendURL) {
          console.warn('Backend detection returned empty, using fallback URL')
          backendURL = FALLBACK_API_URL
        }
      } catch (error) {
        console.warn('Failed to detect backend, using fallback URL:', error)
        backendURL = FALLBACK_API_URL
      }
    }

    // Try to get from active apps first
    const activeResponse = await fetch(`${backendURL}/apps/globalappsspecifications?appname=${appName}`)
    const activeResult = await activeResponse.json()

    if (activeResult.status === 'success' && activeResult.data && activeResult.data.length > 0) {
      const spec = activeResult.data[0]

      return convertToLatestVersion(spec)
    }

    // If not found in active apps, try permanent messages (expired apps)
    const permanentSpec = await getSpecFromPermanentMessages(appName, backendURL)

    if (!permanentSpec) {
      return null
    }

    return convertToLatestVersion(permanentSpec)
  } catch (error) {
    console.error('Error getting and converting spec:', error)

    return null
  }
}
