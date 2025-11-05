import { computed } from 'vue'

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
   * Based on GAME_SERVER_PLAYER_SLOTS.md recommendations
   * @param {string} gameName - Game name (e.g., "Palworld", "Minecraft")
   * @param {Object} config - Configuration object with name and components
   * @returns {string} Player-based configuration name
   */
  const getPlayerBasedConfigName = (gameName, config) => {
    const resources = getConfigResources(config)
    const ramGB = Math.round(resources.ram / 1024) // Convert MB to GB
    const cpu = resources.cpu

    // Normalize game name for matching
    const normalizedGameName = gameName.toLowerCase().trim()

    // Player slot mappings based on RAM (in GB) for each game
    // Researched from official documentation and community benchmarks (2024-2025)
    const playerSlotMappings = {
      // Palworld - 4 configuration options
      // Base usage: ~5GB, ~750MB per player
      // Source: Steam community, hosting provider specs
      'palworld': {
        5: 4,   // Minimum viable (bare minimum)
        7: 8,   // Small server (4-8 players)
        10: 16,  // Medium server (8-10 players)
      },

      // Minecraft - 6 configuration options
      // Scales with mods/plugins and world complexity
      // Source: Minecraft Wiki, hosting providers
      'minecraft': {
        2: 4,   // Vanilla, minimal world
        4: 8,   // Small plugins/mods
        8: 16,   // Medium modpacks
        16: 32,   // Large modpacks or active server
        31: 64,  // Heavy modpacks, large playerbase
        47: 150,  // Maximum performance setup
      },
      'minecraftserver': { // Alias for Minecraft
        2: 4,
        4: 8,
        8: 16,
        16: 32,
        31: 64,
        47: 150,
      },

      // Factorio - 5 configuration options
      // RAM scales with factory complexity more than player count
      // Source: Factorio Forums, community benchmarks
      'factorio': {
        2: 6,    // Small factory, few players (1-4)
        4: 12,   // Medium factory (5-12 players)
        6: 24,   // Large factory (12-24 players)
        8: 32,   // Very large factory (20-32 players)
        12: 50,  // Massive factory with many players
      },

      // Satisfactory - 4 configuration options
      // Official max: 4 players, unofficial supports more
      // Source: Coffee Stain Studios, community servers
      'satisfactory': {
        6: 4,    // Official maximum (1-4 players)
        8: 6,    // Unofficial support with small factory
        12: 8,   // Unofficial support with medium factory
        16: 12,  // Unofficial support with large factory
      },

      // Enshrouded - 4 configuration options
      // Base: 4.4GB, ~100MB per player, 6GB total for 16 players
      // Source: Official FAQ, community benchmarks
      'enshrouded': {
        4: 8,   // Medium server (conservative)
        6: 12,   // Official maximum player count
        8: 16,  // Official max with headroom
        16: 16,  // Official max with extra stability
      },
    }

    // Get player count for this game and RAM configuration
    const gameMapping = playerSlotMappings[normalizedGameName]
    if (!gameMapping) {
      // If no mapping found, return original name
      return config.name
    }

    // Find the closest RAM match (exact or nearest)
    const ramValues = Object.keys(gameMapping).map(Number).sort((a, b) => a - b)
    let closestRam = ramValues[0]
    for (const ramValue of ramValues) {
      if (ramGB >= ramValue) {
        closestRam = ramValue
      }
    }

    const playerCount = gameMapping[closestRam]
    if (!playerCount) {
      // Fallback to original name if no match
      return config.name
    }

    // Format the display name
    const displayGameName = normalizedGameName === 'minecraftserver' ? 'Minecraft' : gameName.charAt(0).toUpperCase() + gameName.slice(1)

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
