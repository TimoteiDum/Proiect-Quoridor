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
let isAIMode = false;

function startGame() {
  const gameMode = document.querySelector('input[name="mode"]:checked').value;
  isAIMode = gameMode === 'ai';

  const player1Name = document.getElementById('player1-name').value || "Jucător 1";
  const player2Name = isAIMode ? "AI" : document.getElementById('player2-name').value || "Jucător 2";

  const color1 = document.getElementById('player1-color').value || 'blue';
  const color2 = document.getElementById('player2-color').value || 'red';

  document.getElementById('start-screen').style.display = 'none';
  const gameContainer = document.getElementById('game-container');
  gameContainer.style.display = 'block';

  canvas = createCanvas(BOARD_SIZE * TILE_SIZE + 200, BOARD_SIZE * TILE_SIZE);
  canvas.parent('game-container');

  board = new Board(player1Name, player2Name, color1, color2);
  currentPlayer = 1; // Start with Player 1
  gameStarted = true;

  if (isAIMode) {
    document.getElementById('player2-name').disabled = true;
  }
}
function resetBoardSamePlayers() {
  const player1 = board.players[0];
  const player2 = board.players[1];

  board = new Board(player1.name, player2.name, player1.color, player2.color);
  currentPlayer = 1;
  gameStarted = true;
}


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
    location.reload();
  };

  document.getElementById("giveup-button").onclick = () => {
    if (board && board.players) {
      alert(`${board.players[currentPlayer].name} s-a dat bătut!`);
    }
    location.reload();
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
  if (!gameStarted || (isAIMode && currentPlayer === 1)) return;

  const x = floor(mouseX / TILE_SIZE);
  const y = floor(mouseY / TILE_SIZE);
  const player = board.players[currentPlayer];

  if (!shiftPressed && player.x === x && player.y === y) {
    dragging = true;
    draggedPlayer = player;
  }
}

function resetGameState() {
  board = null;
  currentPlayer = 0;
  dragging = false;
  draggedPlayer = null;
  shiftPressed = false;
  ctrlPressed = false;
  canvas = null;
  gameStarted = false;
  isAIMode = false;
}


