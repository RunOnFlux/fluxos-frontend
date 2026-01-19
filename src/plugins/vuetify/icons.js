import { Icon, addCollection } from '@iconify/vue'
import { h } from 'vue'

// Import pre-generated optimized icon sets (only icons actually used in the app)
// This reduces the icons bundle from ~983KB to ~155KB (96.8% smaller)
// To add new icons: update icon-sets.js and run: npm run build:icons
import { mdiIcons, tablerIcons } from './icons-optimized'

// Add optimized icon collections for offline use
addCollection(mdiIcons)
addCollection(tablerIcons)

// Custom SVG imports (checkboxes, radios, etc.)
import checkboxChecked from '@images/svg/checkbox-checked.svg'
import checkboxIndeterminate from '@images/svg/checkbox-indeterminate.svg'
import checkboxUnchecked from '@images/svg/checkbox-unchecked.svg'
import radioChecked from '@images/svg/radio-checked.svg'
import radioUnchecked from '@images/svg/radio-unchecked.svg'
import rustLogo from '@images/rust-logo.svg'
import bunLogo from '@images/bun-logo.svg'


// Custom SVG icon overrides (checkboxes and radios)
const customIcons = {
  'mdi-checkbox-blank-outline': checkboxUnchecked,
  'mdi-checkbox-marked': checkboxChecked,
  'mdi-minus-box': checkboxIndeterminate,
  'mdi-radiobox-marked': radioChecked,
  'mdi-radiobox-blank': radioUnchecked,
}

// Custom PNG icon
const customPngIcons = {
  'flux-logo': '/images/logo.png',
}

// Custom SVG icon
const customSvgIcons = {
  'rust-logo': rustLogo,
  'bun-logo': bunLogo,
}

const aliases = {
  calendar: 'tabler:calendar',
  collapse: 'tabler:chevron-up',
  complete: 'tabler:check',
  cancel: 'tabler:x',
  close: 'tabler:x',
  delete: 'tabler:circle-x-filled',
  clear: 'tabler:circle-x',
  success: 'tabler:circle-check',
  info: 'tabler:info-circle',
  warning: 'tabler:alert-triangle',
  error: 'tabler:alert-circle',
  prev: 'tabler:chevron-left',
  ratingEmpty: 'tabler:star',
  ratingFull: 'tabler:star-filled',
  ratingHalf: 'tabler:star-half-filled',
  next: 'tabler:chevron-right',
  delimiter: 'tabler:circle',
  sort: 'tabler:arrow-up',
  expand: 'tabler:chevron-down',
  menu: 'tabler:menu-2',
  subgroup: 'tabler:caret-down',
  dropdown: 'tabler:chevron-down',
  edit: 'tabler:pencil',
  loading: 'tabler:refresh',
  first: 'tabler:player-skip-back',
  last: 'tabler:player-skip-forward',
  unfold: 'tabler:arrows-move-vertical',
  file: 'tabler:paperclip',
  plus: 'tabler:plus',
  minus: 'tabler:minus',
  sortAsc: 'tabler:arrow-up',
  sortDesc: 'tabler:arrow-down',
}

export const iconify = {
  component: props => {
    const icon = props.icon

    if (!icon) {
      console.log('No icon provided, returning null')
      
      return null
    }

    if (typeof icon === 'string' && customPngIcons[icon]) {
      return h('img', {
        src: customPngIcons[icon],
        alt: icon,
        style: {
          width: '24px',
          height: '24px',
          verticalAlign: 'middle',
        },
      })
    }

    if (typeof icon === 'string' && customSvgIcons[icon]) {
      return h(customSvgIcons[icon])
    }

    if (typeof icon === 'string' && customIcons[icon]) {
      return h(customIcons[icon])
    }

    if (typeof icon === 'string' && aliases[icon]) {
      return h(Icon, { icon: aliases[icon] })
    }
    
    if (typeof icon === 'string' && icon.startsWith('mdi')) {
      return h(Icon, { icon })
    }

    if (typeof icon === 'string' && icon.includes(':')) {
      return h(Icon, { icon })
    }

    // 5. Fallback to CSS-based icons (MDI, etc.)
    return h(props.tag, {
      ...props,
      class: [props.icon],
      tag: undefined,
      icon: undefined,
    })
  },
}

// Export the icons configuration
export const icons = {
  defaultSet: 'iconify',
  aliases,
  sets: {
    iconify,
  },
}
