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
  leftScore: document.getElementById("leftScore"),
  rightScore: document.getElementById("rightScore"),
};

const player = { x: canvas.width / 2 - 120, y: canvas.height - 38 };
const penaltySpot = { x: canvas.width / 2, y: canvas.height - 150 };
const ball = { x: penaltySpot.x, y: penaltySpot.y, radius: 9 };
const keeper = { x: canvas.width / 2, y: 206, w: 62, h: 76, armSpan: 108 };
const score = { left: 13, right: 12 };

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
  ball.x = penaltySpot.x;
  ball.y = penaltySpot.y;
  keeper.x = canvas.width / 2;
  ui.summary.innerHTML = "";
  ui.nextBtn.classList.add("hidden");
  renderScore();
  showStep();
  drawScene();
}

function renderScore() {
  ui.leftScore.textContent = score.left;
  ui.rightScore.textContent = score.right;
}

function showStep() {
  const step = steps[state.index];
  ui.phase.textContent = step.label;
  ui.question.textContent = step.question;
  ui.result.textContent = "Responda para aumentar a precisão da batida.";
  ui.answers.innerHTML = "";

  step.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.addEventListener("click", () => answerStep(option));
    ui.answers.appendChild(btn);
  });
}

function randomCorrectness() {
  return Math.random() > 0.35;
}

function answerStep(choice) {
  if (state.running) return;
  const step = steps[state.index];
  const correct = randomCorrectness();
  state.answers[step.key] = { choice, correct };

  if (correct) {
    state.precisionBonus += 0.12;
    ui.result.textContent = `✅ Correct placeholder answer! ${step.label} ficou mais precisa.`;
  } else {
    ui.result.textContent = `❌ Placeholder answer missed. ${step.label} com menos precisão.`;
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
  if (direction.includes("Left")) targetX = canvas.width / 2 - 220;
  if (direction.includes("Right")) targetX = canvas.width / 2 + 220;

  let targetY = 188;
  if (height === "Low") targetY = 245;
  if (height === "Top corner") targetY = 133;

  let speed = 0.017;
  if (power === "Balanced") speed = 0.021;
  if (power === "Powerful") speed = 0.026;

  let curve = 0;
  if (spin.includes("3 dedos")) curve = direction.includes("Left") ? 62 : -62;

  if (spin.includes("cavadinha")) {
    targetY -= 36;
    speed = 0.018;
  }

  if (spin.includes("dancinha")) {
    speed += 0.003;
    keeper.x += Math.random() > 0.5 ? -70 : 70;
  }

  const precision = Math.min(0.4, state.precisionBonus);
  targetX += (Math.random() - 0.5) * 170 * (1 - precision);
  targetY += (Math.random() - 0.5) * 120 * (1 - precision);

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

  const startX = penaltySpot.x;
  const startY = penaltySpot.y;

  function frame() {
    state.ballProgress += state.shot.speed;
    const t = Math.min(state.ballProgress, 1);

    ball.x = lerp(startX, state.shot.targetX, t) + Math.sin(t * Math.PI) * state.shot.curve;
    ball.y = lerp(startY, state.shot.targetY, t);
    keeper.x = lerp(keeper.x, state.shot.targetX, 0.03);

    drawScene();

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      state.running = false;
      finalizeShot();
    }
  }

  requestAnimationFrame(frame);
}

function finalizeShot() {
  const insideGoal = ball.x > canvas.width / 2 - 275 && ball.x < canvas.width / 2 + 275 && ball.y > 118 && ball.y < 273;
  const keeperReach = Math.abs(ball.x - keeper.x) < 55 && Math.abs(ball.y - keeper.y) < 58;
  const goal = insideGoal && !keeperReach;

  if (goal) score.right += 1;
  else score.left += 1;

  renderScore();

  ui.result.textContent = goal
    ? "⚽ GOOOL! A cobrança ficou mais precisa com os acertos em inglês."
    : "🧤 Defendido (ou fora)! Melhore as respostas para ganhar precisão.";

  ui.nextBtn.classList.remove("hidden");
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStadiumBackground();
  drawAdBoards();
  drawGoalAndNet();
  drawField();
  drawPlayerShadow();
  drawPlayer();
  drawKeeper();
  drawBallShadow();
  drawBall();
  addCinematicOverlay();
}

function drawStadiumBackground() {
  const topGrad = ctx.createLinearGradient(0, 0, 0, 280);
  topGrad.addColorStop(0, "#10151d");
  topGrad.addColorStop(0.55, "#2d3745");
  topGrad.addColorStop(1, "#4c5562");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, canvas.width, 280);

  for (let row = 0; row < 24; row += 1) {
    for (let col = 0; col < 70; col += 1) {
      const x = col * 15 + (row % 2 ? 4 : 0);
      const y = 16 + row * 7;
      const colorShift = (row + col) % 4;
      const shade = 95 + colorShift * 22;
      ctx.fillStyle = `rgba(${shade}, ${shade + 6}, ${shade + 16}, 0.16)`;
      ctx.fillRect(x, y, 3, 3);
    }
  }

  for (let i = 0; i < 12; i += 1) {
    const x = 35 + i * 80;
    ctx.fillStyle = "rgba(255,255,255,0.24)";
    ctx.fillRect(x, 32, 3, 90);
  }

  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(0, 186, canvas.width, 28);
}

