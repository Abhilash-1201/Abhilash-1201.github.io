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
