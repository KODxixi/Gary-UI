/**
 * Content gate — validates content.json against the block contract, without
 * rendering anything. Reads JSON only: no HTML, no files written, no browser.
 *
 *   node agent/checks/content.mjs <content.json> [more.json ...]
 *
 * Field source of truth: agent/content.schema.md §3.1–3.16.
 * Exit 1 with field-level errors; exit 0 prints `CONTENT OK N blocks`.
 */
import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!files.length) {
  console.error('用法: node agent/checks/content.mjs <content.json> [more.json ...]');
  process.exit(2);
}

// ---- spec primitives -------------------------------------------------------
const str = (req) => ({ t: 'string', req });
const num = (req, coerce) => ({ t: 'number', req, coerce });
const bool = () => ({ t: 'boolean' });
const en = (vals, req) => ({ t: 'enum', vals, req });
const step = (vals, req) => ({ t: 'enum', vals, req }); // numeric enum; "4" and 4 both pass
const arr = (min, max, of, req) => ({ t: 'array', min, max, of, req });
const obj = (fields, req) => ({ t: 'object', fields, req });

const SURFACE = en(['default', 'sunken', 'inverse']);
// metric/timeline item tone: schema says accent/success/warning/error/neutral,
// Metric() also reads good/warn/bad (delta tones). Accept the union so the gate
// never fails content the renderer accepts.
const ITEM_TONE = en(['accent', 'success', 'warning', 'error', 'neutral', 'good', 'warn', 'bad']);
const SEMANTIC = ['info', 'success', 'warning', 'error',
  // Callout() 的容错别名（TONE_TO_STATUS）：渲染器接受这些写法，闸就必须放行
  'warn', 'caution', 'danger', 'critical', 'bad'];
const DENSITY = en(['compact', 'balanced', 'spacious']);
const DIVIDERS = en(['rows', 'columns', 'grid', 'none']);

// ---- block specs (schema §3) ----------------------------------------------
const BLOCKS = {
  heading: obj({
    title: str(true),
    eyebrow: str(),
    badge: str(),
    sub: str(),
    level: en([1, 2]),
    tone: SURFACE,
  }),
  cover: obj({
    title: str(true),
    eyebrow: str(),
    badge: str(),
    sub: str(),
    meta: arr(1, 8, obj({ k: str(true), v: str(true) })),
    tone: SURFACE,
  }),
  prose: obj({
    items: arr(1, 8, obj({ n: str(), title: str(), paras: arr(1, 6, str(), true) }), true),
    tone: SURFACE,
  }),
  text: obj({
    paras: arr(1, 6, str(), true),
    note: str(),
    size: en(['body', 'large']),
    tone: SURFACE,
  }),
  metric: obj({
    items: arr(
      1,
      5,
      obj({
        label: str(true),
        value: str(true),
        unit: str(),
        hint: str(),
        delta: str(),
        trend: en(['up', 'down', 'flat']),
        tone: ITEM_TONE,
      }),
      true
    ),
    title: str(),
    note: str(),
    tone: SURFACE,
  }),
  card: obj({
    title: str(true),
    eyebrow: str(),
    sub: str(),
    body: arr(0, 4, str()),
    badge: str(),
    tag: str(),
    note: str(),
    padding: en([0, 1, 2, 3, 4, 5, 6, 8]),
    variant: en(['default', 'muted', 'transparent']),
    elevation: en(['none', 'low', 'med', 'high']),
    tone: SURFACE,
  }),
  table: obj({
    columns: arr(2, 7, obj({ label: str(true), num: bool() }), true),
    rows: arr(1, 40, arr(0, 40, str()), true),
    foot: arr(0, 40, str()),
    title: str(),
    note: str(),
    density: DENSITY,
    dividers: DIVIDERS,
    tone: SURFACE,
  }),
  badge: obj({
    items: arr(
      1,
      6,
      obj({
        label: str(true),
        variant: en([
          'neutral', 'info', 'success', 'warning', 'error', 'blue', 'cyan', 'green',
          'orange', 'pink', 'purple', 'red', 'teal', 'yellow',
        ]),
        dot: bool(),
      }),
      true
    ),
    align: en(['start', 'center', 'end']),
    tone: SURFACE,
  }),
  callout: obj({
    // Surface tones are also legal here: Callout() renders any of them as a
    // plain surface card before it ever reaches Banner.status (demo-report
    // uses tone="sunken"). `danger` is not a legal value — it maps to error.
    tone: en([...SEMANTIC, ...SURFACE.vals], true),
    title: str(true),
    body: str(),
    text: str(), // legacy alias for body (Callout reads body ?? text)
    eyebrow: str(),
    action: obj({ label: str() }),
  }),
  divider: obj({
    label: str(),
    variant: en(['subtle', 'strong']),
    spacing: step([2, 3, 4, 5, 6]),
    tone: SURFACE,
  }),
  timeline: obj({
    items: arr(
      2,
      10,
      obj({
        date: str(true),
        title: str(true),
        text: str(),
        tone: en(['accent', 'success', 'warning', 'error', 'info']),
      }),
      true
    ),
    title: str(),
    tone: SURFACE,
  }),
  device: obj({
    kind: en(['phone', 'laptop'], true),
    src: str(true),
    alt: str(true),
    caption: str(),
    align: en(['start', 'center']),
    tone: SURFACE,
  }),
  scorecard: obj({
    items: arr(2, 8, obj({
      label: str(true),
      score: num(true, true),
      max: num(true, true),
      state: en(['good', 'warn', 'bad']),
    }), true),
    title: str(),
    note: str(),
    density: en(['compact', 'normal']),
    tone: SURFACE,
  }),
  matrix: obj({
    columns: arr(1, 6, obj({ key: str(true), label: str(true), num: bool() }), true),
    rows: arr(1, 12, obj({ label: str(true), cells: obj(null, true) }), true),
    labelHeader: str(),
    title: str(),
    note: str(),
    density: DENSITY,
    dividers: DIVIDERS,
    tone: SURFACE,
  }),
  image: obj({
    src: str(true),
    alt: str(true),
    caption: str(),
    ratio: en(['16:9', '4:3', '3:2', '1:1', '21:9', 'auto']),
    align: en(['start', 'center']),
    tone: SURFACE,
  }),
  steps: obj({
    items: arr(3, 5, obj({ title: str(true), text: str() }), true),
    active: num(),
    title: str(),
    note: str(),
    tone: SURFACE,
  }),
  quote: obj({
    text: str(true),
    source: str(),
    eyebrow: str(),
    tone: en(['accent', 'success', 'warning', 'error', 'info']),
  }),
  grid: obj({
    cols: en([2, 3, 4], true),
    gap: step([2, 3, 4, 5, 6]),
    children: { t: 'blocks', min: 2, max: 6, req: true },
    tone: SURFACE,
  }),
};
BLOCKS.header = BLOCKS.heading; // legacy alias

