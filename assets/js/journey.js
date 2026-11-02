/* Experience road map: a car drives along a winding road from 2019 to today.
   Point at (or tap / focus) a milestone and the car drives there; the destination board shows that role.
   The first time the section scrolls into view, the car drives the whole journey on its own. */
(function () {
  "use strict";

  var wrap = document.getElementById("journey");
  if (!wrap) return;
  var svg = document.getElementById("road");
  var board = document.getElementById("board");
  var NS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobileMQ = window.matchMedia("(max-width: 760px)");

  function since(y, m) {             // LinkedIn-style "x yrs y mos" up to this month (inclusive)
    var now = new Date();
    var months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) + 1;
    return fmt(months);
  }
  function fmt(months) {
    var y = Math.floor(months / 12), m = months % 12, out = [];
    if (y) out.push(y + (y === 1 ? " yr" : " yrs"));
    if (m) out.push(m + (m === 1 ? " mo" : " mos"));
    return out.join(" ");
  }

  var STOPS = [
    { year: "2019", role: "Java Developer", company: "Neutrinous Solutions Pvt Ltd",
      dates: "Apr 2019 – May 2020", duration: fmt(14) },
    { year: "2020", role: "AR Application Developer", company: "Bellspire Virtual Art Pvt Ltd",
      dates: "Jun 2020 – Mar 2021", duration: fmt(10) },
    { year: "2021", role: "Cloud Engineer", company: "CloudJournee · Full-time",
      dates: "Apr 2021 – Sep 2023", duration: fmt(30), skills: ["AWS", "Terraform"] },
    { year: "2023", role: "Senior Cloud Engineer", company: "CloudJournee · Full-time",
      dates: "Sep 2023 – Present", duration: since(2023, 9), location: "Bengaluru, Karnataka, India",
      skills: ["AWS", "Google Cloud (GCP)"], current: true }
  ];

  var LAYOUTS = {
    wide: {
      view: [1200, 480],
      d: "M -40 372 C 110 372 170 300 300 300 C 430 300 470 398 600 398 C 730 398 770 300 900 300 C 1030 300 1090 360 1240 352",
      at: [0.15, 0.385, 0.615, 0.845]
    },
    narrow: {
      view: [420, 1080],
      d: "M 210 -30 C 210 90 100 120 110 230 C 120 340 320 360 310 470 C 300 580 100 600 110 710 C 120 820 310 840 310 950 C 310 1020 230 1050 210 1110",
      at: [0.15, 0.39, 0.625, 0.855]
    }
  };

  var mode, path, total, lens = [], car, stopEls = [], curLen = 0, active = -1, raf = 0, touring = null;

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function build() {
    mode = mobileMQ.matches ? "narrow" : "wide";
    var L = LAYOUTS[mode];
    svg.innerHTML = "";
    svg.setAttribute("viewBox", "0 0 " + L.view[0] + " " + L.view[1]);
    wrap.classList.toggle("is-narrow", mode === "narrow");

    var defs = el("defs", {}, svg);
    defs.innerHTML = '<filter id="carShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0f172a" flood-opacity=".35"/></filter>';

    // road: soft shadow, kerb, asphalt, centre line
    el("path", { d: L.d, fill: "none", stroke: "#e9edf2", "stroke-width": 74, "stroke-linecap": "round" }, svg);
    el("path", { d: L.d, fill: "none", stroke: "#c4ccd7", "stroke-width": 56, "stroke-linecap": "round" }, svg);
    path = el("path", { d: L.d, fill: "none", stroke: "#3b4250", "stroke-width": 48, "stroke-linecap": "round", "stroke-linejoin": "round" }, svg);
    el("path", { d: L.d, fill: "none", stroke: "#ffffff", "stroke-width": 3, "stroke-dasharray": "16 14", opacity: .9 }, svg);
    total = path.getTotalLength();
    lens = L.at.map(function (f) { return f * total; });

    // milestones
    stopEls = [];
    STOPS.forEach(function (s, i) {
      var p = path.getPointAtLength(lens[i]);
      var g = el("g", { class: "stop" + (s.current ? " is-current" : ""), tabindex: "0", role: "button",
        "aria-label": s.role + ", " + s.company + ", " + s.dates, "data-i": i }, svg);
      // hit area
      el("circle", { cx: p.x, cy: p.y, r: 46, fill: "transparent" }, g);
      // pin standing on the road edge
      el("line", { x1: p.x, y1: p.y - 24, x2: p.x, y2: p.y - 52, class: "stop-stem" }, g);
      el("circle", { cx: p.x, cy: p.y - 64, r: 16, class: "stop-pin" }, g);
      el("text", { x: p.x, y: p.y - 59, class: "stop-num", "text-anchor": "middle" }, g).textContent = i + 1;
      el("circle", { cx: p.x, cy: p.y - 64, r: 16, class: "stop-ring" }, g);
      // label
      var lx = p.x, ly = p.y + 58, anchor = "middle";
      if (mode === "narrow") { anchor = p.x < 210 ? "start" : "end"; lx = p.x + (p.x < 210 ? 42 : -42); ly = p.y + 6; }
      el("text", { x: lx, y: ly, class: "stop-year", "text-anchor": anchor }, g).textContent = s.year + (s.current ? " · Present" : "");
      el("text", { x: lx, y: ly + 22, class: "stop-role", "text-anchor": anchor }, g).textContent = s.role;
      stopEls.push({ g: g, p: p });
      g.addEventListener("mouseenter", function () { go(i, true); });
      g.addEventListener("focus", function () { go(i, true); });
      g.addEventListener("click", function () { go(i, true); });
    });

    // start / finish flags
    var p0 = path.getPointAtLength(0.035 * total), pN = path.getPointAtLength(0.965 * total);
    if (mode === "wide") {
      el("text", { x: 14, y: p0.y + 56, class: "road-end", "text-anchor": "start" }, svg).textContent = "START";
      el("text", { x: 1186, y: pN.y + 56, class: "road-end", "text-anchor": "end" }, svg).textContent = "TODAY";
    }

    // car (top-down, facing +x)
    car = el("g", { class: "car", filter: "url(#carShadow)" }, svg);
    car.innerHTML =
      '<rect x="-17" y="-14" width="9" height="5" rx="2" fill="#111827"/><rect x="9" y="-14" width="9" height="5" rx="2" fill="#111827"/>' +
      '<rect x="-17" y="9" width="9" height="5" rx="2" fill="#111827"/><rect x="9" y="9" width="9" height="5" rx="2" fill="#111827"/>' +
      '<rect x="-24" y="-11.5" width="48" height="23" rx="8" fill="#E53935"/>' +
      '<rect x="-6" y="-9" width="16" height="18" rx="4" fill="#C62828"/>' +
      '<path d="M10 -9 h5 a3 3 0 0 1 3 3 v12 a3 3 0 0 1 -3 3 h-5z" fill="#BFE3FF"/>' +
      '<path d="M-10 -8 h-4 a3 3 0 0 0 -3 3 v10 a3 3 0 0 0 3 3 h4z" fill="#9CCBF0"/>' +
      '<rect x="21" y="-9" width="3" height="5" rx="1.2" fill="#FDE68A"/><rect x="21" y="4" width="3" height="5" rx="1.2" fill="#FDE68A"/>' +
      '<rect x="-24" y="-9" width="2.5" height="4" rx="1" fill="#7F1D1D"/><rect x="-24" y="5" width="2.5" height="4" rx="1" fill="#7F1D1D"/>';
    placeCar(curLen);
    if (active >= 0) showBoard(active, true);
  }

  function placeCar(len) {
    len = Math.max(0, Math.min(total, len));
    var a = path.getPointAtLength(len);
    var b = path.getPointAtLength(Math.min(total, len + 1)), c = path.getPointAtLength(Math.max(0, len - 1));
    var ang = Math.atan2(b.y - c.y, b.x - c.x) * 180 / Math.PI;
    car.setAttribute("transform", "translate(" + a.x.toFixed(1) + " " + a.y.toFixed(1) + ") rotate(" + ang.toFixed(1) + ")");
  }

  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function drive(toLen, done) {
    cancelAnimationFrame(raf);
    var from = curLen, dist = Math.abs(toLen - from);
    if (reduceMotion || dist < 1) { curLen = toLen; placeCar(curLen); done && done(); return; }
    var dur = 450 + dist * 1.1, t0 = performance.now();
    wrap.classList.add("driving");
    (function step(now) {
      var t = Math.min(1, (now - t0) / dur);
      curLen = from + (toLen - from) * ease(t);
      placeCar(curLen);
      if (t < 1) raf = requestAnimationFrame(step);
      else { wrap.classList.remove("driving"); done && done(); }
    })(t0);
  }

  function go(i, byUser) {
    if (byUser && touring) { clearTimeout(touring); touring = null; }
    if (i === active && !wrap.classList.contains("driving")) return;
    hideBoard();
    setActive(i);
    drive(lens[i], function () { showBoard(i); });
  }

  function setActive(i) {
    active = i;
    stopEls.forEach(function (s, k) { s.g.classList.toggle("is-active", k === i); });
  }

  function hideBoard() { board.classList.remove("show"); }

  function showBoard(i, instant) {
    var s = STOPS[i];
    board.innerHTML =
      '<div class="db-sign">' +
        '<span class="db-exit">EXIT ' + (i + 1) + '</span>' +
        '<p class="db-dates">' + s.dates + '</p>' +
        '<h4>' + s.role + '</h4>' +
        '<p class="db-co">' + s.company + '</p>' +
        '<p class="db-meta">' + s.duration + (s.location ? ' · ' + s.location : '') + '</p>' +
        (s.skills ? '<ul class="db-skills">' + s.skills.map(function (k) { return '<li>' + k + '</li>'; }).join('') + '</ul>' : '') +
        (s.current ? '<span class="db-now">You are here</span>' : '') +
      '</div><span class="db-post"></span><span class="db-post"></span>';
    if (mode === "wide") {
      var r = svg.getBoundingClientRect(), k = r.width / LAYOUTS.wide.view[0];
      var p = stopEls[i].p, x = p.x * k, pinTop = (p.y - 82) * k;
      board.style.left = "0px"; board.style.top = "0px";
      var bw = board.offsetWidth, bh = board.offsetHeight;
      var left = Math.max(0, Math.min(r.width - bw, x - bw / 2));
      board.style.left = left.toFixed(0) + "px";
      board.style.top = Math.max(0, pinTop - bh).toFixed(0) + "px";
      board.style.setProperty("--post-x", (x - left).toFixed(0) + "px");
    } else {
      board.style.left = board.style.top = "";
    }
    if (instant) board.classList.add("show");
    else requestAnimationFrame(function () { board.classList.add("show"); });
  }

  // first time in view: drive the whole journey, pausing at each stop
  function tour() {
    var i = 0;
    (function next() {
      go(i, false);
      var wait = function () {
        if (wrap.classList.contains("driving")) { touring = setTimeout(wait, 120); return; }
        if (i < STOPS.length - 1) { i++; touring = setTimeout(next, 1100); } else touring = null;
      };
      touring = setTimeout(wait, 150);
    })();
  }

  build();
  mobileMQ.addEventListener ? mobileMQ.addEventListener("change", build) : mobileMQ.addListener(build);
  window.addEventListener("resize", function () { if (active >= 0 && !wrap.classList.contains("driving")) showBoard(active, true); });

  if (reduceMotion || !("IntersectionObserver" in window)) { curLen = lens[STOPS.length - 1]; placeCar(curLen); setActive(STOPS.length - 1); showBoard(STOPS.length - 1, true); }
  else {
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { io.disconnect(); tour(); }
    }, { threshold: 0.45 });
    io.observe(wrap);
  }
})();
