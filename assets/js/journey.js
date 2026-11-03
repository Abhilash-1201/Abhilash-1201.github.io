/* Experience as a cinematic Himalayan trek.
   The section opens on the starting frame. Clicking the start point plays the trek video: Abhilash walks
   up the trail, reaches the summit and raises the flag. The milestone trail beside the video lights up
   role by role as he climbs; "Summit reached" appears when the flag goes up. Afterwards any milestone
   can be clicked to jump to that moment, and the trek can be replayed. */
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
  var rail = document.getElementById("rail");
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
      skills: ["AWS", "Google Cloud (GCP)"], current: true },
    { t: 3.7, year: "Summit", role: "The goal", goal: true,
      company: "Keep climbing",
      note: "Building secure, scalable and reliable cloud platforms, one milestone at a time." }
  ];
  var SUMMIT_T = 3.7, TITLE_OFF_T = 7.2;

  // ---------- milestone trail ----------
  var items = STOPS.map(function (s, i) {
    var li = document.createElement("li");
    li.className = "rail-item" + (s.goal ? " is-goal" : "");
    li.innerHTML =
      '<button type="button" class="rail-btn" aria-expanded="false">' +
        '<span class="rail-flag" aria-hidden="true"></span>' +
        '<span class="rail-year">' + s.year + '</span>' +
        '<span class="rail-role">' + s.role + '</span>' +
      '</button>' +
      '<div class="rail-detail">' +
        (s.goal
          ? '<p class="rd-co">' + s.company + '</p><p class="rd-meta">' + s.note + '</p>'
          : '<p class="rd-co">' + s.company + '</p>' +
            '<p class="rd-meta">' + s.dates + ' · ' + s.duration + (s.location ? '<br>' + s.location : '') + '</p>' +
            (s.skills ? '<ul class="rd-skills">' + s.skills.map(function (k) { return '<li>' + k + '</li>'; }).join('') + '</ul>' : '') +
            (s.current ? '<span class="rd-now">You are here</span>' : '')) +
      '</div>';
    rail.appendChild(li);
    li.querySelector(".rail-btn").addEventListener("click", function () { pick(i); });
    return li;
  });

  var active = -1;
  function setActive(i) {
    if (i === active) return;
    active = i;
    items.forEach(function (li, k) {
      li.classList.toggle("is-active", k === i);
      li.querySelector(".rail-btn").setAttribute("aria-expanded", k === i ? "true" : "false");
    });
  }
  function setReached(t) {
    var last = -1;
    STOPS.forEach(function (s, k) { var on = t >= s.t; items[k].classList.toggle("is-reached", on); if (on) last = k; });
    return last;
  }

  // ---------- playback ----------
  var started = false, raf = 0;
  function tick() {
    var t = video.currentTime, d = video.duration || 9.7;
    bar.style.width = (t / d * 100).toFixed(2) + "%";
    var last = setReached(t);
    if (last >= 0) setActive(last);
    cine.classList.toggle("at-summit", t >= SUMMIT_T && t < TITLE_OFF_T);
    if (!video.paused && !video.ended) raf = requestAnimationFrame(tick);
  }

  function play(from) {
    started = true;
    cine.classList.add("started", "playing");
    cine.classList.remove("ended");
    startBtn.hidden = true; replayBtn.hidden = true; soundBtn.hidden = false;
    try { video.currentTime = from || 0; } catch (e) {}
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
    setReached(99); setActive(STOPS.length - 1);
  });
  video.addEventListener("pause", function () { cine.classList.remove("playing"); });
  video.addEventListener("play", function () { cine.classList.add("playing"); });

  startBtn.addEventListener("click", function () { play(0); });
  replayBtn.addEventListener("click", function () { play(0); });

  function syncSound() {
    soundBtn.setAttribute("aria-pressed", video.muted ? "false" : "true");
    soundBtn.setAttribute("aria-label", video.muted ? "Turn sound on" : "Turn sound off");
  }
  soundBtn.addEventListener("click", function () { video.muted = !video.muted; syncSound(); });

  // Clicking a milestone: while the trek plays, just open its details; otherwise jump to that moment.
  function pick(i) {
    if (!started || video.ended || video.paused) {
      started = true;
      cine.classList.add("started");
      startBtn.hidden = true;
      replayBtn.hidden = false;
      try { video.pause(); video.currentTime = Math.min(STOPS[i].t + (STOPS[i].goal ? 2.6 : 0.2), (video.duration || 9.7) - 0.05); } catch (e) {}
      setReached(STOPS[i].t + 0.01);
      bar.style.width = ((STOPS[i].t / (video.duration || 9.7)) * 100).toFixed(2) + "%";
    }
    setActive(i);
  }

  // Reduced motion: show the summit frame with every milestone reached; the trek still plays on click.
  if (reduceMotion) {
    video.setAttribute("poster", "assets/trek/summit.webp");
    setReached(99); setActive(3);
  } else {
    setActive(0);
  }
  syncSound();
})();
