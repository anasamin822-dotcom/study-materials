/* Stage-1 features: search, bookmarks, share links, progress ring,
   streak, pomodoro, confetti, palette picker, keyboard shortcuts. */
(function () {
  "use strict";
  var SUBJECTS = window.SM_SUBJECTS || [];
  var slug = document.body.getAttribute("data-slug") || "";
  var page = document.body.getAttribute("data-page") || "";
  function ls(k, v) {
    if (v === undefined) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    try { localStorage.setItem(k, v); } catch (e) {}
  }
  function lsj(k, d) { try { return JSON.parse(ls(k) || "null") || d; } catch (e) { return d; } }
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function toast(msg) {
    var t = document.querySelector(".sm-toast");
    if (!t) { t = document.createElement("div"); t.className = "sm-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ---------- palette picker ---------- */
  var pal = document.documentElement.getAttribute("data-palette") || "p1";
  document.querySelectorAll(".pal-dots [data-pal]").forEach(function (b) {
    b.classList.toggle("on", b.getAttribute("data-pal") === pal);
    b.addEventListener("click", function () {
      document.documentElement.setAttribute("data-palette", b.getAttribute("data-pal"));
      ls("sm-palette", b.getAttribute("data-pal"));
      document.querySelectorAll(".pal-dots [data-pal]").forEach(function (x) { x.classList.toggle("on", x === b); });
    });
  });

  /* ---------- streak (any page visit counts once per day) ---------- */
  (function () {
    var s = lsj("sm-streak", { n: 0, last: "" });
    var today = new Date().toDateString();
    if (s.last !== today) {
      var y = new Date(Date.now() - 86400000).toDateString();
      s.n = (s.last === y) ? s.n + 1 : 1;
      s.last = today;
      ls("sm-streak", JSON.stringify(s));
    }
    var chip = document.querySelector("[data-streak]");
    if (chip && s.n > 0) { chip.hidden = false; chip.querySelector("b").textContent = s.n; }
  })();

  /* ---------- search ---------- */
  var idx = [];
  SUBJECTS.forEach(function (s) {
    s.units.forEach(function (u) {
      u.topics.forEach(function (t) {
        if (t.vids && t.vids.length) {
          t.vids.forEach(function (v) {
            idx.push({ kind: "video", title: v.t, sub: s.code, ch: v.c, url: v.u, anchor: "subjects/" + s.slug + ".html#" + t.a });
          });
        } else {
          idx.push({ kind: "notes", title: t.n, sub: s.code, ch: "self-taught notes", url: "", anchor: "subjects/" + s.slug + ".html#" + t.a });
        }
        idx.push({ kind: "topic", title: t.n, sub: s.code, ch: u.t, url: "", anchor: "subjects/" + s.slug + ".html#" + t.a });
      });
    });
  });
  var input = document.querySelector("[data-search]");
  var drop = document.querySelector("[data-drop]");
  function basePrefix() { return slug ? "../" : ""; }
  if (input && drop) {
    var sel = -1;
    function close() { drop.hidden = true; sel = -1; }
    function render(q) {
      var ql = q.toLowerCase();
      var words = ql.split(/\s+/).filter(Boolean);
      var hits = idx.filter(function (it) {
        var hay = (it.title + " " + it.sub + " " + it.ch).toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) !== -1; });
      }).slice(0, 8);
      if (!hits.length) { drop.innerHTML = '<div class="sd-none">No matches - try another word.</div>'; drop.hidden = false; return; }
      drop.innerHTML = hits.map(function (h, i) {
        var href = h.kind === "video" ? h.url : basePrefix() + h.anchor;
        var ext = h.kind === "video" ? ' target="_blank" rel="noopener"' : "";
        return '<a class="sd-item" data-i="' + i + '" href="' + esc(href) + '"' + ext + '>' +
          '<span class="sd-kind">' + h.kind + "</span><span class=\"sd-t\">" + esc(h.title) + "</span>" +
          '<span class="sd-s">' + esc(h.sub) + " &middot; " + esc(h.ch) + "</span></a>";
      }).join("");
      drop.hidden = false; sel = -1;
    }
    input.addEventListener("input", function () {
      var q = input.value.trim();
      if (q.length < 2) { close(); return; }
      render(q);
    });
    input.addEventListener("keydown", function (e) {
      var items = drop.querySelectorAll(".sd-item");
      if (e.key === "Escape") { close(); input.blur(); }
      else if (e.key === "ArrowDown" && items.length) { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); }
      else if (e.key === "ArrowUp" && items.length) { e.preventDefault(); sel = Math.max(sel - 1, 0); }
      else if (e.key === "Enter" && sel >= 0 && items[sel]) { e.preventDefault(); items[sel].click(); }
      else return;
      items.forEach(function (it, i) { it.classList.toggle("sel", i === sel); });
      if (items[sel]) items[sel].scrollIntoView({ block: "nearest" });
    });
    document.addEventListener("click", function (e) { if (!drop.contains(e.target) && e.target !== input) close(); });
  }

  /* ---------- bookmarks ---------- */
  var bmks = lsj("sm-bookmarks", {});
  function paintBmk() {
    document.querySelectorAll(".bmk").forEach(function (b) {
      var id = b.getAttribute("data-bmk").split("|")[3];
      b.classList.toggle("on", !!bmks[id]);
    });
  }
  document.querySelectorAll(".bmk").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = b.getAttribute("data-bmk").split("|");
      var id = p[3];
      if (bmks[id]) { delete bmks[id]; toast("Bookmark removed"); }
      else { bmks[id] = { t: p[0], u: p[1], c: p[2], s: p[4] }; toast("Bookmarked - see hub page"); }
      ls("sm-bookmarks", JSON.stringify(bmks));
      paintBmk();
    });
  });
  paintBmk();

  /* hub: saved section */
  var savedSec = document.querySelector("[data-saved-section]");
  if (savedSec) {
    var ids = Object.keys(bmks);
    if (ids.length) {
      savedSec.hidden = false;
      var grid = savedSec.querySelector("[data-saved-grid]");
      grid.innerHTML = ids.map(function (id) {
        var b = bmks[id];
        return '<a class="card" style="--card-accent:var(--accent)" href="' + esc(b.u) + '" target="_blank" rel="noopener">' +
          '<span class="chip">' + esc(b.s.toUpperCase()) + "</span><h3 style=\"font-size:17px\">" + esc(b.t) + "</h3>" +
          "<p>" + esc(b.c) + '</p><div class="meta"><span>Saved video</span><span class="go">Watch &rarr;</span></div></a>';
      }).join("");
    }
  }

  /* ---------- share topic link ---------- */
  document.querySelectorAll(".tshare").forEach(function (b) {
    b.addEventListener("click", function () {
      var url = location.origin + location.pathname + "#" + b.getAttribute("data-anchor");
      function done() { toast("Topic link copied"); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done);
      else {
        var ta = document.createElement("textarea"); ta.value = url; document.body.appendChild(ta);
        ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); done();
      }
    });
  });
  /* open shared anchor */
  if (location.hash) {
    var el = document.querySelector(location.hash.replace(/[^#\w-]/g, ""));
    if (el) setTimeout(function () { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); }, 400);
  }

  /* ---------- progress ring + confetti ---------- */
  var ringFg = document.querySelector("[data-ring-fg]");
  function updateRing(pct) {
    if (!ringFg) return;
    var C = 2 * Math.PI * 36;
    ringFg.style.strokeDasharray = C;
    ringFg.style.strokeDashoffset = C * (1 - pct / 100);
    var lbl = document.querySelector("[data-ring-pct]");
    if (lbl) lbl.textContent = pct + "%";
    if (pct === 100 && slug) {
      var key = "sm-confetti-" + slug;
      if (!ls(key)) { ls(key, "1"); confetti(); toast("Subject complete - well done!"); }
    }
  }
  window.smUpdateRing = updateRing;
  function confetti() {
    var cv = document.createElement("canvas");
    cv.className = "confetti-canvas"; document.body.appendChild(cv);
    var ctx = cv.getContext("2d");
    cv.width = innerWidth; cv.height = innerHeight;
    var colors = ["#FFC900", "#CDF22B", "#FF6845", "#7CC7FF", "#ffffff"];
    var ps = [];
    for (var i = 0; i < 90; i++) ps.push({
      x: innerWidth / 2, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 14, vy: Math.random() * -11 - 3,
      s: Math.random() * 7 + 3, c: colors[i % colors.length], r: Math.random() * Math.PI
    });
    var frames = 0;
    (function tick() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.r += 0.1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      });
      if (++frames < 110) requestAnimationFrame(tick); else cv.remove();
    })();
  }

  /* ---------- pomodoro ---------- */
  var pomoBtn = document.createElement("button");
  pomoBtn.className = "pomo-btn"; pomoBtn.type = "button";
  pomoBtn.setAttribute("aria-label", "Pomodoro timer");
  pomoBtn.innerHTML = "&#9202;";
  var pomoPanel = document.createElement("div");
  pomoPanel.className = "pomo-panel"; pomoPanel.hidden = true;
  pomoPanel.innerHTML = '<div class="pomo-time" data-pomo-time>25:00</div>' +
    '<div class="pomo-actions"><button type="button" data-pomo-start>Start</button>' +
    '<button type="button" data-pomo-reset>Reset</button></div>' +
    '<div class="pomo-note">25 min focus, then a 5 min break.</div>';
  document.body.appendChild(pomoBtn); document.body.appendChild(pomoPanel);
  var pomo = { left: 25 * 60, running: false, handle: null };
  var timeEl = pomoPanel.querySelector("[data-pomo-time]");
  function paintPomo() {
    var m = Math.floor(pomo.left / 60), s = pomo.left % 60;
    timeEl.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  pomoBtn.addEventListener("click", function () { pomoPanel.hidden = !pomoPanel.hidden; });
  pomoPanel.querySelector("[data-pomo-start]").addEventListener("click", function (e) {
    if (pomo.running) { clearInterval(pomo.handle); pomo.running = false; e.target.textContent = "Start"; return; }
    pomo.running = true; e.target.textContent = "Pause";
    pomo.handle = setInterval(function () {
      pomo.left--;
      if (pomo.left <= 0) {
        clearInterval(pomo.handle); pomo.running = false;
        pomoPanel.querySelector("[data-pomo-start]").textContent = "Start";
        pomo.left = 25 * 60;
        toast("Time! Take a 5 minute break.");
        if (navigator.vibrate) try { navigator.vibrate([120, 60, 120]); } catch (err) {}
      }
      paintPomo();
    }, 1000);
  });
  pomoPanel.querySelector("[data-pomo-reset]").addEventListener("click", function () {
    clearInterval(pomo.handle); pomo.running = false; pomo.left = 25 * 60;
    pomoPanel.querySelector("[data-pomo-start]").textContent = "Start"; paintPomo();
  });
  paintPomo();

  /* ---------- keyboard shortcuts ---------- */
  var help = document.createElement("div");
  help.className = "kbd-help"; help.hidden = true;
  help.innerHTML = '<div class="kbd-card"><b>Shortcuts</b>' +
    "<span><kbd>/</kbd> search</span><span><kbd>t</kbd> light / dark</span>" +
    "<span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> palettes</span><span><kbd>?</kbd> this help</span>" +
    '<span class="kbd-close">Esc to close</span></div>';
  document.body.appendChild(help);
  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input, textarea, select")) return;
    if (e.key === "/" && input) { e.preventDefault(); input.focus(); }
    else if (e.key === "t") { var mt = document.querySelector(".mode-toggle"); if (mt) mt.click(); }
    else if (e.key === "?") { help.hidden = !help.hidden; }
    else if (e.key === "Escape") { help.hidden = true; pomoPanel.hidden = true; }
    else if (e.key >= "1" && e.key <= "3") {
      var pb = document.querySelector('.pal-dots [data-pal="p' + e.key + '"]');
      if (pb) pb.click();
    }
  });

  /* ring init: read current progress after app.js has restored ticks */
  function currentPct() {
    var pills = document.querySelectorAll(".pill[data-vid]");
    if (!pills.length) return null;
    var done = document.querySelectorAll(".pill[data-vid].done").length;
    return Math.round((done / pills.length) * 100);
  }
  var firstPct = currentPct();
  if (firstPct !== null) updateRing(firstPct);
  /* keep ring in sync with ticks (app.js updates the bar; poll lightly) */
  if (ringFg) {
    var obs = new MutationObserver(function () {
      var p = currentPct(); if (p !== null) updateRing(p);
      if (window.smMarkRevise) window.smMarkRevise();
    });
    document.querySelectorAll(".pill[data-vid]").forEach(function (p) {
      obs.observe(p, { attributes: true, attributeFilter: ["class"] });
    });
  }

  /* ---------- revision mode + print notes (subject pages) ---------- */
  var revBtn = document.querySelector("[data-revise-toggle]");
  function markRevise() {
    if (!document.body.classList.contains("revise")) {
      document.querySelectorAll(".topic.rev-hide").forEach(function (t) { t.classList.remove("rev-hide"); });
      return;
    }
    document.querySelectorAll(".topic").forEach(function (t) {
      var pills = t.querySelectorAll(".pill[data-vid]");
      var done = t.querySelectorAll(".pill[data-vid].done");
      t.classList.toggle("rev-hide", pills.length > 0 && done.length === pills.length);
    });
  }
  if (revBtn) {
    revBtn.addEventListener("click", function () {
      var on = document.body.classList.toggle("revise");
      revBtn.textContent = on ? "Revision mode: ON (unfinished only)" : "Revision mode: hide finished topics";
      markRevise();
      toast(on ? "Showing only unfinished topics" : "Showing everything");
    });
  }
  window.smMarkRevise = markRevise;
  var printBtn = document.querySelector("[data-print-notes]");
  if (printBtn) {
    printBtn.addEventListener("click", function () {
      document.querySelectorAll("details.note").forEach(function (d) { d.open = true; });
      document.body.classList.add("printing-notes");
      window.print();
      setTimeout(function () { document.body.classList.remove("printing-notes"); }, 600);
    });
  }

  /* ---------- visitor counter (privacy-safe: random token, one row per device per day) ---------- */
  (function () {
    var badge = document.querySelector("[data-visitors]");
    if (!badge) return;
    var SBV = "https://xnaakovuqweqaejeablx.supabase.co/rest/v1/study_visits";
    var KEY = "sb_publishable_v4YW_hxMSNNpYGOB9ymH_w_SGlgAZyt";
    var tok = ls("sm-vtoken");
    if (!tok) { tok = Math.random().toString(36).slice(2) + Date.now().toString(36); ls("sm-vtoken", tok); }
    var today = new Date().toISOString().slice(0, 10);
    function show() {
      fetch(SBV + "?select=id", { headers: { apikey: KEY, Authorization: "Bearer " + KEY, Prefer: "count=exact", Range: "0-0" } })
        .then(function (r) {
          var cr = r.headers.get("content-range") || "";
          var n = parseInt((cr.split("/")[1] || "0"), 10);
          if (n > 0) { badge.querySelector("b").textContent = n; badge.hidden = false; }
        }).catch(function () {});
    }
    if (ls("sm-visit-day") !== today) {
      fetch(SBV, {
        method: "POST",
        headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({ day: today, token: tok })
      }).then(function () { ls("sm-visit-day", today); show(); }).catch(show);
    } else show();
  })();
})();
