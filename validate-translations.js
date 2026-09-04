#!/usr/bin/env node

/**
 * Translation Validation Script for FluxOS Frontend
 * Validates translation files against TRANSLATION_RULES.md
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const enPath = path.join(__dirname, 'src/plugins/i18n/locales/en.json')
const plPath = path.join(__dirname, 'src/plugins/i18n/locales/pl.json')

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
}

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(80))
  log(`  ${title}`, 'bold')
  console.log('='.repeat(80) + '\n')
}

// Expected top-level namespaces according to TRANSLATION_RULES.md v2.1
const EXPECTED_NAMESPACES = [
  '$vuetify',
  'common',
  'menu',
  'sections',
  'core',
  'components',
  'pages',
]

// Expected structure for validation
const EXPECTED_STRUCTURE = {
  common: ['buttons', 'labels', 'status', 'messages', 'resources', 'time'],
  sections: ['dashboard', 'application', 'administration', 'fluxXdao'],
  pages: ['administration', 'apps', 'costCalculator', 'dashboard', 'fluxDrive', 'marketplace', 'xdao', 'error', 'successCheckout', 'unauthorized'],
}

function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    
    return JSON.parse(content)
  } catch (error) {
    log(`Error loading ${filePath}: ${error.message}`, 'red')
    process.exit(1)
  }
}

function getAllKeys(obj, prefix = '', result = []) {
  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      getAllKeys(obj[key], path, result)
    } else {
      result.push({ path, value: obj[key] })
    }
  }
  
  return result
}

function validateKeyNaming(keys) {
  const issues = []
  const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/
  const allowedAbbreviations = ['cpu', 'ram', 'url', 'ip', 'hdd', 'ssd', 'api', 'id', 'vCore', 'vCores', 'vcpu', 'ok']

  keys.forEach(({ path }) => {
    const parts = path.split('.')
    parts.forEach((part, index) => {
      // Skip $vuetify namespace and numeric keys (for arrays)
      if (part.startsWith('$') || /^\d+$/.test(part)) {
        return
      }

      // Check if it's a known allowed abbreviation
      if (allowedAbbreviations.includes(part)) {
        return
      }

      // Check camelCase
      if (!camelCaseRegex.test(part) && part !== part.toUpperCase()) {
        issues.push({
          path,
          issue: `Key "${part}" is not in camelCase format`,
          severity: 'warning',
        })
      }
    })
  })

  return issues
}

function checkStructuralConsistency(en, pl) {
  const issues = []

  // Check top-level namespaces
  const enNamespaces = Object.keys(en).sort()
  const plNamespaces = Object.keys(pl).sort()

  if (JSON.stringify(enNamespaces) !== JSON.stringify(plNamespaces)) {
    issues.push({
      type: 'namespace_mismatch',
      severity: 'error',
      message: 'Top-level namespaces do not match between en.json and pl.json',
      enNamespaces,
      plNamespaces,
    })
  }

  // Check for unexpected namespaces
  const unexpectedEn = enNamespaces.filter(ns => !EXPECTED_NAMESPACES.includes(ns))
  const unexpectedPl = plNamespaces.filter(ns => !EXPECTED_NAMESPACES.includes(ns))

  if (unexpectedEn.length > 0) {
    issues.push({
      type: 'unexpected_namespace',
      severity: 'error',
      message: `Unexpected top-level namespaces in en.json: ${unexpectedEn.join(', ')}`,
      expected: EXPECTED_NAMESPACES,
    })
  }

  if (unexpectedPl.length > 0) {
    issues.push({
      type: 'unexpected_namespace',
      severity: 'error',
      message: `Unexpected top-level namespaces in pl.json: ${unexpectedPl.join(', ')}`,
      expected: EXPECTED_NAMESPACES,
    })
  }

  // Validate expected structures
  for (const [namespace, expectedChildren] of Object.entries(EXPECTED_STRUCTURE)) {
    if (en[namespace]) {
      const enChildren = Object.keys(en[namespace])
      const missingChildren = expectedChildren.filter(child => !enChildren.includes(child))
      if (missingChildren.length > 0) {
        issues.push({
          type: 'missing_structure',
          severity: 'warning',
          message: `en.json: Missing expected children in "${namespace}": ${missingChildren.join(', ')}`,
        })
      }
    }

    if (pl[namespace]) {
      const plChildren = Object.keys(pl[namespace])
      const missingChildren = expectedChildren.filter(child => !plChildren.includes(child))
      if (missingChildren.length > 0) {
        issues.push({
          type: 'missing_structure',
          severity: 'warning',
          message: `pl.json: Missing expected children in "${namespace}": ${missingChildren.join(', ')}`,
        })
      }
    }
  }

  return issues
}

function findMissingKeys(enKeys, plKeys) {
  const enPaths = new Set(enKeys.map(k => k.path))
  const plPaths = new Set(plKeys.map(k => k.path))

  const missingInPl = [...enPaths].filter(path => !plPaths.has(path))
  const missingInEn = [...plPaths].filter(path => !enPaths.has(path))

  return { missingInPl, missingInEn }
}

function findUntranslatedValues(enKeys, plKeys) {
  const untranslated = []
  const plMap = new Map(plKeys.map(k => [k.path, k.value]))

  enKeys.forEach(({ path, value: enValue }) => {
    const plValue = plMap.get(path)

    if (plValue && typeof enValue === 'string' && typeof plValue === 'string') {
      // Simple heuristic: if values are identical and contain English words, it might be untranslated
      // This is not perfect but catches obvious cases
      if (enValue === plValue && enValue.length > 2) {
        // Check if it contains common English words
        const englishWords = ['the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'will', 'are', 'is']
        const lowerValue = enValue.toLowerCase()
        const hasEnglishWord = englishWords.some(word => lowerValue.includes(` ${word} `) || lowerValue.startsWith(`${word} `) || lowerValue.endsWith(` ${word}`))

        if (hasEnglishWord) {
          untranslated.push({ path, value: enValue })
        }
      }
    }
  })

  return untranslated
}

function checkForDuplicateValues(keys) {
  const valueMap = new Map()
  const duplicates = []

  keys.forEach(({ path, value }) => {
    if (typeof value === 'string' && value.length > 5) {
      if (!valueMap.has(value)) {
        valueMap.set(value, [])
      }
      valueMap.get(value).push(path)
    }
  })

  valueMap.forEach((paths, value) => {
    if (paths.length > 1) {
      duplicates.push({ value, paths })
    }
  })

  return duplicates
}

function checkParameterSyntax(keys) {
  const issues = []
  const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/

  keys.forEach(({ path, value }) => {
    if (typeof value === 'string') {
      // Check for {variable} syntax
      const matches = value.match(/\{[^}]+\}/g)
      if (matches) {
        matches.forEach(match => {
          const varName = match.slice(1, -1)

          // Check if variable name is camelCase
          if (!camelCaseRegex.test(varName)) {
            issues.push({
              path,
              parameter: match,
              issue: `Parameter "${match}" should use camelCase`,
            })
          }
        })
      }
    }
  })

  return issues
}

function getFileStats(filePath, keys) {
  const stats = fs.statSync(filePath)
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').length

  return {
    size: stats.size,
    sizeKB: (stats.size / 1024).toFixed(2),
    lines,
    totalKeys: keys.length,
  }
}

// Main validation function

/**
 * Every literal t('some.key') in src/ must resolve to a string in en.json.
 *
 * vue-i18n renders the key itself when it misses, so a typo'd or renamed key
 * does not fail loudly - it puts "core.subscriptionManager.pleaseEnterSignature"
 * on screen where a sentence belongs. Nothing caught that, and eight of them had
 * accumulated. Only literal keys are checked; t(variable) and t(`a.${b}`) are
 * skipped because their value is not knowable here - including the
 * t('a.prefix.' + suffix) form, whose completed key only exists at runtime.
 */
