(function () {
"use strict";

// Bootstrap mínimo, seguro para múltiplos carregamentos.
if (window.__freekickBootstrapLoaded) return;
window.__freekickBootstrapLoaded = true;

async function cleanupLegacyClientCache() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      const targetKeys = keys.filter((k) => k.toLowerCase().includes("freekick") || k.toLowerCase().includes("github"));
      await Promise.all(targetKeys.map((k) => caches.delete(k)));
    }
  } catch (_) {
    // best effort cleanup
  }
}

function loadCoreOnce() {
  if (window.__freekickCoreLoading || window.__freekickCoreLoaded) return;
  window.__freekickCoreLoading = true;

  const script = document.createElement("script");
  script.src = "core.js?v=20260306b";
  script.async = false;
  script.onload = () => {
    window.__freekickCoreLoaded = true;
    window.__freekickCoreLoading = false;
  };
  script.onerror = () => {
    window.__freekickCoreLoading = false;
    console.error("Falha ao carregar core.js");
  };

  document.head.appendChild(script);
}

loadCoreOnce();
cleanupLegacyClientCache();
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
const STORAGE_KEY = "freekick-question-bank-v5";
const DIMENSIONS = ["direction", "height", "power"];
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

const BALL_START = { x: canvas.width / 2, y: canvas.height - 64 };
const GOAL = { x: 36, y: 164, w: canvas.width - 72, h: 130 };

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

const BALL_START = { x: canvas.width / 2, y: canvas.height - 64 };
const GOAL = {
  x: 36,
  y: 164,
  w: canvas.width - 72,
  h: 130,
};

const ENGLISH_POOL = {
  grammar: [
    {
      prompt: "Choose the correct sentence:",
      correct: "She lives in a small house.",
      wrong: ["She live in a small house.", "She living in a small house.", "She lives at a small house."],
    },
    {
      prompt: "Choose the correct option:",
      correct: "He doesn't like rainy days.",
      wrong: ["He don't likes rainy days.", "He doesn't likes rainy days.", "He not like rainy days."],
    },
    {
      prompt: "Pick the grammatically correct sentence:",
      correct: "Where does your brother work?",
      wrong: ["Where do your brother works?", "Where does your brother works?", "Where your brother does work?"],
    },
    {
      prompt: "Choose the correct question:",
      correct: "Did they watch the movie yesterday?",
      wrong: ["Do they watched the movie yesterday?", "Did they watched the movie yesterday?", "They did watch the movie yesterday?"],
    },
  ],
  vocabulary: [
    {
      prompt: "Choose the correct meaning of 'quiet':",
      correct: "making little noise",
      wrong: ["full of energy", "very expensive", "extremely crowded"],
    },
    {
      prompt: "Choose the best synonym for 'happy':",
      correct: "glad",
      wrong: ["angry", "tired", "lazy"],
    },
    {
      prompt: "Choose the opposite of 'difficult':",
      correct: "easy",
      wrong: ["heavy", "noisy", "dangerous"],
    },
    {
      prompt: "Choose the word that completes: 'I ___ breakfast at 7:00.'",
      correct: "have",
      wrong: ["am", "do", "make"],
    },
  ],
};

const state = {
  phase: "idle",
  index: 0,
  roundQuestions: [],
  roundAnswers: {},
  playerChoices: {},
  bank: { mode: "ordered", questions: [], pointer: 0 },
  outcome: "-",
  bank: { mode: "ordered", questions: [], pointer: 0 },
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
  const source = Math.random() > 0.5 ? ENGLISH_POOL.grammar : ENGLISH_POOL.vocabulary;
  const base = randomChoice(source);
  const commandValue = randomChoice(OPTIONS[dimension]);

  const options = shuffle([base.correct, ...base.wrong]).slice(0, 4);
  const correctIndex = options.findIndex((opt) => opt === base.correct);

  return {
    dimension,
    prompt: `${base.prompt} (${dimension.toUpperCase()})`,
    choices: options,
    correctAnswer: String.fromCharCode(65 + correctIndex),
    commandValue,
  };
}

