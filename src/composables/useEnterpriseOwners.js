import { ref } from 'vue'

// Source of truth for which app owners are allowed to pick priority/enterprise nodes.
// Maps node public keys to arrays of owner zelids, e.g. { "<pubkey>": ["<zelid>"] }.
const GITHUB_ENTERPRISE_NODES_URL = 'https://raw.githubusercontent.com/RunOnFlux/flux/master/helpers/enterprisenodes.json'

// Module-level cache. It lives for the lifetime of the loaded app (the current
// page session) and is shared across every component/route. A full website
// refresh resets the module, which is the only thing that triggers a refetch.
const enterpriseOwners = ref(new Set())
const isLoaded = ref(false)
let fetchPromise = null

async function fetchEnterpriseOwners() {
  const response = await fetch(GITHUB_ENTERPRISE_NODES_URL)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  // Flatten every owner zelid from the map into a single lookup set.
  const owners = new Set()
  Object.values(data || {}).forEach(addresses => {
    if (Array.isArray(addresses)) {
      addresses.forEach(address => {
        if (address) owners.add(address)
      })
    }
  })

  return owners
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
