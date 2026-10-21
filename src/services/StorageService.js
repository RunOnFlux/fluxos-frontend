import axios from 'axios'
import { getStoredAuth } from '@/utils/session'

/**
 * Storage Service for interacting with Flux Storage API
 * Handles email contacts upload functionality
 */
class StorageService {
  constructor() {
    this.baseURL = 'https://storage.runonflux.io'
    this.apiVersion = '1'
  }

  /**
   * Get axios instance configured for Flux Storage
   */
  getStorageClient() {
    return axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
    })
  }

  /**
   * Upload environment variables to Flux Storage
   * @param {Object} data - Environment data
   * @param {string} data.envid - Unique ID for the environment entry
   * @param {Array<string>} data.env - Array of environment variables
   * @returns {Promise<Object>} Upload response
   */
  async uploadEnv(data) {
    const body = this.withOwner(data)
    let response
    try {
      console.log('🔐 Uploading environment variables to Flux Storage:', { envid: data.envid, envCount: data.env.length })

      const client = this.getStorageClient()
      response = await client.post(`/v${this.apiVersion}/env`, body)
    } catch (error) {
      console.error('❌ Failed to upload environment variables to Flux Storage:', error)

      if (error.response) {
        throw new Error(`Storage API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`)
      } else if (error.request) {
        throw new Error('Storage API request failed - no response received')
      } else {
        throw new Error(`Storage upload error: ${error.message}`)
      }
    }
    this.assertStored(response)

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Environment variables uploaded successfully to Flux Storage')

      return response.data
    }

    throw new Error(`Storage upload failed with status: ${response.status}`)
  }

  /**
   * Upload contacts (email addresses) to Flux Storage
   * @param {Object} data - Contact data
   * @param {string} data.contactsid - Unique ID for the contacts entry
   * @param {Array<string>} data.contacts - Array of email addresses
   * @returns {Promise<Object>} Upload response
   */
  async uploadContacts(data) {
    const body = this.withOwner(data)
    let response
    try {
      console.log('📧 Uploading contacts to Flux Storage:', data.contactsid)

      const client = this.getStorageClient()
      response = await client.post(`/v${this.apiVersion}/contacts`, body)
    } catch (error) {
      console.error('❌ Failed to upload contacts to Flux Storage:', error)

      if (error.response) {
        throw new Error(`Storage API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`)
      } else if (error.request) {
        throw new Error('Storage API request failed - no response received')
      } else {
        throw new Error(`Storage upload error: ${error.message}`)
      }
    }
    this.assertStored(response)

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Contacts uploaded successfully to Flux Storage')

      return response.data
    }

    throw new Error(`Storage upload failed with status: ${response.status}`)
  }

  /**
   * The message Flux Storage gives with a refused upload, or null when the upload was stored.
   * @param {Object} data - The response body
   * @returns {string|null}
   */
  refusalMessage(data) {
    if (data?.status !== 'error') return null

    return data.data?.message || data.message || 'Flux Storage refused the upload'
  }

  /**
   * Flux Storage answers a refused upload with HTTP 200 and `{status: 'error'}`; this throws its
   * message so a refused upload is never taken as stored.
   * @param {Object} response - The axios response
   */
  assertStored(response) {
    const message = this.refusalMessage(response?.data)
    if (message) throw new Error(message)
  }

  /**
   * A storage id: 32 random hex characters.
   * @returns {string} 32-hex-character id
   */
  generateStorageId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Generate an environment ID
   * @returns {string} 32-hex-character id
   */
  generateEnvId() {
    return this.generateStorageId()
  }

  /**
   * Generate a contacts ID
   * @returns {string} 32-hex-character id
   */
  generateContactsId() {
    return this.generateStorageId()
  }

  /**
   * The FluxID the current session is logged in as, or '' when there is no login.
   * @returns {string}
   */
  getOwner() {
    return getStoredAuth()?.zelid || ''
  }

  /**
   * The upload body with its owner set; storage requires an owner on every upload.
   * A caller that already set an owner is left as-is; with no owner and no login, the upload is
   * refused here.
   * @param {Object} data
   * @returns {Object}
   */
  withOwner(data) {
    if (data && data.owner) return data
    const owner = this.getOwner()
    if (!owner) throw new Error('Log in to upload to Flux Storage')

    return { ...data, owner }
  }

  /**
   * Create storage reference URL for environment variables
   * @param {string} envId - The environment ID
   * @returns {string} Storage reference URL
   */
  getEnvStorageReference(envId) {
    return `F_S_ENV=https://storage.runonflux.io/v${this.apiVersion}/env/${envId}`
  }

  /**
   * Create storage reference URL for contacts
   * @param {string} contactsId - The contacts ID
   * @returns {string} Storage reference URL
   */
  getContactsStorageReference(contactsId) {
    return `F_S_CONTACTS=https://storage.runonflux.io/v${this.apiVersion}/contacts/${contactsId}`
  }
}

// Create singleton instance
const storageService = new StorageService()

export default storageService