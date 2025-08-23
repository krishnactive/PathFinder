// All helpers return a full grid of objects: { type: "path"|"wall"|"start"|"end", weight: number }

const makeEmptyGrid = (rows, cols, defaultWeight = 1) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: "path", weight: defaultWeight }))
  );

const isStart = (r, c) => r === 0 && c === 0;
const isEnd = (rows, cols, r, c) => r === rows - 1 && c === cols - 1;

function openAtLeastOneNeighbor(grid, r, c) {
  const rows = grid.length, cols = grid[0].length;
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr>=0 && nr<rows && nc>=0 && nc<cols) {
      const cell = grid[nr][nc];
      if (cell.type === "wall") {
        grid[nr][nc] = { type: "path", weight: 1 };
        return;
      }
    }
  }
}

// Random weighted terrain + walls (safe for teaching)
export function generateRandomMaze(rows, cols, {
  wallProb = 0.28,
  w1 = 0.55, w5 = 0.27, w10 = 0.18, // weight distribution for non-walls
} = {}) {
  const grid = makeEmptyGrid(rows, cols, 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isStart(r, c) || isEnd(rows, cols, r, c)) continue;

      if (Math.random() < wallProb) {
        grid[r][c] = { type: "wall", weight: Infinity };
      } else {
        // assign cost 1/5/10 by probability
        const p = Math.random();
        if (p < w1) grid[r][c] = { type: "path", weight: 1 };
        else if (p < w1 + w5) grid[r][c] = { type: "path", weight: 5 };
        else grid[r][c] = { type: "path", weight: 10 };
      }
    }
  }

  // Set start / end
  grid[0][0] = { type: "start", weight: 0 };
  grid[rows - 1][cols - 1] = { type: "end", weight: 0 };

  // Keep at least one neighbor free around start/end to reduce “no path” frustration
  openAtLeastOneNeighbor(grid, 0, 0);
  openAtLeastOneNeighbor(grid, rows - 1, cols - 1);

  return grid;
}

// Recursive Division Maze (classic), then assign weights=1 to passages
export function recursiveDivisionMaze(rows, cols) {
  const grid = makeEmptyGrid(rows, cols, 1);

  // Start/end must exist from the beginning
  grid[0][0] = { type: "start", weight: 0 };
  grid[rows - 1][cols - 1] = { type: "end", weight: 0 };

  // Helper to safely place a wall cell (never over start/end)
  const placeWall = (r, c) => {
    if (isStart(r, c) || isEnd(rows, cols, r, c)) return;
    grid[r][c] = { type: "wall", weight: Infinity };
  };

  // Choose orientation
  const chooseOrientation = (w, h) => {
    if (w < h) return "H";
    if (h < w) return "V";
    return Math.random() < 0.5 ? "H" : "V";
  };

  // Divide recursively
  function divide(x, y, w, h, orientation) {
    if (w < 2 || h < 2) return;

    const horizontal = orientation === "H";

    // Position of the wall
    const wx = x + (horizontal ? 0 : Math.floor(Math.random() * (w - 2)) + 1); // avoid borders
    const wy = y + (horizontal ? Math.floor(Math.random() * (h - 2)) + 1 : 0);

    // Position of the passage/gap
    const px = wx + (horizontal ? Math.floor(Math.random() * w) : 0);
    const py = wy + (horizontal ? 0 : Math.floor(Math.random() * h));

    // Direction
    const dx = horizontal ? 1 : 0;
    const dy = horizontal ? 0 : 1;

    const length = horizontal ? w : h;

    // Draw the wall with one gap
    for (let i = 0; i < length; i++) {
      const cx = wx + dx * i;
      const cy = wy + dy * i;
      if (!(cx === px && cy === py)) placeWall(cy, cx);
    }

    // Recursively divide the subregions
    if (horizontal) {
      // top region
      divide(x, y, w, wy - y + 1, chooseOrientation(w, wy - y + 1));
      // bottom region
      divide(x, wy + 1, w, y + h - (wy + 1), chooseOrientation(w, y + h - (wy + 1)));
    } else {
      // left region
      divide(x, y, wx - x + 1, h, chooseOrientation(wx - x + 1, h));
      // right region
      divide(wx + 1, y, x + w - (wx + 1), h, chooseOrientation(x + w - (wx + 1), h));
    }
  }

  // Kick off
  divide(0, 0, cols, rows, chooseOrientation(cols, rows));

  // Ensure at least one neighbor free near start/end
  openAtLeastOneNeighbor(grid, 0, 0);
  openAtLeastOneNeighbor(grid, rows - 1, cols - 1);

  // All non-wall passages should be weight=1 (good for teaching baseline)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell.type !== "wall" && !isStart(r, c) && !isEnd(rows, cols, r, c)) {
        grid[r][c] = { type: "path", weight: 1 };
      }
    }
  }

  // Restore start/end explicitly
  grid[0][0] = { type: "start", weight: 0 };
  grid[rows - 1][cols - 1] = { type: "end", weight: 0 };

  return grid;
}
