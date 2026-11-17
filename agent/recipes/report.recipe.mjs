/**
 * Recipe · report (article shell)
 * Block order comes from content.blocks; type is dispatched via SECTIONS.
 */
import { createElement as h, Fragment } from 'react';
import { VStack } from '@astryxdesign/core';
import { SECTIONS, renderSection } from './sections.mjs';

export const id = 'report';

const SUPPORTED = Object.keys(SECTIONS);

export function render(content) {
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];
  if (blocks.length === 0) {
    throw new Error('report: content.blocks 为空或缺失，无法渲染');
  }
  return h(
    VStack,
    // Astryx VStack only emits a gap class for 0-6, 8 and 10 (verified by
    // rendering each value: 7/9/11/12/14 produce no class at all, so the flex
    // gap silently falls back to `normal` = 0). 10 is the widest legal block
    // rhythm = 40px; `gap: 14` from the aesthetic pass had collapsed all
    // section spacing to zero.
    { gap: 10, width: '100%' },
    blocks.map((b, i) =>
      // renderSection applies the block's surface tone (`default|sunken|inverse`).
      h(Fragment, { key: b.id || `b${i}` }, renderSection(b, {}))
    )
  );
}

export default { id, render };
