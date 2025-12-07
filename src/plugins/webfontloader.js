/**
 * plugins/webfontloader.js
 *
 * webfontloader documentation: https://github.com/typekit/webfontloader
 *
 * This plugin defers Google Fonts loading to avoid render-blocking.
 * The font is loaded after the app is ready using requestIdleCallback.
 */
export async function loadFonts() {
  const webFontLoader = await import(/* webpackChunkName: "webfontloader" */ 'webfontloader')

  webFontLoader.load({
    google: {
      families: ['Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap'],
    },
  })
}

export default function () {
  // Defer font loading to avoid render-blocking
  // Use requestIdleCallback if available, otherwise setTimeout
  const scheduleLoad = window.requestIdleCallback || (cb => setTimeout(cb, 1))

  // Wait for app-ready event before loading fonts (non-blocking)
  if (document.readyState === 'complete') {
    scheduleLoad(() => loadFonts())
  } else {
    window.addEventListener('load', () => {
      scheduleLoad(() => loadFonts())
    }, { once: true })
  }
}
