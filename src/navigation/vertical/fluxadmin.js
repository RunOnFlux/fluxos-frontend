export default [
  {
    title: 'menu.administration.title',
    icon: { icon: 'mdi-shield-account' },
    privilege: ['admin', 'fluxteam'],
    children: [
      {
        title: 'menu.administration.manageFlux',
        to: 'administration-manage-flux',
        icon: { icon: 'mdi-cog-outline', size: 20 },
        privilege: ['admin', 'fluxteam'],
      },
      {
        title: 'menu.administration.manageUsers',
        to: 'administration-manage-users',
        icon: { icon: 'mdi-fingerprint', size: 20 },
        privilege: ['admin', 'fluxteam'],
      },

      // {
      //   title: 'menu.administration.dockerEvents',
      //   to: 'administration-docker-events',
      //   icon: { icon: 'mdi-docker', size: 20 },
      //   privilege: ['admin', 'fluxteam'],
      // },
      {
        title: 'menu.administration.systemInfo',
        to: 'administration-system-info',
        icon: { icon: 'mdi-information-outline', size: 20 },
        privilege: ['admin', 'fluxteam'],
      },
      {
        title: 'menu.application.globalApps',
        icon: { icon: 'tabler-world-search', size: 20 },
        to: 'apps-global',
        privilege: ['fluxteam'],
      },
      {
        title: 'menu.application.localApps',
        icon: { icon: 'mdi-folder-search-outline', size: 20 },
        to: 'apps-local',
        privilege: ['admin', 'fluxteam'],
      },
    ],
  },
]
  