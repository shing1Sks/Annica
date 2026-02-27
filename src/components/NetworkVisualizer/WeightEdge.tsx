import { useState } from 'react'
import type { AnimPhase } from '../../core/types'

interface Props {
  x1: number; y1: number
  x2: number; y2: number
  weight: number
  maxAbsWeight: number
  gradient: number | null
  animPhase: AnimPhase
  layer: number
  isManualMode: boolean
  onWeightChange: (val: number) => void
}

function edgeColor(w: number): string {
  return w >= 0 ? '#3dffa0' : '#ff5c78'  // mint / rose
}

function edgeOpacity(w: number, maxAbs: number): number {
  if (maxAbs === 0) return 0.25
  return 0.18 + 0.78 * (Math.abs(w) / maxAbs)
}

function edgeWidth(w: number, maxAbs: number): number {
  if (maxAbs === 0) return 1
  return 1 + 5 * (Math.abs(w) / maxAbs)
}

export default function WeightEdge({
  x1, y1, x2, y2,
  weight, maxAbsWeight, gradient,
  animPhase, isManualMode, onWeightChange,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [hovered, setHovered] = useState(false)

  const color   = edgeColor(weight)
  const opacity = edgeOpacity(weight, maxAbsWeight)
  const strokeW = edgeWidth(weight, maxAbsWeight)
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  const isForwardAnim  = animPhase === 'forward'
  const isBackwardAnim = animPhase === 'backward'
  const animColor = isForwardAnim ? '#38b6ff' : '#ff9040'

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
        strokeLinecap="round"
        style={{ transition: 'stroke-width 0.3s ease, stroke-opacity 0.3s ease' }}
      />

      {/* Forward animation overlay */}
      {isForwardAnim && (
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={animColor}
          strokeWidth={2.5}
          strokeOpacity={0.9}
          strokeLinecap="round"
          className="edge-anim-forward"
        />
      )}

      {/* Backward animation overlay (reversed direction) */}
      {isBackwardAnim && (
        <line
          x1={x2} y1={y2} x2={x1} y2={y1}
          stroke={animColor}
          strokeWidth={2.5}
          strokeOpacity={0.9}
          strokeLinecap="round"
          className="edge-anim-backward"
        />
      )}

      {/* Manual mode + hover hit area */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="transparent"
        strokeWidth={14}
        style={{ cursor: isManualMode ? 'pointer' : 'default' }}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* Weight tooltip on hover */}
      {hovered && !editing && (
        <g>
          <rect x={midX - 24} y={midY - 10} width={48} height={14} rx={3} fill="#15152d" fillOpacity={0.95} stroke="#27274a" strokeWidth={0.5} />
          <text x={midX} y={midY + 1} textAnchor="middle" fontSize={9} fill={color} fontFamily="monospace">
            w={weight.toFixed(3)}
          </text>
        </g>
      )}

      {/* Gradient annotation during backward phase */}
      {isBackwardAnim && gradient !== null && !editing && !hovered && (
        <g className="gradient-label">
          <rect x={midX - 28} y={midY - 10} width={56} height={14} rx={3} fill="#1a0f04" fillOpacity={0.95} stroke="#ff9040" strokeWidth={0.5} />
          <text x={midX} y={midY + 1} textAnchor="middle" fontSize={9} fill="#ff9040" fontFamily="monospace">
            ∂={gradient.toFixed(3)}
          </text>
        </g>
      )}

      {/* Manual weight editor */}
      {editing && (
        <foreignObject x={midX - 38} y={midY - 14} width={76} height={28}>
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
              width: '100%', height: '100%',
              background: '#0d1240',
              border: '1px solid #7c83ff',
              borderRadius: 4,
              color: '#7c83ff',
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
