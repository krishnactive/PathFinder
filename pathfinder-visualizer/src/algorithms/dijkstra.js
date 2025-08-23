// Weighted Dijkstra. Edge cost = weight of target cell (start weight=0).
const key = (r, c) => `${r},${c}`;

function popMin(arr) {
  let best = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i].d < arr[best].d) best = i;
  return arr.splice(best, 1)[0];
}

export function dijkstra(grid) {
  const rows = grid.length, cols = grid[0].length;
  const start = [0, 0], end = [rows - 1, cols - 1];

  const inBounds = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;
  const passable = (r, c) => grid[r][c].type !== "wall";

  const dist = {};
  const parent = {};
  const visitedOrder = [];
  const logs = [];

  const pq = [];
  dist[key(start[0], start[1])] = 0;
  pq.push({ r: start[0], c: start[1], d: 0 });
  logs.push(`Dijkstra — start at (${start[0]},${start[1]})`);

  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];

  while (pq.length) {
    const { r, c, d } = popMin(pq);
    const k = key(r, c);
    if (d !== dist[k]) continue; // stale
    visitedOrder.push([r, c]);
    logs.push(`Visit (${r},${c})`);
    if (r === end[0] && c === end[1]) break;

    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (!inBounds(nr, nc) || !passable(nr, nc)) continue;
      const nk = key(nr, nc);
      const w = grid[nr][nc].weight ?? 1;
      const nd = d + w;
      if (dist[nk] === undefined || nd < dist[nk]) {
        dist[nk] = nd;
        parent[nk] = k;
        pq.push({ r: nr, c: nc, d: nd });
        logs.push(`Relax (${nr},${nc}) newDist=${nd}`);
      }
    }
  }

  let shortestPath = [];
  if (dist[key(end[0], end[1])] !== undefined) {
    let cur = key(end[0], end[1]);
    while (cur && cur !== key(start[0], start[1])) {
      const [rr, cc] = cur.split(",").map(Number);
      shortestPath.push([rr, cc]);
      cur = parent[cur];
    }
    shortestPath.push(start);
    shortestPath.reverse();
  } else {
    logs.push("No path");
  }

  return { visitedOrder, shortestPath, logs, meta: { dist, parent } };
}
