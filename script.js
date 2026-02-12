import { APP_COPY, GAME_CONFIG, LETTER, LOTTIE_ASSETS } from "./content.js";

const DEBUG_MODE = new URLSearchParams(window.location.search).get("debug") === "1";

const scenes = {
  loading: document.getElementById("scene-loading"),
  intro: document.getElementById("scene-intro"),
  game: document.getElementById("scene-game"),
  win: document.getElementById("scene-win"),
  lose: document.getElementById("scene-lose"),
  letter: document.getElementById("scene-letter"),
};

const el = {
  loadingStatus: document.getElementById("loading-status"),
  loadingBarFill: document.getElementById("loading-bar-fill"),
  introTitle: document.getElementById("intro-title"),
  introSubtitle: document.getElementById("intro-subtitle"),
  startBtn: document.getElementById("start-btn"),
  hudTime: document.getElementById("hud-time"),
  hudScore: document.getElementById("hud-score"),
  hudTarget: document.getElementById("hud-target"),
  gameArea: document.getElementById("game-area"),
  canvas: document.getElementById("game-canvas"),
  catcher: document.getElementById("catcher"),
  winTitle: document.getElementById("win-title"),
  winCopy: document.getElementById("win-copy"),
  toLetterBtn: document.getElementById("to-letter-btn"),
  loseTitle: document.getElementById("lose-title"),
  loseCopy: document.getElementById("lose-copy"),
  retryBtn: document.getElementById("retry-btn"),
  skipBtn: document.getElementById("skip-btn"),
  skipArena: document.getElementById("skip-arena"),
  dodgeMessage: document.getElementById("dodge-message"),
  letterStage: document.getElementById("letter-stage"),
  letterOutput: document.getElementById("letter-output"),
  skipTypingBtn: document.getElementById("skip-typing-btn"),
  replayBtn: document.getElementById("replay-btn"),
  skipModal: document.getElementById("skip-modal"),
  skipModalTitle: document.getElementById("skip-modal-title"),
  skipModalBody: document.getElementById("skip-modal-body"),
  skipConfirmYes: document.getElementById("skip-confirm-yes"),
  skipConfirmNo: document.getElementById("skip-confirm-no"),
  debugControls: document.getElementById("debug-controls"),
  debugLetterBtn: document.getElementById("debug-letter-btn"),
};

const state = {
  scene: "loading",
  inRound: false,
  score: 0,
  timeLeft: GAME_CONFIG.roundSeconds,
  hearts: [],
  spawnAt: 0,
  lastFrame: 0,
  rafId: 0,
  roundToken: 0,
  catcherX: 0,
  pointerActive: false,
  keys: { left: false, right: false },
  skipAttempts: 0,
  canShowSkipConfirm: false,
  typewriter: {
    timeout: null,
    running: false,
    index: 0,
    text: "",
  },
  letterRevealTimers: [],
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

const ctx = el.canvas.getContext("2d");
const HEART_TIERS = [
  { points: 1, chance: 0.62, size: [12, 18], speed: [118, 185], color: "#e74f78" },
  { points: 2, chance: 0.28, size: [18, 24], speed: [96, 155], color: "#ef6ca5" },
  { points: 3, chance: 0.1, size: [24, 30], speed: [82, 132], color: "#f2b451" },
];

function initApp() {
  hydrateCopy();
  bindEvents();
  resizeCanvas();
  initLottie();
  resetLetterScene();
  setDebugMode();
  runLoadingSequence();
}

function hydrateCopy() {
  el.introTitle.textContent = APP_COPY.introTitle;
  el.introSubtitle.textContent = APP_COPY.introSubtitle;
  el.startBtn.textContent = APP_COPY.introCta;
  el.winTitle.textContent = APP_COPY.winTitle;
  el.winCopy.textContent = APP_COPY.winCopy;
  el.loseTitle.textContent = APP_COPY.loseTitle;
  el.loseCopy.textContent = APP_COPY.loseCopy;
  el.skipModalTitle.textContent = APP_COPY.skipConfirmTitle;
  el.skipModalBody.textContent = APP_COPY.skipConfirmBody;
  el.hudTarget.textContent = String(GAME_CONFIG.targetScore);
}

function bindEvents() {
  window.addEventListener("resize", resizeCanvas);

  el.startBtn.addEventListener("click", startRound);
  el.toLetterBtn.addEventListener("click", () => goToLetter());
  el.retryBtn.addEventListener("click", startRound);
  el.replayBtn.addEventListener("click", resetExperience);
  el.debugLetterBtn.addEventListener("click", openLetterFromDebug);

  el.skipBtn.addEventListener("click", handleSkipAttempt);
  el.skipBtn.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSkipAttempt();
    }
  });

  el.skipConfirmYes.addEventListener("click", confirmSkipToLetter);
  el.skipConfirmNo.addEventListener("click", cancelSkipConfirm);

  el.skipTypingBtn.addEventListener("click", skipTypewriter);

  el.gameArea.addEventListener("pointerdown", (event) => {
    state.pointerActive = true;
    el.gameArea.setPointerCapture(event.pointerId);
    moveCatcherToPointer(event.clientX);
  });

  el.gameArea.addEventListener("pointermove", (event) => {
    if (!state.pointerActive) {
      return;
    }
    moveCatcherToPointer(event.clientX);
  });

  el.gameArea.addEventListener("pointerup", () => {
    state.pointerActive = false;
  });

  el.gameArea.addEventListener("pointercancel", () => {
    state.pointerActive = false;
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      state.keys.left = true;
    }
    if (event.key === "ArrowRight") {
      state.keys.right = true;
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft") {
      state.keys.left = false;
    }
    if (event.key === "ArrowRight") {
      state.keys.right = false;
    }
  });
}

