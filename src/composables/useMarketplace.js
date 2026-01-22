import { ref, readonly, computed } from 'vue'
import MarketplaceService from '@/services/MarketplaceService'

const apps = ref([])
const featuredApps = ref([])
const newApps = ref([])
const sponsoredApps = ref([])
const games = ref([])
const categories = ref([])
const categoryMap = ref(new Map())
const loadingCounter = ref(0)
const loading = computed(() => loadingCounter.value > 0)
const error = ref(null)

export function useMarketplace() {
  const fetchApps = async (filters = {}) => {
    loadingCounter.value++
    error.value = null

    try {
      const response = await MarketplaceService.getApps(filters)
      apps.value = response.data || []
    } catch (err) {
      console.error('Failed to fetch marketplace apps:', err)
      error.value = err.message
      apps.value = []
    } finally {
      loadingCounter.value--
    }
  }

  const fetchFeaturedApps = async () => {
    loadingCounter.value++
    try {
      console.log('📋 Fetching featured apps...')
      const response = await MarketplaceService.getFeaturedApps()
      featuredApps.value = response.data || []
      console.log(`✅ Featured apps: ${featuredApps.value.length}`)
    } catch (err) {
      console.error('❌ Failed to fetch featured apps:', err)
      featuredApps.value = []
    } finally {
      loadingCounter.value--
    }
  }

  const fetchNewApps = async () => {
    loadingCounter.value++
    try {
      console.log('🚀 Fetching new apps...')
      const response = await MarketplaceService.getNewListedApps()
      newApps.value = response.data || []
      console.log(`✅ New apps: ${newApps.value.length}`)
    } catch (err) {
      console.error('❌ Failed to fetch new apps:', err)
      newApps.value = []
    } finally {
      loadingCounter.value--
    }
  }

  const fetchSponsoredApps = async () => {
    loadingCounter.value++
    try {
      console.log('⭐ Fetching sponsored apps...')
      const response = await MarketplaceService.getSponsoredApps()
      sponsoredApps.value = response.data || []
      console.log(`✅ Sponsored apps: ${sponsoredApps.value.length}`)
    } catch (err) {
      console.error('❌ Failed to fetch sponsored apps:', err)
      sponsoredApps.value = []
    } finally {
      loadingCounter.value--
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await MarketplaceService.getCategories()
      categories.value = response.data || []

      // Create category mapping
      const map = new Map()
      categories.value.forEach(cat => {
        map.set(cat.uuid, cat.name)
      })
      categoryMap.value = map
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      categories.value = []
    }
  }

  const fetchAppDetails = async appId => {
    loadingCounter.value++
    error.value = null

    try {
      const response = await MarketplaceService.getAppDetails(appId)
      
      return response.data
    } catch (err) {
      if (err.response?.status !== 404 && err.message !== 'App not found') { console.error('Failed to fetch app details:', err) }
      error.value = err.message
      throw err
    } finally {
      loadingCounter.value--
    }
  }

  const deployApp = async (appId, config = {}) => {
    loadingCounter.value++
    error.value = null

    try {
      const response = await MarketplaceService.deployApp(appId, config)
      
      return response.data
    } catch (err) {
      console.error('Failed to deploy app:', err)
      error.value = err.message
      throw err
    } finally {
      loadingCounter.value--
    }
  }

  const fetchGames = async () => {
    loadingCounter.value++
    try {
      console.log('🎮 Fetching games...')
      const response = await MarketplaceService.getGames()

      console.log('🎮 Games response:', response)

      // MarketplaceService.getGames() already returns mapped games
      if (response.data && Array.isArray(response.data)) {
        games.value = response.data.filter(app => app && app.visible && app.enabled)
        console.log(`✅ Games loaded: ${games.value.length}`, games.value)
      } else if (response && Array.isArray(response)) {
        // Handle if response is directly an array
        games.value = response.filter(app => app && app.visible && app.enabled)
        console.log(`✅ Games loaded: ${games.value.length}`, games.value)
      } else {
        console.warn('⚠️ Unexpected games response format:', response)
        games.value = []
      }
    } catch (err) {
      console.error('❌ Failed to fetch games:', err)
      games.value = []
    } finally {
      loadingCounter.value--
    }
  }

  return {
    apps: readonly(apps),
    featuredApps: readonly(featuredApps),
    newApps: readonly(newApps),
    sponsoredApps: readonly(sponsoredApps),
    games: readonly(games),
    categories: readonly(categories),
    categoryMap: readonly(categoryMap),
    loading: readonly(loading),
    error: readonly(error),
    fetchApps,
    fetchFeaturedApps,
    fetchNewApps,
    fetchSponsoredApps,
    fetchGames,
    fetchCategories,
    fetchAppDetails,
    deployApp,
  }
}
