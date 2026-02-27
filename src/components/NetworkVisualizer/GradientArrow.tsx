interface Props {
  x1: number
  y1: number
  x2: number
  y2: number
  value: number
  visible: boolean
}

export default function GradientArrow({ x1, y1, x2, y2, value, visible }: Props) {
  if (!visible) return null

  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  // Arrow from x2,y2 (right) to x1,y1 (left) — backward direction
  const dx = x1 - x2
  const dy = y1 - y2
  const len = Math.sqrt(dx * dx + dy * dy)
  const ux = dx / len
  const uy = dy / len

  // Arrow head at x1,y1 side
  const headLen = 8
  const headAngle = Math.PI / 6
  const ax1 = x1 - headLen * Math.cos(Math.atan2(uy, ux) - headAngle)
  const ay1 = y1 - headLen * Math.sin(Math.atan2(uy, ux) - headAngle)
  const ax2 = x1 - headLen * Math.cos(Math.atan2(uy, ux) + headAngle)
  const ay2 = y1 - headLen * Math.sin(Math.atan2(uy, ux) + headAngle)

  const opacity = Math.min(1, 0.4 + Math.abs(value) * 5)

  return (
    <g className="gradient-label" style={{ opacity }}>
      {/* Arrow shaft */}
      <line
        x1={x2} y1={y2} x2={x1} y2={y1}
        stroke="#f97316"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        strokeOpacity={0.8}
      />
      {/* Arrow head */}
      <line x1={x1} y1={y1} x2={ax1} y2={ay1} stroke="#f97316" strokeWidth={1.5} />
      <line x1={x1} y1={y1} x2={ax2} y2={ay2} stroke="#f97316" strokeWidth={1.5} />

      {/* Gradient value */}
      <rect x={midX - 20} y={midY - 9} width={40} height={12} rx={2} fill="#1a0d05" fillOpacity={0.9} />
      <text x={midX} y={midY} textAnchor="middle" fontSize={8} fill="#f97316" fontFamily="monospace">
        {value > 0 ? '+' : ''}{value.toFixed(3)}
      </text>
    </g>
  )
}
