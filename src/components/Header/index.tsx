import type { useNNStore } from '../../store/useNNStore'
import type { AnimPhase, MicroStepType } from '../../core/types'

type Store = ReturnType<typeof useNNStore>

interface Props {
  store: Store
}

function PhaseIndicator({ phase, isRunning }: { phase: AnimPhase; isRunning: boolean }) {
  if (isRunning && phase === 'idle') {
    return (
      <span className="hdr-group">
        <span className="hdr-dot dot-running" />
        <span className="hdr-label" style={{ color: 'var(--positive)' }}>training</span>
      </span>
    )
  }
  if (phase === 'idle') return <span className="hdr-dot dot-idle" />
  const labels: Record<AnimPhase, string> = {
    idle: '',
    forward: '→ forward',
    backward: '← backward',
    update: '↑ update',
  }
  return (
    <span className={`hdr-phase phase-${phase}`}>
      <span className={`hdr-dot dot-${phase}`} />
      {labels[phase]}
    </span>
  )
}

export default function Header({ store }: Props) {
  const { snapshot, settings, isRunning, animPhase } = store
  const { trainingMode } = settings

  return (
    <>
      {/* Brand */}
      <span className="hdr-brand">ANNICA</span>

      <span className="hdr-divider" />

      {/* Training mode selector */}
      <span className="hdr-group">
        {(['continuous', 'step', 'micro'] as const).map(m => (
          <button
            key={m}
            className={trainingMode === m ? 'btn-active' : ''}
            onClick={() => store.setTrainingMode(m)}
          >
            {m === 'continuous' ? 'Auto' : m === 'step' ? 'Step' : 'Micro'}
          </button>
        ))}
      </span>

      <span className="hdr-divider" />

      {/* Action buttons — conditional on mode */}
      <span className="hdr-group">
        {trainingMode === 'continuous' && (
          <button
            className={isRunning ? 'btn-stop' : 'btn-run'}
            onClick={isRunning ? store.stopTraining : store.startTraining}
          >
            {isRunning ? '⏸ Stop' : '▶ Start'}
          </button>
        )}

        {trainingMode === 'step' && (
          <button
            className="btn-run"
            onClick={store.stepOnce}
            disabled={isRunning}
          >
            ⏭ Step
          </button>
        )}

        {trainingMode === 'micro' && (
          <>
            {(['forward', 'backward', 'update'] as MicroStepType[]).map(t => (
              <button
                key={t}
                onClick={() => store.microStep(t)}
                disabled={isRunning}
                style={{ fontSize: 10 }}
              >
                {t === 'forward' ? '→ Fwd' : t === 'backward' ? '← Bwd' : '↑ Upd'}
              </button>
            ))}
          </>
        )}

        <button onClick={store.resetModel} title="Reset model">↺</button>
      </span>

      <span className="hdr-divider" />

      {/* Hyperparams */}
      <span className="hdr-group">
        <span className="hdr-label">LR</span>
        <input
          type="range"
          className="hdr-slider"
          min={0.01} max={2.0} step={0.01}
          value={settings.learningRate}
          onChange={e => store.setLearningRate(parseFloat(e.target.value))}
        />
        <span className="hdr-value">{settings.learningRate.toFixed(2)}</span>
      </span>

      <span className="hdr-group">
        <select
          value={settings.activationFn}
          onChange={e => store.setActivationFn(e.target.value as typeof settings.activationFn)}
        >
          <option value="sigmoid">Sigmoid</option>
          <option value="tanh">Tanh</option>
          <option value="relu">ReLU</option>
          <option value="linear">Linear</option>
        </select>
      </span>

      {trainingMode === 'continuous' && (
        <span className="hdr-group">
          <span className="hdr-label">Speed</span>
          <input
            type="range"
            className="hdr-slider"
            min={20} max={1000} step={10}
            value={settings.trainingSpeed}
            onChange={e => store.setTrainingSpeed(parseInt(e.target.value))}
          />
          <span className="hdr-value">{settings.trainingSpeed}ms</span>
        </span>
      )}

      <span className="hdr-divider" />

      {/* Feature toggles */}
      <span className="hdr-group">
        <button
          className={settings.isLinearMode ? 'btn-active' : ''}
          onClick={store.toggleLinearMode}
          title="Bypass hidden activation — proves nonlinearity is necessary"
        >
          Linear
        </button>
        <button
          className={settings.isManualMode ? 'btn-active' : ''}
          onClick={store.toggleManualMode}
          title="Click edges to edit weights manually"
        >
          Manual
        </button>
        <button
          className={settings.showDerivative ? 'btn-active' : ''}
          onClick={store.toggleDerivative}
          title="Show activation derivative in explorer"
        >
          f′(x)
        </button>
      </span>

      {/* Spacer */}
      <span className="hdr-spacer" />

      {/* Phase indicator */}
      <PhaseIndicator phase={animPhase} isRunning={isRunning} />

      <span className="hdr-divider" />

      {/* Stats */}
      <span className="hdr-group" style={{ gap: 12 }}>
        <span className="hdr-stat">
          <span className="hdr-stat-label">EPOCH</span>
          <span className="hdr-stat-value">{snapshot.epoch}</span>
        </span>
        <span className="hdr-stat">
          <span className="hdr-stat-label">LOSS</span>
          <span className="hdr-stat-value">{snapshot.loss.toFixed(4)}</span>
        </span>
      </span>
    </>
  )
}
