import axios from 'axios'

const WORDPRESS_BRIDGE_URL = 'https://api.marketplace.runonflux.io'
const API_VERSION = 1

export function useWordPress() {
  /**
   * Fetch available WordPress plans
   */
  const fetchPlans = async () => {
    try {
      const response = await axios.get(
        `${WORDPRESS_BRIDGE_URL}/api/v${API_VERSION}/wordpress/plans`,
      )

      if (response.data?.error) {
        throw new Error(response.data.error)
      }

      if (response.data?.warning) {
        throw new Error(response.data.warning)
      }

      return response.data
    } catch (error) {
      console.error('Failed to fetch WordPress plans:', error)
      throw error
    }
  }

  /**
   * Check if WordPress app name is available
   */
  const checkNameAvailability = async (appName, zelid, regType = 'appregister') => {
    try {
      const response = await axios.post(
        `${WORDPRESS_BRIDGE_URL}/api/v${API_VERSION}/wordpress/namecheck`,
        {
          zelid,
          app_name: appName,
          regtype: regType,
        },
      )

      if (response.data?.success) {
        return response.data.success === 'available'
      }

      if (response.data?.error) {
        return false
      }

      throw new Error('Invalid response from name check')
    } catch (error) {
      console.error('Failed to check name availability:', error)
      throw error
    }
  }

  /**
   * Check WordPress app status
   */
  const checkStatus = async (appName, zelid) => {
    try {
      const response = await axios.post(
        `${WORDPRESS_BRIDGE_URL}/api/v${API_VERSION}/wordpress/status`,
        {
          zelid,
          app_name: appName,
        },
      )

      if (response.data?.success) {
        return response.data.success
      }

      if (response.data?.error) {
        return response.data.error
      }

      throw new Error('Bad Data: ' + JSON.stringify(response.data))
    } catch (error) {
      console.error('Failed to check status:', error)
      throw error
    }
  }

  /**
   * Get WordPress app entry
   */
  const getEntry = async (hash, zelid) => {
    try {
      const response = await axios.post(
        `${WORDPRESS_BRIDGE_URL}/api/v${API_VERSION}/wordpress/entry`,
        {
          zelid,
          hash,
        },
      )

      return response.data
    } catch (error) {
      console.error('Failed to get entry:', error)
      throw error
    }
  }

  /**
   * Add WordPress app
   */
  const addWordPressApp = async (hash, dapp, zelid, signature, loginPhrase) => {
    try {
      const response = await axios.post(
        `${WORDPRESS_BRIDGE_URL}/api/v${API_VERSION}/wordpress/add`,
        {
          zelid,
          signature,
          loginPhrase,
          hash,
          dapp,
        },
      )

      return response.data
    } catch (error) {
      console.error('Failed to add WordPress app:', error)
      throw error
    }
  }

  /**
   * Get WordPress count
   */
  const getWordPressCount = async () => {
    try {
      const response = await axios.get(
        `${WORDPRESS_BRIDGE_URL}/api/v${API_VERSION}/wordpress/count`,
      )

      const count = parseInt(response.data)
      if (!isNaN(count)) {
        return count
      }

      throw new Error(response.data?.toString() || 'Invalid count response')
    } catch (error) {
      console.error('Failed to get WordPress count:', error)
      throw error
    }
  }

  /**
   * Fetch WordPress configuration including component versions
   */
  const fetchConfig = async () => {
    try {
      const response = await axios.get(
        `${WORDPRESS_BRIDGE_URL}/api/v${API_VERSION}/wordpress/config`,
      )

      if (response.data?.error) {
        throw new Error(response.data.error)
      }

      return response.data
    } catch (error) {
      console.error('Failed to fetch WordPress config:', error)
      throw error
    }
  }

  return {
    fetchPlans,
    checkNameAvailability,
    checkStatus,
    getEntry,
    addWordPressApp,
    getWordPressCount,
    fetchConfig,
  }
}
