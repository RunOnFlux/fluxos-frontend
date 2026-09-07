import DOMPurify from 'dompurify'

export default {
  mounted(el, binding) {
    el.innerHTML = DOMPurify.sanitize(binding.value)
  },

  // `updated` runs on every re-render of the element, whether or not what it is
  // bound to changed. Writing innerHTML rebuilds the element's whole subtree, so
  // a list of these - a log pane appending one line - would tear down and
  // rebuild every row on it each time. The same source sanitizes to the same
  // markup, so an unchanged binding has nothing to write.
  updated(el, binding) {
    if (binding.value === binding.oldValue) return

    el.innerHTML = DOMPurify.sanitize(binding.value)
  },
}
