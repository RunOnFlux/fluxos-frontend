import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { fileURLToPath } from 'node:url';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { VueRouterAutoImports, getPascalCaseRouteName } from 'unplugin-vue-router';
import VueRouter from 'unplugin-vue-router/vite';
import { defineConfig } from 'vite';
import VueDevTools from 'vite-plugin-vue-devtools';
import { ClientSideLayout } from 'vite-plugin-vue-layouts';
import vuetify from 'vite-plugin-vuetify';
import svgLoader from 'vite-svg-loader';
import { visualizer } from 'rollup-plugin-visualizer';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import compression from 'vite-plugin-compression';
import purgecss from 'vite-plugin-purgecss';
import { VitePWA } from 'vite-plugin-pwa';
import { aliases } from './aliases.mjs';

// Critical CSS plugin using critters
function criticalCssPlugin() {
  return {
    name: 'vite-plugin-critical-css',
    apply: 'build',
    enforce: 'post',
    async transformIndexHtml(html, ctx) {
      // Only process in build mode
      if (!ctx.bundle) return html;

      try {
        const Critters = (await import('critters')).default;
        const critters = new Critters({
          // Inline critical CSS
          inlineFonts: false,
          // Preload external stylesheets
          preload: 'swap',
          // Don't remove original stylesheets (let browser load them async)
          pruneSource: false,
          // Reduce unused CSS rules in inlined styles
          reduceInlineStyles: true,
          // Use media="print" trick for async loading
          noscriptFallback: true,
          // Merge inlined styles
          mergeStylesheets: true,
        });

        // Process HTML with critters
        const result = await critters.process(html);
        console.log('✅ Critical CSS extracted and inlined');
        return result;
      } catch (error) {
        console.warn('⚠️ Critical CSS extraction failed:', error.message);
        return html;
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [
      VueRouter({
        getRouteName: routeNode => {
          return getPascalCaseRouteName(routeNode)
            .replace(/([a-z\d])([A-Z])/g, '$1-$2')
            .toLowerCase();
        },
        importMode: 'async',
      }),
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'swiper-container' || tag === 'swiper-slide',
          },
        },
      }),
      isDev && VueDevTools(),
      vueJsx(),
      vuetify({
        styles: {
          configFile: 'src/assets/styles/variables/_vuetify.scss',
        },
      }),
      ClientSideLayout({
        layoutsDir: 'src/layouts',
        importMode: 'async',
      }),
      Components({
        dirs: ['src/@core/components', 'src/views/demos', 'src/components'],
        dts: 'src/components.d.ts',
        deep: true,
        resolvers: [
          (componentName) => {
            if (componentName === 'VueApexCharts')
              return { name: 'default', from: 'vue3-apexcharts', as: 'VueApexCharts' };
          },
        ],
      }),
      AutoImport({
        imports: ['vue', VueRouterAutoImports, '@vueuse/core', '@vueuse/math', 'vue-i18n', 'pinia'],
        dirs: [
          './src/@core/utils',
          './src/@core/composable/',
          './src/composables/',
          './src/utils/',
          './src/plugins/*/composables/*',
          './src/plugins/analytics/composables/*',
        ],
        dts: 'src/auto-imports.d.ts',
        vueTemplate: true,
        eslintrc: {
          enabled: isDev,
          filepath: './eslintrc-auto-import.cjs',
        },
      }),
      VueI18nPlugin({
        runtimeOnly: false,
        compositionOnly: true,
        strictMessage: false,
        include: [
          fileURLToPath(new URL('./src/plugins/i18n/locales/*.json', import.meta.url)),
        ],
      }),
      svgLoader(),
      // Monaco Editor - bundle editor files locally instead of loading from CDN
      monacoEditorPlugin.default({}),
      // Image optimization for production builds
      ViteImageOptimizer({
        // Test patterns for which images to include
        test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
        // Exclude patterns
        exclude: undefined,
        // Include patterns
        include: undefined,
        // Include assets from public folder
        includePublic: true,
        // Log stats
        logStats: true,
        // AVIF - best compression for modern browsers
        avif: {
          quality: 70,
        },
        // PNG optimization - more aggressive compression
        png: {
          quality: 75,
          compressionLevel: 9,
        },
        // JPEG optimization - more aggressive
        jpeg: {
          quality: 75,
          progressive: true,
        },
        // JPG optimization
        jpg: {
          quality: 75,
          progressive: true,
        },
        // WebP conversion - excellent compression
        webp: {
          quality: 75,
          alphaQuality: 80,
        },
        // GIF optimization
        gif: {
          interlaced: true,
        },
        // SVG optimization
        svg: {
          multipass: true,
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  cleanupNumericValues: false,
                },
              },
            },
            {
              name: 'removeViewBox',
              active: false, // Preserve viewBox attributes
            },
            {
              name: 'removeDimensions',
              active: true, // Remove width/height, use viewBox instead
            },
          ],
        },
      }),
      // Bundle analyzer - generates stats.html
      visualizer({
        filename: 'dist/stats.html',
        open: false, // Set to true to auto-open in browser
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // 'sunburst', 'treemap', 'network'
      }),
      // Gzip compression for production builds
      !isDev && compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024, // Only compress files > 1KB
        deleteOriginFile: false, // Keep original files for fallback
      }),
      // Brotli compression for production builds (better compression than gzip)
      !isDev && compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false,
      }),
      // PurgeCSS to remove unused CSS (production only)
      !isDev && purgecss({
        content: [
          './index.html',
          './src/**/*.vue',
          './src/**/*.js',
          './src/**/*.ts',
          './src/**/*.jsx',
          './src/**/*.tsx',
        ],
        safelist: {
          // Vuetify uses dynamic classes extensively
          standard: [
            /^v-/, // All Vuetify classes
            /^mdi-/, // MDI icons
            /^tabler-/, // Tabler icons
            /^theme--/, // Theme classes
            /^elevation-/, // Elevation utilities
            /^rounded-/, // Border radius utilities
            /^text-/, // Text utilities
            /^bg-/, // Background utilities
            /^d-/, // Display utilities
            /^flex-/, // Flex utilities
            /^justify-/, // Justify utilities
            /^align-/, // Align utilities
            /^ma-/, /^mt-/, /^mb-/, /^ml-/, /^mr-/, /^mx-/, /^my-/, // Margin utilities
            /^pa-/, /^pt-/, /^pb-/, /^pl-/, /^pr-/, /^px-/, /^py-/, // Padding utilities
            /^ga-/, /^gt-/, /^gb-/, /^gl-/, /^gr-/, /^gx-/, /^gy-/, // Gap utilities
            /^w-/, /^h-/, // Width/height utilities
            /^font-/, // Font utilities
            /^opacity-/, // Opacity utilities
            /^overflow-/, // Overflow utilities
            /^position-/, // Position utilities
            /^cursor-/, // Cursor utilities
            /^el-/, // Element Plus classes
            /^leaflet-/, // Leaflet map classes
            /^apexcharts/, // ApexCharts classes
            /^xterm/, // xterm classes
            /^monaco/, // Monaco editor classes
            /^shepherd/, // Shepherd.js tour classes
            /data-v-/, // Vue scoped styles
          ],
          deep: [
            /v-application/,
            /v-theme/,
            /v-locale/,
            /v-overlay/,
            /v-menu/,
            /v-dialog/,
            /v-snackbar/,
            /v-tooltip/,
            /v-card/,
            /v-btn/,
            /v-chip/,
            /v-alert/,
            /v-table/,
            /v-data-table/,
            /v-select/,
            /v-autocomplete/,
            /v-text-field/,
            /v-textarea/,
            /v-checkbox/,
            /v-radio/,
            /v-switch/,
            /v-slider/,
            /v-tabs/,
            /v-expansion/,
            /v-list/,
            /v-navigation/,
            /v-app-bar/,
            /v-footer/,
            /v-img/,
            /v-avatar/,
            /v-icon/,
            /v-badge/,
            /v-progress/,
            /v-skeleton/,
            /v-divider/,
            /v-timeline/,
            /v-stepper/,
            /v-form/,
            /v-file/,
            /v-color/,
            /v-date/,
            /v-time/,
            /v-pagination/,
            /v-breadcrumbs/,
            /v-rating/,
            /v-carousel/,
            /v-window/,
            /v-sheet/,
            /v-responsive/,
            /v-container/,
            /v-row/,
            /v-col/,
            /v-spacer/,
          ],
          greedy: [
            /transition/,
            /animate/,
            /fade/,
            /slide/,
            /scale/,
            /scroll/,
          ],
        },
        // Don't remove CSS variables
        variables: false,
      }),
      // PWA for offline caching and performance (production only)
      !isDev && VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['images/logo.png', 'images/logo.svg', 'favicon.ico'],
        workbox: {
          // Precache static assets (excluding large files)
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          // Exclude large files and dev tools from precaching
          globIgnores: [
            'stats.html', // Bundle analyzer (4MB+)
            '**/monacoeditorwork/**', // Monaco workers (12MB+)
            '**/crypto-walletconnect*', // WalletConnect (4MB+)
            '**/crypto-viem*', // Viem (1MB+)
            '**/syntax-highlight*', // Syntax highlighting (1MB+)
          ],
          // Increase limit to 5MB for remaining large chunks (CSS)
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // Runtime caching for API requests and images
          runtimeCaching: [
            {
              // Cache Google Fonts
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Cache Google Font files
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Cache images with stale-while-revalidate
              urlPattern: /\.(?:png|gif|jpg|jpeg|webp|avif|svg)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              // Cache API responses with network-first
              urlPattern: /^https:\/\/api\.runonflux\.io\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
                networkTimeoutSeconds: 10,
              },
            },
            {
              // Cache stats API responses
              urlPattern: /^https:\/\/stats\.runonflux\.io\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'stats-api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
        manifest: {
          name: 'FluxCloud - Decentralized Web3 Cloud',
          short_name: 'FluxCloud',
          description: 'Deploy applications on FluxCloud\'s decentralized Web3 infrastructure',
          theme_color: '#7367F0',
          background_color: '#FFFFFF',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/images/logo.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/images/logo.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/images/logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: false, // Disable in development
        },
      }),
      // Critical CSS extraction (production only)
      !isDev && criticalCssPlugin(),
    ],
    define: {
      'process.env': {},
      global: 'globalThis', // ✅ important for some node packages
      // Map buffer/process to window globals (loaded from index.html)
      'Buffer': 'window.Buffer',
      'process': 'window.process',
      // Disable Lit dev mode in production
      ...(mode === 'production' && {
        'globalThis.litIssuedWarnings': 'false',
        'globalThis.litDevMode': 'false',
      }),
    },
    resolve: {
      alias: {
        ...aliases,
        // Point buffer and process to stub modules - actual polyfills loaded from index.html
        'buffer': fileURLToPath(new URL('./src/polyfills/buffer-stub.js', import.meta.url)),
        'process': fileURLToPath(new URL('./src/polyfills/process-stub.js', import.meta.url)),
      },
    },
    server: {
      watch: {
        ignored: ['**/node_modules/**', '**/.git/**'],
        usePolling: false,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 100,
        },
      },
      hmr: {
        overlay: true,
        protocol: 'ws',
        host: 'localhost',
        port: 3000,
      },
      host: '0.0.0.0',
      port: 3000,
      open: isDev,
      headers: {
        // Allow Firebase popups on localhost by setting COOP to unsafe-none
        'Cross-Origin-Opener-Policy': 'unsafe-none',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      },
      proxy: {
        '/api/proposals': {
          target: 'https://stats.runonflux.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/proposals/, '/proposals'),
        },
      },
    },
    build: {
      // Target modern browsers to avoid legacy polyfills (~11KB savings)
      // Supports: Chrome 87+, Firefox 78+, Safari 14+, Edge 88+
      target: 'esnext',
      chunkSizeWarningLimit: 1800, // Warn about chunks larger than 1800KB
      reportCompressedSize: true, // Report gzip sizes
      minify: 'esbuild', // Use esbuild for fast builds
      cssMinify: 'esbuild', // Also minify CSS with esbuild
      commonjsOptions: {
        include: [/node_modules/, /@metamask\/.*/,/eventemitter2/],
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Polyfills strategy: Bundle buffer, process, eventemitter2 into main entry
            // This ensures they load BEFORE any async chunks
            // NO chunking for polyfills - let them inline in entry
            if (id.includes('node_modules/buffer') || id.includes('node_modules\\buffer') ||
                id.includes('node_modules/process') || id.includes('node_modules\\process') ||
                id.includes('node_modules/eventemitter2') || id.includes('node_modules\\eventemitter2')) {
              // Don't chunk - stay with entry chunk
              return undefined
            }

            // Skip non-node_modules
            if (!id.includes('node_modules')) {
              return undefined
            }

            // PRIORITY 1: Crypto libraries FIRST (before any other rules)
            // These are large and need to be chunked to keep main bundle small

            // Crypto - MetaMask SDK (separate to reduce initial load)
            if (id.includes('@metamask')) {
              return 'crypto-metamask'
            }

            // Crypto - WalletConnect/Reown + wallet dependencies + shared crypto primitives
            // Bundle @noble/@scure WITH walletconnect to avoid circular deps
            // WalletConnect is the primary user of these crypto primitives
            if (id.includes('@reown') || id.includes('@walletconnect') ||
                id.includes('@solana') || id.includes('porto') || id.includes('@coinbase') ||
                id.includes('@base-org') || id.includes('coinbase') ||
                id.includes('@gemini-wallet') || id.includes('@safe-global') || id.includes('@msgpack') ||
                id.includes('@noble') || id.includes('@scure')) {
              return 'crypto-walletconnect'
            }

            // Crypto - Wagmi/Viem (including @wagmi scoped packages)
            if (id.includes('wagmi') || id.includes('viem') || id.includes('@wagmi')) {
              return 'crypto-viem'
            }

            // Crypto - React Query (wagmi dependency) - separate from crypto
            if (id.includes('@tanstack')) {
              return 'react-query'
            }

            // OX library (crypto related)
            if (id.includes('/ox/')) {
              return 'crypto-ox'
            }

            // Encryption - OpenPGP
            if (id.includes('openpgp')) {
              return 'pgp'
            }

            // Firebase (large, lazy loadable)
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'firebase'
            }

            // Code Editor - Monaco (huge, lazy load)
            if (id.includes('monaco-editor') || id.includes('vue-monaco-editor')) {
              return 'monaco'
            }

            // PRIORITY 2: UI Frameworks and Components

            // UI Framework - Vuetify
            if (id.includes('vuetify')) {
              return 'vuetify'
            }

            // Element Plus (if used)
            if (id.includes('element-plus')) {
              return 'element-plus'
            }

            // Charts & Visualization
            if (id.includes('apexcharts') || id.includes('vue3-apexcharts')) {
              return 'apexcharts'
            }
            if (id.includes('chart.js') || id.includes('vue-chartjs')) {
              return 'chartjs'
            }

            // Maps - Leaflet
            if (id.includes('leaflet.markercluster')) {
              return 'leaflet-cluster'
            }
            if (id.includes('leaflet') || id.includes('vue-leaflet')) {
              return 'leaflet-core'
            }

            // Terminal - xterm
            if (id.includes('@xterm') || id.includes('xterm')) {
              return 'xterm'
            }

            // Rich Text Editor - Tiptap
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'tiptap'
            }

            // Code Highlighting
            if (id.includes('highlight.js') || id.includes('prismjs') || id.includes('shiki')) {
              return 'syntax-highlight'
            }

            // Internationalization
            if (id.includes('vue-i18n') || id.includes('@intlify')) {
              return 'i18n'
            }

            // VueUse utilities
            if (id.includes('@vueuse')) {
              return 'vueuse'
            }

            // Lodash utilities
            if (id.includes('lodash')) {
              return 'lodash'
            }

            // Carousel - Swiper
            if (id.includes('swiper')) {
              return 'swiper'
            }

            // JSON viewer
            if (id.includes('vue-json-pretty')) {
              return 'json-viewer'
            }

            // Date picker
            if (id.includes('flatpickr')) {
              return 'datepicker'
            }

            // Drag and drop
            if (id.includes('draggable') || id.includes('@formkit/drag-and-drop')) {
              return 'drag-drop'
            }

            // Shepherd.js (guided tours)
            if (id.includes('shepherd')) {
              return 'shepherd'
            }

            // YAML parser
            if (id.includes('js-yaml')) {
              return 'yaml'
            }

            // Core Vue ecosystem - keep together
            if (id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-core'
            }

            // Axios and HTTP
            if (id.includes('axios')) {
              return 'http'
            }

            // DOMPurify
            if (id.includes('dompurify')) {
              return 'sanitizer'
            }

            // Date utilities
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) {
              return 'date-utils'
            }

            // Geospatial utilities (used with leaflet)
            if (id.includes('@turf')) {
              return 'geo-utils'
            }

            // 3D rendering (if used)
            if (id.includes('three')) {
              return 'three'
            }

            // Vue core - keep all @vue packages in main bundle (small, essential)
            // @vue/compiler-* and @vue/devtools-* are build-time only, not in runtime

            // QR code - keep in vendor-misc to avoid CommonJS module.exports issues
            // (qrcode uses process which is bundled in vendor-misc)

            // Perfect scrollbar
            if (id.includes('perfect-scrollbar')) {
              return 'scrollbar'
            }

            // Clipboard
            if (id.includes('clipboard')) {
              return 'clipboard'
            }

            // LZ-String compression
            if (id.includes('lz-string')) {
              return 'compression'
            }

            // CASL authorization
            if (id.includes('@casl')) {
              return 'casl'
            }

            // Eventemitter and eventemitter2 - DO NOT CHUNK
            // main.js imports eventemitter2 and sets window.EventEmitter2
            // vendor-scoped and other chunks need this available immediately
            // Let it stay in main bundle for guaranteed availability

            // UUID library
            if (id.includes('uuid')) {
              return 'uuid'
            }

            // Socket.io and related
            if (id.includes('socket.io') || id.includes('engine.io')) {
              return 'socketio'
            }

            // Floating UI
            if (id.includes('@floating-ui')) {
              return 'floating-ui'
            }

            // Phosphor icons (large icon library used by wallets)
            if (id.includes('@phosphor-icons')) {
              return 'phosphor-icons'
            }

            // Iconify and MDI icons
            if (id.includes('@iconify') || id.includes('@mdi') || id.includes('mdi')) {
              return 'icons-mdi'
            }

            // Lit web components (used by wallets)
            if (id.includes('@lit')) {
              return 'lit'
            }

            // @ctrl packages - only @ctrl/tinycolor exists (small, stays in main bundle)

            // @unhead packages (SEO/head management)
            if (id.includes('@unhead')) {
              return 'unhead'
            }

            // @ucast packages (CASL dependencies)
            if (id.includes('@ucast')) {
              return 'casl'
            }

            // QR code library - keep in vendor-misc to avoid module.exports issues
            // (qrcode uses CommonJS and needs to load with other vendor code)
            // if (id.includes('qr') || id.includes('qrcode')) {
            //   return 'qrcode'
            // }

            // Query string parsers
            if (id.includes('/qs/') || id.includes('\\qs\\') || id.includes('query-string')) {
              return 'query-parser'
            }

            // Mitt event emitter
            if (id.includes('mitt')) {
              return 'event-utils'
            }

            // ANSI to HTML converter
            if (id.includes('ansi-to-html')) {
              return 'ansi-utils'
            }

            // JWT decode
            if (id.includes('jwt-decode')) {
              return 'jwt'
            }

            // @vueuse/head (SEO)
            if (id.includes('@vueuse/head')) {
              return 'unhead'
            }

            // Cookie handling
            if (id.includes('cookie-es')) {
              return 'cookie'
            }

            // destr, ufo, ofetch (unjs ecosystem - keep together)
            if (id.includes('destr') || id.includes('ufo') || id.includes('ofetch')) {
              return 'unjs-utils'
            }

            // Axios retry
            if (id.includes('axios-retry')) {
              return 'http'
            }

            // Keep Vue core in main bundle (essential for app)
            // Don't split these to vendor chunks
            if (id.includes('@vue/') || id.includes('/vue/')) {
              return undefined  // Stay in main bundle
            }

            // DISABLED: Vendor catch-all strategy
            // This was causing circular dependency with crypto-walletconnect
            // Let remaining packages stay in main bundle instead
            //
            // const excludeFromVendor = [
            //   'eventemitter2', 'buffer', 'process',
            //   '@vue/', '/vue/', 'pinia', 'vue-router',
            //   '@metamask', '@reown', '@walletconnect', '@solana', 'porto', '@coinbase',
            //   '@base-org', '@gemini-wallet', '@safe-global', '@msgpack',
            //   '@noble', '@scure', 'wagmi', 'viem', '@wagmi', '@tanstack', '/ox/',
            // ]
            //
            // const shouldExclude = excludeFromVendor.some(pattern => id.includes(pattern))
            // if (!shouldExclude) {
            //   if (id.includes('node_modules/@')) {
            //     const match = id.match(/node_modules\/@([^/]+)/)
            //     if (match) {
            //       const scope = match[1]
            //       return `vendor-${scope}`
            //     }
            //   }
            //   return 'vendor-misc'
            // }

            return undefined
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        'leaflet',
        'leaflet.markercluster',
        '@metamask/sdk',
        '@metamask/providers',
        'events',
        'util',
        // NOTE: buffer, process, eventemitter2 removed from here
        // They need to stay in main bundle (not pre-bundled)
      ],
      exclude: [
        'vuetify',
        'dompurify',
        'vue-i18n',
        '@intlify/core-base',
        '@intlify/vue-i18n-bridge',
        '@intlify/unplugin-vue-i18n',
      ],
      entries: ['./src/**/*.vue'],
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    logLevel: isDev ? 'debug' : 'info',
  };
});
