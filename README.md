# ANNICA

**Artificial Neural Network's Interactive Computed Animations** — an in-browser playground for understanding how neural networks learn, one step at a time.

ANNICA trains a 2-layer feedforward network on the XOR problem and makes every part of the process visible: weight magnitudes, gradient flow, activation functions, decision boundaries, and more. No ML libraries, no black boxes — just pure TypeScript math rendered live in your browser.

![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript) ![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite)

---

## Features

### Three Training Modes
| Mode | Description |
|------|-------------|
| **Continuous** | Trains automatically at adjustable speed (up to ~50 epochs/sec) |
| **Step** | One epoch at a time, with animated forward → backward → update sequence |
| **Micro-step** | Manually advance through each phase: Forward Pass → Backward Pass → Weight Update |

### Live Visualizations
- **Network Diagram** — SVG graph showing all weights (colored by sign, sized by magnitude) and neuron activations. Each training phase triggers distinct animations.
- **Loss Curve** — Canvas plot of training loss over time with interactive hover tooltips.
- **Decision Boundary** — 80×80 grid heatmap of the model's predictions across the full input space, updated every epoch.
- **Activation Explorer** — Interactive plot of the selected activation function and its derivative.
- **Gradient Inspector** — Per-layer gradient magnitudes, ratio display, and automatic vanishing gradient warnings.

### Interactive Controls
- **Learning rate** slider (0.01 – 2.0)
- **Activation function** selector: sigmoid, tanh, ReLU, linear
- **Training speed** slider
- **Linear mode** — removes hidden-layer nonlinearity to prove XOR is unsolvable without it
- **Manual mode** — click any weight edge to directly edit its value and see the immediate effect
- **Derivative toggle** — overlay f′(x) on the Activation Explorer

---

## The Network

```
Input (2) → Hidden (3, configurable activation) → Output (1, sigmoid)
```

Trained on the classic XOR dataset:

| x₁ | x₂ | y |
|----|----|---|
| 0  | 0  | 0 |
| 0  | 1  | 1 |
| 1  | 0  | 1 |
| 1  | 1  | 0 |

**Forward pass**: z = Wx + b, a = activation(z), output through sigmoid
**Loss**: Binary cross-entropy
**Backward pass**: Full backpropagation with analytical gradients
**Optimizer**: Vanilla SGD
**Init**: Xavier uniform with seed=42 (deterministic, reproducible resets)

---

## Getting Started

**Prerequisites**: Node.js ≥ 18

```bash
git clone https://github.com/your-username/annica.git
cd annica
npm install
npm run dev
```

Open `http://localhost:5173`. Hit **Play** and watch the network learn.

```bash
npm run build   # production build (~235 KB JS)
npm run preview # preview the production build
```

---

## Project Structure

```
src/
├── core/
│   ├── types.ts            # Weights, Activations, Gradients types
│   ├── activations.ts      # sigmoid, tanh, ReLU, linear + derivatives
│   ├── xor.ts              # XOR dataset
│   └── nn.ts               # Forward pass, backward pass, SGD, Xavier init
├── store/
│   └── useNNStore.ts       # Central state: mutable modelRef + React snapshot
└── components/
    ├── Header/             # Controls bar (mode, sliders, toggles, epoch display)
    ├── NetworkVisualizer/  # SVG network diagram with animated edges and nodes
    ├── BottomPanel/        # Tabbed panel container
    ├── LossPlot/           # Canvas loss curve
    ├── DecisionBoundary/   # Canvas 2D heatmap
    ├── ActivationExplorer/ # Canvas activation function plotter
    └── Controls/           # Gradient display with vanishing gradient detection
```

### Architecture Notes

**Mutable ref + snapshot split** — The training loop writes to a plain `modelRef` object (no React state, no re-renders). A `snapshot` state object is updated separately to drive the UI. This lets the training loop run at full speed without triggering unnecessary renders.

**Stable training loop** — The `setInterval` callback reads hyperparameters from a `settingsRef` instead of state, so changing the learning rate or activation function takes effect immediately without restarting the interval.

**Canvas rendering** — All canvas panels use `ResizeObserver` + device pixel ratio scaling for crisp rendering at any size.

**React Compiler** — `babel-plugin-react-compiler` is enabled; no manual `useMemo` or `useCallback` needed.

---

## What You Can Learn With This

- **Why XOR requires nonlinearity** — switch to Linear mode and watch the decision boundary stay flat no matter how long you train
- **How activation functions affect convergence** — compare sigmoid vs. tanh vs. ReLU on the same problem
- **Vanishing gradients in action** — run sigmoid-on-sigmoid and watch the gradient shrink through layers; the inspector flags it automatically
- **What backpropagation actually does** — use Micro-step mode to manually step through Forward → Backward → Update
- **How learning rate affects training** — crank it high and watch loss oscillate; set it low and watch it crawl
- **Manual weight editing** — use Manual mode to hand-set any weight and immediately see its effect on the decision boundary

---

## Tech Stack

- **React 19** + **TypeScript 5.9** (strict mode)
- **Vite 7** (dev server + bundler)
- **Plain CSS** — CSS Grid layout, CSS variables, keyframe animations; no UI library
- **SVG** for the network diagram
- **Canvas API** for data visualizations
- No ML libraries — all math is hand-written in `src/core/nn.ts`

---

## License

MIT
