/* Sets palette + light/dark before first paint.
   ?palette=p1|p2|p3 and ?mode=light|dark in the URL win (used by the palette preview);
   otherwise the saved choice from localStorage applies. */
(function () {
  var d = document.documentElement;
  var q = new URLSearchParams(location.search);
  var p = q.get("palette");
  if (p === "p1" || p === "p2" || p === "p3") d.setAttribute("data-palette", p);
  var m = q.get("mode");
  if (m !== "light" && m !== "dark") {
    try { m = localStorage.getItem("sm-mode"); } catch (e) {}
  }
  if (m !== "light" && m !== "dark") m = "light";
  d.setAttribute("data-mode", m);
})();
