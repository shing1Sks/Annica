import { useRef, useEffect } from 'react'
import { ACTIVATIONS } from '../../core/activations'
import type { Settings } from '../../core/types'

interface Props {
  settings: Settings
}

export default function ActivationExplorer({ settings }: Props) {
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

    const PAD = { top: 14, right: 14, bottom: 22, left: 36 }
    const plotW = W - PAD.left - PAD.right
    const plotH = H - PAD.top - PAD.bottom

    ctx.fillStyle = '#0f0f1a'
    ctx.fillRect(0, 0, W, H)

    const xMin = -5
    const xMax = 5
    const yMin = -1.2
    const yMax = 1.2

    function toCanvasX(x: number) {
      return PAD.left + ((x - xMin) / (xMax - xMin)) * plotW
    }
    function toCanvasY(y: number) {
      return PAD.top + ((yMax - y) / (yMax - yMin)) * plotH
    }

    // Grid
    ctx.strokeStyle = '#1e1e3a'
    ctx.lineWidth = 1

    // Horizontal gridlines
    for (let y = -1; y <= 1; y += 0.5) {
      ctx.beginPath()
      ctx.moveTo(PAD.left, toCanvasY(y))
      ctx.lineTo(PAD.left + plotW, toCanvasY(y))
      ctx.stroke()
    }

    // Vertical gridlines
    for (let x = -4; x <= 4; x += 2) {
      ctx.beginPath()
      ctx.moveTo(toCanvasX(x), PAD.top)
      ctx.lineTo(toCanvasX(x), PAD.top + plotH)
      ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = '#3a3a5a'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(PAD.left, toCanvasY(0))
    ctx.lineTo(PAD.left + plotW, toCanvasY(0))
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(toCanvasX(0), PAD.top)
    ctx.lineTo(toCanvasX(0), PAD.top + plotH)
    ctx.stroke()

    // Y-axis labels
    ctx.fillStyle = '#4a5568'
    ctx.font = '9px monospace'
    ctx.textAlign = 'right'
    for (let y = -1; y <= 1; y += 0.5) {
      ctx.fillText(y.toFixed(1), PAD.left - 4, toCanvasY(y) + 3)
    }

    // X-axis labels
    ctx.textAlign = 'center'
    for (let x = -4; x <= 4; x += 2) {
      ctx.fillText(x.toString(), toCanvasX(x), PAD.top + plotH + 14)
    }

    const actFn = settings.isLinearMode
      ? ACTIVATIONS.linear
      : ACTIVATIONS[settings.activationFn]

    const steps = 300

    // Activation curve
    ctx.beginPath()
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin)
      const y = actFn.fn(x)
      const cx = toCanvasX(x)
      const cy = toCanvasY(Math.max(yMin, Math.min(yMax, y)))
      if (i === 0) ctx.moveTo(cx, cy)
      else ctx.lineTo(cx, cy)
    }
    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Derivative curve
    if (settings.showDerivative) {
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin)
        const dy = actFn.derivative(x)
        const cx = toCanvasX(x)
        const cy = toCanvasY(Math.max(yMin, Math.min(yMax, dy)))
        if (i === 0) ctx.moveTo(cx, cy)
        else ctx.lineTo(cx, cy)
      }
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Legend
    ctx.font = '9px system-ui'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#00d4ff'
    const label = settings.isLinearMode ? 'identity' : settings.activationFn
    ctx.fillText(`f(x) = ${label}`, PAD.left + 4, PAD.top + 14)
    if (settings.showDerivative) {
      ctx.fillStyle = '#f97316'
      ctx.fillText("f'(x)", PAD.left + 4, PAD.top + 26)
    }

  }, [settings])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-title">Activation Explorer</div>
      <div ref={containerRef} style={{ flex: 1 }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
