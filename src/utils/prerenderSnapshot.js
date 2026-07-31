/**
 * Keeps the pre-rendered snapshot on screen until the Vue app has actually
 * painted, so a first visit to a pre-rendered route no longer looks like the
 * page reloads itself.
 *
 * On a pre-rendered route the server sends `#app` already filled with the
 * snapshot markup (scripts/prerender.js) and *without* the `#loading-bg` splash
 * — the splash was already dismissed in the browser that produced the snapshot.
 * The user therefore sees the real page immediately. Then main.js runs,
 * `app.mount('#app')` wipes the container (Vue mounts, it does not hydrate), and
 * the route's chunk is still loading — so the page goes blank and re-renders a
 * moment later. Content → blank → content is the "double load" flash.
 *
 * Hydration (createSSRApp) is not an option here: the snapshot is a serialized
 * *browser* DOM, not renderToString output, so it lacks the fragment/teleport
 * comment anchors hydration matches against (Vue's client renderer uses empty
 * text nodes, which serialize to nothing). Every fragment would mismatch and be
 * re-rendered anyway.
 *
 * So instead of hydrating we freeze the pixels: the container holding the
 * snapshot is pinned as a fixed overlay before mount and faded out once the
 * mounted app has painted the same route underneath.
 */

// Uncover no matter what — a hung mount must never leave a dead snapshot on top.
const FAIL_SAFE_MS = 6000
const FADE_MS = 150

// How long the snapshot may be held after `app.mount()` while waiting for the
// mounted tree to actually render the page (see waitForFirstRender). Long enough
// to cover the layout chunk resolving, short enough that a page which renders
// something genuinely smaller than its snapshot is not stuck behind stale
// pixels.
const FIRST_RENDER_WAIT_MS = 1500

// An empty `<VApp>` is a handful of nodes; anything at or below this is still
// the bare shell, not the page.
const MIN_RENDERED_NODES = 24

const normalizePath = p => {
  try {
    const decoded = decodeURI(p)

    return decoded.length > 1 ? decoded.replace(/\/+$/, '') : decoded
  } catch {
    return p
  }
}

// True from the moment we freeze a matching snapshot until it has been faded
// away, i.e. exactly while the first render is painting *underneath* markup that
// already shows the page in its settled state.
let paintingOverSnapshot = false

/**
 * Whether this render is painting underneath a pre-rendered snapshot of the same
 * page. Components with an entry animation must skip it while this is true —
 * replaying "fade in from opacity 0" under a snapshot that already shows the
 * content makes that content vanish and re-appear, which reads as the page
 * reloading itself. Always false on later navigations, in dev, and on routes
 * that were not pre-rendered.
 *
 * @returns {boolean}
 */
export function isPaintingOverSnapshot() {
  return paintingOverSnapshot
}

/**
 * Tell the splash screen in index.html that the app is genuinely on screen.
 *
 * On a pre-rendered route index.html holds the Flux splash until this fires
 * rather than until `app-ready`, which App.vue dispatches from `onMounted` —
 * several hundred milliseconds before the layout chunk resolves and anything is
 * actually painted.
 */
const announceRendered = () => window.dispatchEvent(new Event('app-rendered'))

/**
 * Call `done` on the first frame where `container` holds a rendered page rather
 * than an empty app shell, or when the wait runs out of time.
 *
 * @param {Element} container element Vue mounted into
 * @param {number} minNodes descendant count that counts as rendered
 * @param {() => void} done
 */
const whenRendered = (container, minNodes, done) => {
  const deadline = performance.now() + FIRST_RENDER_WAIT_MS

  const step = () => {
    if (container.querySelectorAll('*').length >= minNodes || performance.now() >= deadline) done()
    else requestAnimationFrame(step)
  }

  step()
}

/**
 * Pin the pre-rendered markup as an overlay and hand Vue a fresh mount point.
 *
 * @returns {() => void} release function — call it after `app.mount()`; it
 *   uncovers the app once the mounted tree has rendered the page. Safe to call
 *   more than once, and a no-op when there is nothing to freeze (dev server,
 *   non-pre-rendered route, snapshot for a different page).
 */
