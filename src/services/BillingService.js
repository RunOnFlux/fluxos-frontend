import Api from '@/services/ApiClient'

export default {
  /**
   * Get payment history for the authenticated user
   * Uses the /apps/permanentmessages endpoint with owner filter
   * @param {string} zelidauthHeader - Authentication header
   * @param {string} zelid - User's ZelID
   * @returns {Promise} API response with payment transactions
   */
  getMyPaymentHistory(zelidauthHeader, zelid) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
        'x-apicache-bypass': true,
      },
    }

    return Api().get(`/apps/permanentmessages?owner=${zelid}`, axiosConfig)
  },

  /**
   * Get all active apps for the authenticated user
   * @param {string} zelidauthHeader - Authentication header
   * @param {string} zelid - User's ZelID
   * @returns {Promise} API response with active apps
   */
  getMyApps(zelidauthHeader, zelid) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
        'x-apicache-bypass': true,
      },
    }
    
    return Api().get(`/apps/globalappsspecifications?owner=${zelid}`, axiosConfig)
  },
}
