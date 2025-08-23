// Graph BFS (unweighted). ctx: {nodes, edges, startId, endId}
export function bfs(ctx) {
  const { edges, startId, endId } = ctx;
  const adj = buildAdj(edges);

  const q = [startId];
  const visited = new Set([startId]);
  const parent = {};
  const logs = [`BFS — start at ${startId}`];
  const visitedOrder = [];
  const frontierTimeline = [];

  while (q.length) {
    const u = q.shift();
    visitedOrder.push(u);
    logs.push(`Visit ${u}`);
    if (u === endId) {
      frontierTimeline.push([]);
      break;
    }

    for (const { to } of adj.get(u) || []) {
      if (!visited.has(to)) {
        visited.add(to);
        parent[to] = u;
        q.push(to);
        logs.push(`Enqueue ${to}`);
      }
    }
    // snapshot queue (front -> back)
    frontierTimeline.push(q.map((id) => ({ id, label: id })));
  }

  const shortestPath = reconstruct(parent, startId, endId);
  if (shortestPath.length) logs.push(`Reached the end; path length = ${shortestPath.length}`);
  else logs.push("No path");

  return { visitedOrder, shortestPath, logs, meta: { dist: buildDist(parent, startId), parent }, frontierTimeline };
}

function buildAdj(edges) {
  const m = new Map();
  for (const e of edges) {
    if (!m.has(e.from)) m.set(e.from, []);
    if (!m.has(e.to)) m.set(e.to, []);
    m.get(e.from).push({ to: e.to, w: e.weight ?? 1 });
    m.get(e.to).push({ to: e.from, w: e.weight ?? 1 });
  }
  return m;
}
function reconstruct(parent, s, t) {
  if (s === t && s != null) return [s];
  const path = [];
  let cur = t;
  while (cur && cur !== s) {
    path.push(cur);
    cur = parent[cur];
  }
  if (cur === s) { path.push(s); path.reverse(); return path; }
  return [];
}
function buildDist(parent, s) {
  const d = { [s]: 0 };
  const q = [s];
  while (q.length) {
    const u = q.shift();
    for (const [v, p] of Object.entries(parent)) {
      if (p === u && d[v] === undefined) {
        d[v] = d[u] + 1;
        q.push(v);
      }
    }
  }
  return d;
}
