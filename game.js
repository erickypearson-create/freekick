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

const score = { brazil: 1, portugal: 1 };
const keeperSprite = new Image();
keeperSprite.src = "assets/keeper-wizkid.svg";

const spot = { x: canvas.width / 2, y: canvas.height - 80 };

const player = {
  baseX: canvas.width / 2 - 90,
  baseY: canvas.height - 46,
  x: canvas.width / 2 - 90,
  y: canvas.height - 46,
  run: 0,
};

const ball = {
  x: spot.x + 32,
  y: spot.y - 2,
  radius: 22,
  t: 0,
  startX: spot.x + 32,
  startY: spot.y - 2,
  targetX: canvas.width / 2,
  targetY: 240,
  controlX: canvas.width / 2,
  controlY: 300,
  curve: 0,
  leftScore: document.getElementById("leftScore"),
  rightScore: document.getElementById("rightScore"),
};

const penaltySpot = { x: canvas.width / 2, y: canvas.height - 150 };
const score = { left: 13, right: 12 };

const player = {
  baseX: canvas.width / 2 - 120,
  baseY: canvas.height - 38,
  x: canvas.width / 2 - 120,
  y: canvas.height - 38,
  runProgress: 0,
  kickLeg: 0,
};

const ball = {
  x: penaltySpot.x,
  y: penaltySpot.y,
  radius: 9,
  startX: penaltySpot.x,
  startY: penaltySpot.y,
  targetX: penaltySpot.x,
  targetY: penaltySpot.y,
  controlX: penaltySpot.x,
  controlY: penaltySpot.y,
  curve: 0,
  t: 0,
  speed: 0.02,
};

const keeper = {
  baseX: canvas.width / 2,
  x: canvas.width / 2,
  y: 234,
  dive: "stand", // left,right,up,crouch
  level: "mid", // low,mid,high
  p: 0,
  reactionDelay: 0.2,
  pose: { handX: canvas.width / 2, handY: 226, reachX: 52, reachY: 36 },
};

  y: 206,
  width: 62,
  height: 76,
  armSpan: 110,
  idlePhase: 0,
  diveType: "stand", // left/right/centerHigh/centerLow/stand
  diveHeight: "mid", // low/mid/high
  diveProgress: 0,
  reactionDelay: 0.18,
  currentPose: { handX: canvas.width / 2, handY: 195, reachX: 54, reachY: 44 },
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
  phase: "idle", // idle, runup, flight, done
  index: 0,
  answers: {},
  precisionBonus: 0,
  shot: null,
  time: 0,
};

const layers = {
  background: document.createElement("canvas"),
};
layers.background.width = canvas.width;
layers.background.height = canvas.height;
const bgCtx = layers.background.getContext("2d");

