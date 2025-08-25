import { useEffect, useRef, useState } from "react";
import useVisualizerStore from "../store/visualizerStore";

export default function ControlsPanel() {
  const {
    // common
    mode, setMode, theme, setTheme,
    algorithm, setAlgorithm, animationSpeed, setAnimationSpeed,
    zoomMode, setZoomMode, zoomFactor, setZoomFactor,
    fastSolve, setFastSolve,
    runAlgorithm, play, pause, stepForward, stepBackward, toStart, toEnd, seekTo,
    isPlaying, currentStep, totalSteps, stepIndex,
    pathCost, pathLength, reset,

    // grid
    rows, cols, setSize, generateRandom, generateRecursive,

    // graph
    graph, graphSetStart, graphSetEnd, graphExport, graphImport, setGraphSnap,
    selectedNodeId, selectedEdgeId, graphDeleteSelection,
  } = useVisualizerStore();

  const [r, setR] = useState(rows);
  const [c, setC] = useState(cols);
  useEffect(() => { setR(rows); setC(cols); }, [rows, cols]);

  const isWeighted = algorithm === "dijkstra" || algorithm === "astar";

  const progressSliderValue = Math.max(0, Math.min(totalSteps, stepIndex + 1));
  const onProgressChange = (val) => seekTo(Number(val) - 1);

  // Import file input
  const fileRef = useRef(null);
  const doImport = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { graphImport(reader.result); } catch {}
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  const doExport = () => {
    const data = graphExport();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "graph.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 bg-green-700 dark:bg-green-800 text-white flex items-center gap-3 flex-wrap">
      <h1 className="font-bold text-xl pr-2">PathFinder</h1>

      {/* Theme */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="px-2 py-1 rounded bg-gray-200 text-black dark:bg-gray-700 dark:text-gray-100"
        title="Toggle theme"
      >
        {theme === "dark" ? "🌙 Dark" : "☀ Light"}
      </button>

      {/* Mode */}
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="text-black px-2 py-1 rounded"
        title="Switch between Grid and Graph modes"
      >
        <option value="grid">Grid</option>
        <option value="graph">Graph</option>
      </select>

      {/* GRID CONTROLS */}
      {mode === "grid" && (
        <>
          <label className="text-sm opacity-90">Rows</label>
          <input type="number" min={3} max={60} value={r} onChange={(e) => setR(e.target.value)} className="w-16 text-black px-2 py-1 rounded" />
          <label className="text-sm opacity-90">Cols</label>
          <input type="number" min={3} max={60} value={c} onChange={(e) => setC(e.target.value)} className="w-16 text-black px-2 py-1 rounded" />
          <button onClick={() => setSize(r, c)} className="bg-slate-200 text-black px-3 py-1 rounded">Apply Size</button>
          <button onClick={generateRandom} className="bg-blue-400 text-black px-3 py-1 rounded" title="Random weighted terrain + walls">Random Maze</button>
          <button onClick={generateRecursive} className="bg-purple-500 text-white px-3 py-1 rounded" title="Recursive division maze">Recursive Maze</button>
        </>
      )}

      {/* GRAPH CONTROLS */}
      {mode === "graph" && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-sm opacity-90">Start</label>
            <select
              value={graph.startId || ""}
              onChange={(e) => graphSetStart(e.target.value || null)}
              className="text-black px-2 py-1 rounded"
            >
              <option value="">(unset)</option>
              {graph.nodes.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
            <label className="text-sm opacity-90">End</label>
            <select
              value={graph.endId || ""}
              onChange={(e) => graphSetEnd(e.target.value || null)}
              className="text-black px-2 py-1 rounded"
            >
              <option value="">(unset)</option>
              {graph.nodes.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={graph.snap} onChange={(e) => setGraphSnap(e.target.checked)} />
            Snap to grid
          </label>

          <button onClick={doExport} className="bg-slate-200 text-black px-3 py-1 rounded">Export</button>
          <button onClick={() => fileRef.current?.click()} className="bg-slate-200 text-black px-3 py-1 rounded">Import</button>
          <input type="file" ref={fileRef} className="hidden" accept="application/json" onChange={doImport} />
          <button
            onClick={() => graphDeleteSelection()}
            className="bg-red-500 px-3 py-1 rounded"
            disabled={!selectedNodeId && !selectedEdgeId}
            title="Delete selected node/edge"
          >
            Delete
          </button>

          <div className="relative group inline-block">
  {/* Info Icon */}
  <button className="p-1 rounded-full hover:bg-gray-200">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  </button>

  {/* Tooltip */}
  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 p-3 rounded-xl bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
    • Double-click background: add node <br />
    • Drag node: move <br />
    • Click weight to edit <br />
    • Click one node then <b>E/e</b> (keyboard) then other nodes: connect
  </div>
</div>

        </>
      )}

      {/* Common: Algorithm */}
      <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} className="text-black px-2 py-1 rounded">
        <option value="bfs">BFS</option>
        <option value="dfs">DFS</option>
        <option value="dijkstra">Dijkstra (weighted)</option>
        <option value="astar">A* (weighted)</option>
      </select>
      <span className={`px-2 py-1 rounded text-xs font-bold ${isWeighted ? "bg-amber-400 text-black" : "bg-sky-300 text-black"}`} title={isWeighted ? "Uses weights" : "Ignores weights"}>
        {isWeighted ? "Weighted" : "Unweighted"}
      </span>

      {/* Speed */}
      <div className="flex items-center gap-2 ml-2">
        <span className="text-xs opacity-90">Speed</span>
        <input type="range" min={1} max={100} value={animationSpeed} onChange={(e) => setAnimationSpeed(e.target.value)} className="w-32" />
      </div>

      {/* Zoom (grid only) */}
      {mode === "grid" && (
        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs opacity-90">Zoom</span>
          <select value={zoomMode} onChange={(e) => setZoomMode(e.target.value)} className="text-black px-2 py-1 rounded">
            <option value="fit">Fit</option>
            <option value="fixed">Fixed</option>
          </select>
          <input type="range" min={0.5} max={3} step={0.25} value={zoomFactor} onChange={(e) => setZoomFactor(e.target.value)} disabled={zoomMode !== "fixed"} className="w-32" />
          <span className="text-xs">{Number(zoomFactor).toFixed(2)}×</span>
        </div>
      )}

      {/* Fast Solve */}
      <label className="flex items-center gap-1 ml-2 text-xs">
        <input type="checkbox" checked={fastSolve} onChange={(e) => setFastSolve(e.target.checked)} />
        Fast Solve
      </label>

      {/* Playback */}
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

      <button onClick={runAlgorithm} className="bg-indigo-400 text-black px-3 py-1 rounded" title="Rebuild & autoplay">
        Start (Rebuild)
      </button>

      {/* Progress */}
      <div className="flex items-center gap-2 ml-3 min-w-[220px]">
        <input type="range" min={0} max={Math.max(0, totalSteps)} value={progressSliderValue} onChange={(e) => onProgressChange(e.target.value)} disabled={totalSteps === 0} className="w-40" />
        <span className="text-xs tabular-nums">{currentStep}/{totalSteps}</span>
      </div>

      {/* Stats */}
      <div className="ml-2 px-2 py-1 rounded bg-white/80 text-black dark:bg-gray-800 dark:text-gray-100 text-xs">
        Cost: <span className="font-semibold">{pathCost}</span> · Length: <span className="font-semibold">{pathLength}</span>
      </div>

      <button onClick={reset} className="bg-red-500 px-3 py-1 rounded" title="Reset">
        Reset
      </button>
    </div>
  );
}
