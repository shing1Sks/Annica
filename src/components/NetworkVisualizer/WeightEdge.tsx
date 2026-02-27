import { useState } from 'react'
import type { AnimPhase } from '../../core/types'

interface Props {
  x1: number
  y1: number
  x2: number
  y2: number
  weight: number
  maxAbsWeight: number
  gradient: number | null
  animPhase: AnimPhase
  layer: number          // 0 = input→hidden, 1 = hidden→output
  isManualMode: boolean
  onWeightChange: (val: number) => void
}

function edgeColor(w: number): string {
  return w >= 0 ? '#3b82f6' : '#ef4444'
}

function edgeOpacity(w: number, maxAbs: number): number {
  if (maxAbs === 0) return 0.3
  return 0.2 + 0.75 * (Math.abs(w) / maxAbs)
}

function edgeWidth(w: number, maxAbs: number): number {
  if (maxAbs === 0) return 1
  return 1 + 4.5 * (Math.abs(w) / maxAbs)
}

export default function WeightEdge({
  x1, y1, x2, y2,
  weight, maxAbsWeight,
  gradient,
  animPhase, layer,
  isManualMode,
  onWeightChange,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [hovered, setHovered] = useState(false)

  const color = edgeColor(weight)
  const opacity = edgeOpacity(weight, maxAbsWeight)
  const strokeW = edgeWidth(weight, maxAbsWeight)

  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  // Animation overlay class
  let animClass = ''
  if (animPhase === 'forward') animClass = 'edge-anim-forward'
  else if (animPhase === 'backward') animClass = 'edge-anim-backward'

  const animColor = animPhase === 'forward' ? '#00d4ff' : '#f97316'

  function handleClick() {
    if (!isManualMode) return
    setInputVal(weight.toFixed(4))
    setEditing(true)
  }

  function commitEdit() {
    const v = parseFloat(inputVal)
    if (!isNaN(v)) onWeightChange(v)
    setEditing(false)
  }

  return (
    <g>
      {/* Base edge */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={strokeW}
        strokeOpacity={opacity}
        style={{ transition: 'stroke-width 0.3s ease, stroke-opacity 0.3s ease' }}
      />

      {/* Animation overlay */}
      {(animPhase === 'forward' && layer === 0) || (animPhase === 'forward' && layer === 1) ? (
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={animColor}
          strokeWidth={2}
          strokeOpacity={0.85}
          className={animClass}
        />
      ) : null}
      {(animPhase === 'backward' && layer === 1) || (animPhase === 'backward' && layer === 0) ? (
        <line
          x1={x2} y1={y2} x2={x1} y2={y1}
          stroke={animColor}
          strokeWidth={2}
          strokeOpacity={0.85}
          className={animClass}
        />
      ) : null}

      {/* Clickable hit area */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="transparent"
        strokeWidth={12}
        style={{ cursor: isManualMode ? 'pointer' : 'default' }}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* Weight label on hover */}
      {hovered && !editing && (
        <g>
          <rect x={midX - 22} y={midY - 10} width={44} height={14} rx={3} fill="#1a1a3a" fillOpacity={0.92} />
          <text x={midX} y={midY + 1} textAnchor="middle" fontSize={9} fill={color} fontFamily="monospace">
            w={weight.toFixed(3)}
          </text>
        </g>
      )}

      {/* Gradient label during backward phase */}
      {animPhase === 'backward' && gradient !== null && !editing && (
        <g className="gradient-label">
          <rect x={midX - 28} y={midY - 10} width={56} height={14} rx={3} fill="#2a1a0a" fillOpacity={0.92} />
          <text x={midX} y={midY + 1} textAnchor="middle" fontSize={9} fill="#f97316" fontFamily="monospace">
            ∂={gradient.toFixed(3)}
          </text>
        </g>
      )}

      {/* Manual edit input */}
      {editing && (
        <foreignObject x={midX - 36} y={midY - 13} width={72} height={26}>
          <input
            type="number"
            step="0.01"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') setEditing(false)
            }}
            autoFocus
            style={{
              width: '100%',
              height: '100%',
              background: '#0d3a5c',
              border: '1px solid #00d4ff',
              borderRadius: 4,
              color: '#00d4ff',
              fontSize: 11,
              textAlign: 'center',
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
        </foreignObject>
      )}
    </g>
  )
}
