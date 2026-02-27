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

// ─── Fixed node positions (SVG 620 × 300) ────────────────────────────────────
const R = 28

const INPUT_NODES = [
  { cx: 80, cy: 105, label: 'x₁' },
  { cx: 80, cy: 215, label: 'x₂' },
]

const HIDDEN_NODES = [
  { cx: 300, cy: 75 },
  { cx: 300, cy: 165 },
  { cx: 300, cy: 255 },
]

const OUTPUT_NODE = { cx: 520, cy: 165, label: 'ŷ' }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function maxAbsIn(arr: number[][]): number {
  let m = 0
  for (const row of arr) for (const v of row) m = Math.max(m, Math.abs(v))
  return m
}

export default function NetworkVisualizer({ snapshot, animPhase, settings, onWeightChange }: Props) {
  const { weights, activations, gradients } = snapshot
  const { isManualMode } = settings

  const maxW1 = maxAbsIn(weights.W1)
  const maxW2 = maxAbsIn(weights.W2)
  const maxAllW = Math.max(maxW1, maxW2, 0.001)

  const showGradArrows = animPhase === 'backward' && gradients !== null

  // Build input activations — use hardcoded XOR display values cycling
  // We'll just show the input as 0.5 for the network display (averaged)
  const inputVals = [activations.a0[0], activations.a0[1]]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Network Visualizer</span>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a90e2' }}>
          2 → 3 → 1 &nbsp;|&nbsp; XOR &nbsp;|&nbsp;
          {settings.activationFn.toUpperCase()}
          {settings.isLinearMode ? ' [LINEAR]' : ''}
          {settings.isManualMode ? ' [MANUAL]' : ''}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          viewBox="0 0 620 310"
          style={{ width: '100%', height: '100%', maxHeight: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* ── Layer labels ───────────────────────────────────────────────── */}
          <text x={80} y={24} textAnchor="middle" fontSize={10} fill="#4a5568" fontFamily="system-ui">Input</text>
          <text x={300} y={24} textAnchor="middle" fontSize={10} fill="#4a5568" fontFamily="system-ui">Hidden</text>
          <text x={520} y={24} textAnchor="middle" fontSize={10} fill="#4a5568" fontFamily="system-ui">Output</text>

          {/* ── W1 Edges: input → hidden ────────────────────────────────────── */}
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

          {/* ── W2 Edges: hidden → output ───────────────────────────────────── */}
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

          {/* ── Input Nodes ──────────────────────────────────────────────────── */}
          {INPUT_NODES.map((n, i) => (
            <NeuronNode
              key={`in-${i}`}
              cx={n.cx} cy={n.cy} r={R}
              zVal={0}
              aVal={inputVals[i]}
              bias={0}
              layer={0}
              animPhase={animPhase}
              label={n.label}
            />
          ))}

          {/* ── Hidden Nodes ─────────────────────────────────────────────────── */}
          {HIDDEN_NODES.map((n, i) => (
            <NeuronNode
              key={`hid-${i}`}
              cx={n.cx} cy={n.cy} r={R}
              zVal={activations.z1[i]}
              aVal={activations.a1[i]}
              bias={weights.b1[i]}
              layer={1}
              animPhase={animPhase}
            />
          ))}

          {/* ── Output Node ──────────────────────────────────────────────────── */}
          <NeuronNode
            cx={OUTPUT_NODE.cx} cy={OUTPUT_NODE.cy} r={R}
            zVal={activations.z2[0]}
            aVal={activations.a2[0]}
            bias={weights.b2[0]}
            layer={2}
            animPhase={animPhase}
            label={OUTPUT_NODE.label}
          />

          {/* ── Legend ───────────────────────────────────────────────────────── */}
          <g transform="translate(8, 280)">
            <line x1={0} y1={4} x2={20} y2={4} stroke="#3b82f6" strokeWidth={2} />
            <text x={24} y={8} fontSize={9} fill="#4a5568" fontFamily="system-ui">positive weight</text>
            <line x1={100} y1={4} x2={120} y2={4} stroke="#ef4444" strokeWidth={2} />
            <text x={124} y={8} fontSize={9} fill="#4a5568" fontFamily="system-ui">negative weight</text>
            {showGradArrows && (
              <>
                <line x1={220} y1={4} x2={240} y2={4} stroke="#f97316" strokeWidth={2} strokeDasharray="4 3" />
                <text x={244} y={8} fontSize={9} fill="#f97316" fontFamily="system-ui">gradient</text>
              </>
            )}
          </g>
        </svg>
      </div>
    </div>
  )
}
