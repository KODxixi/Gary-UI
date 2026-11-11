(() => {
  "use strict";

  const body = document.body;
  const pages = Array.from(document.querySelectorAll("[data-page-index]"));
  const pageButtons = Array.from(document.querySelectorAll("[data-page-target]"));
  const modeButtons = Array.from(document.querySelectorAll("[data-report-mode-target]"));
  const sourceDrawer = document.querySelector("[data-source-drawer]");
  const openSources = document.querySelector("[data-open-sources]");
  const closeSources = document.querySelector("[data-close-sources]");
  const mobile = window.matchMedia("(max-width: 720px)");
  let activeIndex = 0;

  function clampIndex(index) {
    return Math.max(0, Math.min(pages.length - 1, Number(index) || 0));
  }

  function syncActiveState() {
    pages.forEach((page, index) => {
      page.classList.toggle("is-active", index === activeIndex);
    });
    pageButtons.forEach((button) => {
      const active = Number(button.dataset.pageTarget) === activeIndex;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function setActivePage(index, options = {}) {
    activeIndex = clampIndex(index);
    syncActiveState();
    if (body.dataset.reportMode === "reading" && options.scroll !== false) {
      pages[activeIndex]?.scrollIntoView({
        behavior: options.smooth === false ? "auto" : "smooth",
        block: "start",
      });
    }
    return activeIndex;
  }

  function setMode(mode) {
    const nextMode = mode === "presentation" && !mobile.matches ? "presentation" : "reading";
    body.dataset.reportMode = nextMode;
    modeButtons.forEach((button) => {
      const active = button.dataset.reportModeTarget === nextMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    syncActiveState();
    if (nextMode === "reading") {
      requestAnimationFrame(() => {
        pages[activeIndex]?.scrollIntoView({ behavior: "auto", block: "start" });
      });
    }
    return nextMode;
  }

  function setSourcesOpen(open) {
    if (!sourceDrawer || !openSources) return;
    sourceDrawer.classList.toggle("is-open", open);
    sourceDrawer.setAttribute("aria-hidden", String(!open));
    openSources.setAttribute("aria-expanded", String(open));
    if (open) closeSources?.focus();
    else openSources.focus();
  }

  pageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActivePage(Number(button.dataset.pageTarget), { smooth: false });
    });
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.reportModeTarget));
  });

  openSources?.addEventListener("click", () => setSourcesOpen(true));
  closeSources?.addEventListener("click", () => setSourcesOpen(false));

  const observer = new IntersectionObserver((entries) => {
    if (body.dataset.reportMode !== "reading") return;
    const candidate = entries
      .filter((entry) => entry.isIntersecting)
      .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
    if (!candidate) return;
    activeIndex = clampIndex(candidate.target.dataset.pageIndex);
    syncActiveState();
  }, {
    rootMargin: "-18% 0px -48% 0px",
    threshold: [0.05, 0.25, 0.5],
  });

  pages.forEach((page) => observer.observe(page));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sourceDrawer?.classList.contains("is-open")) {
      setSourcesOpen(false);
      return;
    }
    if (body.dataset.reportMode !== "presentation") return;
    if (event.target instanceof HTMLElement && event.target.closest("button, a, input, textarea, select")) return;
    if (["ArrowRight", "ArrowDown", "PageDown"].includes(event.key)) {
      event.preventDefault();
      setActivePage(activeIndex + 1, { scroll: false });
    } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      setActivePage(activeIndex - 1, { scroll: false });
    } else if (event.key === "Escape") {
      setMode("reading");
    }
  });

  mobile.addEventListener("change", () => {
    if (mobile.matches && body.dataset.reportMode === "presentation") setMode("reading");
  });

  window.GaryDecisionReportRecipe = Object.freeze({
    setActivePage,
    setMode,
    next: () => setActivePage(activeIndex + 1, { scroll: false }),
    previous: () => setActivePage(activeIndex - 1, { scroll: false }),
  });

  syncActiveState();
})();
