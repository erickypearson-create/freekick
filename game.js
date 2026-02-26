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
  phase: "idle", // idle, runup, flight, done
  shot: null,
  time: 0,
};

function resetRound() {
  state.index = 0;
  state.answers = {};
  state.precisionBonus = 0;
  state.shot = null;
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

  ui.summary.innerHTML = "";
  ui.nextBtn.classList.add("hidden");
  renderScore();
  showStep();
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
  if (state.phase === "runup" || state.phase === "flight") return;

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

  prepareShot();
  startRunup();
}

function prepareShot() {
  const direction = state.answers.direction.choice;
  const height = state.answers.height.choice;
  const power = state.answers.power.choice;
  const spin = state.answers.spin.choice;

  let targetX = canvas.width / 2;
  if (direction.includes("Left")) targetX = canvas.width / 2 - 225;
  if (direction.includes("Right")) targetX = canvas.width / 2 + 225;

  let targetY = 192;
  if (height === "Low") targetY = 248;
  if (height === "Top corner") targetY = 132;

  let speed = 0.016;
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
    shotZone,
  };

  ui.summary.innerHTML = `
    <p><strong>Direção:</strong> ${direction}</p>
    <p><strong>Altura:</strong> ${height}</p>
    <p><strong>Força:</strong> ${power}</p>
    <p><strong>Efeito:</strong> ${spin}</p>
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

  const insideGoal = ball.x > canvas.width / 2 - 275 && ball.x < canvas.width / 2 + 275 && ball.y > 118 && ball.y < 273;
  const save = isKeeperSave(ball.x, ball.y);
  const goal = insideGoal && !save;

  if (goal) score.right += 1;
  else score.left += 1;

  renderScore();

  ui.result.textContent = goal
    ? "⚽ GOOOL! Bola com trajetória mais fluida e chute preciso."
    : "🧤 Defesa do goleiro! Ele reagiu com salto/alcance físico.";

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

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
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

  ctx.fillStyle = "#ef2037";
  ctx.beginPath();
  ctx.ellipse(cx - 92 * s, cy - 1 * s, 25 * s, 16 * s, -0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(cx - 88 * s, cy - 1 * s, 12 * s, 6 * s, -0.15, 0.2, Math.PI * 1.9);
  ctx.fill();

  ctx.fillStyle = "#003866";
  ctx.font = `900 ${Math.round(22 * s)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("WIZARD", cx + 8 * s, cy - 3 * s);

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

  ctx.strokeStyle = "#ffd6d6";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-armSpread / 2, -15 + armLift);
  ctx.lineTo(armSpread / 2, -15 + armLift);
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

renderScore();
resetRound();
requestAnimationFrame(gameLoop);
