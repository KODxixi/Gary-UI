(() => {
  "use strict";

  if (window.top === window) return;

  const NODE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
  const MATERIAL_CLASSES = [
    "gary-ultrathin",
    "gary-regular",
    "gary-thick",
    "gary-solid-plate"
  ];
  const VALID_CONTROLS = {
    theme: new Set(["dark", "light"]),
    material: new Set(["ultrathin", "regular", "thick", "solid-plate"]),
    density: new Set(["spacious", "balanced", "compact"]),
    pageMode: new Set(["report-cover", "image-page", "data-page", "manual-toc"])
  };
  let highlightedNode = null;

  function isLoopbackParent(origin) {
    return /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(origin);
  }

  function post(message) {
    window.parent.postMessage(message, "*");
  }

  function closestGaryNode(target) {
    if (!(target instanceof Element)) return null;
    return target.closest("[data-gary-node-id]");
  }

  function selectNode(node) {
    const nodeId = node?.getAttribute("data-gary-node-id") || "";
    if (!NODE_ID_PATTERN.test(nodeId)) return;
    highlightNode(nodeId);
    post({ type: "gary-node-selected", nodeId });
  }

  function clearHighlight() {
    if (!highlightedNode) return;
    highlightedNode.classList.remove("gary-codesign-highlight");
    highlightedNode.removeAttribute("data-gary-codesign-selected");
    highlightedNode = null;
  }

  function highlightNode(nodeId) {
    clearHighlight();
    if (!nodeId || !NODE_ID_PATTERN.test(nodeId)) return;
    const escaped = window.CSS?.escape ? CSS.escape(nodeId) : nodeId.replace(/["\\]/g, "\\$&");
    const node = document.querySelector(`[data-gary-node-id="${escaped}"]`);
    if (!node) return;
    highlightedNode = node;
    node.classList.add("gary-codesign-highlight");
    node.setAttribute("data-gary-codesign-selected", "true");
    node.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }

  function installHighlightStyles() {
    if (document.getElementById("gary-codesign-bridge-style")) return;
    const style = document.createElement("style");
    style.id = "gary-codesign-bridge-style";
    style.textContent = `
      [data-gary-node-id] {
        cursor: crosshair;
      }
      .gary-codesign-highlight {
        outline: 3px solid var(--gary-focus-ring, #2e8dff) !important;
        outline-offset: 4px !important;
      }
      @media (prefers-reduced-motion: reduce) {
        .gary-codesign-highlight {
          scroll-behavior: auto !important;
        }
      }
    `;
    document.head.append(style);
  }

  function applyMaterial(material) {
    const materialClass = material === "solid-plate" ? "gary-solid-plate" : `gary-${material}`;
    const surfaces = document.querySelectorAll(
      "[data-gary-material-preview], .gary-glass.gary-ultrathin, .gary-glass.gary-regular, .gary-glass.gary-thick, .gary-solid-plate[data-gary-material-preview]"
    );

    surfaces.forEach((surface) => {
      if (!surface.hasAttribute("data-gary-codesign-original-glass")) {
        surface.setAttribute(
          "data-gary-codesign-original-glass",
          surface.classList.contains("gary-glass") ? "true" : "false"
        );
      }
      MATERIAL_CLASSES.forEach((className) => surface.classList.remove(className));
      if (material === "solid-plate") {
        surface.classList.remove("gary-glass");
      } else if (surface.getAttribute("data-gary-codesign-original-glass") === "true") {
        surface.classList.add("gary-glass");
      }
      surface.classList.add(materialClass);
    });
  }

  function applySettings(controls) {
    if (!controls || typeof controls !== "object") return;
    const root = document.documentElement;
    if (VALID_CONTROLS.theme.has(controls.theme)) {
      root.setAttribute("data-gary-theme", controls.theme);
      root.setAttribute("data-theme", controls.theme);
    }
    if (VALID_CONTROLS.density.has(controls.density)) {
      root.setAttribute("data-gary-density", controls.density);
    }
    if (VALID_CONTROLS.material.has(controls.material)) {
      root.setAttribute("data-gary-material", controls.material);
      applyMaterial(controls.material);
    }
    if (VALID_CONTROLS.pageMode.has(controls.pageMode)) {
      root.setAttribute("data-gary-page-mode", controls.pageMode);
    }
    post({
      type: "gary-preview-settings-applied",
      controls: {
        theme: root.getAttribute("data-gary-theme"),
        material: root.getAttribute("data-gary-material"),
        density: root.getAttribute("data-gary-density"),
        pageMode: root.getAttribute("data-gary-page-mode")
      }
    });
  }

  document.addEventListener("click", (event) => {
    const node = closestGaryNode(event.target);
    if (node) selectNode(node);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const node = closestGaryNode(event.target);
    if (node) selectNode(node);
  }, true);

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || !isLoopbackParent(event.origin)) return;
    const message = event.data;
    if (!message || typeof message !== "object") return;
    if (message.type === "gary-highlight-node") {
      highlightNode(message.nodeId);
    }
    if (message.type === "gary-preview-settings") {
      applySettings(message.controls);
    }
  });

  installHighlightStyles();
  post({
    type: "gary-preview-ready",
    nodeCount: document.querySelectorAll("[data-gary-node-id]").length
  });
})();
