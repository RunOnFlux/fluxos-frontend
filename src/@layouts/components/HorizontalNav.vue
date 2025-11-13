<script setup>
import {
  HorizontalNavGroup,
  HorizontalNavLink,
} from '@layouts/components'
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

const props = defineProps({
  navItems: {
    type: null,
    required: true,
  },
})

const resolveNavItemComponent = item => {
  if ('children' in item)
    return HorizontalNavGroup

  return HorizontalNavLink
}

// Keep track of all menu item refs
const menuRefs = ref([])

const setMenuRef = (el, index) => {
  if (el) {
    menuRefs.value[index] = el
  }
}

// Close all other menus when one is opened
const handleMenuOpen = openedIndex => {
  menuRefs.value.forEach((ref, index) => {
    if (index !== openedIndex && ref && ref.hideContentImmediately) {
      ref.hideContentImmediately()
    }
  })
}

provide('onMenuOpen', handleMenuOpen)

// Scroll arrows functionality
const navContainer = ref(null)
const wrapperContainer = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
let resizeObserver = null
let mutationObserver = null

const updateScrollState = () => {
  if (!navContainer.value || !wrapperContainer.value) {
    console.log('No navContainer or wrapper ref')
    return
  }

  // Use setTimeout to ensure DOM is fully rendered
  setTimeout(() => {
    if (!navContainer.value || !wrapperContainer.value) return

    const { scrollLeft, scrollWidth } = navContainer.value
    const wrapperWidth = wrapperContainer.value.clientWidth
    const clientWidth = navContainer.value.clientWidth

    // Simple check: does content overflow?
    // Compare scrollWidth (content size) vs wrapperWidth (total available space)
    const hasOverflow = scrollWidth > wrapperWidth

    canScrollLeft.value = hasOverflow && scrollLeft > 5
    canScrollRight.value = hasOverflow && scrollLeft < scrollWidth - clientWidth - 5

    // Debug logging
    console.log('Horizontal Nav Scroll State:', {
      scrollLeft,
      scrollWidth,
      clientWidth,
      wrapperWidth,
      canScrollLeft: canScrollLeft.value,
      canScrollRight: canScrollRight.value,
      hasOverflow,
      difference: scrollWidth - wrapperWidth
    })
  }, 100)
}

const scrollLeft = () => {
  if (navContainer.value) {
    navContainer.value.scrollBy({
      left: -200,
      behavior: 'smooth',
    })
  }
}

const scrollRight = () => {
  if (navContainer.value) {
    navContainer.value.scrollBy({
      left: 200,
      behavior: 'smooth',
    })
  }
}

onMounted(() => {
  nextTick(() => {
    updateScrollState()

    // Observe resize changes on both containers
    if (navContainer.value && wrapperContainer.value) {
      resizeObserver = new ResizeObserver(() => {
        updateScrollState()
      })
      resizeObserver.observe(navContainer.value)
      resizeObserver.observe(wrapperContainer.value)

      // Observe DOM mutations (items added/removed)
      mutationObserver = new MutationObserver(() => {
        updateScrollState()
      })
      mutationObserver.observe(navContainer.value, {
        childList: true,
        subtree: true,
      })
    }
  })

  window.addEventListener('resize', updateScrollState)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollState)
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (mutationObserver) {
    mutationObserver.disconnect()
  }
})

// Watch navItems to update scroll state when items change
watch(() => props.navItems, () => {
  nextTick(() => {
    updateScrollState()
  })
}, { deep: true, immediate: true })
</script>

<template>
  <div ref="wrapperContainer" class="horizontal-nav-wrapper">
    <!-- Left Arrow -->
    <button
      v-show="canScrollLeft"
      class="scroll-arrow left-arrow"
      @click="scrollLeft"
    >
      <VIcon icon="mdi-chevron-left" size="24" />
    </button>

    <!-- Navigation Items Container -->
    <ul ref="navContainer" class="nav-items" @scroll="updateScrollState">
      <Component
        :is="resolveNavItemComponent(item)"
        v-for="(item, index) in navItems"
        :key="index"
        :ref="el => setMenuRef(el, index)"
        data-allow-mismatch
        :item="item"
        :menu-index="index"
      />
      <slot name="after-nav-items" />
    </ul>

    <!-- Right Arrow -->
    <button
      v-show="canScrollRight"
      class="scroll-arrow right-arrow"
      @click="scrollRight"
    >
      <VIcon icon="mdi-chevron-right" size="24" />
    </button>
  </div>
</template>

<style lang="scss">
.layout-wrapper.layout-nav-type-horizontal {
  .horizontal-nav-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    position: relative;
  }

  .nav-items {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    flex: 1;

    /* Hide scrollbar */
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .scroll-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    padding: 0;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    flex-shrink: 0;

    &:hover {
      background: rgba(var(--v-theme-primary), 0.08);
      border-color: rgb(var(--v-theme-primary));
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .left-arrow {
    order: -1;
  }

  .right-arrow {
    order: 1;
  }
}
</style>
