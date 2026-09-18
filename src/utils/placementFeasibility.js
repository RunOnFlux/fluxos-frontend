import AppsService from '@/services/AppsService'

/**
 * FluxOS's own answer to "can this selection ever hold the instance count?".
 *
 * The network refuses a registration, and an update that changes placement, when it can
 * prove the geolocation holds fewer nodes than the instance count.
 * POST /apps/placementfeasibility is that same computation, offered before signing.
 *
 * It reads the node's own IP location table, not the stats aggregate the geolocation
 * picker counts with, so the two can disagree about where a node is - a US state pin is
 * the usual case. When they do, this is the one the registration obeys.
 *
 * The endpoint counts geography only. Tier, hardware and free room are deliberately not
 * filters on the node's side, so this never answers "is there space right now?".
 */

// The registration validator caps the array at 10, and so does the endpoint.
const MAX_GEOLOCATION_ENTRIES = 10

/**
 * Whether FluxOS would refuse to register this selection, given the endpoint's answer.
 *
 * The endpoint reports 'impossible' more often than the registration gate refuses. A
 * geolocation that resolves to NO node at all is let through, because the node cannot
 * tell a real miss from its table mis-attributing the place, unless every allowed entry
 * is a region pin the table itself resolves (then the installer reads the same table and
 * the miss is proof). Mirrors checkPlacementFeasibility in fluxosdev
 * (ZelBack/src/services/appPlacement/placementFeasibility.js), so we never block a
 * registration the network would take.
 * @param {object} result The endpoint's data object
 * @param {string[]} geolocation The spec strings that were evaluated
 * @returns {boolean}
 */
export function wouldRefuseRegistration(result, geolocation) {
  if (!result || result.category !== 'impossible') return false

  const entries = geolocation ?? []
  if (entries.length === 0 || result.candidateCount > 0) return true

  const coarsened = new Set(result.coarsenedEntries ?? [])
  const allows = entries.filter(entry => typeof entry === 'string' && entry.startsWith('ac'))

  return allows.length > 0 && allows.every(entry => {
    const parts = entry.slice(2).split('_')

    return parts.length >= 3 && parts[2] !== 'ALL' && parts[2] !== 'NONE' && !coarsened.has(entry)
  })
}

/**
 * The placement-relevant sizing of a spec: the fields that decide how many nodes could
 * hold it. Mirrors placementShape in fluxosdev, and is compared between an update and
 * the spec it replaces - an update that touches none of it (an expire-only renewal, a
 * cancellation, a description edit) is never gated by the network, so it must never be
 * gated here either.
 * @param {object} spec App specifications
 * @returns {string} A comparable digest
 */
export function placementShape(spec) {
  if (!spec) return ''

  const components = spec.version <= 3
    ? [{ cpu: spec.cpu, ram: spec.ram, hdd: spec.hdd, tiered: spec.tiered }]
    : (spec.compose ?? []).map(c => ({ cpu: c.cpu, ram: c.ram, hdd: c.hdd, tiered: c.tiered }))

  return JSON.stringify({
    instances: spec.instances ?? null,
    geolocation: [...(spec.geolocation ?? [])].sort(),
    components,
  })
}

/**
 * Whether a change touches anything placement depends on.
 * @param {object} next The spec about to be registered
 * @param {object} previous The spec it replaces, when there is one
 * @returns {boolean}
 */
export function changesPlacement(next, previous) {
  if (!previous) return true

  // An enterprise spec is stored with its compose stripped; a previous spec that arrived
  // in that form is not comparable, and reading the difference as a placement change
  // would gate exactly the renewals and cancellations this exists to let through.
  const strippedPrevious = previous.version >= 8
    && (previous.compose ?? []).length === 0
    && (next.compose ?? []).length > 0

  if (strippedPrevious) return false

  return placementShape(next) !== placementShape(previous)
}

/**
 * Ask FluxOS whether a spec's locations can hold its instance count.
 *
 * Returns null whenever there is no answer to act on: not signed in, the node's location
 * table not loaded yet (503), a rejected session, an input the endpoint will not take, a
 * network failure. Same posture as the registration gate itself, which lets a spec
 * through when it cannot compute - without the computation there is no proof, and only
 * proven impossibility may refuse.
 *
 * A spec that names its own nodes is answered without the network. The endpoint takes no
 * `nodes` list and would count the whole network for an app that may only ever use the
 * machines it names; the network's own rule for those is arithmetic this side can do
 * exactly - naming fewer machines than instances can never reach the instance count, and
 * no wait fixes it. Naming enough of them is never refused, even when some are missing
 * from the confirmed list right now, so nothing else about a pinned spec is judged here.
 *
 * The answer carries `reason`, because the two refusals send the owner to different
 * screens: 'geolocation' is a selection to widen, 'pinnedNodes' is a list to add to.
 *
 * @param {object} spec App specifications (geolocation, instances, compose, nodes)
 * @returns {Promise<object|null>} The advice, plus `refused`, or null when unanswerable
 */
export async function checkPlacement(spec) {
  if (!spec) return null

  const instances = Number(spec.instances)
  if (!Number.isInteger(instances) || instances < 1) return null

  const pinned = spec.nodes ?? []
  if (pinned.length > 0) {
    return pinned.length < instances
      ? { refused: true, reason: 'pinnedNodes', candidateCount: pinned.length, instances }
      : null
  }

  const geolocation = spec.geolocation ?? []
  if (geolocation.length === 0 || geolocation.length > MAX_GEOLOCATION_ENTRIES) return null

  try {
    // Inside the try on purpose: reading localStorage throws outright when site data is
    // blocked, and an advisory check may not be what takes the screen down with it.
    const zelidauth = localStorage.getItem('zelidauth')
    if (!zelidauth) return null

    // containerData is what tells the node whether the app is synced, and a spec sent
    // without it is treated as synced - which would raise the diversity warning on apps
    // that never share anything.
    const compose = spec.version <= 3
      ? undefined
      : (spec.compose ?? []).map(c => ({ containerData: c.containerData ?? '' }))

    const payload = { geolocation, instances }
    if (compose) payload.compose = compose
    else payload.containerData = spec.containerData ?? ''

    const { data } = await AppsService.placementFeasibility(zelidauth, payload)
    if (data?.status !== 'success' || !data.data) return null

    return {
      ...data.data,
      reason: 'geolocation',
      refused: wouldRefuseRegistration(data.data, geolocation),
    }
  } catch {
    // A 503 (no location table yet), an expired session, a timeout: all of them mean
    // the same thing here, and none of them may hold up a registration.
    return null
  }
}
