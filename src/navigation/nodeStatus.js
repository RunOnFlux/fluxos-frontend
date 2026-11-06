/**
 * The navigation for a node: on ArcaneOS the Manage Flux page only shows logs and information, so
 * it is named for that.
 * @param {object[]} items
 * @param {boolean} arcane
 * @returns {object[]}
 */
export const namedForNode = (items, arcane) => {
  if (!arcane) return items

  return items.map(item => ({
    ...item,
    ...(item.to === 'administration-manage-flux' && { title: 'menu.administration.nodeStatus' }),
    ...(item.children && { children: namedForNode(item.children, arcane) }),
  }))
}
