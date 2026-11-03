/* Projects: the Fluence scene. A wind + solar farm generates power, an inverter feeds a battery yard,
   and the stored energy is sold to the grid. A live dashboard (like Fluence Mosaic) shows the numbers:
   when the market price is low the batteries charge, when it is high they discharge and sell. */
(function () {
  "use strict";
  var svg = document.getElementById("flScene");
  if (!svg) return;
  var NS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(tag, attrs, parent, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    (parent || svg).appendChild(n);
    return n;
  }

  el("defs").innerHTML =
    '<linearGradient id="fsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfdbfe"/><stop offset=".35" stop-color="#e0efff"/><stop offset="1" stop-color="#f8fafc"/></linearGradient>' +
    '<linearGradient id="fsHillFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7f3d0"/><stop offset="1" stop-color="#d1fae5"/></linearGradient>' +
    '<linearGradient id="fsHill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86efac"/><stop offset="1" stop-color="#4ade80"/></linearGradient>' +
    '<linearGradient id="fsTower" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cbd5e1"/></linearGradient>' +
    '<linearGradient id="fsBox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#dfe6ee"/></linearGradient>' +
    '<linearGradient id="fsPanel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient>' +
    '<radialGradient id="fsSpark"><stop offset="0" stop-color="#fffbe6"/><stop offset=".4" stop-color="#facc15"/><stop offset="1" stop-color="#facc15" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="fsSparkB"><stop offset="0" stop-color="#eff6ff"/><stop offset=".4" stop-color="#60a5fa"/><stop offset="1" stop-color="#60a5fa" stop-opacity="0"/></radialGradient>' +
    '<g id="fsRotor"><circle r="4.5" fill="#e2e8f0" stroke="#94a3b8"/>' +
      [0, 120, 240].map(function (a) { return '<path d="M0 -4 C4 -18 3 -40 0 -52 C-3 -40 -4 -18 0 -4Z" fill="#fff" stroke="#94a3b8" stroke-width="1" transform="rotate(' + a + ')"/>'; }).join("") + '</g>';

  // ---------- sky and land ----------
  el("rect", { width: 560, height: 1100, fill: "url(#fsSky)" });
  el("circle", { cx: 470, cy: 78, r: 34, fill: "#fde68a", opacity: .9 });
  el("circle", { cx: 470, cy: 78, r: 56, fill: "#fde68a", opacity: .25 });
  el("path", { d: "M0 250 C90 210 180 236 270 226 C370 214 450 238 560 222 V470 H0Z", fill: "url(#fsHillFar)" });
  el("path", { d: "M0 300 C120 276 230 300 330 292 C430 284 500 300 560 296 V470 H0Z", fill: "url(#fsHill)" });
  el("rect", { y: 470, width: 560, height: 630, fill: "#f8fafc" });
  el("path", { d: "M0 470 C140 488 420 456 560 474 V500 H0Z", fill: "#4ade80", opacity: .25 });

  // ---------- 1. wind + solar farm ----------
  function turbine(x, base, s, dur, phase) {
    var g = el("g", { transform: "translate(" + x + " " + base + ") scale(" + s + ")" });
    el("polygon", { points: "-4,0 4,0 2,-150 -2,-150", fill: "url(#fsTower)" }, g);
    el("rect", { x: -7, y: -156, width: 16, height: 8, rx: 4, fill: "#e2e8f0", stroke: "#94a3b8" }, g);
    var hub = el("g", { transform: "translate(0 -152)" }, g);
    var rot = el("g", {}, hub);
    el("use", { href: "#fsRotor" }, rot);
    if (!reduceMotion) el("animateTransform", { attributeName: "transform", type: "rotate", from: phase, to: phase + 360, dur: dur + "s", repeatCount: "indefinite" }, rot);
    else rot.setAttribute("transform", "rotate(" + phase + ")");
  }
  [[44, 262, .62, 3.6, 10], [104, 256, .58, 4.2, 70], [164, 262, .62, 3.2, 40], [224, 258, .56, 4.6, 90],
   [70, 330, .9, 3.8, 20], [150, 336, .95, 3.1, 60], [232, 330, .88, 4.0, 100]].forEach(function (t) { turbine.apply(null, t); });
  var solar = el("g", {});
  for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
    var px = 300 + c * 58 - r * 6, py = 262 + r * 30;
    var pg = el("g", { transform: "translate(" + px + " " + py + ")" }, solar);
    el("polygon", { points: "0,22 46,22 56,0 10,0", fill: "url(#fsPanel)", stroke: "#bfdbfe", "stroke-width": 1 }, pg);
    el("path", { d: "M5 11 H51 M22 0 L14 22 M38 0 L30 22", stroke: "#93c5fd", "stroke-width": .7, opacity: .8 }, pg);
    el("rect", { x: 25, y: 22, width: 3, height: 7, fill: "#64748b" }, pg);
  }
  var chips = [];
  function chip(x, y, text, color) { chips.push([x, y, text, color]); }
  function drawChip(x, y, text, color) {
    var g = el("g", { transform: "translate(" + x + " " + y + ")" });
    var w = text.length * 6.7 + 26;
    el("rect", { x: -w / 2, y: -13, width: w, height: 26, rx: 13, fill: "#fff", stroke: color || "#cbd5e1" }, g);
    el("text", { x: 0, y: 4.5, "text-anchor": "middle", class: "fs-chip" }, g, text);
  }
  chip(280, 412, "1 · WIND + SOLAR GENERATE POWER", "#86efac");

  // ---------- inverter / substation ----------
  var inv = el("g", { transform: "translate(250 438)" });
  el("rect", { width: 60, height: 40, rx: 6, fill: "#334155" }, inv);
  el("path", { d: "M33 6 l-10 15 h8 l-5 13 l14 -18 h-8 l6 -10z", fill: "#facc15" }, inv);
  el("text", { x: 70, y: 25, class: "fs-small" }, inv, "INVERTER");

  // ---------- 2. battery yard ----------
  var boxes = [];
  for (var br = 0; br < 2; br++) for (var bc = 0; bc < 3; bc++) {
    var bx = 40 + bc * 168, by = 530 + br * 84;
    var bg = el("g", { transform: "translate(" + bx + " " + by + ")" });
    el("rect", { width: 144, height: 66, rx: 6, fill: "url(#fsBox)", stroke: "#94a3b8" }, bg);
    el("rect", { width: 144, height: 10, rx: 4, fill: "#0f766e" }, bg);
    var cells = [];
    for (var k = 0; k < 6; k++) {
      el("rect", { x: 12 + k * 21, y: 18, width: 15, height: 40, rx: 2, fill: "#e2e8f0" }, bg);
      cells.push(el("rect", { x: 12 + k * 21, y: 58, width: 15, height: 0, rx: 2, fill: "#22c55e" }, bg));
    }
    boxes.push(cells);
  }
  var soc = el("text", { x: 280, y: 712, "text-anchor": "middle", class: "fs-soc" }, null, "");
  chip(280, 740, "2 · BATTERIES STORE IT", "#5eead4");

  // ---------- 3. grid and city ----------
  var tw = el("g", { transform: "translate(92 766)", stroke: "#64748b", "stroke-width": 2.4, fill: "none", "stroke-linejoin": "round" });
  el("path", { d: "M0 96 L14 0 L28 96 M4 70 H24 M7 46 H21 M-14 22 H42 M-8 8 H36 M4 70 L21 46 M24 70 L7 46" }, tw);
  var city = el("g", { transform: "translate(360 790)", fill: "#cbd5e1" });
  [[0, 40, 26, 32], [30, 18, 22, 54], [56, 30, 26, 42], [86, 8, 20, 64], [110, 34, 30, 38], [144, 22, 22, 50]].forEach(function (b) {
    el("rect", { x: b[0], y: b[1], width: b[2], height: b[3], rx: 2 }, city);
    for (var wy = b[1] + 6; wy < 66; wy += 10) el("rect", { x: b[0] + 5, y: wy, width: 4, height: 4, fill: "#fde68a", class: "fs-win" }, city);
  });
  el("text", { x: 106, y: 880, "text-anchor": "middle", class: "fs-small" }, null, "GRID");
  el("text", { x: 444, y: 880, "text-anchor": "middle", class: "fs-small" }, null, "HOMES & BUSINESSES");
  chip(280, 896, "3 · SOLD TO THE GRID WHEN PRICES ARE HIGH", "#93c5fd");

  // ---------- energy flows (glowing dots that travel along the wires) ----------
  function flow(id, d, cls, spark, n, dur) {
    el("path", { d: d, fill: "none", stroke: "#cbd5e1", "stroke-width": 3, "stroke-linecap": "round", class: "fs-wire" });
    var g = el("g", { class: "fs-flow " + cls });
    var p = el("path", { id: id, d: d, fill: "none", stroke: spark === "B" ? "#60a5fa" : "#facc15", "stroke-width": 2, "stroke-dasharray": "4 10", class: "fs-dash" }, g);
    if (reduceMotion) return;
    for (var i = 0; i < n; i++) {
      var c = el("circle", { r: 6, fill: spark === "B" ? "url(#fsSparkB)" : "url(#fsSpark)" }, g);
      var m = el("animateMotion", { dur: dur + "s", repeatCount: "indefinite", begin: (-i * dur / n).toFixed(2) + "s" }, c);
      el("mpath", { href: "#" + id }, m);
    }
  }
  flow("fw1", "M150 348 C160 400 220 440 250 452", "always", "Y", 4, 2.2);
  flow("fw2", "M400 384 C380 420 340 440 310 452", "always", "Y", 4, 2.2);
  flow("fw3", "M280 478 C280 500 120 500 112 530", "charge", "Y", 3, 1.6);
  flow("fw4", "M280 478 L280 530", "charge", "Y", 3, 1.2);
  flow("fw5", "M280 478 C280 500 440 500 448 530", "charge", "Y", 3, 1.6);
  flow("fw6", "M112 680 C112 720 106 740 106 766", "sell", "B", 3, 1.6);
  flow("fw7", "M448 680 C448 730 444 760 444 790", "sell", "B", 3, 1.6);

  chips.forEach(function (c) { drawChip.apply(null, c); });   // labels sit on top of the wires

  // ---------- live dashboard (Mosaic-style) ----------
  var dash = el("g", { transform: "translate(20 920)" });
  el("rect", { width: 520, height: 168, rx: 14, fill: "#0f172a" }, dash);
  el("text", { x: 18, y: 26, class: "fs-dtitle" }, dash, "MOSAIC · LIVE DASHBOARD");
  var pill = el("g", { transform: "translate(410 12)" }, dash);
  var pillBg = el("rect", { width: 94, height: 22, rx: 11, fill: "#14532d" }, pill);
  var pillTx = el("text", { x: 47, y: 15, "text-anchor": "middle", class: "fs-pill" }, pill, "CHARGING");
  var tiles = [["WIND", "MW"], ["SOLAR", "MW"], ["BATTERY", "%"], ["PRICE", "$/MWh"]].map(function (t, i) {
    var g = el("g", { transform: "translate(" + (18 + i * 124) + " 40)" }, dash);
    el("rect", { width: 114, height: 46, rx: 8, fill: "#1e293b" }, g);
    el("text", { x: 10, y: 16, class: "fs-tlabel" }, g, t[0]);
    var v = el("text", { x: 10, y: 37, class: "fs-tval" }, g, "0");
    el("text", { x: 104, y: 37, "text-anchor": "end", class: "fs-tunit" }, g, t[1]);
    return v;
  });
  el("text", { x: 18, y: 106, class: "fs-tlabel" }, dash, "MARKET PRICE · CHARGE LOW, SELL HIGH");
  var CH = { x: 18, y: 112, w: 484, h: 46 };
  el("line", { x1: CH.x, y1: CH.y + CH.h / 2, x2: CH.x + CH.w, y2: CH.y + CH.h / 2, stroke: "#334155", "stroke-dasharray": "3 4" }, dash);
  var area = el("path", { fill: "#22c55e", opacity: .12 }, dash);
  var line = el("polyline", { fill: "none", stroke: "#22c55e", "stroke-width": 2.2, "stroke-linejoin": "round" }, dash);
  var dot = el("circle", { r: 3.6, fill: "#22c55e" }, dash);

  // ---------- simulation ----------
  var t0 = performance.now(), hist = [], N = 60, charge = 62, last = 0, visible = true;
  for (var h = 0; h < N; h++) hist.push(price(-(N - h) * 0.25));
  function price(sec) { return 48 + 22 * Math.sin(sec * 2 * Math.PI / 14) + 4 * Math.sin(sec * 1.7); }

  function tick(now) {
    if (!visible) return;
    if (now - last > 250 || reduceMotion) {
      last = now;
      var sec = (now - t0) / 1000;
      var pr = price(sec);
      var charging = pr < 48;
      charge = Math.max(8, Math.min(98, charge + (charging ? 0.9 : -0.9)));
      hist.push(pr); if (hist.length > N) hist.shift();
      svg.classList.toggle("is-charging", charging);
      svg.classList.toggle("is-selling", !charging);
      pillTx.textContent = charging ? "CHARGING" : "SELLING";
      pillBg.setAttribute("fill", charging ? "#14532d" : "#1e3a8a");
      var wind = 138 + 18 * Math.sin(sec * 0.8) + 4 * Math.sin(sec * 3.1);
      var sun = 92 + 10 * Math.sin(sec * 0.35);
      tiles[0].textContent = wind.toFixed(0);
      tiles[1].textContent = sun.toFixed(0);
      tiles[2].textContent = charge.toFixed(0);
      tiles[3].textContent = pr.toFixed(2);
      soc.textContent = (charging ? "Charging · " : "Discharging · ") + charge.toFixed(0) + "% full";
      // battery cells fill with the state of charge (one by one across each container)
      boxes.forEach(function (cells) {
        cells.forEach(function (c, i) {
          var f = Math.max(0, Math.min(1, charge / 100 * 6 - i));
          var hgt = 40 * f;
          c.setAttribute("y", (58 - hgt).toFixed(1)); c.setAttribute("height", hgt.toFixed(1));
          c.setAttribute("fill", charge < 25 ? "#f59e0b" : "#22c55e");
        });
      });
      // price chart
      var lo = 20, hi = 76, pts = hist.map(function (v, i) {
        return [CH.x + CH.w * i / (N - 1), CH.y + CH.h - (v - lo) / (hi - lo) * CH.h];
      });
      line.setAttribute("points", pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "));
      area.setAttribute("d", "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L") + " L" + (CH.x + CH.w) + " " + (CH.y + CH.h) + " L" + CH.x + " " + (CH.y + CH.h) + "Z");
      var lp = pts[pts.length - 1]; dot.setAttribute("cx", lp[0]); dot.setAttribute("cy", lp[1]);
      var col = charging ? "#22c55e" : "#60a5fa";
      line.setAttribute("stroke", col); dot.setAttribute("fill", col); area.setAttribute("fill", col);
    }
    if (!reduceMotion) requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window && !reduceMotion) {
    new IntersectionObserver(function (en) {
      var v = en[0].isIntersecting;
      if (v && !visible) { visible = true; requestAnimationFrame(tick); } else visible = v;
      if (svg.pauseAnimations) v ? svg.unpauseAnimations() : svg.pauseAnimations();
    }).observe(svg);
  }
  requestAnimationFrame(tick);
})();

