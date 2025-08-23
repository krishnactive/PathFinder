function heuristic(a, b) {
  // Manhattan works well on 4-neighbor grid
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

export function astar(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const start = [0, 0];
  const end = [rows - 1, cols - 1];

  const visitedOrder = [];
  const logs = ["A* — Weighted + Heuristic (Manhattan)."];

  const g = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const f = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  g[start[0]][start[1]] = 0;
  f[start[0]][start[1]] = heuristic(start, end);

  const open = [[f[start[0]][start[1]], start]];
  const parent = {};
  let reached = false;

  while (open.length > 0) {
    open.sort((a, b) => a[0] - b[0]);
    const [_, [r, c]] = open.shift();

    visitedOrder.push([r, c]);
    logs.push(`Visit (${r},${c}), f=${f[r][c]}, g=${g[r][c]}`);

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
        const tentativeG = g[r][c] + grid[nr][nc].weight;
        if (tentativeG < g[nr][nc]) {
          parent[[nr, nc]] = [r, c];
          g[nr][nc] = tentativeG;
          f[nr][nc] = tentativeG + heuristic([nr, nc], end);
          open.push([f[nr][nc], [nr, nc]]);
          logs.push(`Relax (${nr},${nc}) g=${tentativeG}, f=${f[nr][nc]} (w=${grid[nr][nc].weight})`);
        }
      }
    }
  }

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
