(() => {
  "use strict";

  const root = document.documentElement;
  const shell = document.querySelector(".workbench-shell");
  const overlay = document.querySelector(".workbench-overlay");
  const toast = document.querySelector(".workbench-toast");
  const params = new URLSearchParams(window.location.search);
  let toastTimer = 0;

  const setTheme = (theme) => {
    const next = theme === "light" ? "light" : "dark";
    root.dataset.garyTheme = next;
    const toggle = document.querySelector("[data-theme-toggle]");
    if (toggle && window.GaryIcons) {
      GaryIcons.set(toggle, next === "light" ? "moon" : "sun", next === "light" ? "切换为深色模式" : "切换为浅色模式");
    }
  };

  const syncRailButton = (side, collapsed) => {
    const button = document.querySelector(`[data-rail-toggle="${side}"]`);
    if (!button) return;
    const label = collapsed ? `展开${side === "left" ? "工作参数" : "结果详情"}` : `折叠${side === "left" ? "工作参数" : "结果详情"}`;
    button.setAttribute("aria-expanded", String(!collapsed));
    if (window.GaryIcons) GaryIcons.set(button, "menu", label);
  };

  const setMobileRail = (side) => {
    document.querySelectorAll(".workbench-rail").forEach((rail) => {
      rail.classList.toggle("is-mobile-open", rail.dataset.rail === side);
    });
    const open = Boolean(side);
    overlay.hidden = !open;
    overlay.classList.toggle("is-visible", open);
  };

  setTheme(params.get("theme"));
  if (shell) {
    ["left", "right"].forEach((side) => {
      const button = document.querySelector(`[data-rail-toggle="${side}"]`);
      button?.addEventListener("click", () => {
        const attribute = `${side}Collapsed`;
        const collapsed = shell.dataset[attribute] !== "true";
        shell.dataset[attribute] = String(collapsed);
        syncRailButton(side, collapsed);
      });
      syncRailButton(side, shell.dataset[`${side}Collapsed`] === "true");
    });
  }

  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    setTheme(root.dataset.garyTheme === "light" ? "dark" : "light");
  });

  document.querySelectorAll("[data-mobile-open]").forEach((button) => {
    button.addEventListener("click", () => setMobileRail(button.dataset.mobileOpen));
  });
  document.querySelector("[data-mobile-close]")?.addEventListener("click", () => setMobileRail(null));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMobileRail(null);
  });

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 1800);
  };

  document.querySelectorAll("[data-suggestion]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.querySelector("#workbench-prompt-input");
      if (input) {
        input.value = button.dataset.suggestion;
        input.focus();
      }
    });
  });

  document.querySelector("[data-prompt-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#workbench-prompt-input");
    if (!input?.value.trim()) return;
    showToast("已加入下一步推敲");
    input.value = "";
  });

  document.querySelectorAll(".workbench-inline-action").forEach((button) => {
    button.addEventListener("click", () => {
      button.textContent = "已确认";
      button.setAttribute("aria-label", "已确认");
      showToast("判断已标记为确认");
    });
  });
})();
