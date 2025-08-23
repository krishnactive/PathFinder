// Graph Dijkstra (weighted edges). ctx: {edges, startId, endId}
export function dijkstra(ctx) {
  const { edges, startId, endId } = ctx;
  const adj = buildAdj(edges);

  const dist = {};
  const parent = {};
  const pq = [];
  const logs = [`Dijkstra — start at ${startId}`];
  const visitedOrder = [];
  const frontierTimeline = [];

  dist[startId] = 0;
  pq.push({ id: startId, d: 0 });

  while (pq.length) {
    const u = popMin(pq);
    if (u.d !== dist[u.id]) continue;
    visitedOrder.push(u.id);
    logs.push(`Visit ${u.id}`);
    if (u.id === endId) { frontierTimeline.push([]); break; }

    for (const { to, w } of adj.get(u.id) || []) {
      const nd = u.d + (w ?? 1);
      if (dist[to] === undefined || nd < dist[to]) {
        dist[to] = nd;
        parent[to] = u.id;
        pq.push({ id: to, d: nd });
        logs.push(`Relax ${to} newDist=${nd}`);
      }
    }
    // snapshot PQ sorted by dist
    const snap = [...pq].sort((a, b) => a.d - b.d).map((p) => ({ id: p.id, label: p.id, key: p.d }));
    frontierTimeline.push(snap);
  }

  const shortestPath = reconstruct(parent, startId, endId);
  if (!shortestPath.length) logs.push("No path");

  return { visitedOrder, shortestPath, logs, meta: { dist, parent }, frontierTimeline };
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
function popMin(arr) {
  let k = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i].d < arr[k].d) k = i;
  return arr.splice(k, 1)[0];
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
