'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { renderPageToCanvas, applyCropToAllPages } from '@/lib/pdfCropper'
import { RotateCcw, Scissors } from 'lucide-react'

const MIN_SIZE = 20

export default function ManualCropTool({ pdfBytes, filename, onDownload }) {
  const canvasRef     = useRef(null)
  const containerRef  = useRef(null)
  const [dims, setDims]               = useState(null)
  const [crop, setCrop]               = useState(null)     // { x, y, width, height } in canvas px
  const [dragging, setDragging]       = useState(null)     // { type: 'new'|'move'|handle, startX, startY, origCrop }
  const [applying, setApplying]       = useState(false)
  const [ready, setReady]             = useState(false)

  // Render page 1 to canvas whenever pdfBytes changes
  useEffect(() => {
    if (!pdfBytes || !canvasRef.current) return
    setReady(false)
    setCrop(null)
    renderPageToCanvas(pdfBytes, 0, canvasRef.current)
      .then(d => { setDims(d); setReady(true) })
      .catch(err => console.error('PDF render error:', err))
  }, [pdfBytes])

  // ── Drag helpers ──────────────────────────────────────────────────────────────
  function getCanvasPos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: Math.max(0, Math.min(clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(clientY - rect.top,  rect.height)),
    }
  }

  function clampCrop(c, w, h) {
    const x = Math.max(0, Math.min(c.x, w - MIN_SIZE))
    const y = Math.max(0, Math.min(c.y, h - MIN_SIZE))
    return {
      x,
      y,
      width:  Math.max(MIN_SIZE, Math.min(c.width,  w - x)),
      height: Math.max(MIN_SIZE, Math.min(c.height, h - y)),
    }
  }

  const onMouseDown = useCallback((e) => {
    if (!ready || !canvasRef.current) return
    e.preventDefault()
    const pos = getCanvasPos(e)
    const cw  = canvasRef.current.getBoundingClientRect().width
    const ch  = canvasRef.current.getBoundingClientRect().height

    if (!crop) {
      setDragging({ type: 'new', startX: pos.x, startY: pos.y })
      setCrop({ x: pos.x, y: pos.y, width: 0, height: 0 })
      return
    }

    // Check handles first
    const handles = getHandlePositions(crop)
    for (const [hKey, hp] of Object.entries(handles)) {
      if (Math.abs(pos.x - hp.x) < 10 && Math.abs(pos.y - hp.y) < 10) {
        setDragging({ type: 'handle', handle: hKey, startX: pos.x, startY: pos.y, origCrop: { ...crop } })
        return
      }
    }

    // Check move (inside crop rect)
    if (pos.x >= crop.x && pos.x <= crop.x + crop.width &&
        pos.y >= crop.y && pos.y <= crop.y + crop.height) {
      setDragging({ type: 'move', startX: pos.x, startY: pos.y, origCrop: { ...crop } })
      return
    }

    // New crop
    setDragging({ type: 'new', startX: pos.x, startY: pos.y })
    setCrop({ x: pos.x, y: pos.y, width: 0, height: 0 })
  }, [ready, crop])

  const onMouseMove = useCallback((e) => {
    if (!dragging || !canvasRef.current) return
    e.preventDefault()
    const pos = getCanvasPos(e)
    const cw  = canvasRef.current.getBoundingClientRect().width
    const ch  = canvasRef.current.getBoundingClientRect().height

    if (dragging.type === 'new') {
      const x = Math.min(pos.x, dragging.startX)
      const y = Math.min(pos.y, dragging.startY)
      setCrop(clampCrop({
        x, y,
        width:  Math.abs(pos.x - dragging.startX),
        height: Math.abs(pos.y - dragging.startY),
      }, cw, ch))
      return
    }

    if (dragging.type === 'move') {
      const dx = pos.x - dragging.startX
      const dy = pos.y - dragging.startY
      setCrop(clampCrop({
        x:      dragging.origCrop.x + dx,
        y:      dragging.origCrop.y + dy,
        width:  dragging.origCrop.width,
        height: dragging.origCrop.height,
      }, cw, ch))
      return
    }

    if (dragging.type === 'handle') {
      const o  = dragging.origCrop
      let { x, y, width, height } = o
      const dx = pos.x - dragging.startX
      const dy = pos.y - dragging.startY
      const h  = dragging.handle

      if (h.includes('e')) width  = Math.max(MIN_SIZE, o.width  + dx)
      if (h.includes('s')) height = Math.max(MIN_SIZE, o.height + dy)
      if (h.includes('w')) { x = o.x + dx; width  = Math.max(MIN_SIZE, o.width  - dx) }
      if (h.includes('n')) { y = o.y + dy; height = Math.max(MIN_SIZE, o.height - dy) }

      setCrop(clampCrop({ x, y, width, height }, cw, ch))
    }
  }, [dragging])

  const onMouseUp = useCallback(() => { setDragging(null) }, [])

  // ── Apply crop ────────────────────────────────────────────────────────────────
  async function handleApply() {
    if (!crop || !dims || !pdfBytes) return
    setApplying(true)
    try {
      // Scale crop from display coords to actual canvas coords
      const rect   = canvasRef.current.getBoundingClientRect()
      const scaleX = canvasRef.current.width  / rect.width
      const scaleY = canvasRef.current.height / rect.height
      const pixelCrop = {
        x:      crop.x      * scaleX,
        y:      crop.y      * scaleY,
        width:  crop.width  * scaleX,
        height: crop.height * scaleY,
      }
      const result = await applyCropToAllPages(pdfBytes, pixelCrop, {
        ...dims,
        canvasWidth:  canvasRef.current.width,
        canvasHeight: canvasRef.current.height,
      })
      onDownload(result, (filename || 'cropped') + '_cropped.pdf')
    } catch (err) {
      console.error('Crop error:', err)
    } finally {
      setApplying(false)
    }
  }

  // ── Dimensions display ────────────────────────────────────────────────────────
  function cropMm() {
    if (!crop || !dims) return null
    const pxPerMm = dims.canvasWidth / (dims.pdfWidth / 2.8346)
    const wMm = (crop.width  / pxPerMm).toFixed(0)
    const hMm = (crop.height / pxPerMm).toFixed(0)
    return `${wMm}mm × ${hMm}mm`
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden select-none"
        style={{ border: '1px solid var(--lt-divider)', backgroundColor: '#000', cursor: ready ? 'crosshair' : 'default' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onMouseDown}
        onTouchMove={onMouseMove}
        onTouchEnd={onMouseUp}
      >
        <canvas ref={canvasRef} className="w-full block" />

        {/* Crop rectangle overlay */}
        {crop && crop.width > 0 && crop.height > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left:   crop.x,
              top:    crop.y,
              width:  crop.width,
              height: crop.height,
              border: '2px dashed var(--lt-accent)',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
            }}
          >
            {/* 8 resize handles */}
            {Object.entries(getHandlePositions({ x: 0, y: 0, width: crop.width, height: crop.height })).map(([key, pos]) => (
              <div
                key={key}
                className="absolute w-3 h-3 rounded-full pointer-events-auto cursor-pointer"
                style={{
                  left: pos.x - 6,
                  top:  pos.y - 6,
                  backgroundColor: 'var(--lt-accent)',
                  border: '2px solid #fff',
                  cursor: HANDLE_CURSORS[key],
                }}
              />
            ))}
          </div>
        )}

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-sm"
               style={{ color: 'var(--lt-text-subtle)' }}>
            Rendering page…
          </div>
        )}
      </div>

      {/* Dimension + actions */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs" style={{ color: 'var(--lt-text-subtle)' }}>
          {cropMm() ? <>Crop: <span style={{ color: 'var(--lt-accent-light)' }}>{cropMm()}</span></> : 'Drag to set crop area'}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCrop(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors"
            style={{ color: 'var(--lt-text-subtle)', border: '1px solid var(--lt-divider)' }}
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            onClick={handleApply}
            disabled={!crop || !crop.width || applying}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--lt-accent)', color: '#fff' }}
          >
            <Scissors size={12} />
            {applying ? 'Applying…' : 'Apply Crop to All Pages'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getHandlePositions({ x, y, width, height }) {
  return {
    nw: { x: 0,         y: 0          },
    n:  { x: width / 2, y: 0          },
    ne: { x: width,     y: 0          },
    e:  { x: width,     y: height / 2 },
    se: { x: width,     y: height     },
    s:  { x: width / 2, y: height     },
    sw: { x: 0,         y: height     },
    w:  { x: 0,         y: height / 2 },
  }
}

const HANDLE_CURSORS = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  e:  'e-resize',  se: 'se-resize', s: 's-resize',
  sw: 'sw-resize', w: 'w-resize',
}
