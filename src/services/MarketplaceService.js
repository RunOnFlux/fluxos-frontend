import axios from 'axios'

class MarketplaceService {
  constructor() {
    // Use the marketplace bridge API endpoint
    this.marketplaceURL = 'https://jetpackbridge.runonflux.io'
    this.apiVersion = 1
  }

  // Create a separate axios instance for marketplace API
  getMarketplaceClient() {
    const zelidauth = localStorage.getItem('zelidauth')
    const headers = {
      'Content-Type': 'application/json',
    }

    // Parse zelidauth to get all authentication data
    if (zelidauth) {
      headers['zelidauth'] = zelidauth

      try {
        // Handle both URL-encoded and JSON formats
        const authData = zelidauth.includes('zelid=')
          ? Object.fromEntries(new URLSearchParams(zelidauth))
          : JSON.parse(zelidauth)

        // Extract individual auth components if available
        if (authData.zelid) {
          headers['zelid'] = authData.zelid
        }
        if (authData.signature) {
          headers['signature'] = authData.signature
        }
        if (authData.loginPhrase) {
          headers['loginPhrase'] = authData.loginPhrase
        }
      } catch (err) {
        // If parsing fails, the zelidauth header is already set
        console.warn('Failed to parse zelidauth, using raw value:', err)
      }
    }

    return axios.create({
      baseURL: this.marketplaceURL,
      headers,
      timeout: 10000, // 10 second timeout
    })
  }

  // Internal method to get all apps with basic visibility filtering
  async getAllAppsWithVisibility() {
    try {
      const client = this.getMarketplaceClient()
      const response = await client.get(`/api/v${this.apiVersion}/marketplace/apps`)

      if (response.data && response.data.status === 'success') {
        let apps = response.data.data || []

        // Apply visibility filter (only show visible and enabled apps)
        apps = apps.filter(app => app.visible !== false && app.enabled !== false)

        return { data: apps }
      }
      
      return { data: [] }
    } catch (error) {
      console.error('Failed to fetch marketplace apps:', error)
      
      return { data: [] }
    }
  }

  async getApps(filters = {}) {
    try {
      // Get all visible apps first
      const allAppsResponse = await this.getAllAppsWithVisibility()
      let apps = allAppsResponse.data || []

      // Exclude games from main marketplace (they have separate section)
      const gamesCategoryUUIDs = [
        '53542105-d2c4-41a7-9fe5-2cf0c6a60018', // Games
        '7ce5a03c-b808-478b-94a1-2a1b3eaaeb36',  // NewGames
      ]
      apps = apps.filter(app => !gamesCategoryUUIDs.includes(app.category))

      // Apply other filters
      if (filters.category) {
        apps = apps.filter(app => app.category === filters.category)
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        apps = apps.filter(app =>
          app.name?.toLowerCase().includes(searchLower) ||
          app.displayName?.toLowerCase().includes(searchLower) ||
          app.description?.toLowerCase().includes(searchLower),
        )
      }

      return { data: apps }
    } catch (error) {
      console.error('Failed to fetch marketplace apps:', error)
      
      return { data: [] }
    }
  }

  async getFeaturedApps() {
    try {
      const client = this.getMarketplaceClient()

      // FluxCloud implementation: First get all apps, then get featured UUIDs
      const allAppsResponse = await this.getAllAppsWithVisibility()
      const allApps = allAppsResponse.data || []

      // Get featured UUIDs from FluxCloud featured endpoint
      try {
        const response = await client.get(`/api/v${this.apiVersion}/marketplace/featured`)

        if (response.data && response.data.status === 'success') {
          // FluxCloud response structure: data.data contains UUID array
          const featuredUuids = response.data.data.data || []

          // Map UUIDs to full app objects (FluxCloud logic)
          const featuredApps = featuredUuids
            .map(uuid => allApps.find(app => app.uuid === uuid))
            .filter(app => app !== undefined) // FluxCloud uses nonNulls.toList()

          console.log('✅ Featured apps loaded:', featuredApps.length)
          
          return { data: featuredApps }
        }

        throw new Error('Invalid featured response structure')
      } catch (error) {
        console.log('⚠️ Featured endpoint failed:', error.message)

        // FluxCloud fallback: sort by rating * install count
        const fallbackApps = allApps
          .filter(app => (app.installCount || 0) >= 5 || (app.rating || 0) >= 3)
          .sort((a, b) => (b.rating || 0) * (b.installCount || 1) - (a.rating || 0) * (a.installCount || 1))
          .slice(0, 6)

        return { data: fallbackApps }
      }
    } catch (error) {
      console.error('❌ Failed to fetch featured apps:', error)
      
      return { data: [] }
    }
  }

