/* Page wiring only: policy, domain inputs and SVG recipes remain separate. */
(() => {
  'use strict';
  const base = document.currentScript.src, print = matchMedia('print');
  const selected = new Map(), charts = new Map();
  let policy, cases;
  const theme = () => print.matches || document.documentElement.dataset.garyTheme === 'light' ? 'light' : 'dark';
  const read = async path => {
    const response = await fetch(new URL(path, base));
    if (!response.ok) throw new Error(`无法载入图表规则：${response.status} ${path}`);
    return response.json();
  };
  const ready = Promise.all([read('../../spec/chart-recipes.json'), read('cases.json')]).then(([rules, inputs]) => {
    policy = rules; cases = inputs.types;
  });
  const setText = (selector, text) => { const node = document.querySelector(selector); if (node) node.textContent = text; };
  function setCase(type, id) {
    const item = cases[type]?.find(item => item.id === id);
    if (!item) throw new Error(`未知图表示例：${type}/${id}`);
    // Build both before replacement, so invalid input cannot leave a mixed result.
    const svg = GaryChartRecipes.render(type, item.config, { theme: theme(), policy });
    const table = GaryChartRecipes.table(type, item.config);
    charts.get(type).replaceChildren(svg);
    document.querySelector(`[data-study-table="${type}"]`).replaceChildren(table);
    for (const field of ['question', 'rationale', 'takeaway']) setText(`[data-case-${field}="${type}"]`, item[field]);
    setText(`[data-case-source="${type}"]`, JSON.stringify(item.config, null, 2));
    document.querySelector(`[data-case-select="${type}"]`).value = id;
    selected.set(type, item);
    return svg;
  }
  function showError(error) {
    document.querySelector('#page-status').textContent = `此次图表未更新，保留上一组有效内容。${error.message}`;
    console.error(error);
  }
  function refresh() { selected.forEach((item, type) => setCase(type, item.id)); colors(); }
  function colors() {
    const host = document.querySelector('[data-palette-gallery]'), c = policy.themes[theme()];
    const luminance = hex => hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
    const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
    host.replaceChildren();
    const examples = {
      categorical: { title: '不同对象保持各自身份', note: '演示：每个对象都有固定编号和直接标签。排序或换图时，编号与颜色一起保留。', labels: ['甲','乙','丙','丁','戊','己','庚','辛'], values: [34,68,52,86,41,74,59,45] },
      sequential: { title: '同一个量，沿亮度读高低', note: '演示：负荷指数 10–70，等间距七级；数字始终可读。缺测另标，不混入最低一级。', labels: ['10','20','30','40','50','60','70'] },
      diverging: { title: '相对基准，两侧都有含义', note: '演示：相对基准的分数差 −30 至 +30，零在中心；蓝与陶色表示两侧，不代表好坏。', labels: ['−30','−20','−10','0','+10','+20','+30'] }
    };
    Object.entries(policy.colorSystem.palettes).forEach(([key, palette]) => {
      const example = examples[palette.kind], article = document.createElement('article'); article.className = 'palette-card'; article.dataset.palette = key;
      const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = palette.label;
      const heading = document.createElement('h3'); heading.textContent = example.title;
      const figure = document.createElement('div'); figure.className = `palette-samples ${palette.kind}`;
      palette.roles.forEach((role, i) => {
        const cell = document.createElement('div'); cell.className = 'palette-sample';
        const mark = document.createElement('span'); mark.className = 'palette-mark'; mark.style.backgroundColor = c[role]; mark.dataset.colorRole = role;
        const fg = policy.colorSystem.labelOnFill.candidates.map(role => c[role]).sort((a, b) => contrast(b, c[role]) - contrast(a, c[role]))[0]; mark.style.color = fg;
        if (palette.kind === 'categorical') { mark.style.height = `${example.values[i]}px`; mark.textContent = example.values[i]; }
        else mark.textContent = example.labels[i];
        const label = document.createElement('span'); label.className = 'palette-caption'; label.textContent = palette.kind === 'categorical' ? `${i+1} · ${example.labels[i]}` : String(i+1);
        const code = document.createElement('code'); code.textContent = c[role];
        cell.append(mark, label, code); figure.append(cell);
      });
      const note = document.createElement('p'); note.className = 'palette-note'; note.textContent = example.note + (key === 'categorical8' ? ' 八色仅作容量扩展；密集比较优先拆小多图。' : '');
      article.append(eyebrow, heading, figure, note); host.append(article);
    });
    const states = document.querySelector('[data-state-palette]'); states.replaceChildren();
    Object.entries(policy.colorSystem.semanticStates).forEach(([key, state]) => {
      const tag = document.createElement('span'); tag.style.color = c[state.role];
      const icon = document.createElement('span'); icon.className = 'status-sign'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = { info:'i', positive:'✓', caution:'!', critical:'×', unknown:'?' }[key];
      tag.append(icon, document.createTextNode(state.label)); states.append(tag);
    });
  }
  function catalog() {
    const table = document.createElement('table');
    table.createCaption().textContent = '17 类表达规范 · 详细准入与禁用条件见完整规范';
    const head = table.createTHead().insertRow(), labels = ['图型', '回答的问题', '配色规则', '实现入口'];
    labels.forEach(label => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; head.append(th); });
    const body = table.createTBody();
    policy.families.forEach(family => {
      const row = body.insertRow();
      const route = family.engine.startsWith('svg-reference:') ? '本页 SVG 参考' : family.id === 'table' ? '原生 HTML 表格' : '既有图表工具';
      [family.label, family.question, policy.colorSystem.familyMapping[family.id].rule, route].forEach((value, i) => {
        const cell = document.createElement(i === 0 ? 'th' : 'td');
        cell.textContent = value; cell.dataset.label = labels[i]; if (i === 0) cell.scope = 'row'; row.append(cell);
      });
    });
    document.querySelector('[data-recipe-catalog]').replaceChildren(table);
  }
  async function mount() {
    await ready;
    document.querySelectorAll('[data-study-chart]').forEach(host => {
      const type = host.dataset.studyChart, select = document.querySelector(`[data-case-select="${type}"]`);
      charts.set(type, host);
      select.replaceChildren(...cases[type].map(item => new Option(item.label, item.id)));
      select.addEventListener('change', () => {
        try { setCase(type, select.value); setText('#page-status', '已切换内容 · 图形、数值表与导出使用同一组输入'); }
        catch (error) { select.value = selected.get(type).id; showError(error); }
      });
      setCase(type, cases[type][0].id);
    });
    catalog(); colors();
    addEventListener('gary-theme-change', () => { try { refresh(); } catch (error) { showError(error); } });
    print.addEventListener('change', () => { try { refresh(); } catch (error) { showError(error); } });
  }
  function exportSvg(type) {
    const item = selected.get(type);
    if (!item) throw new Error('图形尚未准备好。');
    const svg = GaryChartRecipes.render(type, item.config, { theme: theme(), policy });
    svg.removeAttribute('style');
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `gary-${type}-${item.id}-${theme()}.svg`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.Gary0909Charts = { mount, setCase, exportSvg, ready, selected, charts, get policy() { return policy; }, get cases() { return cases; } };
})();
