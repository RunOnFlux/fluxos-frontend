/**
 * Post-build image optimization script
 * Runs Sharp image optimization as a separate process to reduce memory during main build
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../dist')

// Dynamically import sharp only when needed
let sharp

async function loadSharp() {
  if (!sharp) {
    const module = await import('sharp')
    sharp = module.default
  }
  return sharp
}

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp)$/i
const EXCLUDE_PATTERN = /logo\.(png|svg)|favicon\.ico/i

async function getAllImages(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await getAllImages(fullPath, files)
    } else if (IMAGE_EXTENSIONS.test(entry.name) && !EXCLUDE_PATTERN.test(entry.name)) {
      files.push(fullPath)
    }
  }
  return files
}

async function optimizeImage(filePath) {
  const sharpLib = await loadSharp()
  const ext = path.extname(filePath).toLowerCase()
  const originalSize = (await fs.stat(filePath)).size

  let optimized

  try {
    const image = sharpLib(filePath)

    switch (ext) {
      case '.png':
        optimized = await image.png({ quality: 75, compressionLevel: 9 }).toBuffer()
        break
      case '.jpg':
      case '.jpeg':
        optimized = await image.jpeg({ quality: 75, progressive: true }).toBuffer()
        break
      case '.webp':
        optimized = await image.webp({ quality: 75 }).toBuffer()
        break
      case '.gif':
        optimized = await image.gif().toBuffer()
        break
      default:
        return null
    }

    // Only write if smaller
    if (optimized.length < originalSize) {
      await fs.writeFile(filePath, optimized)
      return { originalSize, optimizedSize: optimized.length }
    }

    return { originalSize, optimizedSize: originalSize, skipped: true }
  } catch (err) {
    console.warn(`  Warning: Could not optimize ${path.basename(filePath)}: ${err.message}`)
    return null
  }
}

async function main() {
  console.log('🖼️  Post-build image optimization starting...\n')

  const startTime = Date.now()
  const images = await getAllImages(DIST_DIR)

  console.log(`Found ${images.length} images to optimize\n`)

  let totalOriginal = 0
  let totalOptimized = 0
  let processed = 0
  let skipped = 0

  // Process images one at a time to minimize memory (Sharp can be memory-hungry)
  for (const image of images) {
    const result = await optimizeImage(image)

    if (result) {
      totalOriginal += result.originalSize
      totalOptimized += result.optimizedSize
      if (result.skipped) skipped++
    }

    processed++
    if (processed % 20 === 0) {
      console.log(`  Processed ${processed}/${images.length} images...`)
    }

    // Force garbage collection hint between images
    if (global.gc) global.gc()
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const savedBytes = totalOriginal - totalOptimized
  const savedPercent = totalOriginal > 0 ? ((savedBytes / totalOriginal) * 100).toFixed(1) : 0

  console.log(`\n✅ Image optimization complete in ${elapsed}s`)
  console.log(`   Original: ${(totalOriginal / 1024).toFixed(2)} KB`)
  console.log(`   Optimized: ${(totalOptimized / 1024).toFixed(2)} KB`)
  console.log(`   Saved: ${(savedBytes / 1024).toFixed(2)} KB (${savedPercent}%)`)
  console.log(`   Skipped (already optimal): ${skipped}`)
}

main().catch(err => {
  console.error('Image optimization failed:', err)
  process.exit(1)
})
