const BOARD_SIZE = 9;
const TILE_SIZE = 60;

let board;
let currentPlayer = 0;
let dragging = false;
let draggedPlayer = null;

let shiftPressed = false;
let ctrlPressed = false;

let canvas;

let gameStarted = false;

function startGame() {
  const player1Name = document.getElementById('player1-name').value || "Jucător 1";
  const player2Name = document.getElementById('player2-name').value || "Jucător 2";

  const color1 = document.getElementById('player1-color').value || 'blue';
  const color2 = document.getElementById('player2-color').value || 'red';

  document.getElementById('start-screen').style.display = 'none';
  const gameContainer = document.getElementById('game-container');
  gameContainer.style.display = 'block';

  canvas = createCanvas(BOARD_SIZE * TILE_SIZE + 200, BOARD_SIZE * TILE_SIZE);
  canvas.parent('game-container');

  board = new Board(player1Name, player2Name, color1, color2);  // PAS modificat
  currentPlayer = 1;
  gameStarted = true;
}

function setup() {
  // Nu cream canvas aici
}

function draw() {
  if (!gameStarted) return;

  background(255);
  fill('#dbeafe'); // albastru nude deschis pentru zona laterală
  noStroke();
  rect(BOARD_SIZE * TILE_SIZE, 0, 200, height);

  board.show();

  if (dragging && draggedPlayer) {
    fill(draggedPlayer.color);
    ellipse(mouseX, mouseY, TILE_SIZE * 0.6);
  }

  // Afișare jucători și ziduri în zona laterală cu culorile lor actualizate
  const player1 = board.players[0];
  const player2 = board.players[1];

  textAlign(LEFT, TOP);
  textSize(16);
  fill(player1.color);
  text(`${player1.name} - Ziduri: ${player1.walls}`, BOARD_SIZE * TILE_SIZE + 20, 20);

  textAlign(LEFT, BOTTOM);
  textSize(16);
  fill(player2.color);
  text(`${player2.name} - Ziduri: ${player2.walls}`, BOARD_SIZE * TILE_SIZE + 20, height - 20);

  let wallW = 20;
  let wallH = 10;
  let spacing = 6;
  let offsetX = BOARD_SIZE * TILE_SIZE + 20;

  for (let i = 0; i < player1.walls; i++) {
    let row = floor(i / 5);
    let col = i % 5;
    fill(player1.color);
    rect(offsetX + col * (wallW + spacing), 50 + row * (wallH + spacing), wallW, wallH, 3);
  }

  for (let i = 0; i < player2.walls; i++) {
    let row = floor(i / 5);
    let col = i % 5;
    fill(player2.color);
    rect(offsetX + col * (wallW + spacing), height - 70 + row * (wallH + spacing), wallW, wallH, 3);
  }
}

function mousePressed() {
  if (!gameStarted) return;

  const x = floor(mouseX / TILE_SIZE);
  const y = floor(mouseY / TILE_SIZE);
  const player = board.players[currentPlayer];

  if (!shiftPressed && player.x === x && player.y === y) {
    dragging = true;
    draggedPlayer = player;
  }
}

function mouseReleased() {
  if (!gameStarted) return;

  const x = floor(mouseX / TILE_SIZE);
  const y = floor(mouseY / TILE_SIZE);
  const player = board.players[currentPlayer];

  if (shiftPressed) {
    let vertical = ctrlPressed;

    if (player.walls > 0) {
      if (board.validWall(x, y, vertical)) {
        board.walls.push(new Wall(x, y, vertical));
        player.walls--;
        currentPlayer = 1 - currentPlayer;
      } else {
        console.log("Loc invalid pentru zid.");
      }
    } else {
      console.log("Nu mai ai ziduri.");
    }
  } else if (dragging && draggedPlayer) {
    if (draggedPlayer.isAdjacent(x, y, board)) {
      draggedPlayer.move(x, y, board);
      currentPlayer = 1 - currentPlayer;
    }
  }

  dragging = false;
  draggedPlayer = null;
}

function keyPressed() {
  if (keyCode === SHIFT) shiftPressed = true;
  if (keyCode === CONTROL) ctrlPressed = true;
}

function keyReleased() {
  if (keyCode === SHIFT) shiftPressed = false;
  if (keyCode === CONTROL) ctrlPressed = false;
}

