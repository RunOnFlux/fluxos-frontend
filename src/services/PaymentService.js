import Api from '@/services/ApiClient'
import qs from 'qs'

export default {
  /**
   * Generate a payment request ID
   * @returns {Promise} Payment request response with paymentId
   */
  paymentRequest() {
    return Api().get('/payment/paymentrequest')
  },

  /**
   * Verify payment (used by backend callback)
   * @param {object} paymentData - Payment data from callback
   * @returns {Promise} Verification response
   */
  verifyPayment(paymentData) {
    return Api().post('/payment/verifypayment', qs.stringify(paymentData))
  },
}