function setDebugMode() {
  el.debugControls.hidden = !DEBUG_MODE;
}

function initLottie() {
  loadLottie("loading-lottie", LOTTIE_ASSETS.loading, true);
  loadLottie("intro-lottie", LOTTIE_ASSETS.introBunnies || LOTTIE_ASSETS.letterBunnies || LOTTIE_ASSETS.intro, true);
  loadLottie("win-lottie", LOTTIE_ASSETS.winBunnies || LOTTIE_ASSETS.letterBunnies || LOTTIE_ASSETS.win, true);
  loadLottie("global-hearts-bg-lottie", LOTTIE_ASSETS.globalHeartsBg || LOTTIE_ASSETS.letterHeartsBg, true);
}

function loadLottie(containerId, path, loop) {
  const container = document.getElementById(containerId);
  if (!container || !path) {
    return;
  }

  if (path.toLowerCase().endsWith(".lottie")) {
    loadDotLottie(container, path, loop);
    return;
  }

  if (!window.lottie) {
    return;
  }

  try {
    window.lottie.loadAnimation({
      container,
      renderer: "svg",
      loop,
      autoplay: true,
      path,
    });
  } catch (_error) {
    // Fallback is no-op. The rest of the scene still works.
  }
}

function loadDotLottie(container, path, loop) {
  const mount = () => {
    container.replaceChildren();
    const player = document.createElement("dotlottie-player");
    player.setAttribute("src", path);
    player.setAttribute("autoplay", "");
    if (loop) {
      player.setAttribute("loop", "");
    }
    player.style.width = "100%";
    player.style.height = "100%";
    container.appendChild(player);
  };

  if (window.customElements && window.customElements.get("dotlottie-player")) {
    mount();
    return;
  }

  if (window.customElements && window.customElements.whenDefined) {
    window.customElements.whenDefined("dotlottie-player").then(mount).catch(() => {});
  }
}

function runLoadingSequence() {
  const startedAt = performance.now();
  const ticks = [
    { pct: 28, text: "Gathering our little memories" },
    { pct: 54, text: "Decorating with hearts" },
    { pct: 84, text: "Almost ready" },
    { pct: 100, text: "Ready" },
  ];

  ticks.forEach((tick, index) => {
    window.setTimeout(() => {
      el.loadingBarFill.style.width = `${tick.pct}%`;
      el.loadingStatus.textContent = tick.text;
    }, index * 300);
  });

  const minWait = 1200;
  window.setTimeout(() => {
    if (performance.now() - startedAt >= minWait) {
      goToScene("intro");
    }
  }, minWait + 80);
}

