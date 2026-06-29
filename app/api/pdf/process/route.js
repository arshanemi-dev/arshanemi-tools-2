import { NextResponse } from 'next/server'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import { detectPlatform } from '@/lib/platformDetector'
import { extractLabel }   from '@/lib/labelExtractor'
import { sortLabels }     from '@/lib/pdfSorter'
import { buildSortedPdf } from '@/lib/pdfBuilder'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request) {
  const formData   = await request.formData()
  const file       = formData.get('file')
  const sortMode   = formData.get('sortMode') || 'sku-group'
  const skuMappingsRaw = formData.get('skuMappings')
  const skuMappings    = skuMappingsRaw ? JSON.parse(skuMappingsRaw) : []

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  // Parse all pages
  let parsed
  try {
    parsed = await pdfParse(buffer, { max: 0 }) // max:0 = all pages
  } catch (err) {
    return NextResponse.json({ error: 'Failed to parse PDF: ' + err.message }, { status: 422 })
  }

  // Detect platform from first page text
  const platform = detectPlatform(parsed.text)

  // Parse per-page text by re-running with pagerender
  const pageTexts = []
  await pdfParse(buffer, {
    max: 0,
    pagerender(pageData) {
      return pageData.getTextContent().then(tc => {
        pageTexts.push(tc.items.map(i => i.str).join(' '))
      })
    },
  })

  // Extract label data per page
  const pages = pageTexts.map((text, idx) => ({
    pageIndex:  idx,
    labelData:  extractLabel(text, platform),
  }))

  // Sort
  const sortedIndexes = sortLabels(pages, sortMode, skuMappings)

  // Rebuild PDF
  const sortedBytes = await buildSortedPdf(buffer, sortedIndexes)
  const base64      = Buffer.from(sortedBytes).toString('base64')

  // Summary for display
  const summary = sortedIndexes.map(i => pages[i].labelData)

  // Increment processed count (stored client-side; just return count signal)
  return NextResponse.json({
    platform,
    pageCount:   pages.length,
    sortMode,
    sortedPdfBase64: base64,
    labelsSummary:   summary,
  })
}
