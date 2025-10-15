export default [
  {
    title: 'menu.administration.title',
    icon: { icon: 'mdi-shield-account' },
    privilege: ['admin', 'fluxteam'],
    children: [
      {
        title: 'menu.administration.manageFlux',
        icon: { icon: 'mdi-cog-outline', size: 20 },
        privilege: ['admin', 'fluxteam'],
      },
      {
        title: 'menu.administration.manageUsers',
        icon: { icon: 'mdi-fingerprint', size: 20 },
        privilege: ['admin', 'fluxteam'],
      },
      // {
      //   title: 'menu.administration.dockerEvents',
      //   icon: { icon: 'mdi-docker', size: 20 },
      //   privilege: ['admin', 'fluxteam'],
      // },
      {
        title: 'menu.administration.systemInfo',
        icon: { icon: 'mdi-information-outline', size: 20 },
        privilege: ['admin', 'fluxteam'],
      },
    ],
  },
]
  