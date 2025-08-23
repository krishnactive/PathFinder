export function dfs(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const start = [0, 0];
  const end = [rows - 1, cols - 1];

  const visitedOrder = [];
  const logs = ["DFS — Unweighted search: ignoring weights (cost treated as 1)."];
  const stack = [[...start, []]];
  const visited = new Set([start.toString()]);

  while (stack.length > 0) {
    const [r, c, path] = stack.pop();
    const newPath = [...path, [r, c]];
    visitedOrder.push([r, c]);
    logs.push(`Visit (${r},${c})`);

    if (r === end[0] && c === end[1]) {
      logs.push("Reached the end node!");
      return { visitedOrder, shortestPath: newPath, logs };
    }

    for (let [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const nr = r + dr, nc = c + dc;
      if (
        nr >= 0 && nr < rows &&
        nc >= 0 && nc < cols &&
        grid[nr][nc].type !== "wall" &&
        !visited.has([nr, nc].toString())
      ) {
        stack.push([nr, nc, newPath]);
        visited.add([nr, nc].toString());
        logs.push(`Push (${nr},${nc})`);
      }
    }
  }

  logs.push("No path found.");
  return { visitedOrder, shortestPath: [], logs };
}
