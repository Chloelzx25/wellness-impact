(function () {
  let minigameEnded = false;
  let cleanupFns = [];

  function addCleanup(fn) {
    if (typeof fn === "function") cleanupFns.push(fn);
  }

  function cleanupMinigame() {
    cleanupFns.forEach(function (fn) {
      try { fn(); } catch (e) {}
    });
    cleanupFns = [];

    // also remove the minigame modal class if we added it
    const area = document.getElementById("minigameArea");
    const modalContent = area ? area.closest(".modal-content") : null;
    if (modalContent) modalContent.classList.remove("minigame-modal");
  }

  function endMinigameOnce(success) {
    if (minigameEnded) return;
    minigameEnded = true;

    // cleanup BEFORE calling back (prevents weird double triggers)
    cleanupMinigame();

    if (typeof window.finishMinigame === "function") {
      window.finishMinigame(!!success);
    } else {
      console.error("finishMinigame(success) is not defined in challenges.js");
    }
  }

  function initMinigame(element) {
    // IMPORTANT: clear anything from previous game
    cleanupMinigame();
    minigameEnded = false;

    const area = document.getElementById("minigameArea");
    if (!area) return;

    const modalContent = area.closest(".modal-content");
    if (modalContent) modalContent.classList.add("minigame-modal");

    const map = {
      Pyro: buildPyroTorchRushGame,
      Hydro: buildHydroCatchGame,
      Anemo: buildAnemoDirectionGame,
      Electro: buildElectroReactionGame,
      Dendro: buildDendroGrowthGame,
      Cryo: buildCryoBreakGame,
      Geo: buildGeoConstructGame
    };

    const builder = map[element] || buildPyroTorchRushGame;
    builder(area);
  }

  // ===============================
  // PYRO
  // ===============================
function buildPyroTorchRushGame(area) {
  const torchCount = 5;
  const seqLen = 4;

  // Make a random sequence of torch indices (0..torchCount-1), no repeats
  const indices = Array.from({ length: torchCount }, function (_, i) { return i; });
  const shuffled = indices.slice().sort(function () { return Math.random() - 0.5; });
  const seq = shuffled.slice(0, seqLen);

  let ended = false;
  let inputIdx = 0;
  let timeLeft = 10; // 🔥 change timer seconds here
  let countdownTimer = null;

  area.innerHTML = `
    <div class="text-light mb-2">
      <strong>Pyro Torch Rush</strong>: Memorize the ignition order, then light the torches!
    </div>

    <div class="text-light mb-2">
      Time left: <span id="pyroTime" class="fw-bold">${timeLeft}</span>s
      <span class="ms-2" id="pyroPhase">Watching...</span>
    </div>

    <div class="d-flex justify-content-center flex-wrap gap-2 mb-2" id="pyroTorches"></div>
    <div id="pyroInfo" class="text-light">Get ready…</div>
  `;

  //query inside area to avoid ID conflicts
  const torchWrap = area.querySelector("#pyroTorches");
  const timeEl = area.querySelector("#pyroTime");
  const phaseEl = area.querySelector("#pyroPhase");
  const info = area.querySelector("#pyroInfo");

  function endOnce(success) {
    if (ended) return;
    ended = true;

    if (countdownTimer) clearInterval(countdownTimer);
    disableAll();
    endMinigameOnce(success);
  }

  function disableAll() {
    Array.from(torchWrap.querySelectorAll("button")).forEach(function (b) {
      b.disabled = true;
    });
  }

  // Build torches
  const torches = [];
  for (let i = 0; i < torchCount; i++) {
    const b = document.createElement("button");
    b.className = "btn btn-outline-warning";
    b.style.minWidth = "64px";
    b.style.fontSize = "20px";
    b.textContent = "🕯️"; // unlit torch
    b.disabled = true;
    torchWrap.appendChild(b);
    torches.push(b);
  }

  // Cleanup
  addCleanup(function () {
    if (countdownTimer) clearInterval(countdownTimer);
    torches.forEach(function (b) { b.onclick = null; });
  });

  // Show sequence (watch phase)
  let showIdx = 0;
  const showTimer = setInterval(function () {
    if (ended) return;

    // reset all to unlit during showing (except highlighted one)
    torches.forEach(function (b) { b.textContent = "🕯️"; });

    if (showIdx >= seq.length) {
      clearInterval(showTimer);

      // Start play phase
      phaseEl.textContent = "Ignite!";
      info.textContent = "Light the torches in the same order!";
      torches.forEach(function (b) { b.disabled = false; });
      startCountdown();
      bindInput();
      return;
    }

    const torchIndex = seq[showIdx];
    torches[torchIndex].textContent = "🔥"; // highlight flame
    info.textContent = "Ignition " + (showIdx + 1);
    showIdx++;
  }, 700);

  addCleanup(function () { clearInterval(showTimer); });

  function startCountdown() {
    countdownTimer = setInterval(function () {
      if (ended) return;

      timeLeft--;
      timeEl.textContent = String(timeLeft);

      if (timeLeft <= 0) {
        info.textContent = "⏳ Too slow! The flames died out.";
        endOnce(false);
      }
    }, 1000);
  }

  function bindInput() {
    torches.forEach(function (btn, idx) {
      btn.onclick = function () {
        if (ended) return;

        const expected = seq[inputIdx];

        if (idx !== expected) {
          // Wrong torch = "Overload" penalty
          info.textContent = "💥 Overload! Wrong torch.";
          torches.forEach(function (b) { b.textContent = "🕯️"; b.disabled = true; });
          endOnce(false);
          return;
        }

        // Correct torch
        btn.textContent = "🔥";
        btn.disabled = true;
        inputIdx++;

        if (inputIdx >= seq.length) {
          info.textContent = "✅ Perfect ignition! Puzzle solved.";
          endOnce(true);
        }
      };

      addCleanup(function () { btn.onclick = null; });
    });
  }
}


  // ===============================
  // HYDRO: Catch 10 drops in 8 sec
  // ===============================
  function buildHydroCatchGame(area) {
    area.innerHTML = `
      <div class="text-light mb-2"><strong>Hydro Catch</strong>: Click the 💧 10 times in 8 seconds.</div>
      <div class="fs-2 mb-2" id="hydroDrop" style="cursor:pointer; user-select:none;">💧</div>
      <div class="text-light mb-1">Clicks: <span id="hydroScore">0</span> / 10</div>
      <div class="text-light">Time left: <span id="hydroTime">8</span>s</div>
    `;

    const drop = document.getElementById("hydroDrop");
    const scoreEl = document.getElementById("hydroScore");
    const timeEl = document.getElementById("hydroTime");

    let score = 0;
    let timeLeft = 8;

    drop.onclick = function () {
      score++;
      scoreEl.textContent = String(score);
      drop.style.transform =
        "translate(" +
        (Math.random() * 40 - 20).toFixed(0) +
        "px, " +
        (Math.random() * 40 - 20).toFixed(0) +
        "px)";
      if (score >= 10) {
        drop.onclick = null;
        endMinigameOnce(true);
      }
    };
    addCleanup(function () { drop.onclick = null; });

    const t = setInterval(function () {
      timeLeft--;
      timeEl.textContent = String(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(t);
        drop.onclick = null;
        endMinigameOnce(score >= 10);
      }
    }, 1000);

    addCleanup(function () { clearInterval(t); });
  }

  // ===============================
  // ANEMO: Follow direction (5 rounds)
  // ===============================
  function buildAnemoDirectionGame(area) {
    const dirs = [
      { k: "ArrowUp", label: "⬆️" },
      { k: "ArrowDown", label: "⬇️" },
      { k: "ArrowLeft", label: "⬅️" },
      { k: "ArrowRight", label: "➡️" }
    ];

    const rounds = 5;
    let current = 0;

    area.innerHTML = `
      <div class="text-light mb-2"><strong>Anemo Wind</strong>: Press the correct arrow key.</div>
      <div class="fs-1 mb-2" id="anemoPrompt">.</div>
      <div class="text-light" id="anemoInfo">Round 1 / ${rounds}</div>
      <div class="text-light mt-2"><small>(Tip: Click inside the modal first so it captures your keypress)</small></div>
    `;

    const prompt = document.getElementById("anemoPrompt");
    const info = document.getElementById("anemoInfo");
    let target = null;

    function nextRound() {
      if (current >= rounds) {
        cleanupKey();
        endMinigameOnce(true);
        return;
      }
      target = dirs[Math.floor(Math.random() * dirs.length)];
      prompt.textContent = target.label;
      info.textContent = "Round " + (current + 1) + " / " + rounds + " — press the matching arrow key";
    }

    function onKey(e) {
      if (!target) return;
      if (e.key === target.k) {
        current++;
        nextRound();
      } else {
        info.textContent = "❌ Wrong key! You failed.";
        cleanupKey();
        endMinigameOnce(false);
      }
    }

    function cleanupKey() {
      document.removeEventListener("keydown", onKey);
    }

    document.addEventListener("keydown", onKey);
    addCleanup(function () { cleanupKey(); });

    nextRound();
  }

  // ===============================
  // ELECTRO: Reaction time (click fast)
  // ===============================
  function buildElectroReactionGame(area) {
    area.innerHTML = `
      <div class="text-light mb-2"><strong>Electro Reflex</strong>: Wait for ⚡ then click fast!</div>
      <div class="fs-1 mb-2" id="electroSignal">⏳</div>
      <button class="btn btn-outline-electro" id="electroBtn" disabled>Click!</button>
      <div class="text-light mt-2" id="electroInfo">Get ready...</div>
    `;

    const signal = document.getElementById("electroSignal");
    const btn = document.getElementById("electroBtn");
    const info = document.getElementById("electroInfo");

    let canClick = false;
    let startTime = 0;

    const delay = 800 + Math.floor(Math.random() * 1400);

    const t = setTimeout(function () {
      signal.textContent = "⚡";
      btn.disabled = false;
      canClick = true;
      startTime = Date.now();
      info.textContent = "NOW!";
    }, delay);

    addCleanup(function () { clearTimeout(t); });

    btn.onclick = function () {
      if (!canClick) return;
      canClick = false;
      btn.disabled = true;

      const ms = Date.now() - startTime;
      info.textContent = "Your time: " + ms + "ms";

      // pass if <= 600ms
      endMinigameOnce(ms <= 600);
    };
    addCleanup(function () { btn.onclick = null; });
  }

  // ===============================
  // DENDRO: Balance growth (success 20–25)
  // ===============================
  function buildDendroGrowthGame(area) {
    area.innerHTML = `
      <div class="text-light mb-2">
        <strong>Dendro Balance</strong>: Grow the plant 🌿 to the right level!
      </div>

      <div class="progress mb-2" style="height: 20px;">
        <div id="growthBar" class="progress-bar bg-success" style="width: 0%"></div>
      </div>

      <div class="text-light mb-2">
        Growth: <span id="growthValue">0</span> / 25
      </div>

      <div class="fs-1 mb-3" id="dendroPlant" style="cursor:pointer; user-select:none;">
        🌱
      </div>

      <small class="text-muted">
        Reach <strong>20–25</strong> growth before time runs out.
      </small>
    `;

    const plant = document.getElementById("dendroPlant");
    const bar = document.getElementById("growthBar");
    const valueEl = document.getElementById("growthValue");

    let growth = 0;
    let timeLeft = 10; // seconds
    let ended = false;

    plant.onclick = function () {
      if (ended) return;

      growth += Math.random() < 0.7 ? 1 : 2;
      valueEl.textContent = String(growth);
      bar.style.width = Math.min((growth / 25) * 100, 100) + "%";

      // Overgrowth = fail
      if (growth > 25) {
        ended = true;
        plant.textContent = "🍂";
        endMinigameOnce(false);
      }
    };

    const timer = setInterval(function () {
      if (ended) return;

      timeLeft--;

      // Natural decay
      if (growth > 0) {
        growth--;
        valueEl.textContent = String(growth);
        bar.style.width = (growth / 25) * 100 + "%";
      }

      if (timeLeft <= 0) {
        ended = true;
        clearInterval(timer);

        if (growth >= 20 && growth <= 25) {
          plant.textContent = "🌳";
          endMinigameOnce(true);
        } else {
          plant.textContent = "🥀";
          endMinigameOnce(false);
        }
      }
    }, 1000);

    addCleanup(function () {
      clearInterval(timer);
      plant.onclick = null;
    });
  }

  // ===============================
  // CRYO: Break 8 ice in 8 sec
  // ===============================
  function buildCryoBreakGame(area) {
    area.innerHTML = `
      <div class="text-light mb-2"><strong>Cryo Break</strong>: Click 🧊 8 times in 8 seconds.</div>
      <div class="fs-1 mb-2" id="cryoIce" style="cursor:pointer; user-select:none;">🧊</div>
      <div class="text-light mb-1">Broken: <span id="cryoBroken">0</span> / 8</div>
      <div class="text-light">Time left: <span id="cryoTime">8</span>s</div>
    `;

    const ice = document.getElementById("cryoIce");
    const brokenEl = document.getElementById("cryoBroken");
    const timeEl = document.getElementById("cryoTime");

    let broken = 0;
    let timeLeft = 8;

    ice.onclick = function () {
      broken++;
      brokenEl.textContent = String(broken);
      if (broken >= 8) {
        ice.onclick = null;
        endMinigameOnce(true);
      }
    };
    addCleanup(function () { ice.onclick = null; });

    const t = setInterval(function () {
      timeLeft--;
      timeEl.textContent = String(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(t);
        ice.onclick = null;
        endMinigameOnce(broken >= 8);
      }
    }, 1000);

    addCleanup(function () { clearInterval(t); });
  }

  // ===============================
  // GEO: Sequence (click 1..5)
  // ===============================
  function buildGeoConstructGame(area) {
  const runes = ["🜁", "◆", "⬟", "▣"];
  const targetIndex = Math.floor(Math.random() * runes.length);

  const states = [
    Math.floor(Math.random() * runes.length),
    Math.floor(Math.random() * runes.length),
    Math.floor(Math.random() * runes.length),
  ];

  if (states[0] === targetIndex && states[1] === targetIndex && states[2] === targetIndex) {
    states[0] = (states[0] + 1) % runes.length;
  }

  let movesLeft = 6;
  let ended = false;

  area.innerHTML = `
    <div class="text-light mb-2">
      <strong>Geo Resonance</strong>: Align all pillars to match the target rune.
      <div class="mt-1">Target: <span class="fw-bold fs-5">${runes[targetIndex]}</span> | Moves left: <span id="geoMoves">${movesLeft}</span></div>
    </div>

    <div class="d-flex justify-content-center gap-3 flex-wrap" id="geoPillars"></div>
    <div class="text-light mt-2" id="geoInfo">Rotate pillars to resonate.</div>
  `;

  // IMPORTANT: query inside "area", not document
  const wrap = area.querySelector("#geoPillars");
  const movesEl = area.querySelector("#geoMoves");
  const info = area.querySelector("#geoInfo");

  // If any are missing, the game can't render
  if (!wrap || !movesEl || !info) {
    console.error("Geo game UI missing:", { wrap, movesEl, info });
    return;
  }

  function isSolved() {
    return states[0] === targetIndex && states[1] === targetIndex && states[2] === targetIndex;
  }

  function disableAll() {
    Array.from(wrap.querySelectorAll("button")).forEach(function (b) {
      b.disabled = true;
    });
  }

  function endOnce(success) {
    if (ended) return;
    ended = true;
    disableAll();

    endMinigameOnce(success);
  }

  function render() {
    wrap.innerHTML = "";

    for (let i = 0; i < 3; i++) {
      const card = document.createElement("div");
      card.className = "text-center";

      const runeBox = document.createElement("div");
      runeBox.className = "border border-warning rounded-3 px-4 py-3 mb-2 text-light";
      runeBox.style.minWidth = "90px";
      runeBox.style.fontSize = "28px";
      runeBox.textContent = runes[states[i]];

      const btn = document.createElement("button");
      btn.className = "btn btn-outline-warning btn-sm";
      btn.textContent = "Rotate";

      btn.onclick = function () {
        if (ended) return;

        states[i] = (states[i] + 1) % runes.length;
        movesLeft--;
        movesEl.textContent = String(movesLeft);

        render();

        if (isSolved()) {
          info.textContent = "✅ Resonance achieved!";
          endOnce(true);
          return;
        }

        if (movesLeft <= 0) {
          info.textContent = "❌ No moves left! Resonance failed.";
          endOnce(false);
          return;
        }

        info.textContent = "Keep aligning…";
      };

      card.appendChild(runeBox);
      card.appendChild(btn);
      wrap.appendChild(card);

      if (typeof addCleanup === "function") {
        addCleanup(function () { btn.onclick = null; });
      }
    }
  }

  render();
}


  // Expose globally
  window.initMinigame = initMinigame;
  window.cleanupMinigame = cleanupMinigame;
})();
