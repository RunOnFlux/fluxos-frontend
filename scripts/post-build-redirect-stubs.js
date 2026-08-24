/**
 * Post-build redirect stubs
 *
 * Writes a static redirect document into dist/ for every entry in
 * scripts/retired-routes.js, replacing whatever the SPA would otherwise serve at
 * that path.
 *
 * Runs right after `vite build` and before post-build-compress.js, so the stub is
 * picked up by gzip/brotli like any other html file. It must NOT run after the
 * prerender step; retired routes are filtered out of the prerender lists instead.
 *
 * The stub carries three redirect signals so both crawlers and browsers land on
 * the dedicated site:
 *   - <link rel="canonical">      consolidates the indexed URL onto the new one
 *   - <meta http-equiv="refresh"> instant meta refresh, which Google Search reads
 *                                 as a redirect when the delay is 0
 *   - location.replace()          moves real browsers without a history entry
 * A visible link is kept as the no-JS fallback.
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { RETIRED_ROUTES } from './retired-routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../dist')

const escapeHtml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

function buildStub({ to, title, body, linkText }) {
  const target = escapeHtml(to)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<style>
:root { color-scheme: dark light; }
body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #25293C;
  color: rgba(255, 255, 255, 0.87);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  text-align: center;
  padding: 24px;
}
a { color: #2B61D1; }
</style>
</head>
<body>
<main>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(body)}</p>
<p><a href="${target}">${escapeHtml(linkText)}</a></p>
</main>
<script>window.location.replace(${JSON.stringify(to)})</script>
</body>
</html>
`
}

async function main() {
  try {
    await fs.access(DIST_DIR)
  } catch {
    console.error(`❌ dist/ not found at ${DIST_DIR} — run the build first`)
    process.exitCode = 1

    return
  }

  for (const route of RETIRED_ROUTES) {
    const outputDir = path.join(DIST_DIR, route.from)
    const outputPath = path.join(outputDir, 'index.html')

    await fs.mkdir(outputDir, { recursive: true })
    await fs.writeFile(outputPath, buildStub(route), 'utf-8')
    console.log(`  ↪️  ${route.from} → ${route.to}`)
  }

  console.log(`✅ Wrote ${RETIRED_ROUTES.length} redirect stub(s) to dist/`)
}

main().catch(error => {
  console.error('❌ Failed to write redirect stubs:', error)
  process.exitCode = 1
})
