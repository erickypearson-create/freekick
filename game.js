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
  fileInput: document.getElementById("questionFile"),
  modeSelect: document.getElementById("questionMode"),
  loadQuestionsBtn: document.getElementById("loadQuestionsBtn"),
  downloadTemplateBtn: document.getElementById("downloadTemplateBtn"),
  uploadInfo: document.getElementById("uploadInfo"),
};

const LOCAL_STORAGE_KEY = "freekick-question-bank-v2";
const ACTIVE_DIMENSIONS = ["direction", "height", "power"];
const DIMENSION_OPTIONS = {
  direction: ["left", "center", "right"],
  height: ["low", "mid", "high"],
  power: ["weak", "medium", "strong"],
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
  speed: 0.02,
};

const keeper = {
  baseX: canvas.width / 2,
  x: canvas.width / 2,
  y: 234,
  dive: "stand",
  level: "mid",
  p: 0,
  reactionDelay: 0.2,
  pose: { handX: canvas.width / 2, handY: 226, reachX: 52, reachY: 36 },
};

const state = {
  phase: "idle", // idle, runup, flight, done
  index: 0,
  roundQuestions: [],
  roundAnswers: {},
  shot: null,
  outcome: null, // goal, post, miss
  time: 0,
  overlayText: "",
  overlayUntil: 0,
  postBounceDone: false,
  questionBank: null,
};

const layers = {
  background: document.createElement("canvas"),
};
layers.background.width = canvas.width;
layers.background.height = canvas.height;
const bgCtx = layers.background.getContext("2d");