function buildStaticBackground() {
  const w = canvas.width;
  const h = canvas.height;

  bgCtx.clearRect(0, 0, w, h);

  // sky
  bgCtx.fillStyle = "#77d0f0";
  bgCtx.fillRect(0, 0, w, 170);

  // ad stripe behind goal
  bgCtx.fillStyle = "#d33b3b";
  bgCtx.fillRect(0, 170, 220, 65);
  bgCtx.fillStyle = "#39b7c8";
  bgCtx.fillRect(220, 170, 520, 65);
  bgCtx.fillStyle = "#f0c812";
  bgCtx.fillRect(740, 170, 220, 65);

  // light green horizon strip
  bgCtx.fillStyle = "#a6d86c";
  bgCtx.fillRect(0, 235, w, 75);

  // grass
  const grass = bgCtx.createLinearGradient(0, 310, 0, h);
  grass.addColorStop(0, "#79c734");
  grass.addColorStop(1, "#4ba22a");
  bgCtx.fillStyle = grass;
  bgCtx.fillRect(0, 310, w, h - 310);

  // penalty area in perspective (straight, proportional)
  bgCtx.strokeStyle = "#ffffff";
  bgCtx.lineWidth = 6;
  bgCtx.beginPath();
  bgCtx.moveTo(10, 342);
  bgCtx.lineTo(950, 342);
  bgCtx.lineTo(900, 445);
  bgCtx.lineTo(60, 445);
  bgCtx.closePath();
  bgCtx.stroke();

  // goal with depth
  const gx = 200;
  const gy = 102;
  const gw = 560;
  const gh = 175;
  const depth = 20;

  bgCtx.strokeStyle = "#ffffff";
  bgCtx.lineWidth = 8;
  bgCtx.beginPath();
  bgCtx.moveTo(gx, gy);
  bgCtx.lineTo(gx + gw, gy);
  bgCtx.lineTo(gx + gw, gy + gh);
  bgCtx.lineTo(gx, gy + gh);
  bgCtx.closePath();
  bgCtx.stroke();

  // depth edges
  bgCtx.beginPath();
  bgCtx.moveTo(gx, gy);
  bgCtx.lineTo(gx - depth, gy + depth);
  bgCtx.lineTo(gx - depth, gy + gh + depth);
  bgCtx.lineTo(gx, gy + gh);
  bgCtx.stroke();

  bgCtx.beginPath();
  bgCtx.moveTo(gx + gw, gy);
  bgCtx.lineTo(gx + gw + depth, gy + depth);
  bgCtx.lineTo(gx + gw + depth, gy + gh + depth);
  bgCtx.lineTo(gx + gw, gy + gh);
  bgCtx.stroke();

  bgCtx.beginPath();
  bgCtx.moveTo(gx - depth, gy + depth);
  bgCtx.lineTo(gx + gw + depth, gy + depth);
  bgCtx.stroke();

  // net (front)
  bgCtx.strokeStyle = "#eaf8ff";
  bgCtx.lineWidth = 1.5;
  for (let i = 1; i < 28; i += 1) {
    const x = gx + (gw / 28) * i;
    bgCtx.beginPath();
    bgCtx.moveTo(x, gy);
    bgCtx.lineTo(x, gy + gh);
    bgCtx.stroke();
  }
  for (let j = 1; j < 13; j += 1) {
    const y = gy + (gh / 13) * j;
    bgCtx.beginPath();
    bgCtx.moveTo(gx, y);
    bgCtx.lineTo(gx + gw, y);
    bgCtx.stroke();
  }

  // boards branding Wizard (aligned and single layer)
  drawWizardBoard(bgCtx, 110, 203, 180, 46);
  drawWizardBoard(bgCtx, 340, 203, 180, 46);
  drawWizardBoard(bgCtx, 570, 203, 180, 46);
  drawWizardBoard(bgCtx, 800, 203, 150, 46);

  // right-top icons
  drawCircleIcon(bgCtx, 900, 24, "?");
  drawCircleIcon(bgCtx, 940, 24, "⚙");
}

function drawWizardBoard(targetCtx, cx, cy, w, h) {
  targetCtx.fillStyle = "rgba(255,255,255,0.35)";
  targetCtx.fillRect(cx - w / 2, cy - h / 2, w, h);

  targetCtx.fillStyle = "#ef2037";
  targetCtx.beginPath();
  targetCtx.ellipse(cx - w * 0.34, cy - 2, h * 0.19, h * 0.27, 0, 0, Math.PI * 2);
  targetCtx.fill();

  targetCtx.fillStyle = "#003866";
  targetCtx.font = "bold 16px Arial";
  targetCtx.textAlign = "center";
  targetCtx.textBaseline = "middle";
  targetCtx.fillText("WIZARD", cx + 12, cy - 4);
  targetCtx.font = "bold 10px Arial";
  targetCtx.fillText("by Pearson", cx + 10, cy + 10);
}

