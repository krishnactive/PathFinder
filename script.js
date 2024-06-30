let maze = [];
let start = null;
let end = null;
let placingObstacles = true;
let solving = true;
let intervalId;
// maze creating
function makemaze(rows, cols) {
    if(rows==0||cols==0){
        document.getElementById('message').innerText = 'Invalid inputs';
    }
    const mazeContainer = document.getElementById('maze-container');
    mazeContainer.innerHTML = '';
    mazeContainer.style.gridTemplateColumns = `repeat(${cols}, 40px)`;

    maze = Array.from({ length: rows }, () => Array(cols).fill(0));

    for(let i = 0; i < rows; i++){
        for(let j = 0; j < cols; j++){
            const div = document.createElement('div');
            div.className = 'cell path';
            div.id = `cell-${i}-${j}`;
            div.onclick = () => {
                Wall(i, j);
            };
            // Wall(i, j);
            mazeContainer.appendChild(div);
        }
    }

    // Set start and end points
    start = [0, 0];
    end = [rows - 1, cols - 1];
    document.getElementById(`cell-0-0`).classList.add('start');
    document.getElementById(`cell-${rows - 1}-${cols - 1}`).classList.add('end');
    document.getElementById('message').innerText = '';
}
//clear obs
// function clearPreviousSolution(){
//     document.querySelectorAll('.solution').forEach(cell =>{
//         cell.classList.remove('solution');
//     });
//     document.getElementById('message').innerText = '';
// }

//obstacles
function Wall(row, col) {
    const cell = document.getElementById(`cell-${row}-${col}`);
    if (cell.classList.contains('start') || cell.classList.contains('end')) {
        return;
    }
    if (cell.classList.contains('wall')) {
        cell.classList.remove('wall');
        cell.classList.add('path');
        maze[row][col] = 0;
    } else {
        cell.classList.remove('path');
        cell.classList.add('wall');
        maze[row][col] = 1;
    }
    if (solving)solveMaze();
}

// function enableObstaclePlacement() {
//     placingObstacles = true;
// }

function generateMaze(){
    const rows = parseInt(document.getElementById('rows').value, 10);
    const cols = parseInt(document.getElementById('cols').value, 10);
    // placingObstacles =true;
    makemaze(rows, cols);
    if (solving) solveMaze();
}

function startSolving() {
    solving = true;
    if (!intervalId) {
        intervalId = setInterval(solveMaze, 100);
    }
}

function stopSolving() {
    solving = false;
    clearInterval(intervalId);
    intervalId = null;
    clearPreviousSolution();
}
// bfs
function solveMaze(){
    clearPreviousSolution();

    const queue = [[start, []]];
    const visited = new Set();
    visited.add(start.toString());

    while (queue.length >0){
        const [[row, col], path] = queue.shift();
        path.push([row, col]);

        if (row === end[0] && col === end[1]){
            if (solving){
                path.forEach(([r, c]) => {
                    if (!(r=== start[0] &&c=== start[1]) && !(r=== end[0] && c=== end[1])) {
                        document.getElementById(`cell-${r}-${c}`).classList.add('solution');
                    }
                });
            }
            document.getElementById('message').innerText = '';
            return;
        }
        for(const [dr,dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
            const newRow = row + dr;
            const newCol = col + dc;
            if(newRow >= 0 &&newRow < maze.length &&newCol >= 0&&newCol < maze[0].length &&maze[newRow][newCol] === 0 &&!visited.has([newRow, newCol].toString())) {
                queue.push([[newRow, newCol], path.slice()]);
                visited.add([newRow, newCol].toString());
            }
        }
    }

    document.getElementById('message').innerText = 'No path exists';
}

function generateRandomObstacles() {
    const rows = maze.length;
    const cols = maze[0].length;

    //clear existing walls
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (maze[i][j] === 1) {
                maze[i][j] = 0;
                document.getElementById(`cell-${i}-${j}`).classList.remove('wall');
                document.getElementById(`cell-${i}-${j}`).classList.add('path');
            }
        }
    }

    //generate random obstacles
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (Math.random() < 0.3) { //probability as needed
                maze[i][j] = 1;
                document.getElementById(`cell-${i}-${j}`).classList.remove('path');
                document.getElementById(`cell-${i}-${j}`).classList.add('wall');
            }
        }
    }
    if(solving){
        solveMaze();
    }
}
function clearPreviousSolution() {
    document.querySelectorAll('.solution').forEach(cell => {
        cell.classList.remove('solution');
    });
    document.getElementById('message').innerText = '';
}
document.addEventListener('DOMContentLoaded', () => {
    makemaze(8, 8);
    solveMaze();
});
