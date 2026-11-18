const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const playerImage = new Image();
playerImage.src = "Player.png";
playerImage.onload = () => draw();
let cols = 18;
let rows = 10;
let hardMode = false;
let timerMode = false;
let coinMode = false;
let lightMode = false;
let maze = [];
let player = { x: 0, y: 0 };
let level = 1;
let moves = 0;
let coins = [];
let coinsCollected = 0;
let totalMoves = 0;
let highScore = Number(localStorage.getItem("mazeHighScore")) || 0;
let gameStarted = false;
let changingLevel = false;
let nextLevelTimer;
let seconds = 0;
let timerInterval;

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent =
      timerMode ? Math.max(0, 30 - seconds) : seconds;
    if (timerMode && seconds >= 30) {
      stopTimer();
      gameStarted = false;
      changingLevel = true;
      document.getElementById("timeTitle").textContent = "Time's Up!";
      document.getElementById("timeMessage").textContent =
        "You didn't escape within 30 seconds!";
      document.getElementById("timeScreen").classList.remove("hidden");
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function generateMaze() {
  maze = Array.from({ length: rows }, () => Array(cols).fill(1));
  function carve(x, y) {
    maze[y][x] = 0;
    const directions = [[0, -2], [0, 2], [-2, 0], [2, 0]]
      .sort(() => Math.random() - 0.5);
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < cols && ny >= 0 &&
          ny < rows && maze[ny][nx] === 1) {
        maze[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  }
  carve(0, 0);
  const exitX = cols - 1;
  const exitY = rows - 1;

  if (cols % 2 === 0) {
    maze[rows - 2][cols - 1] = 0;
    maze[rows - 2][cols - 2] = 0;
  }

  if (rows % 2 === 0) {
    maze[rows - 1][cols - 2] = 0;
  }

  maze[exitY][exitX] = 0;
  player = { x: 0, y: 0 };
  moves = 0;
  changingLevel = false;
coins = [];
coinsCollected = 0;

while (coinMode && coins.length < 5) {
  let x = Math.floor(Math.random() * cols);
  let y = Math.floor(Math.random() * rows);
  if (
    maze[y][x] === 0 &&
    !(x === 0 && y === 0) &&
    !(x === cols - 1 && y === rows - 1) &&
    !coins.some(coin => coin.x === x && coin.y === y)
  ) {
    coins.push({ x, y });
  }
}

  stopTimer();
seconds = 0;
document.getElementById("timer").textContent = timerMode ? 30 : 0;

if (gameStarted && timerMode) {
  startTimer();
}
  updateInfo();
  draw();
}

function draw() {
  const tileWidth = canvas.width / cols;
  const tileHeight = canvas.height / rows;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
    ctx.fillStyle = maze[y][x]
    ? (lightMode ? "#000000" : "#38415c")
    : (lightMode ? "#ffffff" : "#1e2335");
    ctx.fillRect(
    Math.floor(x * tileWidth),
    Math.floor(y * tileHeight),
    Math.ceil((x + 1) * tileWidth) - Math.floor(x * tileWidth),
    Math.ceil((y + 1) * tileHeight) - Math.floor(y * tileHeight)
    );
  }
  }

ctx.fillStyle = lightMode ? "#22c55e" : "#35e88b";
ctx.fillRect(
    (cols - 1) * tileWidth,
    (rows - 1) * tileHeight,
    tileWidth,
    tileHeight
  );
ctx.fillStyle = "#ffd700";

for (const coin of coins) {
  ctx.beginPath();
  ctx.arc(
    (coin.x + 0.5) * tileWidth,
    (coin.y + 0.5) * tileHeight,
    Math.min(tileWidth, tileHeight) / 5,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

if (playerImage.complete && playerImage.naturalWidth > 0) {
  const playerSize = Math.min(tileWidth, tileHeight) * 0.8;

  ctx.drawImage(
    playerImage,
    (player.x + 0.5) * tileWidth - playerSize / 2,
    (player.y + 0.5) * tileHeight - playerSize / 2,
    playerSize,
    playerSize
  );
}
}

function updateDisplays() {
  document.getElementById("coinDisplay").classList.toggle("hidden", !coinMode);
  document.getElementById("timerDisplay").classList.toggle("hidden", !timerMode);
}

function updateInfo() {
  document.getElementById("coins").textContent = coinsCollected;
  document.getElementById("level").textContent = level;
  document.getElementById("moves").textContent = moves;
  document.getElementById("highScore").textContent = highScore || "--";
}

function resetGame() {
  clearTimeout(nextLevelTimer);
  updateDisplays();
  document.getElementById("winScreen").classList.add("hidden");
  document.getElementById("timeScreen").classList.add("hidden");
  level = 1;
  totalMoves = 0;
  gameStarted = document.getElementById("welcome").classList.contains("hidden");
  generateMaze();
}

document.getElementById("start").onclick = () => {
  document.getElementById("welcome").classList.add("hidden");
  gameStarted = true;

  if (timerMode) {
    startTimer();
  }
};

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
  event.preventDefault();
  return;
}
  const keys = {
    ArrowUp: [0, -1], ArrowDown: [0, 1],
    ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1],
    a: [-1, 0], d: [1, 0]
  };

  const direction = keys[event.key];

  if (!direction || !gameStarted || changingLevel) return;

  event.preventDefault();

  const nx = player.x + direction[0];
  const ny = player.y + direction[1];

  if (nx < 0 || nx >= cols || ny < 0 ||
      ny >= rows || maze[ny][nx] === 1) return;

 player = { x: nx, y: ny };
