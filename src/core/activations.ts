import type { ActivationName } from './types'

export interface ActivationFunctions {
  fn: (x: number) => number
  derivative: (x: number) => number
}

function sigmoidFn(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

export const ACTIVATIONS: Record<ActivationName, ActivationFunctions> = {
  sigmoid: {
    fn: sigmoidFn,
    derivative: (x: number) => {
      const s = sigmoidFn(x)
      return s * (1 - s)
    },
  },
  tanh: {
    fn: (x: number) => Math.tanh(x),
    derivative: (x: number) => 1 - Math.tanh(x) ** 2,
  },
  relu: {
    fn: (x: number) => Math.max(0, x),
    derivative: (x: number) => (x > 0 ? 1 : 0),
  },
  linear: {
    fn: (x: number) => x,
    derivative: (_x: number) => 1,
  },
}

export { sigmoidFn as sigmoid }