/* Projects: the Aviva scene. A family gets life cover from a phone; policies and claims run on an AWS
   platform (Kubernetes pods); every release ships through the CI/CD pipeline; a health dashboard shows
   uptime, deployments, Opsgenie alerts and the security audit. Numbers are illustrative. */
(function () {
  "use strict";
  var svg = document.getElementById("avScene");
  if (!svg) return;
  var NS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(tag, attrs, parent, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    (parent || svg).appendChild(n);
    return n;
  }
  el("defs").innerHTML =
    '<linearGradient id="avSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset=".45" stop-color="#fef3c7"/><stop offset="1" stop-color="#f8fafc"/></linearGradient>' +
    '<linearGradient id="avShield" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient>' +
    '<linearGradient id="avCloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e0ecff"/></linearGradient>' +
    '<radialGradient id="avGlow"><stop offset="0" stop-color="#fffbe6"/><stop offset=".4" stop-color="#facc15"/><stop offset="1" stop-color="#facc15" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="avGlowB"><stop offset="0" stop-color="#eff6ff"/><stop offset=".4" stop-color="#60a5fa"/><stop offset="1" stop-color="#60a5fa" stop-opacity="0"/></radialGradient>';

  // ---------- 1. family protected by life cover ----------
  el("rect", { width: 560, height: 1100, fill: "#f8fafc" });
  el("rect", { width: 560, height: 470, fill: "url(#avSky)" });
  el("circle", { cx: 90, cy: 80, r: 30, fill: "#fbbf24", opacity: .9 });
  el("path", { d: "M0 380 C120 356 260 376 380 366 C460 360 520 372 560 368 V470 H0Z", fill: "#bbf7d0" });
  // house
  var house = el("g", { transform: "translate(70 250)" });
  el("rect", { x: 0, y: 50, width: 150, height: 92, fill: "#fff", stroke: "#cbd5e1" }, house);
  el("polygon", { points: "-12,54 75,-6 162,54", fill: "#b45309" }, house);
  el("rect", { x: 60, y: 92, width: 30, height: 50, rx: 3, fill: "#92400e" }, house);
  el("rect", { x: 16, y: 72, width: 30, height: 26, rx: 2, fill: "#bfdbfe", stroke: "#94a3b8" }, house);
  el("rect", { x: 104, y: 72, width: 30, height: 26, rx: 2, fill: "#bfdbfe", stroke: "#94a3b8" }, house);
  // family figures
  function person(x, y, s, shirt) {
    var g = el("g", { transform: "translate(" + x + " " + y + ") scale(" + s + ")" });
    el("circle", { cx: 0, cy: -46, r: 9, fill: "#c68a5c" }, g);
    el("path", { d: "M-12 -34 h24 a4 4 0 0 1 4 4 v22 h-32 v-22 a4 4 0 0 1 4 -4z", fill: shirt }, g);
    el("rect", { x: -9, y: -8, width: 7, height: 22, rx: 3, fill: "#334155" }, g);
    el("rect", { x: 2, y: -8, width: 7, height: 22, rx: 3, fill: "#334155" }, g);
  }
  person(262, 386, 1.15, "#2563eb"); person(296, 386, 1.08, "#db2777"); person(323, 389, .72, "#16a34a"); person(342, 390, .62, "#f59e0b");
  // protective shield over the family
  var sh = el("g", { class: "av-shield", transform: "translate(302 210)" });
  el("path", { d: "M-150 70 C-150 -10 -80 -66 0 -66 C80 -66 150 -10 150 70", fill: "none", stroke: "#2563eb", "stroke-width": 3, "stroke-dasharray": "2 9", "stroke-linecap": "round", opacity: .8, class: "av-arc" }, sh);
  el("path", { d: "M0 -54 L36 -40 V-8 C36 16 18 30 0 38 C-18 30 -36 16 -36 -8 V-40Z", fill: "url(#avShield)" }, sh);
  el("path", { d: "M0 -14 c-4 -8 -18 -8 -18 4 c0 9 12 16 18 22 c6 -6 18 -13 18 -22 c0 -12 -14 -12 -18 -4z", fill: "#fff" }, sh);
  // phone: policy issued
  var ph = el("g", { transform: "translate(430 210)" });
  el("rect", { width: 92, height: 168, rx: 14, fill: "#0f172a" }, ph);
  el("rect", { x: 6, y: 14, width: 80, height: 140, rx: 8, fill: "#fff" }, ph);
  el("text", { x: 46, y: 36, "text-anchor": "middle", class: "av-ph" }, ph, "LIFE COVER");
  el("rect", { x: 14, y: 46, width: 64, height: 6, rx: 3, fill: "#e2e8f0" }, ph);
  el("rect", { x: 14, y: 58, width: 46, height: 6, rx: 3, fill: "#e2e8f0" }, ph);
  var phStatus = el("text", { x: 46, y: 92, "text-anchor": "middle", class: "av-phs" }, ph, "Buying…");
  var phBtn = el("rect", { x: 14, y: 112, width: 64, height: 26, rx: 13, fill: "#2563eb" }, ph);
  var phBtnTx = el("text", { x: 46, y: 129, "text-anchor": "middle", class: "av-phb" }, ph, "PAY");
  var chips = [];
  function chip(x, y, text, color) { chips.push([x, y, text, color]); }
  chip(280, 444, "1 · A FAMILY BUYS LIFE COVER ONLINE", "#fcd34d");

  // ---------- 2. AWS platform ----------
  var cl = el("g", { transform: "translate(280 590)" });
  el("path", { d: "M-210 60 a40 40 0 0 1 10 -78 a60 60 0 0 1 108 -40 a70 70 0 0 1 128 10 a52 52 0 0 1 74 50 a40 40 0 0 1 -12 58z", fill: "url(#avCloud)", stroke: "#93c5fd", "stroke-width": 2 }, cl);
  el("text", { x: -180, y: -44, class: "av-small" }, cl, "AWS");
  var pods = [], svcs = ["policy", "payments", "claims", "customer", "docs", "notify"];
  svcs.forEach(function (n, i) {
    var x = -150 + (i % 3) * 110, y = -36 + Math.floor(i / 3) * 52;
    var g = el("g", { transform: "translate(" + x + " " + y + ")" }, cl);
    el("rect", { width: 92, height: 38, rx: 8, fill: "#fff", stroke: "#bfdbfe" }, g);
    el("polygon", { points: "18,8 26,12 26,22 18,26 10,22 10,12", fill: "#326ce5" }, g);
    var led = el("circle", { cx: 82, cy: 10, r: 3.5, fill: "#22c55e" }, g);
    el("text", { x: 34, y: 23, class: "av-pod" }, g, n);
    pods.push({ g: g, led: led });
  });
  chip(280, 724, "2 · POLICIES & CLAIMS RUN ON AWS + KUBERNETES", "#93c5fd");

  // ---------- 3. CI/CD pipeline ----------
  var stages = ["CODE", "JENKINS", "DOCKER", "K8S", "AWS"], stX = [], pipeY = 800;
  el("line", { x1: 60, y1: pipeY, x2: 500, y2: pipeY, stroke: "#cbd5e1", "stroke-width": 4, "stroke-linecap": "round" });
  var pipeFill = el("line", { x1: 60, y1: pipeY, x2: 60, y2: pipeY, stroke: "#22c55e", "stroke-width": 4, "stroke-linecap": "round" });
  var stEls = stages.map(function (n, i) {
    var x = 60 + i * 110; stX.push(x);
    var g = el("g", { transform: "translate(" + x + " " + pipeY + ")" });
    var c = el("circle", { r: 15, fill: "#fff", stroke: "#94a3b8", "stroke-width": 3 }, g);
    el("text", { y: 34, "text-anchor": "middle", class: "av-small" }, g, n);
    return c;
  });
  var pkt = el("circle", { cx: 60, cy: pipeY, r: 8, fill: "url(#avGlow)" });
  var buildTx = el("text", { x: 280, y: 860, "text-anchor": "middle", class: "av-build" }, null, "");
  chip(280, 890, "3 · EVERY RELEASE SHIPS THROUGH JENKINS CI/CD", "#86efac");

  // ---------- flows: phone → platform → shield ----------
  function flow(id, d, blue, n, dur) {
    el("path", { d: d, fill: "none", stroke: "#cbd5e1", "stroke-width": 3, "stroke-linecap": "round" });
    var g = el("g", {});
    el("path", { id: id, d: d, fill: "none", stroke: blue ? "#60a5fa" : "#facc15", "stroke-width": 2, "stroke-dasharray": "4 10", class: "fs-dash" }, g);
    if (reduceMotion) return;
    for (var i = 0; i < n; i++) {
      var c = el("circle", { r: 6, fill: blue ? "url(#avGlowB)" : "url(#avGlow)" }, g);
      var m = el("animateMotion", { dur: dur + "s", repeatCount: "indefinite", begin: (-i * dur / n).toFixed(2) + "s" }, c);
      el("mpath", { href: "#" + id }, m);
    }
  }
  flow("avf1", "M476 378 C476 470 420 500 380 540", true, 3, 1.8);     // policy request to the platform
  flow("avf2", "M180 540 C140 480 200 300 262 260", false, 3, 2.2);    // cover confirmed back to the family
  flow("avf3", "M500 800 C540 760 520 690 486 640", false, 2, 1.6);    // release deployed to AWS
  chips.forEach(function (c) {
    var g = el("g", { transform: "translate(" + c[0] + " " + c[1] + ")" });
    var w = c[2].length * 6.7 + 26;
    el("rect", { x: -w / 2, y: -13, width: w, height: 26, rx: 13, fill: "#fff", stroke: c[3] }, g);
    el("text", { x: 0, y: 4.5, "text-anchor": "middle", class: "fs-chip" }, g, c[2]);
  });

  // ---------- platform health dashboard ----------
  var dash = el("g", { transform: "translate(20 920)" });
  el("rect", { width: 520, height: 168, rx: 14, fill: "#0f172a" }, dash);
  el("text", { x: 18, y: 26, class: "fs-dtitle" }, dash, "PLATFORM HEALTH · PRODUCTION");
  var pill = el("g", { transform: "translate(410 12)" }, dash);
  var pillBg = el("rect", { width: 94, height: 22, rx: 11, fill: "#14532d" }, pill);
  var pillTx = el("text", { x: 47, y: 15, "text-anchor": "middle", class: "fs-pill" }, pill, "HEALTHY");
  var tiles = [["UPTIME", "%"], ["DEPLOYS", "/ month"], ["OPSGENIE", ""], ["SECURITY", "audit"]].map(function (t, i) {
    var g = el("g", { transform: "translate(" + (18 + i * 124) + " 40)" }, dash);
    el("rect", { width: 114, height: 46, rx: 8, fill: "#1e293b" }, g);
    el("text", { x: 10, y: 16, class: "fs-tlabel" }, g, t[0]);
    var v = el("text", { x: 10, y: 37, class: "fs-tval" }, g, "");
    el("text", { x: 104, y: 37, "text-anchor": "end", class: "fs-tunit" }, g, t[1]);
    return v;
  });
  el("text", { x: 18, y: 106, class: "fs-tlabel" }, dash, "ACTIVITY");
  var logs = [0, 1].map(function (i) { return el("text", { x: 18, y: 128 + i * 22, class: "av-log" }, dash, ""); });

  // ---------- simulation (illustrative numbers) ----------
  var EVENTS = [
    ["deploy", "Deploy #%n · policy-service · Jenkins → EKS ✓"],
    ["alert", "Opsgenie P3 · claims-service latency · acknowledged"],
    ["resolve", "Opsgenie P3 · resolved in 6 min"],
    ["deploy", "Deploy #%n · payments-service · rolled out 3/3 pods ✓"],
    ["audit", "Security audit · IAM & S3 checks passed ✓"],
    ["deploy", "Deploy #%n · customer-portal · Terraform plan applied ✓"]
  ];
  var deployN = 140, monthDeploys = 37, alerts = 0, ev = 0, stage = -1, buildRunning = false, log = ["", ""], visible = true;
  var policies = 0;
  function runBuild(name) {
    buildRunning = true; stage = 0;
    stEls.forEach(function (c) { c.setAttribute("fill", "#fff"); c.setAttribute("stroke", "#94a3b8"); });
    buildTx.textContent = "Building " + name + "…";
    (function next() {
      if (!visible) { setTimeout(next, 400); return; }
      var x = stX[stage];
      stEls[stage].setAttribute("fill", "#22c55e"); stEls[stage].setAttribute("stroke", "#15803d");
      pkt.setAttribute("cx", x); pipeFill.setAttribute("x2", x);
      if (stage < stages.length - 1) { stage++; setTimeout(next, reduceMotion ? 0 : 650); }
      else { buildTx.textContent = name + " deployed to production ✓"; buildRunning = false; }
    })();
  }
  function step() {
    var e = EVENTS[ev % EVENTS.length]; ev++;
    var text = e[1].replace("%n", deployN);
    if (e[0] === "deploy") { deployN++; monthDeploys++; runBuild(text.split(" · ")[1]); }
    if (e[0] === "alert") { alerts = 1; pods[2].led.setAttribute("fill", "#f59e0b"); }
    if (e[0] === "resolve") { alerts = 0; pods[2].led.setAttribute("fill", "#22c55e"); }
    log = [text, log[0]];
    logs[0].textContent = log[0]; logs[1].textContent = log[1];
    tiles[0].textContent = "99.9";
    tiles[1].textContent = monthDeploys;
    tiles[2].textContent = alerts ? "1 alert" : "0 alerts";
    tiles[2].setAttribute("fill", alerts ? "#fbbf24" : "#fff");
    tiles[3].textContent = "Passed";
    pillTx.textContent = alerts ? "ALERT" : "HEALTHY";
    pillBg.setAttribute("fill", alerts ? "#78350f" : "#14532d");
    // the phone: a new policy is bought, then issued
    policies++;
    phStatus.textContent = "Policy #" + (24800 + policies) + " issued ✓";
    phBtn.setAttribute("fill", "#16a34a"); phBtnTx.textContent = "COVERED";
    setTimeout(function () { phStatus.textContent = "Buying…"; phBtn.setAttribute("fill", "#2563eb"); phBtnTx.textContent = "PAY"; }, 2200);
  }
  step();
  if (!reduceMotion) setInterval(function () { if (visible) step(); }, 4200);
  if ("IntersectionObserver" in window && !reduceMotion) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (svg.pauseAnimations) visible ? svg.unpauseAnimations() : svg.pauseAnimations();
    }).observe(svg);
  }
})();
