/**
 * Dynamic Sitemap Generator for FluxCloud
 * Generates sitemap.xml with current date as lastmod
 * Fetches marketplace apps and games from API for comprehensive SEO coverage
 * Run with: node scripts/generate-sitemap.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Base URL for all sitemap entries
const BASE_URL = 'https://cloud.runonflux.com'

// API Configuration
const MARKETPLACE_API_URL = 'https://jetpackbridge.runonflux.io'
const API_VERSION = 1

// Games category UUIDs (used to separate games from regular marketplace apps)
const GAMES_CATEGORY_UUIDS = [
  '53542105-d2c4-41a7-9fe5-2cf0c6a60018', // Games
  '7ce5a03c-b808-478b-94a1-2a1b3eaaeb36', // NewGames
]

// SEO Priority Constants for sitemap
const SEO_PRIORITY = Object.freeze({
  HIGHEST: 1.0,   // Homepage
  HIGH: 0.9,      // Main landing pages (calculator, flux-drive, games, wordpress)
  MEDIUM: 0.8,    // Dashboard overview, marketplace index, game detail pages
  STANDARD: 0.7,  // Dashboard pages, marketplace app detail pages, app registration
})

// Get current date in ISO format (YYYY-MM-DD)
const currentDate = new Date().toISOString().split('T')[0]

// Define static URLs with their priorities and change frequencies
const staticUrls = [
  // High Priority Pages
  {
    loc: '/',
    priority: SEO_PRIORITY.HIGHEST,
    changefreq: 'daily',
    description: 'Homepage',
  },
  {
    loc: '/cost-calculator',
    priority: SEO_PRIORITY.HIGH,
    changefreq: 'weekly',
    description: 'Cost Calculator',
  },
  {
    loc: '/flux-drive',
    priority: SEO_PRIORITY.HIGH,
    changefreq: 'weekly',
    description: 'FluxDrive',
  },
  {
    loc: '/marketplace/games',
    priority: SEO_PRIORITY.HIGH,
    changefreq: 'weekly',
    description: 'Games Landing Page',
  },
  {
    loc: '/marketplace/wordpress',
    priority: SEO_PRIORITY.HIGH,
    changefreq: 'weekly',
    description: 'WordPress Hosting',
  },

  // Dashboard Pages
  {
    loc: '/dashboards/overview',
    priority: SEO_PRIORITY.MEDIUM,
    changefreq: 'daily',
    description: 'Flux Network Overview',
  },
  {
    loc: '/marketplace',
    priority: SEO_PRIORITY.MEDIUM,
    changefreq: 'weekly',
    description: 'Marketplace',
  },
  {
    loc: '/dashboards/resources',
    priority: SEO_PRIORITY.STANDARD,
    changefreq: 'daily',
    description: 'Flux Network Resources',
  },
  {
    loc: '/dashboards/locations',
    priority: SEO_PRIORITY.STANDARD,
    changefreq: 'weekly',
    description: 'Flux Node Locations',
  },
  {
    loc: '/apps/register',
    priority: SEO_PRIORITY.STANDARD,
    changefreq: 'monthly',
    description: 'App Registration',
  },
]

/**
 * Fetch all apps from the marketplace API
 */
async function fetchAllApps() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

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
      console.error('❌ Fetch marketplace apps timed out after 10 seconds')
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
    const timeoutId = setTimeout(() => controller.abort(), 10000)

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
      console.error('❌ Fetch trending games timed out after 10 seconds')
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
 * Escape special XML characters
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Generate XML for a single URL entry
 */
function generateUrlEntry({ loc, priority, changefreq, description }) {
  const fullUrl = loc.startsWith('http') ? loc : `${BASE_URL}${loc}`

  return `
  <!-- ${description} -->
  <url>
    <loc>${escapeXml(fullUrl)}</loc>
    <lastmod>${currentDate}</lastmod>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
  </url>`
}

/**
 * Generate complete sitemap XML
 */
function generateSitemap(urls) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`

  urls.forEach(url => {
    xml += generateUrlEntry(url)
  })

  xml += `
</urlset>`

  return xml
}

/**
 * Main function to generate sitemap with dynamic routes
 */
async function main() {
  console.log('\n📡 Generating sitemap with dynamic marketplace routes...\n')

  // Start with static URLs
  const allUrls = [...staticUrls]

  // Fetch marketplace data
  const [allApps, trendingGameUUIDs] = await Promise.all([
    fetchAllApps(),
    fetchTrendingGamesUUIDs(),
  ])

  console.log(`   📦 Total apps fetched: ${allApps.length}`)
  console.log(`   🎮 Trending game UUIDs: ${trendingGameUUIDs.length}`)

  // Separate games from regular apps
  const marketplaceApps = allApps.filter(app => !GAMES_CATEGORY_UUIDS.includes(app.category))
  const trendingGames = trendingGameUUIDs
    .map(uuid => allApps.find(app => app.uuid === uuid))
    .filter(app => app !== undefined)

  console.log(`   🏪 Marketplace apps (excluding games): ${marketplaceApps.length}`)
  console.log(`   ⭐ Trending games: ${trendingGames.length}`)

  // Add marketplace app URLs
  const existingLocs = new Set(staticUrls.map(u => u.loc))

  for (const app of marketplaceApps) {
    const slug = app.name || generateSlug(app.displayName)
    if (slug) {
      const loc = `/marketplace/${slug}`
      if (!existingLocs.has(loc)) {
        existingLocs.add(loc)
        allUrls.push({
          loc,
          priority: SEO_PRIORITY.STANDARD,
          changefreq: 'weekly',
          description: `Marketplace App: ${app.displayName || app.name}`,
        })
      }
    }
  }

  // Add trending game URLs
  for (const game of trendingGames) {
    const slug = game.name || generateSlug(game.displayName)
    if (slug) {
      const loc = `/marketplace/games/${slug}`
      if (!existingLocs.has(loc)) {
        existingLocs.add(loc)
        allUrls.push({
          loc,
          priority: SEO_PRIORITY.MEDIUM,
          changefreq: 'weekly',
          description: `Game Server: ${game.displayName || game.name}`,
        })
      }
    }
  }

  console.log(`\n   📄 Static URLs: ${staticUrls.length}`)
  console.log(`   📄 Marketplace app URLs: ${marketplaceApps.length}`)
  console.log(`   📄 Game URLs: ${trendingGames.length}`)
  console.log(`   📄 Total URLs: ${allUrls.length}`)

  // Generate and write sitemap
  const sitemap = generateSitemap(allUrls)
  const outputPath = path.join(__dirname, '../public/sitemap.xml')

  try {
    fs.writeFileSync(outputPath, sitemap, 'utf8')
    console.log(`\n✅ Sitemap generated successfully at ${outputPath}`)
    console.log(`📅 Last modified date: ${currentDate}`)
    console.log(`📊 Total URLs: ${allUrls.length}`)
  } catch (error) {
    console.error('❌ Error writing sitemap:', error)
    process.exit(1)
  }
}

// Execute
main().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
