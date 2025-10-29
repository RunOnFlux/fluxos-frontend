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
        privilege: ['fluxteam'],
      },
      {
        title: 'menu.application.localApps',  // Key for title without translation
        icon: { icon: 'mdi-folder-search-outline', size: 20 },
        to: 'apps-local',
        privilege: ['admin', 'fluxteam'],
      },
    ],
  },
  {
    title: 'menu.application.registerNewApp',  // Key for title without translation
    icon: { icon: 'mdi-package-variant-plus', size: 20 },
    to: 'apps-register',
  },
  {
    title: 'menu.application.marketplace',  // Key for title without translation
    icon: { icon: 'mdi-shopping-search', size: 20 },
    iconClass: 'nav-icon-bounce',
    itemClass: 'nav-marketplace-promoted',
    children: [
      {
        title: 'menu.application.marketplaceApps',
        icon: { icon: 'mdi-apps', size: 20 },
        to: 'marketplace',
      },
      {
        title: 'menu.application.marketplaceGames',
        icon: { icon: 'mdi-gamepad', size: 20 },
        to: 'marketplace-games',
      },
      {
        title: 'menu.application.marketplaceWordPress',
        icon: { icon: 'mdi-wordpress', size: 20 },
        to: 'marketplace-wordpress',
      },
    ],
  },
]
