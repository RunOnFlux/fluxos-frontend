import IDService from '@/services/IDService'
import AppsService from '@/services/AppsService'
import { useFluxStore } from "@/stores/flux"
import { clearStickyBackendDNS } from '@/utils/stickyBackend'
import { isSessionExpired } from '@/utils/session'
import { consumeConsoleHandoff } from '@/utils/consoleHandoff'
import qs from 'qs'

const GUARD_TIMEOUT_MS = 8000

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Guard timeout')), ms)),
  ])
}

export const setupGuards = router => {
  // Catch route component loading failures (e.g., stale chunks after deployment)
  // These fail as dynamic import errors inside vue-router, which the main.js error handler can't catch
  const CHUNK_ERROR_MARKER = 'chunk-reload-attempted'

  router.onError(err => {
    const message = err?.message || ''
    const isChunkError = message.includes('Failed to fetch dynamically imported module')
      || message.includes('Importing a module script failed')
      || message.includes('Loading chunk')
      || message.includes('Loading CSS chunk')

    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem(CHUNK_ERROR_MARKER)
      if (!hasReloaded) {
        console.warn('[Router] Stale chunk detected, reloading:', message)
        sessionStorage.setItem(CHUNK_ERROR_MARKER, 'true')
        window.location.reload()

        return
      }
      console.error('[Router] Chunk load failed after reload:', message)
      sessionStorage.removeItem(CHUNK_ERROR_MARKER)
    } else {
      console.warn('[Router] Navigation error:', message)
    }
  })

  router.beforeEach(async (to, from, next) => {
    try {
      // SSO handoff from the Console: if the URL carries a one-time handoff
      // token, exchange it for a zelidauth and store it BEFORE we read the
      // session below, so the normal validation path logs the user in.
      await consumeConsoleHandoff()

      if (!to.matched.length || to.name === '$error') {
        return next()
      }

      const zelidauth = localStorage.getItem('zelidauth')
      const auth = qs.parse(zelidauth)
      const fluxStore = useFluxStore()

      const dropSession = () => {
        fluxStore.setPrivilege('none')
        localStorage.removeItem('zelidauth')
        clearStickyBackendDNS()
      }

      if (auth && auth.zelid && auth.signature && auth.loginPhrase) {
        if (isSessionExpired(auth)) {
          // The loginPhrase says the node has already dropped this session;
          // no need to ask, and no point keeping the credentials around.
          dropSession()
        } else {
          try {
            const response = await withTimeout(
              IDService.checkUserLogged(auth.zelid, auth.signature, auth.loginPhrase),
              GUARD_TIMEOUT_MS,
            )
            const privilege = response?.data?.data?.message || 'none'

            fluxStore.setPrivilege(privilege)

            // Only an answer from a node is grounds for dropping the session.
            if (privilege === 'none') {
              dropSession()
            }
          } catch (error) {
            // A timeout or a network blip says nothing about whether the
            // session is still good. Throwing the credentials away here was
            // what forced people to log back in after every hiccup, so keep
            // them: navigation is still gated on the privilege we know, and
            // the next navigation re-checks.
            console.log('API error:', error)
          }
        }
      } else {
        dropSession()
      }

      // ✅ Global privilege-based restriction
      if (to.meta && to.meta.privilege) {
        const userPrivilege = fluxStore.privilege
        if (!to.meta.privilege.includes(userPrivilege)) {
          return next('/')
        }
      }

      // ✅ Additional app-level restriction for /apps/manage/:appName
      if (to.path.startsWith('/apps/manage/') && to.params.appName) {
        const userPrivilege = fluxStore.privilege

        if (userPrivilege !== 'fluxteam') {
          try {
            const appsResponse = await withTimeout(
              AppsService.myGlobalAppSpecifications(auth.zelid),
              GUARD_TIMEOUT_MS,
            )
            const apps = appsResponse?.data?.data || []
            const ownsApp = apps.some(app => app.name === to.params.appName)

            if (!ownsApp) {
              console.warn(`Access denied: You do not own app ${to.params.appName}`)

              return next('/unauthorized')
            }
          } catch (err) {
            console.error('App access check failed:', err.message)

            return next('/unauthorized')
          }
        }
      }

      next()
    } catch (err) {
      // Safety net: if anything unexpected throws, always proceed
      console.warn('[Guard] Unexpected error, proceeding with navigation:', err.message)
      next()
    }
  })
}
