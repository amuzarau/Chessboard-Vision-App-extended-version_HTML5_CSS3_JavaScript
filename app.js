document.addEventListener("DOMContentLoaded", () => {
  // --- Utility functions ---
  const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const RANKS = [1, 2, 3, 4, 5, 6, 7, 8];

  // a,c,e,g -> odd file; b,d,f,h -> even file
  const isOddFile = (f) => (f.charCodeAt(0) - 97) % 2 === 0;
  const isOddRank = (r) => r % 2 === 1;

  // Correct rule: same parity -> black; different -> white  (so a1 is black)
  const squareColor = (f, r) =>
    isOddFile(f) === isOddRank(r) ? "black" : "white";

  // --- State ---
  const state = {
    mode: "file",
    running: false,
    current: null,
    correct: 0,
    total: 0,
  };

  // --- DOM ---
  const app = document.getElementById("app");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const badge = document.getElementById("badge");
  const qEl = document.getElementById("question");
  const choices = document.getElementById("choices");
  const feedback = document.getElementById("feedback");
  const correctEl = document.getElementById("correct");
  const totalEl = document.getElementById("total");
  const accuracyEl = document.getElementById("accuracy");
  const startStopBtn = document.getElementById("startstop");
  const miniBoard = document.getElementById("miniBoard");

  // Ensure these exist (helpful if something was copied incompletely)
  if (!startStopBtn || !miniBoard) {
    console.error("Start/Stop button or miniBoard not found in DOM.");
    return;
  }

  // Build tiny board once with correct coloring
  function buildMiniBoard() {
    let html = "";
    for (let r = 8; r >= 1; r--) {
      for (let i = 0; i < 8; i++) {
        const f = FILES[i];
        const dark = squareColor(f, r) === "black";
        html += `<div class="sq ${
          dark ? "d" : "l"
        }" data-f="${f}" data-r="${r}"></div>`;
      }
    }
    miniBoard.innerHTML = html;
  }
  buildMiniBoard();

  function highlightMiniSquare(f, r) {
    miniBoard.querySelectorAll(".sq").forEach((s) => s.classList.remove("hi"));
    const sq = miniBoard.querySelector(`.sq[data-f="${f}"][data-r="${r}"]`);
    if (sq) sq.classList.add("hi");
  }

  function setMode(mode) {
    state.mode = mode;

    miniBoard.classList.toggle("matte", mode === "square");

    tabs.forEach((t) => (t.dataset.active = String(t.dataset.mode === mode)));
    feedback.textContent = "";
    app.classList.add("flash");
    setTimeout(() => app.classList.remove("flash"), 200);
    switch (mode) {
      case "file":
        badge.textContent = "Вертикаль • нечётная или чётная?";
        setChoices("нечётная (← / O)", "Чётная (→ / E)");
        break;
      case "rank":
        badge.textContent = "Горизонталь • нечётная или чётная?";
        setChoices("нечётная (← / O)", "чётная (→ / E)");
        break;
      case "square":
        badge.textContent = "Клетка • чёрная или белая?";
        setChoices("чёрная (← / B)", "белая (→ / W)");
        break;
    }
    resetStats();
    nextQuestion();
  }

  function setChoices(left, right) {
    const [l, r] = choices.querySelectorAll(".choice");
    l.textContent = left;
    r.textContent = right;
  }

  function resetStats() {
    state.correct = 0;
    state.total = 0;
    updateStats();
  }
  function updateStats() {
    correctEl.textContent = state.correct;
    totalEl.textContent = state.total;
    accuracyEl.textContent =
      (state.total ? Math.round((100 * state.correct) / state.total) : 0) + "%";
  }

  function rand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function nextQuestion() {
    if (state.mode === "file") {
      const f = rand(FILES);
      state.current = { type: "file", f };
      qEl.textContent = f;
      highlightMiniSquare(f, rand(RANKS));
    } else if (state.mode === "rank") {
      const r = rand(RANKS);
      state.current = { type: "rank", r };
      qEl.textContent = String(r);
      highlightMiniSquare(rand(FILES), r);
    } else {
      const f = rand(FILES);
      const r = rand(RANKS);
      state.current = { type: "square", f, r };
      qEl.textContent = `${f}${r}`;
      highlightMiniSquare(f, r);
    }
  }

  function check(answer) {
    if (!state.running) return;
    let ok = false,
      explain = "";
    const c = state.current;

    if (c.type === "file") {
      const odd = isOddFile(c.f);
      ok = (answer === "left" && odd) || (answer === "right" && !odd);
      explain = `${c.f} → ${odd ? "нечётная" : "чётная"}`;
    } else if (c.type === "rank") {
      const odd = isOddRank(c.r);
      ok = (answer === "left" && odd) || (answer === "right" && !odd);
      explain = `${c.r} → ${odd ? "нечётная" : "чётная"}`;
    } else {
      const col = squareColor(c.f, c.r);
      ok =
        (answer === "left" && col === "black") ||
        (answer === "right" && col === "white");

      const pf = isOddFile(c.f) ? "нечётная" : "чётная";
      const pr = isOddRank(c.r) ? "нечётная" : "чётная";
      explain = `${c.f}(${pf}) + ${c.r}(${pr}) → ${
        pf === pr ? "одинаковые → чёрная" : "разные → белая"
      }`;
    }

    state.total++;
    if (ok) {
      state.correct++;
      feedback.className = "feedback ok";
      feedback.textContent = "Правильно! " + explain;
    } else {
      feedback.className = "feedback bad";
      feedback.textContent = "Упс! " + explain;
    }
    updateStats();
    nextQuestion();
  }

  // --- Events ---
  tabs.forEach((t) =>
    t.addEventListener("click", () => setMode(t.dataset.mode))
  );

  document.querySelectorAll(".choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      check(btn.dataset.choice);
    });
  });

  startStopBtn.addEventListener("click", () => {
    state.running = !state.running;
    startStopBtn.dataset.running = String(state.running);
    startStopBtn.textContent = state.running ? "Стоп" : "Старт";
    feedback.textContent = state.running
      ? "Поехали! Отвечай, используя кнопки или клавиши."
      : "Пауза";
    app.classList.add("flash");
    setTimeout(() => app.classList.remove("flash"), 200);
  });

  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === " ") {
      startStopBtn.click();
      e.preventDefault();
      return;
    }
    if (k === "enter") {
      nextQuestion();
      return;
    }
    if (!state.running) return;
    if (["arrowleft", "o", "b"].includes(k)) check("left");
    if (["arrowright", "e", "w"].includes(k)) check("right");
  });

  // init
  setMode("file");
});
