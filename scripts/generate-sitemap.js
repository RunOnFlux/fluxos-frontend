/**
 * Dynamic Sitemap Generator for FluxCloud
 * Generates sitemap.xml with current date as lastmod
 * Fetches marketplace apps and games from API for comprehensive SEO coverage
 * Run with: node scripts/generate-sitemap.js
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Base URL for all sitemap entries
const BASE_URL = 'https://cloud.runonflux.com'

// API Configuration
const MARKETPLACE_API_URL = 'https://api.marketplace.runonflux.io'
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

// Define static URLs with their priorities and change frequencies.
// `source` points to the page's Vue file so lastmod can be derived from git.
const staticUrls = [
  // High Priority Pages
  {
    loc: '/',
    source: 'src/pages/dashboards/home.vue',
    priority: SEO_PRIORITY.HIGHEST,
    changefreq: 'daily',
    description: 'Homepage',
  },
  {
    loc: '/cost-calculator',
    source: 'src/pages/cost-calculator.vue',
    priority: SEO_PRIORITY.HIGH,
    changefreq: 'weekly',
    description: 'Cost Calculator',
  },
  {
    loc: '/flux-drive',
    source: 'src/pages/flux-drive.vue',
    priority: SEO_PRIORITY.HIGH,
    changefreq: 'weekly',
    description: 'FluxDrive',
  },
  {
    loc: '/marketplace/games',
    source: 'src/pages/marketplace/games/index.vue',
    priority: SEO_PRIORITY.HIGH,
    changefreq: 'weekly',
    description: 'Games Landing Page',
  },
  // WordPress hosting moved to the dedicated site (wordpress.runonflux.com).
  // /marketplace/wordpress 301s there, so it is deliberately absent from the
  // sitemap — the dedicated site owns the WordPress search intent.

  // Comparison hub + pages (see src/content/comparisons.js)
  {
    loc: '/compare',
    source: 'src/pages/compare/index.vue',
    priority: SEO_PRIORITY.HIGH,
    changefreq: 'weekly',
    description: 'Cloud hosting comparisons hub',
  },
  {
    loc: '/compare/flux-vs-aws',
    source: 'src/content/comparisons.js',
    priority: SEO_PRIORITY.MEDIUM,
    changefreq: 'monthly',
    description: 'Comparison: FluxCloud vs AWS',
  },
  {
    loc: '/compare/flux-vs-digitalocean',
    source: 'src/content/comparisons.js',
    priority: SEO_PRIORITY.MEDIUM,
    changefreq: 'monthly',
    description: 'Comparison: FluxCloud vs DigitalOcean',
  },
  {
    loc: '/compare/flux-vs-google-cloud',
    source: 'src/content/comparisons.js',
    priority: SEO_PRIORITY.MEDIUM,
    changefreq: 'monthly',
    description: 'Comparison: FluxCloud vs Google Cloud',
  },
  {
    loc: '/compare/flux-vs-azure',
    source: 'src/content/comparisons.js',
    priority: SEO_PRIORITY.MEDIUM,
    changefreq: 'monthly',
    description: 'Comparison: FluxCloud vs Azure',
  },
  {
    loc: '/compare/flux-vs-vultr',
    source: 'src/content/comparisons.js',
    priority: SEO_PRIORITY.MEDIUM,
    changefreq: 'monthly',
    description: 'Comparison: FluxCloud vs Vultr',
  },
  {
    loc: '/compare/flux-vs-linode',
    source: 'src/content/comparisons.js',
    priority: SEO_PRIORITY.MEDIUM,
    changefreq: 'monthly',
    description: 'Comparison: FluxCloud vs Linode',
  },
  {
    loc: '/compare/flux-vs-akash',
    source: 'src/content/comparisons.js',
    priority: SEO_PRIORITY.MEDIUM,
    changefreq: 'monthly',
    description: 'Comparison: FluxCloud vs Akash',
  },
  {
    loc: '/compare/cheapest-cloud-hosting',
    source: 'src/content/comparisons.js',
    priority: SEO_PRIORITY.HIGH,
    changefreq: 'monthly',
    description: 'Guide: Cheapest cloud hosting',
  },
  {
    loc: '/compare/what-is-decentralized-cloud-hosting',
    source: 'src/content/comparisons.js',
    priority: SEO_PRIORITY.HIGH,
    changefreq: 'monthly',
    description: 'Guide: What is decentralized cloud hosting',
  },
  {
    loc: '/compare/web3-hosting-explained',
    source: 'src/content/comparisons.js',
    priority: SEO_PRIORITY.HIGH,
    changefreq: 'monthly',
    description: 'Guide: Web3 hosting explained',
  },

  // Dashboard Pages
  {
    loc: '/dashboards/overview',
    source: 'src/pages/dashboards/overview.vue',
    priority: SEO_PRIORITY.MEDIUM,
    changefreq: 'daily',
    description: 'Flux Network Overview',
  },
  {
    loc: '/marketplace',
    source: 'src/pages/marketplace/index.vue',
    priority: SEO_PRIORITY.MEDIUM,
    changefreq: 'weekly',
    description: 'Marketplace',
  },
  {
    loc: '/dashboards/resources',
    source: 'src/pages/dashboards/resources.vue',
    priority: SEO_PRIORITY.STANDARD,
    changefreq: 'daily',
    description: 'Flux Network Resources',
  },
  {
    loc: '/dashboards/locations',
    source: 'src/pages/dashboards/locations.vue',
    priority: SEO_PRIORITY.STANDARD,
    changefreq: 'weekly',
    description: 'Flux Node Locations',
  },
  {
    loc: '/apps/register',
    source: 'src/pages/apps/register/index.vue',
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
 * Resolve the canonical slug for an app/game. Must match the page's canonical
 * URL (src/pages/marketplace/[id].vue), the internal links, and the backend
 * resolver — all of which use the lowercased name. Diverging here would make
 * the sitemap advertise URLs that contradict the page's rel=canonical.
 */
