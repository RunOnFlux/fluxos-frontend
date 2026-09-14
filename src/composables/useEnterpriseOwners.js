import FluxService from '@/services/FluxService'
import { ref } from 'vue'

// Which app owners are allowed to pick priority/enterprise nodes.
//
// Read from the connected node rather than from GitHub. The node fetches the policy
// document every 6h, rejects it wholesale if the shape is wrong, and keeps its last
// valid copy - so it answers with something that has been checked. A raw GitHub fetch
// from the browser has none of that: an error page or a maintenance response parses
// into an empty owner set and every eligible owner silently loses the tab.
//
// It also means this composable does not need to know where policy lives. That
// location has already moved once (RunOnFlux/flux helpers/ -> fluxos-network-policy),
// and the helpers/ copy this used to read is queued for deletion.

// Module-level cache. It lives for the lifetime of the loaded app (the current
// page session) and is shared across every component/route. A full website
// refresh resets the module, which is the only thing that triggers a refetch.
const enterpriseOwners = ref(new Set())
const isLoaded = ref(false)
let fetchPromise = null

async function fetchEnterpriseOwners() {
  const response = await FluxService.getEnterpriseAppOwners()
  const payload = response?.data

  // FluxOS answers { status, data }, and reports failure in the body with a 200. A
  // non-success status or a non-array payload is thrown rather than coerced: the
  // caller keeps the previous set and retries, which beats quietly deciding that
  // nobody is an enterprise owner.
  if (payload?.status !== 'success' || !Array.isArray(payload.data)) {
    throw new Error(`Unexpected response from /flux/enterpriseappowners: ${JSON.stringify(payload)?.slice(0, 200)}`)
  }

  return new Set(payload.data.filter(Boolean))
}

export function useEnterpriseOwners() {
  // Fetch once per page session; concurrent callers share the same promise.
  const loadEnterpriseOwners = () => {
    if (isLoaded.value) return Promise.resolve(enterpriseOwners.value)

    if (!fetchPromise) {
      fetchPromise = fetchEnterpriseOwners()
        .then(owners => {
          enterpriseOwners.value = owners
          isLoaded.value = true

          return owners
        })
        .catch(error => {
          console.error('Failed to fetch enterprise node owners:', error)

          // Allow a retry on the next call (still no refetch without a request).
          fetchPromise = null

          return enterpriseOwners.value
        })
    }

    return fetchPromise
  }

  const isEnterpriseOwner = zelid => {
    if (!zelid) return false

    return enterpriseOwners.value.has(zelid)
  }

  return {
    enterpriseOwners,
    isLoaded,
    loadEnterpriseOwners,
    isEnterpriseOwner,
  }
}
