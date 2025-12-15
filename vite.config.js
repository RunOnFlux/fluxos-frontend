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
import { aliases } from './aliases.mjs';

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
        // PNG optimization
        png: {
          quality: 80,
        },
        // JPEG optimization
        jpeg: {
          quality: 80,
        },
        // JPG optimization
        jpg: {
          quality: 80,
        },
        // WebP conversion
        webp: {
          quality: 80,
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
                  // Removed removeViewBox from overrides - moved to separate plugin below
                },
              },
            },
            {
              name: 'removeViewBox',
              active: false, // Disable removeViewBox to preserve viewBox attributes
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
      chunkSizeWarningLimit: 1800, // Warn about chunks larger than 1800KB
      reportCompressedSize: true, // Report gzip sizes
      minify: 'esbuild', // Use esbuild for fast builds
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
