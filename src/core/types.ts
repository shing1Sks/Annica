export type ActivationName = 'sigmoid' | 'tanh' | 'relu' | 'linear'
export type TrainingMode = 'continuous' | 'step' | 'micro'
export type AnimPhase = 'idle' | 'forward' | 'backward' | 'update'
export type MicroStepType = 'forward' | 'backward' | 'update'

export interface Weights {
  W1: number[][] // [3][2] — hidden×input
  b1: number[]   // [3]
  W2: number[][] // [1][3] — output×hidden
  b2: number[]   // [1]
}

export interface Activations {
  a0: number[] // input [2]
  z1: number[] // pre-activation hidden [3]
  a1: number[] // post-activation hidden [3]
  z2: number[] // pre-activation output [1]
  a2: number[] // prediction [1]
}

// Batch-averaged gradients over all 4 XOR samples
export interface Gradients {
  dW1: number[][] // [3][2]
  db1: number[]   // [3]
  dW2: number[][] // [1][3]
  db2: number[]   // [1]
  da1: number[]   // [3] — signed gradient flowing into hidden activations
  dz2: number[]   // [1] — signed gradient at output pre-activation
}

export interface NNSnapshot {
  weights: Weights
  activations: Activations      // batch-averaged, for network display
  gradients: Gradients | null   // null before first backward pass
  loss: number
  epoch: number
  lossHistory: number[]         // capped at 1000 entries
  avgGradHidden: number         // mean(|da1|) — vanishing gradient insight
  avgGradOutput: number         // mean(|dz2|)
}

export interface Settings {
  learningRate: number          // 0.01 – 2.0
  activationFn: ActivationName
  isLinearMode: boolean         // bypass hidden activation
  isManualMode: boolean         // click edges to edit weights
  trainingMode: TrainingMode
  trainingSpeed: number         // ms per epoch in continuous mode (50–1000)
  showDerivative: boolean       // show derivative in activation explorer
}