function loadBank() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.questions)) return;
    if (!Array.isArray(parsed.questions) || !parsed.questions.length) return;

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
  const uploaded = nextUploadedQuestion(dimension);
  if (uploaded) return uploaded;
  return buildRandomEnglishQuestion(dimension);
}

function startRound() {
  state.phase = "quiz";
  state.index = 0;
  state.roundAnswers = {};
  state.playerChoices = {};
  state.roundQuestions = DIMENSIONS.map((d) => questionForDimension(d));
  state.outcome = "-";
  state.keeper.x = canvas.width / 2;

  ui.startBtn.classList.add("hidden");
  ui.nextBtn.classList.add("hidden");
  ui.result.textContent = "Escolha a opção da fase e responda a pergunta.";
  ui.summary.textContent = state.bank.questions.length
    ? "Banco enviado carregado."
    : "Perguntas aleatórias em inglês.";
  state.roundQuestions = DIMENSIONS.map((d) => questionForDimension(d));

  ui.startBtn.classList.add("hidden");
  ui.nextBtn.classList.add("hidden");
  ui.summary.textContent = state.bank.questions.length
    ? "Perguntas do arquivo carregado em uso."
    : "Perguntas aleatórias em inglês geradas automaticamente.";
  ui.result.textContent = "Responda as perguntas.";

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
    });
    ui.commandChoices.appendChild(btn);
  });
}

