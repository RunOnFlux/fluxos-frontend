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
        importMode: 'sync',
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
        ],
        dts: 'src/auto-imports.d.ts',
        vueTemplate: true,
        eslintrc: {
          enabled: isDev,
          filepath: './eslintrc-auto-import.cjs',
        },
      }),
      VueI18nPlugin({
        runtimeOnly: true,
        compositionOnly: true,
        include: [
          fileURLToPath(new URL('./src/plugins/i18n/locales/**', import.meta.url)),
        ],
      }),
      svgLoader(),
    ],
    define: {
      'process.env': {},
      global: 'globalThis', // ✅ important for some node packages
      // Disable Lit dev mode in production
      ...(mode === 'production' && {
        'globalThis.litIssuedWarnings': 'false',
        'globalThis.litDevMode': 'false',
      }),
    },
    resolve: {
      alias: {
        ...aliases,
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
      proxy: {
        '/api/proposals': {
          target: 'https://stats.runonflux.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/proposals/, '/proposals'),
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 5000,
      commonjsOptions: {
        include: [/node_modules/, /@metamask\/.*/,/eventemitter2/],
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vuetify: ['vuetify'],
            apexcharts: ['vue3-apexcharts'],
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
        'buffer',
        'process',
        'events',
        'util',
        'eventemitter2',
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
