import { useEffect, useRef, useState } from "react";
import ControlsPanel from "./ControlsPanel";
import Grid from "./GridVisualizer/Grid";
import TeachingLogs from "./TeachingLogs";
import PseudocodeTerminal from "./PseudocodeTerminal";
import useVisualizerStore from "../store/visualizerStore";

export default function Layout() {
  const [terminalHeight, setTerminalHeight] = useState(160);
  const [rightWidth, setRightWidth] = useState(320);
  const dragHRef = useRef(false);
  const dragVRef = useRef(false);

  const play = useVisualizerStore((s) => s.play);
  const pause = useVisualizerStore((s) => s.pause);
  const isPlaying = useVisualizerStore((s) => s.isPlaying);
  const stepForward = useVisualizerStore((s) => s.stepForward);
  const stepBackward = useVisualizerStore((s) => s.stepBackward);
  const reset = useVisualizerStore((s) => s.reset);
  const theme = useVisualizerStore((s) => s.theme);

  // Keyboard shortcuts: space=play/pause, arrows=step, R=reset
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (isTyping) return;

      if (e.code === "Space") {
        e.preventDefault();
        isPlaying ? pause() : play();
      } else if (e.key === "ArrowRight") {
        e.preventDefault(); stepForward();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault(); stepBackward();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault(); reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying, play, pause, stepForward, stepBackward, reset]);

  // Keep html.dark in sync (also handled in store init)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  useEffect(() => {
    const onMove = (e) => {
      if (dragHRef.current) {
        const vh = window.innerHeight;
        const newH = Math.max(80, Math.min(vh * 0.7, vh - e.clientY));
        setTerminalHeight(newH);
      }
      if (dragVRef.current) {
        const vw = window.innerWidth;
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
    <div className="flex flex-col h-full bg-gray-100 dark:bg-[#0f1115]">
      <ControlsPanel />

      <div className="flex-1 flex overflow-hidden">
        {/* Grid area */}
        <div className="flex-1 flex justify-center items-center overflow-auto">
          <Grid />
        </div>

        {/* Vertical resizer */}
        <div
          className="w-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 cursor-col-resize"
          onMouseDown={() => (dragVRef.current = true)}
          title="Drag to resize pseudocode panel"
        />

        {/* Pseudocode Terminal */}
        <div style={{ width: `${rightWidth}px` }} className="shrink-0">
          <PseudocodeTerminal />
        </div>
      </div>

      {/* Horizontal resizer */}
      <div
        className="h-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 cursor-row-resize"
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
