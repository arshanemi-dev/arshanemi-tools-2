import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const STORE_PATH = join(process.cwd(), 'data', 'sku-store.json')

function readStore() {
  try { return JSON.parse(readFileSync(STORE_PATH, 'utf8')) }
  catch { return { masterSkus: [], skuMappings: [] } }
}
function writeStore(data) {
  writeFileSync(STORE_PATH, JSON.stringify(data, null, 2))
}

export async function GET() {
  const store = readStore()
  return NextResponse.json({ skuMappings: store.skuMappings || [] })
}

export async function POST(request) {
  const { sku, masterSku } = await request.json()
  const store = readStore()
  const list  = store.skuMappings || []

  const idx = list.findIndex(m => m.sku === sku)
  if (idx >= 0) {
    list[idx] = { sku, masterSku }
  } else {
    list.push({ sku, masterSku })
  }
  store.skuMappings = list
  writeStore(store)
  return NextResponse.json({ skuMappings: store.skuMappings })
}

export async function DELETE(request) {
  const { sku } = await request.json()
  const store   = readStore()
  store.skuMappings = (store.skuMappings || []).filter(m => m.sku !== sku)
  writeStore(store)
  return NextResponse.json({ skuMappings: store.skuMappings })
}
