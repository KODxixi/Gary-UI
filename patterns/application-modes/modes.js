(() => {
  "use strict";

  const root = document.documentElement;
  const params = new URLSearchParams(window.location.search);
  const validThemes = ["dark", "light"];
  const validMaterials = ["ultrathin", "regular", "thick", "solid-plate"];
  const validDensities = ["spacious", "balanced", "compact"];
  const materialClasses = ["gary-ultrathin", "gary-regular", "gary-thick", "gary-solid-plate"];

  function applySettings() {
    const theme = validThemes.includes(params.get("theme")) ? params.get("theme") : "dark";
    const material = validMaterials.includes(params.get("material")) ? params.get("material") : "regular";
    const density = validDensities.includes(params.get("density")) ? params.get("density") : "balanced";
    root.dataset.garyTheme = theme;
    root.dataset.garyDensity = density;

    document.querySelectorAll("[data-tunable-surface]").forEach((surface) => {
      surface.classList.remove(...materialClasses);
      if (material === "solid-plate") {
        surface.classList.remove("gary-glass");
        surface.classList.add("gary-solid-plate");
      } else {
        surface.classList.add("gary-glass", `gary-${material}`);
      }
    });
  }

  function selectWithin(group, activeButton) {
    group.querySelectorAll("button").forEach((button) => {
      const active = button === activeButton;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function bindSelectionGroups() {
    document.querySelectorAll("[data-select-group]").forEach((group) => {
      group.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
          selectWithin(group, button);
          if (button.dataset.range) {
            root.dataset.rangeState = button.dataset.range;
            const readout = document.querySelector("[data-range-readout]");
            if (readout) readout.textContent = button.dataset.range === "month" ? "近 30 天" : "本周";
          }
        });
      });
    });
  }

  function bindReportProgress() {
    const report = document.querySelector("[data-report]");
    if (!report) return;
    const sections = Array.from(document.querySelectorAll("[data-report-section]"));
    const links = Array.from(document.querySelectorAll("[data-report-link]"));
    const presentationToggle = document.querySelector("[data-presentation-toggle]");
    let currentIndex = 0;

    const update = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
      root.style.setProperty("--report-progress", `${progress}%`);

      let current = sections[0];
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= window.innerHeight * .46) current = section;
      });
      currentIndex = Math.max(0, sections.indexOf(current));
      links.forEach((link) => {
        const active = link.getAttribute("href") === `#${current.id}`;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    if (presentationToggle) {
      const setPresentation = (active) => {
        document.body.classList.toggle("is-presentation", active);
        presentationToggle.setAttribute("aria-pressed", String(active));
        GaryIcons.set(presentationToggle, active ? "minimize" : "monitor", active ? "退出演示" : "演示视图");
      };

      presentationToggle.addEventListener("click", () => {
        setPresentation(!document.body.classList.contains("is-presentation"));
      });
      setPresentation(document.body.classList.contains("is-presentation"));

      document.addEventListener("keydown", (event) => {
        if (!document.body.classList.contains("is-presentation")) return;
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.target instanceof HTMLElement && event.target.closest("input, select, textarea, [contenteditable='true']")) return;

        const direction = ["ArrowDown", "PageDown"].includes(event.key)
          ? 1
          : ["ArrowUp", "PageUp"].includes(event.key)
            ? -1
            : 0;
        if (!direction) return;

        event.preventDefault();
        currentIndex = Math.min(sections.length - 1, Math.max(0, currentIndex + direction));
        sections[currentIndex]?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    update();
  }

  function bindFilterForms() {
    document.querySelectorAll("[data-filter-form]").forEach((form) => {
      form.addEventListener("submit", (event) => event.preventDefault());
    });
  }

  function bindWebUi() {
    const form = document.querySelector("[data-webui-form]");
    const toast = document.querySelector("[data-webui-toast]");
    if (!form || !toast) return;
    let toastTimer = 0;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      toast.classList.add("is-visible");
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
    });

    document.querySelectorAll("[data-open-item]").forEach((button) => {
      button.addEventListener("click", () => {
        const title = button.closest(".webui-result")?.querySelector("h2")?.textContent;
        const target = document.querySelector("[data-inspector-title]");
        if (title && target) target.textContent = title;
      });
    });
  }

  applySettings();
  bindSelectionGroups();
  bindReportProgress();
  bindFilterForms();
  bindWebUi();
})();
