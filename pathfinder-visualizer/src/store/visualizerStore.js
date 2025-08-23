import { create } from "zustand";
import { bfs as gridBfs } from "../algorithms/bfs";
import { dfs as gridDfs } from "../algorithms/dfs";
import { dijkstra as gridDijkstra } from "../algorithms/dijkstra";
import { astar as gridAstar } from "../algorithms/astar";

import { bfs as graphBfs } from "../algorithms/graph/bfs";
import { dfs as graphDfs } from "../algorithms/graph/dfs";
import { dijkstra as graphDijkstra } from "../algorithms/graph/dijkstra";
import { astar as graphAstar } from "../algorithms/graph/astar";

import { generateRandomMaze, recursiveDivisionMaze } from "../utils/mazeGenerators";

// ---------- Helpers ----------
function lineFromLog(algorithm, text) {
  const t = text || "";
  if (algorithm === "bfs") {
    if (t.startsWith("BFS —")) return 0;
    if (t.startsWith("Visit ")) return 2;
    if (t.startsWith("Enqueue ") || t.startsWith("Push ")) return 6;
    if (t.startsWith("Reached the end")) return 3;
    if (t.startsWith("No path")) return 1;
    return 1;
  }
  if (algorithm === "dfs") {
    if (t.startsWith("DFS —")) return 0;
    if (t.startsWith("Visit ")) return 2;
    if (t.startsWith("Push ")) return 6;
    if (t.startsWith("Reached the end")) return 3;
    if (t.startsWith("No path")) return 1;
    return 1;
  }
  if (algorithm === "dijkstra") {
    if (t.startsWith("Dijkstra —")) return 0;
    if (t.startsWith("Visit ")) return 2;
    if (t.startsWith("Relax")) return 6;
    if (t.startsWith("No path")) return 1;
    return 1;
  }
  if (algorithm === "astar") {
    if (t.startsWith("A* —")) return 0;
    if (t.startsWith("Visit ")) return 2;
    if (t.startsWith("Relax")) return 6;
    if (t.startsWith("No path")) return 1;
    return 1;
  }
  return 0;
}

function sumGridPathCost(grid, path) {
  if (!path || !path.length) return 0;
  let sum = 0;
  for (let i = 1; i < path.length; i++) {
    const [r, c] = path[i];
    sum += grid[r][c].weight ?? 1;
  }
  return sum;
}

function sumGraphPathCost(graph, path) {
  if (!path || path.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const e = graph.edges.find(
      (ed) => (ed.from === a && ed.to === b) || (ed.from === b && ed.to === a)
    );
    sum += e ? (e.weight ?? 1) : 0;
  }
  return sum;
}

