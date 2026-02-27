import { useRef, useEffect, useState } from 'react'

interface Props {
  lossHistory: number[]
  epoch: number
}

interface Tooltip {
  x: number
  y: number
  epoch: number
  loss: number
}

const ACCENT = '#7c83ff'
const BG     = '#07070f'
const GRID   = '#12122a'
const MUTED  = '#3a3f6a'

export default function LossPlot({ lossHistory, epoch }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    function draw() {
      if (!canvas || !container) return
      const dpr = window.devicePixelRatio || 1
      const W   = container.clientWidth
      const H   = container.clientHeight
      if (W === 0 || H === 0) return

      canvas.width  = W * dpr
      canvas.height = H * dpr
      canvas.style.width  = W + 'px'
      canvas.style.height = H + 'px'

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)

      const PAD = { top: 14, right: 12, bottom: 28, left: 46 }
      const plotW = W - PAD.left - PAD.right
      const plotH = H - PAD.top - PAD.bottom

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)

      const history = lossHistory.slice(-600)
      if (history.length < 2) {
        ctx.fillStyle = MUTED
        ctx.font = '11px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Start training to see loss curve', W / 2, H / 2)
        return
      }

      const maxLoss = Math.max(...history, 0.01)

      function toX(i: number) { return PAD.left + (i / (history.length - 1)) * plotW }
      function toY(v: number)  { return PAD.top + plotH - (v / maxLoss) * plotH }

      ctx.strokeStyle = GRID
      ctx.lineWidth = 1
      for (let k = 0; k <= 4; k++) {
        const y = PAD.top + (k / 4) * plotH
        ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + plotW, y); ctx.stroke()
      }

      ctx.fillStyle = MUTED
      ctx.font = '9px monospace'
      ctx.textAlign = 'right'
      for (let k = 0; k <= 4; k++) {
        const v = maxLoss - (k / 4) * maxLoss
        ctx.fillText(v.toFixed(2), PAD.left - 5, PAD.top + (k / 4) * plotH + 3)
      }

      ctx.textAlign = 'center'
      ctx.fillStyle = MUTED
      ctx.font = '9px system-ui'
      const startEp = Math.max(0, epoch - history.length + 1)
      ctx.fillText(`ep ${startEp}`, PAD.left, H - 7)
      ctx.fillText(`ep ${epoch}`,   PAD.left + plotW, H - 7)

      const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + plotH)
      grad.addColorStop(0, 'rgba(124,131,255,0.22)')
      grad.addColorStop(1, 'rgba(124,131,255,0.01)')

      ctx.beginPath()
      ctx.moveTo(toX(0), toY(history[0]))
      for (let i = 1; i < history.length; i++) ctx.lineTo(toX(i), toY(history[i]))
      ctx.lineTo(toX(history.length - 1), PAD.top + plotH)
      ctx.lineTo(toX(0), PAD.top + plotH)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(toX(0), toY(history[0]))
      for (let i = 1; i < history.length; i++) ctx.lineTo(toX(i), toY(history[i]))
      ctx.strokeStyle = ACCENT
      ctx.lineWidth = 1.8
      ctx.lineJoin = 'round'
      ctx.stroke()

      const li = history.length - 1
      ctx.beginPath()
      ctx.arc(toX(li), toY(history[li]), 4.5, 0, Math.PI * 2)
      ctx.fillStyle = ACCENT
      ctx.fill()
      ctx.strokeStyle = BG
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = ACCENT
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(history[li].toFixed(4), PAD.left + 6, PAD.top + 13)
    }

    draw()
    const obs = new ResizeObserver(draw)
    obs.observe(container)
    return () => obs.disconnect()
  }, [lossHistory, epoch])

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const container = containerRef.current
    const canvas    = canvasRef.current
    if (!container || !canvas) return

    const rect  = canvas.getBoundingClientRect()
    const mx    = e.clientX - rect.left
    const PAD   = { left: 46, right: 12, bottom: 28 }
    const W     = container.clientWidth
    const plotW = W - PAD.left - PAD.right
    const history = lossHistory.slice(-600)
    if (history.length < 2) return

    const idx = Math.round(((mx - PAD.left) / plotW) * (history.length - 1))
    if (idx < 0 || idx >= history.length) { setTooltip(null); return }

    const H     = container.clientHeight
    const plotH = H - 14 - PAD.bottom
    const maxLoss = Math.max(...history, 0.01)
    const ty = 14 + plotH - (history[idx] / maxLoss) * plotH

    setTooltip({ x: mx, y: ty, epoch: Math.max(0, epoch - history.length + 1) + idx, loss: history[idx] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG }}>
      <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        />
        {tooltip && (
          <div style={{
            position: 'absolute', left: tooltip.x + 10, top: tooltip.y - 22,
            background: '#15152d', border: '1px solid #27274a', borderRadius: 4,
            padding: '2px 8px', fontSize: 10, color: '#dde1ff',
            pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily: 'monospace',
          }}>
            ep {tooltip.epoch} · {tooltip.loss.toFixed(4)}
          </div>
        )}
      </div>
    </div>
  )
}
