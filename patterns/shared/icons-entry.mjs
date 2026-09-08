// Local Lucide subset shared by the Portal and copyable HTML templates.
import { createElement, Sun, Moon, Play, Pause, RotateCcw, ArrowUpRight, ArrowLeft, Copy, Check, X, Menu, SlidersHorizontal, Heart, UserPlus, UserCheck, Ellipsis, Save, FilterX, ListFilter, Monitor, Minimize, Download, Image, Code } from '../../adapters/visual/node_modules/lucide/dist/esm/lucide.mjs';

const icons = { sun: Sun, moon: Moon, play: Play, pause: Pause, 'rotate-ccw': RotateCcw, 'arrow-up-right': ArrowUpRight, 'arrow-left': ArrowLeft, copy: Copy, check: Check, x: X, menu: Menu, sliders: SlidersHorizontal, heart: Heart, 'user-plus': UserPlus, 'user-check': UserCheck, ellipsis: Ellipsis, save: Save, 'filter-x': FilterX, filter: ListFilter, monitor: Monitor, minimize: Minimize, download: Download, image: Image, code: Code };

function set(element, name, label) {
  if (!element || !icons[name]) return;
  element.dataset.garyIcon = name;
  element.classList.add('gary-icon-button');
  const text = label || element.getAttribute('aria-label') || element.textContent.trim();
  element.setAttribute('aria-label', text);
  element.title = text;
  const fallback = document.createElement('span');
  fallback.className = 'gary-visually-hidden';
  fallback.textContent = text;
  element.replaceChildren(createElement(icons[name], { class: 'gary-icon', 'aria-hidden': 'true', 'stroke-width': 1.6 }), fallback);
}

function render(scope = document) {
  scope.querySelectorAll('[data-gary-icon]').forEach(element => set(element, element.dataset.garyIcon));
}
window.GaryIcons = { set, render };
render();
