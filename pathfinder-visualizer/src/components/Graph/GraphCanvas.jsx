import { useEffect, useMemo, useRef, useState } from "react";
import useVisualizerStore from "../../store/visualizerStore";

export default function GraphCanvas() {
  const {
    graph, selectedNodeId, selectedEdgeId,
    graphAddNode, graphMoveNode, graphConnect, graphSetEdgeWeight,
    graphSelectNode, graphSelectEdge, graphSetStart, graphSetEnd,
  } = useVisualizerStore();

  const visited = useVisualizerStore((s) => s.visitedNodes);
  const path = useVisualizerStore((s) => s.pathNodes);
  const algorithm = useVisualizerStore((s) => s.algorithm);
  const meta = useVisualizerStore((s) => s.meta);

  // Pan/zoom state (local)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragRef = useRef({ mode: null, id: null, ox: 0, oy: 0, startPan: { x: 0, y: 0 } });
  const svgRef = useRef(null);

  // Edge creation (click first node, then second)
  const [edgeFrom, setEdgeFrom] = useState(null);

  // Derived: quick lookups
  const nodeMap = useMemo(() => {
    const m = new Map();
    for (const n of graph.nodes) m.set(n.id, n);
    return m;
  }, [graph.nodes]);

  const pathEdgeSet = useMemo(() => {
    const s = new Set();
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i];
      s.add(edgeKey(a, b));
    }
    return s;
  }, [path]);

  // Mouse helpers
  const toWorld = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / scale;
    const y = (clientY - rect.top - pan.y) / scale;
    return { x, y };
  };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.1 : 0.9;
    const { x: wx, y: wy } = toWorld(e.clientX, e.clientY);
    const newScale = Math.max(0.25, Math.min(3, scale * factor));

    // zoom towards cursor: adjust pan so point stays fixed
    const newPan = {
      x: e.clientX - (wx * newScale) - svgRef.current.getBoundingClientRect().left,
      y: e.clientY - (wy * newScale) - svgRef.current.getBoundingClientRect().top,
    };
    setScale(newScale);
    setPan(newPan);
  };

  const onBgMouseDown = (e) => {
    // Start panning if background drag
    dragRef.current = { mode: "pan", id: null, ox: e.clientX, oy: e.clientY, startPan: { ...pan } };
  };

  const onNodeMouseDown = (id, e) => {
    e.stopPropagation();
    graphSelectNode(id);
    dragRef.current = { mode: "node", id, ox: e.clientX, oy: e.clientY, startPan: { ...pan } };
  };

  const onMouseMove = (e) => {
    const d = dragRef.current;
    if (d.mode === "pan") {
      const dx = e.clientX - d.ox, dy = e.clientY - d.oy;
      setPan({ x: d.startPan.x + dx, y: d.startPan.y + dy });
    } else if (d.mode === "node" && d.id) {
      const { x, y } = toWorld(e.clientX, e.clientY);
      graphMoveNode(d.id, x, y);
    }
  };

  const onMouseUp = () => {
    dragRef.current = { mode: null, id: null, ox: 0, oy: 0, startPan: { x: 0, y: 0 } };
  };

  const onDoubleClick = (e) => {
    // Add node at position
    const { x, y } = toWorld(e.clientX, e.clientY);
    graphAddNode(x, y);
  };

  const onNodeClick = (id, e) => {
    e.stopPropagation();
    if (edgeFrom && edgeFrom !== id) {
      graphConnect(edgeFrom, id, 1);
      setEdgeFrom(null);
    } else {
      graphSelectNode(id);
    }
  };

  const onEdgeClick = (edge, e) => {
    e.stopPropagation();
    graphSelectEdge(edge.id);
  };

  const onEdgeLabelClick = (edge, e) => {
    e.stopPropagation();
    const ans = window.prompt("Edge weight:", edge.weight ?? 1);
    if (ans != null) {
      graphSetEdgeWeight(edge.id, ans);
    }
  };

  // Key: press 'E' to start edge creation from selected node; 'S' set start; 'T' set end; 'Delete' delete selection
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;

      if (e.key === "e" || e.key === "E") {
        if (selectedNodeId) setEdgeFrom(selectedNodeId);
      } else if (e.key === "Escape") {
        setEdgeFrom(null);
      } else if (e.key === "s" || e.key === "S") {
        if (selectedNodeId) graphSetStart(selectedNodeId);
      } else if (e.key === "t" || e.key === "T") {
        if (selectedNodeId) graphSetEnd(selectedNodeId);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        // handled in ControlsPanel? We can ignore here.
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedNodeId, graphSetStart, graphSetEnd]);

  const visitedSet = useMemo(() => new Set(visited), [visited]);

  return (
    <div className="w-full h-full bg-white dark:bg-[#0f1115]">
      <svg
        ref={svgRef}
        className="w-full h-full"
        onWheel={onWheel}
        onMouseDown={onBgMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onDoubleClick={onDoubleClick}
      >
        {/* Background grid */}
        <defs>
          <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ddd" strokeWidth="0.5" />
          </pattern>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#smallGrid)" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#bbb" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
          {/* Edges */}
          {graph.edges.map((e) => {
            const a = nodeMap.get(e.from);
            const b = nodeMap.get(e.to);
            if (!a || !b) return null;
            const isPath = pathEdgeSet.has(edgeKey(e.from, e.to));
            const isSelected = selectedEdgeId === e.id;
            return (
              <g key={e.id} onClick={(evt) => onEdgeClick(e, evt)} style={{ cursor: "pointer" }}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={isPath ? "#f59e0b" : isSelected ? "#22c55e" : "#64748b"}
                  strokeWidth={isPath ? 5 : 3}
                  opacity={0.9}
                />
                {/* weight label */}
                <EdgeLabel a={a} b={b} weight={e.weight ?? 1} onClick={(evt) => onEdgeLabelClick(e, evt)} />
              </g>
            );
          })}

          {/* Nodes */}
          {graph.nodes.map((n) => {
            const isSelected = selectedNodeId === n.id;
            const isVisited = visitedSet.has(n.id);
            const isOnPath = path.includes(n.id);
            const isStart = graph.startId === n.id;
            const isEnd = graph.endId === n.id;

            // Tooltip content
            const title = buildNodeTitle(n.id, isStart, isEnd, algorithm, meta, isVisited, isOnPath);

            return (
              <g key={n.id} transform={`translate(${n.x},${n.y})`} style={{ pointerEvents: "all" }}>
                <circle
                  r={18}
                  fill={isStart ? "#22c55e" : isEnd ? "#ef4444" : isOnPath ? "#f59e0b" : isVisited ? "#60a5fa" : "#94a3b8"}
                  stroke={isSelected ? "#22c55e" : "#1f2937"}
                  strokeWidth={isSelected ? 3 : 2}
                  onMouseDown={(e) => onNodeMouseDown(n.id, e)}
                  onClick={(e) => onNodeClick(n.id, e)}
                >
                  <title>{title}</title>
                </circle>
                <text
                  y={5}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#111827"
                  style={{ userSelect: "none", pointerEvents: "none", fontWeight: 700 }}
                >
                  {n.id}
                </text>
              </g>
            );
          })}

          {/* Edge creation hint */}
          {edgeFrom ? (
            <text x={10} y={-10} fontSize="12" fill="#22c55e">
              Connecting from {edgeFrom}... click another node.
            </text>
          ) : null}
        </g>
      </svg>
    </div>
  );
}

