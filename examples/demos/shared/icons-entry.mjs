import { createElement, Sun, Moon, Play, Pause, RotateCcw, ArrowUpRight, ArrowDown, Printer, X, Menu } from '../../../adapters/visual/node_modules/lucide/dist/esm/lucide.mjs';
const icons = { sun:Sun, moon:Moon, play:Play, pause:Pause, 'rotate-ccw':RotateCcw, 'arrow-up-right':ArrowUpRight, 'arrow-down':ArrowDown, printer:Printer, x:X, menu:Menu };
window.GaryDemoIcons = (scope=document) => scope.querySelectorAll('[data-icon]').forEach(el => {
  const icon = icons[el.dataset.icon];
  if (!icon) return;
  const svg = createElement(icon, { class:'icon', 'aria-hidden':'true', 'stroke-width':1.6 });
  el.replaceChildren(svg);
});
window.GaryDemoIcons();
