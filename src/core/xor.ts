export interface XORSample {
  input: [number, number]
  label: number
}

export const XOR_DATA: XORSample[] = [
  { input: [0, 0], label: 0 },
  { input: [0, 1], label: 1 },
  { input: [1, 0], label: 1 },
  { input: [1, 1], label: 0 },
]
