import { useEffect, useRef } from "react";
import useVisualizerStore from "../store/visualizerStore";

const CPP = {
  bfs: [
    "queue<Node> q; visited[start] = true; q.push(start);",
    "while (!q.empty()) {",
    "  Node u = q.front(); q.pop();  // visit u",
    "  if (u == end) { /* reconstruct path; break */ }",
    "  for (Node v : neighbors(u)) {",
    "    if (traversable(v) && !visited[v]) {",
    "      visited[v] = true; parent[v] = u; q.push(v);",
  ],
  dfs: [
    "stack<Node> st; visited[start] = true; st.push(start);",
    "while (!st.empty()) {",
    "  Node u = st.top(); st.pop();  // visit u",
    "  if (u == end) { /* reconstruct path; break */ }",
    "  for (Node v : neighbors(u)) {",
    "    if (traversable(v) && !visited[v]) {",
    "      visited[v] = true; parent[v] = u; st.push(v);",
  ],
  dijkstra: [
    "dist[][] = INF; dist[start] = 0; priority_queue<...> pq; pq.push({0, start});",
    "while (!pq.empty()) {",
    "  auto [d, u] = pq.top(); pq.pop(); if (d > dist[u]) continue;  // visit u",
    "  if (u == end) break;",
    "  for (Node v : neighbors(u)) {",
    "    if (traversable(v)) {",
    "      if (d + w(u,v) < dist[v]) { dist[v]=d+w(u,v); parent[v]=u; pq.push({dist[v],v}); }",
  ],
  astar: [
    "g[u]=INF; f[u]=INF; g[start]=0; f[start]=h(start,end); priority_queue<...> open; open.push({f[start], start});",
    "while (!open.empty()) {",
    "  Node u = extract_min_f(open);  // visit u",
    "  if (u == end) break;",
    "  for (Node v : neighbors(u)) {",
    "    double tentative = g[u] + w(u, v);",
    "    if (tentative < g[v]) { parent[v]=u; g[v]=tentative; f[v]=g[v]+h(v,end); push(open,{f[v],v}); }",
  ],
};

export default function PseudocodeTerminal() {
  const algo = useVisualizerStore((s) => s.algorithm);
  const line = useVisualizerStore((s) => s.currentPseudoLine);
  const boxRef = useRef(null);

  const code = CPP[algo] || [];

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const lnEl = el.querySelector(`[data-ln="${line}"]`);
    if (lnEl) lnEl.scrollIntoView({ block: "nearest" });
  }, [line]);

  return (
    <div className="h-full bg-[#f7f7f7] text-[#1f2328] dark:bg-[#1e1e1e] dark:text-[#d4d4d4] border-l border-gray-200 dark:border-[#2a2a2a] flex flex-col w-full">
      <div className="h-9 px-3 flex items-center justify-between border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <span className="inline-flex gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-[#ff5f56]" />
            <span className="inline-block w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="inline-block w-3 h-3 rounded-full bg-[#27c93f]" />
          </span>
          <span className="text-sm font-semibold text-[#005f9e] dark:text-[#9cdcfe]">
            Terminal — pseudocode.cpp ({algo.toUpperCase()})
          </span>
        </div>
        <span className="text-xs text-[#666] dark:text-[#888]">C++</span>
      </div>

      <div ref={boxRef} className="flex-1 overflow-auto px-3 py-2 font-mono text-sm">
        {code.map((ln, idx) => (
          <div
            key={idx}
            data-ln={idx}
            className={`whitespace-pre leading-6 px-2 rounded ${
              idx === line
                ? "bg-[#eaecef] dark:bg-[#37373d] border-l-4 border-[#ffd369]"
                : "hover:bg-[#eef1f4] dark:hover:bg-[#2a2a2e]"
            }`}
          >
            <span className="text-[#6a9955] select-none mr-2">{idx === line ? "▶" : "·"}</span>
            <span className="text-[#888] dark:text-[#555] mr-2">{idx.toString().padStart(2, "0")}</span>
            <span>{ln}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