function mouseReleased() {
  if (!gameStarted || (isAIMode && currentPlayer === 1)) return;

  const x = floor(mouseX / TILE_SIZE);
  const y = floor(mouseY / TILE_SIZE);
  const player = board.players[currentPlayer];

  // Dacă SHIFT e apăsat, încerci să pui zid
  if (shiftPressed) {
    let vertical = ctrlPressed; // dacă CTRL e apăsat, zidul e vertical

    console.log(`Încerc să plasez zid la (${x},${y}), vertical: ${vertical}`);

    if (player.walls > 0) {
      if (board.validWall(x, y, vertical)) {
        if (board.canReachGoalsAfterWall(x, y, vertical)) {
          board.walls.push(new Wall(x, y, vertical));
          player.walls--;
          currentPlayer = 1 - currentPlayer;
          if (isAIMode && currentPlayer === 1) {
            setTimeout(aiMakeMove, 500);
          }
          console.log("Zid plasat cu succes.");
        } else {
          console.log("Plasarea zidului blocheaza toate caile!");
        }
      } else {
        console.log("Pozitie invalida pentru zid!");
      }
    } else {
      console.log("Nu mai ai ziduri disponibile.");
    }
  } else if (dragging && draggedPlayer) {
    if (draggedPlayer.isAdjacent(x, y, board)) {
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

  canReachGoalsAfterWall(x, y, vertical) {
    this.walls.push(new Wall(x, y, vertical));
    let canReach = this.hasPathToGoal(0, BOARD_SIZE - 1) && this.hasPathToGoal(1, 0);
    this.walls.pop();
    return canReach;
  }   

  hasPathToGoal(playerIndex, goalY) {
    const player = this.players[playerIndex];
    let visited = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(false));
    let queue = [{ x: player.x, y: player.y }];
    visited[player.y][player.x] = true;

    while (queue.length > 0) {
      let { x, y } = queue.shift();
      if (y === goalY) return true;

      let moves = [
        { x: x, y: y - 1 },
        { x: x, y: y + 1 },
        { x: x - 1, y: y },
        { x: x + 1, y: y }
      ];

      const opponent = this.players[1 - playerIndex];
      if (opponent.x === x && opponent.y === y - 1 && !this.isBlocked(x, y, x, y - 1)) {
        moves.push({ x: x, y: y - 2 });
      } else if (opponent.x === x && opponent.y === y + 1 && !this.isBlocked(x, y, x, y + 1)) {
        moves.push({ x: x, y: y + 2 });
      } else if (opponent.y === y && opponent.x === x - 1 && !this.isBlocked(x, y, x - 1, y)) {
        moves.push({ x: x - 2, y: y });
      } else if (opponent.y === y && opponent.x === x + 1 && !this.isBlocked(x, y, x + 1, y)) {
        moves.push({ x: x + 2, y: y });
      }

      for (let move of moves) {
        if (move.x >= 0 && move.x < BOARD_SIZE && move.y >= 0 && move.y < BOARD_SIZE &&
            !visited[move.y][move.x] && player.isAdjacent(move.x, move.y, this)) {
          queue.push(move);
          visited[move.y][move.x] = true;
        }
      }
    }
    return false;
  }
}

function aiMakeMove() {
  if (!isAIMode || currentPlayer !== 1) return;
  const aiPlayer = board.players[1];

  // Decide randomly to move (70%) or place a wall (30%) if walls are available
  if (aiPlayer.walls > 0 && Math.random() < 0.3) {
    aiPlaceWall();
  } else {
    // Collect all valid moves, including jumps
    let possibleMoves = [
      { x: aiPlayer.x, y: aiPlayer.y - 1 }, // Up
      { x: aiPlayer.x, y: aiPlayer.y + 1 }, // Down
      { x: aiPlayer.x - 1, y: aiPlayer.y }, // Left
      { x: aiPlayer.x + 1, y: aiPlayer.y }  // Right
    ];

    const opponent = board.players[0];
    // Add jump moves if opponent is adjacent
    if (opponent.x === aiPlayer.x && opponent.y === aiPlayer.y - 1 && !board.isBlocked(aiPlayer.x, aiPlayer.y, opponent.x, opponent.y)) {
      possibleMoves.push({ x: aiPlayer.x, y: aiPlayer.y - 2 }); // Jump up
    } else if (opponent.x === aiPlayer.x && opponent.y === aiPlayer.y + 1 && !board.isBlocked(aiPlayer.x, aiPlayer.y, opponent.x, opponent.y)) {
      possibleMoves.push({ x: aiPlayer.x, y: aiPlayer.y + 2 }); // Jump down
    } else if (opponent.y === aiPlayer.y && opponent.x === aiPlayer.x - 1 && !board.isBlocked(aiPlayer.x, aiPlayer.y, opponent.x, opponent.y)) {
      possibleMoves.push({ x: aiPlayer.x - 2, y: aiPlayer.y }); // Jump left
    } else if (opponent.y === aiPlayer.y && opponent.x === aiPlayer.x + 1 && !board.isBlocked(aiPlayer.x, aiPlayer.y, opponent.x, opponent.y)) {
      possibleMoves.push({ x: aiPlayer.x + 2, y: aiPlayer.y }); // Jump right
    }

    // Filter valid moves within board boundaries and allowed by rules
    possibleMoves = possibleMoves.filter(move => 
      move.x >= 0 && move.x < BOARD_SIZE && 
      move.y >= 0 && move.y < BOARD_SIZE && 
      aiPlayer.isAdjacent(move.x, move.y, board)
    );

    if (possibleMoves.length > 0) {
      // Pick a random valid move
      let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      aiPlayer.move(move.x, move.y, board);

      // Check for win
      if (aiPlayer.y === 0) {
        showWinnerModal(aiPlayer.name);
      } else {
        currentPlayer = 0;
      }
    } else {
      // No valid moves, try to place a wall
      console.log("AI: No valid moves, trying to place a wall.");
      aiPlaceWall();
    }
  }
}

function aiPlaceWall() {
  const aiPlayer = board.players[1];

  // Generate possible wall positions (try all board intersections)
  let possibleWalls = [];
  for (let x = 0; x < BOARD_SIZE - 1; x++) {
    for (let y = 0; y < BOARD_SIZE - 1; y++) {
      possibleWalls.push({ x: x, y: y, vertical: true });
      possibleWalls.push({ x: x, y: y, vertical: false });
    }
  }

  // Filter valid walls that don't block all paths
  possibleWalls = possibleWalls.filter(wall => 
    board.validWall(wall.x, wall.y, wall.vertical) && 
    board.canReachGoalsAfterWall(wall.x, wall.y, wall.vertical)
  );

  if (possibleWalls.length > 0 && aiPlayer.walls > 0) {
    // Pick a random valid wall
    let wall = possibleWalls[Math.floor(Math.random() * possibleWalls.length)];
    board.walls.push(new Wall(wall.x, wall.y, wall.vertical));
    aiPlayer.walls--;
    currentPlayer = 0;
  } else {
    console.log("AI: No valid walls to place or no walls left.");
    currentPlayer = 0;
  }
}

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
