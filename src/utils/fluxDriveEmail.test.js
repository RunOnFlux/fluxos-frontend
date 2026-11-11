import test from 'node:test'
import assert from 'node:assert/strict'

// node --test resolves an ES module path only with its extension.
// eslint-disable-next-line import/extensions
import { normalizeFluxDriveEmail } from './fluxDriveEmail.js'

test('accepts and trims a normal address', () => {
  assert.equal(normalizeFluxDriveEmail('  user@example.com '), 'user@example.com')
  assert.equal(normalizeFluxDriveEmail('first.last+drive@sub.example.co.uk'), 'first.last+drive@sub.example.co.uk')
})

test('rejects what the FluxDrive bridge rejects', () => {
  const bad = [undefined, null, 42, '', '   ', 'user', 'user@', '@example.com', 'a b@example.com', 'user@example', '<x>@example.com', `${'a'.repeat(250)}@example.com`, '1DMuWwi9ddxJY6t1HcsvwLSGdqsiKm1rf4@zel.core']
  for (const value of bad) assert.equal(normalizeFluxDriveEmail(value), null, String(value))
})
