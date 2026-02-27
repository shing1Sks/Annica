import { useState } from 'react'
import type { useNNStore } from '../../store/useNNStore'
import LossPlot from '../LossPlot'
import DecisionBoundary from '../DecisionBoundary'
import ActivationExplorer from '../ActivationExplorer'
import GradientDisplay from '../Controls/GradientDisplay'

type Store = ReturnType<typeof useNNStore>
type TabId = 'loss' | 'boundary' | 'activation' | 'gradients'

interface Props {
  store: Store
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'loss',       label: 'Loss Curve',   icon: '📉' },
  { id: 'boundary',   label: 'Boundary',     icon: '🗺' },
  { id: 'activation', label: 'Activation',   icon: '〜' },
  { id: 'gradients',  label: 'Gradients',    icon: '∇' },
]

const EXPANDED_HEIGHT = 270
const COLLAPSED_HEIGHT = 36

export default function BottomPanel({ store }: Props) {
  const [tab, setTab] = useState<TabId>('loss')
  const [collapsed, setCollapsed] = useState(false)

  const { snapshot, settings } = store

  function handleTabClick(id: TabId) {
    if (collapsed) setCollapsed(false)
    setTab(id)
  }

  const height = collapsed ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT

  return (
    <div
      className="app-bottom"
      style={{ height }}
    >
      {/* Tab bar */}
      <div className="bottom-tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`bottom-tab${tab === t.id && !collapsed ? ' tab-active' : ''}`}
            onClick={() => handleTabClick(t.id)}
          >
            <span style={{ fontSize: 12 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}

        <span className="bottom-tab-spacer" />

        <button
          className="bottom-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? '▲ Show' : '▼ Hide'}
        </button>
      </div>

      {/* Tab content */}
      {!collapsed && (
        <div className="bottom-content">
          {tab === 'loss' && (
            <LossPlot
              lossHistory={snapshot.lossHistory}
              epoch={snapshot.epoch}
            />
          )}
          {tab === 'boundary' && (
            <DecisionBoundary
              weights={snapshot.weights}
              settings={settings}
              epoch={snapshot.epoch}
            />
          )}
          {tab === 'activation' && (
            <ActivationExplorer settings={settings} />
          )}
          {tab === 'gradients' && (
            <GradientDisplay snapshot={snapshot} settings={settings} />
          )}
        </div>
      )}
    </div>
  )
}
