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

const BG     = '#07070f'
const BORDER = '#27274a'
const MUTED  = '#3a3f6a'

export default function DecisionBoundary({ weights, settings, epoch }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    function draw() {
      if (!canvas || !container) return
      const dpr = window.devicePixelRatio || 1
      const W = container.clientWidth
      const H = container.clientHeight
      if (W === 0 || H === 0) return

      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)

      const PAD = 24

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)

      const plotSize = Math.min(W, H) - PAD * 2
      const ox = (W - plotSize) / 2
      const oy = (H - plotSize) / 2

      function toCanvas(v: number) { return v * plotSize }

      // Draw grid predictions using ImageData
      const imageData = ctx.createImageData(GRID_SIZE, GRID_SIZE)
      const data = imageData.data

      for (let gy = 0; gy < GRID_SIZE; gy++) {
        for (let gx = 0; gx < GRID_SIZE; gx++) {
          const xi = gx / (GRID_SIZE - 1)
          const yi = gy / (GRID_SIZE - 1)
          const p = forwardPoint([xi, 1 - yi], weights, settings.activationFn, settings.isLinearMode)

          const idx = (gy * GRID_SIZE + gx) * 4
          if (p > 0.5) {
            // Class 1: mint/teal — #3dffa0
            const t = (p - 0.5) * 2
            data[idx]     = Math.round(7  + t * 20)
            data[idx + 1] = Math.round(40 + t * 215)
            data[idx + 2] = Math.round(30 + t * 130)
            data[idx + 3] = Math.round(80 + t * 140)
          } else {
            // Class 0: rose — #ff5c78
            const t = (0.5 - p) * 2
            data[idx]     = Math.round(30 + t * 225)
            data[idx + 1] = Math.round(10 + t * 82)
            data[idx + 2] = Math.round(20 + t * 100)
            data[idx + 3] = Math.round(80 + t * 140)
          }
        }
      }

      const tmpCanvas = document.createElement('canvas')
      tmpCanvas.width = GRID_SIZE
      tmpCanvas.height = GRID_SIZE
      const tmpCtx = tmpCanvas.getContext('2d')
      if (!tmpCtx) return
      tmpCtx.putImageData(imageData, 0, 0)

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(tmpCanvas, ox, oy, plotSize, plotSize)

      ctx.strokeStyle = BORDER
      ctx.lineWidth = 1
      ctx.strokeRect(ox, oy, plotSize, plotSize)

      ctx.fillStyle = MUTED
      ctx.font = '9px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('0', ox, oy + plotSize + 13)
      ctx.fillText('1', ox + plotSize, oy + plotSize + 13)
      ctx.textAlign = 'right'
      ctx.fillText('0', ox - 4, oy + plotSize)
      ctx.fillText('1', ox - 4, oy)

      const pointRadius = Math.max(5, plotSize / 18)
      XOR_POINTS.forEach(pt => {
        const px = ox + toCanvas(pt.x)
        const py = oy + toCanvas(1 - pt.y)

        ctx.beginPath()
        ctx.arc(px, py, pointRadius, 0, Math.PI * 2)

        if (pt.label === 1) {
          ctx.fillStyle = '#7c83ff'
          ctx.fill()
          ctx.strokeStyle = BG
          ctx.lineWidth = 2
          ctx.stroke()
        } else {
          ctx.fillStyle = BG
          ctx.fill()
          ctx.strokeStyle = '#ff5c78'
          ctx.lineWidth = 2.5
          ctx.stroke()
        }

        ctx.fillStyle = '#dde1ff'
        ctx.font = `bold ${Math.max(8, pointRadius - 2)}px monospace`
        ctx.textAlign = 'center'
        ctx.fillText(pt.label.toString(), px, py + pointRadius / 3)
      })

      if (settings.isLinearMode) {
        ctx.fillStyle = '#ff9040'
        ctx.font = 'bold 11px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('⚠ LINEAR MODE — boundary cannot curve', W / 2, H - 6)
      }
    }

    draw()
    const obs = new ResizeObserver(draw)
    obs.observe(container)
    return () => obs.disconnect()
  }, [weights, settings, epoch])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG }}>
      <div style={{ padding: '4px 10px 2px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <span style={{ fontSize: 9, color: MUTED, fontFamily: 'monospace' }}>
          <span style={{ color: '#7c83ff' }}>●</span> class&nbsp;1 &nbsp;
          <span style={{ color: '#ff5c78' }}>○</span> class&nbsp;0
        </span>
      </div>
      <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
