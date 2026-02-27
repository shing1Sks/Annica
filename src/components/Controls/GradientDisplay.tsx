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
    if (val < 0.005) return 'var(--negative)'
    if (val < 0.05)  return 'var(--warning)'
    return 'var(--update)'
  }

  function barWidth(val: number) {
    return Math.min(100, (val / Math.max(avgGradOutput, avgGradHidden, 0.0001)) * 100)
  }

  const s: React.CSSProperties = { padding: '12px 14px', height: '100%', overflowY: 'auto' }

  return (
    <div style={s}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
        Gradient Flow
      </div>

      {gradients === null ? (
        <div style={{ color: 'var(--muted-2)', fontSize: 11 }}>Run a backward pass to see gradients.</div>
      ) : (
        <>
          {/* Output layer bar */}
          <GradBar label="Output |∇|" value={avgGradOutput} width={barWidth(avgGradOutput)} color={barColor(avgGradOutput)} />
          <GradBar label="Hidden |∇|" value={avgGradHidden} width={barWidth(avgGradHidden)} color={barColor(avgGradHidden)} />

          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
            Ratio (hidden/output): <span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{ratio.toFixed(3)}</span>
          </div>

          {isVanishing && (
            <div style={{
              background: 'rgba(255,144,64,0.07)',
              border: '1px solid var(--backward)',
              borderRadius: 6,
              padding: '7px 10px',
              fontSize: 11,
              color: 'var(--backward)',
              marginBottom: 10,
            }}>
              ⚠ Vanishing gradient — sigmoid squashes hidden layer to{' '}
              <strong>{(ratio * 100).toFixed(0)}%</strong> of output gradient.
            </div>
          )}

          {/* dW2 chip row */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5 }}>∂L/∂W₂</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {gradients.dW2[0].map((g, i) => (
                <span key={i} style={{
                  fontFamily: 'monospace', fontSize: 10,
                  background: 'var(--surface-3)',
                  border: `1px solid ${g > 0 ? 'var(--positive)' : 'var(--negative)'}`,
                  borderRadius: 4, padding: '2px 6px',
                  color: g > 0 ? 'var(--positive)' : 'var(--negative)',
                }}>
                  {g > 0 ? '+' : ''}{g.toFixed(3)}
                </span>
              ))}
            </div>
          </div>

          {/* dW1 chip rows */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5 }}>∂L/∂W₁</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {gradients.dW1.flatMap((row, i) =>
                row.map((g, j) => (
                  <span key={`${i}-${j}`} style={{
                    fontFamily: 'monospace', fontSize: 10,
                    background: 'var(--surface-3)',
                    border: `1px solid ${g > 0 ? 'var(--positive)' : 'var(--negative)'}`,
                    borderRadius: 4, padding: '2px 6px',
                    color: g > 0 ? 'var(--positive)' : 'var(--negative)',
                  }}>
                    {g > 0 ? '+' : ''}{g.toFixed(3)}
                  </span>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function GradBar({ label, value, width, color }: { label: string; value: number; width: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
        <span style={{ color: 'var(--muted)' }}>{label}</span>
        <span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{value.toFixed(5)}</span>
      </div>
      <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: width + '%', background: color, borderRadius: 3, transition: 'width 0.35s ease' }} />
      </div>
    </div>
  )
}
