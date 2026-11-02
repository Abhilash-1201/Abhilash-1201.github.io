/* Profile page: click "Visit my profile" → the welcome screen fades → the intro video plays with sound
   beside the name while the hero copy appears. Plus the cursor-tracking photo in About and the footer stamp. */
(function () {
  "use strict";

  var root = document.documentElement;
  var gate = document.getElementById("gate");
  var enterBtn = document.getElementById("enter");
  var hero = document.querySelector(".hero");
  var video = document.getElementById("talk");
  var nameEl = document.getElementById("name");
  var steps = Array.prototype.slice.call(document.querySelectorAll(".hero [data-step]"));
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- play / pause button on the video ----------
  // The click on "Visit my profile" lets the browser play with sound. If a browser still refuses,
  // the video waits on its first frame and the play button pulses until it is pressed.
  var playBtn = document.getElementById("play");
  function syncBtn() {
    if (!playBtn) return;
    var playing = !video.paused && !video.ended;
    playBtn.classList.toggle("is-playing", playing);
    if (playing) playBtn.classList.remove("nudge");
    playBtn.setAttribute("aria-label", playing ? "Pause intro" : "Play intro");
  }
  ["play", "playing", "pause", "ended"].forEach(function (ev) { video.addEventListener(ev, syncBtn); });
  function startVideo() {
    if (video.ended || video.currentTime >= (video.duration || 99) - 0.05) {
      try { video.currentTime = 0; } catch (e) {}
    }
    video.muted = false; video.volume = 1;
    return video.play();
  }
  if (playBtn) playBtn.addEventListener("click", function () {
    if (!video.paused && !video.ended) video.pause();
    else startVideo().catch(function () {});
  });

  // ---------- name: split into letters ("R.L" in the accent colour) ----------
  var letters = [];
  (function split() {
    var text = nameEl.textContent.trim();
    nameEl.textContent = "";
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.className = "l" + (i >= text.indexOf(" ") + 1 ? " acc" : "");
      s.setAttribute("aria-hidden", "true");
      s.textContent = text[i] === " " ? " " : text[i];
      frag.appendChild(s);
      letters.push(s);
    }
    nameEl.appendChild(frag);
  })();

  // ---------- intro ----------
  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function reset() {
    timers.forEach(clearTimeout); timers = [];
    letters.forEach(function (l) { l.classList.remove("on"); });
    steps.forEach(function (s) { s.classList.remove("on"); });
    hero.classList.remove("show-still");
  }
  function revealAll(instant) {
    if (instant) {
      letters.forEach(function (l) { l.classList.add("on"); });
      steps.forEach(function (s) { s.classList.add("on"); });
      return;
    }
    letters.forEach(function (l, i) { later(function () { l.classList.add("on"); }, 250 + i * 70); });
    var after = 250 + letters.length * 70 + 150;
    steps.forEach(function (s, i) { later(function () { s.classList.add("on"); }, after + i * 220); });
  }
  function showStill() { hero.classList.add("show-still"); }

  function play() {
    reset();
    if (reduceMotion) { hero.classList.remove("armed"); showStill(); revealAll(true); return; }
    hero.classList.add("armed");
    revealAll(false);
    try { video.currentTime = 0; } catch (e) {}
    if (playBtn) playBtn.hidden = false;
    var p = startVideo();
    if (p && p.catch) p.catch(function () { if (playBtn) playBtn.classList.add("nudge"); });
  }

  function enter() {
    if (!gate || gate.classList.contains("gone")) return;
    gate.classList.add("gone");
    root.style.overflow = "";
    play();
    setTimeout(function () { gate.hidden = true; }, 800);
  }

  if (gate) {
    root.style.overflow = "hidden";
    if (!reduceMotion) hero.classList.add("armed");     // keep the hero copy hidden behind the gate
    enterBtn.addEventListener("click", enter);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") enter();
    });
  } else {
    revealAll(true);
  }
  video.addEventListener("error", function () { if (playBtn) playBtn.hidden = true; showStill(); });

  var replay = document.getElementById("replay");
  if (replay) replay.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    play();
  });

  // ---------- About photo: he looks toward the cursor (9 direction images) ----------
  var look = document.getElementById("look");
  if (look) (function () {
    var imgs = {};
    look.querySelectorAll("img[data-dir]").forEach(function (i) { imgs[i.dataset.dir] = i; });
    var FACE_X = 0.49, FACE_Y = 0.28, DEAD = 0.14;
    var SECTORS = ["right", "down-right", "down", "down-left", "left", "up-left", "up", "up-right"];
    var IDLE_PATH = ["down", "down", "center", "right", "up-right", "center", "down", "left", "center"];
    var cur = "center", queued = null, frame = 0, visible = false, lastMove = 0, idleTimer = 0, idleStep = 0;
    function show(d) {
      if (!imgs[d] || d === cur) return;
      imgs[cur].classList.remove("on"); imgs[d].classList.add("on"); cur = d;
    }
    function update() {
      frame = 0;
      if (!queued || !visible) return;
      var r = look.getBoundingClientRect();
      var dx = queued.x - (r.left + r.width * FACE_X), dy = queued.y - (r.top + r.height * FACE_Y);
      if (Math.hypot(dx, dy) < r.width * DEAD) return show("center");
      show(SECTORS[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8]);
    }
    function idle() {
      clearTimeout(idleTimer);
      if (reduceMotion) return;
      idleTimer = setTimeout(function tick() {
        if (Date.now() - lastMove < 3500 || !visible) return idle();
        show(IDLE_PATH[idleStep++ % IDLE_PATH.length]);
        idleTimer = setTimeout(tick, 1300);
      }, 4000);
    }
    window.addEventListener("pointermove", function (e) {
      queued = { x: e.clientX, y: e.clientY }; lastMove = Date.now(); idle();
      if (!frame) frame = requestAnimationFrame(update);
    }, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (!visible) show("center"); }).observe(look);
    } else { visible = true; }
    Object.keys(imgs).forEach(function (k) { if (imgs[k].decode) imgs[k].decode().catch(function () {}); });
    idle();
  })();

  // ---------- footer: GitHub Actions stamps the commit SHA and build date ----------
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
  var build = document.getElementById("build");
  if (build && build.dataset.sha && build.dataset.sha.indexOf("__") !== 0) {
    build.innerHTML = "Deployed to GitHub Pages by GitHub Actions, commit <code>" + build.dataset.sha.slice(0, 7) + "</code> on " + build.dataset.date;
  }
})();
