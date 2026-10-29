/* Cursor-tracking avatar: 9 pre-rendered images, one per gaze direction.
   We work out which way the cursor is from the face and show that image. */
(function () {
  "use strict";

  var avatar = document.getElementById("avatar");
  if (avatar) initAvatar(avatar);

  function initAvatar(el) {
    var imgs = {};
    el.querySelectorAll("img[data-dir]").forEach(function (img) { imgs[img.dataset.dir] = img; });

    // Where the face sits inside the square image (0..1). Tune after swapping in the real images.
    var FACE_X = 0.49, FACE_Y = 0.28;
    // Inside this radius (as a share of the avatar width) the avatar looks straight ahead.
    var DEAD_ZONE = 0.14;
    // Clockwise from "right", in 45° steps (screen y grows downward).
    var SECTORS = ["right", "down-right", "down", "down-left", "left", "up-left", "up", "up-right"];

    var current = "center";
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var lastMove = 0, idleTimer = null, idleStep = 0, raf = 0, pending = null;

    function show(dir) {
      if (dir === current || !imgs[dir]) return;
      imgs[current].classList.remove("on");
      imgs[dir].classList.add("on");
      current = dir;
    }

    function directionFor(x, y) {
      var r = el.getBoundingClientRect();
      var fx = r.left + r.width * FACE_X;
      var fy = r.top + r.height * FACE_Y;
      var dx = x - fx, dy = y - fy;
      if (Math.hypot(dx, dy) < r.width * DEAD_ZONE) return { dir: "center", dx: 0, dy: 0 };
      var angle = Math.atan2(dy, dx);                       // -PI..PI, 0 = right
      var idx = Math.round(angle / (Math.PI / 4));          // -4..4
      idx = (idx + 8) % 8;
      var reach = Math.max(window.innerWidth, window.innerHeight) * 0.6;
      return { dir: SECTORS[idx], dx: clamp(dx / reach), dy: clamp(dy / reach) };
    }

    function clamp(v) { return Math.max(-1, Math.min(1, v)); }

    function apply() {
      raf = 0;
      if (!pending) return;
      var g = directionFor(pending.x, pending.y);
      show(g.dir);
      if (!reduceMotion) {
        el.style.transform = "translate(" + (g.dx * 8).toFixed(1) + "px," + (g.dy * 6).toFixed(1) + "px)";
      }
    }

    function onPointer(e) {
      pending = { x: e.clientX, y: e.clientY };
      lastMove = Date.now();
      stopIdle();
      if (!raf) raf = requestAnimationFrame(apply);
      scheduleIdle();
    }

    // When nobody is moving a cursor (phones, or a still mouse), glance around now and then.
    var IDLE_PATH = ["down", "down", "center", "right", "up-right", "center", "down", "left", "center"];
    function scheduleIdle() {
      clearTimeout(idleTimer);
      if (reduceMotion) return;
      idleTimer = setTimeout(idleTick, 4000);
    }
    function idleTick() {
      if (Date.now() - lastMove < 3500) return scheduleIdle();
      el.style.transform = "";
      show(IDLE_PATH[idleStep % IDLE_PATH.length]);
      idleStep++;
      idleTimer = setTimeout(idleTick, 1300);
    }
    function stopIdle() { clearTimeout(idleTimer); }

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    document.addEventListener("mouseleave", function () { show("center"); el.style.transform = ""; scheduleIdle(); });

    // Warm the cache so the first swap never flickers.
    Object.keys(imgs).forEach(function (k) {
      var i = imgs[k];
      if (i.decode) i.decode().catch(function () {});
    });

    scheduleIdle();
  }

  // Footer: GitHub Actions replaces the placeholders with the commit SHA and build date.
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  var build = document.getElementById("build");
  if (build) {
    var sha = build.dataset.sha || "", date = build.dataset.date || "";
    if (sha && sha.indexOf("__") !== 0) {
      build.innerHTML = "Deployed to GitHub Pages by GitHub Actions, commit <code>" + sha.slice(0, 7) + "</code> on " + date;
    }
  }
})();
