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

  if (canvas) {
    canvas.remove();
  }

  canvas = createCanvas(BOARD_SIZE * TILE_SIZE + 200, BOARD_SIZE * TILE_SIZE);
  gameContainer.appendChild(canvas.elt);

  board = new Board(player1Name, player2Name, color1, color2);
  currentPlayer = 0;
  gameStarted = true;

  if (isAIMode) {
    document.getElementById('player2-name').disabled = true;
  }
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
    alert(`${board.players[currentPlayer].name} s-a dat bătut!`);
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
  console.log("mouseReleased triggered", { mouseX, mouseY, shiftPressed, ctrlPressed });

  // Verifică dacă jocul a început și dacă nu este tura AI-ului
  if (!gameStarted || (isAIMode && currentPlayer === 1)) {
    console.log("Action blocked: game not started or AI's turn", { gameStarted, isAIMode, currentPlayer });
    return;
  }

  // Calculează poziția pe grilă
  const x = floor(mouseX / TILE_SIZE);
  const y = floor(mouseY / TILE_SIZE);
  const player = board.players[currentPlayer];
  console.log("Grid position calculated", { x, y, currentPlayer, playerName: player.name, wallsLeft: player.walls });

  // Dacă Shift este apăsat, încearcă să plasezi un perete
  if (shiftPressed) {
    let vertical = ctrlPressed; // Perete vertical dacă Control este apăsat
    console.log("Attempting to place wall", { x, y, vertical, shiftPressed, ctrlPressed });

    if (player.walls > 0) {
      console.log("Player has walls available", { walls: player.walls });
      if (board.validWall(x, y, vertical)) {
        console.log("Wall position is valid", { x, y, vertical });
        if (board.canReachGoalsAfterWall(x, y, vertical)) {
          console.log("Wall placement allowed: paths to goals exist");
          board.walls.push(new Wall(x, y, vertical));
          player.walls--;
          console.log("Wall placed successfully", { wallsRemaining: player.walls });
          currentPlayer = 1 - currentPlayer;
          console.log("Player switched", { newCurrentPlayer: currentPlayer });
          if (isAIMode && currentPlayer === 1) {
            console.log("Scheduling AI move");
            setTimeout(aiMakeMove, 500);
          }
          console.log("Zid plasat cu succes.");
        } else {
          console.log("Wall placement failed: Cannot reach goals after placing wall");
        }
      } else {
        console.log("Wall placement failed: Invalid wall position");
      }
    } else {
      console.log("Wall placement failed: No walls left for player");
    }
  } else {
    // Mută pionul dacă nu plasezi un perete
    console.log("Attempting to move pawn", { dragging, draggedPlayer: draggedPlayer ? draggedPlayer.name : null });
    if (dragging && draggedPlayer) {
      console.log("Pawn drag detected", { targetX: x, targetY: y });
      let moved = board.movePawn(currentPlayer, x, y);
      if (moved) {
        console.log("Pawn moved successfully", { newX: player.x, newY: player.y });
        currentPlayer = 1 - currentPlayer;
        console.log("Player switched after pawn move", { newCurrentPlayer: currentPlayer });
        if (isAIMode && currentPlayer === 1) {
          console.log("Scheduling AI move after pawn move");
          setTimeout(aiMakeMove, 500);
        }
      } else {
        console.log("Pawn move failed: Invalid move");
      }
    } else {
      console.log("No pawn drag detected");
    }
    dragging = false;
    draggedPlayer = null;
    console.log("Reset dragging state", { dragging, draggedPlayer });
  }
}

function placeWall(x, y, vertical) {
  if (!gameStarted || (isAIMode && currentPlayer === 1)) return false;

  const player = board.players[currentPlayer];

  if (player.walls > 0 &&
    board.validWall(x, y, vertical) &&
    board.canReachGoalsAfterWall(x, y, vertical)) {

    board.walls.push(new Wall(x, y, vertical));
    player.walls--;
    currentPlayer = 1 - currentPlayer;

    if (isAIMode && currentPlayer === 1) {
      setTimeout(aiMakeMove, 500);
    }

    return true;
  }

  return false;
}


function keyPressed() {
  if (keyCode === SHIFT) {
    shiftPressed = true;
    console.log("Shift pressed");
  }
  if (keyCode === CONTROL) {
    ctrlPressed = true;
    console.log("Control pressed");
  }
}

function keyReleased() {
  if (keyCode === SHIFT) {
    shiftPressed = false;
    console.log("Shift released");
  }
  if (keyCode === CONTROL) {
    ctrlPressed = false;
    console.log("Control released");
  }
}

