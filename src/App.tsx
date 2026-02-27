import './App.css'
import { useNNStore } from './store/useNNStore'
import NetworkVisualizer from './components/NetworkVisualizer'
import LossPlot from './components/LossPlot'
import DecisionBoundary from './components/DecisionBoundary'
import ActivationExplorer from './components/ActivationExplorer'
import Controls from './components/Controls'

function App() {
  const store = useNNStore()

  return (
    <div className="app">
      <div className="area-network panel">
        <NetworkVisualizer
          snapshot={store.snapshot}
          animPhase={store.animPhase}
          settings={store.settings}
          onWeightChange={store.overrideWeight}
        />
      </div>

      <div className="area-loss panel">
        <LossPlot lossHistory={store.snapshot.lossHistory} epoch={store.snapshot.epoch} />
      </div>

      <div className="area-boundary panel">
        <DecisionBoundary
          weights={store.snapshot.weights}
          settings={store.settings}
          epoch={store.snapshot.epoch}
        />
      </div>

      <div className="area-activation panel">
        <ActivationExplorer settings={store.settings} />
      </div>

      <div className="area-controls panel">
        <Controls store={store} />
      </div>
    </div>
  )
}

export default App
