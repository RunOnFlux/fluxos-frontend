/**
 * Generate the social-share (Open Graph / Twitter) image for FluxCloud.
 *
 * Produces a 1200x630 PNG — the size expected by `summary_large_image`
 * Twitter cards and Open Graph — composed from the brand gradient, the Flux
 * logo, and the marketing headline. Run with: node scripts/generate-og-image.js
 *
 * Output: public/images/og-image.png
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WIDTH = 1200
const HEIGHT = 630

const logoPath = path.join(__dirname, '../public/images/logo.png')
const outputPath = path.join(__dirname, '../public/images/og-image.png')

// Background + text layer. Brand gradient (Flux blue → indigo) with the
// headline and key facts. Logo is composited on top separately.
const background = Buffer.from(`
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1437" />
      <stop offset="55%" stop-color="#13235e" />
      <stop offset="100%" stop-color="#2196F3" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7367F0" />
      <stop offset="100%" stop-color="#2196F3" />
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

  <!-- subtle decorative ring -->
  <circle cx="1050" cy="120" r="220" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="2" />
  <circle cx="1050" cy="120" r="150" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2" />

  <!-- accent bar -->
  <rect x="100" y="250" width="72" height="6" rx="3" fill="url(#accent)" />

  <text x="100" y="210" font-family="DejaVu Sans, Arial, sans-serif" font-size="40" font-weight="700" fill="#ffffff" letter-spacing="1">FluxCloud</text>
  <text x="100" y="330" font-family="DejaVu Sans, Arial, sans-serif" font-size="62" font-weight="700" fill="#ffffff">Decentralized Web3</text>
  <text x="100" y="400" font-family="DejaVu Sans, Arial, sans-serif" font-size="62" font-weight="700" fill="#ffffff">Cloud Infrastructure</text>
  <text x="100" y="470" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" font-weight="400" fill="#c7d2fe">8,000+ FluxNodes worldwide  ·  From $0.99/month</text>
</svg>`)

async function main() {
  if (!fs.existsSync(logoPath)) {
    console.error(`❌ Logo not found at ${logoPath}`)
    process.exit(1)
  }

  // Resize the logo to sit in the top-right area.
  const logo = await sharp(logoPath)
    .resize({ width: 230, height: 230, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  await sharp(background)
    .composite([{ input: logo, top: 80, left: 870 }])
    .png()
    .toFile(outputPath)

  console.log(`✅ OG image generated at ${outputPath} (${WIDTH}x${HEIGHT})`)
}

main().catch(err => {
  console.error('❌ Error generating OG image:', err)
  process.exit(1)
})
