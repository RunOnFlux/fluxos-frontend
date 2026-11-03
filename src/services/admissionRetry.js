// A registration or update refused by an ArcaneOS node short of its quorum of
// authenticated links. The node refuses before signing or storing anything, so
// the request is sent again; round-robin takes each attempt to the next node.

// Attempts after the first that such a refusal is sent again.
export const ADMISSION_RETRIES = 3

/**
 * @param {import('axios').AxiosError} error
 * @returns {boolean}
 */
export function isAdmissionUnavailable(error) {
  return error.response?.status === 503 && error.response.data?.data?.name === 'AdmissionUnavailable'
}

/**
 * Send the refused request again through `client`, or reject with the refusal
 * once it has been sent ADMISSION_RETRIES more times.
 * @param {import('axios').AxiosInstance} client
 * @param {import('axios').AxiosError} error A refusal isAdmissionUnavailable takes.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export function retryAdmission(client, error) {
  const retries = error.config.admissionRetries ?? 0
  if (retries >= ADMISSION_RETRIES) return Promise.reject(error)
  error.config.admissionRetries = retries + 1

  return client.request(error.config)
}
