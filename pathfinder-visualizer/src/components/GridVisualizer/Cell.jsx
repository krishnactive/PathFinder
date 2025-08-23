import { useState, useEffect, useMemo } from "react";
import useVisualizerStore from "../../store/visualizerStore";

const k = (r, c) => `${r},${c}`;

export default function Cell({ row, col, type, weight, cellSize = 30 }) {
  const toggleCell = useVisualizerStore((s) => s.toggleCell);
  const cycleWeight = useVisualizerStore((s) => s.cycleWeight);
  const setWeightManually = useVisualizerStore((s) => s.setWeightManually);

  const visitedNodes = useVisualizerStore((s) => s.visitedNodes);
  const pathNodes = useVisualizerStore((s) => s.pathNodes);
  const algorithm = useVisualizerStore((s) => s.algorithm);
  const meta = useVisualizerStore((s) => s.meta);

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(weight);
  useEffect(() => setValue(weight), [weight]);

  const isVisited = visitedNodes.some(([r, c]) => r === row && c === col);
  const isPath = pathNodes.some(([r, c]) => r === row && c === col);

  const getColor = () => {
    if (type === "start") return "bg-green-500 text-white";
    if (type === "end") return "bg-red-500 text-white";
    if (type === "wall") return "bg-black";
    if (isPath) return "bg-yellow-400";
    if (isVisited) return "bg-blue-400";
    if (weight > 1) return weight > 5 ? "bg-orange-600 text-white" : "bg-orange-300";
    return "bg-gray-300 dark:bg-gray-600";
  };

  const isEditable = type !== "start" && type !== "end" && type !== "wall";

  const fontSize = Math.max(10, Math.floor(cellSize * 0.35));
  const inputFont = Math.max(10, Math.floor(cellSize * 0.33));

  // Tooltip text: multi-line (native title)
  const title = useMemo(() => {
    const id = k(row, col);
    const lines = [];
    lines.push(`(${row},${col})  ${type}`);
    if (type !== "wall") {
      lines.push(`weight: ${weight}`);
    }
    lines.push(`visited: ${isVisited ? "yes" : "no"}`);
    lines.push(`path: ${isPath ? "yes" : "no"}`);

    if (algorithm === "astar" && meta) {
      const g = meta.g?.[id];
      const h = meta.h?.[id];
      const f = meta.f?.[id];
      if (g !== undefined) lines.push(`g: ${g}`);
      if (h !== undefined) lines.push(`h: ${h}`);
      if (f !== undefined) lines.push(`f: ${f}`);
      const p = meta.parent?.[id];
      if (p) lines.push(`parent: ${p}`);
    } else if (algorithm === "dijkstra" && meta) {
      const d = meta.dist?.[id];
      if (d !== undefined) lines.push(`dist: ${d}`);
      const p = meta.parent?.[id];
      if (p) lines.push(`parent: ${p}`);
    } else if ((algorithm === "bfs" || algorithm === "dfs") && meta) {
      const d = meta.dist?.[id];
      if (d !== undefined) lines.push(`dist: ${d}`);
      const p = meta.parent?.[id];
      if (p) lines.push(`parent: ${p}`);
      lines.push("(weights ignored)");
    }

    return lines.join("\n");
  }, [row, col, type, weight, isVisited, isPath, algorithm, meta]);

  return (
    <div
      onClick={(e) => {
        if (e.detail > 1) return; // ignore first click of a double-click
        toggleCell(row, col);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        cycleWeight(row, col);
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isEditable) setEditing(true);
      }}
      className={`border border-gray-400 ${getColor()} cursor-pointer flex items-center justify-center font-semibold select-none`}
      style={{
        width: `${cellSize}px`,
        height: `${cellSize}px`,
        fontSize: `${fontSize}px`,
        lineHeight: 1,
      }}
      title={title}
    >
      {editing ? (
        <input
          type="number"
          value={value}
          min={1}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            setEditing(false);
            setWeightManually(row, col, value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setEditing(false);
              setWeightManually(row, col, value);
            } else if (e.key === "Escape") {
              setEditing(false);
            }
          }}
          className="w-full h-full text-center text-black outline-none"
          style={{ fontSize: `${inputFont}px` }}
          autoFocus
        />
      ) : (
        type !== "start" && type !== "end" && type !== "wall" ? weight : ""
      )}
    </div>
  );
}
