# SEO / GEO architecture

How search-engine and generative-engine (AI crawler) optimization works in this
repo, and the known limitations.

## How content reaches crawlers (production)

The app is a client-rendered Vue SPA, so it is **prerendered** for crawlers that
do not execute JavaScript (social scrapers, many AI bots, partially Bing). The
full production chain (verified against `RunOnFlux/flux`, June 2026):

1. A GitHub **release** of `RunOnFlux/fluxos-frontend` cut from the **`master`**
   branch triggers `.github/workflows/release.yml`, which runs `npm run build:seo`
   (`generate:sitemap` → `vite build` → `fetch:routes` → `prerender`).
2. `scripts/prerender.js` (Playwright) snapshots each route to
   `dist/<route>/index.html` with the real per-page `<title>`, meta description
   and JSON-LD baked in, then the workflow uploads `dist.tar.gz`.
3. FluxNodes run `cloudUIUpdateService` (in the flux backend) on startup: it reads
   the latest release, **requires `target_commitish === 'master'`**, and compares
   the asset's sha256 digest against `CloudUI/version`. On change it runs
   `scripts/update-cloudui.sh`, which verifies the checksum and `cp -r`s the
   extracted tree into `CloudUI/` — **preserving the nested prerendered dirs**.
4. `homeServer.js` / `app.js` serve `CloudUI` with `express.static` (Express 4,
   `index: 'index.html'` + `redirect: true` defaults), so a request for
   `/<route>` is 301'd to `/<route>/` and served the prerendered `index.html`
   **before** the `app.get('*')` SPA fallback ever runs. That fallback only fires
   for extensionless paths with no matching file/dir; extensionful misses 404
   instead of returning a "soft 200" SPA shell.

So filesystem-first serving is **confirmed correct** — prerendered pages are
delivered to crawlers.

Operational notes:

- Changes reach production only after merge to **`master`** + a release cut from
  master. Releases from other branches are ignored by the node updater.
- Prerender runs **only at release time**, so marketplace apps added between
  releases are served as live SPA pages but are not prerendered or in the sitemap
  until the next release.
- Canonical URLs are trailing-slash-free; `express.static` 301-redirects directory
  requests to add the slash before serving. Harmless — Google honours the
  `rel=canonical` tag regardless.
- ArcaneOS nodes (`FLUXOS_PATH` set) skip `cloudUIUpdateService`; their watchdog
  handles CloudUI updates via a separate path.
- The `vercel.json` / `netlify.toml` configs use plain `npm run build` (no
  prerender) and are preview-only — not the production path.

## Per-page metadata

`src/composables/useSEO.js` (`useSEO`) sets title, description, canonical, Open
Graph, Twitter Card and JSON-LD via `@unhead/vue`. Pages whose SEO data is
fetched async call `usePrerenderReady()` and `markReady()` so the prerender waits
(`data-prerender-pending`) before snapshotting. Private/authenticated pages call
`useSEONoIndex()`.

- **Social image:** `public/images/og-image.png` (1200×630), regenerate with
  `node scripts/generate-og-image.js`. `og:image:width/height` are only emitted
  for this known default — page-supplied images (app icons) omit dimensions
  instead of advertising wrong ones.
- **Canonical slug:** the canonical URL for an app/game is always the
  **lowercased `name`** (`canonicalSlug` in `[id].vue` / `games/[name].vue`),
  matching the sitemap, the prerender routes, the internal links and the backend
  resolver. Visiting the page by uuid or differing case still emits this one
  stable canonical, so duplicates collapse.
- **Structured data:** never fabricate `aggregateRating` — it is emitted only
  when the API supplies both a real rating value and a real review count.

## robots.txt

A single `User-agent: *` group (`public/robots.txt`). AI crawlers are welcome and
deliberately share that group: a crawler obeys only its most-specific matching
block, so per-bot blocks would silently drop the `.html` / soft-404 disallows for
those bots.

## i18n and hreflang — known limitation

The UI offers 22 languages (`themeConfig.js → app.i18n.langConfig`) via **client-side**
`vue-i18n`. All languages are served at the **same URL** — there are no
`/es/…`, `/pt/…` paths.

Consequences:

- **`hreflang` is intentionally NOT used.** Google's `hreflang` requires a
  distinct URL per language; pointing several `hreflang` tags at one identical
  URL is invalid and would be ignored or flagged. So it is omitted on purpose.
- The prerendered (and therefore indexed) version is **English only**. Other
  languages render client-side after the user switches, which crawlers indexing
  the prerendered HTML do not see.
- `<html lang>` is updated on locale change (`src/@core/initCore.js`); the
  prerendered output is `lang="en"`, which is correct for the indexed content.
- `og:locale` = `en_US` with `og:locale:alternate` listing the other locales
  (homepage `index.html`) — the correct Open Graph signal for "same URL,
  multiple languages".

### To make multilingual SEO real (future work)

This needs **localized URLs**, not markup tweaks:

1. Introduce locale-prefixed routes (`/`, `/es/`, `/pt/`, …) in the router.
2. Prerender each route per locale to `dist/<locale>/<route>/index.html`.
3. Emit reciprocal `hreflang` link tags (one per locale URL + `x-default`) and a
   per-locale canonical from `useSEO`.
4. Add the localized URLs to `sitemap.xml` with `xhtml:link` alternates.
5. Ensure the backend static server serves the locale-prefixed paths.

Until that exists, multilingual SEO is limited to the English prerender plus the
`og:locale:alternate` signal above.