function goToScene(sceneId) {
  Object.entries(scenes).forEach(([id, node]) => {
    node.classList.toggle("active", id === sceneId);
  });
  state.scene = sceneId;
}

function resizeCanvas() {
  const rect = el.gameArea.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  el.canvas.width = Math.floor(rect.width * ratio);
  el.canvas.height = Math.floor(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  if (!state.catcherX) {
    state.catcherX = rect.width / 2;
  }
  syncCatcherPosition();
}

function startRound() {
  clearLetterRevealTimers();
  stopTypewriter();
  state.roundToken += 1;
  state.inRound = true;
  state.score = 0;
  state.timeLeft = GAME_CONFIG.roundSeconds;
  state.hearts = [];
  state.skipAttempts = 0;
  state.canShowSkipConfirm = false;
  state.lastFrame = 0;
  state.spawnAt = 0;
  state.pointerActive = false;
  state.keys.left = false;
  state.keys.right = false;
  resetSkipButton();
  el.dodgeMessage.textContent = "";
  el.hudScore.textContent = "0";
  el.hudTime.textContent = String(Math.ceil(state.timeLeft));

  goToScene("game");
  cancelAnimationFrame(state.rafId);
  state.rafId = requestAnimationFrame((ts) => gameLoop(ts, state.roundToken));
}

function gameLoop(timestamp, token) {
  if (!state.inRound || token !== state.roundToken) {
    return;
  }

  if (!state.lastFrame) {
    state.lastFrame = timestamp;
  }

  const deltaMs = Math.min(36, timestamp - state.lastFrame);
  state.lastFrame = timestamp;
  updateGame(deltaMs);

  if (state.inRound) {
    state.rafId = requestAnimationFrame((ts) => gameLoop(ts, token));
  }
}

function updateGame(deltaMs) {
  const areaRect = el.gameArea.getBoundingClientRect();
  const deltaSeconds = deltaMs / 1000;

  state.timeLeft -= deltaSeconds;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    finishRound(state.score >= GAME_CONFIG.targetScore ? "win" : "lose");
    return;
  }

  el.hudTime.textContent = String(Math.ceil(state.timeLeft));

  const speed = GAME_CONFIG.catcherSpeed * deltaSeconds;
  if (state.keys.left) {
    state.catcherX -= speed;
  }
  if (state.keys.right) {
    state.catcherX += speed;
  }
  clampCatcher(areaRect.width);
  syncCatcherPosition();

  state.spawnAt -= deltaMs;
  if (state.spawnAt <= 0) {
    spawnHeart(areaRect.width);
    const [minDelay, maxDelay] = GAME_CONFIG.spawnMsRange;
    state.spawnAt = randomBetween(minDelay, maxDelay);
  }

  const catcherRect = getCatcherRect(areaRect);
  const nextHearts = [];

  for (const heart of state.hearts) {
    heart.y += heart.speed * deltaSeconds;

    if (intersectsHeart(catcherRect, heart)) {
      state.score += heart.points;
      el.hudScore.textContent = String(state.score);
      pulseCatcher();
      if (state.score >= GAME_CONFIG.targetScore) {
        finishRound("win");
        return;
      }
      continue;
    }

    if (heart.y <= areaRect.height + heart.size) {
      nextHearts.push(heart);
    }
  }

  state.hearts = nextHearts;
  drawHearts(areaRect.width, areaRect.height);
}

function spawnHeart(areaWidth) {
  const tier = pickHeartTier();
  const size = randomBetween(tier.size[0], tier.size[1]);
  state.hearts.push({
    x: randomBetween(size + 4, areaWidth - size - 4),
    y: -size,
    size,
    speed: randomBetween(tier.speed[0], tier.speed[1]),
    drift: randomBetween(-16, 16),
    points: tier.points,
    color: tier.color,
  });
}

function drawHearts(width, height) {
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.08)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0.24)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (const heart of state.hearts) {
    const drawX = heart.x + Math.sin((heart.y / 28) * 0.5) * heart.drift;
    drawHeart(drawX, heart.y, heart.size, heart.color, heart.points);
  }
}

