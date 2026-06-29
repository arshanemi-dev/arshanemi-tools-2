/**
 * Sorts an array of { pageIndex, labelData } by the given sort mode.
 * Returns a sorted array of pageIndex values.
 */
export function sortLabels(pages, sortMode, skuMappings = []) {
  const sorted = [...pages]

  const key = (item) => {
    const d = item.labelData

    switch (sortMode) {
      case 'sku-group':
        return (d.sku || 'zzz').toUpperCase()

      case 'pickup-partner':
        return (d.courierPartner || 'zzz').toLowerCase()

      case 'date':
        return d.orderDate || '9999-99-99'

      case 'company-wise': {
        // group by first word of rawSnippet as proxy for seller/company
        const snippet = (d.rawSnippet || '').toLowerCase()
        return snippet.slice(0, 20)
      }

      case 'master-sku-group': {
        const sku = (d.sku || '').toUpperCase()
        const mapping = skuMappings.find(m => m.sku.toUpperCase() === sku)
        return mapping ? mapping.masterSku.toUpperCase() : 'zzz_' + sku
      }

      default:
        return item.pageIndex
    }
  }

  sorted.sort((a, b) => {
    const ka = key(a)
    const kb = key(b)
    if (ka < kb) return -1
    if (ka > kb) return 1
    return a.pageIndex - b.pageIndex
  })

  return sorted.map(p => p.pageIndex)
}
