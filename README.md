# PathFinder Visualizer

An interactive teaching and visualization tool for **pathfinding algorithms** in both **Grid** and **Graph** modes, built with **React + Vite + Zustand**.

---

## 🚀 Features Implemented

### ✅ Core Algorithms
- **BFS** (Breadth-First Search, unweighted shortest path)
- **DFS** (Depth-First Search, unweighted traversal)
- **Dijkstra** (weighted shortest path)
- **A*** (weighted shortest path with heuristic)

### ✅ Grid Mode
- Interactive grid (place/remove walls, adjust weights)
- Weighted cells:
  - Cycle between common weights (1, 5, 10)
  - Double-click to manually set custom weights
- Random obstacle generation & recursive maze generation
- Start/End fixed, visual step-by-step exploration
- Auto-fit grid + zoom controls
- Adjustable grid size with auto-scaling cells

### ✅ Graph Mode
- Switch between Grid and Graph
- Add/move nodes (double-click background to add, drag to move)
- Connect nodes with edges (click-to-connect, edit weights by clicking label)
- Weighted edges for Dijkstra & A*
- Start/End nodes selectable
- Algorithms run directly on graph structures

### ✅ Teaching Tools
- **Logs terminal**: step-by-step algorithm messages
- **Pseudocode terminal**: C++-style pseudocode highlighting per step
- **Frontier/Queue/Stack panel**: live view of BFS queue, DFS stack, or priority queue (Dijkstra/A*)
- **Tooltips**: hover cells/nodes to inspect `g`, `h`, `f`, distance, parent
- **Playback controls**: Play, Pause, Step Forward, Step Backward, Jump to Start/End
- **Progress bar** with scrubbing & Fast Solve option

### ✅ UI/UX Enhancements
- Dark mode toggle with persistence (localStorage)
- Keyboard shortcuts:
  - **Space** → Play/Pause
  - **← / →** → Step Backward/Forward
  - **R** → Reset
- Resizable panels (logs, pseudocode, frontier)
- Zoom modes: **Fit** (auto-fit screen) and **Fixed** (manual scaling)

---

## 📂 Project Structure

```
src/
├── algorithms/          # Algorithm implementations
│   ├── bfs.js           # BFS (Grid)
│   ├── dfs.js           # DFS (Grid)
│   ├── dijkstra.js      # Dijkstra (Grid)
│   ├── astar.js         # A* (Grid)
│   └── graph/           # Graph-mode algorithms
│       ├── bfs.js
│       ├── dfs.js
│       ├── dijkstra.js
│       └── astar.js
│
├── components/          # UI components
│   ├── ControlsPanel.jsx     # Header controls (algorithm, mode, theme, playback, size)
│   ├── Layout.jsx            # Main layout (grid/graph, side panels, logs)
│   ├── GridVisualizer/       # Grid mode components
│   │   └── Grid.jsx
│   ├── Graph/                # Graph mode components
│   │   └── GraphCanvas.jsx
│   ├── PseudocodeTerminal.jsx # Shows pseudocode with highlighted line per step
│   ├── TeachingLogs.jsx       # Scrollable log terminal (step-by-step actions)
│   └── FrontierPanel.jsx      # Queue/Stack/PQ live visualization
│
├── store/
│   └── visualizerStore.js     # Zustand store (all app state + playback engine)
│
├── utils/
│   └── mazeGenerators.js      # Random + recursive maze generation
│
├── index.css                  # TailwindCSS + custom styles
└── main.jsx                   # Entry point, wraps Layout
```

### 📝 File Notes
- **`visualizerStore.js`** → the heart of the app; manages state for Grid & Graph, playback steps, logs, pseudocode line, frontier snapshots, and theme.
- **Algorithm files** → each returns `{ visitedOrder, shortestPath, logs, meta, frontiers }` so visualization panels can sync.
- **ControlsPanel.jsx** → dropdowns, buttons, speed sliders, zoom control, fast solve toggle, etc.
- **Layout.jsx** → flex layout with resizable panels; integrates keyboard shortcuts and theme application.
- **PseudocodeTerminal.jsx** → C++-style pseudocode, highlights lines based on logs.
- **TeachingLogs.jsx** → VSCode-like terminal showing algorithm messages.
- **FrontierPanel.jsx** → new addition! shows contents of BFS queue / DFS stack / Dijkstra-A* priority queue live.
- **GraphCanvas.jsx** → interactive SVG-based graph editor (nodes, edges, weights).
- **mazeGenerators.js** → provides randomized mazes for teaching Grid mode.

---

## 📌 Upcoming Features
- Right-click context menu for nodes/edges (Set Start/End, Edit Weight, Delete)
- Directed edges toggle
- Graph save/load slots (localStorage + JSON import/export)
- A* heuristic selection (Manhattan/Euclidean/Zero)
- Classroom presets for teaching

---

## 🛠️ Tech Stack
- React + Vite
- Zustand (state management)
- TailwindCSS (styling)

---

## 📂 Project Setup

```bash
# install dependencies
npm install

# run locally
npm run dev

# build for production
npm run build
```

---

## 👨‍🏫 Author Notes
This project is designed as a **teaching-first visualization tool**.  
It balances **interactivity** (edit grids/graphs live) with **instructional clarity** (pseudocode, logs, frontier visualization).  
Perfect for **classroom demos**, **self-study**, or **interview prep**.

---
