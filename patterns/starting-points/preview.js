(() => {
  "use strict";

  const root = document.documentElement;
  const params = new URLSearchParams(window.location.search);
  const applications = {
    board: "看板",
    "scroll-report": "滚动演示汇报",
    "web-ui": "Web UI"
  };
  const pages = {
    "report-cover": "报告封面",
    "image-page": "图像页",
    "data-page": "数据页",
    "manual-toc": "手册目录"
  };
  const themes = ["dark", "light"];
  const materials = ["ultrathin", "regular", "thick", "solid-plate"];
  const densities = ["spacious", "balanced", "compact"];

  const application = Object.hasOwn(applications, params.get("application"))
    ? params.get("application")
    : "board";
  const page = Object.hasOwn(pages, params.get("page"))
    ? params.get("page")
    : "report-cover";
  const theme = themes.includes(params.get("theme")) ? params.get("theme") : "dark";
  const material = materials.includes(params.get("material")) ? params.get("material") : "ultrathin";
  const density = densities.includes(params.get("density")) ? params.get("density") : "balanced";

  root.dataset.garyTheme = theme;
  root.dataset.garyDensity = density;
  root.dataset.garyMaterial = material;
  root.dataset.garyApplicationMode = application;
  root.dataset.garyPageMode = page;

  document.querySelectorAll("[data-shell-label]").forEach((node) => {
    node.textContent = applications[application];
  });
  document.querySelectorAll("[data-page-label]").forEach((node) => {
    node.textContent = pages[page];
  });

  const content = document.querySelector("[data-page-content]");
  const template = document.getElementById(`page-${page}`);
  content.replaceChildren(template.content.cloneNode(true));

  document.querySelectorAll("[data-tunable-surface]").forEach((surface) => {
    surface.classList.remove(
      "gary-glass",
      "gary-ultrathin",
      "gary-regular",
      "gary-thick",
      "gary-solid-plate"
    );
    if (material === "solid-plate") {
      surface.classList.add("gary-solid-plate");
    } else {
      surface.classList.add("gary-glass", `gary-${material}`);
    }
  });
})();
