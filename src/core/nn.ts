import type { Weights, Activations, Gradients, NNSnapshot, Settings } from './types'
import { ACTIVATIONS, sigmoid } from './activations'
import { XOR_DATA } from './xor'

// ─── Matrix helpers ───────────────────────────────────────────────────────────

function matVec(M: number[][], v: number[]): number[] {
  return M.map(row => row.reduce((sum, w, j) => sum + w * v[j], 0))
}

function matTVec(M: number[][], v: number[]): number[] {
  const n = M[0].length
  const result = new Array<number>(n).fill(0)
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < M.length; i++) {
      result[j] += M[i][j] * v[i]
    }
  }
  return result
}

function outer(a: number[], b: number[]): number[][] {
  return a.map(ai => b.map(bj => ai * bj))
}

function deepCloneWeights(w: Weights): Weights {
  return {
    W1: w.W1.map(r => [...r]),
    b1: [...w.b1],
    W2: w.W2.map(r => [...r]),
    b2: [...w.b2],
  }
}

// ─── Weight initialisation ────────────────────────────────────────────────────

let rngState = 42

function seededRand(): number {
  rngState = (rngState * 1664525 + 1013904223) & 0xffffffff
  return (rngState >>> 0) / 0xffffffff
}

function xavierUniform(fanIn: number, fanOut: number): number {
  const limit = Math.sqrt(6 / (fanIn + fanOut))
  return seededRand() * 2 * limit - limit
}

export function initWeights(seed = 42): Weights {
  rngState = seed
  return {
    W1: Array.from({ length: 3 }, () => [xavierUniform(2, 3), xavierUniform(2, 3)]),
    b1: [0, 0, 0],
    W2: [Array.from({ length: 3 }, () => xavierUniform(3, 1))],
    b2: [0],
  }
}

// ─── Forward pass ─────────────────────────────────────────────────────────────

export function forward(
  input: [number, number],
  w: Weights,
  activationName: string,
  linearMode: boolean,
): Activations {
  const act = ACTIVATIONS[activationName as keyof typeof ACTIVATIONS] ?? ACTIVATIONS.sigmoid

  const z1 = matVec(w.W1, input).map((z, i) => z + w.b1[i])
  const a1 = linearMode ? [...z1] : z1.map(act.fn)
  const z2 = matVec(w.W2, a1).map((z, i) => z + w.b2[i])
  const a2 = z2.map(sigmoid)

  return { a0: [input[0], input[1]], z1, a1, z2, a2 }
}

export function forwardAll(
  w: Weights,
  activationName: string,
  linearMode: boolean,
): Activations[] {
  return XOR_DATA.map(s => forward(s.input, w, activationName, linearMode))
}

// Forward for arbitrary input (used by decision boundary)
export function forwardPoint(
  input: [number, number],
  w: Weights,
  activationName: string,
  linearMode: boolean,
): number {
  return forward(input, w, activationName, linearMode).a2[0]
}

// ─── Loss ─────────────────────────────────────────────────────────────────────

export function computeLoss(actArr: Activations[]): number {
  const EPS = 1e-7
  let total = 0
  for (let i = 0; i < actArr.length; i++) {
    const y = XOR_DATA[i].label
    const p = Math.min(Math.max(actArr[i].a2[0], EPS), 1 - EPS)
    total -= y * Math.log(p) + (1 - y) * Math.log(1 - p)
  }
  return total / actArr.length
}

// ─── Backward pass ────────────────────────────────────────────────────────────

