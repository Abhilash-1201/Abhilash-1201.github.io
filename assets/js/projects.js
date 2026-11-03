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
    phStatus.textContent = "#" + (24800 + policies) + " issued ✓";
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

/* Projects: the Khushi Baby scene. A community health worker records care for a mother and baby;
   the data syncs to the CHIP platform running across three state datacenters and AWS; Abhilash's
   assessment scans every layer; a dashboard shows the seven areas reviewed and the live activity. */
(function () {
  "use strict";
  var svg = document.getElementById("kbScene");
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
    '<linearGradient id="kbSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fecdd3"/><stop offset=".5" stop-color="#ffe4e6"/><stop offset="1" stop-color="#fff7ed"/></linearGradient>' +
    '<linearGradient id="kbRack" x1="0" x2="1"><stop offset="0" stop-color="#334155"/><stop offset="1" stop-color="#1e293b"/></linearGradient>' +
    '<linearGradient id="kbCloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff1e6"/></linearGradient>' +
    '<radialGradient id="kbGlow"><stop offset="0" stop-color="#fff1f2"/><stop offset=".4" stop-color="#f43f5e"/><stop offset="1" stop-color="#f43f5e" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="kbLens"><stop offset="0" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#bfdbfe" stop-opacity=".45"/></radialGradient>';

  el("rect", { width: 560, height: 1100, fill: "#f8fafc" });
  // ---------- 1. village: health worker + mother and baby ----------
  el("rect", { width: 560, height: 470, fill: "url(#kbSky)" });
  el("circle", { cx: 460, cy: 76, r: 30, fill: "#fb923c", opacity: .85 });
  el("path", { d: "M0 330 C120 300 250 322 360 312 C450 304 510 318 560 314 V470 H0Z", fill: "#fde68a" });
  el("path", { d: "M0 372 C160 356 330 378 560 366 V470 H0Z", fill: "#fcd34d", opacity: .6 });
  function hut(x, y, s) {
    var g = el("g", { transform: "translate(" + x + " " + y + ") scale(" + s + ")" });
    el("rect", { x: 0, y: 30, width: 90, height: 56, fill: "#fff7ed", stroke: "#d6a77a" }, g);
    el("polygon", { points: "-10,34 45,-8 100,34", fill: "#b45309" }, g);
    el("rect", { x: 36, y: 50, width: 18, height: 36, rx: 2, fill: "#92400e" }, g);
    el("rect", { x: 10, y: 46, width: 16, height: 14, fill: "#fde68a", stroke: "#d6a77a" }, g);
  }
  hut(40, 248, 1.1); hut(400, 262, .9);
  el("circle", { cx: 200, cy: 316, r: 26, fill: "#16a34a" }); el("rect", { x: 197, y: 330, width: 6, height: 24, fill: "#78350f" });
  function person(x, y, s, sari, head) {
    var g = el("g", { transform: "translate(" + x + " " + y + ") scale(" + s + ")" });
    el("circle", { cx: 0, cy: -58, r: 10, fill: "#a16207" }, g);
    if (head) el("path", { d: "M-11 -60 a11 11 0 0 1 22 0 v10 h-4 v-8 h-14 v8 h-4z", fill: sari }, g);
    el("path", { d: "M-14 -46 h28 l8 50 h-44z", fill: sari }, g);
    el("rect", { x: -8, y: 4, width: 6, height: 14, rx: 3, fill: "#78350f" }, g);
    el("rect", { x: 2, y: 4, width: 6, height: 14, rx: 3, fill: "#78350f" }, g);
    return g;
  }
  // health worker holding a phone
  var asha = person(262, 386, 1.2, "#db2777", true);
  el("rect", { x: 14, y: -38, width: 12, height: 20, rx: 2, fill: "#0f172a" }, asha);
  var screen = el("rect", { x: 15.5, y: -36, width: 9, height: 15, rx: 1, fill: "#22c55e" }, asha);
  // mother with baby
  var mom = person(338, 388, 1.15, "#7c3aed", true);
  el("ellipse", { cx: -10, cy: -32, rx: 10, ry: 7, fill: "#fde68a" }, mom);
  el("circle", { cx: -16, cy: -34, r: 5, fill: "#a16207" }, mom);
  // record card that pops above the phone
  var card = el("g", { transform: "translate(212 196)", class: "kb-card" });
  el("rect", { width: 150, height: 74, rx: 10, fill: "#fff", stroke: "#fda4af" }, card);
  el("text", { x: 12, y: 20, class: "kb-ct" }, card, "CHIP · HEALTH RECORD");
  var cardL = [el("text", { x: 12, y: 40, class: "kb-cl" }, card, ""), el("text", { x: 12, y: 58, class: "kb-cl" }, card, "")];
  var chips = [];
  function chip(x, y, text, color) { chips.push([x, y, text, color]); }
  chip(280, 444, "1 · HEALTH WORKERS RECORD CARE IN THE FIELD", "#fda4af");

  // ---------- 2. three state datacenters + AWS, running Kubernetes ----------
  var dcs = [["KARNATAKA", 40], ["MAHARASHTRA", 196], ["RAJASTHAN", 352]], racks = [];
  dcs.forEach(function (d) {
    var g = el("g", { transform: "translate(" + d[1] + " 520)" });
    el("rect", { width: 168, height: 112, rx: 10, fill: "#fff", stroke: "#e2e8f0" }, g);
    for (var r = 0; r < 3; r++) {
      var rk = el("g", { transform: "translate(" + (14 + r * 50) + " 14)" }, g);
      el("rect", { width: 40, height: 70, rx: 4, fill: "url(#kbRack)" }, rk);
      for (var u = 0; u < 5; u++) {
        el("rect", { x: 5, y: 7 + u * 12, width: 22, height: 3, rx: 1.5, fill: "#475569" }, rk);
        racks.push(el("circle", { cx: 33, cy: 8.5 + u * 12, r: 2, fill: "#22c55e", class: "led " + ["a", "b", "c"][(u + r) % 3] }, rk));
      }
    }
    el("text", { x: 84, y: 102, "text-anchor": "middle", class: "kb-small" }, g, d[0]);
  });
  // AWS cloud + Kubernetes components
  var cl = el("g", { transform: "translate(280 690)" });
  el("path", { d: "M-226 34 a26 26 0 0 1 8 -50 a40 40 0 0 1 74 -22 h300 a40 40 0 0 1 74 22 a26 26 0 0 1 8 50z", fill: "url(#kbCloud)", stroke: "#fdba74", "stroke-width": 2 }, cl);
  el("text", { x: -206, y: -14, class: "kb-small" }, cl, "AWS · KUBERNETES");
  ["NGINX", "HAProxy", "Redis", "RabbitMQ", "OpenEBS"].forEach(function (n, i) {
    var g = el("g", { transform: "translate(" + (-206 + i * 84) + " -4)" }, cl);
    el("rect", { width: 76, height: 28, rx: 7, fill: "#fff", stroke: "#fed7aa" }, g);
    el("polygon", { points: "13,6 20,10 20,18 13,22 6,18 6,10", fill: "#326ce5" }, g);
    el("text", { x: 26, y: 18.5, class: "kb-pod" }, g, n);
  });
  // magnifying glass that scans every layer
  var lens = el("g", { class: "kb-scan" });
  el("circle", { r: 30, fill: "url(#kbLens)", stroke: "#1e293b", "stroke-width": 5 }, lens);
  el("line", { x1: 21, y1: 21, x2: 44, y2: 44, stroke: "#1e293b", "stroke-width": 8, "stroke-linecap": "round" }, lens);
  chip(280, 752, "2 · CHIP RUNS ACROSS 3 STATE DATACENTERS + AWS", "#fdba74");

  // ---------- 3. the assessment: seven areas ----------
  var AREAS = ["Infrastructure", "Kubernetes", "CI/CD", "Monitoring", "Security", "Backup & DR", "Docs"];
  var ticks = AREAS.map(function (a, i) {
    var col = i % 4, row = Math.floor(i / 4);
    var g = el("g", { transform: "translate(" + (28 + col * 128 + (row ? 64 : 0)) + " " + (786 + row * 40) + ")" });
    var box = el("rect", { width: 120, height: 30, rx: 15, fill: "#fff", stroke: "#cbd5e1" }, g);
    var dot = el("circle", { cx: 15, cy: 15, r: 7, fill: "#e2e8f0" }, g);
    var chk = el("path", { d: "M11.5 15 l2.5 2.5 l5 -5", fill: "none", stroke: "#fff", "stroke-width": 2, "stroke-linecap": "round", opacity: 0 }, g);
    el("text", { x: 28, y: 19.5, class: "kb-area" }, g, a);
    return { box: box, dot: dot, chk: chk };
  });
  chip(280, 890, "3 · I ASSESSED EVERY LAYER AND BUILT THE ROADMAP", "#86efac");

  // ---------- flows: field → datacenters → cloud ----------
  function flow(id, d, n, dur) {
    el("path", { d: d, fill: "none", stroke: "#e2e8f0", "stroke-width": 3, "stroke-linecap": "round" });
    var g = el("g", {});
    el("path", { id: id, d: d, fill: "none", stroke: "#fb7185", "stroke-width": 2, "stroke-dasharray": "4 10", class: "fs-dash" }, g);
    if (reduceMotion) return;
    for (var i = 0; i < n; i++) {
      var c = el("circle", { r: 6, fill: "url(#kbGlow)" }, g);
      var m = el("animateMotion", { dur: dur + "s", repeatCount: "indefinite", begin: (-i * dur / n).toFixed(2) + "s" }, c);
      el("mpath", { href: "#" + id }, m);
    }
  }
  flow("kbf1", "M286 344 C286 420 124 440 124 520", 3, 2.4);
  flow("kbf2", "M286 344 C286 430 280 470 280 520", 3, 2.0);
  flow("kbf3", "M286 344 C286 420 436 440 436 520", 3, 2.4);
  chips.forEach(function (c) {
    var g = el("g", { transform: "translate(" + c[0] + " " + c[1] + ")" });
    var w = c[2].length * 6.7 + 26;
    el("rect", { x: -w / 2, y: -13, width: w, height: 26, rx: 13, fill: "#fff", stroke: c[3] }, g);
    el("text", { x: 0, y: 4.5, "text-anchor": "middle", class: "fs-chip" }, g, c[2]);
  });
  svg.appendChild(lens);   // the lens moves over everything

  // ---------- dashboard ----------
  var dash = el("g", { transform: "translate(20 920)" });
  el("rect", { width: 520, height: 168, rx: 14, fill: "#0f172a" }, dash);
  el("text", { x: 18, y: 26, class: "fs-dtitle" }, dash, "DEVOPS MATURITY ASSESSMENT");
  var pill = el("g", { transform: "translate(400 12)" }, dash);
  var pillBg = el("rect", { width: 104, height: 22, rx: 11, fill: "#7c2d12" }, pill);
  var pillTx = el("text", { x: 52, y: 15, "text-anchor": "middle", class: "fs-pill" }, pill, "ASSESSING");
  [["DATACENTERS", "3", "states"], ["ENVIRONMENTS", "3", "dev·uat·prod"], ["AREAS", "0/7", "reviewed"], ["DELIVERABLE", "—", ""]].forEach(function (t, i) {
    var g = el("g", { transform: "translate(" + (18 + i * 124) + " 40)" }, dash);
    el("rect", { width: 114, height: 46, rx: 8, fill: "#1e293b" }, g);
    el("text", { x: 10, y: 16, class: "fs-tlabel" }, g, t[0]);
    var v = el("text", { x: 10, y: 37, class: "fs-tval" }, g, t[1]);
    el("text", { x: 104, y: 37, "text-anchor": "end", class: "fs-tunit" }, g, t[2]);
    if (i === 2) areasTx = v; if (i === 3) delivTx = v;
  });
  var areasTx, delivTx;
  el("text", { x: 18, y: 106, class: "fs-tlabel" }, dash, "NOW REVIEWING");
  var logs = [0, 1].map(function (i) { return el("text", { x: 18, y: 128 + i * 22, class: "av-log" }, dash, ""); });

  // ---------- the assessment loop ----------
  var TASKS = [
    [0, "Infrastructure · VMs, storage & networking in KA, MH, RJ", [124, 576]],
    [1, "Kubernetes · control plane, nodes, namespaces, pod health", [280, 690]],
    [2, "CI/CD · branch protection, PR flow, GitHub Actions", [124, 576]],
    [3, "Monitoring · New Relic, Prometheus, CloudWatch alerts", [436, 576]],
    [4, "Security · secrets, access controls, vulnerability scans", [280, 576]],
    [5, "Backup & DR · DB backups, restore tests, DR runbooks", [436, 576]],
    [6, "Report · findings + roadmap for automation & security", [280, 690]]
  ];
  var RECORDS = [["Mother: Sunita · 7 months", "Visit 4 · Hb checked ✓"], ["Baby: Aarav · 9 weeks", "Vaccine: Penta-2 given ✓"], ["Mother: Kavita · 5 months", "BP recorded · referral ✓"]];
  var ti = 0, ri = 0, visible = true, lx = 280, ly = 640;
  function moveLens(x, y) {
    if (reduceMotion) { lens.setAttribute("transform", "translate(" + x + " " + y + ")"); return; }
    var fx = lx, fy = ly, t0 = performance.now();
    (function st(now) {
      var t = Math.min(1, (now - t0) / 900), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      lx = fx + (x - fx) * e; ly = fy + (y - fy) * e;
      lens.setAttribute("transform", "translate(" + lx.toFixed(1) + " " + ly.toFixed(1) + ")");
      if (t < 1) requestAnimationFrame(st);
    })(t0);
  }
  function step() {
    // a new record captured in the field
    var r = RECORDS[ri++ % RECORDS.length];
    cardL[0].textContent = r[0]; cardL[1].textContent = r[1];
    card.classList.remove("pop"); void card.getBBox(); card.classList.add("pop");
    // the next area of the assessment
    var t = TASKS[ti % TASKS.length];
    if (ti % TASKS.length === 0) ticks.forEach(function (k) { k.dot.setAttribute("fill", "#e2e8f0"); k.chk.setAttribute("opacity", 0); k.box.setAttribute("stroke", "#cbd5e1"); });
    var k = ticks[t[0]];
    k.dot.setAttribute("fill", "#16a34a"); k.chk.setAttribute("opacity", 1); k.box.setAttribute("stroke", "#86efac");
    moveLens(t[2][0], t[2][1]);
    var done = t[0] + 1;
    areasTx.textContent = done + "/7";
    var ready = done === 7;
    delivTx.textContent = ready ? "Report" : "—";
    pillTx.textContent = ready ? "REPORT READY" : "ASSESSING";
    pillBg.setAttribute("fill", ready ? "#14532d" : "#7c2d12");
    logs[1].textContent = logs[0].textContent;
    logs[0].textContent = t[1];
    ti++;
  }
  step();
  if (!reduceMotion) setInterval(function () { if (visible) step(); }, 2600);
  if ("IntersectionObserver" in window && !reduceMotion) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (svg.pauseAnimations) visible ? svg.unpauseAnimations() : svg.pauseAnimations();
    }).observe(svg);
  }
})();

