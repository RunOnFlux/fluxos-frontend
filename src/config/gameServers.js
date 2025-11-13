/**
 * Game Server Configuration
 *
 * Player slot mappings based on RAM (in GB) for each game.
 * Researched from official documentation and community benchmarks (2024-2025).
 *
 * Each game has a mapping of RAM → recommended player slots:
 * - Keys: RAM amount in GB
 * - Values: Recommended maximum player count for that configuration
 *
 * These mappings are used to transform technical RAM-based configs
 * into user-friendly player-based naming (e.g., "Palworld - 8 Players").
 */

export const GAME_PLAYER_MAPPINGS = {
  /**
   * Palworld - 4 configuration options
   * Base usage: ~5GB, ~750MB per player
   * Source: Steam community, hosting provider specs
   */
  'palworld': {
    5: 4,   // Minimum viable (bare minimum)
    7: 8,   // Small server (4-8 players)
    10: 16, // Medium server (8-16 players)
  },

  /**
   * Minecraft - 6 configuration options
   * Scales with mods/plugins and world complexity
   * Source: Minecraft Wiki, hosting providers
   */
  'minecraft': {
    2: 4,    // Vanilla, minimal world
    4: 8,    // Small plugins/mods
    8: 16,   // Medium modpacks
    16: 32,  // Large modpacks or active server
    31: 64,  // Heavy modpacks, large playerbase
    47: 150, // Maximum performance setup
  },

  /**
   * MinecraftServer (alias for Minecraft)
   * Same configurations as 'minecraft'
   */
  'minecraftserver': {
    2: 4,
    4: 8,
    8: 16,
    16: 32,
    31: 64,
    47: 150,
  },

  /**
   * Factorio - 5 configuration options
   * RAM scales with factory complexity more than player count
   * Source: Factorio Forums, community benchmarks
   */
  'factorio': {
    2: 6,    // Small factory, few players (1-6)
    4: 12,   // Medium factory (5-12 players)
    6: 24,   // Large factory (12-24 players)
    8: 32,   // Very large factory (20-32 players)
    12: 50,  // Massive factory with many players
  },

  /**
   * Satisfactory - 4 configuration options
   * Official max: 4 players, unofficial supports more
   * Source: Coffee Stain Studios, community servers
   */
  'satisfactory': {
    6: 4,    // Official maximum (1-4 players)
    8: 6,    // Unofficial support with small factory
    12: 8,   // Unofficial support with medium factory
    16: 12,  // Unofficial support with large factory
  },

  /**
   * Enshrouded - 4 configuration options
   * Base: 4.4GB, ~100MB per player, 6GB total for 16 players
   * Source: Official FAQ, community benchmarks
   */
  'enshrouded': {
    4: 8,    // Medium server (conservative)
    6: 12,   // Official recommended
    8: 16,   // Official max with headroom
    16: 16,  // Official max with extra stability
  },
}

/**
 * Game display name normalization
 * Maps internal game names to user-friendly display names
 */
export const GAME_DISPLAY_NAMES = {
  'palworld': 'Palworld',
  'minecraft': 'Minecraft',
  'minecraftserver': 'Minecraft',
  'factorio': 'Factorio',
  'satisfactory': 'Satisfactory',
  'enshrouded': 'Enshrouded',
}

/**
 * Get player slot mapping for a game
 * @param {string} gameName - Game name (case-insensitive)
 * @returns {object|null} Player slot mapping or null if not found
 */
export function getGamePlayerMapping(gameName) {
  const normalizedName = gameName?.toLowerCase().trim()
  return GAME_PLAYER_MAPPINGS[normalizedName] || null
}

/**
 * Get display name for a game
 * @param {string} gameName - Game name (case-insensitive)
 * @returns {string} Display name or original name if not found
 */
export function getGameDisplayName(gameName) {
  const normalizedName = gameName?.toLowerCase().trim()
  return GAME_DISPLAY_NAMES[normalizedName] || (gameName?.charAt(0).toUpperCase() + gameName?.slice(1))
}

/**
 * Get closest RAM tier for a game
 * @param {string} gameName - Game name
 * @param {number} ramGB - RAM amount in GB
 * @returns {number|null} Closest RAM tier or null if game not found
 */
export function getClosestRAMTier(gameName, ramGB) {
  const mapping = getGamePlayerMapping(gameName)
  if (!mapping) return null

  const ramTiers = Object.keys(mapping).map(Number).sort((a, b) => a - b)
  let closest = ramTiers[0]

  for (const tier of ramTiers) {
    if (ramGB >= tier) {
      closest = tier
    }
  }

  return closest
}

/**
 * Get player count for RAM configuration
 * @param {string} gameName - Game name
 * @param {number} ramGB - RAM amount in GB
 * @returns {number|null} Player count or null if not found
 */
export function getPlayerCountForRAM(gameName, ramGB) {
  const mapping = getGamePlayerMapping(gameName)
  if (!mapping) return null

  const closestTier = getClosestRAMTier(gameName, ramGB)
  return closestTier ? mapping[closestTier] : null
}
