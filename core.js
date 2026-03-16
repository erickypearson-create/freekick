(function () {
"use strict";

if (window.__freekickBooted) return;
window.__freekickBooted = true;

const canvas = document.getElementById("pitch");
const ctx = canvas.getContext("2d");

const ui = {
  phase: document.getElementById("phase"),
  question: document.getElementById("question"),
  result: document.getElementById("result"),
  answers: document.getElementById("answers"),
  commandChoices: document.getElementById("commandChoices"),
  startBtn: document.getElementById("startBtn"),
  nextBtn: document.getElementById("nextBtn"),
  phaseHint: document.getElementById("phaseHint"),
  questionHint: document.getElementById("questionHint"),
  phaseActionBtn: document.getElementById("phaseActionBtn"),
  summary: document.getElementById("summary"),
  fileInput: document.getElementById("questionFile"),
  modeSelect: document.getElementById("questionMode"),
  loadQuestionsBtn: document.getElementById("loadQuestionsBtn"),
  downloadTemplateBtn: document.getElementById("downloadTemplateBtn"),
  uploadInfo: document.getElementById("uploadInfo"),
};

const STORAGE_KEY = "freekick-question-bank-v6";
const DIMENSIONS = ["direction", "height", "power"];
const LABELS = {
  direction: "Direção",
  height: "Altura",
  power: "Força",
};
const DISPLAY_DIMENSIONS = {
  direction: "direction",
  height: "height",
  power: "strength",
};
const PHASE_HINTS = {
  direction: "Escolha a direção que você quer chutar a bola.",
  height: "Escolha a altura para o seu chute.",
  power: "Escolha a força para o seu chute.",
};
const QUESTION_HINTS = {
  direction: "Para que sua direção seja confirmada, responda a pergunta.",
  height: "Para que seu chute vá na altura certa, responda a pergunta.",
  power: "Para que o chute saia na força desejada, responda a pergunta.",
};
const OPTIONS = {
  direction: ["left", "center", "right"],
  height: ["low", "mid", "high"],
  power: ["weak", "medium", "strong"],
};
const OPTION_LABELS = {
  left: "Esquerda",
  center: "Meio",
  right: "Direita",
  low: "Baixo",
  mid: "Médio",
  high: "Alto",
  weak: "Fraco",
  medium: "Médio",
  strong: "Forte",
};

const BALL_START = { x: canvas.width / 2, y: canvas.height - 74 };
const GOAL = { x: 64, y: 122, w: canvas.width - 128, h: 114 };
const KEEPER_BASE_Y = GOAL.y + GOAL.h - 8;
const PENALTY_AREA = {
  top: GOAL.y + GOAL.h + 34,
  sideInsetTop: 40,
  sideInsetBottom: 10,
  bottom: canvas.height - 26,
};
const KICKER_ANIMATION_MS = 460;

const ENGLISH_POOL = {
  grammar: [
    { prompt: "Choose the correct sentence:", correct: "She lives in a small house.", wrong: ["She live in a small house.", "She living in a small house.", "She lives at a small house."] },
    { prompt: "Choose the correct option:", correct: "He doesn't like rainy days.", wrong: ["He don't likes rainy days.", "He doesn't likes rainy days.", "He not like rainy days."] },
    { prompt: "Pick the grammatically correct sentence:", correct: "Where does your brother work?", wrong: ["Where do your brother works?", "Where does your brother works?", "Where your brother does work?"] },
  ],
  vocabulary: [
    { prompt: "Choose the best synonym for 'happy':", correct: "glad", wrong: ["angry", "tired", "lazy"] },
    { prompt: "Choose the opposite of 'difficult':", correct: "easy", wrong: ["heavy", "noisy", "dangerous"] },
    { prompt: "Choose the word that completes: 'I ___ breakfast at 7:00.'", correct: "have", wrong: ["am", "do", "make"] },
  ],
};

const state = {
  phase: "idle",
  index: 0,
  roundQuestions: [],
  roundAnswers: {},
  selectedAnswers: {},
  playerChoices: {},
  bank: { mode: "ordered", questions: [], pointer: 0 },
  outcome: "-",
  ball: {
    x: BALL_START.x,
    y: BALL_START.y,
    t: 0,
    speed: 0.022,
    startX: BALL_START.x,
    startY: BALL_START.y,
    controlX: BALL_START.x,
    controlY: 340,
    targetX: canvas.width / 2,
    targetY: 255,
  },
  keeper: {
    x: canvas.width / 2,
    startX: canvas.width / 2,
    targetX: canvas.width / 2,
  },
  kicker: {
    x: BALL_START.x,
    y: BALL_START.y + 62,
    runStartY: BALL_START.y + 62,
    runEndY: BALL_START.y + 20,
    runProgress: 0,
    legSwing: 0,
  },
};

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomExcluding(arr, excluded) {
  const pool = arr.filter((v) => v !== excluded);
  return randomChoice(pool);
}

function isValid(q) {
  return q
    && DIMENSIONS.includes(q.dimension)
    && q.prompt
    && Array.isArray(q.choices)
    && q.choices.length >= 2
    && ["A", "B", "C", "D"].includes(q.correctAnswer)
    && OPTIONS[q.dimension].includes(q.commandValue);
}

function buildRandomEnglishQuestion(dimension) {
  const base = randomChoice(Math.random() > 0.5 ? ENGLISH_POOL.grammar : ENGLISH_POOL.vocabulary);
  const options = shuffle([base.correct, ...base.wrong]).slice(0, 4);
  return {
    dimension,
    prompt: `${base.prompt}`,
    choices: options,
    correctAnswer: String.fromCharCode(65 + options.findIndex((o) => o === base.correct)),
    commandValue: randomChoice(OPTIONS[dimension]),
  };
}

function loadBank() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.questions)) return;
    state.bank = {
      mode: parsed.mode === "random" ? "random" : "ordered",
      questions: parsed.questions.filter(isValid),
      pointer: 0,
    };
  } catch {
    state.bank = { mode: "ordered", questions: [], pointer: 0 };
  }
}