function drawAdBoards() {
  const boardY = 236;
  const boardH = 44;
  const sections = 5;
  const boardW = canvas.width / sections;

  for (let i = 0; i < sections; i += 1) {
    const x = i * boardW;
    const grad = ctx.createLinearGradient(0, boardY, 0, boardY + boardH);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = grad;
    ctx.fillRect(x, boardY, boardW, boardH);

    ctx.strokeStyle = "#d2dae4";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, boardY, boardW, boardH);

    drawWizardLogo(x + boardW / 2, boardY + boardH / 2, 0.48);
  }
}

function drawWizardLogo(cx, cy, scale = 1) {
  const s = scale;

  // red mark (stylized circle/eagle)
  ctx.fillStyle = "#ef2037";
  ctx.beginPath();
  ctx.ellipse(cx - 92 * s, cy - 1 * s, 25 * s, 16 * s, -0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(cx - 88 * s, cy - 1 * s, 12 * s, 6 * s, -0.15, 0.2, Math.PI * 1.9);
  ctx.fill();

  // text WIZARD
  ctx.fillStyle = "#003866";
  ctx.font = `900 ${Math.round(22 * s)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("WIZARD", cx + 8 * s, cy - 3 * s);

  // subtitle by Pearson
  ctx.fillStyle = "#003866";
  ctx.font = `700 ${Math.round(12 * s)}px Arial`;
  ctx.fillText("by Pearson", cx + 6 * s, cy + 12 * s);
}

function drawGoalAndNet() {
  const goalX = canvas.width / 2 - 275;
  const goalY = 118;
  const goalW = 550;
  const goalH = 155;

  const netGrad = ctx.createLinearGradient(goalX, goalY, goalX, goalY + goalH);
  netGrad.addColorStop(0, "rgba(255,255,255,0.20)");
  netGrad.addColorStop(1, "rgba(255,255,255,0.09)");
  ctx.fillStyle = netGrad;
  ctx.fillRect(goalX, goalY, goalW, goalH);

  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 5;
  ctx.strokeRect(goalX, goalY, goalW, goalH);

  // posts thickness shadow
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = 3;
  ctx.strokeRect(goalX + 3, goalY + 3, goalW - 6, goalH - 6);

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(255,255,255,0.54)";
  for (let i = 0; i <= 26; i += 1) {
    const x = goalX + (goalW / 26) * i;
    ctx.beginPath();
    ctx.moveTo(x, goalY);
    ctx.lineTo(x, goalY + goalH);
    ctx.stroke();
  }

  for (let j = 0; j <= 12; j += 1) {
    const y = goalY + (goalH / 12) * j;
    ctx.beginPath();
    ctx.moveTo(goalX, y);
    ctx.lineTo(goalX + goalW, y);
    ctx.stroke();
  }
}

function drawField() {
  const fieldGrad = ctx.createLinearGradient(0, 268, 0, canvas.height);
  fieldGrad.addColorStop(0, "#66be26");
  fieldGrad.addColorStop(0.55, "#51aa17");
  fieldGrad.addColorStop(1, "#3a8f0f");
  ctx.fillStyle = fieldGrad;
  ctx.fillRect(0, 268, canvas.width, canvas.height - 268);

  for (let i = 0; i < 7; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
    ctx.fillRect(0, 272 + i * 38, canvas.width, 38);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 54);
  ctx.lineTo(canvas.width, canvas.height - 54);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(penaltySpot.x, penaltySpot.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
}

function drawPlayerShadow() {
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.beginPath();
  ctx.ellipse(player.x + 2, player.y + 52, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;

  ctx.fillStyle = "#dcf028";
  ctx.fillRect(x - 19, y - 74, 38, 48);
  ctx.fillStyle = "#1b2af4";
  ctx.fillRect(x - 19, y - 26, 38, 42);
  ctx.fillRect(x - 18, y + 16, 13, 34);
  ctx.fillRect(x + 5, y + 16, 13, 34);

  ctx.fillStyle = "#ffcc9a";
  ctx.fillRect(x - 26, y - 58, 8, 24);
  ctx.fillRect(x + 18, y - 58, 8, 24);

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(x, y - 88, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f8fbff";
  ctx.font = "bold 11px Arial";
  ctx.fillText("7", x - 3, y - 1);
}

function drawKeeper() {
  const x = keeper.x;
  const y = keeper.y;

  ctx.fillStyle = "#cf1f1f";
  ctx.fillRect(x - keeper.w / 2, y - keeper.h / 2, keeper.w, keeper.h);

  ctx.strokeStyle = "#ffd6d6";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - keeper.armSpan / 2, y - 15);
  ctx.lineTo(x + keeper.armSpan / 2, y - 15);
  ctx.stroke();

  ctx.fillStyle = "#ffcd8f";
  ctx.beginPath();
  ctx.arc(x, y - 50, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#cf1f1f";
  ctx.fillRect(x - 20, y + 36, 14, 42);
  ctx.fillRect(x + 6, y + 36, 14, 42);
}

function drawBallShadow() {
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(ball.x + 2, ball.y + 8, ball.radius + 2.5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBall() {
  const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.radius + 2);
  ballGrad.addColorStop(0, "#ffffff");
  ballGrad.addColorStop(1, "#dce3ea");
  ctx.fillStyle = ballGrad;

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function addCinematicOverlay() {
  const vignette = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    canvas.height * 0.25,
    canvas.width / 2,
    canvas.height / 2,
    canvas.height * 0.75,
  );

  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.22)");

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

ui.startBtn.addEventListener("click", resetRound);
ui.nextBtn.addEventListener("click", resetRound);

renderScore();
drawScene();
