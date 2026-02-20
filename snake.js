const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const restartBtn = document.getElementById("restart");

// ---- Game settings
const gridSize = 20;                 // 20x20 grid
const tileSize = canvas.width / gridSize; // 400 / 20 = 20px per tile
let speedMs = 120;                   // lower = faster

// ---- Game state
let snake, direction, nextDirection, score, running, loopId;
let fruit; // {x,y,type} type: "safe" | "bomb"

// ---- Helpers
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function samePos(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isOnSnake(pos) {
  return snake.some(seg => samePos(seg, pos));
}

function spawnFruit() {
  let pos;
  do {
    pos = { x: randInt(0, gridSize - 1), y: randInt(0, gridSize - 1) };
  } while (isOnSnake(pos));

  const chance = Math.min(0.25 + score * 0.01, 0.6); // caps at 60%
  const isBomb = Math.random() < chance;

  fruit = {
    ...pos,
    type: isBomb ? "bomb" : "safe"
  };
}

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];

  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };

  score = 0;
  speedMs = 120;
  scoreEl.textContent = score;

  running = true;

  spawnFruit();

  if (loopId) clearInterval(loopId);
  loopId = setInterval(tick, speedMs);

  draw();
}

// ---- Input
document.addEventListener("keydown", (e) => {
  const key = e.key;

  // prevent reverse direction (snake can't go back into itself)
  if (key === "ArrowUp" && direction.y !== 1) nextDirection = { x: 0, y: -1 };
  if (key === "ArrowDown" && direction.y !== -1) nextDirection = { x: 0, y: 1 };
  if (key === "ArrowLeft" && direction.x !== 1) nextDirection = { x: -1, y: 0 };
  if (key === "ArrowRight" && direction.x !== -1) nextDirection = { x: 1, y: 0 };
});

restartBtn.addEventListener("click", resetGame);

// ---- Game loop
function tick() {
  if (!running) return;

  // update direction once per tick
  direction = nextDirection;

  const head = snake[0];
  const newHead = { x: head.x + direction.x, y: head.y + direction.y };

  // wall collision
  if (newHead.x < 0 || newHead.x >= gridSize || newHead.y < 0 || newHead.y >= gridSize) {
    gameOver("Hit the wall!");
    return;
  }

  // self collision
  if (isOnSnake(newHead)) {
    gameOver("You bit yourself!");
    return;
  }

  // move snake
  snake.unshift(newHead);

  // fruit collision
  if (samePos(newHead, fruit)) {
    if (fruit.type === "bomb") {
      gameOver("💥 Boom! Explosive fruit!");
      return;
    } else {
      score += 1;
      scoreEl.textContent = score;
      spawnFruit();
      // don't remove tail -> snake grows
    }
  } else {
    // normal movement: remove tail
    snake.pop();
  }

  draw();
}

function gameOver(message) {
  running = false;
  clearInterval(loopId);
  draw(true, message);
}

// ---- Drawing
function draw(isGameOver = false, message = "") {
  // clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw fruit
  drawFruit();

  // draw snake
  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? "#00d2ff" : "#00b894";
    ctx.fillRect(seg.x * tileSize, seg.y * tileSize, tileSize, tileSize);
  });

  // grid lines (optional, subtle)
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * tileSize, 0);
    ctx.lineTo(i * tileSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * tileSize);
    ctx.lineTo(canvas.width, i * tileSize);
    ctx.stroke();
  }

  if (isGameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "bold 22px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);

    ctx.font = "16px system-ui";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 18);
    ctx.fillText("Press Restart", canvas.width / 2, canvas.height / 2 + 44);
  }
}

function drawFruit() {
  const x = fruit.x * tileSize;
  const y = fruit.y * tileSize;

  // simple emoji-like circles
  ctx.beginPath();
  ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize * 0.35, 0, Math.PI * 2);

  if (fruit.type === "safe") {
    ctx.fillStyle = "#fdcb6e"; // safe fruit
  } else {
    ctx.fillStyle = "#d63031"; // bomb fruit
  }

  ctx.fill();

  // small highlight
  ctx.beginPath();
  ctx.arc(x + tileSize * 0.40, y + tileSize * 0.40, tileSize * 0.10, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fill();
}

// Start the game
resetGame();