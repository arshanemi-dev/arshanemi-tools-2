/**
 * SKU storage abstraction.
 * NEXT_PUBLIC_IS_CONNECT=true  → server-side data/sku-store.json via API
 * NEXT_PUBLIC_IS_CONNECT=false → browser localStorage JSON
 */

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'

// ── localStorage keys ──────────────────────────────────────────────────────────
const KEY_MASTER   = 'pdf-tool-master-skus'
const KEY_MAPPINGS = 'pdf-tool-sku-mappings'

function lsRead(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function lsWrite(key, value) {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value))
}

// ── API helpers (connected mode) ───────────────────────────────────────────────
async function apiGet(endpoint) {
  const res  = await fetch(endpoint)
  const data = await res.json()
  return data
}
async function apiPost(endpoint, body) {
  const res  = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  return res.json()
}
async function apiDelete(endpoint, body) {
  const res = await fetch(endpoint, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  return res.json()
}

// ── Master SKU ─────────────────────────────────────────────────────────────────
export async function getMasterSKUs() {
  if (IS_CONNECT) {
    const data = await apiGet('/api/sku/master')
    return data.masterSkus || []
  }
  return lsRead(KEY_MASTER, [])
}

export async function addMasterSKU(sku) {
  if (IS_CONNECT) {
    return apiPost('/api/sku/master', { sku })
  }
  const list = lsRead(KEY_MASTER, [])
  if (!list.includes(sku)) { lsWrite(KEY_MASTER, [...list, sku]) }
  return lsRead(KEY_MASTER, [])
}

export async function deleteMasterSKU(sku) {
  if (IS_CONNECT) {
    return apiDelete('/api/sku/master', { sku })
  }
  lsWrite(KEY_MASTER, lsRead(KEY_MASTER, []).filter(s => s !== sku))
  return lsRead(KEY_MASTER, [])
}

export async function updateMasterSKU(oldSku, newSku) {
  if (IS_CONNECT) {
    return apiPost('/api/sku/master/update', { oldSku, newSku })
  }
  const list = lsRead(KEY_MASTER, []).map(s => (s === oldSku ? newSku : s))
  lsWrite(KEY_MASTER, list)
  return list
}

// ── SKU Mappings ───────────────────────────────────────────────────────────────
export async function getSkuMappings() {
  if (IS_CONNECT) {
    const data = await apiGet('/api/sku/map')
    return data.skuMappings || []
  }
  return lsRead(KEY_MAPPINGS, [])
}

export async function addSkuMapping(sku, masterSku) {
  if (IS_CONNECT) {
    return apiPost('/api/sku/map', { sku, masterSku })
  }
  const list = lsRead(KEY_MAPPINGS, [])
  if (!list.find(m => m.sku === sku)) {
    lsWrite(KEY_MAPPINGS, [...list, { sku, masterSku }])
  }
  return lsRead(KEY_MAPPINGS, [])
}

export async function updateSkuMapping(sku, masterSku) {
  if (IS_CONNECT) {
    return apiPost('/api/sku/map/update', { sku, masterSku })
  }
  const list = lsRead(KEY_MAPPINGS, []).map(m => m.sku === sku ? { sku, masterSku } : m)
  lsWrite(KEY_MAPPINGS, list)
  return list
}

export async function deleteSkuMapping(sku) {
  if (IS_CONNECT) {
    return apiDelete('/api/sku/map', { sku })
  }
  lsWrite(KEY_MAPPINGS, lsRead(KEY_MAPPINGS, []).filter(m => m.sku !== sku))
  return lsRead(KEY_MAPPINGS, [])
}
