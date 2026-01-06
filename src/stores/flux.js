// src/stores/flux.js
import { defineStore } from "pinia"
import Api from "@/services/ApiClient"
import axios from "axios"
import DashboardService from "@/services/DashboardService"
import AppsService from "@/services/AppsService"
import qs from "qs"

export const useFluxStore = defineStore("flux", {
  state: () => ({
    userconfig: {
      zelid: "",
      externalip: "",
    },
    config: {
      fluxTeamFluxID: "",
      fluxSupportTeamFluxID: "",
      apiPort: "",
    },
    privilege: "none",
    zelid: "",
    fluxVersion: "",
    loginType: "",
    xdaoOpen: 0,
    serverLocations: {
      fluxList: [],
      fluxNodeCount: 0,
      isLoading: false,
      hasError: false,
      lastFetched: null,
    },
    trustpilot: {
      data: null,
      isLoading: false,
      isFetched: false,
      fetchError: null,
    },
    userApps: {
      hasApps: false,
      isChecked: false,
    },
  }),

  getters: {
    isXdaoOpen: state => state.xdaoOpen,
    hasUserApps: state => state.userApps.hasApps,
    isUserAppsChecked: state => state.userApps.isChecked,
  },

  actions: {
    async fetchFluxIDs() {
      try {
        const response = await Api().get("/flux/fluxids")
    
        if (!response?.data?.data) {
          console.warn("⚠️ Unexpected API structure:", response.data)
          
          return
        }
    
        const { fluxTeamFluxID, fluxSupportTeamFluxID } = response.data.data

        console.log("📦 Extracted IDs:", fluxTeamFluxID, fluxSupportTeamFluxID)
    
        this.setFluxTeamFluxID(fluxTeamFluxID)
        this.setFluxSupportTeamFluxID(fluxSupportTeamFluxID)
      } catch (error) {
        console.error("❌ Failed to fetch Flux IDs:", error)
      }
    },    

    setPrivilege(privilege) {
      this.privilege = privilege
    },

    setZelid(zelid) {
      this.zelid = zelid
    },

    setFluxVersion(version) {
      this.fluxVersion = version
    },

    setUserZelid(zelid) {
      this.userconfig.zelid = zelid
    },

    setUserIp(ip) {
      this.userconfig.externalip = ip
    },

    setFluxPort(port) {
      this.config.apiPort = port
    },

    setXDAOOpen(open) {
      this.xdaoOpen = open
    },

    setFluxTeamFluxID(id) {
      this.config.fluxTeamFluxID = id
    },

    setFluxSupportTeamFluxID(id) {
      this.config.fluxSupportTeamFluxID = id
    },
    setLoginType(type) {
      this.loginType = type
    },

    // IndexedDB helper functions for server locations caching
    async openServerLocationsDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('FluxServerLocationsDB', 1)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)

        request.onupgradeneeded = event => {
          const db = event.target.result
          if (!db.objectStoreNames.contains('locations')) {
            db.createObjectStore('locations', { keyPath: 'id' })
          }
        }
      })
    },

    async loadServerLocationsFromCache() {
      try {
        const db = await this.openServerLocationsDB()

        return new Promise(resolve => {
          const transaction = db.transaction(['locations'], 'readonly')
          const store = transaction.objectStore('locations')
          const request = store.get('flux_server_locations')

          request.onsuccess = () => {
            if (request.result) {
              console.log('✅ Loaded server locations from IndexedDB cache')
              resolve(request.result.data)
            } else {
              resolve(null)
            }
          }
          request.onerror = () => {
            console.warn('Error reading from IndexedDB:', request.error)
            resolve(null)
          }
        })
      } catch (error) {
        console.warn('IndexedDB not available, skipping cache:', error)

        return null
      }
    },

    async saveServerLocationsToCache(fluxData, nodeCount) {
      try {
        const db = await this.openServerLocationsDB()

        const dataToCache = {
          id: 'flux_server_locations',
          data: {
            fluxList: fluxData,
            fluxNodeCount: nodeCount,
            timestamp: Date.now(),
          },
        }

        const transaction = db.transaction(['locations'], 'readwrite')
        const store = transaction.objectStore('locations')
        store.put(dataToCache)

        await new Promise((resolve, reject) => {
          transaction.oncomplete = () => {
            console.log(`✅ Cached ${fluxData.length} nodes in IndexedDB`)
            resolve()
          }
          transaction.onerror = () => reject(transaction.error)
        })
      } catch (error) {
        console.warn('Unable to cache to IndexedDB:', error)
      }
    },

    async fetchServerLocations() {
      // Don't fetch if already loading or already fetched this session
      if (this.serverLocations.isLoading || this.serverLocations.lastFetched) {
        return
      }

      // Try to load from cache first for instant display
      const cached = await this.loadServerLocationsFromCache()
      if (cached) {
        this.serverLocations.fluxList = Array.isArray(cached.fluxList) ? cached.fluxList : []
        this.serverLocations.fluxNodeCount = cached.fluxNodeCount || 0
        this.serverLocations.hasError = false

        // Don't set lastFetched yet - we'll fetch fresh data below
      }

      // Always fetch fresh data on page load
      this.serverLocations.isLoading = true

      try {
        const resLoc = await axios.get(
          'https://stats.runonflux.io/fluxinfo?projection=geolocation,ip,tier',
        )

        const data = resLoc.data.data
        const fetchedFluxList = Array.isArray(data) ? data : []

        const resList = await DashboardService.fluxnodeCount()
        const fetchedNodeCount = resList.data.data.total || 0

        // Update state
        this.serverLocations.fluxList = fetchedFluxList
        this.serverLocations.fluxNodeCount = fetchedNodeCount
        this.serverLocations.hasError = false
        this.serverLocations.lastFetched = Date.now()

        // Save to cache
        await this.saveServerLocationsToCache(fetchedFluxList, fetchedNodeCount)
      } catch (error) {
        console.error('Error fetching server locations:', error)

        // Try to load from cache as fallback
        const fallbackCache = await this.loadServerLocationsFromCache()
        if (fallbackCache) {
          this.serverLocations.fluxList = Array.isArray(fallbackCache.fluxList) ? fallbackCache.fluxList : []
          this.serverLocations.fluxNodeCount = fallbackCache.fluxNodeCount || 0
          this.serverLocations.hasError = false
          this.serverLocations.lastFetched = fallbackCache.timestamp
        } else {
          // No cache available
          this.serverLocations.fluxList = []
          this.serverLocations.fluxNodeCount = 0
          this.serverLocations.hasError = true
        }
      } finally {
        this.serverLocations.isLoading = false
      }
    },

    // Trustpilot data management
    getTrustpilotFallbackData() {
      // This should be called with i18n context, but we'll provide basic defaults
      // The component will still use i18n for display
      return {
        rating: 4.5,
        reviewCount: 16,
        ratingText: '4.5 out of 5',
        reviewsText: 'Based on 16 reviews',
        profileUrl: 'https://www.trustpilot.com/review/runonflux.com',
        ratingLabel: 'Excellent',
        title: 'Trusted by Thousands',
        sampleReviews: [
          {
            text: 'Flux is a great platform for hosting applications. The decentralized infrastructure is very reliable.',
            author: 'Tuukka Tinkala',
            rating: 5,
          },
          {
            text: 'Easy to use and very powerful. The community is also very helpful.',
            author: 'ST',
            rating: 5,
          },
          {
            text: 'Excellent service with great uptime and performance.',
            author: 'Cyber fly',
            rating: 5,
          },
        ],
        source: 'fallback',
        fetchedAt: null,
      }
    },

    loadTrustpilotFromCache() {
      try {
        const cached = localStorage.getItem('trustpilot_cache')
        if (!cached) return null

        const data = JSON.parse(cached)
        const age = Date.now() - data.fetchedAt

        // Check if cache is still valid (12 hours)
        const CACHE_DURATION = 12 * 60 * 60 * 1000
        if (age < CACHE_DURATION) {
          console.log('✅ TrustPilot: Loaded from cache', { age: Math.round(age / 1000 / 60) + ' minutes' })

          return data
        } else {
          console.log('⏰ TrustPilot: Cache expired', { age: Math.round(age / 1000 / 60) + ' minutes' })
          localStorage.removeItem('trustpilot_cache')

          return null
        }
      } catch (error) {
        console.warn('⚠️ TrustPilot: Failed to load cache', error)

        return null
      }
    },

    saveTrustpilotToCache(data) {
      try {
        localStorage.setItem('trustpilot_cache', JSON.stringify(data))
        console.log('💾 TrustPilot: Saved to cache')
      } catch (error) {
        console.warn('⚠️ TrustPilot: Failed to save cache', error)
      }
    },

    async fetchTrustpilotLiveData() {
      const businessUnit = 'runonflux.com'

      try {
        const apiUrl = `https://api.trustpilot.com/v1/business-units/find?name=${businessUnit}`

        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`TrustPilot API error: ${response.status}`)
        }

        const businessData = await response.json()

        // Fetch reviews
        const reviewsUrl = `https://api.trustpilot.com/v1/business-units/${businessData.id}/reviews?perPage=3&stars=5`
        const reviewsResponse = await fetch(reviewsUrl, {
          headers: {
            'Accept': 'application/json',
          },
        })

        let reviews = []
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json()
          reviews = reviewsData.reviews?.slice(0, 3).map(review => ({
            text: review.text || review.title,
            author: review.consumer?.displayName || 'Anonymous',
            rating: review.stars || 5,
          })) || []
        }

        const fallbackData = this.getTrustpilotFallbackData()
        const liveData = {
          rating: businessData.score?.trustScore || fallbackData.rating,
          reviewCount: businessData.numberOfReviews?.total || fallbackData.reviewCount,
          ratingText: `${businessData.score?.trustScore?.toFixed(1) || '4.5'} out of 5`,
          reviewsText: `Based on ${businessData.numberOfReviews?.total || 16} reviews`,
          profileUrl: 'https://www.trustpilot.com/review/runonflux.com',
          ratingLabel: businessData.score?.stars >= 4 ? 'Excellent' : 'Great',
          title: fallbackData.title,
          sampleReviews: reviews.length > 0 ? reviews : fallbackData.sampleReviews,
          source: 'live',
          fetchedAt: Date.now(),
        }

        console.log('✅ TrustPilot: Live data fetched successfully', liveData)

        return liveData
      } catch (error) {
        console.warn('⚠️ TrustPilot: Failed to fetch live data, will use fallback', error.message)

        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
          console.info('💡 TrustPilot: To fetch live data, create a backend proxy endpoint')
        }

        throw error
      }
    },

    async fetchTrustpilot() {
      // Don't fetch if already fetched or currently loading
      if (this.trustpilot.isFetched || this.trustpilot.isLoading) {
        return
      }

      // Try to load from cache first for instant display
      const cached = await this.loadTrustpilotFromCache()
      if (cached) {
        this.trustpilot.data = cached

        // Don't set isFetched yet - we'll fetch fresh data below
      } else {
        // Start with fallback data immediately (for instant display)
        this.trustpilot.data = this.getTrustpilotFallbackData()
      }

      // Always fetch fresh data in background
      this.trustpilot.isLoading = true

      try {
        const liveData = await this.fetchTrustpilotLiveData()
        this.trustpilot.data = liveData
        this.saveTrustpilotToCache(liveData)
        this.trustpilot.fetchError = null
      } catch (error) {
        // Keep using fallback data
        this.trustpilot.fetchError = error
        console.log('ℹ️ TrustPilot: Using fallback data')
      } finally {
        this.trustpilot.isLoading = false
        this.trustpilot.isFetched = true
      }
    },

    clearTrustpilotCache() {
      localStorage.removeItem('trustpilot_cache')
      this.trustpilot.data = null
      this.trustpilot.isFetched = false
      this.trustpilot.fetchError = null
      console.log('🗑️ TrustPilot: Cache cleared')
    },

    async checkUserApps() {
      const zelidauth = localStorage.getItem('zelidauth')
      const auth = qs.parse(zelidauth || '')

      // If not logged in, user has no apps
      if (!auth?.zelid) {
        this.userApps.hasApps = false
        this.userApps.isChecked = true

        return
      }

      try {
        // Check for active apps
        const activeResponse = await AppsService.myGlobalAppSpecifications(auth.zelid)
        const activeApps = Array.isArray(activeResponse.data.data) ? activeResponse.data.data : []

        if (activeApps.length > 0) {
          this.userApps.hasApps = true
          this.userApps.isChecked = true

          return
        }

        // Check for expired apps
        const expiredResponse = await AppsService.permanentMessagesOwner(auth.zelid).catch(() => ({
          data: { data: [] },
        }))
        const expiredApps = expiredResponse.data.data || []

        this.userApps.hasApps = expiredApps.length > 0
        this.userApps.isChecked = true
      } catch (error) {
        console.error('Error checking user apps:', error)

        // On error, assume user might have apps to avoid hiding the menu unnecessarily
        this.userApps.hasApps = true
        this.userApps.isChecked = true
      }
    },

    resetUserApps() {
      this.userApps.hasApps = false
      this.userApps.isChecked = false
    },

    setUserHasApps() {
      this.userApps.hasApps = true
      this.userApps.isChecked = true
    },
  },
})
