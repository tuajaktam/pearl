/* ===== เกมเรียนคำศัพท์ภาษาจีนสำหรับเด็ก 3 ขวบ ===== */
"use strict";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  catId: "all",
  words: [],
  reviewIndex: 0,
  game: null, // { mode, queue, pos, stars }
};

/* ---------------- หน้าจอ ---------------- */
function show(screenId) {
  $$(".screen").forEach((s) => s.classList.remove("active"));
  $("#screen-" + screenId).classList.add("active");
}

function wordsFor(catId) {
  return catId === "all" ? WORDS.slice() : WORDS.filter((w) => w.cat === catId);
}

/* ---------------- เสียงพูดภาษาจีน ---------------- */
let zhVoice = null;
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  zhVoice =
    voices.find((v) => /zh[-_]?CN/i.test(v.lang)) ||
    voices.find((v) => /^zh/i.test(v.lang)) ||
    voices.find((v) => /chinese|mandarin|huihui|yaoyao|kangkang|tingting/i.test(v.name)) ||
    null;
}
if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}
function speak(text, onstart, onend) {
  if (!("speechSynthesis" in window)) { onend && onend(); return; }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    if (zhVoice) u.voice = zhVoice;
    u.rate = 0.75;   // ช้าหน่อยสำหรับเด็ก
    u.pitch = 1.15;  // เสียงสดใส
    if (onstart) u.onstart = onstart;
    u.onend = u.onerror = () => onend && onend();
    speechSynthesis.speak(u);
  } catch (e) { onend && onend(); }
}

/* ---------------- เสียงเอฟเฟกต์ (Web Audio) ---------------- */
let actx = null;
function audioCtx() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (actx && actx.state === "suspended") actx.resume();
  return actx;
}
function tone(freq, start, dur, type = "sine", vol = 0.22) {
  const c = audioCtx(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(c.destination);
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  pop:    () => tone(520, 0, 0.12, "triangle", 0.18),
  good:   () => { tone(660,0,0.14,"sine"); tone(880,0.12,0.16,"sine"); tone(1175,0.26,0.25,"sine"); },
  win:    () => { [523,659,784,1047,1319].forEach((f,i)=>tone(f,i*0.12,0.3,"sine",0.2)); },
  wrong:  () => { tone(300,0,0.18,"sawtooth",0.12); tone(220,0.14,0.22,"sawtooth",0.12); },
};

/* ---------------- หน้าแรก ---------------- */
function buildHome() {
  const grid = $("#category-grid");
  grid.innerHTML = "";
  CATEGORIES.forEach((c) => {
    const n = wordsFor(c.id).length;
    const b = document.createElement("button");
    b.className = "cat-card";
    b.style.background = `linear-gradient(135deg, ${c.color}, ${shade(c.color,-18)})`;
    b.innerHTML = `<span class="cat-emoji">${c.emoji}</span>
      <span class="cat-th">${c.th}</span>
      <span class="cat-zh">${c.zh} · ${n} คำ</span>`;
    b.onclick = () => { sfx.pop(); openMenu(c.id); };
    grid.appendChild(b);
  });
}
function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + pct, g = ((n >> 8) & 255) + pct, b = (n & 255) + pct;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* ---------------- เมนูหมวด ---------------- */
function openMenu(catId) {
  state.catId = catId;
  state.words = wordsFor(catId);
  const c = CATEGORIES.find((x) => x.id === catId);
  $("#menu-badge").textContent = c.emoji;
  $("#menu-title").textContent = c.th;
  $("#menu-count").textContent = `${c.zh} · ${state.words.length} คำศัพท์`;
  show("menu");
}

/* ---------------- ทบทวน (แฟลชการ์ด) ---------------- */
function startReview() {
  state.reviewIndex = 0;
  show("review");
  renderCard();
}
function renderCard() {
  const w = state.words[state.reviewIndex];
  $("#fc-img").src = w.img;
  $("#fc-img").alt = w.th;
  $("#fc-hanzi").textContent = w.zh;
  $("#fc-pinyin").textContent = w.pinyin;
  $("#fc-th").textContent = w.th + " " + w.emoji;
  // จุดบอกตำแหน่ง
  const dots = $("#rv-dots");
  dots.innerHTML = "";
  state.words.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = "dot" + (i === state.reviewIndex ? " on" : "");
    dots.appendChild(d);
  });
  $("#rv-prev").disabled = state.reviewIndex === 0;
  $("#rv-next").disabled = state.reviewIndex === state.words.length - 1;
  // พูดอัตโนมัติ
  speakCard();
}
function speakCard() {
  const w = state.words[state.reviewIndex];
  const btn = $("#fc-speak");
  speak(w.zh, () => btn.classList.add("playing"), () => btn.classList.remove("playing"));
}

