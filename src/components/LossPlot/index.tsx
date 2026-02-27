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

export default function LossPlot({ lossHistory, epoch }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

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

    const PAD = { top: 12, right: 14, bottom: 28, left: 44 }
    const plotW = W - PAD.left - PAD.right
    const plotH = H - PAD.top - PAD.bottom

    // Background
    ctx.fillStyle = '#0f0f1a'
    ctx.fillRect(0, 0, W, H)

    const history = lossHistory.slice(-500)
    if (history.length < 2) {
      ctx.fillStyle = '#6b7a99'
      ctx.font = '11px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Training loss will appear here', W / 2, H / 2)
      return
    }

    const maxLoss = Math.max(...history, 0.01)
    const minLoss = 0

    function toX(i: number) {
      return PAD.left + (i / (history.length - 1)) * plotW
    }
    function toY(v: number) {
      return PAD.top + plotH - ((v - minLoss) / (maxLoss - minLoss)) * plotH
    }

    // Grid lines
    ctx.strokeStyle = '#1e1e3a'
    ctx.lineWidth = 1
    const gridSteps = 4
    for (let k = 0; k <= gridSteps; k++) {
      const y = PAD.top + (k / gridSteps) * plotH
      ctx.beginPath()
      ctx.moveTo(PAD.left, y)
      ctx.lineTo(PAD.left + plotW, y)
      ctx.stroke()
    }

    // Y-axis labels
    ctx.fillStyle = '#4a5568'
    ctx.font = '10px system-ui'
    ctx.textAlign = 'right'
    for (let k = 0; k <= gridSteps; k++) {
      const v = maxLoss - (k / gridSteps) * maxLoss
      const y = PAD.top + (k / gridSteps) * plotH
      ctx.fillText(v.toFixed(2), PAD.left - 5, y + 3)
    }

    // X-axis label
    ctx.textAlign = 'center'
    ctx.fillStyle = '#4a5568'
    ctx.font = '10px system-ui'
    const totalEpochs = epoch
    const startEpoch = Math.max(0, totalEpochs - history.length + 1)
    ctx.fillText(`epoch ${startEpoch}`, PAD.left, H - 6)
    ctx.fillText(`epoch ${totalEpochs}`, PAD.left + plotW, H - 6)

    // Gradient fill under curve
    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + plotH)
    grad.addColorStop(0, 'rgba(0, 212, 255, 0.18)')
    grad.addColorStop(1, 'rgba(0, 212, 255, 0.01)')

    ctx.beginPath()
    ctx.moveTo(toX(0), toY(history[0]))
    for (let i = 1; i < history.length; i++) {
      ctx.lineTo(toX(i), toY(history[i]))
    }
    ctx.lineTo(toX(history.length - 1), PAD.top + plotH)
    ctx.lineTo(toX(0), PAD.top + plotH)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Loss curve
    ctx.beginPath()
    ctx.moveTo(toX(0), toY(history[0]))
    for (let i = 1; i < history.length; i++) {
      ctx.lineTo(toX(i), toY(history[i]))
    }
    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Moving dot at current epoch
    const lastIdx = history.length - 1
    const cx = toX(lastIdx)
    const cy = toY(history[lastIdx])
    ctx.beginPath()
    ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#00d4ff'
    ctx.fill()
    ctx.strokeStyle = '#0f0f1a'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Current loss text
    ctx.fillStyle = '#00d4ff'
    ctx.font = 'bold 11px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`Loss: ${history[lastIdx].toFixed(4)}`, PAD.left + 4, PAD.top + 14)

  }, [lossHistory, epoch])

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left

    const PAD = { left: 44, right: 14, bottom: 28 }
    const W = container.clientWidth
    const plotW = W - PAD.left - PAD.right
    const history = lossHistory.slice(-500)
    if (history.length < 2) return

    const frac = (mx - PAD.left) / plotW
    const idx = Math.round(frac * (history.length - 1))
    if (idx < 0 || idx >= history.length) {
      setTooltip(null)
      return
    }

    const totalEpochs = epoch
    const startEpoch = Math.max(0, totalEpochs - history.length + 1)
    const H = container.clientHeight
    const plotH = H - 12 - PAD.bottom
    const maxLoss = Math.max(...history, 0.01)
    const ty = 12 + plotH - (history[idx] / maxLoss) * plotH

    setTooltip({
      x: mx,
      y: ty,
      epoch: startEpoch + idx,
      loss: history[idx],
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-title">Loss Curve</div>
      <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        />
        {tooltip && (
          <div style={{
            position: 'absolute',
            left: tooltip.x + 8,
            top: tooltip.y - 24,
            background: '#1a1a3a',
            border: '1px solid #2a2a55',
            borderRadius: 4,
            padding: '2px 7px',
            fontSize: 11,
            color: '#e2e8f0',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            ep {tooltip.epoch} · {tooltip.loss.toFixed(4)}
          </div>
        )}
      </div>
    </div>
  )
}