moves++;
totalMoves++;

const coinIndex = coins.findIndex(coin => coin.x === nx && coin.y === ny);

if (coinIndex !== -1) {
  coins.splice(coinIndex, 1);
  coinsCollected++;
}

updateInfo();
draw();

if (nx === cols - 1 && ny === rows - 1) {
  changingLevel = true;
  stopTimer();

  if (coinMode) {
    gameStarted = false;

    if (coinsCollected === 5) {
      document.getElementById("timeTitle").textContent = "You Won!";
      document.getElementById("timeMessage").textContent =
        "You collected all 5 coins and escaped!";
    } else {
      document.getElementById("timeTitle").textContent = "You Lost!";
      document.getElementById("timeMessage").textContent =
        "You only collected " + coinsCollected + " out of 5 coins!";
    }

    document.getElementById("timeScreen").classList.remove("hidden");

  } else if (timerMode) {
    gameStarted = false;

    document.getElementById("timeTitle").textContent = "You Won!";
    document.getElementById("timeMessage").textContent =
      "You escaped with " + (30 - seconds) + " seconds remaining!";

    document.getElementById("timeScreen").classList.remove("hidden");

  } else if (!hardMode && level === 3) {
    gameStarted = false;

    if (highScore === 0 || totalMoves < highScore) {
      highScore = totalMoves;
      localStorage.setItem("mazeHighScore", highScore);
    }

    updateInfo();
    document.getElementById("winScreen").classList.remove("hidden");

  } else {
    nextLevelTimer = setTimeout(() => {
      level++;
      generateMaze();
    }, 700);
  }
}
});

document.getElementById("restart").onclick = resetGame;

document.getElementById("hardMode").onclick = () => {
  hardMode = !hardMode;
  coinMode = false;
  timerMode = false;

document.getElementById("coinMode").textContent = "Coin Mode";
document.getElementById("timerMode").textContent = "Timer Mode";
  cols = hardMode ? 31 : 18;
  rows = hardMode ? 17 : 10;

  document.getElementById("hardMode").textContent =
    hardMode ? "Normal Mode" : "Hard Mode";

  resetGame();
};

document.getElementById("playAgain").onclick = () => {
  hardMode = false;
  timerMode = false;
  coinMode = false;
  cols = 18;
  rows = 10;
  document.getElementById("hardMode").textContent = "Hard Mode";
  document.getElementById("timerMode").textContent = "Timer Mode";
  document.getElementById("coinMode").textContent = "Coin Mode";

  resetGame();
};

document.getElementById("coinMode").onclick = () => {
  coinMode = !coinMode;
  timerMode = false;
  hardMode = false;
  cols = 18;
  rows = 10;
  document.getElementById("coinMode").textContent = 
    coinMode ? "Normal Mode" : "Coin Mode";
  document.getElementById("hardMode").textContent = "Hard Mode";
  document.getElementById("timerMode").textContent = "Timer Mode";
  resetGame();
};

document.getElementById("timerMode").onclick = () => {
  timerMode = !timerMode;
  coinMode = false;
  hardMode = false;
  cols = 18;
  rows = 10;
  document.getElementById("timerMode").textContent =
    timerMode ? "Normal Mode" : "Timer Mode";

  document.getElementById("coinMode").textContent = "Coin Mode";
  document.getElementById("hardMode").textContent = "Hard Mode";

  resetGame();
};

document.getElementById("tryAgain").onclick = () => {
  resetGame();
};

document.getElementById("themeButton").onclick = () => {
  lightMode = !lightMode;
  document.body.classList.toggle("light-mode", lightMode);
  document.getElementById("themeButton").textContent =
    lightMode ? "Dark Mode" : "Light Mode";
  draw();
};

updateDisplays();
generateMaze();  

