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

  board = new Board(player1Name, player2Name, color1, color2);
  currentPlayer = 1;
  gameStarted = true;
}
function resetBoardSamePlayers() {
  const player1 = board.players[0];
  const player2 = board.players[1];

  board = new Board(player1.name, player2.name, player1.color, player2.color);
  currentPlayer = 1;
  gameStarted = true;
}


// Interacțiune pentru fereastra cu opțiuni
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("options-modal");
  const openBtn = document.getElementById("options-button");
  const closeBtn = document.querySelector(".close-button");

  openBtn.onclick = () => modal.style.display = "block";
  closeBtn.onclick = () => modal.style.display = "none";
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };

  document.getElementById("reset-button").onclick = () => {
    location.reload(); // Reset joc
  };

  document.getElementById("giveup-button").onclick = () => {
    alert(`${board.players[currentPlayer].name} s-a dat bătut!`);
    location.reload(); // Sau adaugă logică pentru final de joc
  };
});



function draw() {
  if (!gameStarted) return;

  background(255);
  fill('#dbeafe');
  noStroke();
  rect(BOARD_SIZE * TILE_SIZE, 0, 200, height);

  board.show();

  if (dragging && draggedPlayer) {
    fill(draggedPlayer.color);
    ellipse(mouseX, mouseY, TILE_SIZE * 0.6);
  }

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
    // verifică limitele mutării înainte să mute și să schimbe jucătorul
    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && draggedPlayer.isAdjacent(x, y, board)) {
      draggedPlayer.move(x, y, board);
  
      if ((currentPlayer === 0 && draggedPlayer.y === BOARD_SIZE - 1) ||
          (currentPlayer === 1 && draggedPlayer.y === 0)) {
        showWinnerModal(draggedPlayer.name);
      } else {
        currentPlayer = 1 - currentPlayer;
      }
    } else {
      // Mutare invalidă (în afara tablei sau neadiacentă), deci nu schimbăm jucătorul
      console.log("Mutare invalidă: în afara tablei sau neadiacentă.");
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
      // Umbra jucătorului - o elipsă neagră transparentă puțin offsetată
      push();
      noStroke();
      fill(0, 0, 0, 80);
      ellipse(
        this.x * TILE_SIZE + TILE_SIZE / 2 + 5,  // offset pe X cu 5 pixeli
        this.y * TILE_SIZE + TILE_SIZE / 2 + 6,  // offset pe Y cu 6 pixeli
        TILE_SIZE * 0.7,
        TILE_SIZE * 0.4
      );
      pop();
      fill(this.color);
      ellipse(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 0.6);
    }}
    move(x, y, board) {
      // Verifică dacă noua poziție este în limitele tablei
      if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
        return; // nu muta pionul în afara tablei
      }
    
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
    // Gradient simplu manual
    const startColor = color(120);
    const endColor = color(60);
    
    noStroke();
    if (this.vertical) {
      for (let i = 0; i < TILE_SIZE * 2; i++) {
        let inter = map(i, 0, TILE_SIZE * 2, 0, 1);
        let c = lerpColor(startColor, endColor, inter);
        stroke(c);
        line(this.x * TILE_SIZE + TILE_SIZE - 5, this.y * TILE_SIZE + i,
             this.x * TILE_SIZE + TILE_SIZE + 5, this.y * TILE_SIZE + i);
      }
    } else {
      for (let i = 0; i < TILE_SIZE * 2; i++) {
        let inter = map(i, 0, TILE_SIZE * 2, 0, 1);
        let c = lerpColor(startColor, endColor, inter);
        stroke(c);
        line(this.x * TILE_SIZE + i, this.y * TILE_SIZE + TILE_SIZE - 5,
             this.x * TILE_SIZE + i, this.y * TILE_SIZE + TILE_SIZE + 5);
      }
    }
  
    noStroke();
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
    // Umbra generală a tablei (cadru)
    push();
    noFill();
    stroke(80, 40, 10, 80); // maro închis, transparent
    strokeWeight(8);
    rect(0, 0, BOARD_SIZE * TILE_SIZE, BOARD_SIZE * TILE_SIZE, 12);
    pop();
  
    noStroke();
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        // Culori lemn
        let baseColor = color(181, 101, 29);
        let lightEdge = color(222, 184, 135);
        let shadowEdge = color(120, 60, 15);
  
        // Umbra discretă sub pătrat pentru 3D
        push();
        fill(0, 0, 0, 100); // negru transparent
        noStroke();
        ellipse(
          i * TILE_SIZE + TILE_SIZE / 2 + 4,
          j * TILE_SIZE + TILE_SIZE / 2 + 6,
          TILE_SIZE * 0.9,
          TILE_SIZE * 0.5
        );
        pop();
  
        // Corpul pătratului (lemn)
        fill(baseColor);
        rect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  
        // Linii textură lemn
        stroke(150, 75, 0, 80);
        for (let k = 5; k < TILE_SIZE; k += 10) {
          line(i * TILE_SIZE + k, j * TILE_SIZE + 5, i * TILE_SIZE + k + 5, j * TILE_SIZE + TILE_SIZE - 5);
        }
  
        // Highlight margini sus + stânga
        stroke(lightEdge);
        line(i * TILE_SIZE, j * TILE_SIZE, (i + 1) * TILE_SIZE, j * TILE_SIZE);
        line(i * TILE_SIZE, j * TILE_SIZE, i * TILE_SIZE, (j + 1) * TILE_SIZE);
  
        // Umbră margini jos + dreapta
        stroke(shadowEdge);
        line((i + 1) * TILE_SIZE, j * TILE_SIZE, (i + 1) * TILE_SIZE, (j + 1) * TILE_SIZE);
        line(i * TILE_SIZE, (j + 1) * TILE_SIZE, (i + 1) * TILE_SIZE, (j + 1) * TILE_SIZE);
      }
    }
  
    noStroke();
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
  
      if (vertical && wall.vertical) {
        if (wall.x === x && (wall.y === y - 1 || wall.y === y || wall.y === y + 1)) {
          return false;
        }
      } else if (!vertical && !wall.vertical) {
        if (wall.y === y && (wall.x === x - 1 || wall.x === x || wall.x === x + 1)) {
          return false;
        }
      } else {
        if (vertical && wall.x === x && wall.y === y && !wall.vertical) {
          return false;
        }
        if (!vertical && wall.x === x && wall.y === y && wall.vertical) {
          return false;
        }
      }
    }
  
    // Simulează adăugarea zidului și verifică dacă jucătorii încă au drum
    this.walls.push(new Wall(x, y, vertical));
    const pathExists = this.players.every(player => this.hasPath(player));
    this.walls.pop();
  
    return pathExists;
  }
  hasPath(player) {
    const visited = new Set();
    const queue = [[player.x, player.y]];
    const goalY = player === this.players[0] ? BOARD_SIZE - 1 : 0;
  
    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);
  
      if (y === goalY) return true;
  
      const dirs = [
        [0, -1], [0, 1], [1, 0], [-1, 0]
      ];
  
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          nx >= 0 && nx < BOARD_SIZE &&
          ny >= 0 && ny < BOARD_SIZE &&
          !this.isBlocked(x, y, nx, ny)
        ) {
          queue.push([nx, ny]);
        }
      }
    }
  
    return false;
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

// FUNCȚIE pentru afișare mesaj de câștig
function showWinnerModal(winnerName) {
  const modal = document.getElementById("win-modal");
  const message = document.getElementById("winner-message");
  message.textContent = `${winnerName} a câștigat! Felicitări! 🎉`;
  modal.style.display = "block";

  document.getElementById("rematch-button").onclick = () => {
    modal.style.display = "none";
    resetBoardSamePlayers(); // Resetează jocul dar păstrează jucătorii
  };

  document.getElementById("newgame-button").onclick = () => {
    modal.style.display = "none";
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
    gameStarted = false;
    removeCanvas();
  };
}
