/* Gary-UI · 圆角随尺寸（opt-in）
 *
 * 契约：DESIGN.md §7 —— 圆角必须与卡片尺寸成比例，而不是固定 30px。
 * 用法：在根或容器上加 data-gary-radius="auto"，脚本会给每个表面元素写入
 *      --gary-radius-card，组件 30px 光学边缘和内层圆角随之收敛。
 *
 * 规则：r = clamp(min, width × ratio, max)。默认 14 / 0.04 / 28，与 token
 *      --gary-radius-card 的上下限一致；元素级可用
 *      data-gary-radius-min / data-gary-radius-max / data-gary-radius-ratio 覆盖。
 * 无脚本时保留 token 的 clamp()，布局不塌。
 */
(() => {
  const SURFACES = '.gary-glass-card, .gary-metric-card, .gary-solid-plate, .gary-media-card, .gary-profile-card, .gary-comparison-table, .gary-decision-grid';
  const DEFAULTS = { min: 14, max: 28, ratio: 0.04 };

  const tune = (el) => {
    const w = el.getBoundingClientRect().width;
    if (!w) return;
    const min = Number(el.dataset.garyRadiusMin) || DEFAULTS.min;
    const max = Number(el.dataset.garyRadiusMax) || DEFAULTS.max;
    const ratio = Number(el.dataset.garyRadiusRatio) || DEFAULTS.ratio;
    el.style.setProperty('--gary-radius-card', Math.round(Math.min(max, Math.max(min, w * ratio))) + 'px');
  };

  const boot = () => {
    const targets = new Set();
    document.querySelectorAll('[data-gary-radius="auto"]').forEach((host) => {
      host.querySelectorAll(SURFACES).forEach((el) => targets.add(el));
      if (host.matches(SURFACES)) targets.add(host);
    });
    if (!targets.size) return;
    targets.forEach(tune);
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver((entries) => entries.forEach((e) => tune(e.target)));
      targets.forEach((el) => ro.observe(el));
    } else {
      addEventListener('resize', () => targets.forEach(tune));
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
