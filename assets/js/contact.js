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

  async function play() {
    // 1. heading
    words.forEach(function (w, i) { setTimeout(function () { w.classList.add("in"); }, i * 110); });
    await wait(words.length * 110 + 650);
    // 2. person steps out from behind "LET'S TALK."
    person.classList.add("in");          // walks in from the right
    await wait(1500);
    person.classList.add("folded");      // stops and folds his arms
    await wait(500);
    // 3. contact rows slide in from the left, one by one
    for (var r = 0; r < rows.length; r++) { rows[r].classList.add("in"); await wait(260); }
    sec.classList.add("ct-done");
  }

  var io = new IntersectionObserver(function (en) {
    if (en[0].isIntersecting) { io.disconnect(); play(); }
  }, { threshold: 0.35 });
  io.observe(sec);
})();
