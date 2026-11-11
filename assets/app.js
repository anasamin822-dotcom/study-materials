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

  /* ---- scroll reveal (IntersectionObserver), staggered in grids ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  document.querySelectorAll(".grid-cards, .pills, .stats-strip").forEach(function (grid) {
    Array.prototype.forEach.call(grid.children, function (child, i) {
      child.style.transitionDelay = Math.min(i * 55, 440) + "ms";
    });
  });

  /* ---- heading word reveal ---- */
  document.querySelectorAll(".section-head h2").forEach(function (h) {
    var words = h.innerHTML.split(/(<[^>]+>[^<]*<\/[^>]+>|\s+)/).filter(function (w) { return w && w.trim(); });
    var idx = 0;
    h.innerHTML = words.map(function (w) {
      if (w.indexOf("<") === 0) return w;
      return '<span class="w" style="transition-delay:' + (idx++ * 45) + 'ms">' + w + "</span>";
    }).join(" ");
  });

  /* ---- animated counters ---- */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var target = parseInt(e.target.getAttribute("data-count"), 10) || 0;
      if (reduced) { e.target.textContent = target; return; }
      var t0 = null;
      (function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 900, 1);
        e.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    });
  }, { threshold: 0.4 });
  document.querySelectorAll("[data-count]").forEach(function (el) { cio.observe(el); });

  /* ---- cursor glow + trail (desktop only) ---- */
  if (!reduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);
    var mainDot = document.createElement("div");
    mainDot.className = "cursor-dot main";
    document.body.appendChild(mainDot);
    var trailDots = [];
    for (var ti = 0; ti < 6; ti++) {
      var d = document.createElement("div");
      d.className = "cursor-dot trail";
      d.style.opacity = String(0.5 - ti * 0.07);
      document.body.appendChild(d);
      trailDots.push({ el: d, x: -100, y: -100 });
    }
    var mx = -100, my = -100, gx = -100, gy = -100;
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function follow() {
      gx += (mx - gx) * 0.16; gy += (my - gy) * 0.16;
      glow.style.left = gx + "px"; glow.style.top = gy + "px";
      mainDot.style.left = mx + "px"; mainDot.style.top = my + "px";
      var px = mx, py = my;
      trailDots.forEach(function (t) {
        t.x += (px - t.x) * 0.35; t.y += (py - t.y) * 0.35;
        t.el.style.left = t.x + "px"; t.el.style.top = t.y + "px";
        px = t.x; py = t.y;
      });
      requestAnimationFrame(follow);
    })();
  }

  /* ---- continue where you left off ---- */
  var slug = document.body.getAttribute("data-slug");
  if (slug) {
    try { localStorage.setItem("sm-last", JSON.stringify({ slug: slug, name: document.body.getAttribute("data-name") || slug })); } catch (e) {}
  }
  var cont = document.querySelector("[data-continue]");
  if (cont) {
    try {
      var last = JSON.parse(localStorage.getItem("sm-last") || "null");
      if (last && last.slug) {
        cont.hidden = false;
        cont.innerHTML = '<a href="subjects/' + last.slug + '.html">&#9201; Continue where you left off: <b>' + last.name + "</b> &rarr;</a>";
      }
    } catch (e) {}
  }

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

  /* ---- light/dark mode toggle (persisted, circle-morph reveal) ---- */
  var mt = document.querySelector(".mode-toggle");
  if (mt) {
    var syncToggle = function () {
      mt.setAttribute("aria-pressed", document.documentElement.getAttribute("data-mode") === "dark" ? "true" : "false");
    };
    mt.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-mode") === "dark" ? "light" : "dark";
      var apply = function () {
        document.documentElement.setAttribute("data-mode", next);
        try { localStorage.setItem("sm-mode", next); } catch (e) {}
        syncToggle();
      };
      if (reduced) { apply(); return; }
      /* pre-set to the NEXT mode's bg so the expanding circle reveals the new theme */
      var r = mt.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var circle = document.createElement("div");
      circle.className = "mode-circle";
      circle.style.left = cx + "px"; circle.style.top = cy + "px";
      var size = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) * 2.2;
      circle.style.width = size + "px"; circle.style.height = size + "px";
      circle.style.background = next === "dark" ? "#08090B" : "#F5F3EF";
      document.body.appendChild(circle);
      requestAnimationFrame(function () {
        circle.style.transition = "transform .55s cubic-bezier(.4,0,.2,1)";
        circle.style.transform = "translate(-50%,-50%) scale(1)";
      });
      setTimeout(apply, 180);
      setTimeout(function () {
        circle.style.transition = "opacity .35s ease";
        circle.style.opacity = "0";
        setTimeout(function () { circle.remove(); }, 380);
      }, 620);
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
        check.classList.remove("pop"); void check.offsetWidth; check.classList.add("pop");
        if (pill.classList.contains("done") && navigator.vibrate) { try { navigator.vibrate(12); } catch (err) {} }
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

  /* ---- doubt box: Supabase thread + FormSubmit notify (honeypot-guarded) ---- */
  var SB_URL = "https://xnaakovuqweqaejeablx.supabase.co/rest/v1/study_messages";
  var SB_KEY = "sb_publishable_v4YW_hxMSNNpYGOB9ymH_w_SGlgAZyt";
  function threadId() {
    var t = null;
    try { t = localStorage.getItem("sm-thread"); } catch (e) {}
    if (!t) {
      t = (crypto.randomUUID ? crypto.randomUUID() :
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
        }));
      try { localStorage.setItem("sm-thread", t); } catch (e) {}
    }
    return t;
  }
  function escText(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function loadThread(box) {
    var thread = box.querySelector("[data-thread]");
    if (!thread) return;
    fetch(SB_URL.replace("/study_messages", "") + "/rpc/get_thread_messages", {
        method: "POST",
        headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ p_thread: threadId() })
      })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        if (!rows.length) return;
        thread.hidden = false;
        var html = '<div class="thread-title">Your doubt thread</div>';
        rows.forEach(function (m) {
          var when = new Date(m.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
          html += '<div class="msg ' + (m.author === "helper" ? "helper" : "visitor") + '">' +
            (m.author === "helper" ? "<b>Study Materials helper</b> " : "") + escText(m.body) +
            "<small>" + when + "</small></div>";
        });
        thread.innerHTML = html;
      }).catch(function () {});
  }
  document.querySelectorAll(".chat-form").forEach(function (form) {
    var box = form.parentElement;
    var status = box.querySelector(".chat-status");
    var btn = form.querySelector(".chat-send");
    loadThread(box);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.message.value.trim();
      if (!msg) { status.textContent = "Type something first."; status.className = "chat-status"; return; }
      if (form.company.value) { /* honeypot: pretend success, send nothing */
        form.reset(); status.textContent = "Sent! Anas will see it."; status.className = "chat-status ok"; return;
      }
      btn.disabled = true; status.textContent = "Sending..."; status.className = "chat-status";
      var sbOk = false, fsOk = false;
      var done = function () {
        form.reset();
        status.textContent = "Sent! Anas will see it." + (sbOk ? " Replies will appear below on this device." : "");
        status.className = "chat-status ok";
        btn.disabled = false;
        if (sbOk) setTimeout(function () { loadThread(box); }, 600);
      };
      var fail = function () {
        status.textContent = "Could not send - check your connection and try again.";
        status.className = "chat-status";
        btn.disabled = false;
      };
      var p1 = fetch(SB_URL, {
        method: "POST",
        headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ thread: threadId(), author: "visitor", body: msg.slice(0, 2000) })
      }).then(function (r) { sbOk = r.ok; }).catch(function () {});
      var p2 = fetch("https://formsubmit.co/ajax/ea3d39c1c06bc783ddf0ca43491dd14d", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          _subject: "Study Materials site - doubt/message",
          message: msg,
          thread: threadId(),
          page: location.pathname,
          _captcha: "false"
        })
      }).then(function (r) { fsOk = r.ok; }).catch(function () {});
      Promise.all([p1, p2]).then(function () { (sbOk || fsOk) ? done() : fail(); });
    });
  });
  /* ---- PWA: offline cache ---- */
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(function () {});
    });
  }
})();
