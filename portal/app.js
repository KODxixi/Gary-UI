(() => {
  "use strict";

  const root = document.documentElement;
  const byId = (id) => document.getElementById(id);
  const all = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const viewMeta = {
    overview: { kicker: "设计系统 / 概览", title: "系统总览" },
    colors: { kicker: "基础 / 01", title: "颜色" },
    typography: { kicker: "基础 / 02", title: "排版" },
    materials: { kicker: "基础 / 03", title: "材质" },
    geometry: { kicker: "基础 / 04", title: "几何与动效" },
    components: { kicker: "资源 / 组件", title: "组件画廊" },
    patterns: { kicker: "模式 / 应用", title: "应用模式" },
    demos: { kicker: "验收 / 完整 Demo", title: "六个情境页面" },
    visuals: { kicker: "资源 / 制图", title: "本地制图工具" },
    "starting-points": { kicker: "模式 / 页面", title: "页面模板" },
    "product-design": { kicker: "协作 / 实践", title: "Product Design 实验室" },
    review: { kicker: "协作 / 决策", title: "共同定稿" }
  };

  const patternMeta = {
    "report-cover": {
      order: "PATTERN 01",
      name: "报告封面",
      description: "用大标题和一个关键结论建立第一印象，适合提案与研究报告开场。",
      path: "../patterns/report-cover.html"
    },
    "image-page": {
      order: "PATTERN 02",
      name: "图像页",
      description: "让图像成为主要证据，只用独立字幕板补充一句判断。",
      path: "../patterns/image-page.html"
    },
    "data-page": {
      order: "PATTERN 03",
      name: "数据页",
      description: "以 Thick 判断卡组织结论，以 SolidPlate 承载表格和指标矩阵。",
      path: "../patterns/data-page.html"
    },
    "manual-toc": {
      order: "PATTERN 04",
      name: "手册目录",
      description: "用明确编号和章节关系建立结构，适合规范、指南与交付手册。",
      path: "../patterns/manual-toc.html"
    }
  };

  const applicationModeMeta = {
    board: {
      order: "MODE 01 · BOARD",
      name: "看板模式",
      summary: "把关键判断、证据和动作放进同一视野，用短回路支持连续决策。",
      target: "让判断、证据和动作同时可见。",
      navigation: "全局顶栏配合局部筛选与视图切换。",
      rhythm: "同屏扫描，短回路完成连续决策。",
      material: "Regular 外壳，SolidPlate 承载密集数据。",
      path: "../patterns/application-modes/board.html"
    },
    "scroll-report": {
      order: "MODE 02 · SCROLL REPORT",
      name: "滚动 / 演示汇报模式",
      summary: "同一份章节与证据既支持连续滚动阅读，也能切换为逐屏演示视图，不复制内容。",
      target: "按叙事顺序解释问题、证据与结论，并可直接用于现场演示。",
      navigation: "章节锚点配合轻量粘性导航，演示视图沿用同一章节。",
      rhythm: "连续滚动形成叙事，演示视图按屏停顿并突出结论。",
      material: "Thick 强调结论，SolidPlate 稳定长文与证据。",
      path: "../patterns/application-modes/scroll-report.html"
    },
    "web-ui": {
      order: "MODE 03 · WEB UI",
      name: "Web UI 模式",
      summary: "围绕高频任务组织持续可用的导航、控件和反馈，适合产品化交互。",
      target: "高效完成可重复的产品任务。",
      navigation: "持久顶栏配合页面级操作与状态反馈。",
      rhythm: "即时响应，任务在局部闭环中推进。",
      material: "UltraThin 导航，Regular 控件，SolidPlate 数据区。",
      path: "../patterns/application-modes/web-ui.html"
    }
  };

  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (_error) {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (_error) {
        // file:// previews may disable storage; the in-memory state still works.
      }
    }
  };

  const reviewDefaults = {
    schemaVersion: 3,
    theme: "dark",
    material: "ultrathin",
    density: "balanced",
    reactAdapterStrategy: "demand-driven",
    distributionScope: "internal",
    syncAuditCadence: "weekly",
    notes: "",
    status: "draft"
  };

  const productDesignDefaults = {
    font: "gary",
    sampleText: "让复杂信息保持清晰，让每一次设计判断都有依据。",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.68,
    letterSpacing: 0,
    layoutGap: 8,
    density: "balanced",
    cardPreset: "custom",
    cardOpacity: 70,
    cardRadius: 30,
    cardContrast: 8
  };

  const productDesignFonts = {
    gary: {
      label: "Helvetica + 微软雅黑",
      value: '"Helvetica Neue", Helvetica, Arial, "Microsoft YaHei UI", "Microsoft YaHei", "微软雅黑", sans-serif'
    },
    noto: {
      label: "Noto Sans SC",
      value: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei UI", sans-serif'
    },
    yahei: {
      label: "Microsoft YaHei UI",
      value: '"Microsoft YaHei UI", "Noto Sans SC", "PingFang SC", sans-serif'
    },
    serif: {
      label: "中文衬线",
      value: '"Songti SC", "Noto Serif SC", "SimSun", serif'
    }
  };

  const productDesignDensities = {
    spacious: { label: "宽松", surfacePadding: 32 },
    balanced: { label: "均衡", surfacePadding: 24 },
    compact: { label: "紧凑", surfacePadding: 18 }
  };

  const productDesignCardPresets = {
    "unified-glass": {
      label: "统一玻璃",
      cardOpacity: 46,
      cardRadius: 28,
      cardContrast: 6
    },
    layered: {
      label: "主次分层",
      cardOpacity: 72,
      cardRadius: 28,
      cardContrast: 12
    },
    "minimal-solid": {
      label: "极简实底",
      cardOpacity: 92,
      cardRadius: 20,
      cardContrast: 5
    }
  };

  const productDesignRecipes = {
    audit: "使用 Product Design 审查当前 GaryUI 页面。重点检查信息层级、中文排版、间距一致性、控件状态和移动端可读性；先报告问题，不要修改。",
    refine: "使用 Product Design 优化当前 GaryUI 页面。保留现有结构与视觉语言，只修正排版、间距和交互反馈；完成后打开本地预览并说明改动依据。",
    compare: "使用 Product Design 为当前 GaryUI 页面提出三个可信方向：推荐、备选、突破。保持同一内容和设计系统，只比较层级、密度与排版策略，先让我选择再实施。"
  };

  function loadReviewState() {
    try {
      const saved = JSON.parse(storage.get("gary-portal-review") || "{}");
      const savedMaterial = saved.material === "solid" ? "solid-plate" : saved.material;
      const validTheme = ["dark", "light"].includes(saved.theme);
      const validMaterial = ["ultrathin", "regular", "thick", "solid-plate"].includes(savedMaterial);
      const validDensity = ["spacious", "balanced", "compact"].includes(saved.density);
      const validReactAdapter = ["demand-driven", "full-coverage"].includes(saved.reactAdapterStrategy);
      const validDistribution = ["internal", "public"].includes(saved.distributionScope);
      const validSyncAuditCadence = ["weekly", "monthly"].includes(saved.syncAuditCadence);
      const validCoreFields = validTheme
        && validMaterial
        && validDensity
        && validReactAdapter
        && validDistribution;
      const recoverable = [2, reviewDefaults.schemaVersion].includes(saved.schemaVersion) && validCoreFields;
      return {
        schemaVersion: reviewDefaults.schemaVersion,
        theme: recoverable ? saved.theme : reviewDefaults.theme,
        material: recoverable ? savedMaterial : reviewDefaults.material,
        density: recoverable ? saved.density : reviewDefaults.density,
        reactAdapterStrategy: recoverable
          ? saved.reactAdapterStrategy
          : reviewDefaults.reactAdapterStrategy,
        distributionScope: recoverable
          ? saved.distributionScope
          : reviewDefaults.distributionScope,
        syncAuditCadence: recoverable && validSyncAuditCadence
          ? saved.syncAuditCadence
          : reviewDefaults.syncAuditCadence,
        notes: recoverable && typeof saved.notes === "string"
          ? saved.notes.slice(0, 280)
          : "",
        status: "draft"
      };
    } catch (_error) {
      return { ...reviewDefaults };
    }
  }

  const state = {
    view: "overview",
    theme: storage.get("gary-portal-theme") === "light" ? "light" : "dark",
    material: ["ultrathin", "regular", "thick", "solid-plate"].includes(
      storage.get("gary-portal-material") === "solid" ? "solid-plate" : storage.get("gary-portal-material")
    )
      ? (storage.get("gary-portal-material") === "solid" ? "solid-plate" : storage.get("gary-portal-material"))
      : "ultrathin",
    viewport: storage.get("gary-portal-viewport") === "mobile" ? "mobile" : "desktop",
    category: "all",
    query: "",
    applicationMode: "board",
    sceneMotion: storage.get("gary-portal-scene-motion") === "on" ? "on" : "system",
    productDesign: { ...productDesignDefaults },
    review: loadReviewState(),
    reviewHandoff: {
      status: "checking",
      decisionId: "",
      message: "正在连接本地交接桥"
    },
    toastTimer: 0
  };

  function setPressed(buttons, activeButton, selectedAttribute = "aria-pressed") {
    buttons.forEach((button) => {
      const active = button === activeButton;
      button.classList.toggle("is-active", active);
      button.setAttribute(selectedAttribute, String(active));
    });
  }

  function setView(view, options = {}) {
    if (!Object.prototype.hasOwnProperty.call(viewMeta, view)) return;
    state.view = view;

    all(".app-view").forEach((section) => {
      const active = section.dataset.view === view;
      section.hidden = !active;
      section.classList.toggle("is-active", active);
    });

    all("[data-view-target]").forEach((button) => {
      const active = button.dataset.viewTarget === view;
      button.classList.toggle("is-active", active);
      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    all("[data-view-group]").forEach((details) => {
      const active = details.dataset.viewGroup.split(/\s+/).includes(view);
      const summary = details.querySelector("summary");
      summary.classList.toggle("is-active", active);
      if (active) {
        summary.setAttribute("aria-current", "page");
      } else {
        summary.removeAttribute("aria-current");
      }
    });

    byId("view-kicker").textContent = viewMeta[view].kicker;
    byId("view-title").textContent = viewMeta[view].title;
    document.title = `${viewMeta[view].title} · Gary Design System`;

    if (options.updateHash !== false) {
      try {
        window.history.replaceState(null, "", `#${view}`);
      } catch (_error) {
        window.location.hash = view;
      }
    }

    if (options.focus) {
      byId("main-content").focus({ preventScroll: true });
    }

  }

  function setTheme(theme, persist = true) {
    state.theme = theme === "light" ? "light" : "dark";
    root.dataset.theme = state.theme;
    root.dataset.garyTheme = state.theme;

    const toggle = byId("theme-toggle");
    const light = state.theme === "light";
    toggle.setAttribute("aria-pressed", String(light));
    toggle.setAttribute("aria-label", light ? "切换为深色模式" : "切换为浅色模式");
    GaryIcons.set(toggle, light ? "moon" : "sun", toggle.getAttribute("aria-label"));

    window.dispatchEvent(new CustomEvent("gary-theme-change", { detail: { theme: state.theme } }));
    if (persist) storage.set("gary-portal-theme", state.theme);
    refreshPreviewQueries();
  }

  function setMaterial(material, persist = true) {
    const normalized = material === "solid" ? "solid-plate" : material;
    const valid = ["ultrathin", "regular", "thick", "solid-plate"];
    state.material = valid.includes(normalized) ? normalized : "ultrathin";
    root.dataset.material = state.material;
    byId("material-select").value = state.material;

    const tokenNames = {
      ultrathin: "--gary-glass-ultrathin",
      regular: "--gary-glass-regular",
      thick: "--gary-glass-thick",
      "solid-plate": "--gary-solid-plate"
    };

    const activeToken = byId("active-material-token");
    if (activeToken) activeToken.textContent = tokenNames[state.material];

    all("[data-material-card]").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.materialCard === state.material);
    });

    if (persist) storage.set("gary-portal-material", state.material);
    refreshPreviewQueries();
  }

  function setViewport(viewport, persist = true) {
    state.viewport = viewport === "mobile" ? "mobile" : "desktop";
    root.dataset.viewport = state.viewport;
    const buttons = all("[data-viewport-option]");
    const active = buttons.find((button) => button.dataset.viewportOption === state.viewport);
    setPressed(buttons, active);
    const readout = state.viewport === "mobile" ? "移动 · 390px" : "桌面 · 自适应";
    all("[data-viewport-readout]").forEach((node) => {
      node.textContent = readout;
    });
    if (persist) storage.set("gary-portal-viewport", state.viewport);
  }

  function urlWithSettings(path) {
    const url = new URL(path, document.baseURI);
    url.searchParams.set("theme", state.theme);
    url.searchParams.set("material", state.material);
    url.searchParams.set("density", state.review.density);
    return url.href;
  }

  function setSceneMotion(mode, persist = true) {
    state.sceneMotion = mode === "on" ? "on" : "system";
    const scene = document.querySelector('[data-gary-scene-engine="dot-grid"]');
    const toggle = byId("scene-motion-toggle");
    const forced = state.sceneMotion === "on";
    if (scene) scene.dataset.motionOverride = state.sceneMotion;
    toggle.setAttribute("aria-pressed", String(forced));
    toggle.setAttribute("aria-label", forced ? "恢复跟随系统背景动态设置" : "强制开启背景动态");
    GaryIcons.set(toggle, forced ? "pause" : "play", toggle.getAttribute("aria-label"));
    window.dispatchEvent(new CustomEvent("gary:scene-motion-change", {
      detail: { mode: state.sceneMotion }
    }));
    if (persist) storage.set("gary-portal-scene-motion", state.sceneMotion);
  }

  function updateFrame(frame, path) {
    if (!frame || !path) return;
    const next = urlWithSettings(path);
    if (frame.src !== next) frame.src = next;
  }

  function refreshPreviewQueries() {
    const application = applicationModeMeta[state.applicationMode];
    if (application) {
      updateFrame(byId("overview-application-frame"), application.path);
      updateFrame(byId("application-frame"), application.path);
    }

    const startingFrame = byId("starting-frame");
    const selectedStarting = document.querySelector("[data-starting-pattern].is-active");
    const startingKey = selectedStarting ? selectedStarting.dataset.startingPattern : "report-cover";
    updateFrame(startingFrame, patternMeta[startingKey].path);
    updateFrame(byId("visual-sample-index"), "../examples/visuals/outputs/index.html");
    updateFrame(byId("complete-demo-frame"), "../examples/demos/index.html");
    all("a[target=\"_blank\"]").forEach(link => {
      const url = new URL(link.href, document.baseURI);
      if (url.origin === location.origin && url.pathname.endsWith(".html")) link.href = urlWithSettings(url.href);
    });
    if (application) byId("open-application-mode").href = urlWithSettings(application.path);
    byId("starting-open-link").href = urlWithSettings(patternMeta[startingKey].path);
  }

  function setApplicationMode(key) {
    const meta = applicationModeMeta[key];
    if (!meta) return;
    state.applicationMode = key;

    all(".application-mode-tabs").forEach((tablist) => {
      const tabs = all("[data-application-mode]", tablist);
      const activeTab = tabs.find((tab) => tab.dataset.applicationMode === key);
      tabs.forEach((tab) => {
        const active = tab === activeTab;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      const panel = activeTab ? byId(activeTab.getAttribute("aria-controls")) : null;
      if (panel) panel.setAttribute("aria-labelledby", activeTab.id);
    });

    byId("overview-application-kicker").textContent = meta.order;
    byId("overview-application-name").textContent = meta.name;
    byId("overview-application-summary").textContent = meta.summary;
    byId("overview-application-frame").title = `${meta.name}预览`;
    updateFrame(byId("overview-application-frame"), meta.path);

    byId("application-kicker").textContent = meta.order;
    byId("application-name").textContent = meta.name;
    byId("application-target").textContent = meta.target;
    byId("application-navigation").textContent = meta.navigation;
    byId("application-rhythm").textContent = meta.rhythm;
    byId("application-material").textContent = meta.material;
    byId("application-frame").title = `${meta.name}预览`;
    updateFrame(byId("application-frame"), meta.path);

    const openLink = byId("open-application-mode");
    openLink.href = urlWithSettings(meta.path);
    openLink.setAttribute("aria-label", `独立打开${meta.name}`);
  }

  function setStartingPattern(key) {
    const meta = patternMeta[key];
    if (!meta) return;
    const options = all("[data-starting-pattern]");
    options.forEach((button) => {
      const active = button.dataset.startingPattern === key;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    byId("starting-frame").title = `${meta.name}起始模板预览`;
    updateFrame(byId("starting-frame"), meta.path);
    byId("starting-open-link").href = urlWithSettings(meta.path);
  }

  function showToast(message) {
    const toast = byId("copy-toast");
    byId("copy-toast-text").textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 1800);
  }

  async function copyText(value, trigger, label = value) {
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        copied = true;
      } catch (_error) {
        copied = false;
      }
    }

    if (!copied) {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        copied = document.execCommand("copy");
      } catch (_error) {
        copied = false;
      }
      textarea.remove();
    }

    if (trigger) {
      trigger.classList.add("is-copied");
      window.setTimeout(() => trigger.classList.remove("is-copied"), 900);
    }
    showToast(copied ? `已复制 ${label}` : `请手动复制 ${label}`);
  }

  function formatProductDesignLetterSpacing(value) {
    const number = Number(value);
    return Math.abs(number) < 0.001 ? "0em" : `${number.toFixed(2)}em`;
  }

  function productDesignMatchesCanonical(current) {
    return Object.entries(productDesignDefaults).every(([key, value]) => current[key] === value);
  }

  function productDesignProposal() {
    const current = state.productDesign;
    const canonicalMatch = productDesignMatchesCanonical(current);
    return {
      schemaVersion: 1,
      status: canonicalMatch ? "approved-canonical" : "proposal-only",
      source: "GaryUI Product Design Lab",
      typography: {
        fontFamily: productDesignFonts[current.font].label,
        bodySize: `${current.fontSize}px`,
        bodyWeight: current.fontWeight,
        chineseLineHeight: current.lineHeight,
        letterSpacing: formatProductDesignLetterSpacing(current.letterSpacing)
      },
      spacing: {
        density: current.density,
        layoutGap: `${current.layoutGap}px`,
        surfacePadding: `${productDesignDensities[current.density].surfacePadding}px`
      },
      surfaces: {
        preset: productDesignCardPresets[current.cardPreset]?.label || "自定义",
        cardOpacity: `${current.cardOpacity}%`,
        cardRadius: `${current.cardRadius}px`,
        hierarchyContrast: `${current.cardContrast}%`
      },
      guard: canonicalMatch
        ? "已由用户确认并写入 GaryUI 正式 Token"
        : "用户确认后，才可写入 GaryUI 正式 Token"
    };
  }

  function productDesignPrompt() {
    const current = state.productDesign;
    const font = productDesignFonts[current.font].label;
    const density = productDesignDensities[current.density].label;
    const cardPreset = productDesignCardPresets[current.cardPreset]?.label || "自定义卡片";
    return `使用 Product Design，在 GaryUI 现有规则内优化当前页面。以“${current.sampleText}”作为真实中英混排样本；英文使用 Helvetica 系列、中文使用微软雅黑系列，正文 ${current.fontSize}px / ${current.fontWeight}，中文行高 ${current.lineHeight.toFixed(2)}，字符间距 ${formatProductDesignLetterSpacing(current.letterSpacing)}，组件间距 ${current.layoutGap}px，密度为${density}；卡片采用${cardPreset}，透明度 ${current.cardOpacity}%、圆角 ${current.cardRadius}px、层级对比 ${current.cardContrast}%。先审查层级、排版和间距，再实施最小改动并打开本地预览；只生成 Token 提案，不要直接写入母本。`;
  }

  function updateProductDesignLab() {
    const current = state.productDesign;
    const preview = byId("pd-live-preview");
    const font = productDesignFonts[current.font];
    const density = productDesignDensities[current.density];

    preview.style.setProperty("--lab-font", font.value);
    preview.style.setProperty("--lab-body-size", `${current.fontSize}px`);
    preview.style.setProperty("--lab-font-weight", String(current.fontWeight));
    preview.style.setProperty("--lab-line-height", current.lineHeight.toFixed(2));
    preview.style.setProperty("--lab-letter-spacing", formatProductDesignLetterSpacing(current.letterSpacing));
    preview.style.setProperty("--lab-layout-gap", `${current.layoutGap}px`);
    preview.style.setProperty("--lab-surface-padding", `${density.surfacePadding}px`);
    preview.style.setProperty("--lab-card-opacity", `${current.cardOpacity}%`);
    preview.style.setProperty("--lab-card-radius", `${current.cardRadius}px`);
    preview.style.setProperty("--lab-card-contrast", `${current.cardContrast}%`);
    preview.dataset.garyDensity = current.density;
    preview.classList.toggle("gary-solid-plate", current.cardPreset === "minimal-solid");

    byId("pd-live-body").textContent = current.sampleText || productDesignDefaults.sampleText;
    byId("pd-font-size-output").textContent = `${current.fontSize}px`;
    byId("pd-font-weight-output").textContent = String(current.fontWeight);
    byId("pd-line-height-output").textContent = current.lineHeight.toFixed(2);
    byId("pd-letter-spacing-output").textContent = formatProductDesignLetterSpacing(current.letterSpacing);
    byId("pd-layout-gap-output").textContent = `${current.layoutGap}px`;
    byId("pd-card-opacity-output").textContent = `${current.cardOpacity}%`;
    byId("pd-card-radius-output").textContent = `${current.cardRadius}px`;
    byId("pd-card-contrast-output").textContent = `${current.cardContrast}%`;
    byId("pd-metric-size").textContent = String(current.fontSize);
    byId("pd-metric-line").textContent = current.lineHeight.toFixed(2);
    byId("pd-metric-gap").textContent = String(current.layoutGap);
    const cardPreset = productDesignCardPresets[current.cardPreset]?.label || "自定义";
    byId("pd-card-preset-output").textContent = cardPreset;
    byId("pd-preview-status").textContent = `${cardPreset} · ${density.label} · ${current.fontSize}px`;
    byId("pd-decision-summary").textContent = `采用 ${font.label}，正文 ${current.fontSize}px / ${current.fontWeight} / ${current.lineHeight.toFixed(2)}，以${density.label}密度和${cardPreset}组织层级。`;
    byId("pd-generated-prompt").textContent = productDesignPrompt();
    byId("pd-token-proposal").textContent = JSON.stringify(productDesignProposal(), null, 2);

    const densityButtons = all("[data-pd-density]");
    const activeDensity = densityButtons.find((button) => button.dataset.pdDensity === current.density);
    setPressed(densityButtons, activeDensity);
    const presetButtons = all("[data-pd-card-preset]");
    const activePreset = presetButtons.find((button) => button.dataset.pdCardPreset === current.cardPreset);
    setPressed(presetButtons, activePreset);
  }

  function hydrateProductDesignLab() {
    const current = state.productDesign;
    byId("pd-font-family").value = current.font;
    byId("pd-sample-text").value = current.sampleText;
    byId("pd-font-size").value = String(current.fontSize);
    byId("pd-font-weight").value = String(current.fontWeight);
    byId("pd-line-height").value = String(current.lineHeight);
    byId("pd-letter-spacing").value = String(current.letterSpacing);
    byId("pd-layout-gap").value = String(current.layoutGap);
    byId("pd-card-opacity").value = String(current.cardOpacity);
    byId("pd-card-radius").value = String(current.cardRadius);
    byId("pd-card-contrast").value = String(current.cardContrast);
    updateProductDesignLab();
  }

  function bindProductDesignLab() {
    const rangeBindings = {
      "pd-font-size": "fontSize",
      "pd-font-weight": "fontWeight",
      "pd-line-height": "lineHeight",
      "pd-letter-spacing": "letterSpacing",
      "pd-layout-gap": "layoutGap",
      "pd-card-opacity": "cardOpacity",
      "pd-card-radius": "cardRadius",
      "pd-card-contrast": "cardContrast"
    };

    Object.entries(rangeBindings).forEach(([id, key]) => {
      byId(id).addEventListener("input", (event) => {
        state.productDesign[key] = Number(event.target.value);
        if (["cardOpacity", "cardRadius", "cardContrast"].includes(key)) {
          state.productDesign.cardPreset = "custom";
        }
        updateProductDesignLab();
      });
    });

    byId("pd-font-family").addEventListener("change", (event) => {
      state.productDesign.font = Object.hasOwn(productDesignFonts, event.target.value)
        ? event.target.value
        : productDesignDefaults.font;
      updateProductDesignLab();
    });

    byId("pd-sample-text").addEventListener("input", (event) => {
      state.productDesign.sampleText = event.target.value.slice(0, 72);
      updateProductDesignLab();
    });

    all("[data-pd-density]").forEach((button) => {
      button.addEventListener("click", () => {
        state.productDesign.density = button.dataset.pdDensity;
        updateProductDesignLab();
      });
    });

    all("[data-pd-card-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.pdCardPreset;
        const preset = productDesignCardPresets[key];
        if (!preset) return;
        state.productDesign = {
          ...state.productDesign,
          cardPreset: key,
          cardOpacity: preset.cardOpacity,
          cardRadius: preset.cardRadius,
          cardContrast: preset.cardContrast
        };
        hydrateProductDesignLab();
      });
    });

    all(".pd-live-tabs [role=\"tab\"]").forEach((tab) => {
      tab.addEventListener("click", () => {
        all(".pd-live-tabs [role=\"tab\"]").forEach((candidate) => {
          const active = candidate === tab;
          candidate.classList.toggle("is-active", active);
          candidate.setAttribute("aria-selected", String(active));
        });
      });
    });

    byId("pd-copy-prompt").addEventListener("click", (event) => {
      copyText(productDesignPrompt(), event.currentTarget, "当前协作指令");
    });

    byId("pd-copy-token").addEventListener("click", (event) => {
      copyText(JSON.stringify(productDesignProposal(), null, 2), event.currentTarget, "Token 提案");
    });

    all("[data-pd-prompt]").forEach((button) => {
      button.addEventListener("click", () => {
        const recipe = productDesignRecipes[button.dataset.pdPrompt];
        if (recipe) copyText(recipe, button, `${button.querySelector("span").textContent}指令`);
      });
    });

    byId("pd-reset").addEventListener("click", () => {
      state.productDesign = { ...productDesignDefaults };
      hydrateProductDesignLab();
      showToast("已恢复 Product Design 推荐值");
    });
  }

  function filterComponents() {
    const query = state.query.trim().toLocaleLowerCase("zh-CN");
    let visible = 0;

    all(".component-item").forEach((item) => {
      const categoryMatch = state.category === "all" || item.dataset.category === state.category;
      const haystack = `${item.dataset.search || ""} ${item.textContent}`.toLocaleLowerCase("zh-CN");
      const queryMatch = !query || haystack.includes(query);
      const match = categoryMatch && queryMatch;
      item.hidden = !match;
      if (match) visible += 1;
    });

    byId("result-count").textContent = `显示 ${visible} / 15`;
    byId("component-empty").hidden = visible !== 0;
  }

  function setComponentCategory(category, activeButton) {
    state.category = category;
    setPressed(all(".filter-button[data-category]"), activeButton);
    filterComponents();
  }

  function setPreviewState(previewState) {
    all(".component-preview").forEach((preview) => {
      preview.dataset.demoState = previewState;
      all("button, input, select, [tabindex]", preview).forEach((control) => {
        if (previewState === "disabled") {
          if ("disabled" in control && !control.disabled) {
            control.disabled = true;
            control.dataset.stateDisabled = "true";
          } else if (!("disabled" in control)) {
            control.setAttribute("aria-disabled", "true");
            control.dataset.stateDisabled = "true";
          }
        } else if (control.dataset.stateDisabled === "true") {
          if ("disabled" in control) control.disabled = false;
          control.removeAttribute("aria-disabled");
          delete control.dataset.stateDisabled;
        }
      });
    });
  }

  function selectWithin(container, button, selectedClass = "is-active") {
    all("button", container).forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle(selectedClass, active);
      candidate.setAttribute("aria-pressed", String(active));
      if (candidate.getAttribute("role") === "tab") {
        candidate.setAttribute("aria-selected", String(active));
      }
    });
  }

  function replayMotion() {
    const track = byId("motion-track");
    track.classList.remove("is-playing");
    void track.offsetWidth;
    track.classList.add("is-playing");
  }

  function reviewPayload(reviewState = state.review) {
    return {
      schemaVersion: 3,
      system: "Gary-UI",
      defaultBackground: null,
      backgroundCustomizable: true,
      defaultTheme: reviewState.theme,
      defaultMaterial: reviewState.material,
      defaultDensity: reviewState.density,
      reactAdapterStrategy: reviewState.reactAdapterStrategy,
      distributionScope: reviewState.distributionScope,
      syncAuditCadence: reviewState.syncAuditCadence,
      notes: reviewState.notes,
      status: reviewState.status
    };
  }

  const reviewGuidance = {
    theme: {
      dark: ["深色主题能让中性玻璃、边缘光和建筑背景形成最稳定的层级", "视觉更沉浸；长时间阅读纯文档时不如浅色自然"],
      light: ["浅色主题更接近日间工具、说明文档和打印阅读", "玻璃层级更克制，对背景明暗和边缘对比要求更高"]
    },
    material: {
      ultrathin: ["默认页面壳、悬浮导航和点阵上的轻表面", "适合让纯色点阵保持可见；长文和密集数据改用 SolidPlate"],
      regular: ["常规卡片、筛选和日常产品控件", "局部可读性与背景参与度平衡，不作为全局默认材质"],
      thick: ["结论优先、阅读稳定和较复杂的卡片内容", "背景存在感降低，连续大面积使用会显得厚重"],
      "solid-plate": ["表格、证据、长正文和高密度工作台", "可读性最高，但会弱化 Liquid Glass 的空间感"]
    },
    density: {
      spacious: ["提案、作品展示和演示型页面", "视觉呼吸感强，但同屏信息量较低"],
      balanced: ["报告、分析界面与一般产品页面", "适用面最广，极密集工具仍需局部收紧"],
      compact: ["数据表格、后台工具和高频操作界面", "效率高，但对分组、对比度和点击尺寸要求更严格"]
    },
    reactAdapterStrategy: {
      "demand-driven": ["只为出现真实复用需求的组件维护 React 包装", "适配覆盖会随项目推进，但能避免形成第二套真相源"],
      "full-coverage": ["一次获得 15 / 15 的 React 组件 API", "每个契约变化都要同步维护包装层，长期成本更高"]
    },
    distributionScope: {
      internal: ["个人项目与内部协作可直接消费当前母本", "不包含公开分发所需的许可证与素材授权承诺"],
      public: ["可作为公开包、模板或文档站对外发布", "发布前必须补齐许可证并确认背景素材可公开使用"]
    },
    syncAuditCadence: {
      weekly: ["单一心跳每周一 10:00 检查 Gary，并在每月首个周一追加综合治理", "Gary 漂移发现更快；综合治理从每月 1 日调整到首个周一"],
      monthly: ["每月 1 日 09:00 用同一任务检查 Gary 与综合治理", "提醒更少，但 Gary 漂移最长可能一个月后才发现"]
    }
  };

  function updateReviewGuidance() {
    const theme = reviewGuidance.theme[state.review.theme];
    const material = reviewGuidance.material[state.review.material];
    const density = reviewGuidance.density[state.review.density];
    const reactAdapter = reviewGuidance.reactAdapterStrategy[state.review.reactAdapterStrategy];
    const distribution = reviewGuidance.distributionScope[state.review.distributionScope];
    const syncAudit = reviewGuidance.syncAuditCadence[state.review.syncAuditCadence];
    const isRecommended = state.review.theme === "dark"
      && state.review.material === "regular"
      && state.review.density === "balanced"
      && state.review.reactAdapterStrategy === "demand-driven"
      && state.review.distributionScope === "internal"
      && state.review.syncAuditCadence === "weekly";
    byId("review-impact-summary").textContent =
      `${state.review.theme === "dark" ? "深色" : "浅色"} × ${state.review.material === "solid-plate" ? "SolidPlate" : state.review.material[0].toUpperCase() + state.review.material.slice(1)} × ${
        { spacious: "舒展", balanced: "均衡", compact: "紧凑" }[state.review.density]
      } × ${
        state.review.reactAdapterStrategy === "demand-driven" ? "按需适配" : "全量适配"
      } × ${state.review.distributionScope === "internal" ? "内部使用" : "公开发布"} × ${
        state.review.syncAuditCadence === "weekly" ? "每周审计" : "每月审计"
      }`;
    byId("review-impact-fit").textContent =
      `${theme[0]}；${material[0]}；${density[0]}；${reactAdapter[0]}；${distribution[0]}；${syncAudit[0]}。`;
    byId("review-impact-tradeoff").textContent =
      `${theme[1]}；${material[1]}；${density[1]}；${reactAdapter[1]}；${distribution[1]}；${syncAudit[1]}。`;
    byId("review-impact-recommendation").textContent = isRecommended
      ? "六项均命中推荐基准：保持当前视觉起点、按真实复用适配、先服务个人 / 内部协作，并每周检查漂移。"
      : "这是有效的定向选择；请确认它比通用基准更符合你最常制作的页面。";
  }

  function updateReviewPreview(persist = true) {
    const preview = byId("review-preview");
    const surface = preview.querySelector(".review-surface");
    preview.dataset.garyTheme = state.review.theme;
    preview.dataset.reviewDensity = state.review.density;
    surface.classList.remove("gary-glass", "gary-ultrathin", "gary-regular", "gary-thick", "gary-solid-plate");
    if (state.review.material === "solid-plate") {
      surface.classList.add("gary-solid-plate");
    } else {
      surface.classList.add("gary-glass", `gary-${state.review.material}`);
    }

    const status = byId("review-status");
    const ready = state.review.status === "ready";
    const applied = state.reviewHandoff.status === "applied";
    status.textContent = applied
      ? "已写回母本"
      : ready
        ? "已保存 · 等待写回母本"
        : "草稿 · 尚未确认";
    status.classList.toggle("is-ready", ready);
    status.classList.toggle("is-applied", applied);
    byId("review-summary-json").textContent = JSON.stringify(reviewPayload(), null, 2);
    byId("review-note-count").textContent = `${state.review.notes.length} / 280`;
    updateReviewGuidance();
    all(".review-nav-state").forEach((node) => {
      node.textContent = applied ? "✓" : ready ? "↗" : "6";
    });
    if (persist) storage.set("gary-portal-review", JSON.stringify(state.review));
  }

  function updateReviewHandoff(status, message, decisionId = "") {
    state.reviewHandoff = { status, message, decisionId };
    const node = byId("review-handoff");
    if (!node) return;
    const title = {
      checking: "正在连接本地交接桥",
      empty: "交接桥已连接",
      saving: "正在保存到固定交接文件",
      pending: "决定已交接，等待写回母本",
      applied: "决定已写回母本",
      error: "交接未完成",
      unavailable: "当前服务不支持可靠交接"
    }[status] || "交接状态未知";
    node.dataset.state = status;
    node.querySelector("strong").textContent = title;
    node.querySelector("span").textContent = decisionId ? `${message} · ${decisionId}` : message;
  }

  function reviewStateFromDecision(decision) {
    if (!decision || decision.schemaVersion !== 3 || decision.system !== "Gary-UI") return null;
    const material = decision.defaultMaterial === "solid" ? "solid-plate" : decision.defaultMaterial;
    if (!["dark", "light"].includes(decision.defaultTheme)
      || !["ultrathin", "regular", "thick", "solid-plate"].includes(material)
      || !["spacious", "balanced", "compact"].includes(decision.defaultDensity)
      || !["demand-driven", "full-coverage"].includes(decision.reactAdapterStrategy)
      || !["internal", "public"].includes(decision.distributionScope)
      || !["weekly", "monthly"].includes(decision.syncAuditCadence)
      || typeof decision.notes !== "string") {
      return null;
    }
    return {
      schemaVersion: 3,
      theme: decision.defaultTheme,
      material,
      density: decision.defaultDensity,
      reactAdapterStrategy: decision.reactAdapterStrategy,
      distributionScope: decision.distributionScope,
      syncAuditCadence: decision.syncAuditCadence,
      notes: decision.notes.slice(0, 280),
      status: decision.status === "ready" ? "ready" : "draft"
    };
  }

  async function loadReviewHandoff() {
    if (window.location.protocol !== "http:" || document.documentElement.hasAttribute("data-gary-static")) {
      updateReviewHandoff("unavailable", "公开预览可导出决定；写回母本需要本机维护服务");
      byId("review-save").disabled = true;
      return;
    }
    try {
      const response = await fetch("/api/review", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const envelope = await response.json();
      if (envelope.handoffStatus === "empty") {
        updateReviewHandoff("empty", "可以安全保存本轮决定");
        return;
      }
      const recovered = reviewStateFromDecision(envelope.decision);
      if (!recovered || !["pending", "applied"].includes(envelope.handoffStatus)) {
        throw new Error("交接文件不符合固定 schema");
      }
      state.review = recovered;
      updateReviewHandoff(
        envelope.handoffStatus,
        envelope.handoffStatus === "applied" ? "metadata 与 tokens 已确认更新" : "固定交接文件已生成",
        envelope.decisionId || ""
      );
      hydrateReviewForm();
    } catch (error) {
      updateReviewHandoff("unavailable", `请从本机受限服务打开：${error.message}`);
    }
  }

  async function saveReviewHandoff() {
    if (document.documentElement.hasAttribute("data-gary-static")) return;
    const button = byId("review-save");
    const candidate = { ...state.review, status: "ready" };
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    updateReviewHandoff("saving", "正在验证 schema 与固定写入目标");
    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gary-Review-Bridge": "1"
        },
        body: JSON.stringify(reviewPayload(candidate))
      });
      const envelope = await response.json();
      if (!response.ok) throw new Error(envelope.error || `HTTP ${response.status}`);
      state.review = candidate;
      updateReviewHandoff(
        envelope.handoffStatus,
        envelope.handoffStatus === "applied" ? "相同决定已经写回母本" : "固定交接文件已生成",
        envelope.decisionId || ""
      );
      updateReviewPreview();
      showToast("本轮决定已安全交接");
    } catch (error) {
      state.review.status = "draft";
      updateReviewHandoff("error", `${error.message}；决定未标记为已保存`);
      updateReviewPreview();
      showToast("保存失败：未生成交接文件");
    } finally {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  }

  function setReviewChoice(group, value) {
    const input = document.querySelector(`input[name="${group}"][value="${value}"]`);
    if (input) input.checked = true;
  }

  function hydrateReviewForm() {
    setReviewChoice("review-theme", state.review.theme);
    setReviewChoice("review-material", state.review.material);
    setReviewChoice("review-density", state.review.density);
    setReviewChoice("review-react-adapter-strategy", state.review.reactAdapterStrategy);
    setReviewChoice("review-distribution-scope", state.review.distributionScope);
    setReviewChoice("review-sync-audit-cadence", state.review.syncAuditCadence);
    byId("review-notes").value = state.review.notes;
    updateReviewPreview();
  }

  function bindReview() {
    all('input[name^="review-"]').forEach((input) => {
      input.addEventListener("change", () => {
        state.review.theme = document.querySelector('input[name="review-theme"]:checked').value;
        state.review.material = document.querySelector('input[name="review-material"]:checked').value;
        state.review.density = document.querySelector('input[name="review-density"]:checked').value;
        state.review.reactAdapterStrategy =
          document.querySelector('input[name="review-react-adapter-strategy"]:checked').value;
        state.review.distributionScope =
          document.querySelector('input[name="review-distribution-scope"]:checked').value;
        state.review.syncAuditCadence =
          document.querySelector('input[name="review-sync-audit-cadence"]:checked').value;
        state.review.status = "draft";
        updateReviewHandoff("empty", "当前选择尚未交接；母本仍保留上一已应用决定");
        updateReviewPreview();
      });
    });

    byId("review-notes").addEventListener("input", (event) => {
      state.review.notes = event.target.value.slice(0, 280);
      state.review.status = "draft";
      updateReviewHandoff("empty", "备注已改变，需要重新保存");
      updateReviewPreview();
    });

    byId("review-save").addEventListener("click", saveReviewHandoff);

    byId("review-copy").addEventListener("click", (event) => {
      copyText(JSON.stringify(reviewPayload(), null, 2), event.currentTarget);
    });

    byId("review-reset").addEventListener("click", () => {
      state.review = { ...reviewDefaults };
      updateReviewHandoff("empty", "已恢复推荐值，需要重新保存");
      hydrateReviewForm();
      showToast("已恢复推荐值");
    });
  }

  function bindNavigation() {
    const topbar = document.querySelector(".portal-topbar");
    const topNavigation = byId("top-navigation");
    const menuToggle = byId("topbar-menu-toggle");
    let scrollFrame = 0;

    const syncTopbarScrollState = () => {
      scrollFrame = 0;
      topbar.classList.toggle("is-scrolled", window.scrollY > 80);
    };

    const setMobileMenu = (open) => {
      topNavigation.classList.toggle("is-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      GaryIcons.set(menuToggle, open ? "x" : "menu", open ? "关闭菜单" : "菜单");
    };

    syncTopbarScrollState();
    window.addEventListener("scroll", () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(syncTopbarScrollState);
    }, { passive: true });

    menuToggle.addEventListener("click", () => {
      setMobileMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    all("[data-view-target]").forEach((button) => {
      button.addEventListener("click", () => {
        setView(button.dataset.viewTarget, { focus: true });
        setMobileMenu(false);
        const parentDetails = button.closest("details");
        if (parentDetails) parentDetails.open = false;
      });
    });

    all("[data-view-jump]").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.viewJump, { focus: true }));
    });

    const topbarDetails = all(".portal-topbar details");
    topbarDetails.forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        topbarDetails.forEach((candidate) => {
          if (candidate !== details) candidate.open = false;
        });
      });
    });

    document.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".portal-topbar details")) return;
      topbarDetails.forEach((details) => {
        details.open = false;
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (menuToggle.getAttribute("aria-expanded") === "true") {
          setMobileMenu(false);
          menuToggle.focus();
        }
        const openDetails = topbarDetails.filter((details) => details.open);
        if (openDetails.length) {
          event.preventDefault();
          openDetails.forEach((details) => {
            details.open = false;
          });
          openDetails.at(-1).querySelector("summary").focus();
        }
      }
      if (
        event.key === "/" &&
        state.view === "components" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
      ) {
        event.preventDefault();
        byId("component-search").focus();
      }
    });

    window.addEventListener("hashchange", () => {
      const nextView = window.location.hash.replace(/^#/, "");
      if (nextView !== state.view && Object.prototype.hasOwnProperty.call(viewMeta, nextView)) {
        setView(nextView, { updateHash: false });
      }
    });
  }

  function bindGlobalControls() {
    byId("theme-toggle").addEventListener("click", () => {
      setTheme(state.theme === "dark" ? "light" : "dark");
    });

    byId("scene-motion-toggle").addEventListener("click", () => {
      setSceneMotion(state.sceneMotion === "on" ? "system" : "on");
    });

    byId("material-select").addEventListener("change", (event) => {
      setMaterial(event.target.value);
    });

    all("[data-material-card]").forEach((card) => {
      card.addEventListener("click", () => setMaterial(card.dataset.materialCard));
    });

    all("[data-viewport-option]").forEach((button) => {
      button.addEventListener("click", () => setViewport(button.dataset.viewportOption));
    });

    byId("replay-motion").addEventListener("click", replayMotion);

    all("[data-copy-value]").forEach((button) => {
      button.addEventListener("click", () => copyText(button.dataset.copyValue, button));
    });
  }

  function bindGallery() {
    byId("component-search").addEventListener("input", (event) => {
      state.query = event.target.value;
      filterComponents();
    });

    all(".filter-button[data-category]").forEach((button) => {
      button.addEventListener("click", () => setComponentCategory(button.dataset.category, button));
    });

    byId("preview-state").addEventListener("change", (event) => {
      setPreviewState(event.target.value);
    });

    byId("clear-component-filter").addEventListener("click", () => {
      state.category = "all";
      state.query = "";
      byId("component-search").value = "";
      const allButton = document.querySelector('[data-category="all"]');
      setPressed(all(".filter-button[data-category]"), allButton);
      filterComponents();
      byId("component-search").focus();
    });

    all("[data-copy-id]").forEach((button) => {
      button.addEventListener("click", () => copyText(button.dataset.copyId, button));
    });

    all("[data-toggle-label]").forEach((button) => {
      button.addEventListener("click", () => {
        const active = button.getAttribute("aria-pressed") !== "true";
        button.setAttribute("aria-pressed", String(active));
        GaryIcons.set(button, active ? "check" : "play", active ? button.dataset.labelActive : button.dataset.labelDefault);
      });
    });

    all(".demo-segmented").forEach((container) => {
      all("button", container).forEach((button) => {
        button.addEventListener("click", () => selectWithin(container, button));
      });
    });

    all(".demo-tab-bar").forEach((container) => {
      all('[role="tab"]', container).forEach((button) => {
        button.addEventListener("click", () => {
          all('[role="tab"]', container).forEach((tab) => {
            const active = tab === button;
            tab.setAttribute("aria-selected", String(active));
            tab.tabIndex = active ? 0 : -1;
          });
        });
      });
    });

    all("[data-spin-on-click]").forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.remove("is-spinning");
        void button.offsetWidth;
        button.classList.add("is-spinning");
      });
    });

    all(".demo-table tbody tr").forEach((row) => {
      const select = () => {
        all("tr", row.parentElement).forEach((candidate) => candidate.classList.toggle("is-selected", candidate === row));
      };
      row.addEventListener("click", select);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      });
    });

    all(".demo-decision-grid").forEach((container) => {
      all("button", container).forEach((button) => {
        button.addEventListener("click", () => selectWithin(container, button, "is-selected"));
      });
    });

    all(".media-like").forEach((button) => {
      button.addEventListener("click", () => {
        const active = button.getAttribute("aria-pressed") !== "true";
        button.setAttribute("aria-pressed", String(active));
        GaryIcons.set(button, "heart", active ? "取消收藏案例" : "收藏案例");
      });
    });

    all("[data-follow]").forEach((button) => {
      button.addEventListener("click", () => {
        const active = button.getAttribute("aria-pressed") !== "true";
        button.setAttribute("aria-pressed", String(active));
        GaryIcons.set(button, active ? "user-check" : "user-plus", active ? "取消关注" : "关注");
      });
    });

    all(".demo-chip-group").forEach((group) => {
      all("button", group).forEach((button) => {
        button.addEventListener("click", () => {
          const active = button.getAttribute("aria-pressed") !== "true";
          button.setAttribute("aria-pressed", String(active));
          button.classList.toggle("is-selected", active);
        });
      });
    });

    all(".demo-evidence").forEach((button) => {
      button.addEventListener("click", () => {
        const active = button.getAttribute("aria-pressed") !== "true";
        button.setAttribute("aria-pressed", String(active));
        button.querySelector("b").style.width = active ? "100%" : "72%";
        button.querySelector("strong").textContent = active ? "100%" : "72%";
      });
    });

    all("[data-scene-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const active = button.classList.toggle("is-shifted");
        button.setAttribute("aria-pressed", String(active));
      });
    });

    all(".demo-plate-list").forEach((container) => {
      all("button", container).forEach((button) => {
        button.addEventListener("click", () => selectWithin(container, button, "is-selected"));
      });
    });
  }

  function bindPatterns() {
    all("[data-application-mode]").forEach((tab) => {
      tab.addEventListener("click", () => setApplicationMode(tab.dataset.applicationMode));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const tabs = all("[data-application-mode]", tab.closest('[role="tablist"]'));
        const index = tabs.indexOf(tab);
        let nextIndex = index;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        const next = tabs[nextIndex];
        setApplicationMode(next.dataset.applicationMode);
        next.focus();
      });
    });

    all("[data-starting-pattern]").forEach((button) => {
      button.addEventListener("click", () => setStartingPattern(button.dataset.startingPattern));
    });
  }

  function initialize() {
    bindNavigation();
    bindGlobalControls();
    bindGallery();
    bindPatterns();
    bindProductDesignLab();
    bindReview();

    const requestedView = window.location.hash.replace(/^#/, "");
    setView(Object.prototype.hasOwnProperty.call(viewMeta, requestedView) ? requestedView : "overview", {
      updateHash: false
    });
    setTheme(state.theme, false);
    setSceneMotion(state.sceneMotion, false);
    setMaterial(state.material, false);
    setViewport(state.viewport, false);
    setApplicationMode("board");
    setStartingPattern("report-cover");
    setPreviewState("default");
    filterComponents();
    replayMotion();
    hydrateProductDesignLab();
    hydrateReviewForm();
    loadReviewHandoff();
  }

  initialize();
})();