// Funcție pentru mutarea calculatorului (modul "easy")
function computerMove() {
  if (!isComputerPlayer || currentPlayer !== 1) return;

  const player = board.players[1]; // Calculatorul

  // Decide aleator: 70% șansă să mute pionul, 30% șansă să plaseze un zid
  const action = random(1) < 0.5 ? 'move' : 'placeWall';

  if (action === 'move') {
    const possibleMoves = [];
    const dirs = [
      [0, -1], [0, 1], [1, 0], [-1, 0], // Adiacente directe
      [0, -2], [0, 2], [1, 1], [1, -1], [-1, 1], [-1, -1], [2, 0], [-2, 0] // Sărind peste adversar
    ];

    for (const [dx, dy] of dirs) {
      const newX = player.x + dx;
      const newY = player.y + dy;
      if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE && player.isAdjacent(newX, newY, board)) {
        possibleMoves.push([newX, newY]);
      }
    }

    if (possibleMoves.length > 0) {
      const [newX, newY] = random(possibleMoves);
      player.move(newX, newY, board);

      if (player.y === 0) {
        showWinnerModal(player.name);
        return; // Jocul s-a terminat
      }
    } else {
      console.log("Calculatorul nu are mutări valide pentru pion, va încerca să plaseze un zid.");
      // Dacă nu poate muta pionul, forțează plasarea unui zid (dacă are ziduri)
      if (player.walls > 0) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 50;

        while (!placed && attempts < maxAttempts) {
          const x = floor(random(BOARD_SIZE - 2));
          const y = floor(random(BOARD_SIZE - 2));
          const vertical = random(1) < 0.5;

          if (board.validWall(x, y, vertical)) {
            board.walls.push(new Wall(x, y, vertical));
            player.walls--;
            placed = true;
          }
          attempts++;
        }

        if (!placed) {
          console.log("Calculatorul nu a găsit o poziție validă pentru zid.");
        }
      } else {
        console.log("Calculatorul nu mai are ziduri și nu poate muta pionul.");
      }
    }
  } else if (action === 'placeWall' && player.walls > 0) {
    // Plasează un zid dacă are ziduri disponibile
    let placed = false;
    let attempts = 0;
    const maxAttempts = 50;

    while (!placed && attempts < maxAttempts) {
      const x = floor(random(BOARD_SIZE - 2));
      const y = floor(random(BOARD_SIZE - 2));
      const vertical = random(1) < 0.5;

      if (board.validWall(x, y, vertical)) {
        board.walls.push(new Wall(x, y, vertical));
        player.walls--;
        placed = true;
      }
      attempts++;
    }

    if (!placed) {
      console.log("Calculatorul nu a găsit o poziție validă pentru zid.");
    }
  } else {
    console.log("Calculatorul nu mai are ziduri, va încerca să mute pionul.");
    // Dacă nu mai are ziduri, forțează mutarea pionului
    const possibleMoves = [];
    const dirs = [
      [0, -1], [0, 1], [1, 0], [-1, 0], // Adiacente directe
      [0, -2], [0, 2], [1, 1], [1, -1], [-1, 1], [-1, -1], [2, 0], [-2, 0] // Sărind peste adversar
    ];

    for (const [dx, dy] of dirs) {
      const newX = player.x + dx;
      const newY = player.y + dy;
      if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE && player.isAdjacent(newX, newY, board)) {
        possibleMoves.push([newX, newY]);
      }
    }

    if (possibleMoves.length > 0) {
      const [newX, newY] = random(possibleMoves);
      player.move(newX, newY, board);

      if (player.y === 0) {
        showWinnerModal(player.name);
        return; // Jocul s-a terminat
      }
    } else {
      console.log("Calculatorul nu are mutări valide pentru pion și nu mai are ziduri.");
    }
  }

  // Setează rândul jucătorului uman
  currentPlayer = 0;
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
    }
  }

  move(x, y, board) {
    if (this.isAdjacent(x, y, board)) {
      this.x = x;
      this.y = y;
      return true;
    }
    return false;
  }

  isAdjacent(x, y, board) {
    const opponent = board.players[1 - board.players.indexOf(this)];
    let dx = x - this.x;
    let dy = y - this.y;

    if ((abs(dx) === 1 && dy === 0) || (abs(dy) === 1 && dx === 0)) {
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
      if (vertical && wall.vertical && x === wall.x && (y === wall.y - 1 || y === wall.y + 1)) return false;
      if (!vertical && !wall.vertical && y === wall.y && (x === wall.x - 1 || x === wall.x + 1)) return false;
      if (vertical && !wall.vertical && x === wall.x && (y === wall.y || y === wall.y - 1)) return false;
      if (!vertical && wall.vertical && y === wall.y && (x === wall.x || x === wall.x - 1)) return false;
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
    console.log("Checking if goals can be reached after placing wall", { x, y, vertical });
    this.walls.push(new Wall(x, y, vertical));
    let canReachPlayer1 = this.hasPathToGoal(0, BOARD_SIZE - 1); // Jucător 1 -> y: 8
    let canReachPlayer2 = this.hasPathToGoal(1, 0); // Jucător 2 -> y: 0
    console.log("Path check results", { canReachPlayer1, canReachPlayer2 });
    this.walls.pop();
    return canReachPlayer1 && canReachPlayer2;
  }

  hasPathToGoal(playerIndex, goalY) {
    const player = this.players[playerIndex];
    let visited = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(false));
    let queue = [{ x: player.x, y: player.y }];
    visited[player.y][player.x] = true;
    console.log(`Checking path for player ${playerIndex} from (${player.x}, ${player.y}) to y=${goalY}`);

    while (queue.length > 0) {
      let { x, y } = queue.shift();
      console.log(`Exploring position (${x}, ${y})`);
      if (y === goalY) {
        console.log(`Goal reached for player ${playerIndex} at (${x}, ${y})`);
        return true;
      }

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
        if (
          move.x >= 0 &&
          move.x < BOARD_SIZE &&
          move.y >= 0 &&
          move.y < BOARD_SIZE &&
          !visited[move.y][move.x] &&
          player.isAdjacent(move.x, move.y, this)
        ) {
          console.log(`Adding valid move to queue: (${move.x}, ${move.y})`);
          queue.push(move);
          visited[move.y][move.x] = true;
        } else {
          console.log(`Invalid move skipped: (${move.x}, ${move.y})`, {
            inBounds: move.x >= 0 && move.x < BOARD_SIZE && move.y >= 0 && move.y < BOARD_SIZE,
            notVisited: !visited[move.y][move.x],
            isAdjacent: player.isAdjacent(move.x, move.y, this)
          });
        }
      }
    }
    console.log(`No path found for player ${playerIndex} to y=${goalY}`);
    return false;
  }

  movePawn(playerIndex, x, y) {
    const player = this.players[playerIndex];
    if (player.isAdjacent(x, y, this)) {
      player.move(x, y, this);

      if ((playerIndex === 0 && y === BOARD_SIZE - 1) || (playerIndex === 1 && y === 0)) {
        showWinnerModal(player.name);
        return true;
      }
      return true;
    }
    return false;
  }
}