function drawHeart(x, y, size, color, points) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.35);
  ctx.bezierCurveTo(size * 0.9, -size * 0.35, size * 1.3, size * 0.65, 0, size * 1.35);
  ctx.bezierCurveTo(-size * 1.3, size * 0.65, -size * 0.9, -size * 0.35, 0, size * 0.35);
  ctx.fill();
  if (points > 1) {
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.max(10, size * 0.68)}px "Avenir Next", "Trebuchet MS", sans-serif`;
    ctx.fillText(String(points), 0, size * 0.64);
  }
  ctx.restore();
}

function finishRound(result) {
  state.inRound = false;
  cancelAnimationFrame(state.rafId);

  if (result === "win") {
    goToScene("win");
    return;
  }

  goToScene("lose");
}

function handleSkipAttempt() {
  if (state.canShowSkipConfirm) {
    showSkipConfirmModal();
    return;
  }

  state.skipAttempts += 1;
  dodgeSkipButton();

  const messageIndex = Math.min(state.skipAttempts - 1, APP_COPY.dodgeLines.length - 1);
  el.dodgeMessage.textContent = APP_COPY.dodgeLines[messageIndex] || APP_COPY.dodgeLines[0];

  if (state.skipAttempts >= GAME_CONFIG.skipDodgeCount) {
    state.canShowSkipConfirm = true;
    window.setTimeout(showSkipConfirmModal, state.reducedMotion ? 20 : 250);
  }
}

function dodgeSkipButton() {
  const arenaRect = el.skipArena.getBoundingClientRect();
  const btnRect = el.skipBtn.getBoundingClientRect();

  const padding = 10;
  const maxLeft = Math.max(padding, arenaRect.width - btnRect.width - padding);
  const maxTop = Math.max(padding, arenaRect.height - btnRect.height - padding);

  const left = randomBetween(padding, maxLeft);
  const top = randomBetween(padding, maxTop);

  el.skipBtn.style.translate = "0 0";
  el.skipBtn.style.left = `${left}px`;
  el.skipBtn.style.top = `${top}px`;
  el.skipBtn.classList.remove("dodge-hard");
  void el.skipBtn.offsetWidth;
  el.skipBtn.classList.add("dodge-hard");
}

function resetSkipButton() {
  el.skipBtn.style.translate = "-50% 0";
  el.skipBtn.style.left = "50%";
  el.skipBtn.style.top = "20px";
}

function showSkipConfirmModal() {
  el.skipModal.classList.remove("hidden");
  el.skipConfirmNo.focus();
}

function confirmSkipToLetter() {
  el.skipModal.classList.add("hidden");
  goToLetter();
}

function cancelSkipConfirm() {
  el.skipModal.classList.add("hidden");
  goToScene("lose");
  el.retryBtn.focus();
}

function goToLetter() {
  stopRound();
  el.skipModal.classList.add("hidden");
  goToScene("letter");
  playLetterReveal();
}

function openLetterFromDebug() {
  if (!DEBUG_MODE) {
    return;
  }
  goToLetter();
}

function playLetterReveal() {
  resetLetterScene();

  const startTyping = () => {
    el.skipTypingBtn.hidden = false;
    el.skipTypingBtn.disabled = false;
    startTypewriter();
  };

  if (state.reducedMotion) {
    el.letterStage.classList.add("phase-read");
    startTyping();
    return;
  }

  const slideTimer = window.setTimeout(() => {
    el.letterStage.classList.add("phase-slide");
  }, 220);

  const settleTimer = window.setTimeout(() => {
    el.letterStage.classList.add("phase-read");
  }, 1180);

  const typingTimer = window.setTimeout(startTyping, 1420);
  state.letterRevealTimers.push(slideTimer, settleTimer, typingTimer);
}

function startTypewriter() {
  stopTypewriter();

  const chunks = [
    LETTER.greeting,
    "",
    ...LETTER.paragraphs,
    "",
    LETTER.signoff,
    LETTER.signature,
    LETTER.dateLine,
  ];

  state.typewriter.text = chunks.join("\n\n");
  state.typewriter.index = 0;
  state.typewriter.running = true;
  el.letterOutput.textContent = "";
  el.letterOutput.scrollTop = 0;

  typeNextCharacter();
}

function typeNextCharacter() {
  if (!state.typewriter.running) {
    return;
  }

  if (state.typewriter.index >= state.typewriter.text.length) {
    state.typewriter.running = false;
    return;
  }

  const char = state.typewriter.text.charAt(state.typewriter.index);
  el.letterOutput.textContent += char;
  state.typewriter.index += 1;

  const delay = getTypeDelay(char);
  state.typewriter.timeout = window.setTimeout(typeNextCharacter, delay);
}

function skipTypewriter() {
  if (!state.typewriter.text) {
    return;
  }
  stopTypewriter();
  el.letterOutput.textContent = state.typewriter.text;
  el.letterOutput.scrollTop = 0;
}

function stopTypewriter() {
  state.typewriter.running = false;
  if (state.typewriter.timeout) {
    clearTimeout(state.typewriter.timeout);
    state.typewriter.timeout = null;
  }
}

function clearLetterRevealTimers() {
  state.letterRevealTimers.forEach((timerId) => clearTimeout(timerId));
  state.letterRevealTimers = [];
}

function resetLetterScene() {
  clearLetterRevealTimers();
  stopTypewriter();
  el.skipTypingBtn.hidden = true;
  el.skipTypingBtn.disabled = true;
  el.letterOutput.textContent = "";
  el.letterOutput.scrollTop = 0;
  el.letterStage.classList.remove("phase-slide", "phase-read");
}

function getTypeDelay(char) {
  if (state.reducedMotion) {
    return 5;
  }
  if (char === "." || char === "!" || char === "?") {
    return 170;
  }
  if (char === ",") {
    return 100;
  }
  if (char === "\n") {
    return 90;
  }
  return 40;
}

function resetExperience() {
  resetLetterScene();
  stopRound();
  state.score = 0;
  state.timeLeft = GAME_CONFIG.roundSeconds;
  state.hearts = [];
  state.skipAttempts = 0;
  state.canShowSkipConfirm = false;
  state.keys.left = false;
  state.keys.right = false;
  el.hudScore.textContent = "0";
  el.hudTime.textContent = String(GAME_CONFIG.roundSeconds);
  el.dodgeMessage.textContent = "";
  resetSkipButton();
  el.skipModal.classList.add("hidden");
  goToScene("intro");
}

function stopRound() {
  state.roundToken += 1;
  state.inRound = false;
  state.pointerActive = false;
  state.keys.left = false;
  state.keys.right = false;
  state.hearts = [];
  cancelAnimationFrame(state.rafId);
}

function moveCatcherToPointer(clientX) {
  const rect = el.gameArea.getBoundingClientRect();
  state.catcherX = clientX - rect.left;
  clampCatcher(rect.width);
  syncCatcherPosition();
}

function clampCatcher(width) {
  const margin = 30;
  state.catcherX = Math.max(margin, Math.min(width - margin, state.catcherX));
}

function syncCatcherPosition() {
  el.catcher.style.left = `${state.catcherX}px`;
}

function getCatcherRect(areaRect) {
  const catcherWidth = 84;
  const catcherHeight = 44;
  return {
    left: state.catcherX - catcherWidth / 2,
    right: state.catcherX + catcherWidth / 2,
    top: areaRect.height - catcherHeight - 12,
    bottom: areaRect.height - 8,
  };
}

function intersectsHeart(catcherRect, heart) {
  const heartLeft = heart.x - heart.size;
  const heartRight = heart.x + heart.size;
  const heartTop = heart.y - heart.size;
  const heartBottom = heart.y + heart.size;

  return !(
    heartRight < catcherRect.left ||
    heartLeft > catcherRect.right ||
    heartBottom < catcherRect.top ||
    heartTop > catcherRect.bottom
  );
}

function pulseCatcher() {
  el.catcher.classList.remove("catcher-pulse");
  void el.catcher.offsetWidth;
  el.catcher.classList.add("catcher-pulse");
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function pickHeartTier() {
  const roll = Math.random();
  let cursor = 0;
  for (const tier of HEART_TIERS) {
    cursor += tier.chance;
    if (roll <= cursor) {
      return tier;
    }
  }
  return HEART_TIERS[0];
}

initApp();
