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

  // ---------- the mountain road ----------
  var drive = document.getElementById("drive");
  var svg = document.getElementById("road");
  var board = document.getElementById("driveBoard");
  var NS = "http://www.w3.org/2000/svg";
  var W, H, narrow, path, total, table = [], lens = [], car, carBody, wheelEls = [], smokeG, stopEls = [];
  var spin = 0, bounceT = 0, SC = 1, ROAD_W = 46;
  // Thar side view, in thar-body.png pixels (420 x 192): wheel centres and radius
  var BODY = { w: 420, h: 192, rear: [92.97, 148.65], front: [359.53, 148.65], r: 41.4 };
  var HALF_WB = (BODY.front[0] - BODY.rear[0]) / 2, MID_X = (BODY.front[0] + BODY.rear[0]) / 2, GROUND = BODY.rear[1] + BODY.r;
  var pos = null, target = null, dir = 1, shown = -1, parts = [], raf = 0, lastT = 0, puffAcc = 0;
  var CAR_W, CAR_H, AT = [0.14, 0.38, 0.62, 0.86];

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  // smooth curve through points (Catmull-Rom → cubic Bézier)
  function smooth(pts) {
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) +
           " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) +
           " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  }
  function mountain(x, base, w, h, fill, snow) {
    var g = el("g", {}, mtns);
    el("polygon", { points: [x - w / 2, base, x - w * .12, base - h * .78, x, base - h, x + w * .16, base - h * .74, x + w / 2, base].join(" "), fill: fill }, g);
    if (snow) el("polygon", { points: [x - w * .12, base - h * .78, x, base - h, x + w * .16, base - h * .74, x + w * .07, base - h * .68, x - w * .02, base - h * .76, x - w * .08, base - h * .66].join(" "), fill: "#fff", opacity: .95 }, g);
  }
  function pine(parent, x, y, s) {
    var g = el("g", { transform: "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") scale(" + s.toFixed(2) + ")" }, parent);
    el("rect", { x: -2.5, y: -6, width: 5, height: 8, fill: "#6b4f3a" }, g);
    el("polygon", { points: "-15,-4 15,-4 0,-26", fill: "url(#pine)" }, g);
    el("polygon", { points: "-12,-17 12,-17 0,-38", fill: "url(#pine)" }, g);
    el("polygon", { points: "-8,-30 8,-30 0,-48", fill: "url(#pine)" }, g);
  }
  var mtns;

  function build() {
    W = Math.max(320, document.documentElement.clientWidth);
    narrow = W < 640;
    H = narrow ? 300 : 360;
    CAR_W = narrow ? 104 : 176; SC = CAR_W / BODY.w; CAR_H = BODY.h * SC;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.innerHTML = "";

    el("defs", {}, svg).innerHTML =
      '<linearGradient id="mFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3d1e2"/><stop offset="1" stop-color="#e9eff6"/></linearGradient>' +
      '<linearGradient id="mMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93a8c2"/><stop offset="1" stop-color="#d6e0eb"/></linearGradient>' +
      '<linearGradient id="meadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfead8"/><stop offset="1" stop-color="#ffffff"/></linearGradient>' +
      '<linearGradient id="pine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f6b3c"/><stop offset=".55" stop-color="#1f4f2b"/><stop offset="1" stop-color="#16391f"/></linearGradient>' +
      '<radialGradient id="dust"><stop offset="0" stop-color="#b8a07e" stop-opacity=".7"/><stop offset="1" stop-color="#d6c6a8" stop-opacity="0"/></radialGradient><radialGradient id="smoke"><stop offset="0" stop-color="#cbd5e1" stop-opacity=".9"/><stop offset="1" stop-color="#e2e8f0" stop-opacity="0"/></radialGradient>' +
      '<filter id="carSh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#0f172a" flood-opacity=".35"/></filter>';

    // mountains in two layers, fading into the white page at the top
    mtns = el("g", { class: "rd-mtns" }, svg);
    var base = H * 0.56, n = narrow ? 4 : 7;
    for (var i = 0; i < n; i++) mountain((i + 0.3) * W / (n - 0.6), base, W / n * 1.9, H * (0.36 + (i % 3) * 0.06), "url(#mFar)", true);
    for (var j = 0; j < n - 1; j++) mountain((j + 0.85) * W / (n - 1), base + 6, W / n * 1.6, H * (0.24 + (j % 2) * 0.07), "url(#mMid)", j % 2 === 0);
    // meadow
    el("path", { d: "M0 " + (base - 4) + " Q " + W * 0.3 + " " + (base - 20) + " " + W * 0.55 + " " + (base - 2) + " T " + W + " " + (base - 6) + " V " + H + " H 0 Z", fill: "url(#meadow)" }, svg);
    // trees behind the road
    var back = el("g", {}, svg);
    for (var t = 0; t < (narrow ? 9 : 18); t++) {
      var tx = (t + 0.5) * W / (narrow ? 9 : 18) + ((t * 37) % 23) - 11;
      pine(back, tx, base + 10 + ((t * 13) % 14), narrow ? 0.62 : 0.8 + ((t * 7) % 5) / 20);
    }

    // the winding road
    var y0 = H * 0.76, amp = narrow ? 18 : 30, x0 = 10, x1 = W - 10;
    var pts = [];
    var waves = narrow ? 1 : 2;
    for (var k = 0; k <= 8; k++) pts.push([x0 + (x1 - x0) * k / 8, y0 + Math.sin(k * Math.PI * waves / 4 + 0.6) * amp]);
    var d = smooth(pts), rw = narrow ? 30 : 46; ROAD_W = rw;
    el("path", { d: d, fill: "none", stroke: "#0f172a", "stroke-opacity": .12, "stroke-width": rw + 22, "stroke-linecap": "round", transform: "translate(0 10)" }, svg);   // soft shadow
    el("path", { d: d, fill: "none", stroke: "#5b4a3a", "stroke-width": rw + 6, "stroke-linecap": "round", transform: "translate(0 7)" }, svg);                           // road edge (depth)
    el("path", { d: d, fill: "none", stroke: "#ffffff", "stroke-width": rw + 8, "stroke-linecap": "round" }, svg);                                                         // kerb white
    el("path", { d: d, fill: "none", stroke: "#dc2626", "stroke-width": rw + 8, "stroke-dasharray": "12 12" }, svg);                                                       // kerb red
    path = el("path", { d: d, fill: "none", stroke: "#3b424e", "stroke-width": rw, "stroke-linecap": "round" }, svg);                                                      // asphalt
    el("path", { d: d, fill: "none", stroke: "#f8fafc", "stroke-width": 2.5, "stroke-dasharray": "18 14", opacity: .85 }, svg);                                           // lane line
    total = path.getTotalLength();
    table = [];
    for (var L = 0; L <= total; L += 2) table.push([path.getPointAtLength(L).x, L]);
    lens = AT.map(function (f) { return lenAtX(x0 + (x1 - x0) * f); });

    // milestone markers + labels
    stopEls = [];
    STOPS.forEach(function (s, i) {
      var p = path.getPointAtLength(lens[i]);
      var g = el("g", { class: "rd-stop" + (s.current ? " is-current" : ""), tabindex: "0", role: "button",
        "aria-label": s.role + ", " + s.company + ", " + s.dates, "data-i": i }, svg);
      el("rect", { x: p.x - 34, y: p.y - 60, width: 68, height: H - p.y + 60, fill: "transparent" }, g);
      el("line", { x1: p.x, y1: p.y - rw / 2 - 4, x2: p.x, y2: p.y - rw / 2 - 30, class: "rd-pole" }, g);
      el("path", { d: "M" + p.x + " " + (p.y - rw / 2 - 30) + " l16 4 l-16 6 z", class: "rd-flag" }, g);
      var ly = p.y + rw / 2 + (narrow ? 20 : 26);
      el("text", { x: p.x, y: ly, class: "rd-year", "text-anchor": "middle" }, g).textContent = s.year;
      var tx = el("text", { x: p.x, y: ly + (narrow ? 15 : 19), class: "rd-role", "text-anchor": "middle" }, g);
      if (narrow) {
        var sh = s.short.split("|");
        el("tspan", { x: p.x, dy: 0 }, tx).textContent = sh[0];
        el("tspan", { x: p.x, dy: 14 }, tx).textContent = sh[1];
      } else tx.textContent = s.role;
      g.addEventListener("click", function () { setTarget(lens[i]); });
      g.addEventListener("focus", function () { setTarget(lens[i]); });
      stopEls.push(g);
    });

    // a few trees in front of the road, kept clear of the labels
    var front = el("g", {}, svg);
    [[0.03, 0.97], [0.26, 0.99], [0.5, 0.97], [0.74, 0.99], [0.98, 0.96]].forEach(function (f) {
      if (narrow && (f[0] === 0.26 || f[0] === 0.74)) return;
      pine(front, W * f[0], H * f[1], narrow ? 0.7 : 1);
    });

    smokeG = el("g", {}, svg);
    // the Thar: body + two wheels that really turn; origin = midpoint between the tyre contact points
    car = el("g", { class: "rd-car", filter: "url(#carSh)" }, svg);
    carBody = el("g", {}, car);
    el("image", { href: "assets/drive/thar-body.png", width: BODY.w, height: BODY.h, x: -MID_X, y: -GROUND }, carBody);
    wheelEls = [["rear", BODY.rear], ["front", BODY.front]].map(function (w) {
      var holder = el("g", { transform: "translate(" + (w[1][0] - MID_X).toFixed(2) + " " + (-BODY.r).toFixed(2) + ")" }, car);
      var spinG = el("g", {}, holder);
      el("image", { href: "assets/drive/thar-wheel-" + w[0] + ".png", width: BODY.r * 2, height: BODY.r * 2, x: -BODY.r, y: -BODY.r }, spinG);
      return spinG;
    });

    var lo = HALF_WB * SC + 6, hi = total - HALF_WB * SC - 6;
    if (pos == null) { pos = lo; target = lo; }
    pos = Math.max(lo, Math.min(hi, pos)); target = Math.max(lo, Math.min(hi, target));
    render();
    if (shown >= 0) placeBoard(shown);
  }

  function lenAtX(x) {
    var lo = 0, hi = table.length - 1;
    if (x <= table[0][0]) return 0;
    if (x >= table[hi][0]) return total;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (table[m][0] < x) lo = m; else hi = m; }
    var a = table[lo], b = table[hi];
    return a[1] + (b[1] - a[1]) * (x - a[0]) / ((b[0] - a[0]) || 1);
  }

  function setTarget(L) {
    target = Math.max(HALF_WB * SC + 6, Math.min(total - HALF_WB * SC - 6, L));
    if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(loop); }
  }

  // Both tyres sit on the road: find where the rear and front wheels touch it, tilt the body to match.
  var M = { x: 0, y: 0, a: 0 };
  function render(speed) {
    var hw = HALF_WB * SC, lane = ROAD_W * 0.16;
    var p1 = path.getPointAtLength(Math.max(0, pos - hw)), p2 = path.getPointAtLength(Math.min(total, pos + hw));
    M.a = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    M.x = (p1.x + p2.x) / 2; M.y = (p1.y + p2.y) / 2 + lane;
    car.setAttribute("transform", "translate(" + M.x.toFixed(1) + " " + M.y.toFixed(1) + ") rotate(" + (M.a * 180 / Math.PI).toFixed(2) + ") scale(" + (SC * dir).toFixed(4) + " " + SC.toFixed(4) + ")");
    wheelEls.forEach(function (w) { w.setAttribute("transform", "rotate(" + spin.toFixed(1) + ")"); });
    // a little suspension bounce while driving
    var b = speed ? Math.sin(bounceT) * Math.min(1.6, speed * 0.5) : 0;
    carBody.setAttribute("transform", "translate(0 " + b.toFixed(2) + ")");
    return M;
  }
  // body pixels → screen point
  function toScreen(lx, ly) {
    var x = lx * SC * dir, y = ly * SC, c = Math.cos(M.a), s = Math.sin(M.a);
    return { x: M.x + x * c - y * s, y: M.y + x * s + y * c };
  }

  function puff() {
    // exhaust under the rear bumper, plus a little dust from the rear tyre
    var e = toScreen(12 - MID_X, -24), d = toScreen(BODY.rear[0] - MID_X - BODY.r * 0.6, -2);
    [[e, 4, "url(#smoke)"], [d, 3, "url(#dust)"]].forEach(function (q) {
      var c = el("circle", { cx: q[0].x, cy: q[0].y, r: q[1], fill: q[2] }, smokeG);
      parts.push({ el: c, x: q[0].x, y: q[0].y, r: q[1], life: 0, vx: -dir * (0.5 + Math.random() * 0.7), vy: -(0.2 + Math.random() * 0.6) });
    });
  }

  function loop(now) {
    var dt = Math.min(50, now - lastT) / 16.7; lastT = now;
    var prev = pos;
    pos += (target - pos) * (reduceMotion ? 1 : Math.min(1, 0.07 * dt));
    var vel = pos - prev, speed = Math.abs(vel);
    if (speed > 0.15) dir = vel > 0 ? 1 : -1;
    spin += speed / (BODY.r * SC) * 180 / Math.PI;      // wheels roll exactly as far as the car moves
    bounceT += speed * 0.18 * dt;
    render(speed);
    if (!reduceMotion && speed > 0.6) { puffAcc += speed * 0.1 * dt; while (puffAcc > 1) { puff(); puffAcc -= 1; } }
    parts = parts.filter(function (q) {
      q.life += 0.025 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += 0.4 * dt;
      if (q.life >= 1) { q.el.remove(); return false; }
      q.el.setAttribute("cx", q.x.toFixed(1)); q.el.setAttribute("cy", q.y.toFixed(1));
      q.el.setAttribute("r", q.r.toFixed(1)); q.el.setAttribute("opacity", (1 - q.life).toFixed(2));
      return true;
    });
    var near = -1;
    lens.forEach(function (L, i) { if (Math.abs(pos - L) < 18) near = i; });
    if (near !== shown && (near === -1 || speed < 2.5)) showBoard(near);
    stopEls.forEach(function (g, i) { g.classList.toggle("is-reached", pos >= lens[i] - 18); g.classList.toggle("is-active", i === shown); });
    if (Math.abs(target - pos) > 0.3 || parts.length) raf = requestAnimationFrame(loop);
    else raf = 0;
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
    var p = path.getPointAtLength(lens[i]);
    var bw = board.offsetWidth, bh = board.offsetHeight;
    var left = Math.max(8, Math.min(W - bw - 8, p.x - bw / 2));
    var sr = svg.getBoundingClientRect(), dr = drive.getBoundingClientRect();
    var svgTop = sr.top - dr.top;
    board.style.left = (left + sr.left - dr.left).toFixed(0) + "px";
    board.style.top = (svgTop + p.y - CAR_H - 30 - bh).toFixed(0) + "px";
    board.style.setProperty("--post-x", (p.x - left).toFixed(0) + "px");
  }

  // the mouse drives the Thar; touch / click sets where it should go
  function fromEvent(e) { var r = svg.getBoundingClientRect(); return lenAtX(e.clientX - r.left); }
  drive.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") setTarget(fromEvent(e)); });
  drive.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") setTarget(fromEvent(e)); });

  build();
  var rt = 0;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(build, 120); });
})();
