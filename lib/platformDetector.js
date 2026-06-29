/**
 * Detects the e-commerce platform from PDF text content.
 * Uses keyword fingerprinting on the first ~3000 chars.
 */
export function detectPlatform(text) {
  const t = text.slice(0, 3000).toLowerCase()

  if (t.includes('flipkartlogistics') || t.includes('myn/') || t.includes('fk logistics')) {
    return 'myntra'
  }
  if (t.includes('std e-kart') || t.includes('e-kart') || t.includes('fmpc') || /\bod\d{10,}/.test(t)) {
    return 'flipkart'
  }
  if (t.includes('valmo') || t.includes('dgayl') || t.includes('meesho')) {
    return 'meesho'
  }
  if (t.includes('amazon') || t.includes('amzn')) {
    return 'amazon'
  }
  if (t.includes('snapdeal') || t.includes('vulcan')) {
    return 'snapdeal'
  }
  return 'manual'
}