class Player {
  constructor(x, y, color, name = '') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.name = name;
    this.walls = 10;
  }

  draw() {
    if (!(dragging && draggedPlayer === this)) {
      fill(this.color);
      ellipse(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 0.6);
    }
  }

  move(x, y, board) {
    if (this.isAdjacent(x, y, board)) {
      this.x = x;
      this.y = y;
    }
  }

  isAdjacent(x, y, board) {
    const opponent = board.players[1 - board.players.indexOf(this)];
    let dx = x - this.x;
    let dy = y - this.y;

    if (abs(dx) + abs(dy) === 1) {
      return !board.isBlocked(this.x, this.y, x, y);
    }

    if (opponent.x === this.x && abs(opponent.y - this.y) === 1 && dy === 2 * (opponent.y - this.y)) {
      return opponent.x === this.x &&
        opponent.y === this.y + dy / 2 &&
        !board.isBlocked(this.x, this.y, opponent.x, opponent.y) &&
        !board.isBlocked(opponent.x, opponent.y, x, y);
    }

    if (opponent.y === this.y && abs(opponent.x - this.x) === 1 && dx === 2 * (opponent.x - this.x)) {
      return opponent.y === this.y &&
        opponent.x === this.x + dx / 2 &&
        !board.isBlocked(this.x, this.y, opponent.x, opponent.y) &&
        !board.isBlocked(opponent.x, opponent.y, x, y);
    }

    if (abs(opponent.x - this.x) + abs(opponent.y - this.y) === 1) {
      if (abs(dx) === 1 && abs(dy) === 1) {
        if (this.x === opponent.x) {
          if (board.isBlocked(this.x, this.y, opponent.x, opponent.y)) {
            return !board.isBlocked(opponent.x, opponent.y, x, opponent.y + dy);
          }
        } else if (this.y === opponent.y) {
          if (board.isBlocked(this.x, this.y, opponent.x, opponent.y)) {
            return !board.isBlocked(opponent.x, opponent.y, opponent.x + dx, y);
          }
        }
      }
    }

    return false;
  }
}

class Wall {
  constructor(x, y, vertical) {
    this.x = x;
    this.y = y;
    this.vertical = vertical;
  }

  draw() {
    fill(100);
    noStroke();
    if (this.vertical) {
      rect(this.x * TILE_SIZE + TILE_SIZE - 5, this.y * TILE_SIZE, 10, TILE_SIZE * 2);
    } else {
      rect(this.x * TILE_SIZE, this.y * TILE_SIZE + TILE_SIZE - 5, TILE_SIZE * 2, 10);
    }
    stroke(0);
  }
}

class Board {
  constructor(player1Name, player2Name, color1 = 'blue', color2 = 'red') {
    this.players = [
      new Player(4, 0, color1, player1Name),
      new Player(4, 8, color2, player2Name)
    ];
    this.walls = [];
  }

  show() {
    stroke(0);
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        fill(240);
        rect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    for (const wall of this.walls) {
      wall.draw();
    }

    for (const player of this.players) {
      player.draw();
    }
  }

  validWall(x, y, vertical) {
    if (x < 0 || y < 0) return false;
    if (vertical) {
      if (x >= BOARD_SIZE - 1 || y >= BOARD_SIZE - 2) return false;
    } else {
      if (x >= BOARD_SIZE - 2 || y >= BOARD_SIZE - 1) return false;
    }

    for (const wall of this.walls) {
      if (wall.x === x && wall.y === y && wall.vertical === vertical) {
        return false;
      }
    }
    return true;
  }

  isBlocked(x1, y1, x2, y2) {
    for (const wall of this.walls) {
      if (wall.vertical) {
        if (x1 === wall.x && x2 === wall.x + 1 &&
          (y1 === wall.y || y1 === wall.y + 1) &&
          y1 === y2) return true;
        if (x2 === wall.x && x1 === wall.x + 1 &&
          (y2 === wall.y || y2 === wall.y + 1) &&
          y1 === y2) return true;
      } else {
        if (y1 === wall.y && y2 === wall.y + 1 &&
          (x1 === wall.x || x1 === wall.x + 1) &&
          x1 === x2) return true;
        if (y2 === wall.y && y1 === wall.y + 1 &&
          (x2 === wall.x || x2 === wall.x + 1) &&
          x1 === x2) return true;
      }
    }
    return false;
  }
}
