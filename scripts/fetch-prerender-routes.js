/**
 * Fetch Pre-render Routes from Marketplace API
 *
 * This script fetches all marketplace apps and games from the API
 * and generates a list of routes to pre-render for SEO.
 *
 * Run: node scripts/fetch-prerender-routes.js
 * Output: Writes routes to scripts/prerender-routes.json
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// API Configuration
const MARKETPLACE_API_URL = 'https://jetpackbridge.runonflux.io'
const API_VERSION = 1
const API_TIMEOUT_MS = 10000 // 10 second timeout for API requests

// Games category UUIDs (excluded from marketplace apps, shown in games section)
const GAMES_CATEGORY_UUIDS = [
  '53542105-d2c4-41a7-9fe5-2cf0c6a60018', // Games
  '7ce5a03c-b808-478b-94a1-2a1b3eaaeb36', // NewGames
]

// Static routes that should always be pre-rendered
// Note: Homepage '/' is excluded - it has static SEO meta tags in index.html
// and prerendering it can cause hydration issues with interactive components
const STATIC_ROUTES = [
  '/marketplace',
  '/marketplace/wordpress',
  '/marketplace/games',
  '/flux-drive',
  '/apps/register',
  '/cost-calculator',
  '/dashboards/overview',
  '/dashboards/resources',
  '/dashboards/locations',
]

/**
 * Fetch all apps from the marketplace API
 */
async function fetchAllApps() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    const response = await fetch(`${MARKETPLACE_API_URL}/api/v${API_VERSION}/marketplace/apps`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await response.json()

    if (data && data.status === 'success') {
      let apps = data.data || []

      // Filter visible and enabled apps
      apps = apps.filter(app => app.visible !== false && app.enabled !== false)

      return apps
    }

    return []
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`❌ Fetch marketplace apps timed out after ${API_TIMEOUT_MS / 1000} seconds`)
    } else {
      console.error('❌ Failed to fetch marketplace apps:', error.message)
    }

    return []
  }
}

/**
 * Fetch trending games UUIDs from the API
 */
async function fetchTrendingGamesUUIDs() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    const response = await fetch(`${MARKETPLACE_API_URL}/api/v${API_VERSION}/marketplace/trending`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await response.json()

    if (data && data.status === 'success') {
      return data.data?.data || []
    }

    return []
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`❌ Fetch trending games timed out after ${API_TIMEOUT_MS / 1000} seconds`)
    } else {
      console.error('❌ Failed to fetch trending games:', error.message)
    }

    return []
  }
}

/**
 * Generate URL-safe slug from app name
 */
function generateSlug(name) {
  if (!name) return null

  // The app routes use the app name directly (lowercase)
  return name.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Main function to fetch routes and generate the routes file
 */
async function main() {
  console.log('\n📡 Fetching marketplace data for pre-render routes...\n')

  // Fetch all data in parallel
  const [allApps, trendingGameUUIDs] = await Promise.all([
    fetchAllApps(),
    fetchTrendingGamesUUIDs(),
  ])

  console.log(`   📦 Total apps fetched: ${allApps.length}`)
  console.log(`   🎮 Trending game UUIDs: ${trendingGameUUIDs.length}`)

  // Separate games from regular apps
  const marketplaceApps = allApps.filter(app => !GAMES_CATEGORY_UUIDS.includes(app.category))
  const allGames = allApps.filter(app => GAMES_CATEGORY_UUIDS.includes(app.category))

  // Get trending games (games that are in the trending list)
  const trendingGames = trendingGameUUIDs
    .map(uuid => allApps.find(app => app.uuid === uuid))
    .filter(app => app !== undefined)

  console.log(`   🏪 Marketplace apps (excluding games): ${marketplaceApps.length}`)
  console.log(`   🎮 Games in games category: ${allGames.length}`)
  console.log(`   ⭐ Trending games: ${trendingGames.length}`)

  // Generate routes
  const routes = [...STATIC_ROUTES]

  // Add marketplace app routes (/marketplace/[id])
  const appRoutes = []
  for (const app of marketplaceApps) {
    const slug = app.name || generateSlug(app.displayName)
    if (slug) {
      appRoutes.push(`/marketplace/${slug}`)
    }
  }

  // Add game routes (/marketplace/games/[name])
  // Use trending games for the games section (as per the API design)
  const gameRoutes = []
  for (const game of trendingGames) {
    const slug = game.name || generateSlug(game.displayName)
    if (slug) {
      gameRoutes.push(`/marketplace/games/${slug}`)
    }
  }

  // Combine all routes
  routes.push(...appRoutes)
  routes.push(...gameRoutes)

  // Remove duplicates
  const uniqueRoutes = [...new Set(routes)]

  console.log(`\n   📄 Static routes: ${STATIC_ROUTES.length}`)
  console.log(`   📄 App routes: ${appRoutes.length}`)
  console.log(`   📄 Game routes: ${gameRoutes.length}`)
  console.log(`   📄 Total unique routes: ${uniqueRoutes.length}`)

  // Write routes to JSON file
  const outputPath = path.join(__dirname, 'prerender-routes.json')
  const output = {
    generatedAt: new Date().toISOString(),
    staticRoutes: STATIC_ROUTES,
    appRoutes,
    gameRoutes,
    allRoutes: uniqueRoutes,
    stats: {
      totalApps: allApps.length,
      marketplaceApps: marketplaceApps.length,
      gamesInCategory: allGames.length,
      trendingGames: trendingGames.length,
      totalRoutes: uniqueRoutes.length,
    },
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`\n✅ Routes saved to: ${outputPath}`)

  // Also output just the routes array for easy consumption
  const routesOnlyPath = path.join(__dirname, 'prerender-routes-list.json')
  fs.writeFileSync(routesOnlyPath, JSON.stringify(uniqueRoutes, null, 2))
  console.log(`✅ Routes list saved to: ${routesOnlyPath}`)

  return uniqueRoutes
}

main().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
