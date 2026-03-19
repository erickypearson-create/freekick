(function () {
"use strict";

if (window.__freekickBooted) return;
window.__freekickBooted = true;
window.__freekickCoreLoaded = true;

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
  activitySection: document.getElementById("activitySection"),
  activityList: document.getElementById("activityList"),
  activitySummary: document.getElementById("activitySummary"),
};

const STORAGE_KEY = "freekick-question-bank-v10";
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

const LEVEL_SEQUENCE = ["A1", "A2", "B1", "B2", "C1"];

function buildChoiceQuestion(prompt, correct, wrong) {
  return { prompt, correct, wrong };
}

function buildEnglishPool() {
  return {
    A1: [
      buildChoiceQuestion("Choose the correct sentence about routines:", "She gets up at seven every day.", ["She get up at seven every day.", "She getting up at seven every day.", "She gets up at seven every days."]),
      buildChoiceQuestion("Choose the word that completes: 'I ___ breakfast at 7:00.'", "have", ["am", "do", "make"]),
      buildChoiceQuestion("Choose the correct sentence about school:", "They study English on Mondays.", ["They studies English on Mondays.", "They studying English on Mondays.", "They study English at Mondays."]),
      buildChoiceQuestion("Choose the correct question:", "Where do you live?", ["Where you live?", "Where does you live?", "Where do you lives?"]),
      buildChoiceQuestion("Choose the correct sentence about possession:", "This is my brother's backpack.", ["This is my brothers backpack.", "This are my brother's backpack.", "This is my brother backpacks."]),
      buildChoiceQuestion("Choose the correct preposition:", "The cat is under the chair.", ["The cat is between the chair.", "The cat is on the chair under.", "The cat is in the chair under."]),
      buildChoiceQuestion("Choose the correct sentence about daily actions:", "He plays soccer after school.", ["He play soccer after school.", "He is play soccer after school.", "He plays soccer in after school."]),
      buildChoiceQuestion("Choose the correct plural form:", "children", ["childs", "childrens", "childes"]),
    ],
    A2: [
      buildChoiceQuestion("Choose the correct option:", "He doesn't like rainy days.", ["He don't likes rainy days.", "He doesn't likes rainy days.", "He not like rainy days."]),
      buildChoiceQuestion("Choose the opposite of 'difficult':", "easy", ["heavy", "noisy", "dangerous"]),
      buildChoiceQuestion("Choose the best option for the past tense:", "We visited our grandparents last weekend.", ["We visit our grandparents last weekend.", "We visits our grandparents last weekend.", "We have visit our grandparents last weekend."]),
      buildChoiceQuestion("Choose the sentence with the correct quantifier:", "There are a few apples on the table.", ["There is a few apples on the table.", "There are much apples on the table.", "There are a little apples on the table."]),
      buildChoiceQuestion("Choose the best response:", "I'm going to the library because I need to study.", ["I go to library because study.", "I'm go to the library because I need study.", "I going to the library because I need to studying."]),
      buildChoiceQuestion("Choose the correct comparative form:", "My backpack is heavier than yours.", ["My backpack is more heavy than yours.", "My backpack is heaviest than yours.", "My backpack heavier than yours is."]),
      buildChoiceQuestion("Choose the correct sentence about plans:", "She is going to travel in July.", ["She going to travel in July.", "She is go to travel in July.", "She is going travel in July."]),
      buildChoiceQuestion("Choose the best option for advice:", "You should drink more water.", ["You should to drink more water.", "You should drinking more water.", "You should drinks more water."]),
    ],
    B1: [
      buildChoiceQuestion("Pick the grammatically correct sentence:", "Where does your brother work?", ["Where do your brother works?", "Where does your brother works?", "Where your brother does work?"]),
      buildChoiceQuestion("Choose the best synonym for 'happy':", "glad", ["angry", "tired", "lazy"]),
      buildChoiceQuestion("Choose the sentence with the correct present perfect form:", "I have never tried sushi before.", ["I never have tried sushi before.", "I has never tried sushi before.", "I have never try sushi before."]),
      buildChoiceQuestion("Choose the best connector:", "I stayed home because it was raining.", ["I stayed home although it was raining because.", "I stayed home so it was raining.", "I stayed home during it was raining."]),
      buildChoiceQuestion("Choose the most natural sentence:", "If I have time, I'll call you tonight.", ["If I will have time, I'll call you tonight.", "If I have time, I call you tonight.", "If I had time, I'll call you tonight."]),
      buildChoiceQuestion("Choose the sentence with the correct modal:", "You must wear a seat belt in the car.", ["You must to wear a seat belt in the car.", "You must wearing a seat belt in the car.", "You must wears a seat belt in the car."]),
      buildChoiceQuestion("Choose the sentence with the correct relative pronoun:", "The teacher who helped me was very kind.", ["The teacher which helped me was very kind.", "The teacher whose helped me was very kind.", "The teacher where helped me was very kind."]),
      buildChoiceQuestion("Choose the best paraphrase of 'give up':", "stop trying", ["arrive early", "speak louder", "return later"]),
    ],
    B2: [
      buildChoiceQuestion("Choose the sentence with the correct tense:", "By the time we arrived, the movie had started.", ["By the time we arrived, the movie has started.", "By the time we arrived, the movie started already.", "By the time we arrived, the movie was start."]),
      buildChoiceQuestion("Choose the best connector:", "although", ["because of", "during", "unless not"]),
      buildChoiceQuestion("Choose the most accurate sentence:", "She would have joined us if she had finished work earlier.", ["She would joined us if she had finished work earlier.", "She would have joined us if she finished work earlier.", "She had joined us if she would have finished work earlier."]),
      buildChoiceQuestion("Choose the sentence with the correct passive voice:", "The new bridge was built in 2019.", ["The new bridge built in 2019.", "The new bridge was build in 2019.", "The new bridge has build in 2019."]),
      buildChoiceQuestion("Choose the best reporting verb sentence:", "He admitted taking the money.", ["He admitted to take the money.", "He admitted take the money.", "He admitted that taking the money."]),
      buildChoiceQuestion("Choose the correct sentence with 'used to':", "I used to play chess every weekend.", ["I use to play chess every weekend.", "I used to played chess every weekend.", "I was used to play chess every weekend."]),
      buildChoiceQuestion("Choose the sentence with the best formal register:", "We regret to inform you that your application was unsuccessful.", ["We are sorry to say your application didn't work out, okay?", "We regret inform you your application was unsuccessful.", "We regret to informing you that your application was unsuccessful."]),
      buildChoiceQuestion("Choose the most suitable linker:", "Therefore", ["Meanwhile not", "Despite", "Besides of"]),
    ],
    C1: [
      buildChoiceQuestion("Choose the most natural formal sentence:", "Had I known about the delay, I would have left later.", ["If I knew about the delay, I would left later.", "Had I knew about the delay, I would have left later.", "If I had know about the delay, I left later."]),
      buildChoiceQuestion("Choose the word closest in meaning to 'thorough':", "comprehensive", ["careless", "brief", "uncertain"]),
      buildChoiceQuestion("Choose the sentence with the most precise academic style:", "The findings suggest a significant correlation between sleep and memory retention.", ["The findings say sleep and memory are kind of linked.", "The findings suggests a significant correlation between sleep and memory retention.", "The findings suggest a significant correlation among sleep with memory retention."]),
      buildChoiceQuestion("Choose the best inversion structure:", "Rarely have we seen such an impressive performance.", ["Rarely we have seen such an impressive performance.", "Rarely have seen we such an impressive performance.", "Rarely we saw such an impressive performance have."]),
      buildChoiceQuestion("Choose the best collocation:", "reach a consensus", ["arrive a consensus", "touch a consensus", "make a consensus together"]),
      buildChoiceQuestion("Choose the sentence with the correct nuanced modal:", "You might have overlooked the final paragraph.", ["You may had overlooked the final paragraph.", "You might overlooked the final paragraph.", "You might have overlook the final paragraph."]),
      buildChoiceQuestion("Choose the most natural paraphrase of 'the plan fell through':", "the plan failed unexpectedly", ["the plan moved ahead quickly", "the plan became more expensive", "the plan was written down"]),
      buildChoiceQuestion("Choose the sentence with the correct advanced linker:", "Notwithstanding the criticism, the proposal was approved.", ["Notwithstanding of the criticism, the proposal was approved.", "Notwithstanding the criticism, the proposal approved.", "Notwithstanding criticism, was the proposal approved."]),
    ],
  };
}

const ENGLISH_POOL = buildEnglishPool();

const state = {
  phase: "idle",
  index: 0,
  roundQuestions: [],
  roundAnswers: {},
  selectedAnswers: {},
  playerChoices: {},
  bank: { mode: "ordered", questions: [], pointer: 0 },
  generated: { orderedPointer: 0, randomQueue: [] },
  worksheetActivities: [],
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


const ACTIVITY_LABEL_RE = /^([a-z])(?:[.)]|$)\s*/i;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function sentenceCase(value) {
  const text = normalizeWhitespace(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function splitTextIntoLines(items, pageHeight) {
  const rows = [];
  const sorted = [...items].sort((a, b) => {
    const ay = a.transform?.[5] || 0;
    const by = b.transform?.[5] || 0;
    if (Math.abs(by - ay) > 4) return by - ay;
    return (a.transform?.[4] || 0) - (b.transform?.[4] || 0);
  });

  sorted.forEach((item) => {
    const str = normalizeWhitespace(item.str);
    if (!str) return;
    const x = item.transform?.[4] || 0;
    const y = pageHeight - (item.transform?.[5] || 0);
    const last = rows[rows.length - 1];
    if (last && Math.abs(last.y - y) < 8) {
      last.parts.push({ x, str });
      last.y = (last.y + y) / 2;
    } else {
      rows.push({ y, parts: [{ x, str }] });
    }
  });

  return rows
    .map((row) => ({
      y: row.y,
      text: row.parts.sort((a, b) => a.x - b.x).map((part) => part.str).join(" ").replace(/\s+/g, " ").trim(),
    }))
    .filter((row) => row.text);
}

function isLikelyInstruction(text) {
  return /^\d+\s/.test(text) || /choose|match|look at|write|put in order|complete/i.test(text);
}

function extractChoicePairs(lines) {
  const groups = [];
  let current = null;
  lines.forEach((line) => {
    const match = line.match(ACTIVITY_LABEL_RE);
    if (match) {
      if (current) groups.push(current);
      current = { label: match[1].toLowerCase(), text: line.replace(ACTIVITY_LABEL_RE, "").trim(), options: [] };
      return;
    }
    if (!current) return;
    current.options.push(line);
  });
  if (current) groups.push(current);
  return groups.filter((group) => group.text || group.options.length);
}

function buildActivitySections(pageNumber, lines, image) {
  const sections = [];
  let current = null;

  lines.forEach((line) => {
    if (isLikelyInstruction(line.text)) {
      if (current && current.lines.length) sections.push(current);
      current = {
        pageNumber,
        title: line.text,
        image,
        lines: [],
      };
      return;
    }

    if (!current) {
      current = { pageNumber, title: `Página ${pageNumber}`, image, lines: [] };
    }
    current.lines.push(line.text);
  });

  if (current && current.lines.length) sections.push(current);

  return sections.map((section, index) => {
    const choiceGroups = extractChoicePairs(section.lines);
    const fillItems = section.lines.filter((line) => /_{3,}/.test(line));
    const orderingItems = section.lines.filter((line) => /\|/.test(line));

    let type = "reference";
    if (choiceGroups.length >= 2 && choiceGroups.some((group) => group.options.length >= 2)) type = "multiple-choice";
    else if (fillItems.length >= 1) type = "fill-in-the-blank";
    else if (orderingItems.length >= 1) type = "put-in-order";

    return {
      id: `page-${pageNumber}-section-${index + 1}`,
      pageNumber,
      title: section.title,
      image: section.image,
      type,
      rawLines: section.lines,
      choiceGroups,
      fillItems,
      orderingItems: orderingItems.map((line) => ({
        prompt: line,
        tokens: line.split("|").map((part) => normalizeWhitespace(part)).filter(Boolean),
      })),
    };
  });
}

function renderWorksheetActivities() {
  if (!ui.activitySection || !ui.activityList || !ui.activitySummary) return;

  ui.activityList.innerHTML = "";
  const activities = state.worksheetActivities || [];
  if (!activities.length) {
    ui.activitySection.classList.add("hidden");
    ui.activitySummary.textContent = "";
    return;
  }

  ui.activitySection.classList.remove("hidden");
  ui.activitySummary.textContent = `PDF interpretado em ${activities.length} atividade(s) replicável(is).`;

  activities.forEach((activity, index) => {
    const card = document.createElement("article");
    card.className = "activity-card";

    const imageHtml = activity.image ? `<img class="activity-thumb" src="${activity.image}" alt="Prévia da página ${activity.pageNumber}" />` : "";
    const referenceHtml = activity.rawLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");

    let bodyHtml = "";
    if (activity.type === "multiple-choice") {
      bodyHtml = activity.choiceGroups.map((group) => `
        <div class="activity-block">
          <p class="activity-item-label">${escapeHtml(group.label)}) ${escapeHtml(group.text || "Observe a imagem e marque a resposta correta.")}</p>
          <div class="activity-options">${group.options.map((option) => `<label><input type="radio" name="${activity.id}-${group.label}"> <span>${escapeHtml(option)}</span></label>`).join("")}</div>
        </div>
      `).join("");
    } else if (activity.type === "fill-in-the-blank") {
      bodyHtml = activity.fillItems.map((line, lineIndex) => `
        <label class="activity-fill">
          <span>${escapeHtml(line.replace(/_{3,}/g, "_____"))}</span>
          <input type="text" placeholder="Digite sua resposta" aria-label="Resposta ${lineIndex + 1} da atividade ${index + 1}">
        </label>
      `).join("");
    } else if (activity.type === "put-in-order") {
      bodyHtml = activity.orderingItems.map((item) => `
        <div class="activity-block">
          <p>${escapeHtml(item.prompt)}</p>
          <div class="token-row">${item.tokens.map((token) => `<button type="button" class="token-chip">${escapeHtml(token)}</button>`).join("")}</div>
          <input type="text" class="order-answer" placeholder="Monte a frase na ordem correta">
        </div>
      `).join("");
    } else {
      bodyHtml = `<ul class="activity-reference-list">${referenceHtml}</ul>`;
    }

    card.innerHTML = `
      <div class="activity-card-header">
        <div>
          <p class="activity-kicker">Página ${activity.pageNumber} · ${sentenceCase(activity.type.replace(/-/g, " "))}</p>
          <h3>${escapeHtml(activity.title)}</h3>
        </div>
      </div>
      <div class="activity-card-body">
        ${imageHtml}
        <div class="activity-content">
          ${bodyHtml}
          <details class="activity-reference">
            <summary>Texto detectado da página</summary>
            <ul class="activity-reference-list">${referenceHtml}</ul>
          </details>
        </div>
      </div>
    `;

    ui.activityList.appendChild(card);
  });
}

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

function getAllGeneratedEntries() {
  return LEVEL_SEQUENCE.flatMap((level) => (ENGLISH_POOL[level] || []).map((entry, index) => ({ ...entry, level, key: `${level}-${index}` })));
}

const GENERATED_ENTRIES = getAllGeneratedEntries();

function resetGeneratedCycle() {
  state.generated.orderedPointer = 0;
  state.generated.randomQueue = [];
}

function nextGeneratedBase() {
  if (!GENERATED_ENTRIES.length) {
    return buildChoiceQuestion("Choose the correct option:", "hello", ["bye", "green", "quickly"]);
  }

  if (state.bank.mode === "random") {
    if (!state.generated.randomQueue.length) {
      state.generated.randomQueue = shuffle(GENERATED_ENTRIES);
    }
    return state.generated.randomQueue.pop();
  }

  const entry = GENERATED_ENTRIES[state.generated.orderedPointer % GENERATED_ENTRIES.length];
  state.generated.orderedPointer += 1;
  return entry;
}

function buildRandomEnglishQuestion(dimension) {
  const base = nextGeneratedBase();
  const options = shuffle([base.correct, ...base.wrong]).slice(0, 4);
  return {
    dimension,
    prompt: `${base.prompt} (${base.level})`,
    choices: options,
    correctAnswer: String.fromCharCode(65 + options.findIndex((o) => o === base.correct)),
    commandValue: randomChoice(OPTIONS[dimension]),
    level: base.level,
  };
}

function loadBank() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.bank = {
      mode: parsed.mode === "random" ? "random" : "ordered",
      questions: Array.isArray(parsed.questions) ? parsed.questions.filter(isValid) : [],
      pointer: 0,
    };
    state.generated = { orderedPointer: 0, randomQueue: [] };
    state.worksheetActivities = Array.isArray(parsed.worksheetActivities) ? parsed.worksheetActivities : [];
    ui.modeSelect.value = state.bank.mode;
    renderWorksheetActivities();
  } catch {
    state.bank = { mode: "ordered", questions: [], pointer: 0 };
    state.generated = { orderedPointer: 0, randomQueue: [] };
    state.worksheetActivities = [];
    renderWorksheetActivities();
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

function persistBank() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    mode: state.bank.mode,
    questions: state.bank.questions,
    worksheetActivities: state.worksheetActivities,
  }));
}