function getDefaultQuestionBank() {
  return {
    mode: "ordered",
    questions: [
      {
        dimension: "direction",
        prompt: "Placeholder Q (English): Choose the shooting direction.",
        choices: ["Left side", "Center", "Right side"],
        correctAnswer: "A",
        commandValue: "left",
      },
      {
        dimension: "height",
        prompt: "Placeholder Q (English): Choose the shot height.",
        choices: ["Low", "Mid", "High"],
        correctAnswer: "A",
        commandValue: "low",
      },
      {
        dimension: "power",
        prompt: "Placeholder Q (English): Choose the shot power.",
        choices: ["Weak", "Medium", "Strong"],
        correctAnswer: "C",
        commandValue: "strong",
      },
    ],
  };
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initializeQuestionBank(bankData) {
  const bank = clone(bankData);
  const mode = bank.mode === "random" ? "random" : "ordered";
  const validQuestions = (bank.questions || []).filter(isValidQuestionRecord);
  if (!validQuestions.length) {
    state.questionBank = {
      mode,
      questions: clone(getDefaultQuestionBank().questions),
      queue: clone(getDefaultQuestionBank().questions),
      pointer: 0,
    };
    return;
  }

  state.questionBank = {
    mode,
    questions: validQuestions,
    queue: mode === "random" ? shuffle(validQuestions) : [...validQuestions],
    pointer: 0,
  };
}

function isValidQuestionRecord(record) {
  if (!record) return false;
  if (!ACTIVE_DIMENSIONS.includes(record.dimension)) return false;
  if (!record.prompt || !Array.isArray(record.choices) || record.choices.length < 2) return false;
  if (!["A", "B", "C", "D"].includes(record.correctAnswer)) return false;
  if (!DIMENSION_OPTIONS[record.dimension].includes(record.commandValue)) return false;
  return true;
}

function getNextQuestionForDimension(dimension) {
  if (!state.questionBank) initializeQuestionBank(getDefaultQuestionBank());

  const bank = state.questionBank;
  if (!bank.queue.length) {
    bank.queue = bank.mode === "random" ? shuffle(bank.questions) : [...bank.questions];
    bank.pointer = 0;
  }

  let found = null;
  const total = bank.queue.length;
  let tries = 0;

  while (tries < total) {
    const idx = bank.pointer % bank.queue.length;
    const candidate = bank.queue[idx];
    bank.pointer += 1;
    tries += 1;

    if (candidate.dimension === dimension) {
      found = candidate;
      break;
    }
  }

  if (found) return found;

  return getDefaultQuestionBank().questions.find((q) => q.dimension === dimension);
}

function buildRoundQuestions() {
  state.roundQuestions = ACTIVE_DIMENSIONS.map((dimension) => getNextQuestionForDimension(dimension));
}

function parseChoiceKey(raw) {
  const text = String(raw || "").trim().toUpperCase();
  if (["A", "B", "C", "D"].includes(text)) return text;
  return null;
}

function normalizeDimension(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (["direction", "direcao", "direção"].includes(value)) return "direction";
  if (["height", "altura"].includes(value)) return "height";
  if (["power", "intensidade", "forca", "força"].includes(value)) return "power";
  return null;
}

function normalizeCommandValue(dimension, raw) {
  const value = String(raw || "").trim().toLowerCase();

  const map = {
    direction: {
      left: "left",
      esquerda: "left",
      center: "center",
      centro: "center",
      right: "right",
      direita: "right",
    },
    height: {
      low: "low",
      baixa: "low",
      mid: "mid",
      media: "mid",
      "média": "mid",
      high: "high",
      alta: "high",
    },
    power: {
      weak: "weak",
      fraca: "weak",
      medium: "medium",
      media: "medium",
      "média": "medium",
      strong: "strong",
      forte: "strong",
    },
  };

  const normalized = map[dimension]?.[value] || value;
  return DIMENSION_OPTIONS[dimension].includes(normalized) ? normalized : null;
}

function mapExcelRowsToQuestions(rows) {
  return rows.map((row) => {
    const dimension = normalizeDimension(row.dimension);
    const choices = [row.choiceA, row.choiceB, row.choiceC, row.choiceD].filter(Boolean).map(String);
    const correctAnswer = parseChoiceKey(row.correctAnswer);
    const commandValue = normalizeCommandValue(dimension, row.commandValue);

    return {
      dimension,
      prompt: String(row.prompt || "").trim(),
      choices,
      correctAnswer,
      commandValue,
    };
  }).filter(isValidQuestionRecord);
}

function parseTextQuestionBlocks(rawText) {
  const blocks = rawText
    .replace(/\r/g, "")
    .split(/\n\s*\n/g)
    .map((b) => b.trim())
    .filter(Boolean);

  const parsed = [];
  blocks.forEach((block) => {
    const data = {};
    block.split("\n").forEach((line) => {
      const splitIndex = line.indexOf(":");
      if (splitIndex < 0) return;
      const key = line.slice(0, splitIndex).trim().toLowerCase();
      const value = line.slice(splitIndex + 1).trim();
      data[key] = value;
    });

    const dimension = normalizeDimension(data.dimension);
    const choices = [data.choicea, data.choiceb, data.choicec, data.choiced].filter(Boolean);
    const correctAnswer = parseChoiceKey(data.correctanswer);
    const commandValue = normalizeCommandValue(dimension, data.commandvalue);

    const question = {
      dimension,
      prompt: data.prompt || "",
      choices,
      correctAnswer,
      commandValue,
    };

    if (isValidQuestionRecord(question)) parsed.push(question);
  });

  return parsed;
}

async function parseExcelFile(file) {
  if (!window.XLSX) throw new Error("Biblioteca XLSX não carregada");
  const arrayBuffer = await file.arrayBuffer();
  const workbook = window.XLSX.read(arrayBuffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = window.XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
  return mapExcelRowsToQuestions(rows);
}

async function parseDocxFile(file) {
  if (!window.mammoth) throw new Error("Biblioteca DOCX não carregada");
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await window.mammoth.extractRawText({ arrayBuffer });
  return parseTextQuestionBlocks(value);
}

async function parsePdfFile(file) {
  if (!window.pdfjsLib) throw new Error("Biblioteca PDF não carregada");
  if (window.pdfjsLib.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.js";
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let text = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => it.str).join(" ");
    text += `${pageText}\n\n`;
  }

  return parseTextQuestionBlocks(text);
}

async function loadQuestionsFromFile() {
  const file = ui.fileInput.files?.[0];
  const mode = ui.modeSelect.value === "random" ? "random" : "ordered";

  if (!file) {
    ui.uploadInfo.textContent = "Selecione um arquivo primeiro (PDF, DOCX ou XLSX).";
    return;
  }

  let questions = [];
  try {
    if (file.name.toLowerCase().endsWith(".xlsx")) {
      questions = await parseExcelFile(file);
    } else if (file.name.toLowerCase().endsWith(".docx")) {
      questions = await parseDocxFile(file);
    } else if (file.name.toLowerCase().endsWith(".pdf")) {
      questions = await parsePdfFile(file);
    } else {
      ui.uploadInfo.textContent = "Formato não suportado. Use PDF, DOCX ou XLSX.";
      return;
    }
  } catch (error) {
    ui.uploadInfo.textContent = `Falha no parsing: ${error.message}. Use o template XLSX recomendado.`;
    return;
  }

  if (!questions.length) {
    ui.uploadInfo.textContent = "Não consegui mapear perguntas válidas. Revise o formato ou use o template XLSX.";
    return;
  }

  const payload = { mode, questions };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  initializeQuestionBank(payload);

  ui.uploadInfo.textContent = `Banco carregado com ${questions.length} perguntas. Modo: ${mode}.`;
}

function downloadTemplate() {
  if (window.XLSX) {
    const rows = [
      {
        dimension: "direction",
        prompt: "Which side should the striker shoot?",
        choiceA: "Left",
        choiceB: "Center",
        choiceC: "Right",
        choiceD: "Far right",
        correctAnswer: "A",
        commandValue: "left",
      },
      {
        dimension: "height",
        prompt: "What is the target height?",
        choiceA: "Low",
        choiceB: "Mid",
        choiceC: "High",
        choiceD: "Very high",
        correctAnswer: "A",
        commandValue: "low",
      },
      {
        dimension: "power",
        prompt: "How strong should the shot be?",
        choiceA: "Weak",
        choiceB: "Medium",
        choiceC: "Strong",
        choiceD: "Very strong",
        correctAnswer: "C",
        commandValue: "strong",
      },
    ];

    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "questions");
    window.XLSX.writeFile(wb, "freekick-questions-template.xlsx");
    return;
  }

  const csv = [
    "dimension,prompt,choiceA,choiceB,choiceC,choiceD,correctAnswer,commandValue",
    "direction,Which side should the striker shoot?,Left,Center,Right,Far right,A,left",
    "height,What is the target height?,Low,Mid,High,Very high,A,low",
    "power,How strong should the shot be?,Weak,Medium,Strong,Very strong,C,strong",
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "freekick-questions-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function pickRandomAlternative(dimension, commandValue) {
  const options = DIMENSION_OPTIONS[dimension].filter((value) => value !== commandValue);
  return options[Math.floor(Math.random() * options.length)];
}

function resolveDimensionCommands() {
  const resolved = {};
  let correctCount = 0;

  ACTIVE_DIMENSIONS.forEach((dimension) => {
    const answer = state.roundAnswers[dimension];
    if (!answer) return;

    if (answer.correct) {
      resolved[dimension] = answer.commandValue;
      correctCount += 1;
    } else {
      resolved[dimension] = pickRandomAlternative(dimension, answer.commandValue);
    }
  });

  const total = ACTIVE_DIMENSIONS.length;
  if (correctCount === total) state.outcome = "goal";
  else if (correctCount === 0) state.outcome = "miss";
  else state.outcome = "post";

  return resolved;
}

function mapCommandsToTarget(commands) {
  const direction = commands.direction || "center";
  const height = commands.height || "mid";
  const power = commands.power || "medium";

  let targetX = canvas.width / 2;
  if (direction === "left") targetX = canvas.width / 2 - 180;
  if (direction === "right") targetX = canvas.width / 2 + 180;

  let targetY = 210;
  if (height === "low") targetY = 250;
  if (height === "high") targetY = 170;

  let speed = 0.022;
  if (power === "weak") speed = 0.018;
  if (power === "strong") speed = 0.027;

  return { targetX, targetY, speed };
}

function randomCorrectness() {
  return Math.random() > 0.35;
}

function resetRound() {
  state.phase = "idle";
  state.index = 0;
  state.roundAnswers = {};
  state.shot = null;
  state.outcome = null;
  state.postBounceDone = false;

  player.x = player.baseX;
  player.run = 0;

  ball.t = 0;
  ball.x = spot.x + 32;
  ball.y = spot.y - 2;

  keeper.x = keeper.baseX;
  keeper.dive = "stand";
  keeper.level = "mid";
  keeper.p = 0;

  buildRoundQuestions();
  ui.summary.innerHTML = "";
  ui.nextBtn.classList.add("hidden");
  showStep();
}

function showStep() {
  const question = state.roundQuestions[state.index];
  if (!question) {
    resetRound();
    return;
  }

  ui.phase.textContent = question.dimension;
  ui.question.textContent = question.prompt;
  ui.result.textContent = "Responda para controlar essa dimensão do chute.";
  ui.answers.innerHTML = "";

  question.choices.forEach((choiceText, index) => {
    const choiceKey = ["A", "B", "C", "D"][index];
    const button = document.createElement("button");
    button.textContent = `${choiceKey}) ${choiceText}`;
    button.addEventListener("click", () => answerStep(choiceKey));
    ui.answers.appendChild(button);
  });
}

function answerStep(choiceKey) {
  if (state.phase === "runup" || state.phase === "flight") return;

  const question = state.roundQuestions[state.index];
  if (!question) return;

  Array.from(ui.answers.querySelectorAll("button")).forEach((btn) => {
    btn.disabled = true;
  });

  const correct = choiceKey === question.correctAnswer;
  state.roundAnswers[question.dimension] = {
    correct,
    commandValue: question.commandValue,
    choice: choiceKey,
  };

  ui.result.textContent = correct
    ? `✅ Acertou (${question.dimension} obedece comando).`
    : `❌ Errou (${question.dimension} vira valor aleatório alternativo).`;

  state.index += 1;
  if (state.index < state.roundQuestions.length) {
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
  const commands = resolveDimensionCommands();
  const baseShot = mapCommandsToTarget(commands);

  let targetX = baseShot.targetX;
  let targetY = baseShot.targetY;
  const speed = baseShot.speed;

  if (state.outcome === "post") {
    targetX = commands.direction === "left" ? 204 : commands.direction === "right" ? 756 : 204;
    targetY = commands.height === "high" ? 170 : commands.height === "low" ? 250 : 210;
  }

  if (state.outcome === "miss") {
    targetX = commands.direction === "left" ? 110 : commands.direction === "right" ? 850 : canvas.width / 2;
    targetY = commands.height === "high" ? 90 : 310;
  }

  state.shot = {
    ...commands,
    targetX,
    targetY,
    speed,
    curve: commands.direction === "left" ? 18 : commands.direction === "right" ? -18 : 0,
  };

  ui.summary.innerHTML = `
    <p><strong>Direção resolvida:</strong> ${commands.direction}</p>
    <p><strong>Altura resolvida:</strong> ${commands.height}</p>
    <p><strong>Intensidade resolvida:</strong> ${commands.power}</p>
    <p><strong>Resultado esperado:</strong> ${state.outcome === "goal" ? "GOL" : state.outcome === "post" ? "TRAVE" : "FORA"}</p>
  `;
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
  ball.controlY = Math.min(ball.startY, ball.targetY) - (state.shot.height === "high" ? 28 : state.shot.height === "mid" ? 18 : 8);
  ball.curve = state.shot.curve;
  ball.speed = state.shot.speed;
  ball.t = 0;

  defineKeeperReaction();
}

function defineKeeperReaction() {
  keeper.p = 0;

  const horizontal = state.shot.direction === "left" ? "left" : state.shot.direction === "right" ? "right" : "center";
  const vertical = state.shot.height;

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
}

function updatePhysics(dt) {
  if (state.phase === "runup") {
    player.run = Math.min(1, player.run + dt * 2.3);
    player.x = lerp(player.baseX, spot.x - 82, player.run) + Math.sin(player.run * Math.PI * 2) * 6;
    if (player.run >= 1) startFlight();
  }

  if (state.phase === "flight") {
    ball.t = Math.min(1, ball.t + dt * ball.speed * 60);
    const t = ball.t;

    ball.x = bezier(ball.startX, ball.controlX, ball.targetX, t) + Math.sin(t * Math.PI) * ball.curve;
    ball.y = bezier(ball.startY, ball.controlY, ball.targetY, t) + t * t * 8;

    if (state.outcome === "post" && !state.postBounceDone && t >= 0.96) {
      ball.x += ball.x < canvas.width / 2 ? -18 : 18;
      state.postBounceDone = true;
    }

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
}

function finalizeShot() {
  state.phase = "done";

  if (state.outcome === "goal") {
    score.portugal += 1;
    ui.result.textContent = "⚽ GOOOL!";
    state.overlayText = "GOL";
    state.overlayUntil = state.time + 1.5;
  } else if (state.outcome === "post") {
    ui.result.textContent = "🥅 TRAVE!";
    state.overlayText = "TRAVE";
    state.overlayUntil = state.time + 1.2;
  } else {
    score.brazil += 1;
    ui.result.textContent = "❌ FORA!";
    state.overlayText = "FORA";
    state.overlayUntil = state.time + 1.2;
  }

  ui.nextBtn.classList.remove("hidden");
}

function keeperSave(x, y) {
  const p = keeper.pose;
  return Math.abs(x - p.handX) < p.reachX && Math.abs(y - p.handY) < p.reachY;
}

function bezier(a, b, c, t) {
  return lerp(lerp(a, b, t), lerp(b, c, t), t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOut(t) {
  return 1 - (1 - t) ** 3;
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(layers.background, 0, 0, canvas.width, canvas.height);
  drawKeeper();
  drawPlayer();
  drawBall();
  drawOutcomeOverlay();
}

function drawOutcomeOverlay() {
  if (!state.overlayText || state.time > state.overlayUntil) return;

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 88px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(state.overlayText, canvas.width / 2, canvas.height / 2);
}

function buildStaticBackground() {
  const w = canvas.width;
  const h = canvas.height;

  bgCtx.clearRect(0, 0, w, h);

  bgCtx.fillStyle = "#77d0f0";
  bgCtx.fillRect(0, 0, w, 170);

  bgCtx.fillStyle = "#d33b3b";
  bgCtx.fillRect(0, 170, 220, 65);
  bgCtx.fillStyle = "#39b7c8";
  bgCtx.fillRect(220, 170, 520, 65);
  bgCtx.fillStyle = "#f0c812";
  bgCtx.fillRect(740, 170, 220, 65);

  bgCtx.fillStyle = "#a6d86c";
  bgCtx.fillRect(0, 235, w, 75);

  const grass = bgCtx.createLinearGradient(0, 310, 0, h);
  grass.addColorStop(0, "#79c734");
  grass.addColorStop(1, "#4ba22a");
  bgCtx.fillStyle = grass;
  bgCtx.fillRect(0, 310, w, h - 310);

  bgCtx.strokeStyle = "#ffffff";
  bgCtx.lineWidth = 6;
  bgCtx.beginPath();
  bgCtx.moveTo(10, 342);
  bgCtx.lineTo(950, 342);
  bgCtx.lineTo(900, 445);
  bgCtx.lineTo(60, 445);
  bgCtx.closePath();
  bgCtx.stroke();

  const gx = 200;
  const gy = 102;
  const gw = 560;
  const gh = 175;
  const depth = 20;

  bgCtx.strokeStyle = "#ffffff";
  bgCtx.lineWidth = 8;
  bgCtx.strokeRect(gx, gy, gw, gh);

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

  drawWizardBoard(bgCtx, 110, 203, 180, 46);
  drawWizardBoard(bgCtx, 340, 203, 180, 46);
  drawWizardBoard(bgCtx, 570, 203, 180, 46);
  drawWizardBoard(bgCtx, 800, 203, 150, 46);

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

function drawPlayer() {
  const x = player.x;
  const y = player.y;

  ctx.fillStyle = "rgba(0,0,0,0.20)";
  ctx.beginPath();
  ctx.ellipse(x + 12, y + 56, 23, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "#6f431b";
  ctx.beginPath();
  ctx.ellipse(0, -86, 23, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e7bc8d";
  ctx.beginPath();
  ctx.ellipse(0, -62, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();

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

  ctx.fillStyle = "#1f9e45";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("10", 0, -14);

  ctx.fillStyle = "#1550b8";
  ctx.beginPath();
  ctx.moveTo(-26, 18);
  ctx.lineTo(26, 18);
  ctx.lineTo(21, 62);
  ctx.lineTo(-21, 62);
  ctx.closePath();
  ctx.fill();

  drawCapsule(ctx, -34, -42, -40, 2, 7, "#e7bc8d");
  drawCapsule(ctx, 34, -42, 40, 2, 7, "#e7bc8d");

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
  const len = Math.max(Math.hypot(dx, dy), 0.0001);
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
    ctx.drawImage(keeperSprite, -spriteW / 2, -spriteH / 2, spriteW, spriteH);
  } else {
    ctx.fillStyle = "#d8d8d8";
    ctx.fillRect(-25, -25, 50, 70);
  }

  ctx.restore();

  keeper.pose = {
    handX: x,
    handY: y - 8,
    reachX: keeper.dive === "left" || keeper.dive === "right" ? 62 : 52,
    reachY: keeper.dive === "crouch" ? 30 : 38,
  };
}

function drawBall() {
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.beginPath();
  ctx.ellipse(ball.x + 3, ball.y + 9, ball.radius + 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#3a3a3a";
  ctx.beginPath();
  ctx.moveTo(ball.x - 8, ball.y - 4);
  ctx.lineTo(ball.x - 3, ball.y - 10);
  ctx.lineTo(ball.x + 4, ball.y - 8);
  ctx.lineTo(ball.x + 6, ball.y - 1);
  ctx.lineTo(ball.x, ball.y + 4);
  ctx.lineTo(ball.x - 7, ball.y + 2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(ball.x + 9, ball.y + 4, 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(ball.x - 11, ball.y + 7, 3.4, 0, Math.PI * 2);
  ctx.fill();
}

function hydrateStoredQuestionBank() {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    initializeQuestionBank(getDefaultQuestionBank());
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    initializeQuestionBank(parsed);
    ui.modeSelect.value = state.questionBank.mode;
    ui.uploadInfo.textContent = `Banco local carregado com ${state.questionBank.questions.length} perguntas.`;
  } catch {
    initializeQuestionBank(getDefaultQuestionBank());
  }
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
ui.loadQuestionsBtn.addEventListener("click", loadQuestionsFromFile);
ui.downloadTemplateBtn.addEventListener("click", downloadTemplate);
ui.modeSelect.addEventListener("change", () => {
  if (!state.questionBank) return;
  state.questionBank.mode = ui.modeSelect.value === "random" ? "random" : "ordered";
  state.questionBank.queue = state.questionBank.mode === "random"
    ? shuffle(state.questionBank.questions)
    : [...state.questionBank.questions];
  state.questionBank.pointer = 0;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
    mode: state.questionBank.mode,
    questions: state.questionBank.questions,
  }));
});

buildStaticBackground();
hydrateStoredQuestionBank();
resetRound();
requestAnimationFrame(gameLoop);
