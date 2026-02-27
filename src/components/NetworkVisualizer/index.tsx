import type { NNSnapshot, Settings, AnimPhase } from '../../core/types'
import NeuronNode from './NeuronNode'
import WeightEdge from './WeightEdge'
import GradientArrow from './GradientArrow'

interface Props {
  snapshot: NNSnapshot
  animPhase: AnimPhase
  settings: Settings
  onWeightChange: (layer: 'W1' | 'W2' | 'b1' | 'b2', i: number, j: number, value: number) => void
}

const R = 30

const INPUT_NODES = [
  { cx: 100, cy: 120, label: 'x₁' },
  { cx: 100, cy: 230, label: 'x₂' },
]

const HIDDEN_NODES = [
  { cx: 310, cy: 80 },
  { cx: 310, cy: 175 },
  { cx: 310, cy: 270 },
]

const OUTPUT_NODE = { cx: 520, cy: 175, label: 'ŷ' }

function maxAbsIn(arr: number[][]): number {
  let m = 0
  for (const row of arr) for (const v of row) m = Math.max(m, Math.abs(v))
  return m
}

export default function NetworkVisualizer({ snapshot, animPhase, settings, onWeightChange }: Props) {
  const { weights, activations, gradients } = snapshot
  const { isManualMode } = settings

  const maxAllW = Math.max(maxAbsIn(weights.W1), maxAbsIn(weights.W2), 0.001)
  const showGradArrows = animPhase === 'backward' && gradients !== null
  const inputVals = [activations.a0[0], activations.a0[1]]

  return (
    <svg
      viewBox="0 0 640 350"
      width="100%"
      height="100%"
      style={{ display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background */}
      <rect width="640" height="350" fill="#07070f" />

      {/* Subtle grid */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`gv${i}`} x1={i * 80} y1={0} x2={i * 80} y2={350} stroke="#0f0f22" strokeWidth={1} />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`gh${i}`} x1={0} y1={i * 70} x2={640} y2={i * 70} stroke="#0f0f22" strokeWidth={1} />
      ))}

      {/* Layer column labels */}
      {([
        [100, 'Input', '2'],
        [310, 'Hidden', '3'],
        [520, 'Output', '1'],
      ] as [number, string, string][]).map(([x, name, size]) => (
        <g key={name}>
          <text x={x} y={18} textAnchor="middle" fontSize={9} fill="#3a3f6a" fontFamily="system-ui" fontWeight="700" letterSpacing="0.1em">
            {name.toUpperCase()}
          </text>
          <text x={x} y={30} textAnchor="middle" fontSize={8} fill="#27274a" fontFamily="monospace">
            {size} unit{size === '1' ? '' : 's'}
          </text>
        </g>
      ))}

      {/* W1 Edges: input → hidden */}
      {INPUT_NODES.map((inp, j) =>
        HIDDEN_NODES.map((hid, i) => {
          const grad = gradients ? gradients.dW1[i][j] : null
          return (
            <g key={`w1-${i}-${j}`}>
              <WeightEdge
                x1={inp.cx + R} y1={inp.cy}
                x2={hid.cx - R} y2={hid.cy}
                weight={weights.W1[i][j]}
                maxAbsWeight={maxAllW}
                gradient={grad}
                animPhase={animPhase}
                layer={0}
                isManualMode={isManualMode}
                onWeightChange={v => onWeightChange('W1', i, j, v)}
              />
              {showGradArrows && grad !== null && (
                <GradientArrow
                  x1={inp.cx + R} y1={inp.cy}
                  x2={hid.cx - R} y2={hid.cy}
                  value={grad}
                  visible={true}
                />
              )}
            </g>
          )
        })
      )}

      {/* W2 Edges: hidden → output */}
      {HIDDEN_NODES.map((hid, j) => {
        const grad = gradients ? gradients.dW2[0][j] : null
        return (
          <g key={`w2-${j}`}>
            <WeightEdge
              x1={hid.cx + R} y1={hid.cy}
              x2={OUTPUT_NODE.cx - R} y2={OUTPUT_NODE.cy}
              weight={weights.W2[0][j]}
              maxAbsWeight={maxAllW}
              gradient={grad}
              animPhase={animPhase}
              layer={1}
              isManualMode={isManualMode}
              onWeightChange={v => onWeightChange('W2', 0, j, v)}
            />
            {showGradArrows && grad !== null && (
              <GradientArrow
                x1={hid.cx + R} y1={hid.cy}
                x2={OUTPUT_NODE.cx - R} y2={OUTPUT_NODE.cy}
                value={grad}
                visible={true}
              />
            )}
          </g>
        )
      })}

      {/* Input Nodes */}
      {INPUT_NODES.map((n, i) => (
        <NeuronNode
          key={`in-${i}`}
          cx={n.cx} cy={n.cy} r={R}
          zVal={0} aVal={inputVals[i]} bias={0}
          layer={0} animPhase={animPhase} label={n.label}
        />
      ))}

      {/* Hidden Nodes */}
      {HIDDEN_NODES.map((n, i) => (
        <NeuronNode
          key={`hid-${i}`}
          cx={n.cx} cy={n.cy} r={R}
          zVal={activations.z1[i]}
          aVal={activations.a1[i]}
          bias={weights.b1[i]}
          layer={1} animPhase={animPhase}
        />
      ))}

      {/* Output Node */}
      <NeuronNode
        cx={OUTPUT_NODE.cx} cy={OUTPUT_NODE.cy} r={R}
        zVal={activations.z2[0]}
        aVal={activations.a2[0]}
        bias={weights.b2[0]}
        layer={2} animPhase={animPhase} label={OUTPUT_NODE.label}
      />

      {/* Legend */}
      <g transform="translate(12, 332)">
        <line x1={0} y1={4} x2={18} y2={4} stroke="#3dffa0" strokeWidth={2} />
        <text x={22} y={8} fontSize={9} fill="#3a3f6a" fontFamily="system-ui">positive</text>
        <line x1={80} y1={4} x2={98} y2={4} stroke="#ff5c78" strokeWidth={2} />
        <text x={102} y={8} fontSize={9} fill="#3a3f6a" fontFamily="system-ui">negative</text>
        {showGradArrows && (
          <>
            <line x1={162} y1={4} x2={180} y2={4} stroke="#ff9040" strokeWidth={2} strokeDasharray="4 3" />
            <text x={184} y={8} fontSize={9} fill="#ff9040" fontFamily="system-ui">gradient ∂L/∂W</text>
          </>
        )}
        <text x={580} y={8} textAnchor="end" fontSize={9} fill="#3a3f6a" fontFamily="system-ui">
          {settings.activationFn.toUpperCase()}
          {settings.isLinearMode ? ' · LINEAR' : ''}
          {settings.isManualMode ? ' · MANUAL' : ''}
        </text>
      </g>
    </svg>
  )
}
