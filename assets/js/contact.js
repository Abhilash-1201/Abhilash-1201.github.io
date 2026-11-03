/* Contact section, played once when it scrolls into view (person walks in from the right, rows slide in from the left):
   1. the heading words drop in one by one with a bounce,
   2. a person in a black coat steps out from behind "LET'S TALK." and folds his arms,
   3. a truck drives in with the contact boxes, unloads each one into its row, and drives off with smoke. */
(function () {
  "use strict";
  var sec = document.getElementById("contact");
  if (!sec) return;
  var ask = document.getElementById("ctAsk");
  var person = document.getElementById("ctPerson");
  var rows = Array.prototype.slice.call(sec.querySelectorAll(".links li"));
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
    var gap = 12, edge = Math.min(window.innerWidth - 8, h.right + 70), avail = edge - maxRight - gap;
    if (avail < 110) {                      // phones: no room beside the text, so he stands below it
      pw.classList.add("below"); pw.style.width = "120px"; pw.style.left = pw.style.bottom = ""; return;
    }
    pw.classList.remove("below");
    var w = Math.min(240, avail);
    pw.style.width = w.toFixed(0) + "px";
    pw.style.left = (maxRight - h.left + gap + (avail - w) / 2).toFixed(0) + "px";
    pw.style.bottom = Math.max(0, h.bottom - t.bottom - 6).toFixed(0) + "px";
  }
  place();
  window.addEventListener("resize", place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);

  // 3D tilt: each card leans toward the cursor
  if (window.matchMedia("(hover: hover)").matches && !reduceMotion) {
    sec.querySelectorAll("a.cc").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", ((px - .5) * 14).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((.5 - py) * 12).toFixed(2) + "deg");
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", function () { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
    });
  }

  function showAll() {
    sec.classList.add("ct-done");
    words.forEach(function (w) { w.classList.add("in"); });
    person.classList.add("in");
    person.poster = "assets/contact/abhilash-pose.webp"; person.removeAttribute("src"); person.load();
    rows.forEach(function (r) { r.classList.add("in"); });
  }
  if (reduceMotion || !("IntersectionObserver" in window)) { showAll(); return; }
  sec.classList.add("ct-armed");

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function play() {
    // 1. heading
    words.forEach(function (w, i) { setTimeout(function () { w.classList.add("in"); }, i * 110); });
    await wait(words.length * 110 + 650);
    // 2. person steps out from behind "LET'S TALK."
    // Abhilash walks in from the right, stops and folds his arms (the video holds on its last frame)
    person.classList.add("in");
    try { person.currentTime = 0; await person.play(); } catch (e) {}
    await new Promise(function (r) {
      var done = false, fin = function () { if (!done) { done = true; r(); } };
      person.addEventListener("ended", fin, { once: true });
      setTimeout(fin, 5600);
    });
    await wait(150);
    // 3. contact rows slide in from the left, one by one
    for (var r = 0; r < rows.length; r++) { rows[r].classList.add("in"); await wait(320); }
    sec.classList.add("ct-done");
  }

  var io = new IntersectionObserver(function (en) {
    if (en[0].isIntersecting) { io.disconnect(); play(); }
  }, { threshold: 0.35 });
  io.observe(sec);
})();