function nextUploadedQuestion(dimension) {
  const source = state.bank.mode === "random" ? shuffle(state.bank.questions) : state.bank.questions;
  if (!source.length) return null;
  for (let i = 0; i < source.length; i += 1) {
    const idx = (state.bank.pointer + i) % source.length;
    if (source[idx].dimension === dimension) {
      state.bank.pointer = idx + 1;
      return source[idx];
    }
  }
  return null;
}

function questionForDimension(dimension) {
  return nextUploadedQuestion(dimension) || buildRandomEnglishQuestion(dimension);
}

function startRound() {
  state.phase = "quiz";
  state.index = 0;
  state.roundAnswers = {};
  state.selectedAnswers = {};
  state.playerChoices = {};
  state.roundQuestions = DIMENSIONS.map((d) => questionForDimension(d));
  state.outcome = "-";
  state.keeper.x = canvas.width / 2;
  state.kicker.y = state.kicker.runStartY;
  state.kicker.runProgress = 0;
  state.kicker.legSwing = 0;
  state.ball.x = BALL_START.x;
  state.ball.y = BALL_START.y;

  ui.startBtn.classList.add("hidden");
  ui.nextBtn.classList.add("hidden");
  ui.result.textContent = "Escolha a opção da fase e responda a pergunta.";
  ui.phaseActionBtn.classList.add("hidden");
  ui.summary.textContent = state.bank.questions.length
    ? "Banco enviado carregado."
    : "Perguntas aleatórias em inglês.";

  showCurrentQuestion();
  draw();
}

function renderPhaseChoices(item) {
  ui.commandChoices.innerHTML = "";
  OPTIONS[item.dimension].forEach((value) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `phase-choice ${state.playerChoices[item.dimension] === value ? "active" : ""}`;
    btn.textContent = OPTION_LABELS[value];
    btn.addEventListener("click", () => {
      state.playerChoices[item.dimension] = value;
      renderPhaseChoices(item);
      renderAnswerButtons(item);
      renderPhaseAction(item);
    });
    ui.commandChoices.appendChild(btn);
  });
}

