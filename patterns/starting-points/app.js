(() => {
  "use strict";

  const form = document.getElementById("starter-form");
  const frame = document.getElementById("starter-preview-frame");
  const openLink = document.getElementById("starter-open");
  const copyButton = document.getElementById("starter-copy");
  const codeOutput = document.getElementById("starter-code-output");
  const codeReadout = document.getElementById("starter-code-readout");
  const previewReadout = document.getElementById("starter-preview-readout");
  const params = new URLSearchParams(window.location.search);
  const theme = ["dark", "light"].includes(params.get("theme")) ? params.get("theme") : "dark";
  const material = ["ultrathin", "regular", "thick", "solid-plate"].includes(params.get("material"))
    ? params.get("material")
    : "ultrathin";
  const density = ["spacious", "balanced", "compact"].includes(params.get("density"))
    ? params.get("density")
    : "balanced";
  document.documentElement.dataset.garyTheme = theme;
  document.documentElement.dataset.garyDensity = density;
  document.documentElement.dataset.garyMaterial = material;

  const shellLabels = {
    board: "看板",
    "scroll-report": "滚动演示汇报",
    "web-ui": "Web UI"
  };
  const pageLabels = {
    "report-cover": "报告封面",
    "image-page": "图像页",
    "data-page": "数据页",
    "manual-toc": "手册目录"
  };

  function selection() {
    return {
      application: form.elements["starter-application"].value,
      page: form.elements["starter-page"].value
    };
  }

  function materialClasses(value) {
    return value === "solid-plate"
      ? "gary-solid-plate"
      : `gary-glass gary-${value}`;
  }

  function previewUrl({ application, page }) {
    const url = new URL("./preview.html", document.baseURI);
    url.searchParams.set("application", application);
    url.searchParams.set("page", page);
    url.searchParams.set("theme", theme);
    url.searchParams.set("material", material);
    url.searchParams.set("density", density);
    return url;
  }

  function starterCode({ application, page }) {
    const assetRoot = new URL("../../", document.baseURI);
    const assetUrl = (path) => new URL(path, assetRoot).href;
    return `<!doctype html>
<html lang="zh-CN"
  data-gary-theme="${theme}"
  data-gary-density="${density}"
  data-gary-material="${material}"
  data-gary-application-mode="${application}"
  data-gary-page-mode="${page}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gary-UI · ${shellLabels[application]} ${pageLabels[page]}</title>
  <link rel="stylesheet" href="${assetUrl("tokens/base.css")}">
</head>
<body class="gary-ui gary-scene" data-gary-scene-engine="dot-grid">
  <nav class="gary-web-bar gary-glass gary-ultrathin" aria-label="主导航">
    <strong class="gary-web-bar__brand">${shellLabels[application]}</strong>
    <div class="gary-web-bar__nav"><a aria-current="page" href="#">${pageLabels[page]}</a></div>
  </nav>
  <main data-gary-ui>
    <section class="gary-glass-card ${materialClasses(material)}"${material === "solid-plate" ? '' : ' data-gary-material="glass" data-gary-refraction'}>
      <!-- 使用既有 Gary 组件组合 ${pageLabels[page]}，不要复制组件 CSS。 -->
    </section>
  </main>
  <script src="${assetUrl("patterns/shared/dot-grid.js")}"></script>
  <script src="${assetUrl("patterns/shared/icons.js")}"></script>
  <script src="${assetUrl("patterns/shared/material.js")}"></script>
  <script src="${assetUrl("patterns/shared/optical-glass.js")}"></script>
</body>
</html>`;
  }

  function render() {
    const current = selection();
    const url = previewUrl(current);
    frame.src = url.href;
    openLink.href = url.href;
    const compact = `${current.application} + ${current.page} + ${material}`;
    codeReadout.textContent = compact;
    previewReadout.textContent = `${current.application} × ${current.page} · ${material}`;
    codeOutput.textContent = starterCode(current);
  }

  form.addEventListener("change", render);
  copyButton.addEventListener("click", async () => {
    const text = codeOutput.textContent;
    try {
      await navigator.clipboard.writeText(text);
      GaryIcons.set(copyButton, "check", "已复制骨架");
    } catch (_error) {
      const range = document.createRange();
      range.selectNodeContents(codeOutput);
      const selectionApi = window.getSelection();
      selectionApi.removeAllRanges();
      selectionApi.addRange(range);
      GaryIcons.set(copyButton, "copy", "已选中，请复制");
    }
    window.setTimeout(() => {
      GaryIcons.set(copyButton, "copy", "复制起手骨架");
    }, 1600);
  });

  render();
})();
