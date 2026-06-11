const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const livesEl = document.querySelector("#lives");
const timeEl = document.querySelector("#time");
const restartBtn = document.querySelector("#restart");
const startBtn = document.querySelector("#start");
const overlay = document.querySelector("#overlay");

const world = {
  width: canvas.width,
  height: canvas.height,
  margin: 28,
};

const player = {
  x: world.width / 2,
  y: world.height / 2,
  radius: 18,
  speed: 250,
  vx: 0,
  vy: 0,
  invincible: 0,
};

const keys = new Set();
const mushrooms = [];
const particles = [];
let score = 0;
let lives = 3;
let timeLeft = 60;
let status = "idle";
let lastFrame = performance.now();
let spawnTimer = 0;
let poisonTimer = 0;

const random = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function resetGame() {
  score = 0;
  lives = 3;
  timeLeft = 60;
  status = "playing";
  spawnTimer = 0;
  poisonTimer = 1.6;
  mushrooms.length = 0;
  particles.length = 0;
  player.x = world.width / 2;
  player.y = world.height / 2;
  player.vx = 0;
  player.vy = 0;
  player.invincible = 0;
  for (let i = 0; i < 8; i += 1) spawnMushroom(false);
  updateHud();
  hideOverlay();
}

function updateHud() {
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  timeEl.textContent = Math.ceil(Math.max(0, timeLeft));
}

function showOverlay(title, text, buttonText = "شروع بازی") {
  overlay.querySelector("h2").textContent = title;
  overlay.querySelector("p").textContent = text;
  startBtn.textContent = buttonText;
  overlay.classList.add("is-visible");
}

function hideOverlay() {
  overlay.classList.remove("is-visible");
}

function spawnMushroom(poison = Math.random() < 0.16) {
  const size = poison ? random(16, 22) : random(14, 24);
  mushrooms.push({
    x: random(world.margin + size, world.width - world.margin - size),
    y: random(world.margin + size, world.height - world.margin - size),
    radius: size,
    poison,
    wobble: random(0, Math.PI * 2),
  });
}

function addParticles(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = random(0, Math.PI * 2);
    const speed = random(50, 180);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: random(0.3, 0.75),
      maxLife: 0.75,
      color,
    });
  }
}

function setDirection(dir, active) {
  const map = {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
  };
  if (active) keys.add(map[dir]);
  else keys.delete(map[dir]);
}

function handleInput() {
  let dx = 0;
  let dy = 0;

  if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;

  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy);
    player.vx = dx / length;
    player.vy = dy / length;
  } else {
    player.vx = 0;
    player.vy = 0;
  }
}

