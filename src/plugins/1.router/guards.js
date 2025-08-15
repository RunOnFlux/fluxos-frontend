import IDService from '@/services/IDService'
import AppsService from '@/services/AppsService'
import { useFluxStore } from "@/stores/flux"
import qs from 'qs'

export const setupGuards = router => {
  router.beforeEach(async (to, from, next) => {

    if (!to.matched.length || to.name === '$error') {
      return next()
    }
    const zelidauth = localStorage.getItem('zelidauth')
    const auth = qs.parse(zelidauth)
    const fluxStore = useFluxStore()

    if (auth && auth.zelid && auth.signature && auth.loginPhrase) {
      try {
        const response = await IDService.checkUserLogged(auth.zelid, auth.signature, auth.loginPhrase)
        const privilege = response?.data?.data?.message || 'none'

        fluxStore.setPrivilege(privilege)

        if (privilege === 'none') {
          localStorage.removeItem('zelidauth')
        }
      } catch (error) {
        console.log('API error:', error)
        fluxStore.setPrivilege('none')
        localStorage.removeItem('zelidauth')
      }
    } else {
      fluxStore.setPrivilege('none')
      localStorage.removeItem('zelidauth')
    }

    // ✅ Global privilege-based restriction
    if (to.meta && to.meta.privilege) {
      const userPrivilege = fluxStore.privilege
      if (!to.meta.privilege.includes(userPrivilege)) {
        return next('/')
      }
    }

    // ✅ Additional app-level restriction for /apps/manage/:appName
    if (to.path.startsWith('/apps/manage/') && to.params.appName ) {
      const userPrivilege = fluxStore.privilege

      if (userPrivilege !== 'fluxteam') {
        try {
          const appsResponse = await AppsService.myGlobalAppSpecifications(auth.zelid)
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
  })
}
