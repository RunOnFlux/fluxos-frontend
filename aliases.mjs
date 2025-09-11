import path from 'node:path'
import { fileURLToPath } from 'node:url'

const baseDir = path.dirname(fileURLToPath(import.meta.url))

export const aliases = {
  '@': path.resolve(baseDir, './src'),
  '@themeConfig': path.resolve(baseDir, './themeConfig.js'),
  '@core': path.resolve(baseDir, './src/@core'),
  '@layouts': path.resolve(baseDir, './src/@layouts'),
  '@images': path.resolve(baseDir, './src/assets/images/'),
  '@styles': path.resolve(baseDir, './src/assets/styles/'),
  '@configured-variables': path.resolve(baseDir, './src/assets/styles/variables/_template.scss'),
}
