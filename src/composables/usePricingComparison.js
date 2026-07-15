/**
 * Single source of truth for the provider price comparison.
 *
 * The FluxCloud price for the reference spec is global (the same everywhere it
 * is shown), so it is computed once here and shared across the register landing
 * and the /compare pages. This keeps the numbers from drifting between pages —
 * the FluxCloud figure comes from one live API call, and the competitor figures
 * come from one static list with a documented capture date.
 *
 * Auto-imported (src/composables), but consumers import it explicitly for
 * clarity, e.g. `import { usePricingComparison } from '@/composables/usePricingComparison'`.
 */

import { ref, computed } from 'vue'
import Api from '@/services/ApiClient'

// The hardware the comparison is priced against. All rows use these specs so
// the numbers are apples-to-apples. Surfaced so pages can state it explicitly.
export const COMPARISON_SPEC = Object.freeze({
  instances: '1',
  cpu: '2 vCPU',
  ram: '4 GB',
  storage: '20 GB SSD',
})

// When the competitor list prices below were captured. Pages show this next to
// the table so the comparison stays honest as external pricing changes.
export const COMPETITOR_PRICING_AS_OF = 'July 2026'

// Competitor monthly cost for COMPARISON_SPEC — public on-demand list prices,
// captured on COMPETITOR_PRICING_AS_OF. Akash is marketplace-variable, hence the
// approximate marker. Kept static on purpose: these are external numbers we cite,
// not values we can query live.
const COMPETITORS = Object.freeze([
  { name: 'Akash Network', price: '~$8.00*', highlighted: false },
  { name: 'AWS EC2', price: '$33.12', highlighted: false },
  { name: 'Google Cloud', price: '$29.80', highlighted: false },
  { name: 'Azure', price: '$31.39', highlighted: false },
  { name: 'DigitalOcean', price: '$24.00', highlighted: false },
])

// Shared module-level state (singleton): resolves once per page session.
const fluxCloudPrice = ref('$8.99') // Default fallback until the live price resolves
const fluxCloudPriceLoading = ref(true)
let inflight = null

/**
 * Fetch the live FluxCloud price for COMPARISON_SPEC from the cost-calculator
 * API. Guarded so it runs at most once per page session even when several
 * consumers (register + a comparison table) call it. On error the fallback price
 * is kept. Returns the in-flight promise so callers can await readiness.
 */
function calculateFluxCloudPrice() {
  if (inflight) return inflight

  inflight = (async () => {
    try {
      fluxCloudPriceLoading.value = true

      // Specifications matching the pricing comparison table
      // 2 vCPU, 4 GB RAM, 20 GB SSD, 1 instance, 1 month
      // Post-fork: 88000 blocks = 1 month (30 days)
      const expire = 88000

      const payload = JSON.stringify({
        version: 8,
        name: 'pricingcalc',
        description: 'Pricing comparison calculation',
        owner: '176iuPFBqD4yg3Fd7oPVhB3d4NXWxvQyxx',
        compose: [{
          name: 'component',
          description: 'component',
          repotag: 'runonflux/jetpack2:latest',
          ports: [3000],
          domains: [''],
          environmentParameters: [''],
          commands: [''],
          containerPorts: [3000],
          containerData: '/tmp',
          cpu: '2',
          ram: '4000',
          hdd: '20',
          tiered: false,
        }],
        instances: 1,
        nodes: [],
        contacts: [''],
        geolocation: [''],
        expire,
        enterprise: '',
        staticip: false,
      })

      const response = await Api().post(
        '/apps/calculatefiatandfluxprice',
        payload,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        },
      )

      if (response.data.status !== 'error' && response.data.data?.usd) {
        const usdPrice = parseFloat(response.data.data.usd)
        fluxCloudPrice.value = `$${usdPrice.toFixed(2)}`
        console.log('FluxCloud price calculated:', fluxCloudPrice.value)
      } else {
        console.warn('Failed to calculate price, using default:', response.data)
      }
    } catch (error) {
      console.error('Error calculating FluxCloud price:', error)

      // Keep default price on error
    } finally {
      fluxCloudPriceLoading.value = false
    }
  })()

  return inflight
}

export function usePricingComparison() {
  // The FluxCloud row leads and is highlighted. The price is always a real value
  // (the fallback resolves to the live figure); `loading` drives a spinner so we
  // never persist a "Calculating…" placeholder into prerendered HTML.
  const pricingComparison = computed(() => [
    {
      name: 'FluxCloud',
      ...COMPARISON_SPEC,
      price: fluxCloudPrice.value,
      loading: fluxCloudPriceLoading.value,
      highlighted: true,
    },
    ...COMPETITORS.map(c => ({ ...COMPARISON_SPEC, ...c })),
  ])

  return {
    pricingComparison,
    fluxCloudPrice,
    fluxCloudPriceLoading,
    calculateFluxCloudPrice,
    COMPARISON_SPEC,
    COMPETITOR_PRICING_AS_OF,
  }
}
