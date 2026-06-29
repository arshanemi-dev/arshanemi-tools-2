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
  return NextResponse.json({ masterSkus: store.masterSkus || [] })
}

export async function POST(request) {
  const { sku, oldSku, newSku } = await request.json()
  const store = readStore()

  // update existing
  if (oldSku && newSku) {
    store.masterSkus = (store.masterSkus || []).map(s => s === oldSku ? newSku : s)
    store.skuMappings = (store.skuMappings || []).map(m =>
      m.masterSku === oldSku ? { ...m, masterSku: newSku } : m
    )
    writeStore(store)
    return NextResponse.json({ masterSkus: store.masterSkus })
  }

  // add new
  if (!store.masterSkus.includes(sku)) {
    store.masterSkus.push(sku)
    writeStore(store)
  }
  return NextResponse.json({ masterSkus: store.masterSkus })
}

export async function DELETE(request) {
  const { sku } = await request.json()
  const store   = readStore()
  store.masterSkus = (store.masterSkus || []).filter(s => s !== sku)
  writeStore(store)
  return NextResponse.json({ masterSkus: store.masterSkus })
}
