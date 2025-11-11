export default [
  {
    title: 'menu.application.myApplications',
    icon: { icon: 'mdi-apps' },
    to: 'apps-management',
  },
  {
    title: 'menu.application.registerNewApp',  // Key for title without translation
    icon: { icon: 'mdi-package-variant-plus', size: 20 },
    to: 'apps-register',
  },
  {
    title: 'menu.application.marketplace',  // Direct link to marketplace
    icon: { icon: 'mdi-shopping-search', size: 20 },
    iconClass: 'nav-icon-bounce',
    itemClass: 'nav-marketplace-promoted',
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
]