function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function EdgeLabel({ a, b, weight, onClick }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  return (
    <g onClick={onClick}>
      <rect x={mx - 12} y={my - 10} width={24} height={18} rx={4} ry={4} fill="#fff" stroke="#111827" />
      <text x={mx} y={my + 3} textAnchor="middle" fontSize="12" fill="#111827" style={{ userSelect: "none" }}>
        {weight ?? 1}
      </text>
    </g>
  );
}

function buildNodeTitle(id, isStart, isEnd, algo, meta, visited, onPath) {
  const lines = [];
  lines.push(`${id}${isStart ? " (start)" : ""}${isEnd ? " (end)" : ""}`);
  lines.push(`visited: ${visited ? "yes" : "no"}`);
  lines.push(`path: ${onPath ? "yes" : "no"}`);
  if (algo === "astar" && meta) {
    const g = meta.g?.[id], h = meta.h?.[id], f = meta.f?.[id], p = meta.parent?.[id];
    if (g !== undefined) lines.push(`g=${g.toFixed ? g.toFixed(2) : g}`);
    if (h !== undefined) lines.push(`h=${h.toFixed ? h.toFixed(2) : h}`);
    if (f !== undefined) lines.push(`f=${f.toFixed ? f.toFixed(2) : f}`);
    if (p) lines.push(`parent: ${p}`);
  } else if (algo === "dijkstra" && meta) {
    const d = meta.dist?.[id], p = meta.parent?.[id];
    if (d !== undefined) lines.push(`dist=${d}`);
    if (p) lines.push(`parent: ${p}`);
  } else if ((algo === "bfs" || algo === "dfs") && meta) {
    const d = meta.dist?.[id], p = meta.parent?.[id];
    if (d !== undefined) lines.push(`dist=${d}`);
    if (p) lines.push(`parent: ${p}`);
    lines.push("(weights ignored)");
  }
  return lines.join("\n");
}
