// Heuristic detection of sensitive values placed in app environment variables.
//
// Non-enterprise (public) Flux apps have their full compose specification —
// including environmentParameters — published on the network's public APIs.
// If a user puts a secret/key in an environment variable without enabling
// Enterprise mode (which encrypts the compose), that secret becomes public.
//
// This helper flags environment variables whose KEY looks like a secret so the
// UI can auto-enable Enterprise mode and/or warn the user.

// Patterns matched against the environment variable NAME (the part before "=").
const SECRET_KEY_PATTERNS = [
  /secret/i,
  /pass(word|wd|phrase)?/i,
  /token/i,
  /api[._-]?key/i,
  /access[._-]?key/i,
  /private[._-]?key/i,
  /credential/i,
  /passphrase/i,
  /\bauth\b/i,
  /\bkey\b/i,
  /seed/i,
  /mnemonic/i,
]

/**
 * Returns true if the given environment variable key looks like a secret.
 * @param {string} key - environment variable name (e.g. "DB_PASSWORD")
 * @returns {boolean}
 */
export function isSecretEnvKey(key) {
  if (!key || typeof key !== 'string') return false

  return SECRET_KEY_PATTERNS.some(pattern => pattern.test(key))
}

/**
 * Scans a compose array for environment variables that look like secrets.
 * @param {Array} compose - app spec compose array; each component may have an
 *   environmentParameters array of "KEY=value" strings.
 * @returns {Array<{componentIndex: number, componentName: string, key: string}>}
 *   one entry per detected secret-looking variable.
 */
export function detectSecretEnvVars(compose) {
  const matches = []

  if (!Array.isArray(compose)) return matches

  compose.forEach((component, componentIndex) => {
    const envs = component?.environmentParameters
    if (!Array.isArray(envs)) return

    envs.forEach(entry => {
      if (typeof entry !== 'string') return

      const key = entry.split('=')[0]?.trim()
      if (!key) return

      if (isSecretEnvKey(key)) {
        matches.push({
          componentIndex,
          componentName: component?.name || '',
          key,
        })
      }
    })
  })

  return matches
}
