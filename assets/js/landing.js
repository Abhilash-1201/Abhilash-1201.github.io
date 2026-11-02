/* Welcome screen: CI/CD loop behind the name and the construction site building the pipeline from DEV to PROD. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  if (!document.getElementById("site")) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- CI/CD infinity loop (blue) with moving arrows ---------- */
  const A = 600, cx = 700, cy = 260;
  const pt = t => {
    const s = Math.sin(t), c = Math.cos(t), d = 1 + s * s;
    return [cx + A * c / d, cy + A * s * c / d];
  };
  let d = "";
  for (let i = 0; i <= 360; i++) {
    const t = Math.PI / 2 + (i / 360) * Math.PI * 2;
    const [x, y] = pt(t);
    d += (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
  }
  document.getElementById("loopPath").setAttribute("d", d + "Z");
  document.getElementById("loopInner").setAttribute("d", d + "Z");

  const labels = [
    ["PLAN", Math.PI / 2 + 0.75, -1], ["CODE", Math.PI - 0.38, -1],
    ["BUILD", Math.PI + 0.38, -1], ["TEST", 1.5 * Math.PI - 0.75, -1],
    ["RELEASE", 1.5 * Math.PI + 0.75, 1], ["DEPLOY", 2 * Math.PI - 0.38, 1],
    ["OPERATE", 0.38, 1], ["MONITOR", Math.PI / 2 - 0.75, 1]
  ];
  const lg = document.getElementById("loopLabels");
  labels.forEach(([txt, t, side]) => {
    const [x, y] = pt(t);
    const lcx = cx + side * 0.6 * A;
    let vx = x - lcx, vy = y - cy;
    const len = Math.hypot(vx, vy); vx /= len; vy /= len;
    const tx = x + vx * 34, ty = y + vy * 34 + 5;
    const anchor = Math.abs(vx) < 0.35 ? "middle" : (vx < 0 ? "end" : "start");
    el("circle", { cx: x, cy: y, r: 6, fill: "#fff", stroke: "#2563eb", "stroke-width": 2.5 }, lg);
    el("text", { x: tx, y: ty, "text-anchor": anchor, "font-weight": 700, "font-size": 15, "letter-spacing": 3, fill: "#5b6f8f" }, lg).textContent = txt;
  });
  const ar = document.getElementById("arrows");
  const LOOP_DUR = 16, N_ARROWS = 6;
  for (let i = 0; i < N_ARROWS; i++) {
    const g = el("g", {}, ar);
    el("path", { d: "M-13,-10 L12,0 L-13,10 L-6,0 Z", fill: "#1d4ed8", stroke: "#fff", "stroke-width": 1.5, "stroke-linejoin": "round" }, g);
    const m = el("animateMotion", { dur: LOOP_DUR + "s", repeatCount: "indefinite", rotate: "auto", begin: (-i * LOOP_DUR / N_ARROWS).toFixed(2) + "s" }, g);
    const mp = el("mpath", {}, m); mp.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#loopPath"); mp.setAttribute("href", "#loopPath");
  }

  /* ---------- pipeline stages + lamps ---------- */
  const stages = [["CODE", 290], ["BUILD", 490], ["TEST", 690], ["SCAN", 890], ["DEPLOY", 1090], ["MONITOR", 1290]];
  const sg = document.getElementById("stages");
  const PERIOD = 3, TRAVEL = 9, X0 = 180, X1 = 1420;
  stages.forEach(([name, x]) => {
    el("rect", { x: x - 14, y: 212, width: 28, height: 46, rx: 4, fill: "url(#gMetal)", stroke: "#7d8ea4", "stroke-width": 1.5, filter: "url(#soft)" }, sg);
    el("rect", { x: x - 17, y: 218, width: 34, height: 6, rx: 2, fill: "url(#gMetal)", stroke: "#7d8ea4" }, sg);
    el("rect", { x: x - 17, y: 246, width: 34, height: 6, rx: 2, fill: "url(#gMetal)", stroke: "#7d8ea4" }, sg);
    el("line", { x1: x, y1: 205, x2: x, y2: 212, stroke: "#7d8ea4", "stroke-width": 2 }, sg);
    const lamp = el("circle", { cx: x, cy: 199, r: 6.5, class: "lamp", stroke: "#fff", "stroke-width": 1.5 }, sg);
    lamp.style.animationDelay = (((x - X0) / (X1 - X0) * TRAVEL) % PERIOD).toFixed(2) + "s";
    el("circle", { cx: x - 2, cy: 197, r: 2, fill: "#fff", opacity: .7 }, sg);
    el("text", { x: x, y: 286, "text-anchor": "middle", "font-weight": 700, "font-size": 12, "letter-spacing": 2.5, fill: "#7a8595" }, sg).textContent = name;
  });

  /* packets (3D boxes) flowing every 3s */
  const pk = document.getElementById("packets");
  ["#3b82f6", "#8b5cf6", "#14b8a6"].forEach((c, i) => {
    const g = el("g", {}, pk);
    el("rect", { x: -12, y: -7, width: 24, height: 14, rx: 3, fill: c }, g);
    el("rect", { x: -12, y: -7, width: 24, height: 14, rx: 3, fill: "url(#gPkt)" }, g);
    el("animateMotion", { dur: TRAVEL + "s", repeatCount: "indefinite", begin: (-i * PERIOD) + "s", path: "M180,235 H1420" }, g);
  });

  /* pipe supports */
  const sp = document.getElementById("supports");
  for (let x = 240; x <= 1380; x += 100) {
    if (stages.some(([, sx]) => Math.abs(sx - x) < 30)) continue;
    el("path", { d: `M${x - 9},262 L${x - 3},246 L${x + 3},246 L${x + 9},262`, fill: "none", stroke: "#a9b6c5", "stroke-width": 3, "stroke-linejoin": "round" }, sp);
  }

  /* crane lattice */
  const cr = document.getElementById("craneLattice");
  let z = "";
  for (let y = 250, i = 0; y >= 50; y -= 14, i++) z += (i % 2 ? 1373 : 1357) + "," + y + " ";
  el("polyline", { points: z }, cr);
  z = "";
  for (let x = 1060, i = 0; x <= 1450; x += 14, i++) z += x + "," + (i % 2 ? 41 : 49) + " ";
  el("polyline", { points: z }, cr);

  /* PROD server racks */
  const rk = document.getElementById("racks");
  [1428, 1474, 1520].forEach((x, i) => {
    el("rect", { x: x, y: 150, width: 34, height: 100, rx: 3, fill: "#1f2937" }, rk);
    el("rect", { x: x, y: 150, width: 6, height: 100, rx: 2, fill: "#374151" }, rk);
    for (let r = 0; r < 6; r++) {
      el("rect", { x: x + 8, y: 156 + r * 15, width: 14, height: 3, rx: 1.5, fill: "#475569" }, rk);
      el("circle", { cx: x + 28, cy: 157.5 + r * 15, r: 2, fill: "#22c55e", class: "led " + ["a", "b", "c"][(r + i) % 3] }, rk);
    }
  });

  const LOGOS = {};
  ["github", "github-actions", "jenkins", "docker", "terraform", "kubernetes", "argocd", "datadog", "aws"]
    .forEach(k => { LOGOS[k] = "assets/logos/" + k + ".png"; });
  const tools = [
    ["github", "GitHub", "#24292f"], ["github-actions", "GitHub Actions", "#2088ff"],
    ["jenkins", "Jenkins", "#d33833"], ["docker", "Docker", "#1d8ae8"],
    ["terraform", "Terraform", "#7b42bc"], ["kubernetes", "Kubernetes", "#326ce5"],
    ["argocd", "Argo CD", "#ef7b4d"], ["datadog", "Datadog", "#632ca6"]
  ];
  const sgn = document.getElementById("signs");
  tools.forEach(([key, name, color], i) => {
    const x = 266 + i * 140, top = i % 2 ? 160 : 128, h = 36, w = 48 + name.length * 6.8;
    const g = el("g", { filter: "url(#soft)" }, sgn);
    el("rect", { x: x - 2, y: top + h, width: 4, height: 262 - top - h, fill: "url(#gMetal)" }, g);
    el("rect", { x: x - w / 2, y: top, width: w, height: h, rx: 8, fill: "#fff", stroke: "#d3dae3", "stroke-width": 1.5 }, g);
    el("rect", { x: x - w / 2, y: top, width: w, height: 5, rx: 2.5, fill: color, opacity: .9 }, g);
    el("image", { href: LOGOS[key], x: x - w / 2 + 7, y: top + 7.5, width: 26, height: 26, preserveAspectRatio: "xMidYMid meet" }, g);
    el("text", { x: x - w / 2 + 39, y: top + 24, "font-weight": 700, "font-size": 12, fill: "#2b3340" }, g).textContent = name;
  });
  const awsSlot = document.getElementById("awsSlot");
  awsSlot.innerHTML = "";
  el("image", { href: LOGOS.aws, x: -27, y: -12, width: 46, height: 28, preserveAspectRatio: "xMidYMid meet" }, awsSlot);

  /* ---------- ladders ---------- */
  const ld = document.getElementById("ladders");
  function ladder(x1, y1, x2, y2, width, rungs) {
    const g = el("g", { filter: "url(#soft)" }, ld);
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L * width / 2, ny = dx / L * width / 2;
    for (let i = 1; i < rungs; i++) {
      const t = i / rungs;
      el("line", { x1: x1 + dx * t - nx, y1: y1 + dy * t - ny, x2: x1 + dx * t + nx, y2: y1 + dy * t + ny, stroke: "#9aa8b8", "stroke-width": 2.2 }, g);
    }
    el("line", { x1: x1 - nx, y1: y1 - ny, x2: x2 - nx, y2: y2 - ny, stroke: "#b8c4d2", "stroke-width": 3.2, "stroke-linecap": "round" }, g);
    el("line", { x1: x1 + nx, y1: y1 + ny, x2: x2 + nx, y2: y2 + ny, stroke: "#8293a8", "stroke-width": 3.2, "stroke-linecap": "round" }, g);
  }
  // step ladder (A-frame) next to the Terraform sign
  ladder(714, 262, 733, 196, 13, 6);
  ladder(752, 262, 739, 196, 11, 5);
  el("rect", { x: 724, y: 193, width: 22, height: 5, rx: 1.5, fill: "url(#gMetalV)", stroke: "#8293a8" }, ld);
  // leaning ladder against the Kubernetes sign
  ladder(1068, 262, 1036, 168, 16, 9);

  /* ---------- 3D-style engineers ---------- */
  const wk = document.getElementById("workers");
  const rot = (vals, px, py, dur, extra = "") =>
    `<animateTransform attributeName="transform" type="rotate" values="${vals.map(v => `${v} ${px} ${py}`).join(";")}" dur="${dur}" repeatCount="indefinite" ${extra}/>`;
  const leg = (x, anim = "") =>
    `<g>${anim}<rect x="${x}" y="-25" width="6.4" height="22" rx="3.2" fill="url(#gPants)"/><rect x="${x - 1}" y="-5.5" width="10" height="5.5" rx="2.6" fill="#3a2f27"/></g>`;
  const torso = vest =>
    `<path d="M-9.5,-46 q0,-4.5 4.5,-4.5 h10 q4.5,0 4.5,4.5 v22 q0,3 -3,3 h-13 q-3,0 -3,-3z" fill="url(#${vest})"/>` +
    `<rect x="-9.5" y="-38" width="19" height="2.4" fill="#fff7cc" opacity=".9"/><rect x="-9.5" y="-32" width="19" height="2.4" fill="#fff7cc" opacity=".9"/>` +
    `<rect x="-9.5" y="-26" width="19" height="3" fill="#2b2b2b" opacity=".55"/>`;
  const head = (hat, visor) =>
    `<rect x="-2.3" y="-53" width="4.6" height="4" fill="#9a623e"/><circle cx="0" cy="-59" r="7.6" fill="url(#gSkin)"/>` +
    (visor
      ? `<rect x="1" y="-64" width="8.5" height="10" rx="2.2" fill="#2d3748"/><rect x="2.4" y="-62" width="5.5" height="3.2" rx="1" fill="#63b3ed" opacity=".7"/>`
      : `<circle cx="4.2" cy="-59.5" r="1.05" fill="#2b1d14"/><path d="M3,-55.5 q2,1 3.5,-.3" stroke="#6b3e22" stroke-width=".9" fill="none"/>`) +
    `<path d="M-8.8,-60.5 a8.8,8.8 0 0 1 17.6,0z" fill="url(#${hat})"/>` +
    `<ellipse cx="1.4" cy="-60.5" rx="11" ry="2.2" fill="url(#${hat})" stroke="rgba(0,0,0,.18)" stroke-width=".6"/>` +
    `<path d="M-5,-65.5 a6,6 0 0 1 6,-3.6" stroke="#fff" stroke-width="1.7" fill="none" opacity=".75" stroke-linecap="round"/>`;
  const arm = (vest, angle, anim = "", tool = "") =>
    `<g transform="rotate(${angle} 0 -46)">${anim}<rect x="-2.8" y="-47" width="5.6" height="20" rx="2.8" fill="url(#${vest})"/><circle cx="0" cy="-26.5" r="3" fill="url(#gSkin)"/>${tool}</g>`;
  const shadow = `<ellipse cx="0" cy="0" rx="14" ry="3.2" fill="url(#gShadow)"/>`;
  const add = (x, y, s, inner, flip = false, motion = "") => {
    const g = el("g", { transform: `translate(${x} ${y})` }, wk);
    g.innerHTML = motion + `<g transform="scale(${flip ? -s : s} ${s})">${inner}</g>`;
    return g;
  };
  const wrench = `<g transform="translate(0 -26)"><rect x="-1.3" y="0" width="2.6" height="11" rx="1" fill="url(#gMetal)" stroke="#6b7a8f" stroke-width=".5"/><path d="M-3.5,10 h7 v4 h-2.2 v-2 h-2.6 v2 h-2.2z" fill="#8495aa"/></g>`;

  // 1. developer in headphones at DEV, typing
  add(224, 262, 1.1,
    shadow + leg(-6.5) + leg(0.5) +
    `<path d="M-10,-46 q0,-5 5,-5 h10 q5,0 5,5 v23 q0,3 -3,3 h-14 q-3,0 -3,-3z" fill="url(#gHood)"/>` +
    `<rect x="-2.3" y="-53" width="4.6" height="4" fill="#9a623e"/><circle cx="0" cy="-59" r="7.6" fill="url(#gSkin)"/>` +
    `<path d="M-7.8,-61 a7.8,7.8 0 0 1 15.6,0 q-4,-3 -8,-2.4 q-4,-.6 -7.6,2.4z" fill="#141414"/><circle cx="4.2" cy="-59.5" r="1" fill="#2b1d14"/>` +
    `<path d="M-8.6,-58 a8.6,9.5 0 0 1 17.2,0" fill="none" stroke="#1b1b1b" stroke-width="2"/><rect x="-10.8" y="-61" width="4.4" height="8" rx="2.2" fill="#222"/>` +
    `<g transform="translate(-30 -36)"><rect x="0" y="0" width="22" height="14" rx="2" fill="url(#gMetal)"/><rect x="2" y="2" width="18" height="10" rx="1" fill="#0f172a"/><rect x="4" y="5" width="9" height="1.6" fill="#60a5fa"/><rect x="4" y="8" width="12" height="1.6" fill="#34d399"/></g>` +
    arm("gHood", 75, rot([70, 78, 70], 0, -46, "0.45s")), true);

  // 2. worker carrying a pipe segment (walks back and forth)
  add(0, 0, 1.1,
    shadow + leg(-6.5, rot([-16, 16, -16], -3.3, -25, "0.7s")) + leg(0.5, rot([16, -16, 16], 3.7, -25, "0.7s")) +
    arm("gVest", 160) + torso("gVest") + head("gHat") +
    `<rect x="-34" y="-58" width="62" height="10" rx="5" fill="url(#gMetalV)" stroke="#7d8ea4" stroke-width="1.2"/><ellipse cx="28" cy="-53" rx="2.5" ry="5" fill="#9fb0c4"/>` +
    arm("gVest", -160), false,
    `<animateTransform attributeName="transform" type="translate" values="300 262;440 262;300 262" dur="11s" repeatCount="indefinite"/>`
  ).querySelector("g").insertAdjacentHTML("afterbegin",
    `<animateTransform attributeName="transform" type="scale" values="1.1 1.1;-1.1 1.1" keyTimes="0;0.5" calcMode="discrete" dur="11s" repeatCount="indefinite"/>`);

  // 3. welder kneeling at a pipe joint (sparks)
  add(598, 262, 1.1,
    shadow +
    `<rect x="-16" y="-9" width="17" height="6.4" rx="3.2" fill="url(#gPants)"/><rect x="-21" y="-6" width="8" height="6" rx="2.6" fill="#3a2f27"/>` +
    `<rect x="-6" y="-21" width="6.4" height="15" rx="3.2" fill="url(#gPants)"/>` +
    `<rect x="-2" y="-22" width="15" height="6.4" rx="3.2" fill="url(#gPants)"/><rect x="7" y="-20" width="6.4" height="17" rx="3.2" fill="url(#gPants)"/><rect x="6" y="-5.5" width="10" height="5.5" rx="2.6" fill="#3a2f27"/>` +
    `<g transform="translate(-3 9)">` + arm("gVest", -40) + torso("gVest") + head("gHat", true) +
    arm("gVest", -62, rot([-62, -58, -62], 0, -46, "0.35s"),
      `<g transform="translate(0 -26)"><rect x="-1.4" y="0" width="2.8" height="10" rx="1" fill="#374151"/><rect x="-2" y="9" width="4" height="4" rx="1" fill="#9ca3af"/></g>`) + `</g>`);
  const spk = el("g", { transform: "translate(632 236)" }, wk);
  el("circle", { r: 9, fill: "url(#gSpark)" }, spk).innerHTML =
    `<animate attributeName="r" values="7;12;6;10;7" dur="0.3s" repeatCount="indefinite"/>`;
  for (let i = 0; i < 9; i++) {
    const ang = -Math.PI * (0.05 + i * 0.11), r = 14 + (i % 3) * 7;
    const dx = (Math.cos(ang) * r).toFixed(1), dy = (Math.sin(ang) * r + 6).toFixed(1);
    const dur = (0.42 + (i % 4) * 0.1) + "s";
    el("circle", { r: 1.6, fill: i % 2 ? "#ffd23f" : "#ff9f1a" }, spk).innerHTML =
      `<animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy}" dur="${dur}" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="${dur}" repeatCount="indefinite"/>`;
  }

  // 4. engineer on the step ladder, bolting the Terraform sign with a wrench
  add(736, 194, 1.05,
    shadow + leg(-6.5) + leg(0.5) + arm("gVest", -30) + torso("gVest") + head("gHat") +
    arm("gVest", -118, rot([-112, -128, -112], 0, -46, "0.8s"), wrench));

  // 5. engineer climbing the ladder up to the Kubernetes sign (faces the ladder)
  add(0, 0, 1.05,
    shadow + leg(-6.5, rot([-20, 8, -20], -3.3, -25, "0.8s")) + leg(0.5, rot([8, -20, 8], 3.7, -25, "0.8s")) +
    arm("gVest", -160, rot([-165, -135, -165], 0, -46, "0.8s")) + torso("gVest") + head("gHat") +
    arm("gVest", -140, rot([-135, -165, -135], 0, -46, "0.8s")), true,
    `<animateTransform attributeName="transform" type="translate" values="1066 262;1044 196;1044 196;1066 262;1066 262" keyTimes="0;0.4;0.6;0.95;1" dur="9s" repeatCount="indefinite"/>`);

  // 6. inspector with clipboard (green vest, white hat)
  add(1112, 262, 1.1,
    shadow + leg(-6.5) + leg(0.5) + arm("gVestG", 10) + torso("gVestG") +
    `<g>${rot([0, -8, 0], 0, -50, "2.4s")}${head("gHatW")}</g>` +
    arm("gVestG", -55, "", `<g transform="translate(-2 -30)"><rect x="0" y="0" width="13" height="17" rx="1.5" fill="#fff" stroke="#64748b" stroke-width="1.2"/><rect x="4" y="-1.5" width="5" height="3" rx="1" fill="#64748b"/><line x1="2.5" y1="6" x2="10.5" y2="6" stroke="#94a3b8"/><line x1="2.5" y1="10" x2="10.5" y2="10" stroke="#94a3b8"/><path d="M2.5,13.5 l2,2 l4,-4" stroke="#22c55e" stroke-width="1.4" fill="none"/></g>`));

  // 7. crane signal-man with a lit baton
  add(1176, 262, 1.05,
    shadow + leg(-6.5) + leg(0.5) + arm("gVest", 15) + torso("gVest") + head("gHat") +
    arm("gVest", -150, rot([-160, -105, -160], 0, -46, "1.6s"),
      `<rect x="-1.6" y="-30" width="3.2" height="12" rx="1.6" fill="#ff5a1f" transform="translate(0 -9)"/>`));

  /* ---------- name: magnifying ring that follows the cursor (green copy, clipped to a circle) ---------- */
  const gt = document.getElementById("gate-title");
  if (gt && window.matchMedia("(hover: hover)").matches) {
    gt.addEventListener("pointermove", e => {
      const r = gt.getBoundingClientRect();
      gt.style.setProperty("--x", (e.clientX - r.left).toFixed(1) + "px");
      gt.style.setProperty("--y", (e.clientY - r.top).toFixed(1) + "px");
      gt.classList.add("zoom");
    });
    gt.addEventListener("pointerleave", () => gt.classList.remove("zoom"));
  }

  if (reduced) document.querySelectorAll("svg").forEach(s => s.pauseAnimations && s.pauseAnimations());
})();
