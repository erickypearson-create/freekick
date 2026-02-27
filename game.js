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

const STORAGE_KEY = "freekick-question-bank-v4";
const DIMENSIONS = ["direction", "height", "power"];
const OPTIONS = {
  direction: ["left", "center", "right"],
  height: ["low", "mid", "high"],
  power: ["weak", "medium", "strong"],
};

const BALL_START = { x: canvas.width / 2, y: canvas.height - 64 };

const defaults = [
  {
    dimension: "direction",
    prompt: "Which side should the striker target?",
    choices: ["Left", "Center", "Right"],
    correctAnswer: "A",
    commandValue: "left",
  },
  {
    dimension: "height",
    prompt: "What is the target height?",
    choices: ["Low", "Mid", "High"],
    correctAnswer: "A",
    commandValue: "low",
  },
  {
    dimension: "power",
    prompt: "How strong should the shot be?",
    choices: ["Weak", "Medium", "Strong"],
    correctAnswer: "C",
    commandValue: "strong",
  },
];

const state = {
  phase: "idle",
  index: 0,
  roundQuestions: [],
  roundAnswers: {},
  bank: { mode: "ordered", questions: defaults.slice(), pointer: 0 },
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
};

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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

function loadBank() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.questions) || !parsed.questions.length) return;

    state.bank = {
      mode: parsed.mode === "random" ? "random" : "ordered",
      questions: parsed.questions.filter(isValid),
      pointer: 0,
    };
  } catch {
    state.bank = { mode: "ordered", questions: defaults.slice(), pointer: 0 };
  }
}

function nextQuestion(dimension) {
  const source = state.bank.mode === "random" ? shuffle(state.bank.questions) : state.bank.questions;
  for (let i = 0; i < source.length; i += 1) {
    const idx = (state.bank.pointer + i) % source.length;
    if (source[idx].dimension === dimension) {
      state.bank.pointer = idx + 1;
      return source[idx];
    }
  }
  return defaults.find((q) => q.dimension === dimension);
}

function startRound() {
  state.phase = "quiz";
  state.index = 0;
  state.roundAnswers = {};
  state.roundQuestions = DIMENSIONS.map((d) => nextQuestion(d));

  ui.startBtn.classList.add("hidden");
  ui.nextBtn.classList.add("hidden");
  ui.summary.textContent = "";
  ui.result.textContent = "Responda as perguntas.";

  showCurrentQuestion();
  draw();
}

function showCurrentQuestion() {
  const item = state.roundQuestions[state.index];
  if (!item) {
    resolveShot();
    return;
  }

  ui.phase.textContent = item.dimension;
  ui.question.textContent = item.prompt;
  ui.answers.innerHTML = "";

  item.choices.forEach((choice, idx) => {
    const key = String.fromCharCode(65 + idx);
    const btn = document.createElement("button");
    btn.textContent = `${key}) ${choice}`;
    btn.addEventListener("click", () => answerQuestion(item, key));
    ui.answers.appendChild(btn);
  });
}

function answerQuestion(item, choiceKey) {
  state.roundAnswers[item.dimension] = {
    correct: choiceKey === item.correctAnswer,
    commandValue: item.commandValue,
  };
  state.index += 1;
  showCurrentQuestion();
}

function randomOther(dimension, expected) {
  const arr = OPTIONS[dimension].filter((x) => x !== expected);
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveShot() {
  const commands = {};
  let correct = 0;

  DIMENSIONS.forEach((dim) => {
    const ans = state.roundAnswers[dim];
    if (ans.correct) {
      commands[dim] = ans.commandValue;
      correct += 1;
    } else {
      commands[dim] = randomOther(dim, ans.commandValue);
    }
  });

  const outcome = correct === DIMENSIONS.length ? "GOL" : correct === 0 ? "FORA" : "TRAVE";
  ui.result.textContent = outcome;
  ui.answers.innerHTML = "";
  ui.summary.textContent = `Comandos finais: direção=${commands.direction}, altura=${commands.height}, força=${commands.power}.`;

  animateShot(commands);
}

function animateShot(commands) {
  state.phase = "flight";
  state.ball.t = 0;
  state.ball.startX = BALL_START.x;
  state.ball.startY = BALL_START.y;
  state.ball.targetX = commands.direction === "left"
    ? canvas.width / 2 - 90
    : commands.direction === "right"
      ? canvas.width / 2 + 90
      : canvas.width / 2;

  state.ball.targetY = commands.height === "low" ? 303 : commands.height === "high" ? 245 : 275;
  state.ball.controlX = (state.ball.startX + state.ball.targetX) / 2;
  state.ball.controlY = commands.height === "high" ? 190 : 230;
  state.ball.speed = commands.power === "weak" ? 0.015 : commands.power === "strong" ? 0.032 : 0.022;

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
  const gx = 36;
  const gy = 164;
  const gw = canvas.width - 72;
  const gh = 130;

  ctx.lineWidth = 6;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeRect(gx, gy, gw, gh);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  for (let x = gx + 8; x < gx + gw; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, gy + 6);
    ctx.lineTo(x, gy + gh - 2);
    ctx.stroke();
  }
  for (let y = gy + 8; y < gy + gh; y += 10) {
    ctx.beginPath();
    ctx.moveTo(gx + 4, y);
    ctx.lineTo(gx + gw - 4, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(gx - 8, gy, 8, gh + 6);
  ctx.fillRect(gx + gw, gy, 8, gh + 6);
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
  return rows
    .map((r) => ({
      dimension: parseDimension(r.dimension),
      prompt: String(r.prompt || "").trim(),
      choices: [r.choiceA, r.choiceB, r.choiceC, r.choiceD].filter(Boolean),
      correctAnswer: String(r.correctAnswer || "").trim().toUpperCase(),
      commandValue: String(r.commandValue || "").trim().toLowerCase(),
    }))
    .filter(isValid);
}

async function parseXlsx(file) {
  if (!window.XLSX) throw new Error("XLSX indisponível");
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
  const rows = blocks.map((block) => {
    const row = {};
    block.split("\n").forEach((line) => {
      const split = line.indexOf(":");
      if (split < 0) return;
      const key = line.slice(0, split).trim();
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
    "direction,Which side should the striker target?,Left,Center,Right,Far right,A,left",
    "height,What is the target height?,Low,Mid,High,Very high,A,low",
    "power,How strong should the shot be?,Weak,Medium,Strong,Very strong,C,strong",
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
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