  async getNewListedApps() {
    try {
      // No separate endpoint - FluxCloud gets all apps and sorts them
      const allApps = await this.getAllAppsWithVisibility()
      const newApps = allApps.data
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)) // ASCENDING like FluxCloud (oldest first)
        .slice(0, 10) // FluxCloud shows 10 apps

      return { data: newApps }
    } catch (error) {
      console.error('Failed to fetch new listed apps:', error)
      
      return { data: [] }
    }
  }

  async getSponsoredApps() {
    try {
      const client = this.getMarketplaceClient()

      // FluxCloud implementation: Use featured endpoint for sponsored section
      const allAppsResponse = await this.getAllAppsWithVisibility()
      const allApps = allAppsResponse.data || []

      // Get featured UUIDs from FluxCloud featured endpoint (used for sponsored)
      try {
        const response = await client.get(`/api/v${this.apiVersion}/marketplace/featured`)

        if (response.data && response.data.status === 'success') {
          // FluxCloud response structure: data.data contains UUID array
          const featuredUuids = response.data.data.data || []

          // Map UUIDs to full app objects (FluxCloud logic)
          const sponsoredApps = featuredUuids
            .map(uuid => allApps.find(app => app.uuid === uuid))
            .filter(app => app !== undefined) // FluxCloud uses nonNulls.toList()
            .slice(0, 4) // Limit to 4 for sponsored section

          console.log('✅ Sponsored apps loaded from featured:', sponsoredApps.length)
          
          return { data: sponsoredApps }
        }

        throw new Error('Invalid featured response structure')
      } catch (error) {
        console.log('⚠️ Featured endpoint failed:', error.message)

        // FluxCloud fallback: sort by install count
        const fallbackApps = allApps
          .filter(app => (app.installCount || 0) >= 1)
          .sort((a, b) => (b.installCount || 0) - (a.installCount || 0))
          .slice(0, 4)

        return { data: fallbackApps }
      }
    } catch (error) {
      console.error('❌ Failed to fetch sponsored apps:', error)
      
      return { data: [] }
    }
  }

  async getAppDetails(appId) {
    try {
      // No individual app endpoint exists - get from the apps list instead (like FluxCloud)
      const allAppsResponse = await this.getAllAppsWithVisibility()
      const allApps = allAppsResponse.data || []

      // Find app by name or UUID
      const app = allApps.find(a =>
        a.name === appId ||
        a.uuid === appId ||
        a.name?.toLowerCase() === appId?.toLowerCase()
      )

      if (!app) {
        throw new Error('App not found')
      }

      return { data: app }
    } catch (error) {
      if (error.message !== 'App not found') {
        console.error('Failed to fetch app details:', error)
      }
      throw error
    }
  }

  async getAppsByZelID(zelID) {
    try {
      const client = this.getMarketplaceClient()
      const response = await client.get(`/api/v${this.apiVersion}/marketplace/apps/${zelID}`)

      if (response.data && response.data.status === 'success') {
        return { data: response.data.data || [] }
      }

      return { data: [] }
    } catch (error) {
      console.error('Failed to fetch apps by ZelID:', error)
      
      return { data: [] }
    }
  }

  async getCategories() {
    try {
      const client = this.getMarketplaceClient()
      const response = await client.get(`/api/v${this.apiVersion}/marketplace/categories`)


      if (response.data && response.data.status === 'success') {
        return { data: response.data.data || [] }
      }

      return { data: [] }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      
      return { data: [] }
    }
  }

  async deployApp(appName, config = {}) {
    try {
      const zelidauth = localStorage.getItem('zelidauth')

      if (!zelidauth) {
        throw new Error('Authentication required')
      }

      const client = this.getMarketplaceClient()
      const response = await client.post(
        `/api/v${this.apiVersion}/marketplace/deploy/${appName}`,
        config,
        {
          headers: {
            'zelidauth': zelidauth,
          },
        },
      )

      if (response.data && response.data.status === 'success') {
        return response.data
      }

      throw new Error('Deployment failed')
    } catch (error) {
      console.error('Failed to deploy app:', error)
      throw error
    }
  }

  async getDeployedApps() {
    try {
      const zelidauth = localStorage.getItem('zelidauth')

      if (!zelidauth) {
        return { data: [] }
      }

      let zelid = null
      try {
        // Handle both URL-encoded and JSON formats
        const authData = zelidauth.includes('zelid=')
          ? Object.fromEntries(new URLSearchParams(zelidauth))
          : JSON.parse(zelidauth)
        zelid = authData.zelid
      } catch (err) {
        console.error('Failed to parse zelidauth:', err)
        
        return { data: [] }
      }

      if (!zelid) {
        return { data: [] }
      }

      const client = this.getMarketplaceClient()
      const response = await client.get(`/api/v${this.apiVersion}/marketplace/apps/${zelid}`)

      if (response.data && response.data.status === 'success') {
        return { data: response.data.data || [] }
      }

      return { data: [] }
    } catch (error) {
      console.error('Failed to fetch deployed apps:', error)
      
      return { data: [] }
    }
  }

  async getAppInstance(instanceName) {
    try {
      const client = this.getMarketplaceClient()
      const response = await client.get(`/api/v${this.apiVersion}/marketplace/appinstance/${instanceName}`)

      if (response.data && response.data.status === 'success') {
        return { data: response.data.data }
      }

      return { data: null }
    } catch (error) {
      console.error('Failed to fetch app instance:', error)
      
      return { data: null }
    }
  }

  async submitReview(appId, review) {
    try {
      const zelidauth = localStorage.getItem('zelidauth')

      if (!zelidauth) {
        throw new Error('Authentication required')
      }

      const client = this.getMarketplaceClient()
      const response = await client.post(
        `/api/v${this.apiVersion}/marketplace/app/${appId}/review`,
        review,
        {
          headers: { zelidauth },
        },
      )

      return response.data
    } catch (error) {
      console.error('Failed to submit review:', error)
      throw error
    }
  }

  async getAppReviews(appId) {
    try {
      const client = this.getMarketplaceClient()
      const response = await client.get(`/api/v${this.apiVersion}/marketplace/app/${appId}/reviews`)

      if (response.data && response.data.status === 'success') {
        return { data: response.data.data || [] }
      }

      return { data: [] }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
      
      return { data: [] }
    }
  }

  async getMarketplaceStats() {
    try {
      const client = this.getMarketplaceClient()
      const response = await client.get(`/api/v${this.apiVersion}/marketplace/stats`)

      if (response.data && response.data.status === 'success') {
        return { data: response.data.data }
      }

      return { data: {} }
    } catch (error) {
      console.error('Failed to fetch marketplace stats:', error)
      
      return { data: {} }
    }
  }


  async getPopularApps() {
    try {
      const client = this.getMarketplaceClient()
      const response = await client.get(`/api/v${this.apiVersion}/marketplace/apps/popular`)

      if (response.data && response.data.status === 'success') {
        return { data: response.data.data || [] }
      }

      return { data: [] }
    } catch (error) {
      console.error('Failed to fetch popular apps:', error)
      
      return { data: [] }
    }
  }

  async getGamesList() {
    try {
      const client = this.getMarketplaceClient()

      // FluxCloud uses the trending endpoint for games list
      const response = await client.get(`/api/v${this.apiVersion}/marketplace/trending`)

      if (response.data && response.data.status === 'success') {
        // Returns array of game UUIDs like FluxCloud
        return { data: response.data.data.data || [] }
      }

      return { data: [] }
    } catch (error) {
      console.error('Failed to fetch games list:', error)
      
      return { data: [] }
    }
  }

  async getGames() {
    try {
      // Get all apps first
      const allAppsResponse = await this.getAllAppsWithVisibility()
      const allApps = allAppsResponse.data || []

      // Get games UUIDs from trending endpoint (ONLY trending games like FluxCloud)
      const gamesListResponse = await this.getGamesList()
      const gameUuids = gamesListResponse.data || []

      // Map UUIDs to full app objects (FluxCloud logic - ONLY trending games)
      const games = gameUuids
        .map(uuid => allApps.find(app => app.uuid === uuid))
        .filter(app => app !== undefined)

      return { data: games }
    } catch (error) {
      console.error('Failed to fetch games:', error)
      
      return { data: [] }
    }
  }
}

export default new MarketplaceService()
export { MarketplaceService }