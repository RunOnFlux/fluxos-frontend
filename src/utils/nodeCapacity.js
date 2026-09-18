/**
 * Can the chosen locations actually RUN this app?
 *
 * A different question from the one /apps/placementfeasibility answers, and the two
 * must not be confused. The network's placement gate counts geography and nothing else,
 * on purpose: a tier is a collateral class rather than a hardware guarantee, so a node
 * whose hardware exceeds its tier's nominal figure accepts apps any tier arithmetic
 * would have ruled out, and no bound the network can compute is a proof of unfitness.
 * Install time enforces the hardware.
 *
 * Which leaves the whole of it unanswered before payment. Japan carries 44 nodes behind
 * 10 public IPs; for a 24 GB app, 4 of those IPs hold a node big enough and none of them
 * has the room free right now. Every count on the registration form says 44, the
 * placement endpoint says the geography is fine, and the app is paid for and never
 * placed. This module is the missing half: node hardware, what is already running on it,
 * and the fact that FluxOS places one instance per public IP.
 *
 * It is advisory and it says so - the network accepts these registrations, capacity
 * frees up, and the aggregate it reads can be half an hour old. So it warns, and never
 * blocks. Refusals belong to placementFeasibility.js, which has a proof.
 */

/**
 * Resources reserved for the node OS/FluxOS - an app can only use what is left.
 * Mirrors `config.lockedSystemResources` in FluxOS: cpu 10 (tenths of a core),
 * ram 2000 MB, hdd 60 plus extrahdd 20.
 */
export const OS_RESERVE = { cores: 1, ram: 2, ssd: 80 }

/**
 * FluxOS only ever offers 95% of a node's disk to apps before subtracting the reserve
 * (`totalSpaceOnNode * 0.95 - hdd - extrahdd` in checkAppHWRequirements).
 */
const DISK_USABLE_FACTOR = 0.95

/**
 * Spare unique IPs a selection should have BEYOND the instance count before it is
 * comfortable. Matching the instance count exactly is not enough: the moment one of
 * those nodes fills up with somebody else's app, an instance has nowhere to go.
 */
export const IP_HEADROOM = 1

const STATS_URL = 'https://stats.runonflux.io/fluxinfo'

// Nested projections keep this to a fraction of the whole-document payload. The
// registration form's own picker asks the same endpoint for `geo` alone, which is
// exactly why it can only ever count nodes rather than judge them.
const STATS_PROJECTION = [
  'flux.ip',
  'flux.arcaneVersion',
  'geolocation.continentCode',
  'geolocation.countryCode',
  'geolocation.regionName',
  'apps.resources',
  'apps.fluxusage.nodeSpecs',
].join(',')

const NODE_CACHE_KEY = 'fluxNodeCapacityCache.v1'
const NODE_CACHE_TTL_MS = 10 * 60 * 1000

// A sanity floor: the network is thousands of nodes, so a short answer means the stats
// endpoint is degraded, and counting it would produce a false alarm.
const MIN_PLAUSIBLE_NODES = 5000

/**
 * Normalized node list from the Flux stats API, cached per tab for 10 minutes: the
 * payload is megabytes.
 *
 * A node missing either its specs or its resource reading is dropped rather than guessed
 * at - counting it would overstate capacity, which is the direction that costs someone
 * an app that never places.
 *
 * @returns {Promise<Array<object>>} Empty when the list cannot be trusted
 */
