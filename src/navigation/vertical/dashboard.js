
export default [
  {
    title: 'menu.home.title',  // Pass the key for the translation
    icon: { icon: 'tabler-home' },
    to: '/',
  },
  {
    title: 'menu.dashboard.title',  // Pass the key for the translation
    icon: { icon: 'tabler-device-desktop' },
    children: [
      {
        title: 'menu.dashboard.overview',  // Pass the key for the translation
        to: 'dashboards-overview',
        icon: { icon: 'tabler-chart-pie', size: 20 },
      },
      {
        title: 'menu.dashboard.resources',  // Pass the key for the translation
        to: 'dashboards-resources',
        icon: { icon: 'tabler-server-cog', size: 20 },
      },
      {
        title: 'menu.dashboard.map',  // Pass the key for the translation
        to: 'dashboards-locations',
        icon: { icon: 'tabler-map-pin', size: 20 },
      },
      {
        title: 'menu.dashboard.rewards',  // Pass the key for the translation
        to: 'dashboards-rewards',
        icon: { icon: 'tabler-coins', size: 20 },
      },
      {
        title: 'menu.fluxXdao.title',  // Pass the key for the translation
        to: 'xdao-app',
        icon: { icon: 'mdi-account-group', size: 20 },
      },
    ],
  },
]
