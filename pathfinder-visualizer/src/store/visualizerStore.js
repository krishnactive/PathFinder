import { create } from "zustand";
import { bfs } from "../algorithms/bfs";
import { dfs } from "../algorithms/dfs";
import { dijkstra } from "../algorithms/dijkstra";
import { astar } from "../algorithms/astar";
import { generateRandomMaze, recursiveDivisionMaze } from "../utils/mazeGenerators";

// Map latest log line -> pseudocode line index (0..6)
function lineFromLog(algorithm, text) {
  const t = text || "";
  if (algorithm === "bfs") {
    if (t.startsWith("BFS —")) return 0;
    if (t.startsWith("Visit (")) return 2;
    if (t.startsWith("Enqueue (")) return 6;
    if (t.startsWith("Reached the end")) return 3;
    if (t.startsWith("No path")) return 1;
    return 1;
  }
  if (algorithm === "dfs") {
    if (t.startsWith("DFS —")) return 0;
    if (t.startsWith("Visit (")) return 2;
    if (t.startsWith("Push (")) return 6;
    if (t.startsWith("Reached the end")) return 3;
    if (t.startsWith("No path")) return 1;
    return 1;
  }
  if (algorithm === "dijkstra") {
    if (t.startsWith("Dijkstra —")) return 0;
    if (t.startsWith("Visit (")) return 2;
    if (t.startsWith("Relax")) return 6;
    if (t.startsWith("No path")) return 1;
    return 1;
  }
  if (algorithm === "astar") {
    if (t.startsWith("A* —")) return 0;
    if (t.startsWith("Visit (")) return 2;
    if (t.startsWith("Relax")) return 6;
    if (t.startsWith("No path")) return 1;
    return 1;
  }
  return 0;
}

function sumPathCost(grid, path) {
  if (!path || !path.length) return 0;
  let sum = 0;
  for (let i = 1; i < path.length; i++) {
    const [r, c] = path[i];
    sum += grid[r][c].weight ?? 1;
  }
  return sum;
}

