import { useEffect, useRef } from "react";
import useVisualizerStore from "../store/visualizerStore";

// C++-style pseudocode lines. Indexes are chosen to ALIGN with the
// lineFromLog() mapping you already have in the store (0..6).
const CPP = {
  bfs: [
    "queue<Node> q; visited[start] = true; q.push(start);",
    "while (!q.empty()) {",
    "  Node u = q.front(); q.pop();  // visit u",
    "  if (u == end) { /* reconstruct path; break */ }",
    "  for (Node v : neighbors(u)) {",
    "    if (traversable(v) && !visited[v]) {",
    "      visited[v] = true; parent[v] = u; q.push(v);",
    // "    }",
    // "  }",
    // "}",
  ],
  dfs: [
    "stack<Node> st; visited[start] = true; st.push(start);",
    "while (!st.empty()) {",
    "  Node u = st.top(); st.pop();  // visit u",
    "  if (u == end) { /* reconstruct path; break */ }",
    "  for (Node v : neighbors(u)) {",
    "    if (traversable(v) && !visited[v]) {",
    "      visited[v] = true; parent[v] = u; st.push(v);",
    // "    }",
    // "  }",
    // "}",
  ],
  dijkstra: [
    "dist[][] = INF; dist[start] = 0;",
    "priority_queue<pair<int,Node>, vector<pair<int,Node>>, greater<pair<int,Node>>> pq;",
    "pq.push({0, start});",
    "// while loop handled as a single block for mapping:",
    "while (!pq.empty()) {",
    "  auto [d, u] = pq.top(); pq.pop();",
    "  if (d > dist[u]) continue;    // visit u",
    "  if (u == end) break;",
    "  for (Node v : neighbors(u)) {",
    "    if (traversable(v)) {",
    "      if (d + w(u, v) < dist[v]) {",
    "        dist[v] = d + w(u, v); parent[v] = u; pq.push({dist[v], v});",
    // "      }",
    // "    }",
    // "  }",
    // "}",
  ],
  // For line mapping consistency with 0..6, we compress to key steps:
  dijkstra_compact: [
    "dist[][] = INF; dist[start] = 0; priority_queue<...> pq; pq.push({0, start});", // 0
    "while (!pq.empty()) {",                                                          // 1
    "  auto [d, u] = pq.top(); pq.pop(); if (d > dist[u]) continue;  // visit u",     // 2
    "  if (u == end) break;",                                                         // 3
    "  for (Node v : neighbors(u)) {",                                                // 4
    "    if (traversable(v)) {",                                                      // 5
    "      if (d + w(u, v) < dist[v]) { dist[v]=d+w(u,v); parent[v]=u; pq.push({dist[v],v}); }", // 6
  ],
  astar: [
    "unordered_map<Node,double> g, f; for (auto& u : nodes) { g[u]=INF; f[u]=INF; }",
    "g[start] = 0; f[start] = h(start, end); priority_queue<pair<double,Node>, vector<pair<double,Node>>, greater<pair<double,Node>>> open;",
    "open.push({f[start], start});",
    "while (!open.empty()) {",
    "  Node u = open.top().second; open.pop();  // visit u",
    "  if (u == end) break;",
    "  for (Node v : neighbors(u)) {",
    "    double tentative = g[u] + w(u, v);",
    "    if (tentative < g[v]) {",
    "      parent[v] = u; g[v] = tentative; f[v] = g[v] + h(v, end); open.push({f[v], v});",
    // "    }",
    // "  }",
    // "}",
  ],
  // Compact version to match 0..6 mapping:
  astar_compact: [
    "g[u]=INF; f[u]=INF; g[start]=0; f[start]=h(start,end); priority_queue<...> open; open.push({f[start], start});", // 0
    "while (!open.empty()) {",                                                                                           // 1
    "  Node u = extract_min_f(open);  // visit u",                                                                        // 2
    "  if (u == end) break;",                                                                                             // 3
    "  for (Node v : neighbors(u)) {",                                                                                    // 4
    "    double tentative = g[u] + w(u, v);",                                                                             // 5
    "    if (tentative < g[v]) { parent[v]=u; g[v]=tentative; f[v]=g[v]+h(v,end); push(open,{f[v],v}); }",               // 6
  ],
};

// Choose compact versions for correct line mapping with store
const CODE = {
  bfs: CPP.bfs,
  dfs: CPP.dfs,
  dijkstra: CPP.dijkstra_compact,
  astar: CPP.astar_compact,
};

// Very lightweight “syntax highlighting”
function highlight(line) {
  const KW = [
    "while", "for", "if", "else", "continue", "break", "return",
    "queue", "stack", "priority_queue", "unordered_map", "pair", "auto",
    "true", "false",
  ];
  let html = line
    .replace(/(\/\/.*)$/g, '<span class="text-gray-400">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-indigo-600">$1</span>')
    .replace(/\b(Node|dist|g|f|parent|visited|neighbors|open|q|st|pq)\b/g, '<span class="text-emerald-700">$1</span>');
  for (const kw of KW) {
    const re = new RegExp(`\\b${kw}\\b`, "g");
    html = html.replace(re, `<span class="text-blue-700 font-semibold">${kw}</span>`);
  }
  return html;
}

export default function PseudocodePanel() {
  const algo = useVisualizerStore((s) => s.algorithm);
  const line = useVisualizerStore((s) => s.currentPseudoLine);
  const listRef = useRef(null);

  const code = CODE[algo] || [];

  // auto-scroll highlighted line into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const ln = listEl.querySelector(`[data-ln="${line}"]`);
    if (ln && ln.scrollIntoView) {
      ln.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [line]);

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full overflow-auto">
      <div className="px-3 py-2 border-b bg-gray-50 text-sm font-semibold">
        Pseudocode — <span className="font-mono">{algo.toUpperCase()}</span> <span className="text-gray-400">(C++)</span>
      </div>
      <ol ref={listRef} className="p-3 text-sm font-mono space-y-1">
        {code.map((ln, idx) => (
          <li
            key={idx}
            data-ln={idx}
            className={`px-2 py-1 rounded leading-5 ${
              idx === line ? "bg-yellow-200" : "hover:bg-gray-100"
            }`}
          >
            <span className="text-gray-400 mr-2">{idx.toString().padStart(2, "0")}</span>
            <span dangerouslySetInnerHTML={{ __html: highlight(ln) }} />
          </li>
        ))}
      </ol>
    </div>
  );
}
