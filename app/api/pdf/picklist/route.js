import { NextResponse }          from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export const runtime = 'nodejs'

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  purple:  rgb(0.49, 0.23, 0.93),
  purpleL: rgb(0.94, 0.90, 1.00),
  black:   rgb(0.08, 0.08, 0.08),
  muted:   rgb(0.45, 0.45, 0.45),
  line:    rgb(0.88, 0.88, 0.88),
  altRow:  rgb(0.97, 0.97, 0.98),
  bar:     rgb(0.72, 0.58, 0.97),
  green:   rgb(0.08, 0.60, 0.24),
  orange:  rgb(0.80, 0.42, 0.06),
}

export async function POST(request) {
  const { labels = [], mappings = [], mode = 'pick-list' } = await request.json()

  const isMaster = mode === 'master-pick-list'
  const today    = new Date().toLocaleDateString('en-GB')

  // ── Tally SKU counts from label summary ────────────────────────────────────
  const skuCount = {}
  for (const lbl of labels) {
    const sku = (lbl.sku || '').trim()
    if (sku) skuCount[sku] = (skuCount[sku] || 0) + 1
  }
  const totalOrders = Object.values(skuCount).reduce((s, c) => s + c, 0)

  // ── Build groups ───────────────────────────────────────────────────────────
  // groups: [{ master: string|null, rows: [{sku, count}], subtotal }]
  let groups = []

  if (isMaster) {
    const masterBucket = {}  // masterSku → { sku → count }
    const unmapped     = {}

    for (const [sku, count] of Object.entries(skuCount)) {
      const m = mappings.find(mp => mp.sku.toUpperCase() === sku.toUpperCase())
      if (m) {
        if (!masterBucket[m.masterSku]) masterBucket[m.masterSku] = {}
        masterBucket[m.masterSku][sku] = (masterBucket[m.masterSku][sku] || 0) + count
      } else {
        unmapped[sku] = count
      }
    }

    for (const master of Object.keys(masterBucket).sort()) {
      const rows     = Object.entries(masterBucket[master])
        .map(([sku, count]) => ({ sku, count }))
        .sort((a, b) => b.count - a.count)
      const subtotal = rows.reduce((s, r) => s + r.count, 0)
      groups.push({ master, rows, subtotal })
    }

    if (Object.keys(unmapped).length) {
      const rows     = Object.entries(unmapped)
        .map(([sku, count]) => ({ sku, count }))
        .sort((a, b) => b.count - a.count)
      const subtotal = rows.reduce((s, r) => s + r.count, 0)
      groups.push({ master: 'Unmapped', rows, subtotal })
    }
  } else {
    const rows     = Object.entries(skuCount)
      .map(([sku, count]) => ({ sku, count }))
      .sort((a, b) => b.count - a.count)
    groups = [{ master: null, rows, subtotal: totalOrders }]
  }

  const maxCount = Math.max(...groups.flatMap(g => g.rows.map(r => r.count)), 1)

  // ── Page constants ─────────────────────────────────────────────────────────
  const PW = 595, PH = 842
  const ML = 40, MR = 40, MT = 50
  const CW = PW - ML - MR
  const ROW_H  = 22
  const FOOT_H = 50   // space reserved for footer
  const QTY_X  = PW - MR - 90
  const BAR_X  = QTY_X + 34
  const BAR_MAX = 55

  const doc  = await PDFDocument.create()
  const reg  = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page, y

  // ── Helpers ────────────────────────────────────────────────────────────────
  function addPage() {
    page = doc.addPage([PW, PH])
    y    = PH - MT
  }

  function hline(thickness = 0.5, color = C.line) {
    page.drawLine({
      start: { x: ML, y }, end: { x: PW - MR, y },
      thickness, color,
    })
  }

  function ensure(needed) {
    if (y - needed < FOOT_H) {
      addPage()
      drawHeader()
    }
  }

  function drawHeader() {
    // Title
    const title = isMaster ? 'MASTER PICK LIST' : 'PICK LIST'
    page.drawText(title, { x: ML, y, font: bold, size: 15, color: C.purple })

    const dateStr  = `Date: ${today}`
    const dateW    = reg.widthOfTextAtSize(dateStr, 8)
    page.drawText(dateStr, { x: PW - MR - dateW, y: y + 1, font: reg, size: 8, color: C.muted })
    y -= 20

    hline(1, C.purple)
    y -= 12

    // Column headings
    if (isMaster) {
      page.drawText('Master SKU',  { x: ML,       y, font: bold, size: 8, color: C.muted })
      page.drawText('SKU',         { x: ML + 145, y, font: bold, size: 8, color: C.muted })
    } else {
      page.drawText('SKU',         { x: ML,       y, font: bold, size: 8, color: C.muted })
    }
    page.drawText('Qty',           { x: QTY_X,    y, font: bold, size: 8, color: C.muted })
    y -= 6
    hline(0.4)
    y -= 10
  }

  // ── First page ─────────────────────────────────────────────────────────────
  addPage()
  drawHeader()

  let rowIdx = 0

  for (const { master, rows, subtotal } of groups) {
    if (isMaster) {
      // ── Master SKU group header ─────────────────────────────────────────
      ensure(ROW_H + 4)
      page.drawRectangle({ x: ML, y: y - ROW_H + 6, width: CW, height: ROW_H, color: C.purpleL })
      page.drawText(master, { x: ML + 4, y: y - 9, font: bold, size: 10, color: C.purple })
      const subLabel = `(${subtotal} orders)`
      const subLW    = bold.widthOfTextAtSize(subLabel, 8)
      page.drawText(subLabel, { x: PW - MR - subLW, y: y - 8, font: bold, size: 8, color: C.purple })
      y -= ROW_H + 2

      // ── Child SKU rows ─────────────────────────────────────────────────
      for (const { sku, count } of rows) {
        ensure(ROW_H)
        if (rowIdx % 2 === 0)
          page.drawRectangle({ x: ML, y: y - ROW_H + 6, width: CW, height: ROW_H, color: C.altRow })

        page.drawText(sku, { x: ML + 149, y: y - 9, font: reg, size: 9, color: C.black })

        const qtyStr = String(count)
        const qtyW   = bold.widthOfTextAtSize(qtyStr, 11)
        page.drawText(qtyStr, { x: QTY_X + 20 - qtyW, y: y - 11, font: bold, size: 11, color: C.black })

        const bw = Math.max(3, Math.round((count / maxCount) * BAR_MAX))
        page.drawRectangle({ x: BAR_X, y: y - 14, width: bw, height: 8, color: C.bar, borderRadius: 2 })

        y -= ROW_H
        rowIdx++
      }

      // ── Subtotal row ───────────────────────────────────────────────────
      ensure(18)
      const label = 'Subtotal:'
      page.drawText(label, { x: ML + 149, y: y - 9, font: bold, size: 8, color: C.muted })
      const stStr = String(subtotal)
      const stW   = bold.widthOfTextAtSize(stStr, 10)
      page.drawText(stStr, { x: QTY_X + 20 - stW, y: y - 9, font: bold, size: 10, color: C.green })
      y -= 18

      ensure(6)
      hline(0.3, C.line)
      y -= 8

    } else {
      // ── Simple SKU rows ────────────────────────────────────────────────
      for (const { sku, count } of rows) {
        ensure(ROW_H)
        if (rowIdx % 2 === 0)
          page.drawRectangle({ x: ML, y: y - ROW_H + 6, width: CW, height: ROW_H, color: C.altRow })

        page.drawText(sku, { x: ML, y: y - 11, font: reg, size: 10, color: C.black })

        const qtyStr = String(count)
        const qtyW   = bold.widthOfTextAtSize(qtyStr, 13)
        page.drawText(qtyStr, { x: QTY_X + 20 - qtyW, y: y - 12, font: bold, size: 13, color: C.black })

        const bw = Math.max(3, Math.round((count / maxCount) * BAR_MAX))
        page.drawRectangle({ x: BAR_X, y: y - 15, width: bw, height: 9, color: C.bar, borderRadius: 2 })

        y -= ROW_H
        rowIdx++
      }
    }
  }

  // ── Footer — Total Orders ──────────────────────────────────────────────────
  ensure(36)
  y -= 8
  hline(1, C.purple)
  y -= 20

  const labelTxt = 'Total Orders:'
  const valueTxt = String(totalOrders)
  const lW = bold.widthOfTextAtSize(labelTxt, 11)
  const vW = bold.widthOfTextAtSize(valueTxt,  16)
  const cx = PW / 2

  page.drawText(labelTxt, { x: cx - lW - 6, y, font: bold, size: 11, color: C.muted })
  page.drawText(valueTxt, { x: cx + 2,       y: y - 2, font: bold, size: 16, color: C.purple })

  // ── Respond ────────────────────────────────────────────────────────────────
  const bytes    = await doc.save()
  const filename = isMaster ? 'master-pick-list.pdf' : 'pick-list.pdf'

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
