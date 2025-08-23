export function dijkstra(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const start = [0, 0];
  const end = [rows - 1, cols - 1];

  const visitedOrder = [];
  const logs = ["Dijkstra — Weighted: uses cell costs for shortest path."];

  const dist = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  dist[start[0]][start[1]] = 0;

  const pq = [[0, start]];
  const parent = {};
  let reached = false;

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]); // naive PQ; OK for teaching
    const [d, [r, c]] = pq.shift();

    if (d > dist[r][c]) continue;
    visitedOrder.push([r, c]);
    logs.push(`Visit (${r},${c}), dist = ${d}`);

    if (r === end[0] && c === end[1]) {
      reached = true;
      break;
    }

    for (let [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const nr = r + dr, nc = c + dc;
      if (
        nr >= 0 && nr < rows &&
        nc >= 0 && nc < cols &&
        grid[nr][nc].type !== "wall"
      ) {
        const w = grid[nr][nc].weight;
        const nd = d + w;
        if (nd < dist[nr][nc]) {
          dist[nr][nc] = nd;
          parent[[nr, nc]] = [r, c];
          pq.push([nd, [nr, nc]]);
          logs.push(`Relax (${r},${c}) → (${nr},${nc}) with w=${w}, new dist=${nd}`);
        }
      }
    }
  }

  // Reconstruct path only if end reached
  const shortestPath = [];
  if (reached) {
    let cur = end;
    while (cur && parent[cur]) {
      shortestPath.unshift(cur);
      cur = parent[cur];
    }
    shortestPath.unshift(start);
  } else {
    logs.push("No path found.");
  }

  return { visitedOrder, shortestPath, logs };
}
