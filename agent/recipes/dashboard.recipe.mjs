/**
 * Recipe · dashboard (board shell)
 *
 * Same content model as the other recipes, different rhythm: a board is not an
 * article. Two consecutive blocks of the same tile type sit side by side in a
 * two-column row, so several metric groups / cards / scorecards can share a
 * row instead of stacking one-per-section the way `report` reads.
 * Everything else keeps the ordered flow from content.blocks.
 */
import { createElement as h, Fragment } from 'react';
import { VStack, Grid } from '@astryxdesign/core';
import { SECTIONS, renderSection } from './sections.mjs';

export const id = 'dashboard';

const SUPPORTED = Object.keys(SECTIONS);

/** Types that are allowed to pair up in one row. */
const TILE_TYPES = new Set(['metric', 'card', 'scorecard', 'device', 'image']);

export function render(content) {
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];
  if (blocks.length === 0) {
    throw new Error('dashboard: content.blocks 为空或缺失，无法渲染');
  }

  const rows = [];
  for (const b of blocks) {
    const type = String(b.type || '');
    if (!SECTIONS[type]) {
      throw new Error(
        `dashboard: 未知区块类型 type="${type}"（支持: ${SUPPORTED.join(', ')}）`
      );
    }
    const last = rows[rows.length - 1];
    if (TILE_TYPES.has(type) && last && last.type === type && last.items.length === 1) {
      last.items.push(b);
    } else {
      rows.push({ type, items: [b] });
    }
  }

  return h(
    VStack,
    { gap: 6, width: '100%' },
    rows.map((row, i) =>
      h(
        Fragment,
        { key: `row${i}` },
        row.items.length === 2
          ? h(
              Grid,
              { columns: 2, gap: 4, width: '100%', align: 'stretch' },
              row.items.map((b, j) =>
                h(
                  'div',
                  { key: b.id || `t${i}-${j}` },
                  renderSection(b, { cols: 2 })
                )
              )
            )
          : renderSection(row.items[0], {})
      )
    )
  );
}

export default { id, render };