/* ---------------- เกม ---------------- */
function startGame(mode) {
  const queue = shuffle(state.words.slice());
  state.game = { mode, queue, pos: 0, stars: 0, total: queue.length };
  show("game");
  renderRound();
}
function renderRound() {
  const g = state.game;
  const target = g.queue[g.pos];
  const choices = buildChoices(target);

  $("#game-stars").textContent = "⭐".repeat(g.stars);
  $("#game-progress").textContent = `${g.pos + 1} / ${g.total}`;
  $("#game-feedback").textContent = "";
  $("#game-feedback").className = "game-feedback";

  const prompt = $("#game-prompt");
  const choiceBox = $("#game-choices");
  const actionBox = $("#game-action");
  choiceBox.innerHTML = "";
  actionBox.innerHTML = "";
  state.selected = null;

  if (g.mode === "confirm") {
    // 🖐️ ฟังเสียง -> แตะรูปเพื่อฟัง -> กดยืนยัน (ไม่ต้องอ่าน)
    prompt.innerHTML = `<div class="prompt-q">ฟังเสียง แล้วแตะรูปที่ใช่ 👂</div>
      <button class="prompt-speak big" id="prompt-speak">🔊 ฟังคำอีกครั้ง</button>`;
    $("#prompt-speak").onclick = () => speak(target.zh);
    choices.forEach((w) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.innerHTML = `<img src="${w.img}" alt="${w.th}"><span class="choice-ear">👂</span>`;
      b.onclick = () => selectChoice(b, w);
      choiceBox.appendChild(b);
    });
    actionBox.innerHTML = `<button class="confirm-btn" id="confirm-btn" disabled>ตอบ ✓</button>`;
    $("#confirm-btn").onclick = () => confirmAnswer(target);
    setTimeout(() => speak(target.zh), 350);
  } else if (g.mode === "listen") {
    // ฟังเสียง -> เลือกรูป
    prompt.innerHTML = `<div class="prompt-q">แตะปุ่มฟัง แล้วเลือกรูปให้ถูก 🔊</div>
      <div class="prompt-hanzi">${target.zh}</div>
      <button class="prompt-speak" id="prompt-speak">🔊 ฟังอีกครั้ง</button>`;
    $("#prompt-speak").onclick = () => speak(target.zh);
    choices.forEach((w) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.innerHTML = `<img src="${w.img}" alt="${w.th}">`;
      b.onclick = () => answer(b, w, target);
      choiceBox.appendChild(b);
    });
    setTimeout(() => speak(target.zh), 350);
  } else {
    // ดูรูป -> เลือกคำ
    prompt.innerHTML = `<div class="prompt-q">นี่คือคำว่าอะไร? 🖼️</div>
      <div class="prompt-pic"><img src="${target.img}" alt=""></div>`;
    choices.forEach((w) => {
      const b = document.createElement("button");
      b.className = "choice choice-word";
      b.innerHTML = `<span class="ch-hanzi">${w.zh}</span><span class="ch-pinyin">${w.pinyin}</span>`;
      b.onclick = () => answer(b, w, target);
      choiceBox.appendChild(b);
    });
  }
}
function buildChoices(target) {
  const pool = state.words.filter((w) => w.id !== target.id);
  const wrongCount = Math.min(2, pool.length); // รวมเป็น 2-3 ตัวเลือก
  const wrong = shuffle(pool).slice(0, wrongCount);
  return shuffle([target, ...wrong]);
}
let locked = false;

// แตะรูปเพื่อเลือก + ฟังเสียงของรูปนั้น (โหมด confirm)
function selectChoice(btn, picked) {
  if (locked) return;
  $$("#game-choices .choice").forEach((c) => c.classList.remove("selected"));
  btn.classList.add("selected");
  state.selected = { btn, word: picked };
  speak(picked.zh); // ให้เด็กได้ยินว่ารูปนี้พูดว่าอะไร
  sfx.pop();
  const cb = $("#confirm-btn");
  if (cb) cb.disabled = false;
}

// กดปุ่มยืนยันคำตอบ (โหมด confirm)
function confirmAnswer(target) {
  if (locked || !state.selected) return;
  const { btn, word } = state.selected;
  if (word.id === target.id) {
    handleCorrect(btn, target);
  } else {
    handleWrong(btn);
    btn.classList.remove("selected");
    state.selected = null;
    const cb = $("#confirm-btn");
    if (cb) cb.disabled = true;
  }
}

