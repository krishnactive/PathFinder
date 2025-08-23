export function bfs(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const start = [0, 0];
  const end = [rows - 1, cols - 1];

  const visitedOrder = [];
  const logs = ["BFS — Unweighted search: treating all traversable cells as cost = 1 (weights ignored)."];
  const queue = [[...start, []]];
  const visited = new Set([start.toString()]);

  while (queue.length > 0) {
    const [r, c, path] = queue.shift();
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
        queue.push([nr, nc, newPath]);
        visited.add([nr, nc].toString());
        logs.push(`Enqueue (${nr},${nc})`);
      }
    }
  }

  logs.push("No path found.");
  return { visitedOrder, shortestPath: [], logs };
}