function renderAnswerButtons(item) {
  ui.answers.innerHTML = "";
  const hasChoice = Boolean(state.playerChoices[item.dimension]);
  const selectedAnswer = state.selectedAnswers[item.dimension];

  item.choices.forEach((choice, idx) => {
    const key = String.fromCharCode(65 + idx);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${key}) ${choice}`;
    btn.disabled = !hasChoice;
    btn.className = selectedAnswer === key ? "active" : "";
    btn.addEventListener("click", () => {
      state.selectedAnswers[item.dimension] = key;
      renderAnswerButtons(item);
      renderPhaseAction(item);
    });
    ui.answers.appendChild(btn);
  });
}

function renderPhaseAction(item) {
  const selectedChoice = state.playerChoices[item.dimension];
  const selectedAnswer = state.selectedAnswers[item.dimension];
  const isLast = state.index === DIMENSIONS.length - 1;

  ui.phaseActionBtn.classList.remove("hidden");
  ui.phaseActionBtn.textContent = isLast ? "Bater pênalti" : "Avançar";
  ui.phaseActionBtn.disabled = !selectedChoice || !selectedAnswer;
  ui.phaseActionBtn.onclick = () => {
    if (!selectedChoice || !selectedAnswer) return;
    answerQuestion(item, selectedAnswer);
  };
}

function showCurrentQuestion() {
  const item = state.roundQuestions[state.index];
  if (!item) {
    ui.phaseActionBtn.classList.add("hidden");
    resolveShot();
    return;
  }

  const dimLabel = DISPLAY_DIMENSIONS[item.dimension] || item.dimension;
  ui.phase.textContent = `${LABELS[item.dimension]} (${dimLabel})`;
  ui.phaseHint.textContent = PHASE_HINTS[item.dimension];
  ui.questionHint.textContent = QUESTION_HINTS[item.dimension];
  ui.question.textContent = item.prompt;
  renderPhaseChoices(item);
  renderAnswerButtons(item);
  renderPhaseAction(item);
}

function answerQuestion(item, answerKey) {
  const playerChoice = state.playerChoices[item.dimension];
  state.roundAnswers[item.dimension] = {
    correct: answerKey === item.correctAnswer,
    playerChoice,
    commandValue: item.commandValue,
  };
  state.index += 1;
  showCurrentQuestion();
}

function resolveCommandsAndErrors() {
  const resolved = {};
  let errors = 0;

  DIMENSIONS.forEach((dim) => {
    const ans = state.roundAnswers[dim];
    if (ans.correct) {
      resolved[dim] = ans.playerChoice;
    } else {
      errors += 1;
      resolved[dim] = randomExcluding(OPTIONS[dim], ans.playerChoice);
    }
  });

  return { resolved, errors };
}

function targetFromCommands(commands) {
  let x = canvas.width / 2;
  if (commands.direction === "left") x = GOAL.x + 64;
  if (commands.direction === "right") x = GOAL.x + GOAL.w - 64;

  let y = GOAL.y + 72;
  if (commands.height === "low") y = GOAL.y + GOAL.h - 8;
  if (commands.height === "high") y = GOAL.y + 20;

  return { x, y };
}

function applyOutcomeTargets(outcome, commands, errors) {
  const inside = targetFromCommands(commands);

  if (outcome === "goal" || outcome === "save") {
    return inside;
  }
  if (outcome === "post") {
    return {
      x: commands.direction === "left" ? GOAL.x + 5 : GOAL.x + GOAL.w - 5,
      y: inside.y,
    };
  }

  // miss (3 erros): fora do gol
  return {
    x: errors % 2 ? GOAL.x - 46 : GOAL.x + GOAL.w + 46,
    y: commands.height === "high" ? GOAL.y - 36 : GOAL.y + GOAL.h + 56,
  };
}

function resolveShot() {
  const { resolved, errors } = resolveCommandsAndErrors();

  let outcome = "goal";
  if (errors === 3) outcome = "miss";
  else if (errors === 2) outcome = "post";
  else if (errors === 1) outcome = "save";

  state.outcome = outcome;

  const target = applyOutcomeTargets(outcome, resolved, errors);
  state.ball.startX = BALL_START.x;
  state.ball.startY = BALL_START.y;
  state.ball.targetX = target.x;
  state.ball.targetY = target.y;
  state.ball.controlX = (state.ball.startX + state.ball.targetX) / 2;
  state.ball.controlY = Math.min(state.ball.startY - 150, target.y - 45);
  state.ball.speed = resolved.power === "weak" ? 0.016 : resolved.power === "strong" ? 0.032 : 0.022;

  state.keeper.startX = state.keeper.x;
  if (outcome === "save") {
    state.keeper.targetX = target.x;
  } else if (Math.random() > 0.5) {
    state.keeper.targetX = target.x;
  } else {
    state.keeper.targetX = randomChoice([canvas.width / 2 - 90, canvas.width / 2, canvas.width / 2 + 90]);
  }

  const messages = {
    goal: "GOL",
    save: "GOLEIRO PEGOU",
    post: "TRAVE",
    miss: "FORA",
  };

  ui.result.textContent = messages[outcome];
  ui.summary.textContent = `Erros: ${errors}. Regra aplicada: 0=gol, 1=goleiro pega, 2=trave, 3=fora.`;
  ui.commandChoices.innerHTML = "";
  ui.answers.innerHTML = "";
  ui.phaseActionBtn.classList.add("hidden");

  animateShotSequence();
}

function animateShotSequence() {
  state.phase = "runup";
  state.ball.x = BALL_START.x;
  state.ball.y = BALL_START.y;
  state.ball.t = 0;

  const start = performance.now();
  const runStep = (now) => {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / KICKER_ANIMATION_MS);
    state.kicker.runProgress = progress;
    state.kicker.y = state.kicker.runStartY + (state.kicker.runEndY - state.kicker.runStartY) * progress;
    state.kicker.legSwing = Math.sin(progress * Math.PI * 5) * (1 - progress * 0.4);

    draw();

    if (progress >= 1) {
      animateShot();
      return;
    }

    requestAnimationFrame(runStep);
  };

  requestAnimationFrame(runStep);
}

function animateShot() {
  state.phase = "flight";
  state.ball.t = 0;
  state.kicker.legSwing = 0;

  const step = () => {
    state.ball.t += state.ball.speed;
    if (state.ball.t >= 1) {
      state.ball.t = 1;
      state.phase = "done";
      ui.nextBtn.classList.remove("hidden");
      draw();
      return;
    }

    const t = state.ball.t;
    const inv = 1 - t;
    state.ball.x = (inv * inv * state.ball.startX) + (2 * inv * t * state.ball.controlX) + (t * t * state.ball.targetX);
    state.ball.y = (inv * inv * state.ball.startY) + (2 * inv * t * state.ball.controlY) + (t * t * state.ball.targetY);
    state.keeper.x = state.keeper.startX + (state.keeper.targetX - state.keeper.startX) * Math.min(1, t * 1.25);

    draw();
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

function drawCrowdBand(y, h, baseColor) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, y, canvas.width, h);
  for (let i = 0; i < 120; i += 1) {
    const x = (i * 19) % canvas.width;
    const rowOffset = Math.floor(i / 30) * 10;
    ctx.fillStyle = ["#f5be7d", "#e06d57", "#d0d671", "#6dbad7", "#ad83df"][i % 5];
    ctx.beginPath();
    ctx.arc(x + 8, y + 12 + rowOffset, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGoal() {
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#fff";
  ctx.strokeRect(GOAL.x, GOAL.y, GOAL.w, GOAL.h);

  ctx.strokeStyle = "rgba(255,255,255,0.58)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(GOAL.x - 18, GOAL.y + 6);
  ctx.lineTo(GOAL.x, GOAL.y + GOAL.h - 2);
  ctx.moveTo(GOAL.x + GOAL.w + 18, GOAL.y + 6);
  ctx.lineTo(GOAL.x + GOAL.w, GOAL.y + GOAL.h - 2);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.82)";
  for (let x = GOAL.x + 8; x < GOAL.x + GOAL.w; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, GOAL.y + 6);
    ctx.lineTo(x, GOAL.y + GOAL.h - 2);
    ctx.stroke();
  }
  for (let y = GOAL.y + 8; y < GOAL.y + GOAL.h; y += 10) {
    ctx.beginPath();
    ctx.moveTo(GOAL.x + 4, y);
    ctx.lineTo(GOAL.x + GOAL.w - 4, y);
    ctx.stroke();
  }
}

function drawKeeper() {
  const cx = state.keeper.x;
  const cy = KEEPER_BASE_Y;
  const dive = Math.max(-26, Math.min(26, (state.keeper.x - canvas.width / 2) * 0.14));

  ctx.fillStyle = "#1f2730";
  ctx.beginPath();
  ctx.arc(cx, cy - 40, 20, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd5ae";
  ctx.beginPath();
  ctx.arc(cx, cy - 35, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#27313f";
  ctx.fillRect(cx - 16, cy - 14, 32, 44);

  ctx.strokeStyle = "#b0d8ff";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 15, cy - 2);
  ctx.lineTo(cx - 43 + dive, cy + 8);
  ctx.moveTo(cx + 15, cy - 2);
  ctx.lineTo(cx + 43 + dive, cy + 8);
  ctx.moveTo(cx - 9, cy + 30);
  ctx.lineTo(cx - 12 + dive * 0.2, cy + 49);
  ctx.moveTo(cx + 9, cy + 30);
  ctx.lineTo(cx + 12 + dive * 0.2, cy + 49);
  ctx.stroke();
}

function drawField() {
  const fieldTop = GOAL.y + GOAL.h + 6;
  const stripe = 34;
  for (let i = 0; i < 12; i += 1) {
    ctx.fillStyle = i % 2 ? "#5eb01e" : "#71c429";
    ctx.fillRect(0, fieldTop + i * stripe, canvas.width, stripe);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.84)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PENALTY_AREA.sideInsetTop, PENALTY_AREA.top);
  ctx.lineTo(canvas.width - PENALTY_AREA.sideInsetTop, PENALTY_AREA.top);
  ctx.moveTo(PENALTY_AREA.sideInsetTop, PENALTY_AREA.top);
  ctx.lineTo(PENALTY_AREA.sideInsetBottom, PENALTY_AREA.bottom);
  ctx.moveTo(canvas.width - PENALTY_AREA.sideInsetTop, PENALTY_AREA.top);
  ctx.lineTo(canvas.width - PENALTY_AREA.sideInsetBottom, PENALTY_AREA.bottom);
  ctx.moveTo(PENALTY_AREA.sideInsetBottom, PENALTY_AREA.bottom);
  ctx.lineTo(canvas.width - PENALTY_AREA.sideInsetBottom, PENALTY_AREA.bottom);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  for (let y = fieldTop + 26; y < canvas.height - 8; y += 36) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
}

function drawKickMarker() {
  const cx = canvas.width / 2;
  const y = BALL_START.y + 44;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.arc(cx, y, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawKicker() {
  const { x } = state.kicker;
  const runX = x + Math.sin(state.kicker.runProgress * Math.PI * 6) * 3;
  const y = state.kicker.y;
  const bodyTilt = (1 - state.kicker.runProgress) * 6;

  ctx.fillStyle = "#1f1f1f";
  ctx.beginPath();
  ctx.arc(runX, y - 50, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd146";
  ctx.fillRect(runX - 11, y - 38, 22, 34);

  ctx.lineCap = "round";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.moveTo(runX - 10, y - 31);
  ctx.lineTo(runX - 20 - bodyTilt, y - 12);
  ctx.moveTo(runX + 10, y - 31);
  ctx.lineTo(runX + 20 + bodyTilt, y - 8);

  const legStride = 8 + state.kicker.legSwing * 3;
  ctx.moveTo(runX - 5, y - 4);
  ctx.lineTo(runX - legStride, y + 22);
  ctx.moveTo(runX + 5, y - 4);
  ctx.lineTo(runX + legStride, y + 23);
  ctx.stroke();
}

function drawBall(x, y, scale = 1) {
  const r = 30 * scale;
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(x + 4, y + r + 9, r * 0.95, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffb300";
  ctx.beginPath();
  ctx.arc(x, y, r + 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sky = ctx.createLinearGradient(0, 0, 0, 160);
  sky.addColorStop(0, "#6ab5ff");
  sky.addColorStop(1, "#a4d4ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, 160);

  ctx.fillStyle = "#d81f2a";
  ctx.fillRect(18, 10, canvas.width - 36, 50);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px Arial";
  ctx.fillText("PÊNALTI QUIZ", 145, 43);

  drawCrowdBand(62, 74, "#3e4f69");

  ctx.fillStyle = "#607287";
  ctx.fillRect(0, 136, canvas.width, 110);
  drawGoal();
  drawField();
  drawKeeper();
  drawKickMarker();
  drawKicker();
}

function draw() {
  drawScene();
  if (state.phase === "flight" || state.phase === "done") {
    const scale = Math.max(0.35, 1 - (BALL_START.y - state.ball.y) / 360);
    drawBall(state.ball.x, state.ball.y, scale);
  } else {
    drawBall(BALL_START.x, BALL_START.y, 1);
  }
}

async function parseCsvOrTsv(file) {
  const text = (await file.text()).replace(/\r/g, "");
  const lines = text.split("\n").filter(Boolean);
  if (!lines.length) return [];

  const sep = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(sep);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] || "").trim();
    });
    return row;
  });
  return mapRows(rows);
}

function parseDimension(value) {
  const v = String(value || "").trim().toLowerCase();
  if (["direction", "direcao", "direção"].includes(v)) return "direction";
  if (["height", "altura"].includes(v)) return "height";
  if (["power", "forca", "força"].includes(v)) return "power";
  return null;
}

function mapRows(rows) {
  return rows.map((r) => ({
    dimension: parseDimension(r.dimension || r.Dimension),
    prompt: String(r.prompt || r.Prompt || "").trim(),
    choices: [r.choiceA || r.ChoiceA, r.choiceB || r.ChoiceB, r.choiceC || r.ChoiceC, r.choiceD || r.ChoiceD].filter(Boolean),
    correctAnswer: String(r.correctAnswer || r.CorrectAnswer || "").trim().toUpperCase(),
    commandValue: String(r.commandValue || r.CommandValue || "").trim().toLowerCase(),
  })).filter(isValid);
}

async function parseXlsx(file) {
  if (!window.XLSX) throw new Error("XLSX indisponível");
  const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sh = wb.Sheets[wb.SheetNames[0]];
  return mapRows(window.XLSX.utils.sheet_to_json(sh, { defval: "" }));
}

async function parseDocx(file) {
  if (!window.mammoth) throw new Error("DOCX indisponível");
  const { value } = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return parseBlocks(value);
}

async function parsePdf(file) {
  if (!window.pdfjsLib) throw new Error("PDF indisponível");
  const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const chunks = [];
  for (let p = 1; p <= pdf.numPages; p += 1) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    chunks.push(content.items.map((it) => it.str).join(" "));
  }
  return parseBlocks(chunks.join("\n\n"));
}

function parseBlocks(text) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const rows = blocks.map((b) => {
    const row = {};
    b.split("\n").forEach((line) => {
      const i = line.indexOf(":");
      if (i < 0) return;
      row[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    });
    return row;
  });
  return mapRows(rows);
}

async function loadQuestionsFromFile() {
  const file = ui.fileInput.files[0];
  if (!file) {
    ui.uploadInfo.textContent = "Selecione um arquivo primeiro.";
    return;
  }

  const ext = file.name.toLowerCase().split(".").pop();
  let questions = [];

  try {
    if (ext === "csv") questions = await parseCsvOrTsv(file);
    else if (ext === "xlsx") questions = await parseXlsx(file);
    else if (ext === "docx") questions = await parseDocx(file);
    else if (ext === "pdf") questions = await parsePdf(file);
    else throw new Error("Formato não suportado");
  } catch (err) {
    ui.uploadInfo.textContent = `Erro de leitura: ${err.message}`;
    return;
  }

  if (!questions.length) {
    ui.uploadInfo.textContent = "Nenhuma pergunta válida encontrada. Use o template.";
    return;
  }

  state.bank = { mode: ui.modeSelect.value === "random" ? "random" : "ordered", questions, pointer: 0 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bank));
  ui.uploadInfo.textContent = `Banco carregado com ${questions.length} perguntas.`;
}

function downloadTemplate() {
  const csv = [
    "dimension,prompt,choiceA,choiceB,choiceC,choiceD,correctAnswer,commandValue",
    "direction,Where does she live?,She live at school.,She lives at school.,She lives at her house.,She living at home.,C,left",
    "height,Choose the correct sentence.,He don't like apples.,He doesn't likes apples.,He doesn't like apples.,He not like apples.,C,high",
    "power,Choose the best synonym for happy.,sad,angry,glad,noisy,C,strong",
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "freekick-questions-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

ui.startBtn.addEventListener("click", startRound);
ui.nextBtn.addEventListener("click", startRound);
ui.loadQuestionsBtn.addEventListener("click", loadQuestionsFromFile);
ui.downloadTemplateBtn.addEventListener("click", downloadTemplate);

loadBank();
draw();

})();
