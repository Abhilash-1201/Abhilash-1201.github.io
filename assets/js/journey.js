/* Experience as a mountain trek: a glowing trail zig-zags up to the summit (the goal flag).
   Each role is an achievement flag on the trail. Point at (or tap / focus) a flag and the trekker
   walks there; the info board shows that role. The first time the section scrolls into view,
   the trekker climbs the whole trail on his own, raising each flag as he reaches it. */
(function () {
  "use strict";

  var wrap = document.getElementById("journey");
  if (!wrap) return;
  var svg = document.getElementById("trek");
  var board = document.getElementById("board");
  var NS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobileMQ = window.matchMedia("(max-width: 760px)");

  function fmt(months) {
    var y = Math.floor(months / 12), m = months % 12, out = [];
    if (y) out.push(y + (y === 1 ? " yr" : " yrs"));
    if (m) out.push(m + (m === 1 ? " mo" : " mos"));
    return out.join(" ");
  }
  function since(y, m) {             // LinkedIn-style duration up to this month (inclusive)
    var now = new Date();
    return fmt((now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) + 1);
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
      skills: ["AWS", "Google Cloud (GCP)"], current: true },
    { year: "Goal", role: "The summit", goal: true,
      company: "Keep climbing",
      note: "Building secure, scalable and reliable cloud platforms, one milestone at a time." }
  ];

  // Two scenes: wide (desktop) and tall (phones). Trail points run from the foot of the mountain to the summit.
  var LAYOUTS = {
    wide: {
      view: [1200, 680],
      mountain: "0,680 0,610 120,560 230,500 330,420 420,330 500,240 560,170 600,112 632,140 690,205 780,300 880,390 980,450 1090,510 1200,560 1200,680",
      far: "0,680 0,520 160,430 300,470 430,380 560,450 700,360 860,430 1000,350 1120,420 1200,390 1200,680",
      trail: [[730, 690], [455, 610], [800, 520], [520, 440], [720, 352], [555, 272], [660, 205], [602, 132]],
      at: [0.13, 0.36, 0.585, 0.8, 1],
      labels: [null, [96, -2, "start"], null, null, null],
      sun: [655, 225, 260]
    },
    tall: {
      view: [600, 880],
      mountain: "0,880 0,640 70,560 140,450 200,330 250,220 300,112 335,170 390,270 450,390 520,490 600,570 600,880",
      far: "0,880 0,500 120,420 230,470 340,380 460,440 600,380 600,880",
      trail: [[370, 890], [140, 790], [440, 690], [170, 590], [410, 490], [225, 390], [345, 290], [300, 205], [302, 126]],
      at: [0.14, 0.37, 0.59, 0.8, 1],
      labels: [null, null, null, null, [-24, -46, "end"]],
      sun: [330, 220, 200]
    }
  };

  var mode, L, path, total, lens = [], hiker, flagEls = [], curLen = 0, active = -1, reached = -1, raf = 0, touring = null;

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // Catmull-Rom through the trail points → smooth cubic Bézier path
  function smooth(pts) {
    var d = "M" + pts[0][0] + " " + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += " C" + c1[0].toFixed(1) + " " + c1[1].toFixed(1) + " " + c2[0].toFixed(1) + " " + c2[1].toFixed(1) + " " + p2[0] + " " + p2[1];
    }
    return d;
  }

  function build() {
    mode = mobileMQ.matches ? "tall" : "wide";
    L = LAYOUTS[mode];
    var W = L.view[0], H = L.view[1];
    svg.innerHTML = "";
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    wrap.classList.toggle("is-narrow", mode === "tall");

    el("defs", {}, svg).innerHTML =
      '<linearGradient id="tkSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B3A63"/><stop offset=".45" stop-color="#5C86B5"/><stop offset=".72" stop-color="#C9D7E4"/><stop offset="1" stop-color="#F3D6A4"/></linearGradient>' +
      '<radialGradient id="tkSun"><stop offset="0" stop-color="#FFF6D6"/><stop offset=".25" stop-color="#FFD98A" stop-opacity=".95"/><stop offset=".6" stop-color="#F7B65A" stop-opacity=".35"/><stop offset="1" stop-color="#F7B65A" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="tkFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E86A3"/><stop offset="1" stop-color="#9FB1C6"/></linearGradient>' +
      '<linearGradient id="tkMtn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A3346"/><stop offset=".55" stop-color="#151B28"/><stop offset="1" stop-color="#0B0F18"/></linearGradient>' +
      '<linearGradient id="tkRim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F7B65A" stop-opacity="0"/><stop offset=".5" stop-color="#FFD98A" stop-opacity=".55"/><stop offset="1" stop-color="#F7B65A" stop-opacity="0"/></linearGradient>' +
      '<filter id="tkGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="tkHaze"><feGaussianBlur stdDeviation="12"/></filter>' +
      '<filter id="tkShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".5"/></filter>';

    // sky, sun, clouds, far range, mountain
    el("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#tkSky)" }, svg);
    el("circle", { cx: L.sun[0], cy: L.sun[1], r: L.sun[2], fill: "url(#tkSun)" }, svg);
    var clouds = el("g", { class: "tk-clouds", filter: "url(#tkHaze)", opacity: .55 }, svg);
    [[0.18, 0.16, 120], [0.8, 0.12, 150], [0.55, 0.3, 90]].forEach(function (c) {
      el("ellipse", { cx: c[0] * W, cy: c[1] * H, rx: c[2], ry: c[2] * 0.22, fill: "#fff" }, clouds);
    });
    el("polygon", { points: L.far, fill: "url(#tkFar)", opacity: .75 }, svg);
    el("rect", { x: 0, y: H * 0.55, width: W, height: H * 0.2, fill: "#E8EEF5", opacity: .25, filter: "url(#tkHaze)" }, svg);
    el("polygon", { points: L.mountain, fill: "url(#tkMtn)" }, svg);
    el("polyline", { points: L.mountain.split(" ").slice(1, -1).join(" "), fill: "none", stroke: "url(#tkRim)", "stroke-width": 2.5, opacity: .9 }, svg);

    // glowing trail
    var d = smooth(L.trail);
    el("path", { d: d, fill: "none", stroke: "#F59E0B", "stroke-width": 9, "stroke-linecap": "round", opacity: .35, filter: "url(#tkGlow)" }, svg);
    path = el("path", { d: d, fill: "none", stroke: "#FCD34D", "stroke-width": 3.5, "stroke-linecap": "round" }, svg);
    el("path", { d: d, fill: "none", stroke: "#FFF7D6", "stroke-width": 1.4, "stroke-dasharray": "2 10", "stroke-linecap": "round", class: "tk-sparkle" }, svg);
    total = path.getTotalLength();
    lens = L.at.map(function (f) { return f * total; });

    // flags
    flagEls = [];
    STOPS.forEach(function (s, i) {
      var p = path.getPointAtLength(Math.min(lens[i], total - 0.5));
      var g = el("g", { class: "tk-stop" + (s.goal ? " is-goal" : ""), tabindex: "0", role: "button",
        "aria-label": s.goal ? "Summit: the goal" : s.role + ", " + s.company + ", " + s.dates, "data-i": i }, svg);
      el("circle", { cx: p.x, cy: p.y - 18, r: 36, fill: "transparent" }, g);       // hit area
      el("circle", { cx: p.x, cy: p.y, r: 6.5, class: "tk-node" }, g);
      el("circle", { cx: p.x, cy: p.y, r: 6.5, class: "tk-pulse" }, g);
      var big = s.goal ? 1.45 : 1;
      var fx = p.x + (s.goal ? -2 : 9), fy = p.y - 4;
      el("line", { x1: fx, y1: fy, x2: fx, y2: fy - 40 * big, class: "tk-pole" }, g);
      var flag = el("path", { d: "M" + fx + " " + (fy - 40 * big) + " q " + (14 * big) + " -6 " + (26 * big) + " 2 l -5 " + (8 * big) + " l 5 " + (8 * big) + " q -12 -7 -" + (26 * big) + " -2 z", class: "tk-flag" }, g);
      flag.style.transformOrigin = fx + "px " + (fy - 34 * big) + "px";
      // label
      var right = s.goal ? true : (p.x < W / 2 ? false : true);
      if (mode === "tall") right = p.x < W / 2;
      var lx = right ? fx + 34 * big : p.x - 18, anchor = right ? "start" : "end";
      if (s.goal) { lx = fx + 46; }
      var ly = p.y - 26 * big, o = L.labels && L.labels[i];
      if (o) { lx = p.x + o[0]; ly = p.y + o[1]; anchor = o[2]; }
      el("text", { x: lx, y: ly, class: "tk-year", "text-anchor": anchor }, g).textContent = s.goal ? "GOAL" : s.year;
      if (mode === "wide") el("text", { x: lx, y: ly + 19, class: "tk-role", "text-anchor": anchor }, g).textContent = s.goal ? "The summit" : s.role;
      flagEls.push({ g: g, p: p });
      g.addEventListener("mouseenter", function () { go(i, true); });
      g.addEventListener("focus", function () { go(i, true); });
      g.addEventListener("click", function () { go(i, true); });
    });

    // base camp marker
    var b = path.getPointAtLength(18);
    el("text", { x: b.x + 22, y: b.y - 6, class: "tk-camp" }, svg).textContent = "BASE CAMP";

    // the trekker (side view, facing right, feet at 0,0)
    hiker = el("g", { class: "tk-hiker", filter: "url(#tkShadow)" }, svg);
    hiker.innerHTML =
      '<g class="tk-flip">' +
        '<g class="tk-leg tk-leg-b"><rect x="-3.2" y="-14" width="4.4" height="14" rx="2.2" fill="#1E293B"/><rect x="-4" y="-2.6" width="7" height="3" rx="1.4" fill="#78350F"/></g>' +
        '<rect x="-12.5" y="-30" width="9" height="15" rx="3" fill="#EA580C"/>' +                       // backpack
        '<rect x="-12.5" y="-33" width="9" height="4" rx="2" fill="#9A3412"/>' +
        '<rect x="-5" y="-29" width="10" height="16" rx="4" fill="#2563EB"/>' +                          // jacket
        '<g class="tk-leg tk-leg-f"><rect x="-1.5" y="-14" width="4.4" height="14" rx="2.2" fill="#334155"/><rect x="-2.2" y="-2.6" width="7" height="3" rx="1.4" fill="#92400E"/></g>' +
        '<circle cx="0.5" cy="-34" r="5" fill="#C68A5C"/>' +                                              // head
        '<path d="M-4.6 -35.5 a5 5 0 0 1 10 0 z" fill="#DC2626"/><circle cx="0.4" cy="-40.4" r="1.6" fill="#DC2626"/>' +   // beanie
        '<g class="tk-arm"><line x1="1" y1="-25" x2="8" y2="-17" stroke="#1D4ED8" stroke-width="3.6" stroke-linecap="round"/>' +
          '<line x1="8.5" y1="-24" x2="12" y2="1" stroke="#CBD5E1" stroke-width="1.6" stroke-linecap="round"/></g>' +
      '</g>';
    placeHiker(curLen);
    markReached(reached);
    if (active >= 0) showBoard(active, true);
  }

  function placeHiker(len, dir) {
    len = Math.max(0, Math.min(total, len));
    var a = path.getPointAtLength(len);
    hiker.setAttribute("transform", "translate(" + a.x.toFixed(1) + " " + a.y.toFixed(1) + ") scale(" + (mode === "wide" ? 1.6 : 1.9) + ")");
    if (dir) hiker.firstChild.setAttribute("transform", dir < 0 ? "scale(-1 1)" : "");
  }

  function markReached(n) {
    reached = n;
    flagEls.forEach(function (f, k) { f.g.classList.toggle("is-reached", k <= n); });
  }

  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function walk(toLen, done) {
    cancelAnimationFrame(raf);
    var from = curLen, dist = Math.abs(toLen - from);
    if (reduceMotion || dist < 1) { curLen = toLen; placeHiker(curLen); done && done(); return; }
    var dur = 500 + dist * 2.1, t0 = performance.now(), lastX = path.getPointAtLength(from).x;
    wrap.classList.add("walking");
    (function step(now) {
      var t = Math.min(1, (now - t0) / dur);
      curLen = from + (toLen - from) * ease(t);
      var x = path.getPointAtLength(curLen).x;
      placeHiker(curLen, Math.abs(x - lastX) > 0.05 ? (x > lastX ? 1 : -1) : 0);
      lastX = x;
      // raise flags as he passes them on the way up
      for (var k = 0; k < lens.length; k++) if (toLen > from && curLen >= lens[k] - 2 && k > reached) markReached(k);
      if (t < 1) raf = requestAnimationFrame(step);
      else { wrap.classList.remove("walking"); done && done(); }
    })(t0);
  }

  function go(i, byUser) {
    if (byUser && touring) { clearTimeout(touring); touring = null; }
    if (i === active && !wrap.classList.contains("walking")) return;
    board.classList.remove("show");
    active = i;
    flagEls.forEach(function (f, k) { f.g.classList.toggle("is-active", k === i); });
    walk(Math.min(lens[i], total - 2), function () {
      if (i > reached) markReached(i);
      showBoard(i);
    });
  }

  function showBoard(i, instant) {
    var s = STOPS[i];
    board.classList.toggle("is-goal", !!s.goal);
    board.innerHTML = s.goal
      ? '<p class="tb-tag"><span class="tb-flag" aria-hidden="true"></span>The goal</p><h4>The summit</h4><p class="tb-co">' + s.company + '</p><p class="tb-meta">' + s.note + '</p>'
      : '<p class="tb-tag"><span class="tb-flag" aria-hidden="true"></span>Milestone ' + (i + 1) + ' · ' + s.dates + '</p>' +
        '<h4>' + s.role + '</h4>' +
        '<p class="tb-co">' + s.company + '</p>' +
        '<p class="tb-meta">' + s.duration + (s.location ? ' · ' + s.location : '') + '</p>' +
        (s.skills ? '<ul class="tb-skills">' + s.skills.map(function (k) { return '<li>' + k + '</li>'; }).join('') + '</ul>' : '') +
        (s.current ? '<span class="tb-now">You are here</span>' : '');
    if (mode === "wide") {
      var r = svg.getBoundingClientRect(), k = r.width / L.view[0];
      var p = flagEls[i].p, x = p.x * k, y = p.y * k;
      board.style.left = "0px"; board.style.top = "0px";
      var bw = board.offsetWidth, bh = board.offsetHeight, gap = 70 * k;
      // put the board on the open sky side of the flag
      var onLeft = p.x > L.view[0] * 0.5;
      var left = onLeft ? x - gap - bw : x + gap;
      left = Math.max(12, Math.min(r.width - bw - 12, left));
      var top = Math.max(12, Math.min(r.height - bh - 12, y - bh * 0.6));
      board.style.left = left.toFixed(0) + "px";
      board.style.top = top.toFixed(0) + "px";
    } else {
      board.style.left = board.style.top = "";
    }
    if (instant) board.classList.add("show");
    else requestAnimationFrame(function () { board.classList.add("show"); });
  }

  // First time in view: climb the whole trail, pausing at each flag, and stop at the current role.
  function tour() {
    var i = 0, last = STOPS.length - 2;
    (function next() {
      go(i, false);
      var wait = function () {
        if (wrap.classList.contains("walking")) { touring = setTimeout(wait, 120); return; }
        if (i < last) { i++; touring = setTimeout(next, 1200); } else touring = null;
      };
      touring = setTimeout(wait, 150);
    })();
  }

  build();
  mobileMQ.addEventListener ? mobileMQ.addEventListener("change", build) : mobileMQ.addListener(build);
  window.addEventListener("resize", function () { if (active >= 0 && !wrap.classList.contains("walking")) showBoard(active, true); });

  var current = STOPS.length - 2;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    curLen = lens[current]; placeHiker(curLen); markReached(current);
    active = current; flagEls[current].g.classList.add("is-active"); showBoard(current, true);
  } else {
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { io.disconnect(); tour(); }
    }, { threshold: 0.4 });
    io.observe(wrap);
  }
})();