function drawCircleIcon(targetCtx, x, y, symbol) {
  targetCtx.fillStyle = "#e9f3f8";
  targetCtx.beginPath();
  targetCtx.arc(x, y, 18, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.strokeStyle = "#2d89a8";
  targetCtx.lineWidth = 3;
  targetCtx.stroke();
  targetCtx.fillStyle = "#2d89a8";
  targetCtx.font = "bold 22px Arial";
  targetCtx.textAlign = "center";
  targetCtx.textBaseline = "middle";
  targetCtx.fillText(symbol, x, y + 1);
}

function randomCorrectness() {
  return Math.random() > 0.35;
}

function resetRound() {
  state.phase = "idle";
  index: 0,
  answers: {},
  precisionBonus: 0,
  phase: "idle", // idle, runup, flight, done
  shot: null,
  time: 0,
  shot: null,
  running: false,
  ballProgress: 0,
};

function resetRound() {
  state.index = 0;
  state.answers = {};
  state.precisionBonus = 0;
  state.shot = null;

  player.x = player.baseX;
  player.run = 0;

  ball.t = 0;
  ball.x = spot.x + 32;
  ball.y = spot.y - 2;

  keeper.x = keeper.baseX;
  keeper.dive = "stand";
  keeper.level = "mid";
  keeper.p = 0;

  ui.summary.innerHTML = "";
  ui.nextBtn.classList.add("hidden");
  showStep();
  state.phase = "idle";

  player.x = player.baseX;
  player.y = player.baseY;
  player.runProgress = 0;
  player.kickLeg = 0;

  ball.x = penaltySpot.x;
  ball.y = penaltySpot.y;
  ball.t = 0;

  keeper.x = keeper.baseX;
  keeper.diveType = "stand";
  keeper.diveHeight = "mid";
  keeper.diveProgress = 0;

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
  if (!step) {
    resetRound();
    return;
  }
  ui.phase.textContent = step.label;
  ui.question.textContent = step.question;
  ui.result.textContent = "Responda para aumentar precisão.";
  ui.answers.innerHTML = "";

  step.options.forEach((option) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.addEventListener("click", () => answerStep(option));
    ui.answers.appendChild(button);
  });
}

function answerStep(choice) {
  if (state.phase === "runup" || state.phase === "flight") return;

  const step = steps[state.index];
  if (!step) return;

  Array.from(ui.answers.querySelectorAll("button")).forEach((btn) => {
    btn.disabled = true;
  });

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
  if (state.phase === "runup" || state.phase === "flight") return;

  if (state.running) return;
  const step = steps[state.index];
  const correct = randomCorrectness();
  state.answers[step.key] = { choice, correct };

  if (correct) {
    state.precisionBonus += 0.12;
    ui.result.textContent = `✅ Correct placeholder answer! ${step.label} mais precisa.`;
  } else {
    ui.result.textContent = `❌ Placeholder answer missed. ${step.label} menos precisa.`;
    ui.result.textContent = `✅ Correct placeholder answer! ${step.label} ficou mais precisa.`;
  } else {
    ui.result.textContent = `❌ Placeholder answer missed. ${step.label} com menos precisão.`;
  }

  state.index += 1;
  if (state.index < steps.length) {
    showStep();
    return;
  }

  prepareShot();
  state.phase = "runup";
  ui.phase.textContent = "Run-up";
  ui.question.textContent = "Corrida para o chute...";
  ui.answers.innerHTML = "";
}

function prepareShot() {
  startRunup();
}

function prepareShot() {
  calculateShot();
  animateShot();
}