function renderAnswerButtons(item) {
  ui.answers.innerHTML = "";
  const hasChoice = Boolean(state.playerChoices[item.dimension]);

  item.choices.forEach((choice, idx) => {
    const key = String.fromCharCode(65 + idx);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${key}) ${choice}`;
    btn.disabled = !hasChoice;
    btn.addEventListener("click", () => answerQuestion(item, key));
    ui.answers.appendChild(btn);
  });
}

function showCurrentQuestion() {
  const item = state.roundQuestions[state.index];
  if (!item) {
    resolveShot();
    return;
  }

  ui.phase.textContent = `${LABELS[item.dimension]} (${item.dimension})`;
  ui.question.textContent = item.prompt;
  renderPhaseChoices(item);
  renderAnswerButtons(item);
}

function answerQuestion(item, answerKey) {
  const playerChoice = state.playerChoices[item.dimension];
  state.roundAnswers[item.dimension] = {
    correct: answerKey === item.correctAnswer,
    playerChoice,
  ui.phase.textContent = item.dimension;
  ui.question.textContent = item.prompt;
  ui.answers.innerHTML = "";

  item.choices.forEach((choice, idx) => {
    const key = String.fromCharCode(65 + idx);
    const button = document.createElement("button");
    button.textContent = `${key}) ${choice}`;
    button.addEventListener("click", () => answerQuestion(item, key));
    ui.answers.appendChild(button);
  });
}

function answerQuestion(item, answerKey) {
  state.roundAnswers[item.dimension] = {
    correct: answerKey === item.correctAnswer,
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
function targetInsideGoal(commands) {
  const direction = commands.direction;
  const height = commands.height;

  let x = canvas.width / 2;
  if (direction === "left") x = GOAL.x + 64;
  if (direction === "right") x = GOAL.x + GOAL.w - 64;

  let y = GOAL.y + 72;
  if (height === "low") y = GOAL.y + GOAL.h - 8;
  if (height === "high") y = GOAL.y + 20;

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
function targetOutsideGoal(commands, answers) {
  const inside = targetInsideGoal(commands);
  let x = inside.x;
  let y = inside.y;

  const directionWrong = !answers.direction.correct;
  const heightWrong = !answers.height.correct;
  const powerWrong = !answers.power.correct;

  if (directionWrong) {
    if (commands.direction === "left") x = GOAL.x + GOAL.w + 45;
    else if (commands.direction === "right") x = GOAL.x - 45;
    else x = Math.random() > 0.5 ? GOAL.x - 45 : GOAL.x + GOAL.w + 45;
  } else {
    x += Math.random() > 0.5 ? 30 : -30;
  }

  if (heightWrong) {
    y = Math.random() > 0.5 ? GOAL.y - 40 : GOAL.y + GOAL.h + 54;
  }

  if (powerWrong && !heightWrong) {
    y = GOAL.y - 28;
  }

  return { x, y };
}

function resolveShot() {
  const commands = {};
  let correct = 0;

  DIMENSIONS.forEach((dim) => {
    const answer = state.roundAnswers[dim];
    commands[dim] = answer.commandValue;
    if (answer.correct) correct += 1;
  });

  const isGoal = correct === DIMENSIONS.length;
  const target = isGoal
    ? targetInsideGoal(commands)
    : targetOutsideGoal(commands, state.roundAnswers);

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
  state.ball.speed = commands.power === "weak" ? 0.016 : commands.power === "strong" ? 0.032 : 0.022;

  ui.result.textContent = isGoal ? "GOL" : "FORA";
  ui.answers.innerHTML = "";
  ui.summary.textContent = `Acertos: ${correct}/3. ${isGoal ? "Acertou todas: bola no alvo." : "Errou ao menos uma: bola fora do gol."}`;

  animateShot();
}

function animateShot() {
  state.phase = "flight";
  state.ball.t = 0;

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
    state.ball.x = (inv * inv * state.ball.startX)
      + (2 * inv * t * state.ball.controlX)
      + (t * t * state.ball.targetX);

    state.ball.y = (inv * inv * state.ball.startY)
      + (2 * inv * t * state.ball.controlY)
      + (t * t * state.ball.targetY);

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
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#fff";
  ctx.strokeStyle = "#ffffff";
  ctx.strokeRect(GOAL.x, GOAL.y, GOAL.w, GOAL.h);

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

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(GOAL.x - 8, GOAL.y, 8, GOAL.h + 6);
  ctx.fillRect(GOAL.x + GOAL.w, GOAL.y, 8, GOAL.h + 6);
}

function drawKeeper() {
  const cx = canvas.width / 2;
  const cy = 276;

  ctx.fillStyle = "#7c4124";
  ctx.beginPath();
  ctx.arc(cx, cy - 43, 24, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd5ae";
  ctx.beginPath();
  ctx.arc(cx, cy - 38, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ef8e53";
  ctx.fillRect(cx - 18, cy - 18, 36, 46);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 18);
  ctx.lineTo(cx, cy + 28);
  ctx.stroke();

  ctx.strokeStyle = "#efcd54";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 5);
  ctx.lineTo(cx - 55, cy + 4);
  ctx.moveTo(cx + 18, cy - 5);
  ctx.lineTo(cx + 55, cy + 4);
  ctx.stroke();

  ctx.fillStyle = "#ef8e53";
  ctx.fillRect(cx - 17, cy + 28, 14, 32);
  ctx.fillRect(cx + 3, cy + 28, 14, 32);

  ctx.strokeStyle = "#d66b38";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 58);
  ctx.lineTo(cx - 24, cy + 68);
  ctx.moveTo(cx + 10, cy + 58);
  ctx.lineTo(cx + 24, cy + 68);
  ctx.stroke();
}

function drawField() {
  const startY = 268;
  const stripe = 26;
  for (let i = 0; i < 12; i += 1) {
    ctx.fillStyle = i % 2 ? "#5f8e14" : "#6fa01a";
    ctx.fillRect(0, startY + i * stripe, canvas.width, stripe);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 291);
  ctx.lineTo(canvas.width, 291);
  ctx.moveTo(0, 334);
  ctx.lineTo(canvas.width, 334);
  ctx.stroke();
}

function drawArrow() {
  const cx = canvas.width / 2;
  const y = canvas.height - 152;
  ctx.fillStyle = "#ff552e";
  ctx.beginPath();
  ctx.moveTo(cx, y - 56);
  ctx.lineTo(cx - 30, y - 24);
  ctx.lineTo(cx - 8, y - 24);
  ctx.lineTo(cx - 8, y + 16);
  ctx.lineTo(cx + 8, y + 16);
  ctx.lineTo(cx + 8, y - 24);
  ctx.lineTo(cx + 30, y - 24);
  ctx.closePath();
  ctx.fill();
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
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#464646";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#2f2f2f";
  ctx.beginPath();
  ctx.moveTo(x, y - 9 * scale);
  ctx.lineTo(x + 8 * scale, y - 2 * scale);
  ctx.lineTo(x + 5 * scale, y + 8 * scale);
  ctx.lineTo(x - 5 * scale, y + 8 * scale);
  ctx.lineTo(x - 8 * scale, y - 2 * scale);
  ctx.closePath();
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
  ctx.fillRect(30, 12, canvas.width - 60, 48);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 21px Arial";
  ctx.fillText("One HEART.", 214, 43);

  ctx.strokeStyle = "#f4f4f4";
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 12, canvas.width - 60, 48);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 15px Arial";
  ctx.fillText("Sprint 150 CBS", 46, 41);
  ctx.font = "bold 21px Arial";
  ctx.fillText("One HEART.", 214, 43);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px Arial";
  ctx.fillText("HONDA", canvas.width - 82, 42);

  drawCrowdBand(64, 96, "#32445e");

  ctx.fillStyle = "#0e0f12";
  ctx.fillRect(0, 160, canvas.width, 108);
  drawGoal();
  drawKeeper();
  drawField();
  drawArrow();
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
  return rows
    .map((r) => ({
      dimension: parseDimension(r.dimension || r.Dimension),
      prompt: String(r.prompt || r.Prompt || "").trim(),
      choices: [r.choiceA || r.ChoiceA, r.choiceB || r.ChoiceB, r.choiceC || r.ChoiceC, r.choiceD || r.ChoiceD].filter(Boolean),
      correctAnswer: String(r.correctAnswer || r.CorrectAnswer || "").trim().toUpperCase(),
      commandValue: String(r.commandValue || r.CommandValue || "").trim().toLowerCase(),
    }))
    .filter(isValid);
}

async function parseXlsx(file) {
  if (!window.XLSX) throw new Error("XLSX indisponível");
  const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sh = wb.Sheets[wb.SheetNames[0]];
  return mapRows(window.XLSX.utils.sheet_to_json(sh, { defval: "" }));
  const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = window.XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
  return mapRows(rows);
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
  const pagesText = [];
  for (let p = 1; p <= pdf.numPages; p += 1) {
    const page = await pdf.getPage(p);
    const text = await page.getTextContent();
    pagesText.push(text.items.map((item) => item.str).join(" "));
  }
  return parseBlocks(pagesText.join("\n\n"));
}

function parseBlocks(text) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const rows = blocks.map((b) => {
    const row = {};
    b.split("\n").forEach((line) => {
      const i = line.indexOf(":");
      if (i < 0) return;
      row[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  const rows = blocks.map((block) => {
    const row = {};
    block.split("\n").forEach((line) => {
      const split = line.indexOf(":");
      if (split < 0) return;
      const key = line.slice(0, split).trim().toLowerCase();
      const value = line.slice(split + 1).trim();
      row[key] = value;
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
  state.bank = {
    mode: ui.modeSelect.value === "random" ? "random" : "ordered",
    questions,
    pointer: 0,
  };

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
  const link = document.createElement("a");
  link.href = url;
  link.download = "freekick-questions-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

ui.startBtn.addEventListener("click", startRound);
ui.nextBtn.addEventListener("click", startRound);
ui.loadQuestionsBtn.addEventListener("click", loadQuestionsFromFile);
ui.downloadTemplateBtn.addEventListener("click", downloadTemplate);

loadBank();
draw();

})();
