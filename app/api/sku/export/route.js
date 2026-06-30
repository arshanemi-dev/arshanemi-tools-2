import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function POST(request) {
  const { masters = [], mappings = [], unmappedSkus = [] } = await request.json()

  const wb = new ExcelJS.Workbook()

  // Main sheet FIRST — so SheetNames[0] is always 'SKU Mapping' for the upload parser
  const ws = wb.addWorksheet('SKU Mapping')

  // Hidden reference sheet for dropdown (added after so it doesn't interfere with upload)
  const refSheet = wb.addWorksheet('MasterList', { state: 'veryHidden' })
  masters.forEach((m, i) => { refSheet.getCell(i + 1, 1).value = m })
  ws.columns = [
    { header: 'Master SKU', key: 'masterSku', width: 24 },
    { header: 'SKU',        key: 'sku',       width: 24 },
    { header: 'UnMap SKU',  key: 'unmapSku',  width: 24 },
  ]

  // Style header row
  ws.getRow(1).eachCell(cell => {
    cell.font      = { bold: true }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E0FF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })
  ws.getRow(1).height = 20

  // Mapped pairs
  for (const master of masters) {
    const children = mappings.filter(m => m.masterSku === master)
    if (children.length === 0) {
      ws.addRow([master, 0, 0])
    } else {
      for (const { sku } of children) {
        ws.addRow([master, sku, 0])
      }
    }
  }

  // Orphan mappings (master deleted but mapping survived)
  for (const { sku, masterSku } of mappings.filter(m => !masters.includes(m.masterSku))) {
    ws.addRow([masterSku, sku, 0])
  }

  // Unmapped PDF SKUs → UnMap SKU column
  for (const sku of unmappedSkus) {
    ws.addRow([0, 0, sku])
  }

  // Dropdown validation on column A for all data rows
  if (masters.length > 0) {
    const lastRow = Math.max(ws.rowCount + 200, 500)
    ws.dataValidations.add(`A2:A${lastRow}`, {
      type:         'list',
      allowBlank:   true,
      showDropDown: false,   // false = show arrow in Excel
      formulae:     [`MasterList!$A$1:$A$${masters.length}`],
    })
  }

  const buffer = await wb.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="sku-mapping.xlsx"',
    },
  })
}
