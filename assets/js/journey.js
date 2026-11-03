/* Experience as a cinematic Himalayan trek.
   The section opens on the starting frame. Clicking the start point plays the trek video: Abhilash walks
   up the trail, reaches the summit and raises the flag ("Summit reached" fades in). Under the video, a row
   of milestone flags lights up role by role as he climbs. Clicking a flag opens a see-through board on
   the video with that role's details. */
(function () {
  "use strict";

  var wrap = document.getElementById("journey");
  if (!wrap) return;
  var cine = document.getElementById("cine");
  var video = document.getElementById("trekVideo");
  var startBtn = document.getElementById("trekStart");
  var replayBtn = document.getElementById("trekReplay");
  var soundBtn = document.getElementById("trekSound");
  var bar = document.getElementById("trekBar");
  var flagsEl = document.getElementById("rail");
  var board = document.getElementById("trekBoard");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fmt(months) {
    var y = Math.floor(months / 12), m = months % 12, out = [];
    if (y) out.push(y + (y === 1 ? " yr" : " yrs"));
    if (m) out.push(m + (m === 1 ? " mo" : " mos"));
    return out.join(" ");
  }
  function since(y, m) {
    var now = new Date();
    return fmt((now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) + 1);
  }

  // t = second in trek.mp4 when this milestone is reached
  var STOPS = [
    { t: 0.25, year: "2019", role: "Java Developer", company: "Neutrinous Solutions Pvt Ltd",
      dates: "Apr 2019 – May 2020", duration: fmt(14) },
    { t: 0.95, year: "2020", role: "AR Application Developer", company: "Bellspire Virtual Art Pvt Ltd",
      dates: "Jun 2020 – Mar 2021", duration: fmt(10) },
    { t: 1.7, year: "2021", role: "Cloud Engineer", company: "CloudJournee · Full-time",
      dates: "Apr 2021 – Sep 2023", duration: fmt(30), skills: ["AWS", "Terraform"] },
    { t: 2.5, year: "2023", role: "Senior Cloud Engineer", company: "CloudJournee · Full-time",
      dates: "Sep 2023 – Present", duration: since(2023, 9), location: "Bengaluru, Karnataka, India",
      skills: ["AWS", "Google Cloud (GCP)"], current: true }
  ];
  var SUMMIT_T = 3.7, TITLE_OFF_T = 7.2;

  // ---------- milestone flags under the video ----------
  var flags = STOPS.map(function (s, i) {
    var li = document.createElement("li");
    li.className = "trail-flag";
    li.innerHTML =
      '<button type="button" class="tf-btn" aria-controls="trekBoard" aria-expanded="false">' +
        '<span class="tf-flag" aria-hidden="true"></span>' +
        '<span class="tf-dot" aria-hidden="true"></span>' +
        '<span class="tf-year">' + s.year + '</span>' +
        '<span class="tf-role">' + s.role + '</span>' +
      '</button>';
    flagsEl.appendChild(li);
    li.querySelector(".tf-btn").addEventListener("click", function () { open === i ? closeBoard() : openBoard(i); });
    return li;
  });

  function setReached(t) {
    var n = -1;
    STOPS.forEach(function (s, k) { var on = t >= s.t; flags[k].classList.toggle("is-reached", on); if (on) n = k; });
    flagsEl.style.setProperty("--progress", n < 0 ? 0 : (n / (STOPS.length - 1)));
    return n;
  }

  // ---------- see-through board on the video ----------
  var open = -1;
  function openBoard(i) {
    var s = STOPS[i];
    open = i;
    flags.forEach(function (f, k) {
      f.classList.toggle("is-active", k === i);
      f.querySelector(".tf-btn").setAttribute("aria-expanded", k === i ? "true" : "false");
    });
    board.innerHTML =
      '<button type="button" class="tb-close" aria-label="Close">×</button>' +
      '<p class="tb-tag"><span class="tb-flag" aria-hidden="true"></span>Milestone ' + (i + 1) + ' · ' + s.dates + '</p>' +
      '<h4>' + s.role + '</h4>' +
      '<p class="tb-co">' + s.company + '</p>' +
      '<p class="tb-meta">' + s.duration + (s.location ? ' · ' + s.location : '') + '</p>' +
      (s.skills ? '<ul class="tb-skills">' + s.skills.map(function (k) { return '<li>' + k + '</li>'; }).join('') + '</ul>' : '') +
      (s.current ? '<span class="tb-now">You are here</span>' : '');
    board.querySelector(".tb-close").addEventListener("click", closeBoard);
    board.hidden = false;
    placeBoard();
    requestAnimationFrame(function () { board.classList.add("show"); });
  }
  // Laptops: float the board over the lower-left of the video. Phones: it sits under the flags (CSS).
  var phoneMQ = window.matchMedia("(max-width: 760px)");
  function placeBoard() {
    if (phoneMQ.matches) { board.style.top = ""; return; }
    board.style.top = Math.max(12, cine.offsetTop + cine.offsetHeight * 0.9 - board.offsetHeight).toFixed(0) + "px";
  }
  window.addEventListener("resize", function () { if (open >= 0) placeBoard(); });
  function closeBoard() {
    open = -1;
    board.classList.remove("show");
    flags.forEach(function (f) { f.classList.remove("is-active"); f.querySelector(".tf-btn").setAttribute("aria-expanded", "false"); });
    setTimeout(function () { if (open < 0) board.hidden = true; }, 300);
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open >= 0) closeBoard(); });

  // ---------- playback ----------
  var raf = 0;
  function tick() {
    var t = video.currentTime, d = video.duration || 9.7;
    bar.style.width = (t / d * 100).toFixed(2) + "%";
    setReached(t);
    cine.classList.toggle("at-summit", t >= SUMMIT_T && t < TITLE_OFF_T);
    if (!video.paused && !video.ended) raf = requestAnimationFrame(tick);
  }

  function play() {
    cine.classList.add("started", "playing");
    cine.classList.remove("ended");
    startBtn.hidden = true; replayBtn.hidden = true; soundBtn.hidden = false;
    try { video.currentTime = 0; } catch (e) {}
    video.muted = soundBtn.getAttribute("aria-pressed") === "false";
    var p = video.play();
    if (p && p.catch) p.catch(function () { video.muted = true; syncSound(); video.play().catch(function () {}); });
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  }

  video.addEventListener("ended", function () {
    cine.classList.remove("playing", "at-summit");
    cine.classList.add("ended");
    replayBtn.hidden = false;
    bar.style.width = "100%";
    setReached(99);
  });
  video.addEventListener("pause", function () { cine.classList.remove("playing"); });
  video.addEventListener("play", function () { cine.classList.add("playing"); });

  startBtn.addEventListener("click", play);
  replayBtn.addEventListener("click", play);

  function syncSound() {
    soundBtn.setAttribute("aria-pressed", video.muted ? "false" : "true");
    soundBtn.setAttribute("aria-label", video.muted ? "Turn sound on" : "Turn sound off");
  }
  soundBtn.addEventListener("click", function () { video.muted = !video.muted; syncSound(); });

  // Reduced motion: show the summit frame with every flag reached; the trek still plays on click.
  if (reduceMotion) { video.setAttribute("poster", "assets/trek/summit.webp"); setReached(99); }
  syncSound();
})();
