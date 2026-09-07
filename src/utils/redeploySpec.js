// Normalizes an existing application spec for the redeploy/clone flows
// (manage.vue "Clone", redeploy.vue "Redeploy"). A clone is a NEW
// registration: old spec versions are upgraded to the latest version, it
// must not inherit the source app's registration metadata, and its expire
// should map onto a selectable subscription period.

import { convertToLatestVersion, LATEST_SPEC_VERSION } from '@/utils/specConverter'

const FORK_BLOCK_HEIGHT = 2020000

// Selectable subscription periods in post-fork blocks
// (1 week, 2 weeks, 1 month, 3 months, 6 months, 1 year).
// Keep in sync with BASE_RENEWAL_PERIODS in SubscriptionManager.vue
// and PERIODS in SimpleDeploy.vue.
const BASE_PERIOD_BLOCKS = [22000, 44000, 88000, 264000, 528000, 1056000]

export function normalizeSpecForRedeploy(spec) {
  // Old versions (v1-v7) are upgraded to the latest spec version FIRST —
  // while the registration height is still present, so the converter's
  // fork-aware expire defaults compute correctly.
  let specs
  if (spec.version && spec.version < LATEST_SPEC_VERSION) {
    try {
      specs = convertToLatestVersion(spec)
    } catch (error) {
      console.warn('normalizeSpecForRedeploy: conversion failed, using raw spec:', error)
      specs = { ...spec }
    }

    // v7 private apps: the converter does not migrate nodes; keep the private
    // intent so the deploy forms re-enable the Enterprise toggle.
    if (spec.version === 7 && Array.isArray(spec.nodes) && spec.nodes.length > 0) {
      specs.wasEnterprise = true
    }
  } else {
    specs = { ...spec }
  }

  // Pre-fork apps express expire in pre-fork blocks (2 min/block). Convert to
  // the post-fork duration equivalent (30 s/block → ×4) before dropping height.
  if (
    typeof specs.height === 'number'
    && specs.height < FORK_BLOCK_HEIGHT
    && typeof specs.expire === 'number'
    && specs.expire > 0
  ) {
    specs.expire = Math.round(specs.expire * 4)
  }

  // The clone registers NOW. Stale registration metadata (height, hash) of
  // the source app would make the subscription form treat the source app's
  // elapsed time as remaining time (see SubscriptionManager's
  // originalExpireBlocks / renewalValues); the backend assigns fresh values.
  delete specs.height
  delete specs.hash

  // Snap expire to the nearest selectable period so both deploy forms
  // (SimpleDeploy buttons, renewal slider) can represent it.
  if (typeof specs.expire === 'number' && specs.expire > 0) {
    specs.expire = BASE_PERIOD_BLOCKS.reduce(
      (best, blocks) => (Math.abs(blocks - specs.expire) < Math.abs(best - specs.expire) ? blocks : best),
    )
  }

  return specs
}
