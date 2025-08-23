// Graph A* with Euclidean heuristic. ctx: {nodes, edges, startId, endId}
export function astar(ctx) {
  const { nodes, edges, startId, endId } = ctx;
  const pos = Object.fromEntries(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
  const adj = buildAdj(edges);

  const g = {}, h = {}, f = {}, parent = {};
  const open = [];
  const logs = [`A* — start at ${startId}`];
  const visitedOrder = [];
  const frontierTimeline = [];

  g[startId] = 0;
  h[startId] = heur(pos[startId], pos[endId]);
  f[startId] = g[startId] + h[startId];
  open.push({ id: startId, f: f[startId], g: g[startId], h: h[startId] });

  while (open.length) {
    const u = popMinF(open);
    if (f[u.id] !== u.f) continue;
    visitedOrder.push(u.id);
    logs.push(`Visit ${u.id}`);
    if (u.id === endId) { frontierTimeline.push([]); break; }

    for (const { to, w } of adj.get(u.id) || []) {
      const tentative = (g[u.id] ?? Infinity) + (w ?? 1);
      if (tentative < (g[to] ?? Infinity)) {
        parent[to] = u.id;
        g[to] = tentative;
        h[to] = heur(pos[to], pos[endId]);
        f[to] = g[to] + h[to];
        open.push({ id: to, f: f[to], g: g[to], h: h[to] });
        logs.push(`Relax ${to} g=${g[to]} h=${h[to]} f=${f[to]}`);
      }
    }
    // snapshot OPEN sorted by f
    const snap = [...open]
      .sort((a, b) => a.f - b.f)
      .map((p) => ({ id: p.id, label: p.id, f: p.f, g: p.g, h: p.h }));
    frontierTimeline.push(snap);
  }

  const shortestPath = reconstruct(parent, startId, endId);
  if (!shortestPath.length) logs.push("No path");

  return { visitedOrder, shortestPath, logs, meta: { g, h, f, parent }, frontierTimeline };
}

function heur(a, b) {
  if (!a || !b) return 0;
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy);
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
function popMinF(arr) {
  let k = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i].f < arr[k].f) k = i;
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
