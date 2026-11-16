/* Original Gary-UI chart recipes. Fixed teaching data; local Apache ECharts. */
(() => {
  'use strict';
  const dataURL = new URL('data.json', document.currentScript.src);
  const charts = new Map();
  const api = window.GaryVisualCharts = { charts, data: null, ready: null, errors: [] };
  const query = selector => document.querySelector(selector);
  const sum = values => values.reduce((total, value) => total + value, 0);
  const signed = value => value > 0 ? `+${value}` : String(value);
  const status = message => {
    document.querySelectorAll('[data-chart-status]').forEach(node => {
      node.setAttribute('role', 'status');
      node.textContent = message;
    });
  };

  function validate(data) {
    if (data.regions.length !== 4 || data.monthly.labels.length !== 6 ||
        data.monthly.actual.length !== 6 || data.monthly.target.length !== 6 ||
        data.monthly.actual.filter(value => value === null).length !== 1 ||
        data.regions.some(row => ![row.revenue, row.target, row.cycleDays, row.completion, ...row.composition].every(Number.isFinite) ||
          row.revenue < 0 || row.target <= 0 || row.cycleDays < 0 || row.completion < 0 || row.completion > 100 ||
          row.composition.length !== 3 || row.composition.some(value => value < 0) || sum(row.composition) !== 100) ||
        data.monthly.actual.some(value => value !== null && (!Number.isFinite(value) || value < 0)) ||
        data.monthly.target.some(value => !Number.isFinite(value) || value < 0) ||
        data.waterfall.changes.some(row => !Number.isFinite(row.value)) ||
        sum(data.regions.map(row => row.revenue)) !== data.waterfall.total ||
        sum(data.regions.map(row => row.target)) !== data.waterfall.base ||
        data.waterfall.base + sum(data.waterfall.changes.map(row => row.value)) !== data.waterfall.total ||
        data.monthly.actual.at(-1) !== data.waterfall.total || data.monthly.target.at(-1) !== data.waterfall.base) {
      throw new Error('示例数据口径校验失败，已停止绘图。');
    }
  }

  function cell(tag, value, label) {
    const node = document.createElement(tag);
    node.textContent = value;
    if (tag === 'th') node.scope = 'row';
    if (label) node.dataset.label = label;
    return node;
  }

  function makeTable(id, caption, headers, rows) {
    const host = query(`[data-chart-table="${id}"]`);
    if (!host) return;
    const table = document.createElement('table');
    table.className = 'analysis-data-table';
    table.createCaption().textContent = caption;
    const heading = table.createTHead().insertRow();
    headers.forEach(label => {
      const th = cell('th', label);
      th.scope = 'col';
      heading.append(th);
    });
    const body = table.createTBody();
    rows.forEach(values => {
      const row = body.insertRow();
      values.forEach((value, index) => row.append(cell(index === 0 ? 'th' : 'td', value, headers[index])));
    });
    host.replaceChildren(table);
  }

  function renderTables(data) {
    const { regions, monthly, waterfall, compositionLabels } = data;
    makeTable('trend', '月度营收；人工样本，单位：万元', ['月份', '实际（万元）', '目标（万元）'],
      monthly.labels.map((label, index) => [label, monthly.actual[index] ?? '缺测', monthly.target[index]]));
    makeTable('ranking', '各区营收与目标；人工样本，单位：万元', ['区域', '营收（万元）', '目标（万元）'],
      regions.map(row => [row.name, row.revenue, row.target]));
    makeTable('scatter', `周期与工作完成率；${data.quadrants.note}`, ['区域', '周期（天）', '工作完成率'],
      regions.map(row => [row.name, row.cycleDays, `${row.completion}%`]));
    makeTable('waterfall', `贡献拆解；单位：万元；${waterfall.note}`, ['项目', '变动或总额（万元）'],
      [['基准', waterfall.base], ...waterfall.changes.map(row => [row.name, signed(row.value)]), ['本期', waterfall.total]]);
    makeTable('composition', data.compositionNote, ['区域', ...compositionLabels.map(label => `${label}（%）`)],
      regions.map(row => [row.name, ...row.composition]));
    const body = query('tbody[data-analysis-rows]');
    if (!body) return;
    body.replaceChildren();
    const labels = ['区域', '营收（万元）', '目标（万元）', '差额（万元）', '工作完成率'];
    const maxRevenue = Math.max(...regions.map(row => row.revenue));
    regions.forEach(item => {
      const row = body.insertRow();
      const values = [item.name, item.revenue, item.target, signed(item.revenue - item.target), `${item.completion}%`];
      values.forEach((value, index) => {
        const node = cell(index === 0 ? 'th' : 'td', value, labels[index]);
        if (index === 1) {
          node.classList.add('revenue-cell');
          const bar = document.createElement('span');
          bar.className = 'table-inline-bar';
          bar.setAttribute('aria-hidden', 'true');
          bar.style.setProperty('--bar-width', `${item.revenue / maxRevenue * 100}%`);
          node.append(bar);
        }
        row.append(node);
      });
    });
    const foot = body.closest('table').tFoot || body.closest('table').createTFoot();
    foot.replaceChildren();
    const total = foot.insertRow();
    ['合计', sum(regions.map(row => row.revenue)), sum(regions.map(row => row.target)),
      signed(sum(regions.map(row => row.revenue - row.target))), '不汇总'].forEach((value, index) => {
      total.append(cell(index === 0 ? 'th' : 'td', value, labels[index]));
    });
  }

  function options(data) {
    const theme = document.documentElement.dataset.garyTheme === 'light' ? 'light' : 'dark';
    const policy = window.GARY_DEMO_CHART_POLICY;
    const color = policy.themes[theme];
    const accent = color.accent;
    const target = policy.palettes[theme][1];
    const middle = theme === 'light' ? '#626c79' : '#8d96a5';
    const faint = theme === 'light' ? '#cbd0d7' : '#444c59';
    const common = {
      animation: false,
      backgroundColor: color.background,
      textStyle: { fontFamily: policy.fontFamily, color: color.text, fontSize: 12 },
      aria: { enabled: true },
      tooltip: { confine: true, renderMode: 'richText', backgroundColor: color.surface,
        borderColor: color.border, textStyle: { color: color.text, fontFamily: policy.fontFamily } },
      grid: { top: 36, right: 24, bottom: 32, left: 12, containLabel: true }
    };
    const valueAxis = unit => ({ type: 'value', min: 0, name: unit, nameTextStyle: { color: color.muted, padding: [0, 0, 0, 24] },
      axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: color.muted },
      splitNumber: 3, splitLine: { lineStyle: { color: color.grid, type: 'dashed' } } });
    const categoryAxis = labels => ({ type: 'category', data: labels, axisLine: { show: false },
      axisTick: { show: false }, axisLabel: { color: color.muted, margin: 12, interval: 0 }, splitLine: { show: false } });
    const { monthly, regions, waterfall } = data;
    const ranked = [...regions].sort((a, b) => b.revenue - a.revenue);
    const bases = [0], magnitudes = [waterfall.base], labels = ['基准'], deltas = [waterfall.base];
    let running = waterfall.base;
    waterfall.changes.forEach(change => {
      bases.push(Math.min(running, running + change.value));
      magnitudes.push(Math.abs(change.value));
      labels.push(change.name);
      deltas.push(change.value);
      running += change.value;
    });
    bases.push(0); magnitudes.push(waterfall.total); labels.push('本期'); deltas.push(waterfall.total);
    return {
      trend: {
        ...common,
        legend: { top: 0, right: 16, itemWidth: 20, itemHeight: 7, textStyle: { color: color.muted }, data: ['实际', '目标'] },
        aria: { enabled: true, description: '月度营收趋势。5月缺测且折线断开。8月实际128万元，目标120万元。原始数据见下方表格。' },
        tooltip: { ...common.tooltip, trigger: 'axis', formatter: params => {
          const index = params[0]?.dataIndex;
          return index == null ? '' : `${monthly.labels[index]}\n实际：${monthly.actual[index] ?? '缺测'}${monthly.actual[index] === null ? '' : ' 万元'}\n目标：${monthly.target[index]} 万元`;
        } },
        xAxis: { ...categoryAxis(monthly.labels), boundaryGap: false },
        yAxis: { ...valueAxis('万元'), max: 150, interval: 50 },
        series: [
          { name: '实际', type: 'line', data: monthly.actual.map((value, index) => index === 0 ? { value, label: { offset: [12, 0] } } : value), connectNulls: false, smooth: false,
            symbol: 'circle', symbolSize: 7, itemStyle: { color: accent }, lineStyle: { width: 2.5 },
            label: { show: true, position: 'top', distance: 10, color: color.text, formatter: '{c}' } },
          { name: '目标', type: 'line', data: monthly.target, symbol: 'none', smooth: false,
            itemStyle: { color: target }, lineStyle: { color: target, type: 'dashed', width: 1.5 } }
        ]
      },
      ranking: {
        ...common,
        legend: { top: 0, right: 16, itemWidth: 12, itemHeight: 7, textStyle: { color: color.muted }, data: ['营收', '目标'] },
        aria: { enabled: true, description: '营收按降序排列，横轴从零开始。蓝色为营收，橙色短线为目标。东区42、南区36、西区28、北区22万元。' },
        tooltip: { ...common.tooltip, trigger: 'axis', formatter: params => {
          const item = ranked[params[0]?.dataIndex];
          return item ? `${item.name}\n营收：${item.revenue} 万元\n目标：${item.target} 万元\n差额：${signed(item.revenue - item.target)} 万元` : '';
        } },
        grid: { ...common.grid, right: 44 },
        xAxis: { ...valueAxis('万元'), nameLocation: 'middle', nameGap: 24, max: 50, interval: 25, axisLabel: { color: color.muted, formatter: '{value}' } },
        yAxis: { ...categoryAxis(ranked.map(row => row.name)), inverse: true },
        series: [
          { name: '营收', type: 'bar', barWidth: 20, data: ranked.map((row, index) => ({ value: row.revenue,
            itemStyle: { color: index === 0 ? accent : middle } })),
            label: { show: true, position: 'right', color: color.text, distance: 9, formatter: '{c}' } },
          { name: '目标', type: 'scatter', symbol: 'rect', symbolSize: [3, 8], symbolOffset: [0, 17], z: 3,
            itemStyle: { color: target, opacity: 1 }, data: ranked.map(row => [row.target, row.name]) }
        ]
      },
      scatter: {
        ...common,
        aria: { enabled: true, description: '横轴为15至35天的周期，纵轴为60%至100%的工作完成率。局部坐标用于比较位置，点大小无额外含义。26天和80%的虚线仅为示例分界，不能当作真实业务策略。' },
        grid: { ...common.grid, top: 48, right: 38, bottom: 40 },
        tooltip: { ...common.tooltip, trigger: 'item', formatter: item => `${item.name}\n周期：${item.value[0]} 天\n工作完成率：${item.value[1]}%` },
        xAxis: { ...valueAxis(''), min: 15, max: 35, interval: 5, name: '', axisLabel: { color: color.muted, formatter: '{value}天' }, splitLine: { show: false } },
        yAxis: { ...valueAxis(''), min: 60, max: 100, interval: 10, axisLabel: { color: color.muted, formatter: '{value}%' } },
        series: [{ type: 'scatter', name: '区域', symbolSize: 13,
          data: regions.map(row => ({ name: row.name, value: [row.cycleDays, row.completion], itemStyle: { color: row.name === '东区' ? accent : middle },
            label: { position: { '东区': 'top', '南区': 'right', '西区': 'left', '北区': 'bottom' }[row.name] } })),
          itemStyle: { opacity: 1 }, label: { show: true, formatter: '{b}', position: 'top', distance: 9, color: color.text },
          markLine: { silent: true, symbol: 'none', lineStyle: { color: target, type: 'dashed', width: 1.5 },
            label: { show: false }, data: [{ xAxis: data.quadrants.cycleDays,
              label: { show: true, formatter: `${data.quadrants.cycleDays}天`, position: 'end', rotate: 0, distance: 8, color: target } }, { yAxis: data.quadrants.completion }] }
        }]
      },
      waterfall: {
        ...common,
        aria: { enabled: true, description: '人工贡献拆解：基准120，新增业务加10，提效加6，延期减5，调整减3，最后128万元。' },
        tooltip: { ...common.tooltip, trigger: 'axis', formatter: params => {
          const index = params[0]?.dataIndex;
          return index == null ? '' : `${labels[index]}\n${index > 0 && index < labels.length - 1 ? signed(deltas[index]) : deltas[index]} 万元`;
        } },
        xAxis: { ...categoryAxis(labels), axisLabel: { color: color.muted, margin: 12, interval: 0, lineHeight: 16,
          formatter: value => value === '新增业务' ? '新增\n业务' : value } },
        yAxis: { ...valueAxis('万元'), max: 160, interval: 40 },
        series: [
          { name: '辅助基底', type: 'bar', stack: 'sum', silent: true, data: bases,
            itemStyle: { color: 'transparent' }, emphasis: { disabled: true }, tooltip: { show: false } },
          { name: '贡献', type: 'bar', stack: 'sum', barMaxWidth: 42,
            data: magnitudes.map((value, index) => ({ value, itemStyle: { color: index === magnitudes.length - 1 || (index > 0 && deltas[index] > 0) ? accent : middle } })),
            label: { show: true, position: 'top', color: color.text, formatter: item =>
              item.dataIndex > 0 && item.dataIndex < labels.length - 1 ? signed(deltas[item.dataIndex]) : String(deltas[item.dataIndex]) } }
        ]
      },
      composition: {
        ...common,
        legend: { top: 0, left: 12, itemWidth: 10, itemHeight: 10, itemGap: 14, textStyle: { color: color.muted }, data: data.compositionLabels },
        aria: { enabled: true, description: '各区任务数量构成，每行合计100%。三个分段分别为已交付、进行中、待处理；每个分段直接标注百分比。' },
        tooltip: { ...common.tooltip, trigger: 'item', formatter: item => `${item.name}\n${item.seriesName}：${item.value}%` },
        xAxis: { ...valueAxis(''), max: 100, interval: 50, splitLine: { show: false }, axisLabel: { color: color.muted, formatter: '{value}%' } },
        yAxis: { ...categoryAxis(regions.map(row => row.name)), inverse: true },
        series: data.compositionLabels.map((name, index) => ({ name, type: 'bar', stack: 'total', barWidth: 28,
          data: regions.map(row => row.composition[index]), itemStyle: { color: [accent, middle, faint][index] },
          label: { show: true, position: 'inside', fontSize: 12, color: theme === 'light' ? (index < 2 ? '#ffffff' : '#221e1b') : (index < 2 ? '#000000' : '#f2f4f7'),
            formatter: '{c}%' } }))
      }
    };
  }

  function draw() {
    if (!api.data || !charts.size) return;
    const next = options(api.data);
    charts.forEach((chart, id) => chart.setOption(next[id], true));
  }

  document.querySelectorAll('[data-export-chart]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.exportChart;
    const chart = charts.get(id);
    try {
      if (!chart) throw new Error('图表尚未就绪，请查看原始数据。');
      const svg = chart.renderToSVGString({ useViewBox: true });
      if (!svg.includes('<svg')) throw new Error('SVG 导出失败。');
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      const theme = document.documentElement.dataset.garyTheme === 'light' ? 'light' : 'dark';
      link.download = `gary-${id}-${theme}.svg`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status('已导出当前主题的 SVG。文件包含原始图形与文字。');
    } catch (error) { status(error.message); }
  }));

  api.ready = (async () => {
    try {
      const response = await fetch(dataURL);
      if (!response.ok) throw new Error(`示例数据加载失败（${response.status}）。`);
      api.data = await response.json();
      validate(api.data);
      renderTables(api.data);
      if (!window.echarts || !window.GARY_DEMO_CHART_POLICY) throw new Error('本地图表引擎未载入，请展开原始数据表。');
      document.querySelectorAll('[data-chart]').forEach(element => {
        charts.set(element.dataset.chart, echarts.init(element, null, { renderer: 'svg' }));
      });
      draw();
      const observer = new ResizeObserver(entries => entries.forEach(entry => {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) charts.get(entry.target.dataset.chart)?.resize();
      }));
      document.querySelectorAll('[data-chart]').forEach(element => observer.observe(element));
      addEventListener('gary-theme-change', draw);
      status('人工设计样本 · 图表已就绪；可展开原始数据并导出当前主题 SVG。');
      return true;
    } catch (error) {
      api.errors.push(error.message);
      status(error.message);
      return false;
    }
  })();
})();
