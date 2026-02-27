import type { NNSnapshot, Settings } from '../../core/types'

interface Props {
  snapshot: NNSnapshot
  settings: Settings
}

export default function GradientDisplay({ snapshot, settings }: Props) {
  const { avgGradHidden, avgGradOutput, gradients } = snapshot

  const ratio = avgGradOutput > 0 ? avgGradHidden / avgGradOutput : 1
  const isVanishing = settings.activationFn === 'sigmoid' && ratio < 0.15 && avgGradOutput > 0.001

  function barColor(val: number) {
    if (val < 0.005) return '#ef4444'
    if (val < 0.05) return '#f97316'
    return '#22c55e'
  }

  function barWidth(val: number) {
    return Math.min(100, (val / Math.max(avgGradOutput, avgGradHidden, 0.0001)) * 100)
  }

  return (
    <div style={{ padding: '8px 10px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7a99', marginBottom: 8 }}>
        Gradient Flow
      </div>

      {gradients === null ? (
        <div style={{ color: '#4a5568', fontSize: 11 }}>Run a backward pass first</div>
      ) : (
        <>
          {/* Output layer */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
              <span style={{ color: '#6b7a99' }}>Output  |∇|</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{avgGradOutput.toFixed(4)}</span>
            </div>
            <div style={{ height: 5, background: '#1a1a3a', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: barWidth(avgGradOutput) + '%',
                background: barColor(avgGradOutput),
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Hidden layer */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
              <span style={{ color: '#6b7a99' }}>Hidden  |∇|</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{avgGradHidden.toFixed(4)}</span>
            </div>
            <div style={{ height: 5, background: '#1a1a3a', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: barWidth(avgGradHidden) + '%',
                background: barColor(avgGradHidden),
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Ratio */}
          <div style={{ fontSize: 11, color: '#6b7a99', marginBottom: 6 }}>
            Ratio: <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{ratio.toFixed(3)}</span>
          </div>

          {isVanishing && (
            <div style={{
              background: '#3a1a0a',
              border: '1px solid #f97316',
              borderRadius: 5,
              padding: '5px 8px',
              fontSize: 11,
              color: '#f97316',
            }}>
              ⚠ Vanishing gradient! Sigmoid squashes hidden gradients to ~{(ratio * 100).toFixed(0)}% of output.
            </div>
          )}

          {/* Per-weight gradient peek */}
          {gradients && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: '#4a5568', marginBottom: 4 }}>
                dW2 (output weights):
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {gradients.dW2[0].map((g, i) => (
                  <span key={i} style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    background: '#1a1a3a',
                    borderRadius: 3,
                    padding: '1px 5px',
                    color: g > 0 ? '#3b82f6' : '#ef4444',
                  }}>
                    {g.toFixed(3)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
