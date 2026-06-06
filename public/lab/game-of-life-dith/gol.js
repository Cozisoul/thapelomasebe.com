// gol.js
const GOL = {
  cols: 0,
  rows: 0,
  grid: [],
  next: []
};

function initGol(cols, rows) {
  GOL.cols = cols;
  GOL.rows = rows;
  GOL.grid = new Array(cols);
  GOL.next = new Array(cols);
  for (let x=0;x<cols;x++){
    GOL.grid[x] = new Array(rows).fill(0);
    GOL.next[x] = new Array(rows).fill(0);
  }
}

function seedGolFromDither(ditherImg, cols, rows, cellSize, fgColor, bgColor){
  if (GOL.cols !== cols || GOL.rows !== rows) {
    initGol(cols, rows);
  }

  if (ditherImg && ditherImg.binary) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        GOL.grid[x][y] = ditherImg.binary[x + y * cols];
      }
    }
    stepGol();
    drawGol(cellSize, fgColor, bgColor);
  }
}

function stepGol() {
  if (!GOL.grid || GOL.cols === 0) return;
  for (let x=0;x<GOL.cols;x++){
    for (let y=0;y<GOL.rows;y++){
      let neighbors = 0;
      for (let ox=-1; ox<=1; ox++){
        for (let oy=-1; oy<=1; oy++){
          if (ox === 0 && oy === 0) continue;
          const nx = x + ox, ny = y + oy;
          if (nx >= 0 && nx < GOL.cols && ny >= 0 && ny < GOL.rows) neighbors += GOL.grid[nx][ny];
        }
      }
      if (GOL.grid[x][y] === 1) {
        GOL.next[x][y] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
      } else {
        GOL.next[x][y] = (neighbors === 3) ? 1 : 0;
      }
    }
  }
  // swap
  const t = GOL.grid; GOL.grid = GOL.next; GOL.next = t;
}

function drawGol(cellSize, fgRgb, bgRgb) {
  background(bgRgb[0], bgRgb[1], bgRgb[2]);
  noStroke();
  fill(fgRgb[0], fgRgb[1], fgRgb[2]);
  for (let x=0;x<GOL.cols;x++){
    for (let y=0;y<GOL.rows;y++){
      if (GOL.grid[x][y] === 1) {
        rect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
}