// ---- validation ------------------------------------------------------------
const TYPE_LABEL = { string: 'string', number: 'number', boolean: 'boolean', enum: 'enum', array: 'array', object: 'object', blocks: 'block[]' };
const kind = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);
const isObj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

function checkValue(value, spec, at, out, file) {
  switch (spec.t) {
    case 'string':
      if (typeof value !== 'string') out.push(`${at} 必须是 string，给了 ${kind(value)}`);
      break;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        // 渲染器对 scorecard.score 用 Number() 兜底，数字字符串能转 —— 闸比渲染器严就是假红
        if (!(spec.coerce && typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)))) {
          out.push(`${at} 必须是 number，给了 ${kind(value)}`);
        }
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') out.push(`${at} 必须是 boolean，给了 ${kind(value)}`);
      break;
    case 'enum':
      if (!spec.vals.map(String).includes(String(value))) {
        out.push(`${at}=${JSON.stringify(value)} 非法，合法值: ${spec.vals.join('/')}`);
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        out.push(`${at} 必须是 array，给了 ${kind(value)}`);
        break;
      }
      if (spec.min != null && (value.length < spec.min || value.length > spec.max)) {
        out.push(`${at} ${spec.min}–${spec.max} 项，给了 ${value.length} 项`);
        break;
      }
      if (spec.of) value.forEach((v, i) => checkValue(v, spec.of, `${at}[${i}]`, out, file));
      break;
    case 'object':
      if (!isObj(value)) {
        out.push(`${at} 必须是 object，给了 ${kind(value)}`);
        break;
      }
      if (spec.fields) walkObject(value, spec.fields, at, out, file); // fields=null -> free-form
      break;
    case 'blocks':
      if (!Array.isArray(value)) {
        out.push(`${at} 必须是 array，给了 ${kind(value)}`);
        break;
      }
      if (value.length < spec.min || value.length > spec.max) {
        out.push(`${at} ${spec.min}–${spec.max} 个 block，给了 ${value.length} 个`);
        break;
      }
      value.forEach((child, i) => checkBlock(child, `${at}[${i}]`, out, file));
      break;
  }
}