function validateUsedKeys(en) {
  const issues = []
  const srcDir = path.join(__dirname, 'src')
  const literalCall = /\bt\(\s*(['"])([a-zA-Z0-9_.$]+)\1/g

  const resolves = key => {
    let node = en
    for (const part of key.split('.')) {
      if (typeof node !== 'object' || node === null || !(part in node)) return false
      node = node[part]
    }

    return typeof node === 'string'
  }

  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (/\.(vue|js)$/.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf8')
        const lines = content.split('\n')
        for (const match of content.matchAll(literalCall)) {
          const key = match[2]
          if (!key.includes('.') || resolves(key)) continue

          // t('a.prefix.' + suffix): the literal is only half the key.
          const after = content.slice(match.index + match[0].length).match(/^\s*(.)/)
          if (key.endsWith('.') || (after && after[1] === '+')) continue

          const line = content.slice(0, match.index).split('\n').length

          issues.push({
            key,
            location: `${path.relative(__dirname, full)}:${line}`,
            context: (lines[line - 1] || '').trim().slice(0, 100),
          })
        }
      }
    }
  }

  walk(srcDir)

  return issues
}

function validateTranslations() {
  logSection('FluxOS Frontend Translation Validation Report')
  log(`Generated: ${new Date().toLocaleString()}`, 'cyan')
  log(`Rules Version: TRANSLATION_RULES.md v2.1 (2025-10-22)`, 'cyan')

  // Load translation files
  log('\nLoading translation files...', 'blue')
  const en = loadJSON(enPath)
  const pl = loadJSON(plPath)
  log('✓ Files loaded successfully', 'green')

  // Get all keys
  const enKeys = getAllKeys(en)
  const plKeys = getAllKeys(pl)

  // File statistics
  logSection('1. File Statistics')
  const enStats = getFileStats(enPath, enKeys)
  const plStats = getFileStats(plPath, plKeys)

  console.log('en.json:')
  console.log(`  - File size: ${enStats.sizeKB} KB`)
  console.log(`  - Lines: ${enStats.lines}`)
  console.log(`  - Total keys: ${enStats.totalKeys}`)

  console.log('\npl.json:')
  console.log(`  - File size: ${plStats.sizeKB} KB`)
  console.log(`  - Lines: ${plStats.lines}`)
  console.log(`  - Total keys: ${plStats.totalKeys}`)

  if (enStats.lines === plStats.lines) {
    log('\n✓ Line counts match perfectly!', 'green')
  } else {
    log(`\n✗ Line count mismatch: en.json has ${enStats.lines} lines, pl.json has ${plStats.lines} lines`, 'red')
  }

  // Structural consistency
  logSection('2. Structural Consistency')
  const structuralIssues = checkStructuralConsistency(en, pl)

  if (structuralIssues.length === 0) {
    log('✓ No structural issues found', 'green')
  } else {
    log(`✗ Found ${structuralIssues.length} structural issue(s):\n`, 'red')
    structuralIssues.forEach((issue, index) => {
      log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`, issue.severity === 'error' ? 'red' : 'yellow')
      if (issue.expected) {
        log(`     Expected: ${issue.expected.join(', ')}`, 'cyan')
      }
    })
  }

  // Missing keys
  logSection('3. Key Synchronization')
  const { missingInPl, missingInEn } = findMissingKeys(enKeys, plKeys)

  if (missingInPl.length === 0 && missingInEn.length === 0) {
    log('✓ All keys are synchronized between en.json and pl.json', 'green')
  } else {
    if (missingInPl.length > 0) {
      log(`\n✗ Keys missing in pl.json (${missingInPl.length}):\n`, 'red')
      missingInPl.slice(0, 20).forEach((key, index) => {
        log(`  ${index + 1}. ${key}`, 'yellow')
      })
      if (missingInPl.length > 20) {
        log(`  ... and ${missingInPl.length - 20} more`, 'yellow')
      }
    }

    if (missingInEn.length > 0) {
      log(`\n✗ Keys missing in en.json (${missingInEn.length}):\n`, 'red')
      missingInEn.slice(0, 20).forEach((key, index) => {
        log(`  ${index + 1}. ${key}`, 'yellow')
      })
      if (missingInEn.length > 20) {
        log(`  ... and ${missingInEn.length - 20} more`, 'yellow')
      }
    }
  }

  // Untranslated values
  logSection('4. Untranslated Values (Potential)')
  const untranslated = findUntranslatedValues(enKeys, plKeys)

  if (untranslated.length === 0) {
    log('✓ No obvious untranslated values detected', 'green')
  } else {
    log(`⚠ Found ${untranslated.length} potentially untranslated value(s) in pl.json:\n`, 'yellow')
    untranslated.slice(0, 15).forEach(({ path, value }, index) => {
      log(`  ${index + 1}. ${path}`, 'yellow')
      log(`     Value: "${value}"`, 'cyan')
    })
    if (untranslated.length > 15) {
      log(`  ... and ${untranslated.length - 15} more`, 'yellow')
    }
  }

  // Key naming conventions
  logSection('5. Key Naming Convention Validation')
  const namingIssues = validateKeyNaming(enKeys)

  if (namingIssues.length === 0) {
    log('✓ All keys follow camelCase naming convention', 'green')
  } else {
    log(`⚠ Found ${namingIssues.length} naming convention issue(s):\n`, 'yellow')
    namingIssues.slice(0, 15).forEach((issue, index) => {
      log(`  ${index + 1}. ${issue.path}`, 'yellow')
      log(`     Issue: ${issue.issue}`, 'cyan')
    })
    if (namingIssues.length > 15) {
      log(`  ... and ${namingIssues.length - 15} more`, 'yellow')
    }
  }

  // Duplicate values
  logSection('6. Duplicate Values Analysis')
  const enDuplicates = checkForDuplicateValues(enKeys)

  if (enDuplicates.length === 0) {
    log('✓ No duplicate values found (all translations are unique)', 'green')
  } else {
    log(`⚠ Found ${enDuplicates.length} duplicate value(s) in en.json:\n`, 'yellow')
    log('Note: Some duplicates (like "Cancel", "Close") are expected for common UI elements.\n', 'cyan')
    enDuplicates.slice(0, 10).forEach(({ value, paths }, index) => {
      log(`  ${index + 1}. Value: "${value}"`, 'yellow')
      log(`     Used in: ${paths.join(', ')}`, 'cyan')
    })
    if (enDuplicates.length > 10) {
      log(`  ... and ${enDuplicates.length - 10} more duplicates`, 'yellow')
    }
  }

  // Parameter syntax validation
  logSection('7. Parameter Interpolation Syntax')
  const parameterIssues = checkParameterSyntax(enKeys)

  if (parameterIssues.length === 0) {
    log('✓ All parameters use correct {camelCase} syntax', 'green')
  } else {
    log(`⚠ Found ${parameterIssues.length} parameter syntax issue(s):\n`, 'yellow')
    parameterIssues.slice(0, 15).forEach((issue, index) => {
      log(`  ${index + 1}. ${issue.path}`, 'yellow')
      log(`     Parameter: ${issue.parameter}`, 'cyan')
      log(`     Issue: ${issue.issue}`, 'cyan')
    })
    if (parameterIssues.length > 15) {
      log(`  ... and ${parameterIssues.length - 15} more`, 'yellow')
    }
  }

  // Keys used in code that do not exist in en.json
  logSection('7. Keys Used In Code But Missing From en.json')

  const unresolvedKeys = validateUsedKeys(en)
  if (unresolvedKeys.length === 0) {
    log('✓ Every literal t() key resolves', 'green')
  } else {
    log(`Found ${unresolvedKeys.length} key(s) that render as the key itself:`, 'red')
    unresolvedKeys.forEach((issue, i) => {
      log(`  ${i + 1}. ${issue.key}`, 'yellow')
      log(`     ${issue.location}`, 'cyan')
    })
  }

  // Summary
  logSection('SUMMARY')

  const totalIssues = structuralIssues.length + missingInPl.length + missingInEn.length + untranslated.length + namingIssues.length + parameterIssues.length + unresolvedKeys.length

  console.log(`Total Keys (en.json): ${enStats.totalKeys}`)
  console.log(`Total Keys (pl.json): ${plStats.totalKeys}`)
  console.log(`Key Difference: ${Math.abs(enStats.totalKeys - plStats.totalKeys)}`)
  console.log(`\nStructural Issues: ${structuralIssues.length}`)
  console.log(`Missing in pl.json: ${missingInPl.length}`)
  console.log(`Missing in en.json: ${missingInEn.length}`)
  console.log(`Potentially Untranslated: ${untranslated.length}`)
  console.log(`Naming Convention Issues: ${namingIssues.length}`)
  console.log(`Unresolved Keys Used In Code: ${unresolvedKeys.length}`)
  console.log(`Parameter Syntax Issues: ${parameterIssues.length}`)
  console.log(`Duplicate Values: ${enDuplicates.length}`)

  if (totalIssues === 0 && enStats.totalKeys === plStats.totalKeys) {
    log('\n✓✓✓ VALIDATION PASSED - All translations are synchronized and follow the rules! ✓✓✓', 'green')
    
    return 0
  } else {
    log(`\n✗✗✗ VALIDATION FAILED - Found ${totalIssues} issue(s) that need attention ✗✗✗`, 'red')
    
    return 1
  }
}

// Run validation
const exitCode = validateTranslations()
process.exit(exitCode)
