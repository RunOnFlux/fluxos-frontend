import Api from '@/services/ApiClient'

export default {
  listRunningApps() {
    const axiosConfig = {
      headers: {
        'x-apicache-bypass': true,
      },
    }
    
    return Api().get('/apps/listrunningapps', axiosConfig)
  },
  installedApps() {
    const axiosConfig = {
      headers: {
        'x-apicache-bypass': true,
      },
    }
    
    return Api().get('/apps/installedapps', axiosConfig)
  },
  availableApps() {
    return Api().get('/apps/availableapps')
  },
  getEnterpriseNodes() {
    return Api().get('/apps/enterprisenodes')
  },
  stopApp(zelidauthHeader, app) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
        'x-apicache-bypass': true,
      },
    }
    
    return Api().get(`/apps/appstop/${app}`, axiosConfig)
  },
  startApp(zelidauthHeader, app) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }
    
    return Api().get(`/apps/appstart/${app}`, axiosConfig)
  },
  restartApp(zelidauthHeader, app) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }
    
    return Api().get(`/apps/apprestart/${app}`, axiosConfig)
  },
  removeApp(zelidauthHeader, app) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
      onDownloadProgress(progressEvent) {
        console.log(progressEvent)
      },
    }
    
    return Api().get(`/apps/appremove/${app}`, axiosConfig)
  },
  registerApp(zelidauthHeader, data) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }
    
    return Api().post('/apps/appregister', JSON.stringify(data), axiosConfig)
  },
  updateApp(zelidauthHeader, data) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }

    return Api().post('/apps/appupdate', JSON.stringify(data), axiosConfig)
  },
  testAppInstall(zelidauthHeader, hash) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }

    return Api().get(`/apps/testappinstall/${hash}`, axiosConfig)
  },
  checkCommunication() {
    return Api().get('/flux/checkcommunication')
  },
  checkDockerExistance(zelidauthHeader, data) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }
    
    return Api().post('/apps/checkdockerexistance', JSON.stringify(data), axiosConfig)
  },
  appsDeploymentInformation() {
    return Api().get('/apps/deploymentinformation')
  },
  getAppLocation(name) {
    return Api().get(`/apps/location/${name}`)
  },
  getAppInstallingLocation(name) {
    const axiosConfig = {
      headers: {
        'x-apicache-bypass': true,
      },
    }

    return Api().get(`/apps/installinglocation/${name}`, axiosConfig)
  },
  globalAppSpecifications() {
    return Api().get('/apps/globalappsspecifications')
  },
  myGlobalAppSpecifications(owner) {
    return Api().get(`/apps/globalappsspecifications?owner=${owner}`)
  },
  permanentMessagesOwner(owner) {
    return Api().get(`/apps/permanentmessages?owner=${owner}`)
  },
  getInstalledAppSpecifics(name) {
    const axiosConfig = {
      headers: {
        'x-apicache-bypass': true,
      },
    }

    return Api().get(`/apps/installedapps/${name}`, axiosConfig)
  },
  getAppSpecifics(name) {
    const axiosConfig = {
      headers: {
        'x-apicache-bypass': true,
      },
    }

    return Api().get(`/apps/appspecifications/${name}`, axiosConfig)
  },
  getAppEncryptedSpecifics(name, zelidauthHeader, data, resolveStorage = false) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
        'enterprise-key': data,
      },
    }
    const suffix = resolveStorage ? '?resolvestorage=true' : ''

    return Api().get(`/apps/appspecifications/${name}/true${suffix}`, axiosConfig)
  },
  getAppResolvedSpecifics(name, zelidauthHeader) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
        'x-apicache-bypass': true,
      },
    }

    return Api().get(`/apps/appspecifications/${name}?resolvestorage=true`, axiosConfig)
  },

  // Component names and their election mode, for a caller who may not decrypt the
  // specification. Refused for anyone but the flux team. Deliberately not a
  // specification - it carries only {name, masterSlave} - and must never be
  // merged into one.
  getAppComponentNames(name, zelidauthHeader) {
    const axiosConfig = {
      headers: { zelidauth: zelidauthHeader },
    }

    return Api().get(`/apps/appcomponentnames/${name}`, axiosConfig)
  },
  getAppOwner(name) {
    return Api().get(`/apps/appowner/${name}`)
  },
  getAppLogsTail(zelidauthHeader, app) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }
    
    return Api().get(`/apps/applog/${app}/100`, axiosConfig)
  },
  getAppTop(zelidauthHeader, app) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }
    
    return Api().get(`/apps/apptop/${app}`, axiosConfig)
  },
  getAppInspect(zelidauthHeader, app) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }
    
    return Api().get(`/apps/appinspect/${app}`, axiosConfig)
  },
  getAppStats(zelidauthHeader, app) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }
    
    return Api().get(`/apps/appstats/${app}`, axiosConfig)
  },
  getAppChanges(zelidauthHeader, app) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }
    
    return Api().get(`/apps/appchanges/${app}`, axiosConfig)
  },
  getAppExec(zelidauthHeader, app, cmd, env) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }
    const data = {
      appname: app,
      cmd,
      env: JSON.parse(env),
    }
    
    return Api().post('/apps/appexec', JSON.stringify(data), axiosConfig)
  },
  reindexGlobalApps(zelidauthHeader) {
    return Api().get('/apps/reindexglobalappsinformation', {
      headers: {
        zelidauth: zelidauthHeader,
      },
    })
  },
  reindexLocations(zelidauthHeader) {
    return Api().get('/apps/reindexglobalappslocation', {
      headers: {
        zelidauth: zelidauthHeader,
      },
    })
  },

  // What is left of FluxShare: an operator collects files a previous release
  // let them put on the node. Read only - see RunOnFlux/flux#1809.
  fluxShareGetFolder(zelidauthHeader, folder) {
    return Api().get(`/apps/fluxshare/getfolder/${folder}`, {
      headers: {
        zelidauth: zelidauthHeader,
      },
    })
  },
  fluxShareDownloadFile(zelidauthHeader, file) {
    return Api().get(`/apps/fluxshare/getfile/${file}`, {
      headers: {
        zelidauth: zelidauthHeader,
      },
      responseType: 'blob',
    })
  },
  appPrice(data) {
    return Api().post('/apps/calculateprice', JSON.stringify(data))
  },
  appPriceUSDandFlux(data) {
    return Api().post('/apps/calculatefiatandfluxprice', JSON.stringify(data))
  },
  appRegistrationVerificaiton(data) {
    return Api().post('/apps/verifyappregistrationspecifications', JSON.stringify(data))
  },
  getAppPublicKey(zelidauthHeader, data) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }
    
    return Api().post('/apps/getpublickey', JSON.stringify(data), axiosConfig)
  },
  getAppOriginalOwner(app) {
    return Api().get(`/apps/apporiginalowner/${app}`)
  },
  appUpdateVerification(data) {
    return Api().post('/apps/verifyappupdatespecifications', JSON.stringify(data))
  },

  // How many nodes and fault domains a prospective spec's geolocation holds, asked
  // before the spec is signed. Not in STICKY_BACKEND_EXCLUSIONS on purpose: the answer
  // needs a session, and the sticky node is the one that certainly holds it.
  placementFeasibility(zelidauthHeader, data) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }

    return Api().post('/apps/placementfeasibility', JSON.stringify(data), axiosConfig)
  },
  getAppMonitoring(zelidauthHeader, app) {
    const axiosConfig = {
      headers: {
        zelidauth: zelidauthHeader,
      },
    }
    
    return Api().get(`/apps/appmonitor/${app}`, axiosConfig)
  },
  justAPI() {
    return Api()
  },
}
