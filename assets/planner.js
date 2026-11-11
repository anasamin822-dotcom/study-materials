/* Study planner: exam date + subjects -> day-by-day plan, progress-aware. */
(function () {
  var SUBJECTS = window.SM_SUBJECTS || [];
  var examSel = document.getElementById("pl-exam");
  var customDate = document.getElementById("pl-custom");
  var subjBox = document.getElementById("pl-subjects");
  var makeBtn = document.getElementById("pl-make");
  var planBox = document.getElementById("pl-plan");
  var todayBox = document.getElementById("pl-today");
  if (!examSel || !subjBox) return;

  var ticks = {};
  try { ticks = JSON.parse(localStorage.getItem("sm-plan-ticks") || "{}"); } catch (e) {}
  function saveTicks() { try { localStorage.setItem("sm-plan-ticks", JSON.stringify(ticks)); } catch (e) {} }

  function watched(slug) {
    try { return JSON.parse(localStorage.getItem("ciehub:" + slug) || "{}"); } catch (e) { return {}; }
  }
  function topicDone(slug, t) {
    if (!t.v.length) return false; /* notes-only topics count as todo */
    var w = watched(slug);
    return t.v.every(function (id) { return !!w[id]; });
  }

  /* subject checkboxes */
  SUBJECTS.forEach(function (s, i) {
    var lab = document.createElement("label");
    lab.className = "pl-chip";
    var cb = document.createElement("input");
    cb.type = "checkbox"; cb.value = s.slug;
    if (i < 6) cb.checked = true; /* sem III subjects on by default */
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(" " + s.code));
    subjBox.appendChild(lab);
  });

  examSel.addEventListener("change", function () {
    customDate.hidden = examSel.value !== "custom";
    if (!customDate.hidden) customDate.focus();
  });

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function fmtDay(d) {
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  }

  function build() {
    var examStr = examSel.value === "custom" ? customDate.value : examSel.value;
    if (!examStr) { planBox.innerHTML = '<p class="pl-msg">Pick an exam date first.</p>'; return; }
    var exam = new Date(examStr + "T09:00:00");
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var days = Math.round((exam - today) / 86400000); /* days left, not counting exam day */
    if (days < 1) { planBox.innerHTML = '<p class="pl-msg">That exam is here already - revise your short notes today. All the best!</p>'; todayBox.hidden = true; return; }

    var chosen = SUBJECTS.filter(function (s) {
      return subjBox.querySelector('input[value="' + s.slug + '"]').checked;
    });
    if (!chosen.length) { planBox.innerHTML = '<p class="pl-msg">Pick at least one subject.</p>'; todayBox.hidden = true; return; }

    /* gather unfinished topics, unit order kept */
    var todo = [];
    chosen.forEach(function (s) {
      s.units.forEach(function (u) {
        u.topics.forEach(function (t) {
          var key = s.slug + "|" + t.n;
          if (!topicDone(s.slug, t)) todo.push({ key: key, subj: s.name, code: s.code, unit: u.t, name: t.n });
        });
      });
    });
    if (!todo.length) {
      planBox.innerHTML = '<p class="pl-msg">Everything is already ticked for these subjects - revise notes and do model papers now.</p>';
      todayBox.hidden = true; return;
    }

    var perDay = Math.max(1, Math.ceil(todo.length / days));
    var html = "";
    var idx = 0;
    var todayKey = today.toISOString().slice(0, 10);
    var todayItems = [];
    for (var d = 0; d < days && idx < todo.length; d++) {
      var date = new Date(today.getTime() + d * 86400000);
      var isToday = d === 0;
      var dayItems = [];
      var target = perDay;
      /* last day lighter: it is revision day */
      if (d === days - 1 && todo.length - idx > perDay) target = perDay; /* normal load, exam eve */
      while (target-- > 0 && idx < todo.length) { dayItems.push(todo[idx]); idx++; }
      var dayId = date.toISOString().slice(0, 10);
      html += '<div class="pl-day' + (isToday ? " today" : "") + '"><div class="pl-day-head">' +
        (isToday ? "Today - " : "") + fmtDay(date) +
        '<span>' + dayItems.length + (dayItems.length === 1 ? " topic" : " topics") + "</span></div><ul>";
      dayItems.forEach(function (it) {
        var k = dayId + "|" + it.key;
        var done = ticks[k];
        html += '<li class="' + (done ? "done" : "") + '"><label><input type="checkbox" data-k="' + esc(k) + '"' + (done ? " checked" : "") + "> " +
          "<span><b>" + esc(it.code) + "</b> - " + esc(it.name) + ' <small>(' + esc(it.unit) + ")</small></span></label></li>";
        if (isToday) todayItems.push({ k: k, done: done, code: it.code, name: it.name });
      });
      html += "</ul></div>";
    }
    if (idx < todo.length) {
      html += '<p class="pl-msg">' + (todo.length - idx) + " topics did not fit before the exam - add days or fewer subjects, or accept a heavier load (" + Math.ceil(todo.length / days) + "/day already).</p>";
    }
    html += '<p class="pl-msg small">Done watching? Tick videos on the subject page - this plan skips finished topics when you regenerate.</p>';
    planBox.innerHTML = html;

    /* today card */
    if (todayItems.length) {
      var left = todayItems.filter(function (i) { return !i.done; }).length;
      todayBox.hidden = false;
      todayBox.innerHTML = '<div class="pl-today-inner"><div class="pl-today-title">Today&#8217;s focus</div>' +
        '<div class="pl-today-count">' + left + " of " + todayItems.length + " topics left today</div></div>";
    } else { todayBox.hidden = true; }

    planBox.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener("change", function () {
        ticks[cb.getAttribute("data-k")] = cb.checked;
        saveTicks();
        cb.closest("li").classList.toggle("done", cb.checked);
        build(); /* refresh today counter */
      });
    });
  }

  makeBtn.addEventListener("click", build);
})();