/* Projects: the Sensei scene. A Terraform change is pushed; GitLab CI runs init → validate → plan → apply;
   the runner signs in to AWS through OIDC (no stored keys) and assumes the Plan or Apply role through STS;
   Terraform then builds the VPC, subnets, gateways, ECS and ECR, with state in S3 and encryption via KMS. */
(function () {
  "use strict";
  var svg = document.getElementById("ssScene");
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
    '<linearGradient id="ssSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7d2fe"/><stop offset="1" stop-color="#eef2ff"/></linearGradient>' +
    '<radialGradient id="ssGlow"><stop offset="0" stop-color="#f5f3ff"/><stop offset=".4" stop-color="#8b5cf6"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></radialGradient>';
  el("rect", { width: 560, height: 1100, fill: "#f8fafc" });
  el("rect", { width: 560, height: 470, fill: "url(#ssSky)" });

  var chips = [];
  function chip(x, y, text, color) { chips.push([x, y, text, color]); }

  // ---------- 1. laptop with Terraform + GitLab pipeline ----------
  var lap = el("g", { transform: "translate(30 150)" });
  el("rect", { width: 220, height: 140, rx: 10, fill: "#0f172a" }, lap);
  el("rect", { x: 8, y: 8, width: 204, height: 124, rx: 6, fill: "#111827" }, lap);
  [["module ", "#c084fc", "\"vpc\" {"], ["  cidr = ", "#94a3b8", "\"10.0.0.0/16\""], ["  azs  = ", "#94a3b8", "2"], ["}", "#e2e8f0", ""], ["backend ", "#c084fc", "\"s3\" {"], ["  encrypt = ", "#94a3b8", "true"]].forEach(function (l, i) {
    var t = el("text", { x: 18, y: 30 + i * 17, class: "ss-code" }, lap);
    el("tspan", { fill: l[1] }, t, l[0]); el("tspan", { fill: "#86efac" }, t, l[2]);
  });
  el("path", { d: "M-14 140 h248 l-12 14 h-224z", fill: "#cbd5e1" }, lap);
  var commit = el("g", { transform: "translate(30 112)", class: "ss-commit" });
  el("rect", { width: 150, height: 26, rx: 13, fill: "#fff", stroke: "#a5b4fc" }, commit);
  el("text", { x: 75, y: 17.5, "text-anchor": "middle", class: "ss-small" }, commit, "git push · main");

  var pipe = el("g", { transform: "translate(300 110)" });
  el("rect", { width: 236, height: 214, rx: 12, fill: "#fff", stroke: "#c7d2fe" }, pipe);
  el("text", { x: 16, y: 26, class: "ss-title" }, pipe, "GITLAB CI/CD · main");
  var STAGES = ["terraform init", "terraform validate", "terraform plan", "terraform apply"];
  var stDots = STAGES.map(function (s, i) {
    var g = el("g", { transform: "translate(16 " + (48 + i * 40) + ")" }, pipe);
    el("rect", { width: 204, height: 30, rx: 8, fill: "#f8fafc", stroke: "#e2e8f0" }, g);
    var d = el("circle", { cx: 16, cy: 15, r: 7, fill: "#e2e8f0" }, g);
    el("text", { x: 32, y: 19.5, class: "ss-stage" }, g, s);
    var tag = el("text", { x: 194, y: 19.5, "text-anchor": "end", class: "ss-tag" }, g, "");
    return { d: d, tag: tag };
  });
  chip(280, 440, "1 · GITLAB CI RUNS TERRAFORM ON EVERY CHANGE", "#a5b4fc");

  // ---------- 2. OIDC: no stored keys ----------
  var NODES = [["GitLab runner", "OIDC token", 76], ["IAM OIDC", "provider", 212], ["AWS STS", "AssumeRole", 348], ["Temp creds", "expire in 1h", 484]];
  var nodeEls = NODES.map(function (n) {
    var g = el("g", { transform: "translate(" + n[2] + " 508)" });
    var b = el("rect", { x: -58, y: -24, width: 116, height: 48, rx: 10, fill: "#fff", stroke: "#cbd5e1" }, g);
    el("text", { y: -3, "text-anchor": "middle", class: "ss-node" }, g, n[0]);
    el("text", { y: 13, "text-anchor": "middle", class: "ss-sub" }, g, n[1]);
    return b;
  });
  var token = el("circle", { cx: 76, cy: 508, r: 8, fill: "url(#ssGlow)" });
  var ROLES = ["Bootstrap", "Plan", "Apply"];
  el("text", { x: 280, y: 566, "text-anchor": "middle", class: "ss-sub" }, null, "SEPARATE LEAST-PRIVILEGE IAM ROLES");
  var roleEls = ROLES.map(function (r, i) {
    var g = el("g", { transform: "translate(" + (130 + i * 150) + " 592)" });
    var b = el("rect", { x: -56, y: -15, width: 112, height: 30, rx: 15, fill: "#fff", stroke: "#cbd5e1" }, g);
    var t = el("text", { y: 5, "text-anchor": "middle", class: "ss-role" }, g, "role/" + r.toLowerCase());
    return { b: b, t: t };
  });
  // remote state + no stored keys
  var st = el("g", { transform: "translate(40 628)" });
  el("rect", { width: 228, height: 54, rx: 10, fill: "#fff", stroke: "#cbd5e1" }, st);
  el("path", { d: "M20 16 h22 l-3 26 h-16z", fill: "#16a34a" }, st);
  el("ellipse", { cx: 31, cy: 16, rx: 11, ry: 4, fill: "#22c55e" }, st);
  el("text", { x: 54, y: 24, class: "ss-node" }, st, "S3 remote state");
  var lockTx = el("text", { x: 54, y: 41, class: "ss-sub" }, st, "state lock · free");
  var nk = el("g", { transform: "translate(292 628)" });
  el("rect", { width: 228, height: 54, rx: 10, fill: "#fff", stroke: "#fecaca" }, nk);
  el("circle", { cx: 30, cy: 27, r: 9, fill: "none", stroke: "#94a3b8", "stroke-width": 3 }, nk);
  el("path", { d: "M38 27 h16 v6 M48 27 v5", fill: "none", stroke: "#94a3b8", "stroke-width": 3 }, nk);
  el("line", { x1: 14, y1: 42, x2: 60, y2: 12, stroke: "#ef4444", "stroke-width": 3, "stroke-linecap": "round" }, nk);
  el("text", { x: 72, y: 24, class: "ss-node" }, nk, "Long-lived keys");
  el("text", { x: 72, y: 41, class: "ss-sub red" }, nk, "none stored in CI");
  chip(280, 712, "2 · OIDC GIVES THE PIPELINE SHORT-LIVED CREDENTIALS", "#c4b5fd");

  // ---------- 3. the AWS infrastructure Terraform builds ----------
  var vpc = el("g", { transform: "translate(24 734)" });
  el("rect", { width: 512, height: 150, rx: 12, fill: "#fff", stroke: "#8b5cf6", "stroke-dasharray": "6 5" }, vpc);
  el("text", { x: 14, y: 20, class: "ss-title" }, vpc, "VPC · 10.0.0.0/16");
  var RES = [];
  function res(node) { node.setAttribute("class", (node.getAttribute("class") || "") + " ss-res"); RES.push(node); return node; }
  var pub = res(el("g", { transform: "translate(14 30)" }, vpc));
  el("rect", { width: 196, height: 108, rx: 8, fill: "#ecfdf5", stroke: "#86efac" }, pub);
  el("text", { x: 10, y: 17, class: "ss-sub green" }, pub, "PUBLIC SUBNETS");
  function box(parent, x, y, w, label, color) {
    var g = res(el("g", { transform: "translate(" + x + " " + y + ")" }, parent));
    el("rect", { width: w, height: 30, rx: 6, fill: "#fff", stroke: color }, g);
    el("text", { x: w / 2, y: 19.5, "text-anchor": "middle", class: "ss-res-t" }, g, label);
    return g;
  }
  box(pub, 10, 28, 84, "Internet GW", "#86efac"); box(pub, 102, 28, 84, "NAT GW", "#86efac");
  box(pub, 10, 66, 176, "Route tables · Security groups", "#86efac");
  var prv = res(el("g", { transform: "translate(222 30)" }, vpc));
  el("rect", { width: 276, height: 108, rx: 8, fill: "#eff6ff", stroke: "#93c5fd" }, prv);
  el("text", { x: 10, y: 17, class: "ss-sub blue" }, prv, "PRIVATE SUBNETS · ECS");
  [0, 1, 2].forEach(function (i) { box(prv, 10 + i * 64, 28, 56, "task " + (i + 1), "#93c5fd"); });
  box(prv, 202, 28, 64, "ECR", "#c4b5fd");
  box(prv, 10, 66, 120, "ECS cluster", "#93c5fd");
  box(prv, 138, 66, 128, "KMS · encrypted", "#fcd34d");
  chip(280, 902, "3 · TERRAFORM BUILDS A SECURE VPC + ECS", "#93c5fd");

  // flows
  function flow(id, d, n, dur) {
    el("path", { d: d, fill: "none", stroke: "#e2e8f0", "stroke-width": 3, "stroke-linecap": "round" });
    var g = el("g", {});
    el("path", { id: id, d: d, fill: "none", stroke: "#8b5cf6", "stroke-width": 2, "stroke-dasharray": "4 10", class: "fs-dash" }, g);
    if (reduceMotion) return;
    for (var i = 0; i < n; i++) {
      var c = el("circle", { r: 6, fill: "url(#ssGlow)" }, g);
      var m = el("animateMotion", { dur: dur + "s", repeatCount: "indefinite", begin: (-i * dur / n).toFixed(2) + "s" }, c);
      el("mpath", { href: "#" + id }, m);
    }
  }
  flow("ssf1", "M250 220 C270 220 280 220 300 220", 2, 1.2);
  flow("ssf2", "M418 324 C418 400 90 420 76 484", 3, 2.4);
  flow("ssf3", "M484 532 C520 600 540 700 470 764", 3, 2.4);
  chips.forEach(function (c) {
    var g = el("g", { transform: "translate(" + c[0] + " " + c[1] + ")" });
    var w = c[2].length * 6.7 + 26;
    el("rect", { x: -w / 2, y: -13, width: w, height: 26, rx: 13, fill: "#fff", stroke: c[3] }, g);
    el("text", { x: 0, y: 4.5, "text-anchor": "middle", class: "fs-chip" }, g, c[2]);
  });
  svg.appendChild(token);

  // ---------- dashboard ----------
  var dash = el("g", { transform: "translate(20 920)" });
  el("rect", { width: 520, height: 168, rx: 14, fill: "#0f172a" }, dash);
  el("text", { x: 18, y: 26, class: "fs-dtitle" }, dash, "TERRAFORM PIPELINE · AWS");
  var pill = el("g", { transform: "translate(400 12)" }, dash);
  var pillBg = el("rect", { width: 104, height: 22, rx: 11, fill: "#3730a3" }, pill);
  var pillTx = el("text", { x: 52, y: 15, "text-anchor": "middle", class: "fs-pill" }, pill, "RUNNING");
  var T = [["STAGE", ""], ["RESOURCES", ""], ["CREDENTIALS", "STS"], ["STATIC KEYS", ""]].map(function (t, i) {
    var g = el("g", { transform: "translate(" + (18 + i * 124) + " 40)" }, dash);
    el("rect", { width: 114, height: 46, rx: 8, fill: "#1e293b" }, g);
    el("text", { x: 10, y: 16, class: "fs-tlabel" }, g, t[0]);
    var v = el("text", { x: 10, y: 37, class: "fs-tval ss-tv" }, g, "");
    el("text", { x: 104, y: 37, "text-anchor": "end", class: "fs-tunit" }, g, t[1]);
    return v;
  });
  T[3].textContent = "0";
  el("text", { x: 18, y: 106, class: "fs-tlabel" }, dash, "PIPELINE LOG");
  var logs = [0, 1].map(function (i) { return el("text", { x: 18, y: 128 + i * 22, class: "av-log" }, dash, ""); });
  function log(s) { logs[1].textContent = logs[0].textContent; logs[0].textContent = s; }

  // ---------- the run ----------
  var visible = true, timers = [];
  function later(fn, ms) { timers.push(setTimeout(function () { if (visible || reduceMotion) fn(); else later(fn, 400); }, reduceMotion ? 0 : ms)); }
  function setStage(i, state) {
    var s = stDots[i];
    s.d.setAttribute("fill", state === "done" ? "#22c55e" : state === "run" ? "#6366f1" : "#e2e8f0");
    s.d.setAttribute("class", state === "run" ? "ss-run" : "");
    s.tag.textContent = state === "done" ? "passed" : state === "run" ? "running" : "";
    s.tag.setAttribute("fill", state === "done" ? "#16a34a" : "#6366f1");
  }
  function moveToken(to) {
    var x0 = parseFloat(token.getAttribute("cx")), x1 = NODES[to][2], t0 = performance.now();
    nodeEls.forEach(function (b, k) { b.setAttribute("stroke", k <= to ? "#8b5cf6" : "#cbd5e1"); });
    if (reduceMotion) { token.setAttribute("cx", x1); return; }
    (function st(now) { var t = Math.min(1, (now - t0) / 500); token.setAttribute("cx", (x0 + (x1 - x0) * t).toFixed(1)); if (t < 1) requestAnimationFrame(st); })(t0);
  }
  function role(i) { roleEls.forEach(function (r, k) { r.b.setAttribute("fill", k === i ? "#ede9fe" : "#fff"); r.b.setAttribute("stroke", k === i ? "#8b5cf6" : "#cbd5e1"); }); }
  function run() {
    STAGES.forEach(function (_, i) { setStage(i, "wait"); });
    RES.forEach(function (r) { r.classList.remove("on"); });
    token.setAttribute("cx", 76); moveToken(0); role(-1);
    pillTx.textContent = "RUNNING"; pillBg.setAttribute("fill", "#3730a3");
    T[0].textContent = "init"; T[1].textContent = "0"; T[2].textContent = "—";
    lockTx.textContent = "state lock · acquired"; commit.classList.remove("pop"); void commit.getBBox(); commit.classList.add("pop");
    log("$ git push → pipeline #" + (1200 + Math.floor(performance.now() / 1000) % 800) + " started");
    setStage(0, "run");
    later(function () { moveToken(1); log("OIDC token presented to IAM identity provider"); }, 600);
    later(function () { moveToken(2); role(1); log("sts:AssumeRoleWithWebIdentity → role/plan ✓"); T[2].textContent = "1h"; }, 1200);
    later(function () { moveToken(3); setStage(0, "done"); setStage(1, "run"); T[0].textContent = "validate"; log("terraform validate · Success! The configuration is valid."); }, 1800);
    later(function () { setStage(1, "done"); setStage(2, "run"); T[0].textContent = "plan"; log("Plan: " + RES.length + " to add, 0 to change, 0 to destroy."); }, 2800);
    later(function () { setStage(2, "done"); setStage(3, "run"); role(2); T[0].textContent = "apply"; log("sts:AssumeRoleWithWebIdentity → role/apply ✓"); }, 4000);
    RES.forEach(function (r, i) {
      later(function () { r.classList.add("on"); T[1].textContent = (i + 1) + "/" + RES.length; }, 4400 + i * 260);
    });
    var end = 4400 + RES.length * 260 + 300;
    later(function () {
      setStage(3, "done"); T[0].textContent = "done"; role(-1);
      pillTx.textContent = "APPLIED"; pillBg.setAttribute("fill", "#14532d");
      lockTx.textContent = "state saved · lock released";
      log("Apply complete! Resources: " + RES.length + " added, 0 changed, 0 destroyed.");
    }, end);
    if (!reduceMotion) later(run, end + 4200);
  }
  run();
  if ("IntersectionObserver" in window && !reduceMotion) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (svg.pauseAnimations) visible ? svg.unpauseAnimations() : svg.pauseAnimations();
    }).observe(svg);
  }
})();