// THEME helpers
const THEME_KEY = "pf_theme";
function readInitialTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "dark" || t === "light") return t;
  } catch {}
  return "dark"; // default
}
function applyThemeToDom(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

const useVisualizerStore = create((set, get) => ({
  // Theme
  theme: readInitialTheme(),
  setTheme: (theme) => {
    const t = theme === "light" ? "light" : "dark";
    set({ theme: t });
    try { localStorage.setItem(THEME_KEY, t); } catch {}
    applyThemeToDom(t);
  },

  // Grid & algorithms
  rows: 8,
  cols: 8,
  grid: [],
  visitedNodes: [],
  pathNodes: [],
  logs: [],
  algorithm: "bfs",

  // Teaching & animation config
  animationSpeed: 50, // 1..100
  currentPseudoLine: 0,

  // Zoom controls
  zoomMode: "fit",   // "fit" | "fixed"
  zoomFactor: 1.0,
  setZoomMode: (mode) => set({ zoomMode: mode }),
  setZoomFactor: (f) => {
    const z = Math.max(0.5, Math.min(3, Number(f) || 1));
    set({ zoomFactor: z });
  },

  // Fast solve
  fastSolve: false,
  setFastSolve: (v) => set({ fastSolve: !!v }),

  // Run / playback control
  runId: 0,
  isPlaying: false,
  steps: [],
  stepIndex: -1,
  _allLogs: [],
  // progress
  currentStep: 0,
  totalSteps: 0,

  // META for tooltips
  meta: {},            // {dist,parent} or {g,h,f,parent}
  pathCost: 0,
  pathLength: 0,

  // ===== Initialization & Settings =====
  initializeGrid: (rows, cols) => {
    const grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ type: "path", weight: 1 }))
    );
    grid[0][0] = { type: "start", weight: 0 };
    grid[rows - 1][cols - 1] = { type: "end", weight: 0 };

    set({
      rows, cols, grid,
      visitedNodes: [], pathNodes: [], logs: [],
      currentPseudoLine: 0,
      isPlaying: false, steps: [], stepIndex: -1, _allLogs: [],
      currentStep: 0, totalSteps: 0,
      meta: {}, pathCost: 0, pathLength: 0,
    });
  },

  setSize: (rows, cols) => {
    const r = Math.max(3, Math.min(60, Number(rows) || 8));
    const c = Math.max(3, Math.min(60, Number(cols) || 8));
    get().initializeGrid(r, c);
  },

  setAlgorithm: (algo) =>
    set({
      algorithm: algo,
      currentPseudoLine: 0,
      steps: [],
      stepIndex: -1,
      _allLogs: [],
      currentStep: 0,
      totalSteps: 0,
      meta: {},
      pathCost: 0,
      pathLength: 0,
    }),

  setAnimationSpeed: (val) => {
    const v = Math.max(1, Math.min(100, Number(val) || 50));
    set({ animationSpeed: v });
  },

  _delays() {
    const sp = get().animationSpeed;
    const visitDelay = Math.max(5, 205 - sp * 2);
    return { visitDelay };
  },

  _updateProgress(i) {
    const total = get().steps.length;
    set({ currentStep: Math.max(0, Math.min(total, i + 1)), totalSteps: total });
  },

  _invalidateRunAndClear() {
    const nextId = get().runId + 1;
    set({
      runId: nextId,
      isPlaying: false,
      visitedNodes: [],
      pathNodes: [],
      logs: [],
      currentPseudoLine: 0,
      steps: [],
      stepIndex: -1,
      _allLogs: [],
      currentStep: 0,
      totalSteps: 0,
      meta: {},
      pathCost: 0,
      pathLength: 0,
    });
  },

  toggleCell: (row, col) => {
    const { grid } = get();
    const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
    const cell = newGrid[row][col];
    if (cell.type === "start" || cell.type === "end") return;

    newGrid[row][col] =
      cell.type === "wall" ? { type: "path", weight: 1 } : { type: "wall", weight: Infinity };

    set({ grid: newGrid });
    get()._invalidateRunAndClear();
  },

  cycleWeight: (row, col) => {
    const { grid } = get();
    const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
    const cell = newGrid[row][col];
    if (cell.type === "start" || cell.type === "end" || cell.type === "wall") return;

    if (cell.weight === 1) newGrid[row][col] = { type: "path", weight: 5 };
    else if (cell.weight === 5) newGrid[row][col] = { type: "path", weight: 10 };
    else newGrid[row][col] = { type: "path", weight: 1 };

    set({ grid: newGrid });
    get()._invalidateRunAndClear();
  },

  setWeightManually: (row, col, weight) => {
    const { grid } = get();
    const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
    const cell = newGrid[row][col];
    if (cell.type === "start" || cell.type === "end" || cell.type === "wall") return;

    const w = Math.max(1, parseInt(weight, 10) || 1);
    newGrid[row][col] = { type: "path", weight: w };

    set({ grid: newGrid });
    get()._invalidateRunAndClear();
  },

  // ===== Build steps from an algorithm result =====
  _computeResult() {
    const { grid, algorithm } = get();
    if (algorithm === "bfs") return bfs(grid);
    if (algorithm === "dfs") return dfs(grid);
    if (algorithm === "dijkstra") return dijkstra(grid);
    if (algorithm === "astar") return astar(grid);
    return { visitedOrder: [], shortestPath: [], logs: [], meta: {} };
  },

  _buildStepsFromResult(result) {
    const { algorithm, grid } = get();
    const { visitedOrder, shortestPath, logs, meta } = result;
    const steps = [];

    for (let i = 0; i < visitedOrder.length; i++) {
      const latestLog = logs[i] || logs[logs.length - 1] || "";
      steps.push({
        visited: visitedOrder.slice(0, i + 1),
        path: [],
        logCount: Math.min(logs.length, i + 1),
        line: lineFromLog(algorithm, latestLog),
      });
    }

    for (let j = 0; j < (shortestPath?.length || 0); j++) {
      steps.push({
        visited: visitedOrder.slice(),
        path: shortestPath.slice(0, j + 1),
        logCount: logs.length,
        line: lineFromLog(algorithm, logs[logs.length - 1] || ""),
      });
    }

    const pathCost = sumPathCost(grid, shortestPath);
    const pathLength = shortestPath?.length || 0;

    return { steps, logs, shortestPath, meta, pathCost, pathLength };
  },

  _applyStepIndex(i) {
    const { steps, _allLogs } = get();
    if (i < 0 || steps.length === 0) {
      set({
        stepIndex: -1,
        visitedNodes: [],
        pathNodes: [],
        logs: [],
        currentPseudoLine: 0,
      });
      get()._updateProgress(-1);
      return;
    }
    const s = steps[i];
    set({
      stepIndex: i,
      visitedNodes: s.visited,
      pathNodes: s.path,
      logs: _allLogs.slice(0, s.logCount),
      currentPseudoLine: s.line,
    });
    get()._updateProgress(i);
  },

  // ===== Public playback API =====
  rebuildSteps: () => {
    const res = get()._computeResult();
    const built = get()._buildStepsFromResult(res);
    set({
      steps: built.steps,
      _allLogs: built.logs,
      stepIndex: -1,
      visitedNodes: [],
      pathNodes: [],
      logs: [],
      currentPseudoLine: 0,
      isPlaying: false,
      runId: get().runId + 1,
      currentStep: 0,
      totalSteps: built.steps.length,
      meta: built.meta || {},
      pathCost: built.pathCost || 0,
      pathLength: built.pathLength || 0,
    });
  },

  stepForward: () => {
    if (!get().steps.length) get().rebuildSteps();
    const { stepIndex, steps } = get();
    const next = Math.min((stepIndex < 0 ? 0 : stepIndex + 1), steps.length - 1);
    get()._applyStepIndex(next);
  },

  stepBackward: () => {
    if (!get().steps.length) return;
    const { stepIndex } = get();
    const prev = Math.max(-1, stepIndex - 1);
    get()._applyStepIndex(prev);
  },

  toStart: () => {
    if (!get().steps.length) get().rebuildSteps();
    get()._applyStepIndex(-1);
  },

  toEnd: () => {
    if (!get().steps.length) get().rebuildSteps();
    const last = get().steps.length - 1;
    get()._applyStepIndex(last);
  },

  seekTo: (absoluteIndex) => {
    if (!get().steps.length) return;
    const idx = Math.max(-1, Math.min(get().steps.length - 1, absoluteIndex));
    get()._applyStepIndex(idx);
  },

  play: async () => {
    if (!get().steps.length) get().rebuildSteps();
    if (get().fastSolve) {
      get().toEnd();
      set({ isPlaying: false });
      return;
    }

    const myRun = get().runId + 1;
    const { visitDelay } = get()._delays();
    set({ runId: myRun, isPlaying: true });

    const { stepIndex, steps } = get();
    if (steps.length && stepIndex >= steps.length - 1) {
      get()._applyStepIndex(-1);
    }

    while (get().isPlaying) {
      if (get().runId !== myRun) return;
      const { stepIndex: idx, steps: st } = get();
      if (idx >= st.length - 1) break;
      await new Promise((res) => setTimeout(res, visitDelay));
      if (!get().isPlaying || get().runId !== myRun) return;
      get()._applyStepIndex(idx + 1);
    }

    if (get().runId === myRun) set({ isPlaying: false });
  },

  pause: () => set({ isPlaying: false }),

  runAlgorithm: () => {
    get().rebuildSteps();
    if (get().fastSolve) {
      get().toEnd();
      set({ isPlaying: false });
    } else {
      get().play();
    }
  },

  // ===== Reset / Generator =====
  reset: () => {
    const { rows, cols } = get();
    get().initializeGrid(rows, cols);
  },

  generateRandom: () => {
    const { rows, cols } = get();
    const grid = generateRandomMaze(rows, cols);
    set({
      grid,
      visitedNodes: [],
      pathNodes: [],
      logs: [],
      currentPseudoLine: 0,
      isPlaying: false,
      steps: [],
      stepIndex: -1,
      _allLogs: [],
      currentStep: 0,
      totalSteps: 0,
      meta: {},
      pathCost: 0,
      pathLength: 0,
      runId: get().runId + 1,
    });
  },

  generateRecursive: () => {
    const { rows, cols } = get();
    const grid = recursiveDivisionMaze(rows, cols);
    set({
      grid,
      visitedNodes: [],
      pathNodes: [],
      logs: [],
      currentPseudoLine: 0,
      isPlaying: false,
      steps: [],
      stepIndex: -1,
      _allLogs: [],
      currentStep: 0,
      totalSteps: 0,
      meta: {},
      pathCost: 0,
      pathLength: 0,
      runId: get().runId + 1,
    });
  },
}));

// Apply saved theme at startup
try {
  const t = useVisualizerStore.getState().theme;
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
} catch {}

export default useVisualizerStore;
