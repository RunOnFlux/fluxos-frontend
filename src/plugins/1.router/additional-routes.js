// 👉 Redirects
export const redirects = [
  // ℹ️ We are redirecting to different pages based on role.
  // NOTE: Role is just for UI purposes. ACL is based on abilities.
  {
    path: '/',
    name: 'index',
    component: () => import('@/pages/dashboards/home.vue'),
    meta: {
      layout: 'default',
    },
  },
  {
    path: '/dashboards/home',
    redirect: '/',
  },

  // SEO: Redirect incorrect URL formats to correct ones
  // These were causing Soft 404 errors in Google Search Console
  {
    path: '/fluxdrive',
    redirect: '/flux-drive',
  },
  {
    path: '/cost_calculator',
    redirect: '/cost-calculator',
  },
]
