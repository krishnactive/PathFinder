import { useEffect, useRef, useState } from "react";
import useVisualizerStore from "../../store/visualizerStore";
import Cell from "./Cell";

export default function Grid() {
  const { grid, rows, cols, initializeGrid, zoomMode, zoomFactor } = useVisualizerStore();

  const containerRef = useRef(null);
  const [cellSize, setCellSize] = useState(30);
  const GAP = 2;
  const PADDING = 8;

  useEffect(() => {
    if (!grid.length) initializeGrid(rows, cols);
  }, [rows, cols, grid.length, initializeGrid]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const computeFit = () => {
      const rect = el.getBoundingClientRect();
      const availW = Math.max(0, rect.width - PADDING);
      const availH = Math.max(0, rect.height - PADDING);
      const totalGapW = GAP * (cols - 1);
      const totalGapH = GAP * (rows - 1);
      const maxCellW = (availW - totalGapW) / cols;
      const maxCellH = (availH - totalGapH) / rows;
      return Math.max(12, Math.min(64, Math.floor(Math.min(maxCellW, maxCellH))));
    };

    const apply = () => {
      if (zoomMode === "fit") {
        setCellSize(computeFit());
      } else {
        const fixed = Math.round(Math.max(8, Math.min(96, 30 * zoomFactor)));
        setCellSize(fixed);
      }
    };

    apply();

    // In Fit mode, respond to container resizes (panels drag, window resize)
    const ro = new ResizeObserver(() => {
      if (zoomMode === "fit") apply();
    });
    ro.observe(el);

    window.addEventListener("resize", apply);

    return () => {
      try { ro.disconnect(); } catch {}
      window.removeEventListener("resize", apply);
    };
  }, [rows, cols, zoomMode, zoomFactor]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-auto">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gap: `${GAP}px`,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <Cell
              key={`${r}-${c}`}
              row={r}
              col={c}
              type={cell.type}
              weight={cell.weight}
              cellSize={cellSize}
            />
          ))
        )}
      </div>
    </div>
  );
}