function calculateShot() {
  const direction = state.answers.direction.choice;
  const height = state.answers.height.choice;
  const power = state.answers.power.choice;
  const spin = state.answers.spin.choice;

  let targetX = canvas.width / 2;
  if (direction.includes("Left")) targetX = canvas.width / 2 - 180;
  if (direction.includes("Right")) targetX = canvas.width / 2 + 180;

  let targetY = 250;
  if (height === "Mid") targetY = 210;
  if (height === "Top corner") targetY = 170;

  let speed = 0.018;
  if (power === "Balanced") speed = 0.022;
  if (power === "Powerful") speed = 0.027;

  let curve = 0;
  if (spin.includes("3 dedos")) curve = direction.includes("Left") ? 44 : -44;
  if (spin.includes("cavadinha")) {
    targetY -= 18;
    speed = 0.019;
  }

  const precision = Math.min(0.4, state.precisionBonus);
  targetX += (Math.random() - 0.5) * 150 * (1 - precision);
  targetY += (Math.random() - 0.5) * 90 * (1 - precision);
  if (direction.includes("Left")) targetX = canvas.width / 2 - 225;
  if (direction.includes("Right")) targetX = canvas.width / 2 + 225;

  let targetY = 192;
  if (height === "Low") targetY = 248;
  if (height === "Top corner") targetY = 132;

  let speed = 0.016;
  if (direction.includes("Left")) targetX = canvas.width / 2 - 220;
  if (direction.includes("Right")) targetX = canvas.width / 2 + 220;

  let targetY = 188;
  if (height === "Low") targetY = 245;
  if (height === "Top corner") targetY = 133;

  let speed = 0.017;
  if (power === "Balanced") speed = 0.021;
  if (power === "Powerful") speed = 0.026;

  let curve = 0;
  if (spin.includes("3 dedos")) curve = direction.includes("Left") ? 66 : -66;
  if (spin.includes("cavadinha")) {
    targetY -= 34;
    speed = 0.018;
  }

  const precision = Math.min(0.4, state.precisionBonus);
  targetX += (Math.random() - 0.5) * 165 * (1 - precision);
  targetY += (Math.random() - 0.5) * 110 * (1 - precision);

  const shotZone = classifyShotZone(targetX, targetY);

  state.shot = {
    direction,
    height,
    power,
    spin,
    precision,
    targetX,
    targetY,
    speed,
    curve,
    zone: classifyZone(targetX, targetY),
  };
    shotZone,
  };
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
    <p><strong>Precisão:</strong> ${(precision * 100).toFixed(0)}%</p>
  `;
}

function classifyZone(x, y) {
  const horizontal = x < canvas.width / 2 - 55 ? "left" : x > canvas.width / 2 + 55 ? "right" : "center";
  const vertical = y > 235 ? "low" : y > 190 ? "mid" : "high";
  return { horizontal, vertical };
}

function startFlight() {
  state.phase = "flight";
  ui.phase.textContent = "Shot";
  ui.question.textContent = "Bola em movimento...";

  ball.startX = spot.x + 32;
  ball.startY = spot.y - 2;
  ball.targetX = state.shot.targetX;
  ball.targetY = state.shot.targetY;
  ball.controlX = (ball.startX + ball.targetX) / 2;

  const arc = state.shot.height === "Top corner" ? 34 : state.shot.height === "Mid" ? 24 : 8;
  const chip = state.shot.spin.includes("cavadinha") ? 20 : 0;
  ball.controlY = Math.min(ball.startY, ball.targetY) - arc - chip;
  ball.curve = state.shot.curve;
  ball.speed = state.shot.speed;
  ball.t = 0;

  defineKeeperReaction();
}

function defineKeeperReaction() {
  const { horizontal, vertical } = state.shot.zone;
  keeper.p = 0;

  if (horizontal === "center" && vertical === "high") {
    keeper.dive = "up";
    keeper.level = "high";
    return;
  }
  if (horizontal === "center" && vertical === "low") {
    keeper.dive = "crouch";
    keeper.level = "low";
    return;
  }

  keeper.dive = horizontal === "left" ? "left" : horizontal === "right" ? "right" : "stand";
  keeper.level = vertical;
    <p><strong>Bônus de precisão:</strong> ${(precision * 100).toFixed(0)}%</p>
  `;
}

function classifyShotZone(x, y) {
  const horizontal = x < canvas.width / 2 - 70 ? "left" : x > canvas.width / 2 + 70 ? "right" : "center";
  const vertical = y > 224 ? "low" : y > 170 ? "mid" : "high";
  return { horizontal, vertical };
}

function startRunup() {
  state.phase = "runup";
  ui.phase.textContent = "Run-up";
  ui.question.textContent = "Corrida para a bola...";
  ui.answers.innerHTML = "";
}

