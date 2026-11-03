/* Experience: a looping Himalayan trek video, and a 3D road underneath it.
   The car follows the mouse along the road (tap the road on phones), puffing smoke as it drives.
   When it reaches a milestone, a green highway board shows that role. */
(function () {
  "use strict";

  var wrap = document.getElementById("journey");
  if (!wrap) return;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- looping trek video, low volume, plays only while on screen ----------
  var video = document.getElementById("trekVideo");
  var soundBtn = document.getElementById("trekSound");
  var VOLUME = 0.2, wantSound = true;
  function syncSound() {
    soundBtn.setAttribute("aria-pressed", video.muted ? "false" : "true");
    soundBtn.setAttribute("aria-label", video.muted ? "Turn sound on" : "Turn sound off");
  }
  function playVideo() {
    video.volume = VOLUME;
    video.muted = !wantSound;
    var p = video.play();
    // Browsers refuse sound until the visitor has clicked something; fall back to muted.
    if (p && p.catch) p.catch(function () { video.muted = true; syncSound(); video.play().catch(function () {}); });
    syncSound();
  }
  soundBtn.addEventListener("click", function () {
    wantSound = video.muted;
    video.muted = !wantSound; video.volume = VOLUME;
    if (video.paused) video.play().catch(function () {});
    syncSound();
  });
  if (reduceMotion) { video.removeAttribute("autoplay"); video.pause(); }
  else if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) playVideo(); else video.pause();
    }, { threshold: 0.35 }).observe(video);
  } else { playVideo(); }
  syncSound();

  // ---------- milestones ----------
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
  var STOPS = [
    { year: "2019", short: "Java|Dev", role: "Java Developer", company: "Neutrinous Solutions Pvt Ltd",
      dates: "Apr 2019 – May 2020", duration: fmt(14) },
    { year: "2020", short: "AR App|Dev", role: "AR Application Developer", company: "Bellspire Virtual Art Pvt Ltd",
      dates: "Jun 2020 – Mar 2021", duration: fmt(10) },
    { year: "2021", short: "Cloud|Engineer", role: "Cloud Engineer", company: "CloudJournee · Full-time",
      dates: "Apr 2021 – Sep 2023", duration: fmt(30), skills: ["AWS", "Terraform"] },
    { year: "2023", short: "Sr Cloud|Engineer", role: "Senior Cloud Engineer", company: "CloudJournee · Full-time",
      dates: "Sep 2023 – Present", duration: since(2023, 9), location: "Bengaluru, Karnataka, India",
      skills: ["AWS", "Google Cloud (GCP)"], current: true }
  ];
  var AT = [0.14, 0.38, 0.62, 0.86];

  // ---------- the road ----------
  var drive = document.getElementById("drive");
  var svg = document.getElementById("road");
  var board = document.getElementById("driveBoard");
  var NS = "http://www.w3.org/2000/svg";
  var H = 210, TOP = 104, FRONT = 160, SIDE = 16, LANE = 132;
  var W, xs = [], x0, x1, car, carBody, wheels = [], smokeG, stopEls = [];
  var pos, target, vel = 0, dir = 1, spin = 0, shown = -1, parts = [], raf = 0, lastT = 0;

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function build() {
    W = Math.max(320, Math.round(drive.clientWidth));
    var narrow = W < 640;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.innerHTML = "";
    var inset = 26, back = narrow ? 14 : 36;          // the far edge is a little shorter: perspective
    x0 = inset + 34; x1 = W - inset - 34;
    xs = AT.map(function (f) { return x0 + (x1 - x0) * f; });

    el("defs", {}, svg).innerHTML =
      '<linearGradient id="rdTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b6473"/><stop offset=".55" stop-color="#3a414d"/><stop offset="1" stop-color="#2a3039"/></linearGradient>' +
      '<linearGradient id="rdSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c6a55"/><stop offset="1" stop-color="#4a3d30"/></linearGradient>' +
      '<radialGradient id="rdShadow"><stop offset="0" stop-color="#0f172a" stop-opacity=".22"/><stop offset="1" stop-color="#0f172a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="carRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b5e"/><stop offset=".45" stop-color="#e53935"/><stop offset="1" stop-color="#9f1c1c"/></linearGradient>' +
      '<linearGradient id="carGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dbeafe"/><stop offset="1" stop-color="#60a5fa"/></linearGradient>' +
      '<radialGradient id="smoke"><stop offset="0" stop-color="#cbd5e1" stop-opacity=".9"/><stop offset="1" stop-color="#e2e8f0" stop-opacity="0"/></radialGradient>';

    // shadow, side face (thickness), top surface
    el("ellipse", { cx: W / 2, cy: FRONT + SIDE + 6, rx: W / 2 - 10, ry: 14, fill: "url(#rdShadow)" }, svg);
    el("polygon", { points: [inset, FRONT, W - inset, FRONT, W - inset, FRONT + SIDE, inset, FRONT + SIDE].join(" "), fill: "url(#rdSide)" }, svg);
    el("polygon", { points: [inset + back, TOP, W - inset - back, TOP, W - inset, FRONT, inset, FRONT].join(" "), fill: "url(#rdTop)" }, svg);
    // kerbs: red/white blocks along both edges
    el("line", { x1: inset + back, y1: TOP + 2, x2: W - inset - back, y2: TOP + 2, stroke: "#fff", "stroke-width": 4 }, svg);
    el("line", { x1: inset + back, y1: TOP + 2, x2: W - inset - back, y2: TOP + 2, stroke: "#dc2626", "stroke-width": 4, "stroke-dasharray": "14 14" }, svg);
    el("line", { x1: inset, y1: FRONT - 2, x2: W - inset, y2: FRONT - 2, stroke: "#fff", "stroke-width": 4 }, svg);
    el("line", { x1: inset, y1: FRONT - 2, x2: W - inset, y2: FRONT - 2, stroke: "#dc2626", "stroke-width": 4, "stroke-dasharray": "18 18" }, svg);
    // lane line
    el("line", { x1: inset + back / 2 + 10, y1: LANE, x2: W - inset - back / 2 - 10, y2: LANE, stroke: "#f8fafc", "stroke-width": 3, "stroke-dasharray": "22 18", opacity: .85 }, svg);
    // start / finish
    el("text", { x: inset + 4, y: FRONT + SIDE + 22, class: "rd-end" }, svg).textContent = narrow ? "" : "START";

    // milestone checkpoints: chequered strip across the road + label below
    stopEls = [];
    STOPS.forEach(function (s, i) {
      var x = xs[i], g = el("g", { class: "rd-stop" + (s.current ? " is-current" : ""), tabindex: "0", role: "button",
        "aria-label": s.role + ", " + s.company + ", " + s.dates, "data-i": i }, svg);
      el("rect", { x: x - 30, y: TOP - 70, width: 60, height: H - TOP + 70, fill: "transparent" }, g);   // hit area
      for (var r = 0; r < 5; r++) {
        var y = TOP + (FRONT - TOP) * r / 5, h = (FRONT - TOP) / 5;
        el("rect", { x: x - 4 + (r % 2 ? 4 : 0), y: y, width: 4, height: h, fill: "#fff", opacity: .9 }, g);
        el("rect", { x: x + (r % 2 ? -4 : 0), y: y, width: 4, height: h, fill: "#111827", opacity: .9 }, g);
      }
      el("circle", { cx: x, cy: TOP - 6, r: 6, class: "rd-pin" }, g);
      var ly = FRONT + SIDE + 24;
      el("text", { x: x, y: ly, class: "rd-year", "text-anchor": "middle" }, g).textContent = s.year;
      var t = el("text", { x: x, y: ly + 19, class: "rd-role", "text-anchor": "middle" }, g);
      if (narrow) {
        var short = s.short.split("|");
        el("tspan", { x: x, dy: 0 }, t).textContent = short[0];
        el("tspan", { x: x, dy: 14 }, t).textContent = short[1];
      } else t.textContent = s.role;
      g.addEventListener("click", function () { setTarget(x); });
      g.addEventListener("focus", function () { setTarget(x); });
      stopEls.push(g);
    });

    // smoke goes behind the car
    smokeG = el("g", { class: "rd-smoke" }, svg);

    // the car: 3/4 side view, facing right, wheels on the lane
    car = el("g", { class: "rd-car" }, svg);
    carBody = el("g", {}, car);
    carBody.innerHTML =
      '<ellipse cx="0" cy="13" rx="40" ry="6" fill="#0f172a" opacity=".3"/>' +
      '<path d="M-38 6 q-2 -12 8 -14 l12 -2 q8 -12 22 -13 h12 q12 1 20 12 l10 2 q10 3 10 13 v4 h-94z" fill="url(#carRed)"/>' +
      '<path d="M-14 -11 q7 -10 18 -10 h9 q9 1 15 10 z" fill="url(#carGlass)"/>' +
      '<path d="M4 -21 v10" stroke="#9f1c1c" stroke-width="2.4"/>' +
      '<path d="M-36 0 h90" stroke="#ffffff" stroke-opacity=".35" stroke-width="1.5"/>' +
      '<rect x="48" y="-4" width="8" height="5" rx="2" fill="#fde68a"/>' +
      '<rect x="-40" y="-3" width="5" height="5" rx="1.5" fill="#7f1d1d"/>';
    wheels = [-22, 30].map(function (wx) {
      var w = el("g", { transform: "translate(" + wx + " 9)" }, car);
      el("circle", { r: 9.5, fill: "#111827" }, w);
      el("circle", { r: 5, fill: "#cbd5e1" }, w);
      var spokes = el("g", {}, w);
      el("path", { d: "M-4.5 0 H4.5 M0 -4.5 V4.5", stroke: "#64748b", "stroke-width": 1.6 }, spokes);
      return spokes;
    });

    if (pos == null) { pos = x0 - 20; target = pos; }
    else { pos = Math.max(x0 - 20, Math.min(x1 + 10, pos)); target = Math.max(x0 - 20, Math.min(x1 + 10, target)); }
    render();
    if (shown >= 0) placeBoard(shown);
  }

  function setTarget(x) {
    target = Math.max(x0 - 20, Math.min(x1 + 10, x));
    if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(loop); }
  }

  function render() {
    car.setAttribute("transform", "translate(" + pos.toFixed(1) + " " + (LANE - 8) + ") scale(" + (W < 640 ? 0.72 : 1) + ")");
    carBody.setAttribute("transform", "scale(" + dir + " 1)");
    wheels.forEach(function (s) { s.setAttribute("transform", "rotate(" + spin.toFixed(0) + ")"); });
  }

  function puff() {
    var ex = pos - dir * 40 * (W < 640 ? 0.72 : 1), ey = LANE - 4;
    var c = el("circle", { cx: ex, cy: ey, r: 4, fill: "url(#smoke)" }, smokeG);
    parts.push({ el: c, x: ex, y: ey, r: 4, life: 0, vx: -dir * (0.4 + Math.random() * 0.6), vy: -(0.3 + Math.random() * 0.5) });
  }

  var puffAcc = 0;
  function loop(now) {
    var dt = Math.min(50, now - lastT) / 16.7; lastT = now;
    var prev = pos;
    pos += (target - pos) * (reduceMotion ? 1 : Math.min(1, 0.075 * dt));
    vel = pos - prev;
    if (Math.abs(vel) > 0.15) dir = vel > 0 ? 1 : -1;
    spin += vel * 6;
    // smoke while driving
    var speed = Math.abs(vel);
    if (!reduceMotion && speed > 0.6) { puffAcc += speed * 0.12 * dt; while (puffAcc > 1) { puff(); puffAcc -= 1; } }
    parts = parts.filter(function (p) {
      p.life += 0.025 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 0.35 * dt;
      if (p.life >= 1) { p.el.remove(); return false; }
      p.el.setAttribute("cx", p.x.toFixed(1)); p.el.setAttribute("cy", p.y.toFixed(1));
      p.el.setAttribute("r", p.r.toFixed(1)); p.el.setAttribute("opacity", (1 - p.life).toFixed(2));
      return true;
    });
    render();
    // green board when the car arrives at a milestone
    var near = -1;
    xs.forEach(function (x, i) { if (Math.abs(pos - x) < 16) near = i; });
    if (near !== shown && (near === -1 || speed < 2.5)) showBoard(near);
    stopEls.forEach(function (g, i) { g.classList.toggle("is-reached", pos >= xs[i] - 16); g.classList.toggle("is-active", i === shown); });
    if (Math.abs(target - pos) > 0.3 || parts.length) raf = requestAnimationFrame(loop);
    else { raf = 0; }
  }

  function showBoard(i) {
    shown = i;
    drive.classList.toggle("has-board", i >= 0);
    if (i < 0) { board.classList.remove("show"); return; }
    var s = STOPS[i];
    board.innerHTML =
      '<div class="gb-sign">' +
        '<span class="gb-exit">EXIT ' + (i + 1) + '</span>' +
        '<p class="gb-dates">' + s.dates + '</p>' +
        '<h4>' + s.role + '</h4>' +
        '<p class="gb-co">' + s.company + '</p>' +
        '<p class="gb-meta">' + s.duration + (s.location ? ' · ' + s.location : '') + '</p>' +
        (s.skills ? '<ul class="gb-skills">' + s.skills.map(function (k) { return '<li>' + k + '</li>'; }).join('') + '</ul>' : '') +
        (s.current ? '<span class="gb-now">You are here</span>' : '') +
      '</div><span class="gb-post"></span><span class="gb-post"></span>';
    placeBoard(i);
    board.classList.remove("show");
    void board.offsetWidth;
    board.classList.add("show");
  }
  function placeBoard(i) {
    var bw = board.offsetWidth, x = xs[i];
    var left = Math.max(4, Math.min(W - bw - 4, x - bw / 2));
    board.style.left = left.toFixed(0) + "px";
    board.style.setProperty("--post-x", (x - left).toFixed(0) + "px");
  }

  // mouse drives the car; touch / click sets where it should go
  drive.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var r = svg.getBoundingClientRect();
    setTarget(e.clientX - r.left);
  });
  drive.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse") return;
    var r = svg.getBoundingClientRect();
    setTarget(e.clientX - r.left);
  });

  build();
  var rt = 0;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(build, 120); });
})();
