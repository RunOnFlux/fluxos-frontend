import { ref, onMounted } from 'vue'

/**
 * Composable for handling optimized images with WebP support and fallback
 *
 * Features:
 * - Automatically detects browser WebP support
 * - Returns WebP URL if supported, otherwise fallback format
 * - Caches browser capability detection
 */

// Cache the WebP support check
let webpSupported = null

/**
 * Detect if browser supports WebP
 * @returns {Promise<boolean>}
 */
async function detectWebPSupport() {
  if (webpSupported !== null) {
    return webpSupported
  }

  return new Promise(resolve => {
    const webP = new Image()
    webP.onload = webP.onerror = function () {
      webpSupported = webP.height === 2
      resolve(webpSupported)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

/**
 * Get optimized image URL with WebP support
 * @param {string} imagePath - Original image path (e.g., '/banner/FluxPlay.png')
 * @returns {ref<string>} Reactive image URL
 */
export function useOptimizedImage(imagePath) {
  const optimizedUrl = ref(imagePath)
  const isWebPSupported = ref(false)

  onMounted(async () => {
    isWebPSupported.value = await detectWebPSupport()

    if (isWebPSupported.value && imagePath) {
      // Convert .png to .webp
      const webpPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp')

      // Check if WebP version exists by attempting to load it
      const img = new Image()
      img.onload = () => {
        optimizedUrl.value = webpPath
      }
      img.onerror = () => {
        // WebP doesn't exist, keep original
        optimizedUrl.value = imagePath
      }
      img.src = webpPath
    }
  })

  return {
    url: optimizedUrl,
    isWebPSupported,
  }
}

/**
 * Get picture element sources for responsive images with WebP support
 * @param {string} imagePath - Original image path
 * @returns {object} Object with webp and fallback sources
 */
export function getPictureSources(imagePath) {
  if (!imagePath) return { webp: '', fallback: imagePath }

  const webpPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp')

  return {
    webp: webpPath,
    fallback: imagePath,
  }
}

/**
 * Get optimized image path synchronously (for SSR)
 * Prefers WebP if available
 * @param {string} imagePath - Original image path
 * @returns {string} Optimized image path
 */
export function getOptimizedImagePath(imagePath) {
  if (!imagePath) return ''

  // In production, prefer WebP (most modern browsers support it)
  // The browser will fallback to PNG if WebP isn't available
  return imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp')
}
