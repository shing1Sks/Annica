import './App.css'
import { useNNStore } from './store/useNNStore'
import NetworkVisualizer from './components/NetworkVisualizer'
import Header from './components/Header'
import BottomPanel from './components/BottomPanel'

function App() {
  const store = useNNStore()

  return (
    <div className="app-shell">
      <header className="app-header">
        <Header store={store} />
      </header>

      <main className="app-main">
        <NetworkVisualizer
          snapshot={store.snapshot}
          animPhase={store.animPhase}
          settings={store.settings}
          onWeightChange={store.overrideWeight}
        />
      </main>

      <BottomPanel store={store} />
    </div>
  )
}

export default App
