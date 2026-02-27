import { useRef, useState, useEffect, useCallback } from 'react'
import type { NNSnapshot, Settings, AnimPhase, MicroStepType, Activations, Gradients } from '../core/types'
import {
  initWeights,
  forwardAll,
  computeLoss,
  backwardAll,
  updateWeights,
  buildSnapshot,
} from '../core/nn'

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: Settings = {
  learningRate: 0.1,
  activationFn: 'sigmoid',
  isLinearMode: false,
  isManualMode: false,
  trainingMode: 'continuous',
  trainingSpeed: 150,
  showDerivative: false,
}

function makeInitialSnapshot(): NNSnapshot {
  const w = initWeights()
  const actArr = forwardAll(w, 'sigmoid', false)
  const loss = computeLoss(actArr)
  return buildSnapshot(w, actArr, null, 0, [loss])
}

// ─── Internal model state (mutable, lives in ref) ─────────────────────────────

interface ModelState {
  weights: ReturnType<typeof initWeights>
  epoch: number
  lossHistory: number[]
  pendingActArr: Activations[] | null   // for micro-step
  pendingGradients: Gradients | null     // for micro-step
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNNStore() {
  const model = useRef<ModelState>({
    weights: initWeights(),
    epoch: 0,
    lossHistory: [computeLoss(forwardAll(initWeights(), 'sigmoid', false))],
    pendingActArr: null,
    pendingGradients: null,
  })

  const [snapshot, setSnapshot] = useState<NNSnapshot>(makeInitialSnapshot)
  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle')
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isRunning, setIsRunning] = useState(false)

  // Keep settings accessible in interval callback without adding it as a dep
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const animTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  // ── helpers ────────────────────────────────────────────────────────────────

  function clearAnimTimers() {
    animTimers.current.forEach(clearTimeout)
    animTimers.current = []
  }

  function pushSnap(w: ModelState['weights'], actArr: Activations[], g: Gradients | null) {
    const m = model.current
    setSnapshot(buildSnapshot(w, actArr, g, m.epoch, m.lossHistory))
  }

  // ── Core train step ────────────────────────────────────────────────────────

  const doTrainStep = useCallback(() => {
    const s = settingsRef.current
    const m = model.current
    const actArr = forwardAll(m.weights, s.activationFn, s.isLinearMode)
    const loss = computeLoss(actArr)
    const grads = backwardAll(m.weights, actArr, s.activationFn, s.isLinearMode)
    const newWeights = updateWeights(m.weights, grads, s.learningRate)

    m.weights = newWeights
    m.epoch++
    m.lossHistory = [...m.lossHistory.slice(-999), loss]
    m.pendingActArr = null
    m.pendingGradients = null

    pushSnap(newWeights, actArr, grads)
  }, []) // reads from refs only — stable

