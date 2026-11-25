// Walkthrough player: six scenes, auto-advance, click a step to jump. Pauses when off screen or tab hidden.
(function () {
  const demo = document.getElementById("demo");
  if (!demo) return;
  const scenes = [...demo.querySelectorAll(".sc")];
  const btns = [...demo.querySelectorAll("#demo-steps button")];
  const tabOf = [0, 1, 1, 1, 2, 3];
  const dur = [6000, 7500, 6500, 5500, 5500, 6000];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cur = -1, timer = null, visible = true;

  function show(i) {
    cur = i;
    demo.dataset.tab = tabOf[i];
    scenes.forEach((s, k) => {
      const on = k === i;
      s.classList.remove("on");
      s.setAttribute("aria-hidden", on ? "false" : "true");
      if (on) { void s.offsetWidth; s.classList.add("on"); }
    });
    btns.forEach((b, k) => {
      b.classList.toggle("past", k < i);
      if (k === i) {
        b.removeAttribute("aria-current"); void b.offsetWidth;
        b.setAttribute("aria-current", "true");
        b.style.setProperty("--dur", dur[i] + "ms");
      } else b.removeAttribute("aria-current");
    });
    clearTimeout(timer);
    if (!reduce && visible && !document.hidden) timer = setTimeout(() => show((cur + 1) % scenes.length), dur[i]);
  }

  btns.forEach((b) => b.addEventListener("click", () => show(+b.dataset.go)));
  new IntersectionObserver((e) => {
    visible = e[0].isIntersecting;
    if (visible) show(Math.max(cur, 0)); else clearTimeout(timer);
  }, { threshold: 0.25 }).observe(demo);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) show(Math.max(cur, 0)); else clearTimeout(timer); });
  show(0);
})();