// THEME (already used in your app)
const THEME_KEY = "pf_theme";
function readInitialTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "dark" || t === "light") return t;
  } catch {}
  return "dark";
}
function applyThemeToDom(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

// ---------- Store ----------
const useVisualizerStore = create((set, get) => ({
  // Modes
  mode: "grid", // "grid" | "graph"
  setMode: (m) =>
    set({
      mode: m === "graph" ? "graph" : "grid",
      // Clear playback whenever mode changes
      steps: [],
      stepIndex: -1,
      visitedNodes: [],
      pathNodes: [],
      logs: [],
      currentPseudoLine: 0,
      frontierSnapshot: [],
      isPlaying: false,
      runId: get().runId + 1,
    }),

  // Theme
  theme: readInitialTheme(),
  setTheme: (theme) => {
    const t = theme === "light" ? "light" : "dark";
    set({ theme: t });
    try { localStorage.setItem(THEME_KEY, t); } catch {}
    applyThemeToDom(t);
  },

  // Grid state
  rows: 8,
  cols: 8,
  grid: [],

  // Graph state
  graph: {
    nodes: [],
    edges: [],
    startId: null,
    endId: null,
    snap: true,
  },
  setGraphSnap: (v) => set((s) => ({ graph: { ...s.graph, snap: !!v } })),

  // Selection (graph)
  selectedNodeId: null,
  selectedEdgeId: null,

  // Teaching/animation shared
  visitedNodes: [],
  pathNodes: [],
  logs: [],
  algorithm: "bfs",
  animationSpeed: 50,
  currentPseudoLine: 0,

  // Frontier snapshot for the current step
  frontierSnapshot: [],

  // Zoom (grid)
  zoomMode: "fit",
  zoomFactor: 1.0,
  setZoomMode: (mode) => set({ zoomMode: mode }),
  setZoomFactor: (f) => {
    const z = Math.max(0.5, Math.min(3, Number(f) || 1));
    set({ zoomFactor: z });
  },

  // Fast solve + playback
  fastSolve: false,
  setFastSolve: (v) => set({ fastSolve: !!v }),
  runId: 0,
  isPlaying: false,
  steps: [],
  stepIndex: -1,
  _allLogs: [],
  currentStep: 0,
  totalSteps: 0,

  // Meta for tooltips/stats
  meta: {},
  pathCost: 0,
  pathLength: 0,

  // ---------- Grid init ----------
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
      frontierSnapshot: [],
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

  // ---------- Graph helpers ----------
  _graphNewNodeId() {
    const used = new Set(get().graph.nodes.map((n) => n.id));
    for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") if (!used.has(ch)) return ch;
    let i = 1; while (used.has(String(i))) i++; return String(i);
  },
  graphAddNode(x, y) {
    const { graph } = get();
    const id = get()._graphNewNodeId();
    const snap = graph.snap ? 20 : 1;
    const nx = Math.round(x / snap) * snap;
    const ny = Math.round(y / snap) * snap;
    const nodes = [...graph.nodes, { id, x: nx, y: ny }];
    set({ graph: { ...graph, nodes } });
  },
  graphMoveNode(id, x, y) {
    const { graph } = get();
    const snap = graph.snap ? 20 : 1;
    const nx = Math.round(x / snap) * snap;
    const ny = Math.round(y / snap) * snap;
    const nodes = graph.nodes.map((n) => (n.id === id ? { ...n, x: nx, y: ny } : n));
    set({ graph: { ...graph, nodes } });
  },
  graphConnect(fromId, toId, weight = 1) {
    if (!fromId || !toId || fromId === toId) return;
    const { graph } = get();
    const exists = graph.edges.some(
      (e) => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)
    );
    if (exists) return;
    const id = `${fromId}-${toId}`;
    const edges = [...graph.edges, { id, from: fromId, to: toId, weight: Number(weight) || 1 }];
    set({ graph: { ...graph, edges } });
  },
  graphSetEdgeWeight(edgeId, w) {
    const { graph } = get();
    const edges = graph.edges.map((e) => (e.id === edgeId ? { ...e, weight: Math.max(1, Number(w) || 1) } : e));
    set({ graph: { ...graph, edges } });
  },
  graphDeleteSelection() {
    const { selectedNodeId, selectedEdgeId, graph } = get();
    if (selectedNodeId) {
      const nodes = graph.nodes.filter((n) => n.id !== selectedNodeId);
      const edges = graph.edges.filter((e) => e.from !== selectedNodeId && e.to !== selectedNodeId);
      const startId = graph.startId === selectedNodeId ? null : graph.startId;
      const endId = graph.endId === selectedNodeId ? null : graph.endId;
      set({
        graph: { ...graph, nodes, edges, startId, endId },
        selectedNodeId: null,
      });
    } else if (selectedEdgeId) {
      const edges = graph.edges.filter((e) => e.id !== selectedEdgeId);
      set({ graph: { ...graph, edges }, selectedEdgeId: null });
    }
  },
  graphSelectNode(id) { set({ selectedNodeId: id, selectedEdgeId: null }); },
  graphSelectEdge(id) { set({ selectedEdgeId: id, selectedNodeId: null }); },
  graphSetStart(id) { set((s) => ({ graph: { ...s.graph, startId: id || null } })); },
  graphSetEnd(id) { set((s) => ({ graph: { ...s.graph, endId: id || null } })); },
  graphClear() {
    set({
      graph: { nodes: [], edges: [], startId: null, endId: null, snap: true },
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },
  graphExport() { return JSON.stringify(get().graph, null, 2); },
  graphImport(obj) {
    try {
      const graph = typeof obj === "string" ? JSON.parse(obj) : obj;
      if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return;
      set({
        graph: {
          nodes: graph.nodes.map((n) => ({ id: String(n.id), x: Number(n.x), y: Number(n.y) })),
          edges: graph.edges.map((e) => ({
            id: String(e.id),
            from: String(e.from),
            to: String(e.to),
            weight: Math.max(1, Number(e.weight) || 1),
          })),
          startId: graph.startId || null,
          endId: graph.endId || null,
          snap: !!graph.snap,
        },
        selectedNodeId: null,
        selectedEdgeId: null,
      });
    } catch {}
  },

  // ---------- Clear playback on edits ----------
  _invalidateRunAndClear() {
    const nextId = get().runId + 1;
    set({
      runId: nextId,
      isPlaying: false,
      visitedNodes: [],
      pathNodes: [],
      logs: [],
      currentPseudoLine: 0,
      frontierSnapshot: [],
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
  toggleCell(row, col) {
    if (get().mode !== "grid") return;
    const { grid } = get();
    const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
    const cell = newGrid[row][col];
    if (cell.type === "start" || cell.type === "end") return;

    newGrid[row][col] =
      cell.type === "wall" ? { type: "path", weight: 1 } : { type: "wall", weight: Infinity };

    set({ grid: newGrid });
    get()._invalidateRunAndClear();
  },
  cycleWeight(row, col) {
    if (get().mode !== "grid") return;
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
  setWeightManually(row, col, weight) {
    if (get().mode !== "grid") return;
    const { grid } = get();
    const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
    const cell = newGrid[row][col];
    if (cell.type === "start" || cell.type === "end" || cell.type === "wall") return;

    const w = Math.max(1, parseInt(weight, 10) || 1);
    newGrid[row][col] = { type: "path", weight: w };

    set({ grid: newGrid });
    get()._invalidateRunAndClear();
  },

  // ---------- Settings ----------
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
      frontierSnapshot: [],
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

  // ---------- Build steps ----------
  _computeResult() {
    const { mode, grid, algorithm, graph } = get();
    if (mode === "grid") {
      if (algorithm === "bfs") return gridBfs(grid);
      if (algorithm === "dfs") return gridDfs(grid);
      if (algorithm === "dijkstra") return gridDijkstra(grid);
      if (algorithm === "astar") return gridAstar(grid);
      return { visitedOrder: [], shortestPath: [], logs: [], meta: {}, frontierTimeline: [] };
    } else {
      const startId = graph.startId || (graph.nodes[0]?.id ?? null);
      const endId = graph.endId || (graph.nodes[graph.nodes.length - 1]?.id ?? null);
      const ctx = { nodes: graph.nodes, edges: graph.edges, startId, endId };
      if (!startId || !endId) {
        return {
          visitedOrder: [],
          shortestPath: [],
          logs: ["[Graph] Please set Start and End nodes."],
          meta: {},
          frontierTimeline: [],
        };
      }
      if (algorithm === "bfs") return graphBfs(ctx);
      if (algorithm === "dfs") return graphDfs(ctx);
      if (algorithm === "dijkstra") return graphDijkstra(ctx);
      if (algorithm === "astar") return graphAstar(ctx);
      return { visitedOrder: [], shortestPath: [], logs: [], meta: {}, frontierTimeline: [] };
    }
  },
  _buildStepsFromResult(result) {
    const { algorithm, grid, mode, graph } = get();
    const { visitedOrder, shortestPath, logs, meta, frontierTimeline = [] } = result;
    const steps = [];

    // For each visit step, attach the corresponding frontier snapshot if available
    for (let i = 0; i < visitedOrder.length; i++) {
      const latestLog = logs[i] || logs[logs.length - 1] || "";
      steps.push({
        visited: visitedOrder.slice(0, i + 1),
        path: [],
        frontier: frontierTimeline[i] || [],
        logCount: Math.min(logs.length, i + 1),
        line: lineFromLog(algorithm, latestLog),
      });
    }
    // Path reveal steps keep frontier empty
    for (let j = 0; j < (shortestPath?.length || 0); j++) {
      steps.push({
        visited: visitedOrder.slice(),
        path: shortestPath.slice(0, j + 1),
        frontier: [],
        logCount: logs.length,
        line: lineFromLog(algorithm, logs[logs.length - 1] || ""),
      });
    }

    const pathCost = mode === "grid" ? sumGridPathCost(grid, shortestPath) : sumGraphPathCost(graph, shortestPath);
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
        frontierSnapshot: [],
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
      frontierSnapshot: s.frontier || [],
    });
    get()._updateProgress(i);
  },

  // ---------- Public playback API ----------
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
      frontierSnapshot: [],
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
    const next = Math.min(stepIndex < 0 ? 0 : stepIndex + 1, steps.length - 1);
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

  // ---------- Grid generators / reset ----------
  reset: () => {
    if (get().mode === "grid") {
      const { rows, cols } = get();
      get().initializeGrid(rows, cols);
    } else {
      get().graphClear();
      set({
        visitedNodes: [],
        pathNodes: [],
        logs: [],
        steps: [],
        stepIndex: -1,
        _allLogs: [],
        currentPseudoLine: 0,
        frontierSnapshot: [],
        isPlaying: false,
        currentStep: 0,
        totalSteps: 0,
        meta: {},
        pathCost: 0,
        pathLength: 0,
      });
    }
  },
  generateRandom: () => {
    if (get().mode !== "grid") return;
    const { rows, cols } = get();
    const grid = generateRandomMaze(rows, cols);
    set({
      grid,
      visitedNodes: [],
      pathNodes: [],
      logs: [],
      currentPseudoLine: 0,
      frontierSnapshot: [],
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
    if (get().mode !== "grid") return;
    const { rows, cols } = get();
    const grid = recursiveDivisionMaze(rows, cols);
    set({
      grid,
      visitedNodes: [],
      pathNodes: [],
      logs: [],
      currentPseudoLine: 0,
      frontierSnapshot: [],
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

// Apply saved theme once
try {
  const t = useVisualizerStore.getState().theme;
  applyThemeToDom(t);
} catch {}

export default useVisualizerStore;
