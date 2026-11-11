/* CIE Study Hub - vanilla JS interactions */
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- typewriter (hero tagline) ---- */
  document.querySelectorAll("[data-typewriter]").forEach(function (el) {
    var text = el.getAttribute("data-typewriter");
    if (reduced) { el.textContent = text; return; }
    var i = 0;
    el.innerHTML = '<span class="tw"></span><span class="caret">&nbsp;</span>';
    var tw = el.querySelector(".tw");
    (function tick() {
      if (i <= text.length) {
        tw.textContent = text.slice(0, i++);
        setTimeout(tick, 34 + Math.random() * 40);
      }
    })();
  });

  /* ---- scroll reveal (IntersectionObserver) ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---- 3D tilt on cards (Aceternity-style, vanilla) ---- */
  if (!reduced && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".card[data-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(800px) rotateY(" + (x * 10) + "deg) rotateX(" + (-y * 10) + "deg) translateY(-3px)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ---- hero spotlight follows cursor ---- */
  var spot = document.querySelector(".spotlight");
  if (spot && !reduced && window.matchMedia("(hover: hover)").matches) {
    window.addEventListener("mousemove", function (e) {
      var nx = (e.clientX / window.innerWidth - 0.5) * 120;
      spot.style.transform = "translateX(calc(-50% + " + nx + "px))";
    });
  }

  /* ---- marquee: duplicate track for seamless loop ---- */
  document.querySelectorAll(".marquee .track").forEach(function (t) {
    t.innerHTML += t.innerHTML;
  });

  /* ---- watched-progress: localStorage per page ---- */
  var pageKey = "ciehub:" + (document.body.getAttribute("data-page") || location.pathname);
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(pageKey) || "{}"); } catch (e) {}
  document.querySelectorAll(".pill[data-vid]").forEach(function (pill) {
    var id = pill.getAttribute("data-vid");
    if (saved[id]) pill.classList.add("done");
    var check = pill.querySelector(".check");
    if (check) {
      check.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        pill.classList.toggle("done");
        saved[id] = pill.classList.contains("done");
        try { localStorage.setItem(pageKey, JSON.stringify(saved)); } catch (e) {}
        updateProgress();
      });
    }
  });
  function updateProgress() {
    var bar = document.querySelector(".progress-fill");
    var label = document.querySelector(".progress-label");
    if (!bar) return;
    var pills = document.querySelectorAll(".pill[data-vid]");
    var done = document.querySelectorAll(".pill[data-vid].done");
    var pct = pills.length ? Math.round((done.length / pills.length) * 100) : 0;
    bar.style.width = pct + "%";
    if (label) label.textContent = done.length + "/" + pills.length + " videos (" + pct + "%)";
  }
  updateProgress();
})();