  // ── Continuous training loop ───────────────────────────────────────────────

  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(doTrainStep, settings.trainingSpeed)
    return () => clearInterval(id)
  }, [isRunning, settings.trainingSpeed, doTrainStep])

  // ── Animation sequencing ───────────────────────────────────────────────────

  function runAnimatedStep(afterUpdate: () => void) {
    clearAnimTimers()
    setAnimPhase('forward')
    const t1 = setTimeout(() => {
      setAnimPhase('backward')
      const t2 = setTimeout(() => {
        setAnimPhase('update')
        afterUpdate()
        const t3 = setTimeout(() => {
          setAnimPhase('idle')
        }, 300)
        animTimers.current.push(t3)
      }, 500)
      animTimers.current.push(t2)
    }, 500)
    animTimers.current.push(t1)
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function startTraining() {
    clearAnimTimers()
    setAnimPhase('idle')
    setIsRunning(true)
  }

  function stopTraining() {
    setIsRunning(false)
  }

  function stepOnce() {
    if (isRunning) return
    runAnimatedStep(() => doTrainStep())
  }

  function microStep(type: MicroStepType) {
    if (isRunning) return
    const s = settingsRef.current
    const m = model.current

    if (type === 'forward') {
      clearAnimTimers()
      setAnimPhase('forward')
      const actArr = forwardAll(m.weights, s.activationFn, s.isLinearMode)
      m.pendingActArr = actArr
      pushSnap(m.weights, actArr, m.pendingGradients)
      const t = setTimeout(() => setAnimPhase('idle'), 600)
      animTimers.current.push(t)
    } else if (type === 'backward') {
      if (!m.pendingActArr) return
      clearAnimTimers()
      setAnimPhase('backward')
      const grads = backwardAll(m.weights, m.pendingActArr, s.activationFn, s.isLinearMode)
      m.pendingGradients = grads
      pushSnap(m.weights, m.pendingActArr, grads)
      const t = setTimeout(() => setAnimPhase('idle'), 600)
      animTimers.current.push(t)
    } else {
      // update
      if (!m.pendingActArr || !m.pendingGradients) return
      clearAnimTimers()
      setAnimPhase('update')
      const loss = computeLoss(m.pendingActArr)
      const newWeights = updateWeights(m.weights, m.pendingGradients, s.learningRate)
      m.weights = newWeights
      m.epoch++
      m.lossHistory = [...m.lossHistory.slice(-999), loss]
      pushSnap(newWeights, m.pendingActArr, m.pendingGradients)
      m.pendingActArr = null
      m.pendingGradients = null
      const t = setTimeout(() => setAnimPhase('idle'), 300)
      animTimers.current.push(t)
    }
  }

  function resetModel() {
    stopTraining()
    clearAnimTimers()
    setAnimPhase('idle')
    const s = settingsRef.current
    const w = initWeights()
    const actArr = forwardAll(w, s.activationFn, s.isLinearMode)
    const loss = computeLoss(actArr)
    model.current = {
      weights: w,
      epoch: 0,
      lossHistory: [loss],
      pendingActArr: null,
      pendingGradients: null,
    }
    setSnapshot(buildSnapshot(w, actArr, null, 0, [loss]))
  }

  function overrideWeight(
    layer: 'W1' | 'W2' | 'b1' | 'b2',
    i: number,
    j: number,
    value: number,
  ) {
    const m = model.current
    if (layer === 'W1') m.weights.W1[i][j] = value
    else if (layer === 'W2') m.weights.W2[i][j] = value
    else if (layer === 'b1') m.weights.b1[i] = value
    else m.weights.b2[i] = value

    const s = settingsRef.current
    const actArr = forwardAll(m.weights, s.activationFn, s.isLinearMode)
    const loss = computeLoss(actArr)
    m.lossHistory = [...m.lossHistory.slice(-999), loss]
    pushSnap(m.weights, actArr, m.pendingGradients)
  }

  // ── Settings updaters ──────────────────────────────────────────────────────

  function setLearningRate(lr: number) {
    setSettings(s => ({ ...s, learningRate: lr }))
  }

  function setActivationFn(name: Settings['activationFn']) {
    setSettings(s => ({ ...s, activationFn: name }))
    // Re-init model when activation changes (weights stay, just recompute display)
    const m = model.current
    const actArr = forwardAll(m.weights, name, settingsRef.current.isLinearMode)
    pushSnap(m.weights, actArr, null)
  }

  function toggleLinearMode() {
    setSettings(s => {
      const next = { ...s, isLinearMode: !s.isLinearMode }
      const m = model.current
      const actArr = forwardAll(m.weights, next.activationFn, next.isLinearMode)
      pushSnap(m.weights, actArr, null)
      return next
    })
  }

  function toggleManualMode() {
    setSettings(s => ({ ...s, isManualMode: !s.isManualMode }))
  }

  function setTrainingMode(mode: Settings['trainingMode']) {
    setSettings(s => ({ ...s, trainingMode: mode }))
  }

  function setTrainingSpeed(speed: number) {
    setSettings(s => ({ ...s, trainingSpeed: speed }))
  }

  function toggleDerivative() {
    setSettings(s => ({ ...s, showDerivative: !s.showDerivative }))
  }

  return {
    snapshot,
    settings,
    isRunning,
    animPhase,
    startTraining,
    stopTraining,
    stepOnce,
    microStep,
    resetModel,
    setLearningRate,
    setActivationFn,
    toggleLinearMode,
    toggleManualMode,
    setTrainingMode,
    setTrainingSpeed,
    toggleDerivative,
    overrideWeight,
  }
}
