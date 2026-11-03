/* Contact section, played once when it scrolls into view:
   1. the heading words drop in one by one with a bounce,
   2. a person in a black coat steps out from behind "LET'S TALK." and folds his arms,
   3. a truck drives in with the contact boxes, unloads each one into its row, and drives off with smoke. */
(function () {
  "use strict";
  var sec = document.getElementById("contact");
  if (!sec) return;
  var ask = document.getElementById("ctAsk");
  var person = document.getElementById("ctPerson");
  var road = document.getElementById("ctRoad");
  var truck = document.getElementById("ctTruck");
  var rows = Array.prototype.slice.call(sec.querySelectorAll(".links li"));
  var boxes = Array.prototype.slice.call(truck.querySelectorAll(".ct-box"));
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // split the heading into words (screen readers read the h2's aria-label)
  var words = [];
  Array.prototype.slice.call(ask.childNodes).forEach(function (node) {
    if (node.nodeType === 3) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (t) {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(" ")); return; }
        var w = document.createElement("span"); w.className = "w"; w.textContent = t; w.setAttribute("aria-hidden", "true");
        frag.appendChild(w); words.push(w);
      });
      ask.replaceChild(frag, node);
    } else if (node.classList && node.classList.contains("ct-talk")) {
      node.querySelectorAll(".w").forEach(function (w) { words.push(w); });
    }
  });

  // stand the person right after "LET'S TALK.", feet on that line's baseline
  var talk = ask.querySelector(".ct-talk"), pw = person.parentNode, head = ask.parentNode;
  function place() {
    var h = head.getBoundingClientRect(), t = talk.getBoundingClientRect();
    // free space to the right of every line of the heading
    var maxRight = 0;
    words.forEach(function (w) { maxRight = Math.max(maxRight, w.getBoundingClientRect().right); });
    var gap = 24, avail = h.right - maxRight - gap;
    if (avail < 90) {                      // phones: no room beside the text, so he stands below it
      pw.classList.add("below"); pw.style.width = "88px"; pw.style.left = pw.style.bottom = ""; return;
    }
    pw.classList.remove("below");
    var w = Math.min(190, avail);
    pw.style.width = w.toFixed(0) + "px";
    pw.style.left = (maxRight - h.left + gap + (avail - w) / 2).toFixed(0) + "px";
    pw.style.bottom = Math.max(0, h.bottom - t.bottom).toFixed(0) + "px";
  }
  place();
  window.addEventListener("resize", place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);

  function showAll() {
    sec.classList.add("ct-done");
    words.forEach(function (w) { w.classList.add("in"); });
    person.classList.add("in", "folded");
    rows.forEach(function (r) { r.classList.add("in"); });
  }
  if (reduceMotion || !("IntersectionObserver" in window)) { showAll(); return; }
  sec.classList.add("ct-armed");

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // ---------- truck driving with spinning wheels and smoke ----------
  var x = 0, smokeT = 0;
  function puff() {
    var p = document.createElement("span");
    p.className = "ct-puff";
    p.style.left = (x + 6) + "px";
    road.appendChild(p);
    setTimeout(function () { p.remove(); }, 1300);
  }
  function drive(to, ms) {
    return new Promise(function (resolve) {
      var from = x, t0 = performance.now();
      truck.classList.add("moving");
      (function step(now) {
        var t = Math.min(1, (now - t0) / ms);
        var e = to > from && from < 0 ? 1 - Math.pow(1 - t, 3) : t * t;   // ease in when leaving, ease out when arriving
        x = from + (to - from) * e;
        truck.style.transform = "translateX(" + x.toFixed(1) + "px)";
        if (now - smokeT > 70) { smokeT = now; puff(); }
        if (t < 1) requestAnimationFrame(step);
        else { truck.classList.remove("moving"); resolve(); }
      })(t0);
    });
  }

  // a box flies from the truck bed into its row, then the row slides in
  function unload(i) {
    var box = boxes[i], row = rows[i], target = row.querySelector(".l-icon");
    var b = box.getBoundingClientRect(), t = target.getBoundingClientRect();
    var fly = box.cloneNode(true);
    fly.classList.add("ct-fly");
    fly.style.left = b.left + "px"; fly.style.top = b.top + "px";
    fly.style.width = b.width + "px"; fly.style.height = b.height + "px";
    document.body.appendChild(fly);
    box.style.visibility = "hidden";
    var dx = t.left + t.width / 2 - (b.left + b.width / 2), dy = t.top + t.height / 2 - (b.top + b.height / 2);
    var anim = fly.animate([
      { transform: "translate(0,0) rotate(0)" },
      { transform: "translate(" + dx * 0.5 + "px," + (Math.min(dy, 0) - 50) + "px) rotate(-8deg)", offset: 0.45 },
      { transform: "translate(" + dx + "px," + dy + "px) rotate(0) scale(" + (t.width / b.width).toFixed(2) + ")" }
    ], { duration: 650, easing: "cubic-bezier(.3,.7,.3,1)" });
    return anim.finished.then(function () { fly.remove(); row.classList.add("in"); });
  }

  async function play() {
    // 1. heading
    words.forEach(function (w, i) { setTimeout(function () { w.classList.add("in"); }, i * 110); });
    await wait(words.length * 110 + 650);
    // 2. person steps out from behind "LET'S TALK."
    person.classList.add("in");
    await wait(700);
    person.classList.add("folded");
    await wait(450);
    // 3. truck drives in, unloads, drives off
    var W = road.clientWidth;
    x = -truck.offsetWidth - 40;
    truck.style.transform = "translateX(" + x + "px)";
    truck.classList.add("on");
    await drive(Math.min(W * 0.06, 60), 1500);
    for (var i = 0; i < rows.length; i++) { await unload(i); await wait(120); }
    await wait(250);
    await drive(W + 60, 1300);
    truck.classList.remove("on");
    sec.classList.add("ct-done");
  }

  var io = new IntersectionObserver(function (en) {
    if (en[0].isIntersecting) { io.disconnect(); play(); }
  }, { threshold: 0.35 });
  io.observe(sec);
})();