function walkObject(o, fields, at, out, file) {
  for (const [name, spec] of Object.entries(fields)) {
    if (!(name in o) || o[name] === undefined) {
      if (spec.req) {
        const suffix = spec.t === 'array' || spec.t === 'blocks' ? '[]' : '';
        out.push(`${at} 缺必填字段 ${name}${suffix}（${TYPE_LABEL[spec.t] || spec.t}）`);
      }
      continue;
    }
    checkValue(o[name], spec, `${at}.${name}`, out, file);
  }
  const legal = Object.keys(fields || {});
  // 空字段表 = 键是动态的（matrix.cells 按 columns[].key 取值），由专段校验，这里不判未知字段
  if (legal.length > 0) for (const k of Object.keys(o)) {
    if (!(k in fields)) {
      // mirror the sample: unknown props print without the "props." prefix
      const where = at === 'props' ? '' : `${at} `;
      out.push(`${where}未知字段 "${k}"，合法字段: ${legal.join(', ')}`);
    }
  }
}

// ── chart / flow：10 种类型的每个数组参数在渲染器里都有默认值 `= []`，
// 缺了不抛错、只画一张空图，四道闸全绿。所以静默绿只能在这一层挡。
// 只查必填与形状，不查未知字段（unit/digits/note/annotations 等可选字段自由）。
const CHART_SHAPES = {
  bar: { req: ['categories', 'series'], kind: 'series' },
  'grouped-bar': { req: ['categories', 'series'], kind: 'series' },
  line: { req: ['categories', 'series'], kind: 'series' },
  stacked: { req: ['rows'], kind: 'stacked' },
  donut: { req: ['items'], kind: 'donut' },
  progress: { req: ['rows'], kind: 'progress' },
  sparkline: { req: ['kpi'], kind: 'kpi' },
};
const FLOW_SHAPES = { linear: ['nodes'], branch: ['nodes'], swimlane: ['lanes', 'nodes'] };