function syncQuestionMode() {
  const nextMode = ui.modeSelect.value === "random" ? "random" : "ordered";
  if (state.bank.mode === nextMode) return;
  state.bank.mode = nextMode;
  state.bank.pointer = 0;
  resetGeneratedCycle();
  persistBank();
}

function startRound() {
  syncQuestionMode();
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
  const r = 21 * scale;
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(x + 4, y + r + 9, r * 0.95, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 3;
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

function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function pickRowValue(row, aliases) {
  const normalizedMap = Object.entries(row).reduce((acc, [key, value]) => {
    acc[normalizeHeader(key)] = value;
    return acc;
  }, {});

  for (const alias of aliases) {
    const value = normalizedMap[normalizeHeader(alias)];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
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
    dimension: parseDimension(pickRowValue(r, ["dimension", "dimensao", "direcao/altura/forca"])),
    prompt: String(pickRowValue(r, ["prompt", "pergunta", "question", "enunciado"])).trim(),
    choices: [
      pickRowValue(r, ["choiceA", "alternativaA", "opcaoA", "a"]),
      pickRowValue(r, ["choiceB", "alternativaB", "opcaoB", "b"]),
      pickRowValue(r, ["choiceC", "alternativaC", "opcaoC", "c"]),
      pickRowValue(r, ["choiceD", "alternativaD", "opcaoD", "d"]),
    ].map((value) => String(value || "").trim()).filter(Boolean),
    correctAnswer: String(pickRowValue(r, ["correctAnswer", "correct", "respostacorreta", "gabarito"])).trim().toUpperCase(),
    commandValue: String(pickRowValue(r, ["commandValue", "command", "valorcomando", "acao", "action"])).trim().toLowerCase(),
    level: String(pickRowValue(r, ["level", "nivel", "cefr"])).trim().toUpperCase(),
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

function getPdfJsLib() {
  if (window.pdfjsLib) return window.pdfjsLib;
  if (window["pdfjs-dist/build/pdf"]) return window["pdfjs-dist/build/pdf"];
  return null;
}

async function renderPdfPagePreview(page) {
  const viewport = page.getViewport({ scale: 0.55 });
  const previewCanvas = document.createElement("canvas");
  const previewCtx = previewCanvas.getContext("2d");
  previewCanvas.width = Math.ceil(viewport.width);
  previewCanvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: previewCtx, viewport }).promise;
  return {
    canvas: previewCanvas,
    image: previewCanvas.toDataURL("image/jpeg", 0.82),
  };
}

async function extractTextWithOcr(canvas) {
  if (!window.Tesseract) return [];
  try {
    const result = await window.Tesseract.recognize(canvas, "eng");
    return String(result?.data?.text || "")
      .split(/\n+/)
      .map((line) => ({ text: normalizeWhitespace(line) }))
      .filter((line) => line.text);
  } catch (_) {
    return [];
  }
}

async function parsePdf(file) {
  const pdfjs = getPdfJsLib();
  if (!pdfjs) throw new Error("PDF indisponível no navegador. Recarregue a página e tente novamente.");

  const bytes = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const chunks = [];
  const activities = [];

  for (let p = 1; p <= pdf.numPages; p += 1) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    let lines = splitTextIntoLines(content.items, viewport.height);
    const preview = await renderPdfPagePreview(page);
    if (!lines.length) {
      lines = await extractTextWithOcr(preview.canvas);
    }
    chunks.push(lines.map((line) => line.text).join("\n"));
    activities.push(...buildActivitySections(p, lines, preview.image));
  }

  return {
    questions: parseBlocks(chunks.join("\n\n")),
    activities,
  };
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
  let worksheetActivities = [];

  try {
    if (ext === "csv") questions = await parseCsvOrTsv(file);
    else if (ext === "xlsx") questions = await parseXlsx(file);
    else if (ext === "docx") questions = await parseDocx(file);
    else if (ext === "pdf") {
      const parsed = await parsePdf(file);
      questions = parsed.questions;
      worksheetActivities = parsed.activities;
    } else throw new Error("Formato não suportado");
  } catch (err) {
    ui.uploadInfo.textContent = `Erro de leitura: ${err.message}`;
    return;
  }

  if (!questions.length && !worksheetActivities.length) {
    ui.uploadInfo.textContent = "Nenhuma pergunta válida encontrada. Use o template.";
    return;
  }

  state.bank = { mode: ui.modeSelect.value === "random" ? "random" : "ordered", questions, pointer: 0 };
  resetGeneratedCycle();
  state.worksheetActivities = worksheetActivities;
  persistBank();
  renderWorksheetActivities();
  const parts = [];
  if (questions.length) parts.push(`${questions.length} pergunta(s) do quiz`);
  if (worksheetActivities.length) parts.push(`${worksheetActivities.length} atividade(s) replicada(s) do PDF`);
  ui.uploadInfo.textContent = `Banco carregado com ${parts.join(" e ")}.`;
}

function downloadTemplate() {
  const csv = [
    "dimension,prompt,choiceA,choiceB,choiceC,choiceD,correctAnswer,commandValue,level",
    "direction,Where does she live?,She live at school.,She lives at school.,She lives at her house.,She living at home.,C,left,A1",
    "height,Choose the correct sentence.,He don't like apples.,He doesn't likes apples.,He doesn't like apples.,He not like apples.,C,high,A2",
    "power,Choose the best synonym for happy.,sad,angry,glad,noisy,C,strong,B1",
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
ui.modeSelect.addEventListener("change", syncQuestionMode);

loadBank();
renderWorksheetActivities();
draw();

})();
