/**
 * Extracts per-label data from a single PDF page's text content.
 * Returns structured label data based on the detected platform.
 */

const SKU_PATTERNS = {
  myntra:   /[Bb]\d{5,7}-?\d{2}[A-Z]{1,5}(?:\(\d+\))?/g,
  flipkart: /\d{4,6}-[A-Za-z]+-[A-Za-z0-9]+/g,
  meesho:   /\d{5,7}-[A-Za-z]+/g,
  amazon:   /[A-Z0-9]{10}/g,
  snapdeal: /[A-Z0-9]{8,12}/g,
  manual:   /[A-Z0-9]{6,}/g,
}

const COURIER_KEYWORDS = [
  'valmo', 'delhivery', 'e-kart', 'ekart', 'xpressbees', 'dtdc',
  'bluedart', 'ecom express', 'shadowfax', 'amazon logistics',
]

function extractSKU(text, platform) {
  const pattern = SKU_PATTERNS[platform] || SKU_PATTERNS.manual
  const matches = text.match(pattern)
  return matches?.[0] || ''
}

function extractCourier(text) {
  const t = text.toLowerCase()
  return COURIER_KEYWORDS.find(k => t.includes(k)) || 'unknown'
}

function extractPIN(text) {
  const m = text.match(/\b[1-9]\d{5}\b/)
  return m?.[0] || ''
}

function extractDate(text) {
  // Matches dd/mm/yy, dd-mm-yy, dd.mm.yyyy, dd/mm/yyyy
  const m = text.match(/\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2,4})\b/)
  if (!m) return ''
  const [, d, mo, y] = m
  const year = y.length === 2 ? `20${y}` : y
  return `${year}-${mo}-${d}`
}

function extractOrderNo(text, platform) {
  if (platform === 'flipkart') {
    const m = text.match(/OD\d{12,}/i)
    return m?.[0] || ''
  }
  if (platform === 'meesho') {
    const m = text.match(/\d{18,}/)?.[0]
    return m || ''
  }
  if (platform === 'myntra') {
    const m = text.match(/(?:MYN|IDO|OSH)\/[A-Z0-9]+/i)
    return m?.[0] || ''
  }
  return ''
}

export function extractLabel(pageText, platform) {
  return {
    sku:          extractSKU(pageText, platform),
    courierPartner: extractCourier(pageText),
    orderDate:    extractDate(pageText),
    orderNo:      extractOrderNo(pageText, platform),
    pin:          extractPIN(pageText),
    platform,
    rawSnippet:   pageText.slice(0, 200).replace(/\n+/g, ' ').trim(),
  }
}
