(() => {
  "use strict";

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const initialized = new WeakSet();

  const mount = (scene) => {
    if (initialized.has(scene)) return;
    initialized.add(scene);
    let sceneStatus = "loading";
    const setStatus = (value) => {
      sceneStatus = value;
      scene.dataset.sceneStatus = sceneStatus;
    };
    setStatus(sceneStatus);

    const canvas = document.createElement("canvas");
    canvas.className = "gary-dot-grid-canvas";
    const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) {
      setStatus("fallback");
      return;
    }
    scene.append(canvas);

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };
    let motionOverride = scene.dataset.motionOverride === "on";
    let width = 1;
    let height = 1;
    let dpr = 1;
    let frame = 0;
    let visible = true;

    const isReduced = () => reduceMotion.matches && !motionOverride;
    const cssNumber = (name, fallback) => {
      const value = Number.parseFloat(getComputedStyle(scene).getPropertyValue(name));
      return Number.isFinite(value) ? value : fallback;
    };

    const themeColors = () => {
      const root = document.documentElement;
      const theme = root.dataset.garyTheme || root.dataset.theme || "dark";
      return theme === "light"
        ? { base: "rgba(0,0,0,0.14)", active: "rgba(0,0,0,0.58)" }
        : { base: "rgba(255,255,255,0.16)", active: "rgba(255,255,255,0.72)" };
    };

    const draw = () => {
      frame = 0;
      if (!visible || document.hidden || ["gradient-waves", "custom-media"].includes(scene.dataset.garyBackground)) return;

      const reduced = isReduced();
      const spacing = Math.max(18, cssNumber("--gary-scene-grid-size", 28));
      const influenceRadius = Math.max(80, cssNumber("--gary-scene-pointer-radius", 160));
      const colors = themeColors();
      context.clearRect(0, 0, width, height);
      context.save();
      context.scale(dpr, dpr);

      const viewWidth = width / dpr;
      const viewHeight = height / dpr;
      const startX = (viewWidth % spacing) / 2;
      const startY = (viewHeight % spacing) / 2;
      const interactive = pointer.active && !reduced;

      for (let y = startY; y <= viewHeight + spacing; y += spacing) {
        for (let x = startX; x <= viewWidth + spacing; x += spacing) {
          let drawX = x;
          let drawY = y;
          let strength = 0;

          if (interactive) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            const distance = Math.hypot(dx, dy);
            strength = clamp(1 - distance / influenceRadius, 0, 1);
            if (strength > 0 && distance > 0.01) {
              const displacement = strength * strength * 7;
              drawX += (dx / distance) * displacement;
              drawY += (dy / distance) * displacement;
            }
          }

          context.beginPath();
          context.fillStyle = strength > 0.02 ? colors.active : colors.base;
          context.globalAlpha = 0.44 + strength * 0.56;
          context.arc(drawX, drawY, 0.9 + strength * 1.15, 0, Math.PI * 2);
          context.fill();
        }
      }

      context.restore();
      context.globalAlpha = 1;
      setStatus(reduced ? "reduced-motion" : "ready");
    };

    const schedule = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw);
    };

    const resize = () => {
      const rect = scene.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(rect.width * dpr));
      height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      schedule();
    };

    addEventListener("pointermove", (event) => {
      if (isReduced()) return;
      const rect = scene.getBoundingClientRect();
      pointer.targetX = event.clientX - rect.left;
      pointer.targetY = event.clientY - rect.top;
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
      pointer.active = true;
      schedule();
    }, { passive: true });

    addEventListener("pointerout", (event) => {
      if (event.relatedTarget) return;
      pointer.active = false;
      schedule();
    }, { passive: true });

    addEventListener("gary:scene-motion-change", (event) => {
      motionOverride = event.detail?.mode === "on" || scene.dataset.motionOverride === "on";
      pointer.active = false;
      schedule();
    });

    reduceMotion.addEventListener?.("change", () => {
      pointer.active = false;
      schedule();
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) schedule();
    });

    new MutationObserver(schedule).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-gary-theme"]
    });
    new MutationObserver(() => { pointer.active = false; schedule(); }).observe(scene, {
      attributes: true, attributeFilter: ["data-gary-background"]
    });

    new ResizeObserver(resize).observe(scene);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    }, { threshold: 0.01 }).observe(scene);

    resize();
  };

  const scan = (scope = document) => {
    if (scope.matches?.('[data-gary-scene-engine="dot-grid"]')) mount(scope);
    scope.querySelectorAll?.('[data-gary-scene-engine="dot-grid"]').forEach(mount);
  };

  scan();
  new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) scan(node);
    }));
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
