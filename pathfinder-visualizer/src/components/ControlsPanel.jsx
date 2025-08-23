import { useState, useEffect } from "react";
import useVisualizerStore from "../store/visualizerStore";

export default function ControlsPanel() {
  // Grid & algo actions
  const runAlgorithm = useVisualizerStore((s) => s.runAlgorithm);
  const reset = useVisualizerStore((s) => s.reset);
  const setAlgorithm = useVisualizerStore((s) => s.setAlgorithm);
  const generateRandom = useVisualizerStore((s) => s.generateRandom);
  const generateRecursive = useVisualizerStore((s) => s.generateRecursive);
  const setSize = useVisualizerStore((s) => s.setSize);

  // Playback actions
  const play = useVisualizerStore((s) => s.play);
  const pause = useVisualizerStore((s) => s.pause);
  const stepForward = useVisualizerStore((s) => s.stepForward);
  const stepBackward = useVisualizerStore((s) => s.stepBackward);
  const toStart = useVisualizerStore((s) => s.toStart);
  const toEnd = useVisualizerStore((s) => s.toEnd);
  const seekTo = useVisualizerStore((s) => s.seekTo);

  // Settings
  const setAnimationSpeed = useVisualizerStore((s) => s.setAnimationSpeed);
  const setZoomMode = useVisualizerStore((s) => s.setZoomMode);
  const setZoomFactor = useVisualizerStore((s) => s.setZoomFactor);
  const setFastSolve = useVisualizerStore((s) => s.setFastSolve);
  const setTheme = useVisualizerStore((s) => s.setTheme);

  // State
  const algorithm = useVisualizerStore((s) => s.algorithm);
  const rows = useVisualizerStore((s) => s.rows);
  const cols = useVisualizerStore((s) => s.cols);
  const speed = useVisualizerStore((s) => s.animationSpeed);
  const isPlaying = useVisualizerStore((s) => s.isPlaying);
  const zoomMode = useVisualizerStore((s) => s.zoomMode);
  const zoomFactor = useVisualizerStore((s) => s.zoomFactor);
  const fastSolve = useVisualizerStore((s) => s.fastSolve);
  const currentStep = useVisualizerStore((s) => s.currentStep);
  const totalSteps = useVisualizerStore((s) => s.totalSteps);
  const stepIndex = useVisualizerStore((s) => s.stepIndex);
  const theme = useVisualizerStore((s) => s.theme);
  const pathCost = useVisualizerStore((s) => s.pathCost);
  const pathLength = useVisualizerStore((s) => s.pathLength);

  const [r, setR] = useState(rows);
  const [c, setC] = useState(cols);
  useEffect(() => { setR(rows); setC(cols); }, [rows, cols]);

  const isWeighted = algorithm === "dijkstra" || algorithm === "astar";

  const progressSliderValue = Math.max(0, Math.min(totalSteps, stepIndex + 1));
  const onProgressChange = (val) => seekTo(Number(val) - 1);

  return (
    <div className="p-3 bg-green-700 dark:bg-green-800 text-white flex items-center gap-3 flex-wrap">
      <h1 className="font-bold text-xl pr-2">PathFinder</h1>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="px-2 py-1 rounded bg-gray-200 text-black dark:bg-gray-700 dark:text-gray-100"
        title="Toggle theme"
      >
        {theme === "dark" ? "🌙 Dark" : "☀ Light"}
      </button>

      {/* Grid size */}
      <label className="text-sm opacity-90">Rows</label>
      <input
        type="number" min={3} max={60}
        value={r} onChange={(e) => setR(e.target.value)}
        className="w-16 text-black px-2 py-1 rounded"
      />
      <label className="text-sm opacity-90">Cols</label>
      <input
        type="number" min={3} max={60}
        value={c} onChange={(e) => setC(e.target.value)}
        className="w-16 text-black px-2 py-1 rounded"
      />
      <button
        onClick={() => setSize(r, c)}
        className="bg-slate-200 text-black px-3 py-1 rounded"
      >
        Apply Size
      </button>

      {/* Algorithm select */}
      <select
        value={algorithm}
        onChange={(e) => setAlgorithm(e.target.value)}
        className="text-black px-2 py-1 rounded"
      >
        <option value="bfs">BFS</option>
        <option value="dfs">DFS</option>
        <option value="dijkstra">Dijkstra (weighted)</option>
        <option value="astar">A* (weighted)</option>
      </select>

      <span
        className={`px-2 py-1 rounded text-xs font-bold ${
          isWeighted ? "bg-amber-400 text-black" : "bg-sky-300 text-black"
        }`}
        title={isWeighted ? "Uses weights" : "Ignores weights"}
      >
        {isWeighted ? "Weighted" : "Unweighted"}
      </span>

      {/* Speed */}
      <div className="flex items-center gap-2 ml-2">
        <span className="text-xs opacity-90">Speed</span>
        <input
          type="range" min={1} max={100} value={speed}
          onChange={(e) => setAnimationSpeed(e.target.value)}
          className="w-32"
          title="Animation speed (higher = faster)"
        />
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-2 ml-2">
        <span className="text-xs opacity-90">Zoom</span>
        <select
          value={zoomMode}
          onChange={(e) => setZoomMode(e.target.value)}
          className="text-black px-2 py-1 rounded"
          title="Fit keeps the whole grid visible; Fixed uses a zoom factor"
        >
          <option value="fit">Fit</option>
          <option value="fixed">Fixed</option>
        </select>
        <input
          type="range" min={0.5} max={3} step={0.25}
          value={zoomFactor}
          onChange={(e) => setZoomFactor(e.target.value)}
          disabled={zoomMode !== "fixed"}
          className="w-32"
          title="Zoom factor (only in Fixed mode)"
        />
        <span className="text-xs">{Number(zoomFactor).toFixed(2)}×</span>
      </div>

      {/* Fast Solve */}
      <label className="flex items-center gap-1 ml-2 text-xs">
        <input
          type="checkbox"
          checked={useVisualizerStore.getState().fastSolve}
          onChange={(e) => setFastSolve(e.target.checked)}
        />
        Fast Solve
      </label>

      {/* Playback controls */}
      <div className="flex items-center gap-2 ml-2">
        <button onClick={toStart} className="bg-gray-200 text-black px-2 py-1 rounded" title="Go to start">⏮</button>
        {isPlaying ? (
          <button onClick={pause} className="bg-yellow-300 text-black px-2 py-1 rounded" title="Pause">⏸</button>
        ) : (
          <button onClick={play} className="bg-yellow-400 text-black px-2 py-1 rounded" title="Play">▶</button>
        )}
        <button onClick={stepBackward} className="bg-gray-200 text-black px-2 py-1 rounded" title="Step back">‹</button>
        <button onClick={stepForward} className="bg-gray-200 text-black px-2 py-1 rounded" title="Step forward">›</button>
        <button onClick={toEnd} className="bg-gray-200 text-black px-2 py-1 rounded" title="Go to end">⏭</button>
      </div>

      {/* Start (rebuild) */}
      <button
        onClick={runAlgorithm}
        className="bg-indigo-400 text-black px-3 py-1 rounded"
        title="Rebuild steps & autoplay (respects Fast Solve)"
      >
        Start (Rebuild)
      </button>

      {/* Progress bar */}
      <div className="flex items-center gap-2 ml-3 min-w-[220px]">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps)}
          value={progressSliderValue}
          onChange={(e) => onProgressChange(e.target.value)}
          disabled={totalSteps === 0}
          className="w-40"
          title="Scrub through steps"
        />
        <span className="text-xs tabular-nums">
          {useVisualizerStore.getState().currentStep}/{totalSteps}
        </span>
      </div>

      {/* Path stats */}
      <div className="ml-2 px-2 py-1 rounded bg-white/80 text-black dark:bg-gray-800 dark:text-gray-100 text-xs">
        Cost: <span className="font-semibold">{pathCost}</span> ·
        Length: <span className="font-semibold">{pathLength}</span>
      </div>

      {/* Generators & reset */}
      <button onClick={reset} className="bg-red-500 px-3 py-1 rounded" title="Reset grid">Reset</button>
      <button onClick={generateRandom} className="bg-blue-400 text-black px-3 py-1 rounded" title="Random weighted terrain + walls">Random Maze</button>
      <button onClick={generateRecursive} className="bg-purple-500 text-white px-3 py-1 rounded" title="Recursive division maze">Recursive Maze</button>

      <div className="text-xs opacity-90 ml-auto">
        <span className="mr-2">💡 Left-click: wall</span>
        <span className="mr-2">Right-click: weight cycle</span>
        <span>Double-click: type weight</span>
      </div>
    </div>
  );
}
