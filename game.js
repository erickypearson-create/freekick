const canvas = document.getElementById("pitch");
const ctx = canvas.getContext("2d");

const ui = {
  phase: document.getElementById("phase"),
  question: document.getElementById("question"),
  result: document.getElementById("result"),
  answers: document.getElementById("answers"),
  startBtn: document.getElementById("startBtn"),
  nextBtn: document.getElementById("nextBtn"),
  summary: document.getElementById("summary"),
};

const player = {
  x: canvas.width / 2,
  y: canvas.height - 85,
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height - 70,
  radius: 8,
};

const keeper = {
  x: canvas.width / 2,
  y: 138,
  w: 65,
  h: 18,
};

const steps = [
  {
    key: "direction",
    label: "Direction",
    question: "Placeholder Q1 (English): Which side should the striker target?",
    options: ["Left corner", "Center", "Right corner"],
  },
  {
    key: "height",
    label: "Height",
    question: "Placeholder Q2 (English): Choose the best shot height.",
    options: ["Low", "Mid", "Top corner"],
  },
  {
    key: "power",
    label: "Power",
    question: "Placeholder Q3 (English): How strong should the kick be?",
    options: ["Controlled", "Balanced", "Powerful"],
  },
  {
    key: "spin",
    label: "Effect",
    question: "Placeholder Q4 (English): What spin style should be used?",
    options: ["No spin", "Outside foot (3 dedos)", "Chip (cavadinha)", "Hop run-up (dancinha)"],
  },
];

const state = {
  index: 0,
  answers: {},
  precisionBonus: 0,
  shot: null,
  running: false,
  ballProgress: 0,
};

function resetRound() {
  state.index = 0;
  state.answers = {};
  state.precisionBonus = 0;
  state.shot = null;
  state.running = false;
  state.ballProgress = 0;
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 70;
  ui.summary.innerHTML = "";
  ui.nextBtn.classList.add("hidden");
  showStep();
  drawScene();
}

function showStep() {
  const step = steps[state.index];
  ui.phase.textContent = step.label;
  ui.question.textContent = step.question;
  ui.result.textContent = "Responda para aumentar sua precisão.";
  ui.answers.innerHTML = "";

  step.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.addEventListener("click", () => answerStep(option));
    ui.answers.appendChild(btn);
  });
}

function randomCorrectness() {
  // Placeholder for real English-question validation.
  return Math.random() > 0.35;
}

function answerStep(choice) {
  if (state.running) return;

  const step = steps[state.index];
  const correct = randomCorrectness();
  state.answers[step.key] = { choice, correct };

  if (correct) {
    state.precisionBonus += 0.12;
    ui.result.textContent = `✅ Correct answer in English placeholder! ${step.label} more precise.`;
  } else {
    ui.result.textContent = `❌ Placeholder answer missed. ${step.label} will be less precise.`;
  }

  state.index += 1;

  if (state.index < steps.length) {
    showStep();
    return;
  }

  calculateShot();
  animateShot();
}

function calculateShot() {
  const direction = state.answers.direction.choice;
  const height = state.answers.height.choice;
  const power = state.answers.power.choice;
  const spin = state.answers.spin.choice;

  let targetX = canvas.width / 2;
  if (direction.includes("Left")) targetX = canvas.width / 2 - 210;
  if (direction.includes("Right")) targetX = canvas.width / 2 + 210;

  let targetY = 172;
  if (height === "Low") targetY = 238;
  if (height === "Top corner") targetY = 122;

  let speed = 0.017;
  if (power === "Balanced") speed = 0.021;
  if (power === "Powerful") speed = 0.027;

  let curve = 0;
  if (spin.includes("3 dedos")) {
    curve = direction.includes("Left") ? 55 : -55;
  }
  if (spin.includes("cavadinha")) {
    targetY -= 32;
    speed = 0.018;
  }
  if (spin.includes("dancinha")) {
    speed += 0.003;
    keeper.x += Math.random() > 0.5 ? -55 : 55;
  }

  const precision = Math.min(0.4, state.precisionBonus);
  targetX += (Math.random() - 0.5) * 160 * (1 - precision);
  targetY += (Math.random() - 0.5) * 110 * (1 - precision);

  state.shot = { targetX, targetY, speed, curve, precision, spin };

  ui.summary.innerHTML = `
    <p><strong>Direção:</strong> ${direction}</p>
    <p><strong>Altura:</strong> ${height}</p>
    <p><strong>Força:</strong> ${power}</p>
    <p><strong>Efeito:</strong> ${spin}</p>
    <p><strong>Bônus de precisão:</strong> ${(precision * 100).toFixed(0)}%</p>
  `;
}