export async function fetchFluxNodes() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(NODE_CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.at < NODE_CACHE_TTL_MS && Array.isArray(cached.nodes)) {
      return cached.nodes
    }
  } catch { /* unreadable cache - refetch */ }

  let result
  try {
    const response = await fetch(`${STATS_URL}?projection=${STATS_PROJECTION}`)

    result = await response.json()
  } catch {
    return []
  }

  if (result?.status !== 'success' || !Array.isArray(result.data) || result.data.length < MIN_PLAUSIBLE_NODES) {
    return []
  }

  const nodes = []

  result.data.forEach(entry => {
    const geo = entry?.geolocation
    if (!geo?.continentCode || !geo?.countryCode) return

    const specs = entry?.apps?.fluxusage?.nodeSpecs
    const used = entry?.apps?.resources
    if (!specs?.cpuCores || !used || typeof used.appsCpusLocked !== 'number') return

    const rawIp = entry?.flux?.ip || ''

    nodes.push({
      cont: geo.continentCode,
      country: geo.countryCode,

      // Matched verbatim by FluxOS as the third geolocation level.
      region: geo.regionName || '',
      ip: rawIp.split(':')[0],
      cores: specs.cpuCores,

      // nodeSpecs.ram is MB and app specs are MB too. Divide by 1000, not 1024, so this
      // stays in the units the compose values are expressed in.
      ram: specs.ram / 1000,
      ssd: specs.ssdStorage || 0,
      arcane: !!entry?.flux?.arcaneVersion,
      used: {
        cpu: used.appsCpusLocked || 0,
        ramGB: (used.appsRamLocked || 0) / 1000,
        hddGB: used.appsHddLocked || 0,
      },
    })
  })

  try {
    sessionStorage.setItem(NODE_CACHE_KEY, JSON.stringify({ at: Date.now(), nodes }))
  } catch { /* quota - fine, we refetch next time */ }

  return nodes
}

/**
 * Per-node hardware an app needs = the sum of every compose component (ram MB -> GB).
 * @param {Array<object>} compose Compose components
 * @returns {{cpu: number, ramGB: number, hddGB: number}}
 */
export function appHardware(compose) {
  let cpu = 0
  let ramMb = 0
  let hdd = 0

  ;(compose || []).forEach(c => {
    cpu += Number(c.cpu) || 0
    ramMb += Number(c.ram) || 0
    hdd += Number(c.hdd) || 0
  })

  return { cpu, ramGB: ramMb / 1000, hddGB: hdd }
}

/** What a node can offer apps in total, before anything is placed on it. */
function totalForApps(node) {
  return {
    cpu: node.cores - OS_RESERVE.cores,
    ramGB: node.ram - OS_RESERVE.ram,
    hddGB: node.ssd * DISK_USABLE_FACTOR - OS_RESERVE.ssd,
  }
}

/**
 * Whether a node is big enough to host the app at all, ignoring what is already on it.
 * @param {object} node A normalized node
 * @param {{cpu: number, ramGB: number, hddGB: number}} hw
 * @param {boolean} [isEnterprise] Enterprise apps only run on Arcane nodes
 * @returns {boolean}
 */
export function nodeFitsApp(node, hw, isEnterprise = false) {
  if (isEnterprise && !node.arcane) return false

  const total = totalForApps(node)

  return total.cpu >= hw.cpu && total.ramGB >= hw.ramGB && total.hddGB >= hw.hddGB
}

/**
 * Whether a node still has room for the app on top of what it already runs.
 *
 * Only CPU, RAM and disk. FluxOS additionally reserves CPU burst headroom for
 * enterprise apps, which is deliberately not modelled: this number is advisory, and
 * these three are the ones an owner can reason about.
 * @param {object} node A normalized node
 * @param {{cpu: number, ramGB: number, hddGB: number}} hw
 * @param {boolean} [isEnterprise]
 * @returns {boolean}
 */
export function nodeHasRoom(node, hw, isEnterprise = false) {
  if (isEnterprise && !node.arcane) return false

  // No reading means no opinion, and "no opinion" must never read as "free": every
  // caller turns this into something someone acts on.
  if (!node.used) return false

  const total = totalForApps(node)

  return (total.cpu - node.used.cpu) >= hw.cpu
    && (total.ramGB - node.used.ramGB) >= hw.ramGB
    && (total.hddGB - node.used.hddGB) >= hw.hddGB
}

/**
 * Does a node satisfy one geolocation entry? FluxOS encodes allowed locations as
 * `ac<CONT>[_<COUNTRY>[_<REGION>]]` and forbidden ones as `a!c<CONT>[_...]`.
 * @param {object} node A normalized node
 * @param {string} entry One geolocation spec string
 * @returns {{hit: boolean, negative: boolean}}
 */
function matchesGeoEntry(node, entry) {
  const negative = entry.startsWith('a!c')
  const code = entry.replace(/^a!?c/, '')
  const [cont, country, ...regionParts] = code.split('_')

  // Region names legitimately contain underscores, so rejoin everything past the country.
  const region = regionParts.join('_')

  let hit = node.cont === cont
  if (hit && country && country !== 'ALL') hit = node.country === country
  if (hit && region && region !== 'ALL') hit = node.region === region

  return { hit, negative }
}

