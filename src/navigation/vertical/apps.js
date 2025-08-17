export default [
  {
    title: 'menu.application.title',  // Key for title without translation
    icon: { icon: 'mdi-apps' },
    children: [
      {
        title: 'menu.application.management',  // Key for title without translation
        icon: { icon: 'mdi-account-cog-outline', size: 20 },
        to: 'apps-management',
      },
      {
        title: 'menu.application.globalApps',  // Key for title without translation
        icon: { icon: 'tabler-world-search', size: 20 },
        to: 'apps-global',
      },
      {
        title: 'menu.application.localApps',  // Key for title without translation
        icon: { icon: 'mdi-folder-search-outline', size: 20 },
        to: 'apps-local',
      },
      {
        title: 'menu.application.registerNewApp',  // Key for title without translation
        icon: { icon: 'mdi-package-variant-plus', size: 20 },
        to: 'apps-register',
      },
      {
        title: 'menu.application.marketplace',  // Key for title without translation
        icon: { icon: 'mdi-shopping-search', size: 20 },
      },
    ],
  },
]
