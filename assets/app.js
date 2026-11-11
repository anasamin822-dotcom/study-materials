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

  /* ---- light/dark mode toggle (persisted) ---- */
  var mt = document.querySelector(".mode-toggle");
  if (mt) {
    var syncToggle = function () {
      mt.setAttribute("aria-pressed", document.documentElement.getAttribute("data-mode") === "dark" ? "true" : "false");
    };
    mt.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-mode") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-mode", next);
      try { localStorage.setItem("sm-mode", next); } catch (e) {}
      syncToggle();
    });
    syncToggle();
  }

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

  /* ---- scroll progress bar ---- */
  var sp = document.querySelector(".scroll-progress");
  if (sp) {
    var onScroll = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      sp.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---- magnetic buttons (subtle, desktop only) ---- */
  if (!reduced && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = "translate(" + x + "px," + y + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---- exam countdown (CIE 2, then semester exams; IST dates) ---- */
  document.querySelectorAll("[data-countdown]").forEach(function (box) {
    var targets = [
      { label: "CIE 2", at: "2026-11-25T09:00:00+05:30" },
      { label: "Semester Exams", at: "2026-12-10T09:00:00+05:30" }
    ];
    var labelEl = box.querySelector("[data-cd-label]");
    var els = {
      d: box.querySelector("[data-cd-d]"), h: box.querySelector("[data-cd-h]"),
      m: box.querySelector("[data-cd-m]"), s: box.querySelector("[data-cd-s]")
    };
    var set = function (el, v) {
      if (el.textContent !== v) {
        el.textContent = v;
        el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
      }
    };
    var pad = function (n) { return String(n).padStart(2, "0"); };
    var tickCd = function () {
      var now = Date.now();
      var next = null;
      for (var i = 0; i < targets.length; i++) {
        if (new Date(targets[i].at).getTime() > now) { next = targets[i]; break; }
      }
      if (!next) {
        box.querySelector(".cd-label").innerHTML = "&#9203; All exams done - all the best!";
        box.querySelector(".cd-grid").style.display = "none";
        return;
      }
      labelEl.textContent = next.label;
      var diff = Math.max(0, new Date(next.at).getTime() - now);
      var d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24,
          m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
      set(els.d, String(d)); set(els.h, pad(h)); set(els.m, pad(m)); set(els.s, pad(s));
      setTimeout(tickCd, 1000);
    };
    tickCd();
  });

  /* ---- footer chat box -> FormSubmit (AJAX, honeypot-guarded) ---- */
  document.querySelectorAll(".chat-form").forEach(function (form) {
    var status = form.parentElement.querySelector(".chat-status");
    var btn = form.querySelector(".chat-send");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.message.value.trim();
      if (!msg) { status.textContent = "Type something first."; status.className = "chat-status"; return; }
      if (form.company.value) { /* honeypot: pretend success, send nothing */
        form.reset(); status.textContent = "Sent! Anas will see it."; status.className = "chat-status ok"; return;
      }
      btn.disabled = true; status.textContent = "Sending..."; status.className = "chat-status";
      fetch("https://formsubmit.co/ajax/ea3d39c1c06bc783ddf0ca43491dd14d", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          _subject: "Study Materials site - visitor message",
          message: msg,
          page: location.pathname,
          _captcha: "false"
        })
      }).then(function (r) {
        if (!r.ok) throw new Error("bad status");
        form.reset();
        status.textContent = "Sent! Anas will see it.";
        status.className = "chat-status ok";
      }).catch(function () {
        status.textContent = "Could not send - check your connection and try again.";
        status.className = "chat-status";
      }).finally(function () { btn.disabled = false; });
    });
  });
})();
