// A* with Manhattan heuristic. Edge cost = weight of target cell.
const key = (r, c) => `${r},${c}`;

function popMinF(arr) {
  let best = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i].f < arr[best].f) best = i;
  return arr.splice(best, 1)[0];
}

export function astar(grid) {
  const rows = grid.length, cols = grid[0].length;
  const start = [0, 0], end = [rows - 1, cols - 1];

  const inBounds = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;
  const passable = (r, c) => grid[r][c].type !== "wall";
  const manhattan = (r, c) => Math.abs(r - end[0]) + Math.abs(c - end[1]);

  const g = {}, h = {}, f = {}, parent = {};
  const visitedOrder = [];
  const logs = [];
  const open = [];
  const frontierTimeline = [];

  const sk = key(start[0], start[1]);
  g[sk] = 0;
  h[sk] = manhattan(start[0], start[1]);
  f[sk] = g[sk] + h[sk];
  open.push({ r: start[0], c: start[1], f: f[sk], g: g[sk], h: h[sk] });
  logs.push(`A* — start at (${start[0]},${start[1]})`);

  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];

  while (open.length) {
    const cur = popMinF(open);
    const k = key(cur.r, cur.c);
    if (f[k] !== cur.f) continue; // stale
    visitedOrder.push([cur.r, cur.c]);
    logs.push(`Visit (${cur.r},${cur.c})`);
    if (cur.r === end[0] && cur.c === end[1]) { 
      frontierTimeline.push([]); 
      break; 
    }

    for (const [dr, dc] of dirs) {
      const nr = cur.r + dr, nc = cur.c + dc;
      if (!inBounds(nr, nc) || !passable(nr, nc)) continue;
      const nk = key(nr, nc);
      const w = grid[nr][nc].weight ?? 1;
      const tentativeG = (g[k] ?? Infinity) + w;

      if (tentativeG < (g[nk] ?? Infinity)) {
        parent[nk] = k;
        g[nk] = tentativeG;
        h[nk] = manhattan(nr, nc);
        f[nk] = g[nk] + h[nk];
        open.push({ r: nr, c: nc, f: f[nk], g: g[nk], h: h[nk] });
        logs.push(`Relax (${nr},${nc}) g=${g[nk]} h=${h[nk]} f=${f[nk]}`);
      }
    }
    // snapshot OPEN sorted by f asc
    const snap = [...open]
      .sort((a, b) => a.f - b.f)
      .map((p) => ({ id: key(p.r, p.c), label: `(${p.r},${p.c})`, f: p.f, g: p.g, h: p.h }));
    frontierTimeline.push(snap);
  }

  let shortestPath = [];
  const ek = key(end[0], end[1]);
  if (g[ek] !== undefined) {
    let cur = ek;
    while (cur && cur !== sk) {
      const [rr, cc] = cur.split(",").map(Number);
      shortestPath.push([rr, cc]);
      cur = parent[cur];
    }
    shortestPath.push(start);
    shortestPath.reverse();
  } else {
    logs.push("No path");
  }

  return { visitedOrder, shortestPath, logs, meta: { g, h, f, parent }, frontierTimeline };
}
