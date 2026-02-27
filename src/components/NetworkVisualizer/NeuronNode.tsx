import type { AnimPhase } from '../../core/types'

interface Props {
  cx: number
  cy: number
  r: number
  zVal: number
  aVal: number
  bias: number
  layer: number
  animPhase: AnimPhase
  label?: string
}

function activationColor(val: number): string {
  const t = Math.max(0, Math.min(1, Math.abs(val)))
  const r = Math.round(20 + t * (0 - 20))
  const g = Math.round(20 + t * (200 - 20))
  const b = Math.round(80 + t * (255 - 80))
  return `rgb(${r},${g},${b})`
}

function glowFilter(phase: AnimPhase, layer: number): string {
  // forward: glow propagates left→right (layer 0 then 1 then 2)
  // backward: glow propagates right→left
  if (phase === 'forward') {
    return 'drop-shadow(0 0 6px rgba(0,212,255,0.8))'
  }
  if (phase === 'backward') {
    if (layer >= 1) return 'drop-shadow(0 0 6px rgba(249,115,22,0.8))'
  }
  if (phase === 'update') {
    return 'drop-shadow(0 0 4px rgba(34,197,94,0.6))'
  }
  return 'none'
}

export default function NeuronNode({ cx, cy, r, zVal, aVal, bias, layer, animPhase, label }: Props) {
  const fill = activationColor(aVal)
  const filter = glowFilter(animPhase, layer)

  // Input nodes have no z/a computation
  const isInput = layer === 0

  return (
    <g style={{ filter, transition: 'filter 0.3s ease' }}>
      {/* Node circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke="#2a2a55"
        strokeWidth={1.5}
        style={{ transition: 'fill 0.4s ease' }}
      />

      {/* Inner ring highlight */}
      <circle
        cx={cx}
        cy={cy}
        r={r - 4}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1}
      />

      {isInput ? (
        /* Input: show value */
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fill="#e2e8f0" fontFamily="monospace" fontWeight="600">
          {aVal.toFixed(2)}
        </text>
      ) : (
        /* Hidden / output: show z and a */
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={8.5} fill="rgba(200,220,255,0.75)" fontFamily="monospace">
            z={zVal.toFixed(2)}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize={9} fill="#e2e8f0" fontFamily="monospace" fontWeight="600">
            a={aVal.toFixed(2)}
          </text>
        </>
      )}

      {/* Bias indicator (tiny pill below node) */}
      {!isInput && (
        <text x={cx} y={cy + r + 10} textAnchor="middle" fontSize={8} fill="#4a5568" fontFamily="monospace">
          b={bias.toFixed(2)}
        </text>
      )}

      {/* Layer label */}
      {label && (
        <text x={cx} y={cy - r - 6} textAnchor="middle" fontSize={9} fill="#4a5568" fontFamily="system-ui">
          {label}
        </text>
      )}
    </g>
  )
}