export function freezePrerenderedSnapshot() {
  const noop = () => {}
  const root = document.querySelector('#app')
  const snapshotPath = root?.getAttribute('data-prerender-path')

  if (!snapshotPath) return noop

  // The overlay is the snapshot pinned to the top of the viewport, so it only
  // lines up with what the user sees when this really is the page that was
  // pre-rendered and nothing has scrolled or jumped to an anchor yet.
  const usable = root.firstElementChild
    && normalizePath(snapshotPath) === normalizePath(window.location.pathname)
    && window.scrollY === 0
    && !window.location.hash

  // Falling through to a plain mount means Vue takes over this very element, so
  // the marker has to go with it: the freeze rule baked into the snapshot keys
  // off `data-prerender-path` (see scripts/prerender.js) and would otherwise
  // pin every animation in the live app at a zero duration.
  if (!usable) {
    root.removeAttribute('data-prerender-path')

    // index.html committed to waiting for `app-rendered` the moment it saw the
    // marker, so the splash still has to be told when the page is up — there is
    // simply no snapshot to uncover underneath it.
    return () => whenRendered(root, MIN_RENDERED_NODES, announceRendered)
  }

  // Rename the container that already holds the snapshot and let Vue mount into
  // a fresh one, rather than re-parenting the snapshot nodes into a new overlay.
  // Removing an element from the document cancels its CSS animations and
  // re-inserting it starts them over, so moving the nodes replayed every entry
  // animation inside the snapshot: the services grid dropped back to opacity 0
  // and faded in again at the exact moment of the hand-off — the flash this
  // module exists to remove. Renaming leaves every snapshot node untouched and
  // still painted, and keeps `data-prerender-path` (and with it the freeze rule)
  // on the markup it was baked for.
  const shell = root

  shell.id = 'prerender-shell'
  shell.setAttribute('aria-hidden', 'true')

  // `color` is re-stated because the critical CSS in index.html sets it on
  // `#app`, and the element is about to stop being `#app`.
  shell.style.cssText = [
    'position:fixed',
    'inset:0',
    'overflow:hidden',
    'z-index:2147483000',
    'pointer-events:none',
    'background:var(--initial-loader-bg, #fff)',
    'color:var(--initial-text-color, #000)',
    'opacity:1',
    `transition:opacity ${FADE_MS}ms ease`,
  ].join(';')

  const mountPoint = document.createElement('div')

  mountPoint.id = 'app'
  shell.parentNode.insertBefore(mountPoint, shell)
  paintingOverSnapshot = true

  const snapshotNodes = shell.querySelectorAll('*').length

  let uncovered = false

  const uncover = () => {
    if (uncovered) return
    uncovered = true
    clearTimeout(failSafe)

    // Lift the splash at the same moment. Its fade is much longer than the
    // shell's, so the snapshot is already gone by the time anything shows
    // through, and the user goes straight from the Flux logo to the live app.
    announceRendered()

    // Two frames: one for Vue's render to be flushed to the DOM, one for the
    // browser to paint it. Fading before that would expose a blank frame —
    // exactly the flash we are removing.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        shell.style.opacity = '0'
        setTimeout(() => {
          shell.remove()
          paintingOverSnapshot = false
        }, FADE_MS + 50)
      })
    })
  }

  const failSafe = setTimeout(uncover, FAIL_SAFE_MS)

  // `app.mount()` returns before the page is on screen. The router view stays
  // empty until the layout chunk resolves, which is a separate lazy import that
  // `router.isReady()` does not cover — measured at ~300ms after mount on the
  // homepage, during which `#app` holds nothing but an empty `<VApp>`. Fading
  // the snapshot out at that point drops the user on a blank screen and pops
  // the content in a moment later: the same flash, seen from the other side.
  // So poll until the mounted tree is of the same order as the snapshot it is
  // replacing, bounded so a page that legitimately renders less than its
  // snapshot is never stuck behind stale pixels.
  let waiting = false

  const waitForFirstRender = () => {
    if (waiting) return
    waiting = true
    whenRendered(mountPoint, Math.max(MIN_RENDERED_NODES, snapshotNodes / 2), uncover)
  }

  return waitForFirstRender
}