function beginBallFlight() {
  state.phase = "flight";
  ui.phase.textContent = "Shot";
  ui.question.textContent = "Chute em andamento...";

  ball.startX = penaltySpot.x;
  ball.startY = penaltySpot.y;
  ball.targetX = state.shot.targetX;
  ball.targetY = state.shot.targetY;
  ball.t = 0;
  ball.speed = state.shot.speed;
  ball.curve = state.shot.curve;

  const arcBoost = state.shot.height === "Top corner" ? 28 : state.shot.height === "Mid" ? 18 : 8;
  const chipBoost = state.shot.spin.includes("cavadinha") ? 22 : 0;
  ball.controlX = (ball.startX + ball.targetX) / 2;
  ball.controlY = Math.min(ball.startY, ball.targetY) - arcBoost - chipBoost;

  defineKeeperDive();
}

function defineKeeperDive() {
  const zone = state.shot.shotZone;
  keeper.diveProgress = 0;

  if (zone.horizontal === "center" && zone.vertical === "high") {
    keeper.diveType = "centerHigh";
    keeper.diveHeight = "high";
    return;
  }

  if (zone.horizontal === "center" && zone.vertical === "low") {
    keeper.diveType = "centerLow";
    keeper.diveHeight = "low";
    return;
  }

  keeper.diveType = zone.horizontal === "left" ? "left" : zone.horizontal === "right" ? "right" : "stand";
  keeper.diveHeight = zone.vertical;
}

function updatePhysics(dt) {
  if (state.phase === "runup") {
    const runBoost = state.shot.spin.includes("dancinha") ? 1.25 : 1;
    player.run = Math.min(1, player.run + dt * 2.3 * runBoost);
    player.x = lerp(player.baseX, spot.x - 82, player.run) + Math.sin(player.run * Math.PI * 2) * 6;

    if (player.run >= 1) startFlight();
  }

  if (state.phase === "flight") {
    ball.t = Math.min(1, ball.t + dt * ball.speed * 60);
    const t = ball.t;

    ball.x = bezier(ball.startX, ball.controlX, ball.targetX, t) + Math.sin(t * Math.PI) * ball.curve;
    ball.y = bezier(ball.startY, ball.controlY, ball.targetY, t) + t * t * 8;

    updateKeeper(t, dt);

    if (t >= 1) finalizeShot();
  }
}

function updateKeeper(ballProgress, dt) {
  if (ballProgress < keeper.reactionDelay) return;

  keeper.p = Math.min(1, keeper.p + dt * 3.4);
  const p = easeOut(keeper.p);

  if (keeper.dive === "left") keeper.x = keeper.baseX - 115 * p;
  else if (keeper.dive === "right") keeper.x = keeper.baseX + 115 * p;
  else keeper.x = keeper.baseX;
    const runSpeed = state.shot.spin.includes("dancinha") ? 1.3 : 1;
    player.runProgress = Math.min(1, player.runProgress + dt * 2.4 * runSpeed);

    const runCurve = Math.sin(player.runProgress * Math.PI) * 10;
    player.x = lerp(player.baseX, penaltySpot.x - 18, player.runProgress) + runCurve;
    player.kickLeg = Math.sin(player.runProgress * Math.PI * 4);

    if (player.runProgress >= 1) {
      beginBallFlight();
    }
  }

  if (state.phase === "flight") {
    ball.t = Math.min(1, ball.t + dt * (ball.speed * 60));

    const t = ball.t;
    const bx = quadraticBezier(ball.startX, ball.controlX, ball.targetX, t);
    const by = quadraticBezier(ball.startY, ball.controlY, ball.targetY, t);

    // curva lateral progressiva para dar fluidez
    const sideCurve = Math.sin(t * Math.PI) * ball.curve;
    // pequeno efeito de gravidade no final
    const gravityDrop = t * t * 10;

    ball.x = bx + sideCurve;
    ball.y = by + gravityDrop;

    updateKeeperDive(t, dt);

    if (t >= 1) {
      finalizeShot();
    }
  }
}

