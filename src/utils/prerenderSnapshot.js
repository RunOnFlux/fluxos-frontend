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
 * So instead of hydrating we freeze the pixels: the snapshot nodes are lifted
 * into a fixed overlay before mount and faded out once the mounted app has
 * painted the same route underneath.
 */

// Uncover no matter what — a hung mount must never leave a dead snapshot on top.
const FAIL_SAFE_MS = 6000
const FADE_MS = 150

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
 * Lift the pre-rendered markup out of `#app` into an overlay.
 *
 * @returns {() => void} release function — call it after `app.mount()`; it
 *   uncovers the app on the next painted frame. Safe to call more than once,
 *   and a no-op when there is nothing to freeze (dev server, non-pre-rendered
 *   route, snapshot for a different page).
 */
export function freezePrerenderedSnapshot() {
  const noop = () => {}
  const root = document.querySelector('#app')
  const snapshotPath = root?.getAttribute('data-prerender-path')

  if (!snapshotPath || !root.firstElementChild) return noop

  // The overlay is a flat copy of the snapshot pinned to the top of the
  // viewport, so it only lines up with what the user sees when this really is
  // the page that was pre-rendered and nothing has scrolled or jumped to an
  // anchor yet.
  if (normalizePath(snapshotPath) !== normalizePath(window.location.pathname)) return noop
  if (window.scrollY > 0 || window.location.hash) return noop

  const shell = document.createElement('div')

  shell.id = 'prerender-shell'
  shell.setAttribute('aria-hidden', 'true')
  shell.style.cssText = [
    'position:fixed',
    'inset:0',
    'overflow:hidden',
    'z-index:2147483000',
    'pointer-events:none',
    'background:var(--initial-loader-bg, #fff)',
    'opacity:1',
    `transition:opacity ${FADE_MS}ms ease`,
  ].join(';')

  while (root.firstChild) shell.appendChild(root.firstChild)
  document.body.appendChild(shell)
  paintingOverSnapshot = true

  let released = false

  const release = () => {
    if (released) return
    released = true
    clearTimeout(failSafe)

    // Two frames: one for Vue's mount to be flushed to the DOM, one for the
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

  const failSafe = setTimeout(release, FAIL_SAFE_MS)

  return release
}