export function backwardAll(
  w: Weights,
  actArr: Activations[],
  activationName: string,
  linearMode: boolean,
): Gradients {
  const act = ACTIVATIONS[activationName as keyof typeof ACTIVATIONS] ?? ACTIVATIONS.sigmoid
  const N = actArr.length

  let dW1 = w.W1.map(row => row.map(() => 0))
  let db1 = w.b1.map(() => 0)
  let dW2 = w.W2.map(row => row.map(() => 0))
  let db2 = w.b2.map(() => 0)
  let da1Acc = w.b1.map(() => 0)
  let dz2Acc = w.b2.map(() => 0)

  for (let s = 0; s < N; s++) {
    const { a0, z1, a1, a2 } = actArr[s]
    const y = XOR_DATA[s].label

    // Output gradient: dL/dz2 = a2 - y  (BCE + sigmoid shortcut)
    const dz2 = [a2[0] - y]

    // W2 gradient: dz2 ⊗ a1
    const dW2s = outer(dz2, a1)

    // Propagate to hidden: da1 = W2^T @ dz2
    const da1 = matTVec(w.W2, dz2)

    // Hidden layer gradient: dz1 = da1 ⊙ act'(z1)
    const dz1 = linearMode ? [...da1] : da1.map((d, i) => d * act.derivative(z1[i]))

    // W1 gradient: dz1 ⊗ a0
    const dW1s = outer(dz1, a0)

    // Accumulate
    dW2 = dW2.map((row, i) => row.map((v, j) => v + dW2s[i][j]))
    db2 = db2.map((v, i) => v + dz2[i])
    dW1 = dW1.map((row, i) => row.map((v, j) => v + dW1s[i][j]))
    db1 = db1.map((v, i) => v + dz1[i])
    da1Acc = da1Acc.map((v, i) => v + da1[i])
    dz2Acc = dz2Acc.map((v, i) => v + dz2[i])
  }

  return {
    dW1: dW1.map(row => row.map(g => g / N)),
    db1: db1.map(g => g / N),
    dW2: dW2.map(row => row.map(g => g / N)),
    db2: db2.map(g => g / N),
    da1: da1Acc.map(g => g / N),
    dz2: dz2Acc.map(g => g / N),
  }
}

// ─── Weight update (SGD) ──────────────────────────────────────────────────────

export function updateWeights(w: Weights, g: Gradients, lr: number): Weights {
  return {
    W1: w.W1.map((row, i) => row.map((v, j) => v - lr * g.dW1[i][j])),
    b1: w.b1.map((v, i) => v - lr * g.db1[i]),
    W2: w.W2.map((row, i) => row.map((v, j) => v - lr * g.dW2[i][j])),
    b2: w.b2.map((v, i) => v - lr * g.db2[i]),
  }
}

// ─── Snapshot builder ─────────────────────────────────────────────────────────

function avgActivations(actArr: Activations[]): Activations {
  const N = actArr.length
  const avg = (key: keyof Activations, idx: number) =>
    actArr.reduce((s, a) => s + (a[key] as number[])[idx], 0) / N

  return {
    a0: [avg('a0', 0), avg('a0', 1)],
    z1: actArr[0].z1.map((_, i) => avg('z1', i)),
    a1: actArr[0].a1.map((_, i) => avg('a1', i)),
    z2: actArr[0].z2.map((_, i) => avg('z2', i)),
    a2: actArr[0].a2.map((_, i) => avg('a2', i)),
  }
}

export function buildSnapshot(
  w: Weights,
  actArr: Activations[],
  g: Gradients | null,
  epoch: number,
  lossHistory: number[],
): NNSnapshot {
  return {
    weights: deepCloneWeights(w),
    activations: avgActivations(actArr),
    gradients: g,
    loss: lossHistory[lossHistory.length - 1] ?? 0,
    epoch,
    lossHistory: [...lossHistory],
    avgGradHidden: g ? g.da1.reduce((s, v) => s + Math.abs(v), 0) / g.da1.length : 0,
    avgGradOutput: g ? g.dz2.reduce((s, v) => s + Math.abs(v), 0) / g.dz2.length : 0,
  }
}

// ─── Full train step ──────────────────────────────────────────────────────────

export function trainStep(w: Weights, s: Settings): {
  weights: Weights
  actArr: Activations[]
  gradients: Gradients
  loss: number
} {
  const actArr = forwardAll(w, s.activationFn, s.isLinearMode)
  const loss = computeLoss(actArr)
  const gradients = backwardAll(w, actArr, s.activationFn, s.isLinearMode)
  const weights = updateWeights(w, gradients, s.learningRate)
  return { weights, actArr, gradients, loss }
}