function updateKeeperDive(ballT, dt) {
  keeper.idlePhase += dt * 2.2;

  if (ballT < keeper.reactionDelay) {
    return;
  }

  keeper.diveProgress = Math.min(1, keeper.diveProgress + dt * 3.2);
  const p = easeOutCubic(keeper.diveProgress);

  if (keeper.diveType === "left") {
    keeper.x = keeper.baseX - 130 * p;
  } else if (keeper.diveType === "right") {
    keeper.x = keeper.baseX + 130 * p;
  } else {
    keeper.x = keeper.baseX;
  }
}

function finalizeShot() {
  state.phase = "done";

  const inGoal = ball.x > 190 && ball.x < 770 && ball.y > 130 && ball.y < 315;
  const saved = keeperSave(ball.x, ball.y);
  const goal = inGoal && !saved;

  if (goal) score.portugal += 1;
  else score.brazil += 1;

  ui.result.textContent = goal ? "⚽ GOOOL!" : "🧤 DEFESA!";
  ui.nextBtn.classList.remove("hidden");
}

function keeperSave(x, y) {
  const p = keeper.pose;
  return Math.abs(x - p.handX) < p.reachX && Math.abs(y - p.handY) < p.reachY;
}

function bezier(a, b, c, t) {
  const p0 = lerp(a, b, t);
  const p1 = lerp(b, c, t);
  return lerp(p0, p1, t);
  const insideGoal = ball.x > canvas.width / 2 - 275 && ball.x < canvas.width / 2 + 275 && ball.y > 118 && ball.y < 273;
  const save = isKeeperSave(ball.x, ball.y);
  const goal = insideGoal && !save;
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
    ? "⚽ GOOOL! Bola com trajetória mais fluida e chute preciso."
    : "🧤 Defesa do goleiro! Ele reagiu com salto/alcance físico.";
    ? "⚽ GOOOL! A cobrança ficou mais precisa com os acertos em inglês."
    : "🧤 Defendido (ou fora)! Melhore as respostas para ganhar precisão.";

  ui.nextBtn.classList.remove("hidden");
}

function isKeeperSave(ballX, ballY) {
  const pose = keeper.currentPose;
  const dx = Math.abs(ballX - pose.handX);
  const dy = Math.abs(ballY - pose.handY);
  return dx < pose.reachX && dy < pose.reachY;
}

