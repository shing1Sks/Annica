import type { useNNStore } from '../../store/useNNStore'
import TrainingControls from './TrainingControls'
import GradientDisplay from './GradientDisplay'

type Store = ReturnType<typeof useNNStore>

interface Props {
  store: Store
}

export default function Controls({ store }: Props) {
  const { snapshot, settings, isRunning } = store

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-title">Controls &amp; Inspector</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <TrainingControls
            settings={settings}
            isRunning={isRunning}
            epoch={snapshot.epoch}
            loss={snapshot.loss}
            onStart={store.startTraining}
            onStop={store.stopTraining}
            onStep={store.stepOnce}
            onMicroStep={store.microStep}
            onReset={store.resetModel}
            onSetLR={store.setLearningRate}
            onSetSpeed={store.setTrainingSpeed}
            onSetMode={store.setTrainingMode}
            onSetActivation={store.setActivationFn}
            onToggleLinear={store.toggleLinearMode}
            onToggleManual={store.toggleManualMode}
            onToggleDerivative={store.toggleDerivative}
          />
        </div>
        <div style={{ borderTop: '1px solid #2a2a55' }}>
          <GradientDisplay snapshot={snapshot} settings={settings} />
        </div>
      </div>
    </div>
  )
}
