// Memory monitoring utility for detecting memory leaks and high usage
// Author: FluxOS Team
// Purpose: Track memory usage patterns and alert on potential issues

const MEMORY_CHECK_INTERVAL = 60000 // Check every 60 seconds
const HIGH_MEMORY_THRESHOLD = 0.8 // Alert when using 80% of heap limit
const CRITICAL_MEMORY_THRESHOLD = 0.9 // Critical alert at 90%
const ENABLE_DETAILED_LOGGING = false // Set to true for verbose output

class MemoryMonitor {
  constructor() {
    this.intervalId = null
    this.memoryHistory = []
    this.maxHistoryLength = 30 // Keep last 30 measurements (30 minutes)
    this.isMonitoring = false
    this.listeners = []
  }

  /**
   * Start memory monitoring
   * @param {Object} options - Configuration options
   * @param {number} options.interval - Check interval in milliseconds
   * @param {number} options.highThreshold - High memory threshold (0-1)
   * @param {number} options.criticalThreshold - Critical memory threshold (0-1)
   * @param {boolean} options.detailedLogging - Enable detailed console logging
   */
  start(options = {}) {
    if (this.isMonitoring) {
      console.warn('[MemoryMonitor] Already monitoring')
      
      return
    }

    // Check if Performance Memory API is available
    if (!performance.memory) {
      console.warn('[MemoryMonitor] Performance Memory API not available in this browser')
      console.info('[MemoryMonitor] Available in Chrome/Edge with --enable-precise-memory-info flag')
      
      return
    }

    const config = {
      interval: options.interval || MEMORY_CHECK_INTERVAL,
      highThreshold: options.highThreshold || HIGH_MEMORY_THRESHOLD,
      criticalThreshold: options.criticalThreshold || CRITICAL_MEMORY_THRESHOLD,
      detailedLogging: options.detailedLogging ?? ENABLE_DETAILED_LOGGING,
    }

    this.isMonitoring = true
    console.info('[MemoryMonitor] Started monitoring (interval: %dms)', config.interval)

    this.intervalId = setInterval(() => {
      this.checkMemory(config)
    }, config.interval)

    // Initial check
    this.checkMemory(config)
  }

  /**
   * Stop memory monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.isMonitoring = false
      console.info('[MemoryMonitor] Stopped monitoring')
    }
  }

  /**
   * Check current memory usage
   * @private
   */
  checkMemory(config) {
    const memory = performance.memory

    const usedMB = memory.usedJSHeapSize / 1048576 // Bytes to MB
    const limitMB = memory.jsHeapSizeLimit / 1048576
    const totalMB = memory.totalJSHeapSize / 1048576
    const usageRatio = usedMB / limitMB

    const memoryInfo = {
      timestamp: Date.now(),
      used: usedMB,
      total: totalMB,
      limit: limitMB,
      usageRatio,
    }

    // Store in history
    this.memoryHistory.push(memoryInfo)
    if (this.memoryHistory.length > this.maxHistoryLength) {
      this.memoryHistory.shift()
    }

    // Check for memory issues
    if (usageRatio >= config.criticalThreshold) {
      console.error(
        '🚨 [MemoryMonitor] CRITICAL: Memory usage at %.1f%% (%.2f MB / %.2f MB)',
        usageRatio * 100,
        usedMB,
        limitMB,
      )
      this.notifyListeners('critical', memoryInfo)
    } else if (usageRatio >= config.highThreshold) {
      console.warn(
        '⚠️ [MemoryMonitor] HIGH: Memory usage at %.1f%% (%.2f MB / %.2f MB)',
        usageRatio * 100,
        usedMB,
        limitMB,
      )
      this.notifyListeners('high', memoryInfo)
    } else if (config.detailedLogging) {
      console.log(
        '✅ [MemoryMonitor] OK: Memory usage at %.1f%% (%.2f MB / %.2f MB)',
        usageRatio * 100,
        usedMB,
        limitMB,
      )
    }

    // Detect memory leaks (gradual increase over time)
    this.detectMemoryLeak(config)
  }