function update(dt) {
  if (status !== "playing") return;

  timeLeft -= dt;
  if (timeLeft <= 0) {
    endGame("زمان تمام شد", `امتیاز نهایی تو ${score} شد.`, "دوباره بازی کن");
    return;
  }

  handleInput();
  player.x = clamp(player.x + player.vx * player.speed * dt, world.margin, world.width - world.margin);
  player.y = clamp(player.y + player.vy * player.speed * dt, world.margin, world.height - world.margin);
  player.invincible = Math.max(0, player.invincible - dt);

  spawnTimer -= dt;
  poisonTimer -= dt;
  if (spawnTimer <= 0 && mushrooms.filter((item) => !item.poison).length < 14) {
    spawnMushroom(false);
    spawnTimer = random(0.35, 0.8);
  }
  if (poisonTimer <= 0 && mushrooms.filter((item) => item.poison).length < 5) {
    spawnMushroom(true);
    poisonTimer = random(1.5, 2.5);
  }

  for (let i = mushrooms.length - 1; i >= 0; i -= 1) {
    const item = mushrooms[i];
    item.wobble += dt * 3;
    const hitDistance = player.radius + item.radius * 0.68;
    if (Math.hypot(player.x - item.x, player.y - item.y) < hitDistance) {
      mushrooms.splice(i, 1);
      if (item.poison) {
        if (player.invincible <= 0) {
          lives -= 1;
          player.invincible = 1.2;
          addParticles(item.x, item.y, "#9b5dd4", 18);
          if (lives <= 0) {
            endGame("باختی", `امتیاز نهایی تو ${score} شد.`, "تلاش دوباره");
          }
        }
      } else {
        score += 10;
        timeLeft = Math.min(75, timeLeft + 1.5);
        addParticles(item.x, item.y, "#f0c24b", 14);
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 80 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  updateHud();
}

function endGame(title, text, buttonText) {
  status = "ended";
  updateHud();
  showOverlay(title, text, buttonText);
}

function drawBackground() {
  ctx.fillStyle = "#162117";
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= world.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, world.height);
    ctx.stroke();
  }
  for (let y = 0; y <= world.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(world.width, y);
    ctx.stroke();
  }

  drawLeaf(88, 84, 62, "#23371f", 0.4);
  drawLeaf(790, 92, 86, "#25331f", -0.3);
  drawLeaf(158, 420, 96, "#20331e", -0.1);
  drawLeaf(760, 430, 70, "#26351f", 0.2);
}

function drawLeaf(x, y, size, color, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMushroom(item) {
  const wobble = Math.sin(item.wobble) * 2;
  const cap = item.poison ? "#9b5dd4" : "#e14d3d";
  const capShadow = item.poison ? "#6d3da0" : "#a72f29";
  const stem = item.poison ? "#d9cff0" : "#f5e1ba";

  ctx.save();
  ctx.translate(item.x, item.y + wobble);
  ctx.fillStyle = stem;
  ctx.beginPath();
  ctx.roundRect(-item.radius * 0.35, -item.radius * 0.1, item.radius * 0.7, item.radius * 0.85, 6);
  ctx.fill();

  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.ellipse(0, -item.radius * 0.18, item.radius, item.radius * 0.62, Math.PI, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = capShadow;
  ctx.fillRect(-item.radius, -item.radius * 0.18, item.radius * 2, item.radius * 0.16);

  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.arc(i * item.radius * 0.38, -item.radius * 0.32, item.radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  if (item.poison) {
    ctx.strokeStyle = "#2a123e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-item.radius * 0.28, item.radius * 0.42);
    ctx.lineTo(item.radius * 0.28, item.radius * 0.68);
    ctx.moveTo(item.radius * 0.28, item.radius * 0.42);
    ctx.lineTo(-item.radius * 0.28, item.radius * 0.68);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlayer() {
  const blink = player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0;
  if (blink) return;

  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.fillStyle = "#f0c24b";
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0.15 * Math.PI, 1.85 * Math.PI);
  ctx.lineTo(3, 0);
  ctx.closePath();
  ctx.fill();

  const eyeX = player.vx >= 0 ? 5 : -5;
  ctx.fillStyle = "#1b1b14";
  ctx.beginPath();
  ctx.arc(eyeX, -7, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.beginPath();
  ctx.arc(-5, -7, 10, Math.PI * 1.15, Math.PI * 1.75);
  ctx.stroke();

  ctx.restore();
}

function drawParticles() {
  particles.forEach((p) => {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function render() {
  drawBackground();
  mushrooms.forEach(drawMushroom);
  drawParticles();
  drawPlayer();
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastFrame) / 1000);
  lastFrame = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
    event.preventDefault();
    keys.add(event.code);
  }
  if (event.code === "Space" && status !== "playing") resetGame();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

document.querySelectorAll("[data-dir]").forEach((button) => {
  const dir = button.dataset.dir;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    setDirection(dir, true);
  });
  button.addEventListener("pointerup", () => setDirection(dir, false));
  button.addEventListener("pointercancel", () => setDirection(dir, false));
  button.addEventListener("pointerleave", () => setDirection(dir, false));
});

restartBtn.addEventListener("click", resetGame);
startBtn.addEventListener("click", resetGame);

showOverlay("آماده‌ای؟", "با کلیدهای جهت‌دار یا WASD حرکت کن. قارچ سالم امتیاز و زمان می‌دهد؛ قارچ بنفش جان کم می‌کند.", "شروع بازی");
render();
requestAnimationFrame(loop);