function quadraticBezier(p0, p1, p2, t) {
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  return lerp(a, b, t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOut(t) {
function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(layers.background, 0, 0, canvas.width, canvas.height);
  drawKeeper();
  drawPlayer();
  drawBall();
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.20)";
  ctx.beginPath();
  ctx.ellipse(x + 12, y + 56, 23, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // body organic
  ctx.save();
  ctx.translate(x, y);

  // head/hair
  ctx.fillStyle = "#6f431b";
  ctx.beginPath();
  ctx.ellipse(0, -86, 23, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // neck
  ctx.fillStyle = "#e7bc8d";
  ctx.beginPath();
  ctx.ellipse(0, -62, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // torso shirt (curved)
  ctx.fillStyle = "#f3df25";
  ctx.strokeStyle = "#267038";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, -60);
  ctx.quadraticCurveTo(-34, -26, -26, 18);
  ctx.lineTo(26, 18);
  ctx.quadraticCurveTo(34, -26, 30, -60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // number
  ctx.fillStyle = "#1f9e45";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("10", 0, -14);

  // shorts
  ctx.fillStyle = "#1550b8";
  ctx.beginPath();
  ctx.moveTo(-26, 18);
  ctx.lineTo(26, 18);
  ctx.lineTo(21, 62);
  ctx.lineTo(-21, 62);
  ctx.closePath();
  ctx.fill();

  // arms (curved capsules)
  drawCapsule(ctx, -34, -42, -40, 2, 7, "#e7bc8d");
  drawCapsule(ctx, 34, -42, 40, 2, 7, "#e7bc8d");

  // legs with run swing
  const swing = state.phase === "runup" ? Math.sin(player.run * Math.PI * 5) * 8 : 0;
  drawLeg(-11, 62, -4, 130, -3);
  drawLeg(11, 62, 4 + swing * 0.22, 130, swing);

  ctx.restore();
}

function drawLeg(x1, y1, x2, y2, angleDeg) {
  ctx.save();
  ctx.translate(player.x + x1, player.y + y1);
  ctx.rotate((angleDeg * Math.PI) / 180);
  drawCapsule(ctx, 0, 0, x2 - x1, y2 - y1, 8, "#ffffff");
  ctx.restore();
}

function drawCapsule(targetCtx, x1, y1, x2, y2, r, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;

  targetCtx.fillStyle = color;
  targetCtx.beginPath();
  targetCtx.moveTo(x1 + nx * r, y1 + ny * r);
  targetCtx.lineTo(x2 + nx * r, y2 + ny * r);
  targetCtx.arc(x2, y2, r, Math.atan2(ny, nx), Math.atan2(-ny, -nx));
  targetCtx.lineTo(x1 - nx * r, y1 - ny * r);
  targetCtx.arc(x1, y1, r, Math.atan2(-ny, -nx), Math.atan2(ny, nx));
  targetCtx.closePath();
  targetCtx.fill();
}

function drawKeeper() {
  const idle = state.phase === "idle" ? Math.sin(state.time * 2.4) * 4 : 0;
  const x = keeper.x + idle;
  let y = keeper.y;
  let tilt = 0;
  let scaleY = 1;

  if (state.phase === "flight") {
    const p = easeOut(keeper.p);
    if (keeper.dive === "left") {
      y += keeper.level === "low" ? 16 * p : keeper.level === "high" ? -18 * p : -4 * p;
      tilt = -20 * p;
    } else if (keeper.dive === "right") {
      y += keeper.level === "low" ? 16 * p : keeper.level === "high" ? -18 * p : -4 * p;
      tilt = 20 * p;
    } else if (keeper.dive === "up") {
      y -= 24 * p;
    } else if (keeper.dive === "crouch") {
      y += 14 * p;
      scaleY = 0.88;
    }
  }

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y + 68, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const spriteW = 110;
  const spriteH = 130;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((tilt * Math.PI) / 180);
  ctx.scale(1, scaleY);

  if (keeperSprite.complete && keeperSprite.naturalWidth > 0) {
    // desenha exatamente o personagem de referência como sprite
    ctx.drawImage(keeperSprite, -spriteW / 2, -spriteH / 2, spriteW, spriteH);
  } else {
    // fallback enquanto imagem carrega
    ctx.fillStyle = "#d8d8d8";
    ctx.fillRect(-25, -25, 50, 70);
  }

  ctx.restore();

  // hitbox da defesa mantém mecânica original
  keeper.pose = {
    handX: x,
    handY: y - 8,
    reachX: keeper.dive === "left" || keeper.dive === "right" ? 62 : 52,
    reachY: keeper.dive === "crouch" ? 30 : 38,
  };
}

function drawBall() {

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.beginPath();
  ctx.ellipse(ball.x + 3, ball.y + 9, ball.radius + 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ball base
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // simple panels
  ctx.fillStyle = "#3a3a3a";
  ctx.beginPath();
  ctx.arc(ball.x - 7, ball.y - 4, 5, 0, Math.PI * 2);
  ctx.arc(ball.x + 8, ball.y + 2, 4.5, 0, Math.PI * 2);
  ctx.fill();
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
  const legSwing = state.phase === "runup" ? player.kickLeg * 10 : 0;
  const bodyLean = state.phase === "runup" ? player.runProgress * 8 : 0;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "#dcf028";
  ctx.fillRect(-19, -74, 38, 48);

  ctx.fillStyle = "#1b2af4";
  ctx.fillRect(-19, -26, 38, 42);

  // pernas com movimento humano
  ctx.save();
  ctx.translate(-11, 16);
  ctx.rotate((-8 - bodyLean) * (Math.PI / 180));
  ctx.fillRect(-6, 0, 12, 34);
  ctx.restore();

  ctx.save();
  ctx.translate(11, 16);
  ctx.rotate((12 + legSwing) * (Math.PI / 180));
  ctx.fillRect(-6, 0, 12, 34);
  ctx.restore();

  // braços
  ctx.fillStyle = "#ffcc9a";
  ctx.save();
  ctx.translate(-22, -56);
  ctx.rotate((-18 + legSwing * 0.5) * (Math.PI / 180));
  ctx.fillRect(-4, 0, 8, 24);
  ctx.restore();

  ctx.save();
  ctx.translate(22, -56);
  ctx.rotate((24 - legSwing * 0.5) * (Math.PI / 180));
  ctx.fillRect(-4, 0, 8, 24);
  ctx.restore();

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(0, -88, 13, 0, Math.PI * 2);

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
  ctx.fillText("7", -3, -1);
  ctx.restore();
}

function drawKeeper() {
  const idleOffset = state.phase === "idle" ? Math.sin(state.time * 2.2) * 8 : 0;
  const idleBob = state.phase === "idle" ? Math.sin(state.time * 4.2) * 1.5 : 0;
  const x = keeper.x + idleOffset;

  let diveX = x;
  let diveY = keeper.y + idleBob;
  let bodyTilt = 0;
  let armLift = 0;
  let armSpread = keeper.armSpan;

  if (state.phase === "flight") {
    const p = easeOutCubic(keeper.diveProgress);

    if (keeper.diveType === "left") {
      diveX = x - 120 * p;
      bodyTilt = -35 * p;
      armLift = keeper.diveHeight === "high" ? -28 : keeper.diveHeight === "low" ? 16 : -8;
      diveY += keeper.diveHeight === "high" ? -26 * p : keeper.diveHeight === "low" ? 16 * p : -5 * p;
      armSpread = 132;
    } else if (keeper.diveType === "right") {
      diveX = x + 120 * p;
      bodyTilt = 35 * p;
      armLift = keeper.diveHeight === "high" ? -28 : keeper.diveHeight === "low" ? 16 : -8;
      diveY += keeper.diveHeight === "high" ? -26 * p : keeper.diveHeight === "low" ? 16 * p : -5 * p;
      armSpread = 132;
    } else if (keeper.diveType === "centerHigh") {
      diveY -= 28 * p;
      armLift = -34;
      armSpread = 124;
    } else if (keeper.diveType === "centerLow") {
      diveY += 16 * p;
      armLift = 22;
      armSpread = 94;
    }
  }

  ctx.save();
  ctx.translate(diveX, diveY);
  ctx.rotate(bodyTilt * (Math.PI / 180));

  ctx.fillStyle = "#cf1f1f";
  ctx.fillRect(-keeper.width / 2, -keeper.height / 2, keeper.width, keeper.height);
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
  ctx.moveTo(-armSpread / 2, -15 + armLift);
  ctx.lineTo(armSpread / 2, -15 + armLift);
  ctx.moveTo(x - keeper.armSpan / 2, y - 15);
  ctx.lineTo(x + keeper.armSpan / 2, y - 15);
  ctx.stroke();

  ctx.fillStyle = "#ffcd8f";
  ctx.beginPath();
  ctx.arc(0, -50, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#cf1f1f";
  ctx.fillRect(-20, 36, 14, 42);
  ctx.fillRect(6, 36, 14, 42);

  ctx.restore();

  keeper.currentPose = {
    handX: diveX,
    handY: diveY - 15 + armLift,
    reachX: armSpread / 2,
    reachY: keeper.diveType === "centerLow" ? 30 : keeper.diveType === "centerHigh" ? 34 : 40,
  };
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

function gameLoop(timestamp) {
  if (!gameLoop.last) gameLoop.last = timestamp;
  const dt = Math.min((timestamp - gameLoop.last) / 1000, 0.033);
  gameLoop.last = timestamp;

  state.time += dt;
  updatePhysics(dt);
  drawScene();
  requestAnimationFrame(gameLoop);
}

gameLoop.last = 0;

ui.startBtn.addEventListener("click", resetRound);
ui.nextBtn.addEventListener("click", resetRound);

buildStaticBackground();
resetRound();
requestAnimationFrame(gameLoop);
renderScore();
resetRound();
requestAnimationFrame(gameLoop);
drawScene();