function canonicalSlug(app) {
  const raw = app.name || generateSlug(app.displayName)

  return raw ? raw.toString().toLowerCase() : null
}

/**
 * Resolve a page's last-modified date (YYYY-MM-DD) from git history.
 * Returns null when git or the file is unavailable so the caller can fall back.
 */
function getGitLastModified(relativePath) {
  if (!relativePath) return null

  try {
    const repoRoot = path.join(__dirname, '..')
    if (!fs.existsSync(path.join(repoRoot, relativePath))) return null

    const out = execSync(`git log -1 --format=%cs -- "${relativePath}"`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()

    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null
  } catch {
    return null
  }
}

/**
 * Resolve a marketplace app's last-modified date (YYYY-MM-DD) from whatever
 * timestamp field the API provides. Falls back to the current date.
 */
function getAppLastModified(app) {
  const ts = app.updatedAt || app.updated_at || app.lastModified
    || app.modified || app.dateModified

  if (ts) {
    const date = new Date(ts)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  }

  return currentDate
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
function generateUrlEntry({ loc, priority, changefreq, description, lastmod }) {
  const fullUrl = loc.startsWith('http') ? loc : `${BASE_URL}${loc}`

  return `
  <!-- ${description} -->
  <url>
    <loc>${escapeXml(fullUrl)}</loc>
    <lastmod>${lastmod || currentDate}</lastmod>
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

  // Start with static URLs, resolving an accurate per-page lastmod from git
  const allUrls = staticUrls.map(url => ({
    ...url,
    lastmod: getGitLastModified(url.source) || currentDate,
  }))

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

  // Add marketplace app URLs.
  // Apps with a redirectUrl are skipped: their detail pages set rel=canonical
  // to the dedicated site, so including them here would contradict the
  // canonical signal we want Google to follow.
  const existingLocs = new Set(staticUrls.map(u => u.loc))
  let redirectSkippedApps = 0
  let redirectSkippedGames = 0

  for (const app of marketplaceApps) {
    if (app.redirectUrl) {
      redirectSkippedApps++
      continue
    }
    const slug = canonicalSlug(app)
    if (slug) {
      const loc = `/marketplace/${slug}`
      if (!existingLocs.has(loc)) {
        existingLocs.add(loc)
        allUrls.push({
          loc,
          lastmod: getAppLastModified(app),
          priority: SEO_PRIORITY.STANDARD,
          changefreq: 'weekly',
          description: `Marketplace App: ${app.displayName || app.name}`,
        })
      }
    }
  }

  // Add trending game URLs
  for (const game of trendingGames) {
    if (game.redirectUrl) {
      redirectSkippedGames++
      continue
    }
    const slug = canonicalSlug(game)
    if (slug) {
      const loc = `/marketplace/games/${slug}`
      if (!existingLocs.has(loc)) {
        existingLocs.add(loc)
        allUrls.push({
          loc,
          lastmod: getAppLastModified(game),
          priority: SEO_PRIORITY.MEDIUM,
          changefreq: 'weekly',
          description: `Game Server: ${game.displayName || game.name}`,
        })
      }
    }
  }

  if (redirectSkippedApps || redirectSkippedGames) {
    console.log(`   ↩️  Skipped (canonical → dedicated site): ${redirectSkippedApps} apps, ${redirectSkippedGames} games`)
  }

  console.log(`\n   📄 Static URLs: ${staticUrls.length}`)
  console.log(`   📄 Marketplace app URLs: ${marketplaceApps.length - redirectSkippedApps}`)
  console.log(`   📄 Game URLs: ${trendingGames.length - redirectSkippedGames}`)
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
