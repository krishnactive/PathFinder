import { useState, useEffect } from "react";
import useVisualizerStore from "../../store/visualizerStore";

export default function Cell({ row, col, type, weight, cellSize = 30 }) {
  const toggleCell = useVisualizerStore((s) => s.toggleCell);
  const cycleWeight = useVisualizerStore((s) => s.cycleWeight);
  const setWeightManually = useVisualizerStore((s) => s.setWeightManually);

  const visitedNodes = useVisualizerStore((s) => s.visitedNodes);
  const pathNodes = useVisualizerStore((s) => s.pathNodes);

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
    return "bg-gray-300";
  };

  const isEditable = type !== "start" && type !== "end" && type !== "wall";

  // Scale font so weights remain readable on small cells
  const fontSize = Math.max(10, Math.floor(cellSize * 0.35));
  const inputFont = Math.max(10, Math.floor(cellSize * 0.33));

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
      title={
        type === "wall"
          ? "Wall (blocked)"
          : "Left click: wall • Right click: cycle weight • Double click: edit weight"
      }
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
