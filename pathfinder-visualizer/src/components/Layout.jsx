import { useState, useRef, useEffect } from "react";
import ControlsPanel from "./ControlsPanel";
import Grid from "./GridVisualizer/Grid";
import TeachingLogs from "./TeachingLogs";
import PseudocodeTerminal from "./PseudocodeTerminal";

export default function Layout() {
  const [terminalHeight, setTerminalHeight] = useState(160); // bottom terminal height
  const [rightWidth, setRightWidth] = useState(320);         // right pseudo-terminal width
  const dragHRef = useRef(false);
  const dragVRef = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      if (dragHRef.current) {
        const vh = window.innerHeight;
        const newH = Math.max(80, Math.min(vh * 0.7, vh - e.clientY));
        setTerminalHeight(newH);
      }
      if (dragVRef.current) {
        const vw = window.innerWidth;
        // clamp between 240px and 60% of viewport width
        const newW = Math.max(240, Math.min(vw * 0.6, vw - e.clientX));
        setRightWidth(newW);
      }
    };
    const stop = () => { dragHRef.current = false; dragVRef.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("mouseleave", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("mouseleave", stop);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <ControlsPanel />

      {/* Middle row: grid + vertical resizable pseudocode terminal */}
      <div className="flex-1 flex bg-gray-100 overflow-hidden">
        {/* Grid area */}
        <div className="flex-1 flex justify-center items-center overflow-auto">
          <Grid />
        </div>

        {/* Vertical drag handle */}
        <div
          className="w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize"
          onMouseDown={() => (dragVRef.current = true)}
          title="Drag to resize pseudocode panel"
        />

        {/* Pseudocode terminal (right) */}
        <div style={{ width: `${rightWidth}px` }} className="shrink-0">
          <PseudocodeTerminal />
        </div>
      </div>

      {/* Horizontal drag handle for bottom logs */}
      <div
        className="h-2 bg-gray-300 hover:bg-gray-400 cursor-row-resize"
        onMouseDown={() => (dragHRef.current = true)}
        title="Drag to resize logs"
      />

      {/* Logs terminal */}
      <div style={{ height: `${terminalHeight}px` }} className="shrink-0">
        <TeachingLogs />
      </div>
    </div>
  );
}
