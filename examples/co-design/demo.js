(() => {
  "use strict";

  const root = document.documentElement;
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const filterItems = Array.from(document.querySelectorAll("[data-category]"));
  const filterStatus = document.querySelector("[data-filter-status]");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((candidate) => {
        candidate.setAttribute("aria-pressed", String(candidate === button));
      });
      let visible = 0;
      filterItems.forEach((item) => {
        const show = filter === "all" || item.dataset.category === filter;
        item.classList.toggle("is-filtered-out", !show);
        if (show) visible += 1;
      });
      if (filterStatus) {
        filterStatus.textContent = `当前显示 ${visible} 项`;
      }
    });
  });

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = root.getAttribute("data-gary-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-gary-theme", next);
      button.setAttribute("aria-pressed", String(next === "light"));
      button.textContent = next === "light" ? "切换深色" : "切换浅色";
    });
  });

  document.querySelectorAll("[data-scroll-target]").forEach((control) => {
    control.addEventListener("click", (event) => {
      const target = document.getElementById(control.dataset.scrollTarget);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ block: "start" });
      target.focus({ preventScroll: true });
    });
  });
})();