function aiMakeMove() {
  if (!isAIMode || currentPlayer !== 1) return;
  const aiPlayer = board.players[1];

  if (aiPlayer.walls > 0 && Math.random() < 0.5) {
    aiPlaceWall();
  } else {
    // Collect all valid moves, including jumps
    let possibleMoves = [
      { x: aiPlayer.x, y: aiPlayer.y - 1 },
      { x: aiPlayer.x, y: aiPlayer.y + 1 },
      { x: aiPlayer.x - 1, y: aiPlayer.y },
      { x: aiPlayer.x + 1, y: aiPlayer.y }
    ];

    const opponent = board.players[0];
    // Add jump moves if opponent is adjacent
    if (opponent.x === aiPlayer.x && opponent.y === aiPlayer.y - 1 && !board.isBlocked(aiPlayer.x, aiPlayer.y, opponent.x, opponent.y)) {
      possibleMoves.push({ x: aiPlayer.x, y: aiPlayer.y - 2 });
    } else if (opponent.x === aiPlayer.x && opponent.y === aiPlayer.y + 1 && !board.isBlocked(aiPlayer.x, aiPlayer.y, opponent.x, opponent.y)) {
      possibleMoves.push({ x: aiPlayer.x, y: aiPlayer.y + 2 });
    } else if (opponent.y === aiPlayer.y && opponent.x === aiPlayer.x - 1 && !board.isBlocked(aiPlayer.x, aiPlayer.y, opponent.x, opponent.y)) {
      possibleMoves.push({ x: aiPlayer.x - 2, y: aiPlayer.y });
    } else if (opponent.y === aiPlayer.y && opponent.x === aiPlayer.x + 1 && !board.isBlocked(aiPlayer.x, aiPlayer.y, opponent.x, opponent.y)) {
      possibleMoves.push({ x: aiPlayer.x + 2, y: aiPlayer.y });
    }

    possibleMoves = possibleMoves.filter(move =>
      move.x >= 0 && move.x < BOARD_SIZE &&
      move.y >= 0 && move.y < BOARD_SIZE &&
      aiPlayer.isAdjacent(move.x, move.y, board)
    );

    if (possibleMoves.length > 0) {
      // Pick a random valid move
      let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      if (board.movePawn(1, move.x, move.y)) {
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

  // Gestionare „Revansă” (resetează jocul cu aceleași setări)
  document.getElementById("rematch-button").onclick = () => {
    modal.style.display = "none";
    resetGameState();
    startGame(); // Reîncepe jocul cu setările curente
  };

  // Gestionare „Joacă cu altcineva” (întoarce-te la ecranul de start)
  document.getElementById("newgame-button").onclick = () => {
    modal.style.display = "none";
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
    resetGameState();
    if (canvas) {
      canvas.remove();
    }
  };
}