function checkViz(p, err) {
  const isChart = typeof p.chart === 'string';
  const isFlow = typeof p.flow === 'string';
  if (isChart === isFlow) return err('props 必须有且只有一个 chart 或 flow 字段（string）');
  // sparkline 走 KpiTile，签名里没有 title/source/status —— 它的标签在 kpi.label 里
  if (p.chart !== 'sparkline') {
    for (const k of ['title', 'source', 'status']) {
      if (typeof p[k] !== 'string' || !p[k].trim()) return err(`props 缺必填字段 ${k}（string）`);
    }
    // 数据身份红线：不许把示例/推算当实测。前缀取自 examples 的实际取值全集。
    if (!/^(仓库)?(示例数据|示意数据|实测|推算|实现现状)/.test(p.status)) {
      return err(`status="${p.status}" 必须以 实测/推算/示例数据/示意数据/实现现状 之一开头（可加「仓库」前缀）`);
    }
  }

  if (isFlow) {
    const req = FLOW_SHAPES[p.flow];
    if (!req) return err(`flow="${p.flow}" 非法，合法值: ${Object.keys(FLOW_SHAPES).join('/')}`);
    for (const k of [...req, 'edges']) {
      if (!Array.isArray(p[k]) || !p[k].length) return err(`flow="${p.flow}" 缺必填字段 ${k}（非空 array）`);
    }
    return;
  }

  const shape = CHART_SHAPES[p.chart];
  if (!shape) return err(`chart="${p.chart}" 非法，合法值: ${Object.keys(CHART_SHAPES).join('/')}`);
  for (const k of shape.req) if (!(k in p)) return err(`chart="${p.chart}" 缺必填字段 ${k}`);

  if (shape.kind === 'series') {
    if (!Array.isArray(p.categories) || !p.categories.length) return err('categories 必须是非空 array');
    if (!Array.isArray(p.series) || !p.series.length) return err('series 必须是非空 array');
    for (let i = 0; i < p.series.length; i++) {
      const s = p.series[i];
      if (!isObj(s)) return err(`series[${i}] 必须是 object`);
      if (typeof s.name !== 'string') return err(`series[${i}].name 必填（string）`);
      if (!Array.isArray(s.values)) return err(`series[${i}].values 必填（array）`);
      if (s.values.length !== p.categories.length) {
        return err(`series[${i}].values ${s.values.length} 项，categories ${p.categories.length} 项，必须等长`);
      }
      // 渲染器用 Number.isFinite(v) ? v : 0 —— 字符串 "12" 不通过，静默画成 0，四闸全绿
      for (let j = 0; j < s.values.length; j++) {
        if (typeof s.values[j] !== 'number' || !Number.isFinite(s.values[j])) {
          return err(`series[${i}].values[${j}] 必须是 number（写字符串会被静默画成 0），给了 ${JSON.stringify(s.values[j])}`);
        }
      }
    }
  }

  if (shape.kind === 'stacked' || shape.kind === 'progress') {
    if (!Array.isArray(p.rows) || !p.rows.length) return err('rows 必须是非空 array');
    for (let i = 0; i < p.rows.length; i++) {
      const r = p.rows[i];
      if (!isObj(r)) return err(`rows[${i}] 必须是 object`);
      if (typeof r.label !== 'string') return err(`rows[${i}].label 必填（string）`);
      if (shape.kind === 'stacked') {
        if (!Array.isArray(r.parts)) return err(`rows[${i}].parts 必填——stacked 用 rows[].parts，不是 series`);
        for (let j = 0; j < r.parts.length; j++) {
          const pt = r.parts[j];
          if (!isObj(pt)) return err(`rows[${i}].parts[${j}] 必须是 object`);
          if (typeof pt.value !== 'number' || !Number.isFinite(pt.value)) {
            return err(`rows[${i}].parts[${j}].value 必须是 number（写字符串会被静默画成 0），给了 ${JSON.stringify(pt.value)}`);
          }
        }
      }
      if (shape.kind === 'progress' && typeof r.value !== 'number') return err(`rows[${i}].value 必填（number）`);
    }
  }

  if (shape.kind === 'donut') {
    if (!Array.isArray(p.items) || !p.items.length) return err('items 必须是非空 array——donut 用 items，不是 series');
    for (let i = 0; i < p.items.length; i++) {
      const it = p.items[i];
      if (!isObj(it)) return err(`items[${i}] 必须是 object`);
      if (typeof it.name !== 'string') return err(`items[${i}].name 必填（string）`);
      if (typeof it.value !== 'number') return err(`items[${i}].value 必填（number）`);
    }
  }

  if (shape.kind === 'kpi') {
    if (!isObj(p.kpi)) return err('kpi 必须是 object——sparkline 用 kpi{label,value,categories,values}，不是平铺');
    for (const k of ['label', 'value']) if (!(k in p.kpi)) return err(`kpi.${k} 必填`);
    for (const k of ['categories', 'values']) {
      if (!Array.isArray(p.kpi[k])) return err(`kpi.${k} 必填（array）`);
    }
    for (let j = 0; j < p.kpi.values.length; j++) {
      if (typeof p.kpi.values[j] !== 'number' || !Number.isFinite(p.kpi.values[j])) {
        return err(`kpi.values[${j}] 必须是 number（写字符串会静默画成 0），给了 ${JSON.stringify(p.kpi.values[j])}`);
      }
    }
  }

  // 标注：三种形状各不相同，写错渲染器静默丢掉整条（charts.mjs 只认下面这些键）
  if (p.annotations !== undefined) {
    if (!Array.isArray(p.annotations)) return err('annotations 必须是 array');
    for (let i = 0; i < p.annotations.length; i++) {
      const a = p.annotations[i];
      if (!isObj(a)) return err(`annotations[${i}] 必须是 object`);
      if (a.type === 'reference') {
        if (typeof a.value !== 'number' || !Number.isFinite(a.value))
          return err(`annotations[${i}] type=reference 要 value(number)，给了 ${JSON.stringify(a.value)}`);
      } else if (a.type === 'band') {
        for (const k of ['start', 'end']) {
          if (typeof a[k] !== 'string') return err(`annotations[${i}] type=band 要 ${k}(string)，取 categories 里的原字符串`);
        }
      } else if (a.type === 'anchor') {
        if (typeof a.target !== 'string') return err(`annotations[${i}] type=anchor 要 target(string)，取 categories 里的原字符串`);
      } else {
        return err(`annotations[${i}].type=${JSON.stringify(a.type)} 非法，合法值: reference/band/anchor`);
      }
      if (a.text !== undefined && typeof a.text !== 'string') return err(`annotations[${i}].text 必须是 string`);
    }
  }
}

