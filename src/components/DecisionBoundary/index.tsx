import { useRef, useEffect } from 'react'
import { forwardPoint } from '../../core/nn'
import type { Weights, Settings } from '../../core/types'
import { XOR_DATA } from '../../core/xor'

interface Props {
  weights: Weights
  settings: Settings
  epoch: number
}

const XOR_POINTS = XOR_DATA.map(d => ({ x: d.input[0], y: d.input[1], label: d.label }))
const GRID_SIZE = 80

export default function DecisionBoundary({ weights, settings, epoch }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const W = container.clientWidth
    const H = container.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const PAD = 24

    // Background
    ctx.fillStyle = '#0f0f1a'
    ctx.fillRect(0, 0, W, H)

    const plotSize = Math.min(W, H) - PAD * 2
    const ox = (W - plotSize) / 2
    const oy = (H - plotSize) / 2

    function toCanvas(v: number) {
      return v * plotSize
    }

    // Draw grid predictions using ImageData
    const imageData = ctx.createImageData(GRID_SIZE, GRID_SIZE)
    const data = imageData.data

    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const xi = gx / (GRID_SIZE - 1)
        const yi = gy / (GRID_SIZE - 1)
        // Note: y is flipped (0 at bottom in visual, 0 at top in canvas)
        const p = forwardPoint([xi, 1 - yi], weights, settings.activationFn, settings.isLinearMode)

        const idx = (gy * GRID_SIZE + gx) * 4
        if (p > 0.5) {
          // Class 1: blue
          const intensity = (p - 0.5) * 2  // 0..1
          data[idx]     = Math.round(20 + intensity * 30)   // R
          data[idx + 1] = Math.round(60 + intensity * 80)   // G
          data[idx + 2] = Math.round(160 + intensity * 80)  // B
          data[idx + 3] = Math.round(160 + intensity * 80)  // A
        } else {
          // Class 0: red
          const intensity = (0.5 - p) * 2  // 0..1
          data[idx]     = Math.round(160 + intensity * 60)
          data[idx + 1] = Math.round(30 + intensity * 10)
          data[idx + 2] = Math.round(30 + intensity * 10)
          data[idx + 3] = Math.round(140 + intensity * 80)
        }
      }
    }

    // Create temp canvas to scale ImageData
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = GRID_SIZE
    tmpCanvas.height = GRID_SIZE
    const tmpCtx = tmpCanvas.getContext('2d')
    if (!tmpCtx) return
    tmpCtx.putImageData(imageData, 0, 0)

    // Draw scaled
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(tmpCanvas, ox, oy, plotSize, plotSize)

    // Border around plot area
    ctx.strokeStyle = '#2a2a55'
    ctx.lineWidth = 1
    ctx.strokeRect(ox, oy, plotSize, plotSize)

    // Axis tick labels
    ctx.fillStyle = '#4a5568'
    ctx.font = '9px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('0', ox, oy + plotSize + 13)
    ctx.fillText('1', ox + plotSize, oy + plotSize + 13)
    ctx.fillText('0', ox, oy + plotSize + 13)
    ctx.textAlign = 'right'
    ctx.fillText('0', ox - 4, oy + plotSize)
    ctx.fillText('1', ox - 4, oy)

    // XOR points
    const pointRadius = Math.max(5, plotSize / 18)
    XOR_POINTS.forEach(pt => {
      const px = ox + toCanvas(pt.x)
      const py = oy + toCanvas(1 - pt.y)  // flip y

      ctx.beginPath()
      ctx.arc(px, py, pointRadius, 0, Math.PI * 2)

      if (pt.label === 1) {
        ctx.fillStyle = '#00d4ff'
        ctx.fill()
        ctx.strokeStyle = '#0f0f1a'
        ctx.lineWidth = 2
        ctx.stroke()
      } else {
        ctx.fillStyle = '#0f0f1a'
        ctx.fill()
        ctx.strokeStyle = '#f97316'
        ctx.lineWidth = 2.5
        ctx.stroke()
      }

      // Point labels
      ctx.fillStyle = '#e2e8f0'
      ctx.font = `bold ${Math.max(8, pointRadius - 2)}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText(pt.label.toString(), px, py + pointRadius / 3)
    })

    // Linear mode warning
    if (settings.isLinearMode) {
      ctx.fillStyle = 'rgba(249,115,22,0.85)'
      ctx.font = 'bold 11px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('⚠ LINEAR MODE — boundary cannot curve', W / 2, H - 6)
    }

  }, [weights, settings, epoch])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Decision Boundary</span>
        <span style={{ fontSize: 9, color: '#4a5568' }}>
          <span style={{ color: '#00d4ff' }}>●</span> class 1 &nbsp;
          <span style={{ color: '#f97316' }}>○</span> class 0
        </span>
      </div>
      <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
