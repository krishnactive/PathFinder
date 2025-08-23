import { useEffect, useRef } from "react";
import useVisualizerStore from "../store/visualizerStore";

export default function TeachingLogs() {
  const logs = useVisualizerStore((s) => s.logs);
  const boxRef = useRef(null);

  useEffect(() => {
    // auto-scroll to bottom when new logs arrive
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div
      ref={boxRef}
      className="w-full h-full overflow-auto bg-[#1e1e1e] text-[#d4d4d4] p-2 font-mono text-sm border-t border-gray-700"
    >
      {logs.length === 0 ? (
        <p className="text-gray-500">[Logs will appear here...]</p>
      ) : (
        logs.map((line, idx) => (
          <div key={idx}>
            <span className="text-green-400">▶</span>{" "}
            <span>{line}</span>
          </div>
        ))
      )}
    </div>
  );
}