  /**
   * Detect potential memory leaks by analyzing trends
   * @private
   */
  detectMemoryLeak(config) {
    if (this.memoryHistory.length < 10) return // Need enough data

    const recent = this.memoryHistory.slice(-10) // Last 10 measurements
    const older = this.memoryHistory.slice(-20, -10) // Previous 10 measurements

    if (older.length < 10) return

    const recentAvg = recent.reduce((sum, m) => sum + m.used, 0) / recent.length
    const olderAvg = older.reduce((sum, m) => sum + m.used, 0) / older.length

    const increase = recentAvg - olderAvg
    const increasePercent = (increase / olderAvg) * 100

    // Alert if memory increased by more than 20% over the period
    if (increasePercent > 20) {
      console.warn(
        '📈 [MemoryMonitor] Potential memory leak detected: %.1f%% increase (%.2f MB → %.2f MB)',
        increasePercent,
        olderAvg,
        recentAvg,
      )
      this.notifyListeners('leak-detected', {
        increase,
        increasePercent,
        olderAvg,
        recentAvg,
      })
    }
  }

  /**
   * Register a listener for memory events
   * @param {Function} callback - Called with (eventType, data)
   */
  addListener(callback) {
    this.listeners.push(callback)
  }

  /**
   * Remove a listener
   * @param {Function} callback - The callback to remove
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * Notify all listeners
   * @private
   */
  notifyListeners(eventType, data) {
    this.listeners.forEach(callback => {
      try {
        callback(eventType, data)
      } catch (error) {
        console.error('[MemoryMonitor] Listener error:', error)
      }
    })
  }

  /**
   * Get current memory snapshot
   * @returns {Object|null} Memory info or null if API unavailable
   */
  getSnapshot() {
    if (!performance.memory) return null

    const memory = performance.memory
    
    return {
      timestamp: Date.now(),
      used: memory.usedJSHeapSize / 1048576,
      total: memory.totalJSHeapSize / 1048576,
      limit: memory.jsHeapSizeLimit / 1048576,
      usageRatio: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
    }
  }

  /**
   * Get memory history
   * @returns {Array} Array of memory snapshots
   */
  getHistory() {
    return [...this.memoryHistory]
  }

  /**
   * Get memory statistics
   * @returns {Object} Statistics about memory usage
   */
  getStats() {
    if (this.memoryHistory.length === 0) {
      return null
    }

    const used = this.memoryHistory.map(m => m.used)
    const min = Math.min(...used)
    const max = Math.max(...used)
    const avg = used.reduce((sum, val) => sum + val, 0) / used.length
    const current = this.memoryHistory[this.memoryHistory.length - 1]

    return {
      min,
      max,
      avg,
      current: current.used,
      trend: this.memoryHistory.length >= 2
        ? current.used - this.memoryHistory[0].used
        : 0,
      samples: this.memoryHistory.length,
    }
  }

  /**
   * Clear memory history
   */
  clearHistory() {
    this.memoryHistory = []
  }

  /**
   * Force garbage collection (if available)
   * Only works in Chrome DevTools or with --expose-gc flag
   */
  forceGC() {
    if (window.gc) {
      console.info('[MemoryMonitor] Forcing garbage collection...')
      window.gc()
      setTimeout(() => {
        const snapshot = this.getSnapshot()
        if (snapshot) {
          console.info(
            '[MemoryMonitor] After GC: %.2f MB used',
            snapshot.used,
          )
        }
      }, 100)
    } else {
      console.warn('[MemoryMonitor] GC not available. Run Chrome with --expose-gc flag.')
    }
  }

