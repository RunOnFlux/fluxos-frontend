export const EVENT_STYLES = {
  // App Lifecycle — success (green)
  'app.start': { icon: 'mdi-play-circle', color: 'success' },
  'app.stop': { icon: 'mdi-stop-circle', color: 'success' },
  'app.pause': { icon: 'mdi-pause-circle', color: 'success' },
  'app.unpause': { icon: 'mdi-play-circle-outline', color: 'success' },
  'app.restart': { icon: 'mdi-restart', color: 'success' },
  'app.remove': { icon: 'mdi-delete', color: 'success' },
  'app.register': { icon: 'mdi-plus-circle', color: 'success' },
  'app.update': { icon: 'mdi-pencil', color: 'success' },

  // App Diagnostics — secondary (grey)
  'app.inspect': { icon: 'mdi-magnify', color: 'secondary' },
  'app.logs': { icon: 'mdi-text-box-outline', color: 'secondary' },
  'app.top': { icon: 'mdi-chart-bar', color: 'secondary' },
  'app.stats': { icon: 'mdi-chart-line', color: 'secondary' },
  'app.changes': { icon: 'mdi-delta', color: 'secondary' },
  'app.exec': { icon: 'mdi-console', color: 'secondary' },
  'app.terminal.open': { icon: 'mdi-console', color: 'success' },
  'app.terminal.close': { icon: 'mdi-console-line', color: 'warning' },

  // App Deployment — info (blue)
  'app.redeploy': { icon: 'mdi-rocket-launch', color: 'info' },
  'app.redeployComponent': { icon: 'mdi-rocket-launch-outline', color: 'info' },
  'app.testInstall': { icon: 'mdi-test-tube', color: 'info' },
  'app.installLocally': { icon: 'mdi-download', color: 'info' },

  // Monitoring — warning (orange)
  'app.monitor.start': { icon: 'mdi-eye', color: 'warning' },
  'app.monitor.stop': { icon: 'mdi-eye-off', color: 'warning' },
  'app.monitor.status': { icon: 'mdi-eye-check', color: 'warning' },
  'app.monitor.stream': { icon: 'mdi-broadcast', color: 'warning' },

  // Volume Browser — info (blue)
  'app.volume.browse': { icon: 'mdi-folder-open', color: 'info' },
  'app.volume.createFolder': { icon: 'mdi-folder-plus', color: 'info' },
  'app.volume.rename': { icon: 'mdi-rename-box', color: 'info' },
  'app.volume.remove': { icon: 'mdi-folder-remove', color: 'info' },
  'app.volume.upload': { icon: 'mdi-upload', color: 'info' },
  'app.volume.backupUpload': { icon: 'mdi-cloud-upload', color: 'info' },
  'app.volume.downloadFile': { icon: 'mdi-file-download', color: 'info' },
  'app.volume.downloadFolder': { icon: 'mdi-folder-download', color: 'info' },

  // Specs — secondary (grey)
  'app.specs.verifyRegister': { icon: 'mdi-check-decagram', color: 'secondary' },
  'app.specs.verifyUpdate': { icon: 'mdi-check-decagram', color: 'secondary' },
  'app.checkDocker': { icon: 'mdi-docker', color: 'secondary' },

  // Backup & Restore — warning (orange)
  'backup.create': { icon: 'mdi-backup-restore', color: 'warning' },
  'backup.restore': { icon: 'mdi-restore', color: 'warning' },
  'backup.delete': { icon: 'mdi-delete-clock', color: 'warning' },
  'backup.volumeInfo': { icon: 'mdi-harddisk', color: 'warning' },
  'backup.listLocal': { icon: 'mdi-format-list-bulleted', color: 'warning' },
  'backup.remoteSize': { icon: 'mdi-cloud-outline', color: 'warning' },

  // FluxShare — success (green)
  'fluxshare.upload': { icon: 'mdi-cloud-upload', color: 'success' },
  'fluxshare.createFolder': { icon: 'mdi-folder-plus', color: 'success' },
  'fluxshare.removeFile': { icon: 'mdi-file-remove', color: 'success' },
  'fluxshare.removeFolder': { icon: 'mdi-folder-remove', color: 'success' },
  'fluxshare.share': { icon: 'mdi-share-variant', color: 'success' },
  'fluxshare.unshare': { icon: 'mdi-share-off', color: 'success' },
  'fluxshare.rename': { icon: 'mdi-rename-box', color: 'success' },
  'fluxshare.downloadFolder': { icon: 'mdi-folder-download', color: 'success' },
  'fluxshare.browse': { icon: 'mdi-folder-open', color: 'success' },
  'fluxshare.stats': { icon: 'mdi-chart-pie', color: 'success' },

  // Administration — error (red)
  'flux.softUpdate': { icon: 'mdi-update', color: 'error' },
  'flux.softUpdateInstall': { icon: 'mdi-download-circle', color: 'error' },
  'flux.update': { icon: 'mdi-update', color: 'error' },
  'flux.hardUpdate': { icon: 'mdi-alert-decagram', color: 'error' },
  'flux.restart': { icon: 'mdi-restart', color: 'error' },
  'flux.rebuildHome': { icon: 'mdi-home-alert', color: 'error' },
  'flux.updateDaemon': { icon: 'mdi-cog-sync', color: 'error' },
  'flux.reindexDaemon': { icon: 'mdi-database-refresh', color: 'error' },
  'flux.updateBenchmark': { icon: 'mdi-speedometer', color: 'error' },
  'flux.broadcast': { icon: 'mdi-broadcast', color: 'error' },
  'flux.broadcastOutgoing': { icon: 'mdi-broadcast', color: 'error' },
  'flux.broadcastIncoming': { icon: 'mdi-broadcast', color: 'error' },
  'daemon.start': { icon: 'mdi-play', color: 'error' },
  'daemon.stop': { icon: 'mdi-stop', color: 'error' },
  'daemon.restart': { icon: 'mdi-restart', color: 'error' },
  'daemon.rescan': { icon: 'mdi-database-search', color: 'error' },
  'benchmark.start': { icon: 'mdi-speedometer', color: 'error' },
  'benchmark.stop': { icon: 'mdi-speedometer-slow', color: 'error' },
  'benchmark.restart': { icon: 'mdi-speedometer-medium', color: 'error' },
  'benchmark.restartNode': { icon: 'mdi-speedometer', color: 'error' },
  'config.kadena': { icon: 'mdi-cog', color: 'error' },
  'config.routerIp': { icon: 'mdi-router-wireless', color: 'error' },
  'config.blockedPorts': { icon: 'mdi-block-helper', color: 'error' },
  'config.apiPort': { icon: 'mdi-api', color: 'error' },
  'config.blockedRepos': { icon: 'mdi-block-helper', color: 'error' },
  'peers.addOutgoing': { icon: 'mdi-lan-connect', color: 'error' },
  'peers.add': { icon: 'mdi-lan-connect', color: 'error' },
  'peers.removeIncoming': { icon: 'mdi-lan-disconnect', color: 'error' },
  'peers.remove': { icon: 'mdi-lan-disconnect', color: 'error' },
  'session.logoutSpecific': { icon: 'mdi-logout', color: 'error' },
  'session.logoutAll': { icon: 'mdi-logout-variant', color: 'error' },
  'session.logoutAllUsers': { icon: 'mdi-account-off', color: 'error' },
  'explorer.reindex': { icon: 'mdi-database-refresh', color: 'error' },
  'explorer.restart': { icon: 'mdi-restart', color: 'error' },
  'explorer.stop': { icon: 'mdi-stop', color: 'error' },
  'explorer.rescan': { icon: 'mdi-database-search', color: 'error' },
  'apps.reindex': { icon: 'mdi-database-refresh', color: 'error' },
  'apps.reindexLocation': { icon: 'mdi-map-marker-radius', color: 'error' },
  'apps.rescan': { icon: 'mdi-database-search', color: 'error' },
  'apps.reconstructHashes': { icon: 'mdi-pound', color: 'error' },
  'apps.checkHashes': { icon: 'mdi-check-all', color: 'error' },
  'apps.createNetwork': { icon: 'mdi-lan', color: 'error' },
  'port.allow': { icon: 'mdi-lock-open-variant', color: 'error' },
  'port.map': { icon: 'mdi-arrow-decision', color: 'error' },
  'port.unmap': { icon: 'mdi-close-circle', color: 'error' },
}

const DEFAULT_STYLE = { icon: 'mdi-circle-small', color: 'secondary' }

export function getEventStyle(eventType) {
  return EVENT_STYLES[eventType] || DEFAULT_STYLE
}

export function getEventIcon(eventType) {
  return getEventStyle(eventType).icon
}

export function getEventColor(eventType) {
  return getEventStyle(eventType).color
}
