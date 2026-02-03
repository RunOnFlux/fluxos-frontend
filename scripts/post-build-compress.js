/**
 * Post-build compression script
 * Runs gzip and brotli compression on built assets as a separate process
 * This reduces memory usage during the main build by running compression afterwards
 */

import { createReadStream, createWriteStream, promises as fs } from 'fs'
import { createGzip, createBrotliCompress, constants } from 'zlib'
import { pipeline } from 'stream/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../dist')
const THRESHOLD = 1024 // Only compress files > 1KB

// File extensions to compress
const COMPRESSIBLE = /\.(js|css|html|json|svg|txt|xml|ico|map)$/i

async function getAllFiles(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await getAllFiles(fullPath, files)
    } else if (COMPRESSIBLE.test(entry.name) && !entry.name.endsWith('.gz') && !entry.name.endsWith('.br')) {
      const stat = await fs.stat(fullPath)
      if (stat.size > THRESHOLD) {
        files.push(fullPath)
      }
    }
  }
  
  return files
}

async function compressFile(filePath, algorithm) {
  const ext = algorithm === 'gzip' ? '.gz' : '.br'
  const outPath = filePath + ext

  // Skip if already exists
  try {
    await fs.access(outPath)
    
    return null // Already compressed
  } catch {
    // File doesn't exist, proceed
  }

  const readStream = createReadStream(filePath)
  const writeStream = createWriteStream(outPath)

  const compressor = algorithm === 'gzip'
    ? createGzip({ level: 9 })
    : createBrotliCompress({
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
      },
    })

  await pipeline(readStream, compressor, writeStream)

  const originalSize = (await fs.stat(filePath)).size
  const compressedSize = (await fs.stat(outPath)).size

  return { originalSize, compressedSize, algorithm }
}

async function main() {
  console.log('🗜️  Post-build compression starting...\n')

  const startTime = Date.now()
  const files = await getAllFiles(DIST_DIR)

  console.log(`Found ${files.length} compressible files\n`)

  let totalOriginal = 0
  let totalGzip = 0
  let totalBrotli = 0
  let processed = 0

  // Process files sequentially to minimize memory usage
  for (const file of files) {
    const relativePath = path.relative(DIST_DIR, file)

    // Gzip
    const gzipResult = await compressFile(file, 'gzip')
    if (gzipResult) {
      totalOriginal += gzipResult.originalSize
      totalGzip += gzipResult.compressedSize
    }

    // Brotli
    const brotliResult = await compressFile(file, 'brotli')
    if (brotliResult) {
      totalBrotli += brotliResult.compressedSize
    }

    processed++
    if (processed % 50 === 0) {
      console.log(`  Processed ${processed}/${files.length} files...`)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log(`\n✅ Compression complete in ${elapsed}s`)
  console.log(`   Original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   Gzip:     ${(totalGzip / 1024 / 1024).toFixed(2)} MB (${((1 - totalGzip/totalOriginal) * 100).toFixed(1)}% reduction)`)
  console.log(`   Brotli:   ${(totalBrotli / 1024 / 1024).toFixed(2)} MB (${((1 - totalBrotli/totalOriginal) * 100).toFixed(1)}% reduction)`)
}

main().catch(err => {
  console.error('Compression failed:', err)
  process.exit(1)
})