  /**
   * Analyze memory usage breakdown
   * Provides estimates of what's consuming memory
   * @returns {Object} Memory breakdown analysis
   */
  analyzeMemoryUsage() {
    const snapshot = this.getSnapshot()
    if (!snapshot) return null

    // Get heap breakdown
    const breakdown = {
      timestamp: Date.now(),
      totalUsed: snapshot.used,
      totalLimit: snapshot.limit,
      usageRatio: snapshot.usageRatio,
      categories: [],
    }

    // Estimate memory categories based on heap allocation
    const allocatedHeap = snapshot.total
    const usedHeap = snapshot.used
    const freeHeap = allocatedHeap - usedHeap

    // Add heap categories
    breakdown.categories.push({
      nameKey: 'memoryMonitor.categories.usedHeap',
      size: usedHeap,
      percentage: (usedHeap / snapshot.limit) * 100,
      descriptionKey: 'memoryMonitor.categories.usedHeapDesc',
    })

    breakdown.categories.push({
      nameKey: 'memoryMonitor.categories.freeHeap',
      size: freeHeap,
      percentage: (freeHeap / snapshot.limit) * 100,
      descriptionKey: 'memoryMonitor.categories.freeHeapDesc',
    })

    breakdown.categories.push({
      nameKey: 'memoryMonitor.categories.available',
      size: snapshot.limit - allocatedHeap,
      percentage: ((snapshot.limit - allocatedHeap) / snapshot.limit) * 100,
      descriptionKey: 'memoryMonitor.categories.availableDesc',
    })

    // Only analyze DOM if in browser environment
    if (typeof document !== 'undefined') {
      // Try to estimate object counts (approximation)
      try {
        // Count DOM nodes
        const domNodes = document.getElementsByTagName('*').length
        breakdown.domNodes = domNodes
        breakdown.categories.push({
          nameKey: 'memoryMonitor.categories.domNodes',
          size: (domNodes * 0.001), // Rough estimate: 1KB per node
          percentage: ((domNodes * 0.001) / snapshot.limit) * 100,
          descriptionKey: 'memoryMonitor.categories.domNodesDesc',
          count: domNodes,
        })

        // Count event listeners (approximation based on DOM nodes)
        const estimatedListeners = domNodes * 2 // Rough estimate
        breakdown.eventListeners = estimatedListeners
        breakdown.categories.push({
          nameKey: 'memoryMonitor.categories.eventListeners',
          size: (estimatedListeners * 0.0005), // Rough estimate: 0.5KB per listener
          percentage: ((estimatedListeners * 0.0005) / snapshot.limit) * 100,
          descriptionKey: 'memoryMonitor.categories.eventListenersDesc',
          count: estimatedListeners,
        })
      } catch (error) {
        console.warn('[MemoryMonitor] Could not analyze DOM:', error)
      }
    }

    // Add Vue component estimate if Vue is available (only in browser)
    if (typeof window !== 'undefined') {
      try {
        if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
          const vueInstances = window.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps || []
          breakdown.vueApps = vueInstances.length
          breakdown.categories.push({
            nameKey: 'memoryMonitor.categories.vueApps',
            size: vueInstances.length * 0.5, // Rough estimate: 0.5MB per app
            percentage: ((vueInstances.length * 0.5) / snapshot.limit) * 100,
            descriptionKey: 'memoryMonitor.categories.vueAppsDesc',
            count: vueInstances.length,
          })
        }
      } catch (error) {
        // Vue not available or error accessing
      }
    }

    return breakdown
  }

  /**
   * Get detailed memory report with analysis
   * @returns {Object} Comprehensive memory report
   */
  getDetailedReport() {
    const snapshot = this.getSnapshot()
    if (!snapshot) return null

    const stats = this.getStats()
    const breakdown = this.analyzeMemoryUsage()
    const history = this.getHistory()

    return {
      snapshot,
      stats,
      breakdown,
      history,
      recommendations: this.getRecommendations(snapshot, stats),
    }
  }

  /**
   * Get memory optimization recommendations
   * @private
   * @returns {Array} List of recommendations
   */
  getRecommendations(snapshot, stats) {
    const recommendations = []

    if (snapshot.usageRatio > 0.9) {
      recommendations.push({
        priority: 'critical',
        message: 'Memory usage is critically high. Consider closing unused tabs or refreshing the page.',
      })
    }

    if (snapshot.usageRatio > 0.75) {
      recommendations.push({
        priority: 'high',
        message: 'Memory usage is high. Monitor for memory leaks or excessive data loading.',
      })
    }

    if (stats && stats.trend > 50) {
      recommendations.push({
        priority: 'medium',
        message: `Memory has increased by ${stats.trend.toFixed(1)} MB since monitoring started. Check for memory leaks.`,
      })
    }

    const breakdown = this.analyzeMemoryUsage()
    if (breakdown && breakdown.domNodes > 5000) {
      recommendations.push({
        priority: 'medium',
        message: `Large number of DOM nodes (${breakdown.domNodes}). Consider implementing virtualization for long lists.`,
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'info',
        message: 'Memory usage is normal. No action required.',
      })
    }

    return recommendations
  }
}

// Create singleton instance
const memoryMonitor = new MemoryMonitor()

// Auto-start in development mode (check for window to avoid SSR issues)
if (typeof window !== 'undefined' && typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  memoryMonitor.start({
    interval: 60000, // 1 minute
    highThreshold: 0.75,
    criticalThreshold: 0.9,
    detailedLogging: false,
  })
}

export default memoryMonitor
export { MemoryMonitor }
