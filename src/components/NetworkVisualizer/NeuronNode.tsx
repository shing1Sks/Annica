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

// #131330 → #7c83ff — deep cosmos indigo ramp
function activationColor(val: number): string {
  const t = Math.max(0, Math.min(1, Math.abs(val)))
  const r = Math.round(19 + t * (124 - 19))
  const g = Math.round(19 + t * (131 - 19))
  const b = Math.round(48 + t * (255 - 48))
  return `rgb(${r},${g},${b})`
}

function glowFilter(phase: AnimPhase, layer: number): string {
  if (phase === 'forward')  return 'drop-shadow(0 0 8px rgba(56,182,255,0.9))'
  if (phase === 'backward' && layer >= 1) return 'drop-shadow(0 0 8px rgba(255,144,64,0.9))'
  if (phase === 'update')   return 'drop-shadow(0 0 6px rgba(80,250,123,0.7))'
  return 'none'
}

export default function NeuronNode({ cx, cy, r, zVal, aVal, bias, layer, animPhase, label }: Props) {
  const fill = activationColor(aVal)
  const filter = glowFilter(animPhase, layer)
  const isInput = layer === 0

  return (
    <g style={{ filter, transition: 'filter 0.35s ease' }}>
      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="rgba(124,131,255,0.08)" strokeWidth={3} />

      {/* Node body */}
      <circle
        cx={cx} cy={cy} r={r}
        fill={fill}
        stroke="#27274a"
        strokeWidth={1.5}
        style={{ transition: 'fill 0.4s ease' }}
      />

      {/* Specular highlight */}
      <circle
        cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.3}
        fill="rgba(255,255,255,0.05)"
      />

      {isInput ? (
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fill="#dde1ff" fontFamily="monospace" fontWeight="700">
          {aVal.toFixed(1)}
        </text>
      ) : (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={8} fill="rgba(200,210,255,0.6)" fontFamily="monospace">
            z={zVal.toFixed(2)}
          </text>
          <text x={cx} y={cy + 9} textAnchor="middle" fontSize={9.5} fill="#dde1ff" fontFamily="monospace" fontWeight="700">
            a={aVal.toFixed(2)}
          </text>
        </>
      )}

      {/* Bias tag */}
      {!isInput && (
        <text x={cx} y={cy + r + 11} textAnchor="middle" fontSize={8} fill="#3a3f6a" fontFamily="monospace">
          b={bias.toFixed(2)}
        </text>
      )}

      {/* Label above node */}
      {label && (
        <text x={cx} y={cy - r - 7} textAnchor="middle" fontSize={11} fill="#5a6090" fontFamily="system-ui" fontWeight="600">
          {label}
        </text>
      )}
    </g>
  )
}