// เลือกรูป/คำแล้วตัดสินทันที (โหมด listen / look)
function answer(btn, picked, target) {
  if (locked) return;
  if (picked.id === target.id) handleCorrect(btn, target);
  else handleWrong(btn);
}

function handleCorrect(btn, target) {
  locked = true;
  const g = state.game;
  btn.classList.remove("wrong", "selected");
  btn.classList.add("correct");
  sfx.good();
  speak(target.zh);
  const fb = $("#game-feedback");
  fb.textContent = pickPraise();
  fb.className = "game-feedback good";
  const cb = $("#confirm-btn");
  if (cb) cb.disabled = true;
  burstConfetti();
  g.stars++;
  $("#game-stars").textContent = "⭐".repeat(g.stars);
  setTimeout(() => {
    locked = false;
    g.pos++;
    if (g.pos >= g.total) finishGame();
    else renderRound();
  }, 1300);
}

function handleWrong(btn) {
  btn.classList.add("wrong");
  sfx.wrong();
  const fb = $("#game-feedback");
  fb.textContent = "ลองอีกครั้งนะ 💪";
  fb.className = "game-feedback bad";
  setTimeout(() => { btn.classList.remove("wrong"); }, 500);
}
const PRAISE = ["เก่งมาก! 🎉", "ถูกต้อง! 👏", "สุดยอด! ⭐", "หนูเก่งจัง! 🌟", "ยอดเยี่ยม! 🥳"];
function pickPraise() { return PRAISE[Math.floor(Math.random() * PRAISE.length)]; }

function finishGame() {
  const g = state.game;
  show("done");
  $("#done-score").textContent = `ได้ ${g.stars} จาก ${g.total} ดาว`;
  const ratio = g.stars / g.total;
  const medals = ratio === 1 ? "🥇🥇🥇" : ratio >= 0.6 ? "🥈🥈" : "🥉";
  $("#done-stars").textContent = medals;
  sfx.win();
  burstConfetti(true);
}

/* ---------------- ยูทิล ---------------- */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------- คอนเฟตตี ---------------- */
const cvs = $("#confetti"), cx = cvs.getContext("2d");
let parts = [], raf = null;
function resizeCanvas() { cvs.width = innerWidth; cvs.height = innerHeight; }
addEventListener("resize", resizeCanvas); resizeCanvas();
function burstConfetti(big) {
  const colors = ["#ff8fab","#5cc8e8","#7bc96f","#ffb74d","#ffe066","#c792ea"];
  const n = big ? 160 : 70;
  for (let i = 0; i < n; i++) {
    parts.push({
      x: innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: big ? innerHeight / 3 : innerHeight / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: -6 - Math.random() * 9,
      g: 0.25 + Math.random() * 0.2,
      s: 6 + Math.random() * 8,
      c: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      life: 90 + Math.random() * 40,
    });
  }
  if (!raf) raf = requestAnimationFrame(tick);
}
function tick() {
  cx.clearRect(0, 0, cvs.width, cvs.height);
  parts.forEach((p) => {
    p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
    cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
    cx.restore();
  });
  parts = parts.filter((p) => p.life > 0 && p.y < cvs.height + 40);
  if (parts.length) raf = requestAnimationFrame(tick);
  else { raf = null; cx.clearRect(0, 0, cvs.width, cvs.height); }
}

/* ---------------- เชื่อมปุ่ม ---------------- */
function bind() {
  $$("[data-go]").forEach((b) => b.onclick = () => {
    sfx.pop();
    const dst = b.dataset.go;
    if (dst === "menu") openMenu(state.catId); else show(dst);
  });
  $$("[data-mode]").forEach((b) => b.onclick = () => {
    audioCtx(); sfx.pop();
    const m = b.dataset.mode;
    if (m === "review") startReview(); else startGame(m);
  });
  $("#fc-speak").onclick = () => { audioCtx(); speakCard(); };
  $("#rv-prev").onclick = () => { if (state.reviewIndex > 0) { sfx.pop(); state.reviewIndex--; renderCard(); } };
  $("#rv-next").onclick = () => { if (state.reviewIndex < state.words.length - 1) { sfx.pop(); state.reviewIndex++; renderCard(); } };
  $("#rv-play").onclick = () => { audioCtx(); sfx.pop(); startGame("confirm"); };
  $("#done-again").onclick = () => { sfx.pop(); startGame(state.game.mode); };
}

buildHome();
bind();
show("home");