function checkBlock(block, at, out, file) {
  const type = isObj(block) ? block.type : undefined;
  const label = `${at} (type=${type ?? '?'})`.padEnd(30);
  const err = (msg) => out.push(label + msg);

  if (!isObj(block)) return err(`必须是 object，给了 ${kind(block)}`);
  if (typeof type !== 'string') return err('缺必填字段 type（string）');
  if (type === 'chart' || type === 'flow') {
    if (!('props' in block)) return err('缺必填字段 props（object）');
    if (!isObj(block.props)) return err('props 必须是 object');
    return checkViz(block.props, err);
  }
  const spec = BLOCKS[type];
  if (!spec) return err(`未知 type="${type}"，支持: ${Object.keys(BLOCKS).join(', ')}`);
  if (!('props' in block)) return err('缺必填字段 props（object）');

  const local = [];
  checkValue(block.props, spec, `props`, local, file);
  const p = isObj(block.props) ? block.props : {};

  // cross-field checks the generic table cannot express
  if (type === 'table') {
    if (Array.isArray(p.columns) && Array.isArray(p.rows)) {
      p.rows.forEach((row, i) => {
        if (Array.isArray(row) && row.length !== p.columns.length) {
          local.push(`props.rows[${i}] 有 ${row.length} 格，columns 有 ${p.columns.length} 列（必须等长）`);
        }
      });
    }
    if (Array.isArray(p.foot) && Array.isArray(p.columns) && p.foot.length !== p.columns.length) {
      local.push(`props.foot 有 ${p.foot.length} 格，columns 有 ${p.columns.length} 列（必须等长）`);
    }
  }
  if (type === 'matrix' && Array.isArray(p.rows)) {
    p.rows.forEach((row, i) => {
      if (!isObj(row) || !isObj(row.cells)) return;
      for (const [k, cell] of Object.entries(row.cells)) {
        if (typeof cell === 'string') continue;
        if (!isObj(cell)) {
          local.push(`props.rows[${i}].cells.${k} 必须是 string 或 {value,state}`);
        } else if (typeof cell.value !== 'string') {
          local.push(`props.rows[${i}].cells.${k} 缺必填字段 value（string）`);
        } else if ('state' in cell && !['good', 'warn', 'bad'].includes(cell.state)) {
          local.push(`props.rows[${i}].cells.${k}.state=${JSON.stringify(cell.state)} 非法，合法值: good/warn/bad`);
        }
      }
    });
  }
  if ((type === 'image' || type === 'device') && typeof p.src === 'string' && !/^(data:|https?:)/i.test(p.src)) {
    if (!fs.existsSync(path.resolve(process.cwd(), p.src))) {
      local.push(`src 指向的文件不存在: ${p.src}`);
    }
  }

  local.forEach(err);
}

// ---- run -------------------------------------------------------------------
let failed = 0;
for (const file of files) {
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`${file} 解析失败: ${e.message}`);
    failed = 1;
    continue;
  }
  const errors = [];
  // meta 不校验的代价：recipe 写错要到 render 才炸（0.2s → 2s，且报错在另一个文件）
  const meta = doc.meta;
  if (meta !== undefined) {
    if (!isObj(meta)) {
      errors.push('顶层 meta 必须是 object');
    } else {
      // viz 是 viz/render-viz.mjs 的路由标记（agent/render.mjs 不认，会自己报清楚）
      if (meta.recipe !== undefined && !['report', 'table', 'dashboard', 'landing', 'viz'].includes(meta.recipe)) {
        errors.push(`meta.recipe="${meta.recipe}" 非法，合法值: report/table/dashboard/landing/viz`);
      }
      // 写 "Dark" 不会报错，只会静默渲染成亮色 —— 这类只有校验能拦
      if (meta.theme !== undefined && !['light', 'dark'].includes(meta.theme)) {
        errors.push(`meta.theme=${JSON.stringify(meta.theme)} 非法，合法值: light/dark`);
      }
      if (meta.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
        errors.push(`meta.date 必须是 YYYY-MM-DD，给了 ${JSON.stringify(meta.date)}`);
      }
    }
  }
  if (!Array.isArray(doc.blocks)) {
    errors.push('顶层 缺必填字段 blocks[]（array）');
  } else if (doc.blocks.length < 1 || doc.blocks.length > 24) {
    errors.push(`blocks 1–24 块，给了 ${doc.blocks.length} 块`);
  } else {
    doc.blocks.forEach((b, i) => checkBlock(b, `blocks[${i}]`, errors, file));
  }

  if (errors.length) {
    for (const e of errors) console.error(e);
    console.error(`\n${file}: ${errors.length} 个错误`);
    failed = 1;
  } else {
    console.log(`CONTENT OK ${doc.blocks.length} blocks  ${file}`);
  }
}

process.exit(failed);