/**
 * Nodes allowed by a spec's whole `geolocation` array. An empty array is anywhere.
 * @param {Array<object>} nodes Normalized nodes
 * @param {string[]} geolocation Spec strings
 * @returns {Array<object>}
 */
export function nodesInGeolocation(nodes, geolocation) {
  const entries = (geolocation || []).filter(e => typeof e === 'string' && e)
  if (!entries.length) return nodes

  const allow = entries.filter(e => !e.startsWith('a!c'))

  return nodes.filter(node => {
    for (const entry of entries) {
      const { hit, negative } = matchesGeoEntry(node, entry)
      if (hit && negative) return false
    }

    if (!allow.length) return true // only exclusions were set

    return allow.some(entry => matchesGeoEntry(node, entry).hit)
  })
}

/**
 * How much room the chosen locations leave for THIS app.
 *
 * `ipCount` is what matters for placement: FluxOS spreads instances across unique public
 * IPs, so several nodes behind one IP can only ever host one instance between them.
 * `freeIpCount` is the subset of those IPs with a node that can take the app right now.
 * @param {Array<object>} nodes Normalized nodes
 * @param {string[]} geolocation Spec strings
 * @param {{cpu: number, ramGB: number, hddGB: number}} hw
 * @param {boolean} [isEnterprise]
 * @returns {{nodeCount: number, ipCount: number, freeIpCount: number}}
 */
export function capacityForGeolocation(nodes, geolocation, hw, isEnterprise = false) {
  const fitting = nodesInGeolocation(nodes, geolocation)
    .filter(node => node.ip && nodeFitsApp(node, hw, isEnterprise))

  const ips = new Set()
  const freeIps = new Set()

  fitting.forEach(node => {
    ips.add(node.ip)
    if (nodeHasRoom(node, hw, isEnterprise)) freeIps.add(node.ip)
  })

  return { nodeCount: fitting.length, ipCount: ips.size, freeIpCount: freeIps.size }
}

/**
 * The one call a screen makes: how the chosen locations look for this app, or null when
 * there is nothing to say.
 *
 * Null covers "no locations chosen" - a worldwide app is never short - "the node list
 * could not be read", because a warning built on a failed fetch is a guess, and a spec
 * that names its own nodes, whose capacity is a question about those machines rather
 * than about a geography.
 *
 * `kind` is the worst thing true of the selection:
 *   'short' - fewer unique IPs with a node big enough than the app has instances. This
 *             does not resolve with time; nothing frees up that makes a node bigger.
 *   'full'  - big enough nodes, but not enough of them with room free right now.
 *   'tight' - enough room and no spare, so the first node to fill strands an instance.
 *
 * @param {object} args
 * @param {string[]} args.geolocation Spec strings
 * @param {{cpu: number, ramGB: number, hddGB: number}} args.hw Per-node hardware
 * @param {number} args.instances Instance count the spec will carry
 * @param {boolean} [args.isEnterprise]
 * @param {string[]} [args.nodes] The spec's pinned nodes, if any
 * @returns {Promise<{kind: string, nodeCount: number, ipCount: number,
 *   freeIpCount: number, instances: number}|null>}
 */
export async function assessCapacity({
  geolocation, hw, instances, isEnterprise = false, nodes: pinned = [],
}) {
  if ((pinned || []).length > 0) return null

  const entries = (geolocation || []).filter(e => typeof e === 'string' && e)
  if (!entries.length) return null

  const count = Number(instances)
  if (!Number.isInteger(count) || count < 1) return null
  if (!hw || !(hw.cpu > 0 || hw.ramGB > 0 || hw.hddGB > 0)) return null

  const nodes = await fetchFluxNodes()
  if (!nodes.length) return null

  const capacity = capacityForGeolocation(nodes, entries, hw, isEnterprise)

  let kind = null
  if (capacity.ipCount < count) kind = 'short'
  else if (capacity.freeIpCount < count) kind = 'full'
  else if (capacity.freeIpCount - count <= IP_HEADROOM) kind = 'tight'

  return kind ? { kind, ...capacity, instances: count } : null
}
