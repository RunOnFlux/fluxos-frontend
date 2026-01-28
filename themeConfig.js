import { defineThemeConfig } from '@core'
import { Skins } from '@core/enums'
import { breakpointsVuetifyV3 } from '@vueuse/core'
import { VIcon } from 'vuetify/components/VIcon'

// ❗ Logo SVG must be imported with ?raw suffix
import logoDark from '@images/logo_dark.svg?raw'
import logoLight from '@images/logo_light.svg?raw'
import { AppContentLayoutNav, ContentWidth, FooterType, NavbarType } from '@layouts/enums'
import { h, shallowRef } from 'vue'
import Logo from '@core/components/Logo.vue'

// Use the Logo Vue component (like FluxCloud's Logo widget)
export const logoRef = shallowRef(h(Logo, {
  title: 'Flux',
  gradientTitle: 'Cloud',
}))

export const logos = { light: logoLight, dark: logoDark }

export const { themeConfig, layoutConfig } = defineThemeConfig({
  app: {
    title: 'Flux',
    logo: logoRef,
    contentWidth: ContentWidth.Fluid,
    contentLayoutNav: AppContentLayoutNav.Vertical,
    overlayNavFromBreakpoint: breakpointsVuetifyV3.lg - 1, // 1 for matching with vuetify breakpoint. Docs: https://next.vuetifyjs.com/en/features/display-and-platform/
    i18n: {
      enable: true,
      defaultLocale: 'en',
      langConfig: [
        { label: 'English', i18nLang: 'en', isRTL: false },           // ~1.5B speakers
        { label: '中文', i18nLang: 'zh-CN', isRTL: false },            // ~1.1B speakers
        { label: 'हिन्दी', i18nLang: 'hi', isRTL: false },              // ~600M speakers
        { label: 'Español', i18nLang: 'es', isRTL: false },           // ~550M speakers
        { label: 'العربية', i18nLang: 'ar', isRTL: true },             // ~420M speakers
        { label: 'Français', i18nLang: 'fr', isRTL: false },          // ~320M speakers
        { label: 'বাংলা', i18nLang: 'bn', isRTL: false },              // ~270M speakers
        { label: 'Português', i18nLang: 'pt', isRTL: false },         // ~260M speakers
        { label: 'Русский', i18nLang: 'ru', isRTL: false },           // ~250M speakers
        { label: 'ਪੰਜਾਬੀ', i18nLang: 'pa', isRTL: false },             // ~150M speakers
        { label: 'Deutsch', i18nLang: 'de', isRTL: false },           // ~130M speakers
        { label: '日本語', i18nLang: 'ja', isRTL: false },             // ~125M speakers
        { label: 'Basa Jawa', i18nLang: 'jv', isRTL: false },         // ~98M speakers
        { label: 'मराठी', i18nLang: 'mr', isRTL: false },              // ~95M speakers
        { label: 'తెలుగు', i18nLang: 'te', isRTL: false },             // ~95M speakers
        { label: 'Türkçe', i18nLang: 'tr', isRTL: false },            // ~90M speakers
        { label: 'Tiếng Việt', i18nLang: 'vi', isRTL: false },        // ~85M speakers
        { label: '한국어', i18nLang: 'ko', isRTL: false },             // ~80M speakers
        { label: 'தமிழ்', i18nLang: 'ta', isRTL: false },              // ~80M speakers
        { label: 'Italiano', i18nLang: 'it', isRTL: false },          // ~68M speakers
        { label: 'Polski', i18nLang: 'pl', isRTL: false },            // ~45M speakers
      ],
    },
    theme: 'dark',
    skin: Skins.Default,
    iconRenderer: VIcon,
  },
  navbar: {
    type: NavbarType.Sticky,
    navbarBlur: true,
  },
  footer: { type: FooterType.Static },
  verticalNav: {
    isVerticalNavCollapsed: false,
    defaultNavItemIconProps: { icon: 'tabler-circle' },
    isVerticalNavSemiDark: false,
  },
  horizontalNav: {
    type: 'sticky',
    transition: 'slide-y-reverse-transition',
    popoverOffset: 6,
  },

  /*
    // ℹ️  In below Icons section, you can specify icon for each component. Also you can use other props of v-icon component like `color` and `size` for each icon.
    // Such as: chevronDown: { icon: 'tabler-chevron-down', color:'primary', size: '24' },
    */
  icons: {
    chevronDown: { icon: 'tabler-chevron-down' },
    chevronRight: { icon: 'tabler-chevron-right', size: 20 },
    close: { icon: 'tabler-x', size: 20 },
    verticalNavPinned: { icon: 'tabler-circle-dot', size: 20 },
    verticalNavUnPinned: { icon: 'tabler-circle', size: 20 },
    sectionTitlePlaceholder: { icon: 'tabler-minus' },
  },
})
