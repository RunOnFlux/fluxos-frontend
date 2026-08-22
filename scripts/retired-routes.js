/**
 * Retired routes — pages that moved to a dedicated site.
 *
 * Single source of truth, consumed by:
 *   - scripts/post-build-redirect-stubs.js  (writes the redirect stub into dist/)
 *   - scripts/fetch-prerender-routes.js     (never prerender a retired route)
 *   - scripts/prerender.js                  (same, for a stale prerender-routes.json)
 *   - scripts/generate-sitemap.js           (retired routes are absent by hand)
 *
 * Why a build-time stub instead of a redirect rule: cloud.runonflux.com is served
 * from a Flux node behind Cloudflare, which honors none of public/_redirects,
 * netlify.toml or vercel.json (verified 2026-08-22 — /apps/register/orbit still
 * serves 200 despite its 301! rule). The stub is the only redirect this repo can
 * ship on its own. Those config files are kept in sync anyway so a move back to
 * Netlify/Vercel/Pages upgrades the stub to a real 301 with no extra work.
 *
 * `from` must be an exact path. Sibling routes are untouched, so the in-app deploy
 * funnel at /marketplace/wordpress/configure keeps serving normally.
 */
export const RETIRED_ROUTES = Object.freeze([
  {
    from: '/marketplace/wordpress',
    to: 'https://wordpress.runonflux.com/',
    title: 'WordPress Hosting has moved',
    body: 'WordPress hosting on Flux now lives on its own site.',
    linkText: 'Continue to wordpress.runonflux.com',
  },
])

export const RETIRED_ROUTE_PATHS = Object.freeze(RETIRED_ROUTES.map(route => route.from))

/**
 * True when `route` is retired. Tolerates a trailing slash so a route list built
 * from another source ('/marketplace/wordpress/') is still recognised.
 */
export function isRetiredRoute(route) {
  if (typeof route !== 'string') return false

  const normalized = route.length > 1 ? route.replace(/\/+$/, '') : route

  return RETIRED_ROUTE_PATHS.includes(normalized)
}
