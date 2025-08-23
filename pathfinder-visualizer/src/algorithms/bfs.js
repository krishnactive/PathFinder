// Unweighted BFS (ignores weights). Returns metadata + frontierTimeline.
const key = (r, c) => `${r},${c}`;

export function bfs(grid) {
  const rows = grid.length, cols = grid[0].length;
  const start = [0, 0], end = [rows - 1, cols - 1];

  const inBounds = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;
  const passable = (r, c) => grid[r][c].type !== "wall";

  const q = [];
  const visitedOrder = [];
  const logs = [];
  const dist = {};
  const parent = {};
  const frontierTimeline = [];

  dist[key(start[0], start[1])] = 0;
  q.push(start);
  logs.push(`BFS — start at (${start[0]},${start[1]})`);

  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  let found = false;

  while (q.length) {
    const [r, c] = q.shift();
    visitedOrder.push([r, c]);
    logs.push(`Visit (${r},${c})`);

    if (r === end[0] && c === end[1]) { found = true; }
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (!inBounds(nr, nc) || !passable(nr, nc)) continue;
      const nk = key(nr, nc);
      if (dist[nk] !== undefined) continue;
      parent[nk] = key(r, c);
      dist[nk] = dist[key(r, c)] + 1;
      q.push([nr, nc]);
      logs.push(`Enqueue (${nr},${nc})`);
    }
    // snapshot queue (front to back)
    frontierTimeline.push(q.map(([rr, cc]) => ({ id: key(rr, cc), label: `(${rr},${cc})` })));
    if (found) break;
  }

  let shortestPath = [];
  if (found) {
    let cur = key(end[0], end[1]);
    while (cur && cur !== key(start[0], start[1])) {
      const [rr, cc] = cur.split(",").map(Number);
      shortestPath.push([rr, cc]);
      cur = parent[cur];
    }
    shortestPath.push(start);
    shortestPath.reverse();
    logs.push(`Reached the end; path length = ${shortestPath.length}`);
  } else {
    logs.push("No path");
  }

  return { visitedOrder, shortestPath, logs, meta: { dist, parent }, frontierTimeline };
}
