import { computed } from 'vue'
import { getGameDisplayName, getPlayerCountForRAM } from '@/config/gameServers'

/**
 * Game-specific utility functions
 * Based on FluxCloud game marketplace patterns
 */
export function useGameUtils() {
  /**
   * Calculate minimum price from game configurations
   * @param {Object} game - Game application object
   * @returns {string} Formatted minimum price
   */
  const getMinimumPrice = game => {
    if (!game) return '0.00'

    if (game.useConfig && game.configs?.length) {
      const prices = game.configs.map(c => c.price || 0).filter(p => !isNaN(p) && p >= 0)

      if (prices.length === 0) return '0.00'

      const lowest = Math.min(...prices)

      // Ensure we don't return Infinity or invalid numbers
      if (!isFinite(lowest)) return '0.00'

      return lowest.toFixed(2)
    }

    const price = game.price || 0
    
    return (typeof price === 'number' && isFinite(price) ? price : 0).toFixed(2)
  }

  /**
   * Get configurations by group title
   * @param {Object} game - Game application object
   * @param {string} groupTitle - Group title to filter by
   * @returns {Array} Filtered configurations
   */
  const getConfigsByGroup = (game, groupTitle) => {
    if (!game.configs) return []
    
    return game.configs.filter(c => c.group === groupTitle)
  }

  /**
   * Calculate grid columns based on container width
   * @param {number} containerWidth - Container width in pixels
   * @param {number} itemWidth - Item width in pixels
   * @param {Object} padding - Padding object with left/right values
   * @returns {number} Number of columns
   */
  const calculateGridColumns = (containerWidth, itemWidth, padding = { left: 0, right: 0 }) => {
    const rowCount = containerWidth / (padding.left + padding.right + itemWidth)
    
    return Math.floor(Math.max(1, rowCount))
  }

  /**
   * Parse landing image URL
   * Handles asset:// protocol like FluxCloud
   * @param {string} landingImage - Image URL or asset path
   * @returns {string} Resolved image URL
   */
  const parseLandingImage = landingImage => {
    if (!landingImage) return ''

    // Handle asset:// protocol - remove the protocol and add leading slash for public folder
    if (landingImage.startsWith('asset://')) {
      // Remove 'asset://' prefix (8 characters) and add leading slash
      return '/' + landingImage.substring(8)
    }

    return landingImage
  }

  /**
   * Get resource summary from configuration
   * @param {Object} config - Configuration object
   * @returns {Object} Resource summary
   */
  const getConfigResources = config => {
    if (!config.components || !config.components.length) {
      return { cpu: 0, ram: 0, hdd: 0 }
    }

    const component = config.components[0]
    
    return {
      cpu: Math.round((Number(component.cpu) || 0) * 100) / 100, // Round to 2 decimals
      ram: Math.round(Number(component.ram) || 0), // Round to whole number
      hdd: Math.round(Number(component.hdd) || 0), // Round to whole number
    }
  }

  /**
   * Format resource display text
   * @param {Object} resources - Resources object from getConfigResources
   * @returns {string} Formatted text
   */
  const formatResources = resources => {
    const parts = []
    if (resources.cpu) parts.push(`${resources.cpu} CPU`)
    if (resources.ram) parts.push(`${resources.ram} MB RAM`)
    if (resources.hdd) parts.push(`${resources.hdd} GB Storage`)
    
    return parts.join(' • ')
  }

  /**
   * Check if game uses configuration system
   * @param {Object} game - Game application object
   * @returns {boolean}
   */
  const usesConfigs = game => {
    return game.useConfig === true && game.configs?.length > 0
  }

  /**
   * Check if game uses group-based layout
   * @param {Object} game - Game application object
   * @returns {boolean}
   */
  const usesGroups = game => {
    return usesConfigs(game) && game.groups?.length > 0
  }

  /**
   * Shuffle array (for screenshots)
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  const shuffleArray = array => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled
  }

  /**
   * Transform RAM-based configuration names to player-based names
   * Uses centralized game server configurations from @/config/gameServers
   * @param {string} gameName - Game name (e.g., "Palworld", "Minecraft")
   * @param {Object} config - Configuration object with name and components
   * @returns {string} Player-based configuration name
   */
  const getPlayerBasedConfigName = (gameName, config) => {
    const resources = getConfigResources(config)
    const ramGB = Math.round(resources.ram / 1024) // Convert MB to GB

    // Get player count from centralized config
    const playerCount = getPlayerCountForRAM(gameName, ramGB)

    if (!playerCount) {
      // If no mapping found, return original name
      return config.name
    }

    // Get display name from centralized config
    const displayGameName = getGameDisplayName(gameName)

    return `${displayGameName} - ${playerCount} Players`
  }

  return {
    getMinimumPrice,
    getConfigsByGroup,
    calculateGridColumns,
    parseLandingImage,
    getConfigResources,
    formatResources,
    usesConfigs,
    usesGroups,
    shuffleArray,
    getPlayerBasedConfigName,
  }
}
