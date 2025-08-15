import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pluginVue from 'eslint-plugin-vue'
import pluginImport from 'eslint-plugin-import'
import pluginPromise from 'eslint-plugin-promise'
import pluginSonarjs from 'eslint-plugin-sonarjs'
import pluginCasePolice from 'eslint-plugin-case-police'
import pluginRegexp from 'eslint-plugin-regexp'
import pluginRegex from 'eslint-plugin-regex'
import vueParser from 'vue-eslint-parser'
import babelParser from '@babel/eslint-parser'

const baseDir = path.dirname(fileURLToPath(import.meta.url))

const aliases = {
  '@': path.resolve(baseDir, './src'),
  '@themeConfig': path.resolve(baseDir, './themeConfig.js'),
  '@core': path.resolve(baseDir, './src/@core'),
  '@layouts': path.resolve(baseDir, './src/@layouts'),
  '@images': path.resolve(baseDir, './src/assets/images/'),
  '@styles': path.resolve(baseDir, './src/assets/styles/'),
  '@configured-variables': path.resolve(baseDir, './src/assets/styles/variables/_template.scss'),
  '@db': path.resolve(baseDir, './src/plugins/fake-api/handlers/'),
  '@api-utils': path.resolve(baseDir, './src/plugins/fake-api/utils/'),
}

export default [
  {
    files: ['**/*.js', '**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: babelParser,
        ecmaVersion: 2022,
        sourceType: 'module',
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-env'],
        },
      },
      globals: {
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
      },
    },
    plugins: {
      vue: pluginVue,
      import: pluginImport,
      promise: pluginPromise,
      sonarjs: pluginSonarjs,
      casePolice: pluginCasePolice,
      regexp: pluginRegexp,
      regex: pluginRegex,
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'comma-spacing': ['error', { before: false, after: true }],
      'key-spacing': ['error', { afterColon: true }],
      'semi': ['error', 'never'],
      'indent': ['error', 2],
      'vue/html-indent': ['error', 2, {
        attribute: 1,
        baseIndent: 1,
        closeBracket: 0,
        alignAttributesVertically: true,
        ignores: [],
      }],
      'camelcase': 'error',
      'arrow-parens': ['error', 'as-needed'],
      'newline-before-return': 'error',
      'lines-around-comment': ['error', {
        beforeBlockComment: true,
        beforeLineComment: true,
        allowBlockStart: true,
        allowClassStart: true,
        allowObjectStart: true,
        allowArrayStart: true,
        ignorePattern: '!SECTION',
      }],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'max-len': 'off',
      'no-shadow': 'off',
      'array-element-newline': ['error', 'consistent'],
      'array-bracket-newline': ['error', 'consistent'],
      'vue/valid-v-if': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/first-attribute-linebreak': ['error', { singleline: 'beside', multiline: 'below' }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase', {
        registeredComponentsOnly: false,
        ignores: ['/^swiper-/', 'media-player', 'media-poster', 'media-provider', 'media-video-layout'],
      }],
      'vue/custom-event-name-casing': ['error', 'camelCase', {
        ignores: ['/^(click):[a-z]+((\\d)|([A-Z0-9][a-z0-9]+))*([A-Z])?/', 'media-player', 'media-poster', 'media-provider', 'media-video-layout'],
      }],
      'vue/require-default-prop': 'off',
      'vue/valid-v-slot': 'off',
      'vue/no-restricted-class': 'off',
      'vue/block-tag-newline': 'error',
      'vue/component-api-style': 'error',
      'vue/define-macros-order': 'error',
      'vue/html-comment-content-newline': 'error',
      'vue/html-comment-content-spacing': 'error',
      'vue/html-comment-indent': 'error',
      'vue/match-component-file-name': 'error',
      'vue/no-child-content': 'error',
      'vue/no-duplicate-attr-inheritance': 'error',
      'vue/no-empty-component-block': 'error',
      'vue/no-multiple-objects-in-class': 'error',
      'vue/no-reserved-component-names': 'error',
      'vue/no-template-target-blank': 'error',
      'vue/no-useless-mustaches': 'error',
      'vue/no-useless-v-bind': 'error',
      'vue/padding-line-between-blocks': 'error',
      'vue/prefer-separate-static-class': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',
      'vue/no-irregular-whitespace': 'error',
      'vue/template-curly-spacing': 'error',
      'import/prefer-default-export': 'off',
      'import/extensions': ['error', 'ignorePackages', {
        js: 'never', jsx: 'never', ts: 'never', tsx: 'never', vue: 'always',
      }],
      'import/no-unresolved': ['error', {
        ignore: ['~pages$', 'virtual:generated-layouts', '#auth$', '#components$', '.*\\?raw', '\\.svg\\?url$', '\\.png\\?url$', '\\.jpg\\?url$', '.*\\?raw$', 'virtual:.*'],
      }],
      'import/newline-after-import': ['error', { count: 1 }],
      'no-restricted-imports': ['error', 'vuetify/components', {
        name: 'vue3-apexcharts',
        message: 'apexcharts are auto imported',
      }],
      'promise/always-return': 'off',
      'promise/catch-or-return': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      'regex/invalid': [
        'error',
        [
          {
            regex: '@/assets/images',
            replacement: '@images',
            message: 'Use \'@images\' path alias for image imports',
          },
          {
            regex: '@/assets/styles',
            replacement: '@styles',
            message: 'Use \'@styles\' path alias for importing styles from \'src/assets/styles\'',
          },
          {
            regex: '@core/\\w',
            message: 'You can\'t use @core when you are in @layouts module',
            files: {
              inspect: '@layouts/.*',
            },
          },
          {
            regex: 'useLayouts\\(',
            message: '`useLayouts` composable is only allowed in @layouts & @core directory. Please use `useThemeConfig` composable instead.',
            files: {
              inspect: '^(?!.*(@core|@layouts)).*',
            },
          },
        ],
      ],
    },
    settings: {
      'import/resolver': {
        node: true,
        alias: {
          map: Object.entries(aliases),
          extensions: ['.js', '.jsx', '.ts', '.vue'],
        },
      },
    },
  },
  {
    ignores: ['node_modules/', 'dist/', '*.d.ts', 'vendor/', 'vite.config.js', 'eslint.config.js','*auto-imports.d.ts'],
  },
]
