import type { Settings, MicroStepType } from '../../core/types'

interface Props {
  settings: Settings
  isRunning: boolean
  epoch: number
  loss: number
  onStart: () => void
  onStop: () => void
  onStep: () => void
  onMicroStep: (type: MicroStepType) => void
  onReset: () => void
  onSetLR: (v: number) => void
  onSetSpeed: (v: number) => void
  onSetMode: (m: Settings['trainingMode']) => void
  onSetActivation: (a: Settings['activationFn']) => void
  onToggleLinear: () => void
  onToggleManual: () => void
  onToggleDerivative: () => void
}

export default function TrainingControls({
  settings,
  isRunning,
  epoch,
  loss,
  onStart,
  onStop,
  onStep,
  onMicroStep,
  onReset,
  onSetLR,
  onSetSpeed,
  onSetMode,
  onSetActivation,
  onToggleLinear,
  onToggleManual,
  onToggleDerivative,
}: Props) {
  return (
    <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', height: '100%' }}>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
        <span style={{ color: '#6b7a99' }}>Epoch <span style={{ color: '#00d4ff', fontFamily: 'monospace' }}>{epoch}</span></span>
        <span style={{ color: '#6b7a99' }}>Loss <span style={{ color: '#00d4ff', fontFamily: 'monospace' }}>{loss.toFixed(4)}</span></span>
      </div>

      {/* Mode selector */}
      <div>
        <label>Training Mode</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['continuous', 'step', 'micro'] as const).map(m => (
            <button
              key={m}
              className={settings.trainingMode === m ? 'active' : ''}
              onClick={() => onSetMode(m)}
              style={{ flex: 1, padding: '4px 6px', fontSize: 11 }}
            >
              {m === 'continuous' ? 'Auto' : m === 'step' ? 'Step' : 'Micro'}
            </button>
          ))}
        </div>
      </div>

      {/* Main action buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        {settings.trainingMode === 'continuous' ? (
          <button
            onClick={isRunning ? onStop : onStart}
            className={isRunning ? 'active' : ''}
            style={{ flex: 1, fontSize: 12 }}
          >
            {isRunning ? '⏸ Stop' : '▶ Start'}
          </button>
        ) : settings.trainingMode === 'step' ? (
          <button
            onClick={onStep}
            disabled={isRunning}
            style={{ flex: 1, fontSize: 12 }}
          >
            ⏭ Step
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 4, flex: 1 }}>
            {(['forward', 'backward', 'update'] as MicroStepType[]).map(t => (
              <button
                key={t}
                onClick={() => onMicroStep(t)}
                disabled={isRunning}
                style={{ flex: 1, fontSize: 10, padding: '4px 2px' }}
              >
                {t === 'forward' ? '→ Fwd' : t === 'backward' ? '← Bwd' : '↑ Upd'}
              </button>
            ))}
          </div>
        )}
        <button onClick={onReset} style={{ fontSize: 12 }}>↺ Reset</button>
      </div>

      {/* Learning rate */}
      <div>
        <label>Learning Rate: <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{settings.learningRate.toFixed(3)}</span></label>
        <input
          type="range"
          min={0.01}
          max={2.0}
          step={0.01}
          value={settings.learningRate}
          onChange={e => onSetLR(parseFloat(e.target.value))}
        />
      </div>

      {/* Speed (continuous only) */}
      {settings.trainingMode === 'continuous' && (
        <div>
          <label>Speed (delay): <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{settings.trainingSpeed}ms</span></label>
          <input
            type="range"
            min={20}
            max={1000}
            step={10}
            value={settings.trainingSpeed}
            onChange={e => onSetSpeed(parseInt(e.target.value))}
          />
        </div>
      )}

      {/* Activation */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label>Activation (Hidden)</label>
          <select
            value={settings.activationFn}
            onChange={e => onSetActivation(e.target.value as Settings['activationFn'])}
            style={{ width: '100%' }}
          >
            <option value="sigmoid">Sigmoid</option>
            <option value="tanh">Tanh</option>
            <option value="relu">ReLU</option>
            <option value="linear">Linear</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button
          className={settings.isLinearMode ? 'active' : ''}
          onClick={onToggleLinear}
          style={{ fontSize: 11 }}
          title="Bypass hidden activation — proves non-linearity is necessary"
        >
          Linear Mode
        </button>
        <button
          className={settings.isManualMode ? 'active' : ''}
          onClick={onToggleManual}
          style={{ fontSize: 11 }}
        >
          Manual Weights
        </button>
        <button
          className={settings.showDerivative ? 'active' : ''}
          onClick={onToggleDerivative}
          style={{ fontSize: 11 }}
        >
          Show f'(x)
        </button>
      </div>

    </div>
  )
}