function animateShot() {
  state.running = true;
  ui.phase.textContent = "Shot";
  ui.question.textContent = "Finalizando cobrança...";
  ui.answers.innerHTML = "";

  const startX = canvas.width / 2;
  const startY = canvas.height - 70;

  function frame() {
    state.ballProgress += state.shot.speed;
    const t = Math.min(state.ballProgress, 1);

    ball.x = lerp(startX, state.shot.targetX, t) + Math.sin(t * Math.PI) * state.shot.curve;
    ball.y = lerp(startY, state.shot.targetY, t);

    keeper.x = lerp(keeper.x, state.shot.targetX, 0.03);

    drawScene();

    if (t < 1) {
      requestAnimationFrame(frame);
      return;
    }

    state.running = false;
    finalizeShot();
  }

  requestAnimationFrame(frame);
}

function finalizeShot() {
  const keeperReach = Math.abs(ball.x - keeper.x) < 45 && Math.abs(ball.y - keeper.y) < 40;
  const insideGoal = ball.x > canvas.width / 2 - 265 && ball.x < canvas.width / 2 + 265 && ball.y > 112 && ball.y < 262;

  const goal = insideGoal && !keeperReach;

  ui.result.textContent = goal
    ? "⚽ GOOOL! Acertos em inglês aumentaram a precisão da finalização."
    : "🧤 Defesa ou chute para fora. Tente novamente e responda melhor as perguntas.";

  ui.nextBtn.classList.remove("hidden");
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // pitch lines
  ctx.fillStyle = "#2f8c4f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#daf3da";
  ctx.lineWidth = 3;

  // penalty box
  ctx.strokeRect(canvas.width / 2 - 280, 100, 560, 180);

  // goal
  ctx.fillStyle = "rgba(230, 240, 240, 0.15)";
  ctx.fillRect(canvas.width / 2 - 265, 110, 530, 160);
  ctx.strokeStyle = "#ffffff";
  ctx.strokeRect(canvas.width / 2 - 265, 110, 530, 160);

  // net lines
  ctx.strokeStyle = "rgba(255,255,255,0.30)";
  for (let i = 0; i <= 10; i += 1) {
    const x = canvas.width / 2 - 265 + i * 53;
    ctx.beginPath();
    ctx.moveTo(x, 110);
    ctx.lineTo(x, 270);
    ctx.stroke();
  }

  for (let j = 0; j <= 8; j += 1) {
    const y = 110 + j * 20;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 265, y);
    ctx.lineTo(canvas.width / 2 + 265, y);
    ctx.stroke();
  }

  // player
  ctx.fillStyle = "#232323";
  ctx.beginPath();
  ctx.arc(player.x, player.y - 22, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(player.x - 8, player.y - 10, 16, 30);

  // goalkeeper
  ctx.fillStyle = "#f2a13a";
  ctx.fillRect(keeper.x - keeper.w / 2, keeper.y - keeper.h / 2, keeper.w, keeper.h);

  // ball
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#222";
  ctx.stroke();
}

ui.startBtn.addEventListener("click", resetRound);
ui.nextBtn.addEventListener("click", resetRound);

drawScene();
