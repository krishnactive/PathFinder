import useVisualizerStore from "../store/visualizerStore";

export default function FrontierPanel() {
  const algo = useVisualizerStore((s) => s.algorithm);
  const frontier = useVisualizerStore((s) => s.frontierSnapshot);
  const mode = useVisualizerStore((s) => s.mode);
  const visited = useVisualizerStore((s) => s.visitedNodes);
  const path = useVisualizerStore((s) => s.pathNodes);

  const currentVisitedId = (() => {
    if (!visited || !visited.length) return null;
    const last = visited[visited.length - 1];
    return mode === "grid" ? `${last[0]},${last[1]}` : String(last);
  })();

  const onPathSet = new Set(
    (path || []).map((p) => (mode === "grid" ? `${p[0]},${p[1]}` : String(p)))
  );

  const title = (() => {
    if (algo === "bfs") return "Queue (front → back)";
    if (algo === "dfs") return "Stack (top → bottom)";
    if (algo === "dijkstra") return "Priority Queue (min dist →)";
    if (algo === "astar") return "Open Set (min f=g+h →)";
    return "Frontier";
  })();

  return (
    <div className="h-full bg-[#f7f7f7] text-[#1f2328] dark:bg-[#1e1e1e] dark:text-[#d4d4d4] border-l border-gray-200 dark:border-[#2a2a2a] flex flex-col">
      <div className="h-9 px-3 flex items-center justify-between border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="text-sm font-semibold text-[#7c3aed] dark:text-[#c4b5fd]">Frontier — {title}</div>
        <div className="text-xs text-[#666] dark:text-[#888]">{frontier?.length || 0} items</div>
      </div>

      <div className="flex-1 overflow-auto px-3 py-2">
        {(!frontier || frontier.length === 0) ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">[empty]</div>
        ) : (
          <div className="flex flex-col gap-2">
            {frontier.map((it, idx) => {
              const id = String(it.id);
              const isCurrent = id === currentVisitedId;
              const isOnPath = onPathSet.has(id);
              const badge = algo === "dijkstra"
                ? `dist=${it.key ?? "?"}`
                : algo === "astar"
                  ? `f=${num(it.f)} g=${num(it.g)} h=${num(it.h)}`
                  : "";

              return (
                <div
                  key={`${id}-${idx}`}
                  className={`px-2 py-1 rounded border text-sm flex items-center justify-between
                    ${isCurrent ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-800" :
                      isOnPath ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800" :
                      "bg-white dark:bg-[#111317] border-gray-200 dark:border-[#2a2a2a]"}`}
                  title={id}
                >
                  <span className="font-mono">{it.label || id}</span>
                  {badge && <span className="text-xs opacity-80">{badge}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function num(v) {
  return typeof v === "number" ? (Math.round(v * 100) / 100) : v;
}
